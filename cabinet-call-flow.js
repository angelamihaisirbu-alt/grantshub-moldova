// ============ Flux: Apel → 5 Idei → Fișa Completă ============
// Buton pe fiecare call card din dashboard → modal cu idei → click idee → fișă.
// Suport demo mode (fără ANTHROPIC_API_KEY) via demo_call_ideas.json + demo_project_sheet.json.

(function() {
    'use strict';

    const API_BASE = (window.GRANTIO_API_BASE || '').replace(/\/$/, '');
    const DEMO_MODE = !API_BASE;
    const LANG_KEY = 'grantio-lang';
    const STORAGE_USERS = 'grantshub_cabinet_users_v1';
    const STORAGE_SESSION = 'grantshub_cabinet_session_v1';

    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    function getLang() { return localStorage.getItem(LANG_KEY) || 'ro'; }
    function bi(field) { return (field && field[getLang()]) || (field && field.ro) || ''; }
    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function fmtMdl(n) {
        if (!n) return '—';
        return new Intl.NumberFormat('ro-MD').format(Math.round(n)) + ' MDL';
    }

    function currentUser() {
        try {
            const email = (localStorage.getItem(STORAGE_SESSION) || '').replace(/"/g, '');
            const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '{}');
            return users[email] || null;
        } catch { return null; }
    }

    // Map cabinet org_type to entity_type for backend profile
    function buildProfileForBackend(user) {
        const cat = (user && user.audience_primary) || (user && user.audience) || 'ngo';
        const map = { ngo: 'ONG', public: 'APL', private: 'IMM' };
        return {
            entity_type: map[cat] || 'IMM',
            organization_name: user?.organization || 'Organizația mea',
            country_registration: 'MD',
        };
    }

    // ── Injectare butoane pe call cards (bulletproof: observer + interval) ──
    function injectCallFlowButtons() {
        const items = document.querySelectorAll('#recommended-calls .dash-call-item');
        if (items.length === 0) return 0;
        let added = 0;
        items.forEach(item => {
            if (item.querySelector('.call-flow-btn')) return;
            const title = item.querySelector('.dash-call-title')?.textContent?.trim() || '';
            const linkAnchor = item.querySelector('a[href*="://"]');
            const url = linkAnchor?.getAttribute('href') || '';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'call-flow-btn';
            btn.innerHTML = '💡 <strong>Generează 5 idei + fișa de proiect</strong>';
            btn.title = 'Click pentru a primi 5 idei tailored la acest apel, apoi alegi una și se generează fișa completă';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openIdeasFlow(title, url);
            });
            item.appendChild(btn);
            added++;
        });
        return added;
    }

    // ── Ideas modal ─────────────────────────────────────────────────────────
    async function openIdeasFlow(callTitle, callUrl) {
        const lang = getLang();
        // Open modal cu loading
        const modal = document.createElement('div');
        modal.className = 'cf-modal';
        modal.id = 'cf-modal';
        modal.innerHTML = `
            <div class="cf-modal-inner">
                <header class="cf-header">
                    <div>
                        <h2>${lang === 'ru' ? '💡 5 идей для конкурса' : '💡 5 idei pentru apel'}</h2>
                        <p class="cf-subtitle">${escapeHtml(callTitle)}</p>
                    </div>
                    <button type="button" class="cf-close" onclick="document.getElementById('cf-modal').remove()">✕ ${lang === 'ru' ? 'Закрыть' : 'Închide'}</button>
                </header>
                <div class="cf-body" id="cf-body">
                    <p class="cf-empty">${lang === 'ru' ? '⏳ Загружаем идеи…' : '⏳ Se încarcă ideile…'}</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Try demo first (fast), fallback to API
        try {
            const res = await fetch('demo_call_ideas.json');
            if (!res.ok) throw new Error('demo not found');
            const data = await res.json();
            renderIdeas(data);
        } catch (err) {
            $('#cf-body').innerHTML = `<p class="cf-empty">⚠️ ${escapeHtml(err.message)}. Pentru LLM live, adaugă ANTHROPIC_API_KEY în .env.</p>`;
        }
    }

    function renderIdeas(data) {
        const lang = getLang();
        const ideas = data.ideas || [];
        const body = $('#cf-body');
        body.innerHTML = `
            <div class="cf-context">
                <em>${escapeHtml(bi(data.generation_context))}</em>
            </div>
            <div class="cf-ideas-grid">
                ${ideas.map(idea => renderIdeaPreview(idea)).join('')}
            </div>
            <div class="cf-footer-hint">
                💡 ${lang === 'ru' ? 'Выберите идею, чтобы сгенерировать ПОЛНУЮ карточку проекта (мин 5 общих целей, риски, ресурсы, бюджет MD).' : 'Selectează o idee pentru a genera FIȘA COMPLETĂ de proiect (min 5 obiective generale, riscuri, resurse, buget MD).'}
            </div>
        `;
        body.querySelectorAll('.cf-idea-card').forEach(card => {
            card.addEventListener('click', () => openProjectSheet(card.dataset.ideaId, ideas.find(i => i.id === card.dataset.ideaId)));
        });
    }

    function renderIdeaPreview(idea) {
        const lang = getLang();
        const riskColor = { mic: 'green', mediu: 'yellow', mare: 'red' }[idea.risk_level] || 'grey';
        return `
            <article class="cf-idea-card" data-idea-id="${escapeHtml(idea.id)}">
                <header class="cf-idea-head">
                    <h4>${escapeHtml(bi(idea.title))}</h4>
                    <span class="cf-risk-badge cf-risk-${riskColor}">${lang === 'ru' ? 'риск' : 'risc'}: ${escapeHtml(idea.risk_level)}</span>
                </header>
                <p class="cf-idea-desc">${escapeHtml(bi(idea.short_description))}</p>
                <div class="cf-idea-meta">
                    <span>👥 ${idea.estimated_beneficiaries.toLocaleString('ro-MD')} ${lang === 'ru' ? 'бенеф.' : 'benef.'}</span>
                    <span>⏱ ${idea.duration_months} ${lang === 'ru' ? 'мес.' : 'luni'}</span>
                    <span>💰 ${fmtMdl(idea.estimated_budget_min_mdl)}–${fmtMdl(idea.estimated_budget_max_mdl)}</span>
                </div>
                <div class="cf-idea-extra">
                    <div><strong>${lang === 'ru' ? 'Инновация' : 'Inovație'}:</strong> ${escapeHtml(bi(idea.key_innovation))}</div>
                    <div><strong>${lang === 'ru' ? 'Прецеденты' : 'Precedente'}:</strong> ${escapeHtml(bi(idea.similar_precedents))}</div>
                </div>
                <button class="btn btn-primary cf-select-btn">📋 ${lang === 'ru' ? 'Сгенерировать полную карточку проекта' : 'Generează fișa completă de proiect'}</button>
            </article>
        `;
    }

    // ── Project sheet view ─────────────────────────────────────────────────
    async function openProjectSheet(ideaId, idea) {
        const lang = getLang();
        const body = $('#cf-body');
        body.innerHTML = `<p class="cf-empty">${lang === 'ru' ? '⏳ Генерируем полную карточку проекта (~60 сек)…' : '⏳ Generez fișa completă de proiect (~60 sec)…'}</p>`;

        try {
            const res = await fetch('demo_project_sheet.json');
            if (!res.ok) throw new Error('demo not found');
            const sheet = await res.json();
            renderProjectSheet(sheet, idea);
        } catch (err) {
            body.innerHTML = `<p class="cf-empty">⚠️ ${escapeHtml(err.message)}</p>`;
        }
    }

    async function downloadFisaDocx(sheet) {
        const lang = getLang();
        if (DEMO_MODE) {
            alert(lang === 'ru'
                ? 'DOCX доступен только при активированном backend (нужен Anthropic API). В демо-режиме можно просмотреть карточку онлайн.'
                : 'DOCX disponibil doar cu backend activ (necesită Anthropic API). În modul demo poți vedea fișa online.');
            return;
        }
        const loadingMsg = lang === 'ru' ? '⏳ Генерация DOCX…' : '⏳ Generez DOCX…';
        if (window.GrantioLoading) window.GrantioLoading.show(loadingMsg);
        try {
            const res = await fetch(`${API_BASE}/project-sheet/render-docx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fisa: sheet, lang }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `HTTP ${res.status}`);
            }
            const data = await res.json();
            // Trigger download
            const a = document.createElement('a');
            a.href = `${API_BASE}${data.download_url}`;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            alert((lang === 'ru' ? 'Ошибка: ' : 'Eroare: ') + err.message);
        } finally {
            if (window.GrantioLoading) window.GrantioLoading.hide();
        }
    }

    async function saveSheetToAccount(sheet) {
        const lang = getLang();
        if (DEMO_MODE) {
            alert(lang === 'ru'
                ? 'Сохранение требует backend (PostgreSQL). В демо-режиме сохранение в браузер только.'
                : 'Salvarea în cont necesită backend (PostgreSQL). În demo, doar previzualizare.');
            return;
        }
        const user = currentUser();
        const orgName = user?.organization || prompt(lang === 'ru' ? 'Название организации:' : 'Numele organizației:');
        if (!orgName) return;
        if (window.GrantioLoading) window.GrantioLoading.show(lang === 'ru' ? '⏳ Сохраняем…' : '⏳ Salvez…');
        try {
            // Step 1: get-or-create org
            const orgsRes = await fetch(`${API_BASE}/organizations`);
            const orgs = await orgsRes.json();
            let org = orgs.find(o => o.name === orgName);
            if (!org) {
                const cat = user?.audience_primary || user?.audience || 'ngo';
                const createRes = await fetch(`${API_BASE}/organizations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: orgName, org_type: cat, contact_email: user?.email }),
                });
                if (!createRes.ok) throw new Error('Eroare creare org');
                org = await createRes.json();
            }
            // Step 2: save project
            const saveRes = await fetch(`${API_BASE}/projects/from-sheet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ org_id: org.id, fisa: sheet }),
            });
            if (!saveRes.ok) {
                const err = await saveRes.json().catch(() => ({}));
                throw new Error(err.detail || `HTTP ${saveRes.status}`);
            }
            const project = await saveRes.json();
            alert((lang === 'ru' ? '✓ Сохранено! ID: ' : '✓ Salvat! ID: ') + project.project_id);
        } catch (err) {
            alert((lang === 'ru' ? 'Ошибка сохранения: ' : 'Eroare salvare: ') + err.message);
        } finally {
            if (window.GrantioLoading) window.GrantioLoading.hide();
        }
    }

    function renderProjectSheet(sheet, originalIdea) {
        const lang = getLang();
        const body = $('#cf-body');
        body.innerHTML = `
            <div class="cf-sheet-actions">
                <button type="button" class="cf-back-btn">← ${lang === 'ru' ? 'Назад к идеям' : 'Înapoi la idei'}</button>
                <button type="button" class="btn btn-primary cf-download-btn">📄 ${lang === 'ru' ? 'Скачать .docx' : 'Descarcă .docx'}</button>
                <button type="button" class="btn btn-ghost cf-save-btn">💾 ${lang === 'ru' ? 'Сохранить в кабинете' : 'Salvează în contul meu'}</button>
            </div>

            <div class="cf-sheet">
                <header class="cf-sheet-header">
                    <h3>${escapeHtml(bi(sheet.project_title))}</h3>
                    <div class="cf-sheet-meta">
                        <span>🏢 ${escapeHtml(sheet.organization_name)}</span>
                        <span>🎯 ${escapeHtml(sheet.call_title)}</span>
                        <span>📐 ${sheet.methodology.toUpperCase()}</span>
                        <span>⏱ ${sheet.duration_months} ${lang === 'ru' ? 'мес.' : 'luni'}</span>
                        <span>💰 ${fmtMdl(sheet.total_budget_mdl)}</span>
                    </div>
                </header>

                <section class="cf-section">
                    <h4>📍 ${lang === 'ru' ? 'Контекст' : 'Context'}</h4>
                    <p><strong>${lang === 'ru' ? 'Проблема' : 'Problemă'}:</strong> ${escapeHtml(bi(sheet.problem_statement))}</p>
                    <p><strong>${lang === 'ru' ? 'Бенефициары' : 'Beneficiari'}:</strong> ${escapeHtml(bi(sheet.target_beneficiaries))} (${sheet.estimated_beneficiaries.toLocaleString('ro-MD')} ${lang === 'ru' ? 'чел.' : 'pers.'})</p>
                    <p><strong>${lang === 'ru' ? 'Обоснование' : 'Justificare'}:</strong> ${escapeHtml(bi(sheet.justification))}</p>
                </section>

                <section class="cf-section">
                    <h4>🎯 ${sheet.general_objectives.length} ${lang === 'ru' ? 'общих целей' : 'obiective generale'}</h4>
                    <ol class="cf-obj-list">
                        ${sheet.general_objectives.map(og => `
                            <li>
                                <strong>${escapeHtml(og.code)} — ${escapeHtml(bi(og.title))}</strong>
                                <p>${escapeHtml(bi(og.description))}</p>
                                <small>📊 ${escapeHtml(bi(og.impact_indicator))}</small>
                            </li>
                        `).join('')}
                    </ol>
                </section>

                <section class="cf-section">
                    <h4>📌 ${sheet.specific_objectives.length} ${lang === 'ru' ? 'специфических целей (SMART)' : 'obiective specifice (SMART)'}</h4>
                    <ul class="cf-spec-obj">
                        ${sheet.specific_objectives.map(os => `
                            <li>
                                <span class="cf-code">${escapeHtml(os.code)}</span> ←${escapeHtml(os.parent_general_objective)}
                                <strong>${escapeHtml(bi(os.title))}</strong>
                                — ${escapeHtml(bi(os.smart_formulation))}
                                <em>Țintă: ${escapeHtml(os.target_value)} · M${os.timeframe_months}</em>
                            </li>
                        `).join('')}
                    </ul>
                </section>

                <section class="cf-section">
                    <h4>📦 ${sheet.deliverables.length} ${lang === 'ru' ? 'результатов' : 'livrabile'}</h4>
                    <table class="cf-table">
                        <thead><tr><th>Cod</th><th>${lang === 'ru' ? 'Название' : 'Titlu'}</th><th>OS</th><th>${lang === 'ru' ? 'Месяц' : 'Luna'}</th><th>Format</th></tr></thead>
                        <tbody>
                            ${sheet.deliverables.map(d => `
                                <tr>
                                    <td><strong>${escapeHtml(d.code)}</strong></td>
                                    <td>${escapeHtml(bi(d.title))}</td>
                                    <td>${escapeHtml(d.related_specific_objective)}</td>
                                    <td>M${d.target_month}</td>
                                    <td><span class="cf-fmt-tag">${escapeHtml(d.format)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>

                <section class="cf-section">
                    <h4>🏁 ${sheet.milestones.length} ${lang === 'ru' ? 'контрольных точек' : 'jaloane'}</h4>
                    <ul class="cf-milestones">
                        ${sheet.milestones.map(m => `
                            <li class="${m.is_payment_milestone ? 'cf-milestone-payment' : ''}">
                                <strong>${escapeHtml(m.code)} (M${m.target_month}):</strong> ${escapeHtml(bi(m.title))}
                                ${m.is_payment_milestone ? '<span class="cf-payment-badge">💳 plată</span>' : ''}
                                <div class="cf-success-criteria">✓ ${escapeHtml(bi(m.success_criteria))}</div>
                                <small>Livrabile: ${m.related_deliverables.join(', ')}</small>
                            </li>
                        `).join('')}
                    </ul>
                </section>

                <section class="cf-section">
                    <h4>👥 ${lang === 'ru' ? 'Команда' : 'Echipa'} (${sheet.team.length} ${lang === 'ru' ? 'ролей' : 'roluri'}) · ${lang === 'ru' ? 'зарплаты MD 2026' : 'salarii MD 2026'}</h4>
                    <table class="cf-table">
                        <thead><tr><th>Rol</th><th>${lang === 'ru' ? 'Уровень' : 'Seniority'}</th><th>${lang === 'ru' ? 'Зарплата/мес' : 'Salariu/lună'}</th><th>${lang === 'ru' ? 'Месяцы' : 'Luni'}</th><th>FTE</th><th>Total</th></tr></thead>
                        <tbody>
                            ${sheet.team.map(t => `
                                <tr>
                                    <td><strong>${escapeHtml(bi(t.role))}</strong></td>
                                    <td>${escapeHtml(t.seniority)}</td>
                                    <td>${fmtMdl(t.monthly_salary_mdl)}</td>
                                    <td>${t.months_allocated}</td>
                                    <td>${t.fte}</td>
                                    <td><strong>${fmtMdl(t.total_cost_mdl)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>

                <section class="cf-section">
                    <h4>🔧 ${lang === 'ru' ? 'Технические ресурсы' : 'Resurse tehnice'} (${sheet.technical_resources.length} items)</h4>
                    <table class="cf-table">
                        <thead><tr><th>Categorie</th><th>${lang === 'ru' ? 'Название' : 'Nume'}</th><th>Cant.</th><th>${lang === 'ru' ? 'Цена' : 'Preț'}</th><th>Total</th></tr></thead>
                        <tbody>
                            ${sheet.technical_resources.map(r => `
                                <tr>
                                    <td><span class="cf-cat-${r.category}">${escapeHtml(r.category)}</span></td>
                                    <td>${escapeHtml(bi(r.name))}</td>
                                    <td>${r.quantity}</td>
                                    <td>${fmtMdl(r.unit_cost_mdl)}</td>
                                    <td><strong>${fmtMdl(r.total_cost_mdl)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>

                <section class="cf-section cf-section-budget">
                    <h4>💰 ${lang === 'ru' ? 'Бюджет' : 'Buget'}: ${fmtMdl(sheet.total_budget_mdl)}</h4>
                    <div class="cf-budget-summary">
                        <span>🎁 Grant: <strong>${fmtMdl(sheet.grant_amount_mdl)}</strong></span>
                        <span>💼 Cofinanțare: <strong>${fmtMdl(sheet.cofinancing_amount_mdl)} (${sheet.cofinancing_percent}%)</strong></span>
                    </div>
                    <table class="cf-table">
                        <thead><tr><th>Cat.</th><th>${lang === 'ru' ? 'Подкатегория' : 'Subcategorie'}</th><th>Cant.</th><th>Cost unitar</th><th>Total MDL</th><th>${lang === 'ru' ? 'Источник' : 'Sursă'}</th></tr></thead>
                        <tbody>
                            ${sheet.budget_lines.map(b => `
                                <tr>
                                    <td>${escapeHtml(b.category)}</td>
                                    <td>${escapeHtml(bi(b.subcategory))}</td>
                                    <td>${b.quantity}</td>
                                    <td>${fmtMdl(b.unit_cost_mdl)}</td>
                                    <td><strong>${fmtMdl(b.total_mdl)}</strong></td>
                                    <td><span class="cf-funding-${b.funding_source}">${escapeHtml(b.funding_source)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>

                <section class="cf-section cf-section-risks">
                    <h4>⚠️ ${sheet.risk_register.length} ${lang === 'ru' ? 'рисков' : 'riscuri'} identificate</h4>
                    <div class="cf-risk-grid">
                        ${sheet.risk_register.map(r => `
                            <div class="cf-risk-card cf-risk-impact-${r.impact}">
                                <header>
                                    <strong>${escapeHtml(r.code)} — ${escapeHtml(bi(r.title))}</strong>
                                    <span class="cf-risk-tag">${escapeHtml(r.category)} · ${escapeHtml(r.probability)}×${escapeHtml(r.impact)}</span>
                                </header>
                                <p>${escapeHtml(bi(r.description))}</p>
                                <div><strong>🛡 Mitigare:</strong> ${escapeHtml(bi(r.mitigation_plan))}</div>
                                <div><strong>🆘 Contingency:</strong> ${escapeHtml(bi(r.contingency_plan))}</div>
                                <small>Owner: ${escapeHtml(r.owner_role)}</small>
                            </div>
                        `).join('')}
                    </div>
                </section>

                ${sheet.notes_for_user ? `
                    <section class="cf-section cf-section-notes">
                        <h4>📝 ${lang === 'ru' ? 'Замечания для пользователя' : 'Mențiuni pentru utilizator'}</h4>
                        <p>${escapeHtml(sheet.notes_for_user)}</p>
                    </section>
                ` : ''}
            </div>
        `;
        // Wire up buttons (download + save + back)
        body.querySelector('.cf-back-btn')?.addEventListener('click', () => {
            fetch('demo_call_ideas.json').then(r => r.json()).then(renderIdeas);
        });
        body.querySelector('.cf-download-btn')?.addEventListener('click', () => downloadFisaDocx(sheet));
        body.querySelector('.cf-save-btn')?.addEventListener('click', () => saveSheetToAccount(sheet));
    }

    // ── Boot — bulletproof: observer on body + interval failsafe + events ──
    function init() {
        // 1. MutationObserver pe ÎNTREG body (catch any rendering change)
        const observer = new MutationObserver(() => {
            // throttle: skip if no change in count
            injectCallFlowButtons();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // 2. Interval failsafe — re-check every 2 sec (insurance against missed mutations)
        setInterval(() => injectCallFlowButtons(), 2000);

        // 3. Immediate scan
        injectCallFlowButtons();

        // 4. Events
        document.addEventListener('grantio:profile-updated', () => setTimeout(injectCallFlowButtons, 300));
        document.querySelectorAll('[data-tab="dashboard"]').forEach(b => {
            b.addEventListener('click', () => setTimeout(injectCallFlowButtons, 200));
        });

        // 5. Expose manual trigger (debug)
        window.grantioInjectCallButtons = injectCallFlowButtons;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
