// ============ Grantio Wizard de Idei Concept Note (bilingv RO+RU) ============
//   Step 1: alege categorie organizație (ONG / Sector public / Sector privat)
//   Step 2: alege domeniul + brief (opțional)
//   Step 3: 4-6 idei generate de Claude Opus 4.7, bilingue, cu buget/echipă/activități/jaloane
//
//   API: POST /concept-ideas/generate  (vezi grantio-eligibility/api/main.py)

(function() {
    'use strict';

    const API_BASE = (window.GRANTIO_API_BASE || 'http://localhost:8001').replace(/\/$/, '');
    const LANG_KEY = 'grantio-lang';
    const ORG_KEY = 'grantio-my-org';  // numele organizației curente (din localStorage)
    const STATE = {
        category: null, domain: null, brief: null,
        ideas: null, expanded: new Set(),
        registry: [],  // idei rezervate de alte organizații
    };

    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    function getLang() { return localStorage.getItem(LANG_KEY) || 'ro'; }
    function setLang(l) { localStorage.setItem(LANG_KEY, l); applyI18n(); if (STATE.ideas) renderIdeas(); }
    function bi(field) { return (field && field[getLang()]) || (field && field.ro) || ''; }
    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function fmtMdl(n) { return new Intl.NumberFormat('ro-MD').format(Math.round(n)) + ' MDL'; }
    function fmtMonth(n) {
        const lang = getLang();
        return lang === 'ru' ? `мес. ${n}` : `luna ${n}`;
    }

    // ── i18n pentru elemente cu data-i18n-ro / data-i18n-ru ─────────────────
    function applyI18n() {
        const lang = getLang();
        $$('#panel-ideas [data-i18n-' + lang + ']').forEach(el => {
            el.textContent = el.dataset['i18n' + (lang === 'ro' ? 'Ro' : 'Ru')];
        });
        $$('.lang-btn').forEach(b => {
            b.classList.toggle('lang-active', b.dataset.lang === lang);
        });
    }

    // ── Preset domains per categorie ────────────────────────────────────────
    const DOMAINS = {
        ngo: [
            { value: 'drepturile omului', ro: 'Drepturile omului', ru: 'Права человека' },
            { value: 'mass-media', ro: 'Mass-media', ru: 'СМИ' },
            { value: 'anti-corupție', ro: 'Anti-corupție', ru: 'Антикоррупция' },
            { value: 'drepturile femeii', ro: 'Drepturile femeii', ru: 'Права женщин' },
            { value: 'tineret', ro: 'Tineret', ru: 'Молодёжь' },
            { value: 'dezvoltare comunitară', ro: 'Dezvoltare comunitară', ru: 'Развитие сообществ' },
            { value: 'mediu și climă', ro: 'Mediu și climă', ru: 'Экология и климат' },
            { value: 'educație', ro: 'Educație', ru: 'Образование' },
            { value: 'sănătate', ro: 'Sănătate', ru: 'Здоровье' },
            { value: 'integrare europeană', ro: 'Integrare europeană', ru: 'Евроинтеграция' },
        ],
        public: [
            { value: 'dezvoltare locală', ro: 'Dezvoltare locală', ru: 'Местное развитие' },
            { value: 'infrastructură publică', ro: 'Infrastructură publică', ru: 'Публичная инфраструктура' },
            { value: 'digitalizare guvernamentală', ro: 'Digitalizare guvernamentală', ru: 'Цифровизация госуправления' },
            { value: 'servicii publice', ro: 'Servicii publice', ru: 'Государственные услуги' },
            { value: 'mediu și climă', ro: 'Mediu și climă', ru: 'Экология и климат' },
            { value: 'eficiență energetică', ro: 'Eficiență energetică', ru: 'Энергоэффективность' },
            { value: 'servicii sociale', ro: 'Servicii sociale', ru: 'Социальные услуги' },
            { value: 'turism rural', ro: 'Turism rural', ru: 'Сельский туризм' },
        ],
        private: [
            { value: 'agribusiness', ro: 'Agribusiness', ru: 'Агробизнес' },
            { value: 'IT și software', ro: 'IT și software', ru: 'ИТ и софт' },
            { value: 'energie regenerabilă', ro: 'Energie regenerabilă', ru: 'Возобновляемая энергия' },
            { value: 'turism', ro: 'Turism', ru: 'Туризм' },
            { value: 'manufacturing', ro: 'Manufacturing', ru: 'Производство' },
            { value: 'comerț electronic', ro: 'Comerț electronic', ru: 'Электронная коммерция' },
            { value: 'fintech', ro: 'Fintech', ru: 'Финтех' },
            { value: 'fashion / artizanat', ro: 'Fashion / artizanat', ru: 'Мода / ремёсла' },
        ],
    };

    // ── Step 1 — Counters per categorie ─────────────────────────────────────
    async function loadCategoryCounts() {
        for (const cat of ['ngo', 'public', 'private']) {
            try {
                const res = await fetch(`${API_BASE}/calls/for-category/${cat}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                const el = $('#cat-count-' + cat);
                if (el) el.textContent = `${data.count} ${getLang() === 'ru' ? 'конкурс.' : 'apeluri'}`;
            } catch {
                const el = $('#cat-count-' + cat);
                if (el) el.textContent = '—';
            }
        }
    }

    function onCategorySelect(cat) {
        STATE.category = cat;
        $$('.org-cat-card').forEach(c => c.classList.toggle('selected', c.dataset.cat === cat));
        showStep(2);
        renderDomainChips();
        loadEligSummary();
    }

    async function loadEligSummary() {
        const sum = $('#ideas-elig-summary');
        if (!sum || !STATE.category) return;
        try {
            const res = await fetch(`${API_BASE}/calls/for-category/${STATE.category}`);
            const data = await res.json();
            const lang = getLang();
            const word = lang === 'ru' ? 'конкурсов активно для вас' : 'apeluri active pentru tine';
            const audiences = data.accepted_audiences.join(', ');
            sum.innerHTML = `<strong>${data.count}</strong> ${escapeHtml(word)} <span class="dim">(${escapeHtml(audiences)})</span>`;
        } catch {
            sum.textContent = '';
        }
    }

    // ── Step 2 — Domain chips ───────────────────────────────────────────────
    function renderDomainChips() {
        const grid = $('#ideas-domain-chips');
        if (!grid || !STATE.category) return;
        const list = DOMAINS[STATE.category] || [];
        const lang = getLang();
        grid.innerHTML = list.map(d => `
            <button type="button" class="domain-chip" data-value="${escapeHtml(d.value)}">${escapeHtml(d[lang] || d.ro)}</button>
        `).join('');
        grid.querySelectorAll('.domain-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                grid.querySelectorAll('.domain-chip').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                $('#ideas-domain-custom').value = btn.dataset.value;
            });
        });
    }

    // ── Generate ────────────────────────────────────────────────────────────
    async function onGenerate() {
        const domain = ($('#ideas-domain-custom').value || '').trim();
        if (!STATE.category) { alert('Selectează categoria.'); return; }
        if (!domain || domain.length < 3) {
            alert(getLang() === 'ru' ? 'Введите сферу (мин. 3 символа).' : 'Introdu domeniul (min 3 caractere).');
            return;
        }
        const brief = ($('#ideas-brief').value || '').trim() || null;

        const loadingMsg = getLang() === 'ru'
            ? 'Генерируем 5 идей на двух языках… ~30 сек'
            : 'Generez 5 idei bilingue… ~30 sec';
        if (window.GrantioLoading) window.GrantioLoading.show(loadingMsg);

        try {
            const res = await fetch(`${API_BASE}/concept-ideas/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    org_category: STATE.category,
                    domain,
                    user_brief: brief,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `HTTP ${res.status}`);
            }
            STATE.ideas = await res.json();
            STATE.domain = domain;
            STATE.brief = brief;
            STATE.expanded.clear();
            await loadRegistry(STATE.category, STATE.domain);
            showStep(3);
            renderIdeas();
        } catch (err) {
            const msg = err.message || 'eroare';
            alert((getLang() === 'ru' ? 'Ошибка генерации: ' : 'Eroare la generare: ') + msg
                + '\n\n' + (getLang() === 'ru'
                    ? 'Проверьте, что API ключ ANTHROPIC_API_KEY установлен в .env'
                    : 'Verifică că ANTHROPIC_API_KEY e setat în .env'));
        } finally {
            if (window.GrantioLoading) window.GrantioLoading.hide();
        }
    }

    // ── Registry — deduplicare inter-entități ───────────────────────────────
    async function loadRegistry(category, domain) {
        try {
            const url = new URL(`${API_BASE}/ideas/registry`);
            if (category) url.searchParams.set('category', category);
            if (domain) url.searchParams.set('domain', domain);
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            STATE.registry = data.entries || [];
        } catch {
            STATE.registry = [];  // fallback silent — registry e opțional pentru UX
        }
    }

    // Fingerprint client-side identic cu backend pentru fast lookup
    function fingerprint(title) {
        if (!title) return '';
        const STOPWORDS = new Set(['pentru','de','din','in','și','a','la','cu','ce','ca','se','ale','al','lui','ei','pe','prin','fără','către','spre','the','for','and','of','to','with']);
        const stripped = title.toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ');
        const words = stripped.split(/\s+/).filter(w => w && !STOPWORDS.has(w));
        return words.slice(0, 6).join('-');
    }

    function findReservation(title) {
        const fp = fingerprint(title);
        return STATE.registry.find(r => r.fingerprint === fp) || null;
    }

    async function onValidateIdea(idea) {
        const myOrg = (localStorage.getItem(ORG_KEY) || '').trim()
            || prompt(getLang() === 'ru' ? 'Название вашей организации:' : 'Numele organizației tale:');
        if (!myOrg) return;
        localStorage.setItem(ORG_KEY, myOrg);

        const loadingMsg = getLang() === 'ru' ? 'Резервируем идею…' : 'Rezervez ideea…';
        if (window.GrantioLoading) window.GrantioLoading.show(loadingMsg);
        try {
            const res = await fetch(`${API_BASE}/ideas/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title_ro: idea.title.ro,
                    title_ru: idea.title.ru,
                    category: STATE.category,
                    domain: STATE.domain || 'demo',
                    match_call_id: idea.eligibility_match_call_id,
                    validated_by_org: myOrg,
                }),
            });
            if (res.status === 409) {
                const data = await res.json();
                alert((getLang() === 'ru' ? 'Уже зарезервировано: ' : 'Deja rezervat: ') + data.detail);
            } else if (!res.ok) {
                throw new Error('HTTP ' + res.status);
            } else {
                await loadRegistry(STATE.category, STATE.domain);
                renderIdeas();
            }
        } catch (err) {
            alert((getLang() === 'ru' ? 'Ошибка резервирования: ' : 'Eroare rezervare: ') + err.message);
        } finally {
            if (window.GrantioLoading) window.GrantioLoading.hide();
        }
    }

    // ── Demo loader (cached response, sări peste LLM) ───────────────────────
    async function onDemoLoad() {
        const loadingMsg = getLang() === 'ru' ? 'Загружаем демо…' : 'Încarc demo-ul…';
        if (window.GrantioLoading) window.GrantioLoading.show(loadingMsg);
        try {
            const res = await fetch('demo_ideas_response.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            STATE.ideas = await res.json();
            STATE.category = STATE.category || 'ngo';
            STATE.domain = STATE.ideas._meta?.domain || 'demo';
            STATE.expanded.clear();
            await loadRegistry(STATE.category, STATE.domain);  // pentru badges
            showStep(3);
            renderIdeas();
        } catch (err) {
            alert((getLang() === 'ru' ? 'Ошибка загрузки демо: ' : 'Eroare la demo: ') + err.message);
        } finally {
            if (window.GrantioLoading) window.GrantioLoading.hide();
        }
    }

    // ── Step 3 — Render ideas ───────────────────────────────────────────────
    function renderIdeas() {
        if (!STATE.ideas) return;
        const wrap = $('#ideas-cards');
        const ctxEl = $('#ideas-context');
        const lang = getLang();
        // Construiește summary cu count rezervări
        const reservedInBatch = STATE.ideas.ideas.filter(i => findReservation(i.title.ro)).length;
        const totalReserved = STATE.registry.length;
        let dedupBadge = '';
        if (totalReserved > 0) {
            dedupBadge = lang === 'ru'
                ? `<div class="dedup-banner">🔒 <strong>${totalReserved}</strong> идей уже зарезервированы другими организациями в этой сфере. ${reservedInBatch > 0 ? `${reservedInBatch} из показанных ниже отмечены.` : 'LLM их исключил при генерации.'}</div>`
                : `<div class="dedup-banner">🔒 <strong>${totalReserved}</strong> idei deja rezervate de alte organizații în acest domeniu. ${reservedInBatch > 0 ? `${reservedInBatch} dintre cele afișate mai jos sunt marcate.` : 'LLM-ul le-a exclus la generare.'}</div>`;
        }
        if (ctxEl) ctxEl.innerHTML = dedupBadge + `<em>${escapeHtml(bi(STATE.ideas.generation_context))}</em>`;
        if (!wrap) return;
        wrap.innerHTML = STATE.ideas.ideas.map(idea => renderIdeaCard(idea)).join('');
        // bind expand toggles
        wrap.querySelectorAll('.idea-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (STATE.expanded.has(id)) STATE.expanded.delete(id);
                else STATE.expanded.add(id);
                renderIdeas();
            });
        });
        // bind full-plan buttons → load demo + open modal
        wrap.querySelectorAll('.full-plan-btn').forEach(btn => {
            btn.addEventListener('click', () => openFullPlanModal(btn.dataset.id));
        });
        // bind validate buttons → rezervă ideea pentru org curentă
        wrap.querySelectorAll('.validate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idea = STATE.ideas.ideas.find(i => i.id === btn.dataset.id);
                if (idea) onValidateIdea(idea);
            });
        });
    }

    // ── Full Plan Modal (5 faze cu documente + prefill) ─────────────────────
    async function openFullPlanModal(ideaId) {
        const loadingMsg = getLang() === 'ru' ? 'Загружаем полный план…' : 'Încarc planul complet…';
        if (window.GrantioLoading) window.GrantioLoading.show(loadingMsg);
        try {
            const res = await fetch('demo_full_project.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const fullProject = await res.json();
            renderFullPlanModal(fullProject, ideaId);
        } catch (err) {
            alert((getLang() === 'ru' ? 'Ошибка: ' : 'Eroare: ') + err.message);
        } finally {
            if (window.GrantioLoading) window.GrantioLoading.hide();
        }
    }

    function renderFullPlanModal(project, ideaId) {
        const lang = getLang();
        const labels = {
            ro: { close: '✕ Închide', overview: 'Sumar', phaseDocs: 'Documente fază', prefill: 'Date pre-completate', placeholder: 'Placeholder', source: 'Sursă', example: 'Exemplu', companyHint: 'Numele organizației tale se completează din profil', objectivesGeneral: 'Obiective generale (strategice)', objectivesSpecific: 'Obiective specifice (SMART)', scope: 'Scope', keyOutputs: 'Livrabile cheie ale fazei', noteDownload: 'În producție, fiecare document se generează ca .docx / .xlsx / .pptx prin python-docx + docxtpl, pre-completate cu datele de mai sus.' },
            ru: { close: '✕ Закрыть', overview: 'Сводка', phaseDocs: 'Документы фазы', prefill: 'Предзаполняемые данные', placeholder: 'Плейсхолдер', source: 'Источник', example: 'Пример', companyHint: 'Название вашей организации подставляется из профиля', objectivesGeneral: 'Общие цели (стратегические)', objectivesSpecific: 'Конкретные цели (SMART)', scope: 'Область', keyOutputs: 'Ключевые результаты фазы', noteDownload: 'В продакшне каждый документ генерируется как .docx / .xlsx / .pptx через python-docx + docxtpl, предзаполненный данными выше.' },
        }[lang];

        const phaseTabs = project.phases.map((p, i) => `
            <button type="button" class="fp-tab ${i === 0 ? 'fp-tab-active' : ''}" data-phase-idx="${i}">
                ${p.icon} ${escapeHtml(bi(p.phase_label))}
            </button>
        `).join('');

        const phaseContents = project.phases.map((p, i) => renderPhaseContent(p, i, labels)).join('');

        const objsHtml = project.strategic_objectives.map(so => `
            <li><strong>${escapeHtml(so.code)}</strong> — ${escapeHtml(bi(so.title))}</li>
        `).join('');

        const specObjsHtml = project.specific_objectives.map(spo => `
            <li><strong>${escapeHtml(spo.code)}</strong> (${escapeHtml(spo.parent_so)}) — ${escapeHtml(bi(spo.smart_formulation))}</li>
        `).join('');

        const inScope = project.scope.in_scope.map(s => `<li>${escapeHtml(bi(s))}</li>`).join('');
        const outScope = project.scope.out_of_scope.map(s => `<li>${escapeHtml(bi(s))}</li>`).join('');

        const modalHtml = `
            <div class="fp-modal" id="fp-modal">
                <div class="fp-modal-inner">
                    <header class="fp-header">
                        <div>
                            <h2>${escapeHtml(bi(project.project_title))}</h2>
                            <div class="fp-meta">
                                <span>🎯 ${escapeHtml(project.call_title)}</span>
                                <span>📐 ${project.methodology.toUpperCase()}</span>
                                <span>⏱ ${project.duration_months} ${lang === 'ru' ? 'мес.' : 'luni'}</span>
                                <span>💰 ${fmtMdl(project.total_budget_mdl)}</span>
                            </div>
                            <div class="fp-company-hint">🏢 ${escapeHtml(project.company_name_placeholder)} <small>— ${escapeHtml(labels.companyHint)}</small></div>
                        </div>
                        <button type="button" class="fp-close" id="fp-close-btn">${labels.close}</button>
                    </header>

                    <section class="fp-overview">
                        <div class="fp-overview-col">
                            <h4>${labels.objectivesGeneral}</h4>
                            <ol class="fp-list">${objsHtml}</ol>
                        </div>
                        <div class="fp-overview-col">
                            <h4>${labels.objectivesSpecific}</h4>
                            <ol class="fp-list small">${specObjsHtml}</ol>
                        </div>
                        <div class="fp-overview-col">
                            <h4>${labels.scope}</h4>
                            <div class="fp-scope">
                                <strong>IN:</strong>
                                <ul class="fp-list small">${inScope}</ul>
                                <strong>OUT:</strong>
                                <ul class="fp-list small">${outScope}</ul>
                            </div>
                        </div>
                    </section>

                    <nav class="fp-tabs">${phaseTabs}</nav>
                    <div class="fp-phase-contents">${phaseContents}</div>

                    <footer class="fp-footer">
                        <small>ℹ️ ${escapeHtml(labels.noteDownload)}</small>
                    </footer>
                </div>
            </div>
        `;

        // remove existing modal if any
        const existing = document.getElementById('fp-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // tabs
        $$('.fp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.fp-tab').forEach(t => t.classList.remove('fp-tab-active'));
                tab.classList.add('fp-tab-active');
                const idx = tab.dataset.phaseIdx;
                $$('.fp-phase-content').forEach(c => c.hidden = c.dataset.phaseIdx !== idx);
            });
        });

        // close
        $('#fp-close-btn').addEventListener('click', () => {
            document.getElementById('fp-modal')?.remove();
        });
    }

    function renderPhaseContent(phase, idx, labels) {
        const lang = getLang();
        const outputs = phase.key_outputs.map(o => `<li>${escapeHtml(bi(o))}</li>`).join('');
        const docs = phase.documents.map(doc => renderPhaseDoc(doc, labels)).join('');
        return `
            <div class="fp-phase-content" data-phase-idx="${idx}" ${idx === 0 ? '' : 'hidden'}>
                <h3 class="fp-phase-title">${phase.icon} ${escapeHtml(bi(phase.phase_label))}</h3>
                <p class="fp-phase-desc">${escapeHtml(bi(phase.description))}</p>
                <div class="fp-key-outputs">
                    <strong>${labels.keyOutputs}:</strong>
                    <ul>${outputs}</ul>
                </div>
                <h4 class="fp-docs-title">📄 ${labels.phaseDocs} (${phase.documents.length})</h4>
                <div class="fp-docs">${docs}</div>
            </div>
        `;
    }

    function renderPhaseDoc(doc, labels) {
        const formatBadge = `<span class="fp-doc-fmt fp-fmt-${doc.format}">${doc.format.toUpperCase()}</span>`;
        const prefillRows = doc.prefill_fields.map(pf => `
            <tr>
                <td><code>${escapeHtml(pf.placeholder)}</code></td>
                <td>${escapeHtml(bi(pf.label))}</td>
                <td class="fp-src">${escapeHtml(pf.source)}</td>
                <td class="fp-ex">${escapeHtml(pf.example)}</td>
            </tr>
        `).join('');
        return `
            <details class="fp-doc">
                <summary>
                    <span class="fp-doc-code">${escapeHtml(doc.code)}</span>
                    ${formatBadge}
                    <span class="fp-doc-name">${escapeHtml(bi(doc.name))}</span>
                    <span class="fp-doc-due">${escapeHtml(bi(doc.when_due))}</span>
                </summary>
                <div class="fp-doc-body">
                    <p class="fp-doc-purpose">${escapeHtml(bi(doc.purpose))}</p>
                    <div class="fp-prefill">
                        <strong>📋 ${labels.prefill}:</strong>
                        <table class="fp-prefill-table">
                            <thead>
                                <tr><th>${labels.placeholder}</th><th>Label</th><th>${labels.source}</th><th>${labels.example}</th></tr>
                            </thead>
                            <tbody>${prefillRows}</tbody>
                        </table>
                    </div>
                </div>
            </details>
        `;
    }

    function renderIdeaCard(idea) {
        const lang = getLang();
        const isOpen = STATE.expanded.has(idea.id);
        const labels = {
            ro: { call: 'Apel match-uit', budget: 'Buget estimat', duration: 'Durată', team: 'Echipa necesară', activities: 'Activități cheie', milestones: 'Jaloane', innovation: 'Inovație', whyNow: 'De ce relevant acum', beneficiaries: 'Beneficiari estimați', months: 'luni', persons: 'persoane', expand: 'Detalii ▾', collapse: 'Mai puține ▴', cost: 'cost', monthsRole: 'luni', role: 'Rol', deliverable: 'Livrabil', successCrit: 'Criterii succes', fullPlan: '📊 Vezi planul complet (5 faze)', reserved: '🔒 Rezervat de', validateMine: '✓ Validez pentru organizația mea', validatedAt: 'din' },
            ru: { call: 'Подходящий конкурс', budget: 'Оценочный бюджет', duration: 'Срок', team: 'Необходимая команда', activities: 'Ключевые мероприятия', milestones: 'Контрольные точки', innovation: 'Инновация', whyNow: 'Почему актуально сейчас', beneficiaries: 'Оценочное число бенефициаров', months: 'мес.', persons: 'чел.', expand: 'Детали ▾', collapse: 'Свернуть ▴', cost: 'стоимость', monthsRole: 'мес.', role: 'Роль', deliverable: 'Результат', successCrit: 'Критерии успеха', fullPlan: '📊 Полный план (5 фаз)', reserved: '🔒 Зарезервировано', validateMine: '✓ Зарезервировать для нашей организации', validatedAt: 'с' },
        }[lang];

        const budgetStr = `${fmtMdl(idea.estimated_budget_min_mdl)} – ${fmtMdl(idea.estimated_budget_max_mdl)}`;
        const expandedHtml = isOpen ? renderIdeaDetails(idea, labels) : '';

        // ── Verificare deduplicare ──────────────────────────────────────
        const reservation = findReservation(idea.title.ro);
        const myOrg = (localStorage.getItem(ORG_KEY) || '').trim();
        const isMine = reservation && reservation.validated_by_org === myOrg;
        const reservationBadge = reservation
            ? `<div class="idea-reserved ${isMine ? 'idea-reserved-mine' : ''}">
                ${labels.reserved} <strong>${escapeHtml(reservation.validated_by_org)}</strong>
                <small>${labels.validatedAt} ${escapeHtml((reservation.validated_at || '').slice(0, 10))}</small>
                ${isMine ? `<span class="mine-tag">(${lang === 'ru' ? 'ВАША' : 'ALE TALE'})</span>` : ''}
               </div>`
            : '';
        const validateBtn = reservation
            ? '' // deja rezervat — fără buton de validare
            : `<button type="button" class="btn btn-ghost validate-btn" data-id="${idea.id}">${labels.validateMine}</button>`;
        const cardClass = reservation ? (isMine ? 'idea-card idea-card-mine' : 'idea-card idea-card-reserved') : 'idea-card';

        return `
            <article class="${cardClass}">
                ${reservationBadge}
                <header class="idea-head">
                    <div>
                        <h4 class="idea-title">${escapeHtml(bi(idea.title))}</h4>
                        <div class="idea-sub">
                            <span class="idea-pill">🎯 ${escapeHtml(idea.eligibility_match_call_title)}</span>
                            <span class="idea-pill">💰 ${escapeHtml(budgetStr)}</span>
                            <span class="idea-pill">⏱ ${idea.estimated_duration_months} ${labels.months}</span>
                            <span class="idea-pill">👥 ${idea.estimated_beneficiaries} ${labels.persons}</span>
                        </div>
                    </div>
                    <button type="button" class="idea-toggle btn btn-ghost" data-id="${idea.id}">
                        ${isOpen ? labels.collapse : labels.expand}
                    </button>
                </header>
                <p class="idea-problem">${escapeHtml(bi(idea.problem_statement))}</p>
                ${expandedHtml}
                <div class="idea-cta">
                    ${validateBtn}
                    <button type="button" class="btn btn-primary full-plan-btn" data-id="${idea.id}" ${reservation && !isMine ? 'disabled title="Idee rezervată de alta organizație"' : ''}>${labels.fullPlan}</button>
                </div>
            </article>
        `;
    }

    function renderIdeaDetails(idea, labels) {
        const teamRows = idea.required_team.map(r => `
            <tr>
                <td>${escapeHtml(bi(r.role))}</td>
                <td class="num">${r.months}</td>
                <td class="num">${fmtMdl(r.estimated_cost_mdl)}</td>
            </tr>
        `).join('');
        const activitiesList = idea.key_activities
            .slice().sort((a, b) => a.target_month - b.target_month)
            .map(a => `
                <li class="timeline-item">
                    <div class="timeline-month">${fmtMonth(a.target_month)}</div>
                    <div>
                        <div class="timeline-code">${escapeHtml(a.code)}</div>
                        <div class="timeline-title">${escapeHtml(bi(a.title))}</div>
                        <div class="timeline-deliv"><strong>${labels.deliverable}:</strong> ${escapeHtml(bi(a.deliverable))}</div>
                    </div>
                </li>
            `).join('');
        const milestonesList = idea.key_milestones
            .slice().sort((a, b) => a.target_month - b.target_month)
            .map(m => `
                <li class="timeline-item milestone">
                    <div class="timeline-month">${fmtMonth(m.target_month)}</div>
                    <div>
                        <div class="timeline-code">${escapeHtml(m.code)}</div>
                        <div class="timeline-title">🏁 ${escapeHtml(bi(m.title))}</div>
                        <div class="timeline-deliv"><strong>${labels.successCrit}:</strong> ${escapeHtml(bi(m.success_criteria))}</div>
                    </div>
                </li>
            `).join('');

        return `
            <div class="idea-details">
                <div class="idea-meta">
                    <div class="idea-section">
                        <h5>${labels.beneficiaries}</h5>
                        <p>${escapeHtml(bi(idea.target_beneficiaries))}</p>
                    </div>
                    <div class="idea-section">
                        <h5>${labels.innovation}</h5>
                        <p>${escapeHtml(bi(idea.innovation_angle))}</p>
                    </div>
                    <div class="idea-section">
                        <h5>${labels.whyNow}</h5>
                        <p>${escapeHtml(bi(idea.why_relevant_now))}</p>
                    </div>
                </div>

                <h5 class="section-h">${labels.team}</h5>
                <table class="idea-table">
                    <thead><tr><th>${labels.role}</th><th>${labels.monthsRole}</th><th>${labels.cost}</th></tr></thead>
                    <tbody>${teamRows}</tbody>
                </table>

                <h5 class="section-h">${labels.activities}</h5>
                <ul class="timeline">${activitiesList}</ul>

                <h5 class="section-h">${labels.milestones}</h5>
                <ul class="timeline">${milestonesList}</ul>
            </div>
        `;
    }

    // ── Step navigation ─────────────────────────────────────────────────────
    function showStep(n) {
        for (let i = 1; i <= 3; i++) {
            const el = $('#ideas-step-' + i);
            if (el) el.hidden = (i !== n);
        }
    }

    // ── Boot ────────────────────────────────────────────────────────────────
    function init() {
        applyI18n();
        loadCategoryCounts();

        // Lang toggle
        $$('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => setLang(btn.dataset.lang));
        });

        // Step 1 → category select
        $$('.org-cat-card').forEach(card => {
            card.addEventListener('click', () => onCategorySelect(card.dataset.cat));
        });

        // Step 2 back
        $('#ideas-back-to-1')?.addEventListener('click', () => {
            STATE.category = null;
            $$('.org-cat-card').forEach(c => c.classList.remove('selected'));
            showStep(1);
        });

        // Generate (live API)
        $('#ideas-generate-btn')?.addEventListener('click', onGenerate);

        // Demo (cached response, fără API)
        $('#ideas-demo-btn')?.addEventListener('click', onDemoLoad);

        // Restart
        $('#ideas-restart')?.addEventListener('click', () => {
            STATE.ideas = null;
            $('#ideas-cards').innerHTML = '';
            $('#ideas-context').innerHTML = '';
            $('#ideas-domain-custom').value = '';
            $('#ideas-brief').value = '';
            $$('.domain-chip').forEach(c => c.classList.remove('selected'));
            showStep(2);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
