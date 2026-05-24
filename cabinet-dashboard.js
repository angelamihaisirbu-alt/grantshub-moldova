// ============ Dashboard widgets: Apeluri eligibile + Pricing ============
// Citește utilizatorul curent din localStorage (cabinet.js îl persistă),
// determină org_type și populează dashboard-ul cu apelurile relevante + tariful.

(function() {
    'use strict';

    const API_BASE = (window.GRANTIO_API_BASE || 'http://localhost:8001').replace(/\/$/, '');
    const STORAGE_USERS = 'grantshub_cabinet_users_v1';
    const STORAGE_SESSION = 'grantshub_cabinet_session_v1';

    const ORG_TYPE_LABELS = {
        ngo:     { ro: 'ONG / Societate civilă', icon: '🌱' },
        public:  { ro: 'Autoritate publică',     icon: '🏛' },
        private: { ro: 'Companie privată / IMM', icon: '💼' },
    };

    // Topic emoji mapping (uniformizat cu index.html public)
    const TOPIC_ICONS = {
        'Antreprenoriat':       '💼',
        'Educatie':             '🎓',
        'Educație':             '🎓',
        'Democratie':           '🗳',
        'Democrație':           '🗳',
        'Tineret':              '👥',
        'Drepturile omului':    '⚖',
        'Mass-media':           '📰',
        'Digitalizare':         '🖥',
        'Cultura':              '🎭',
        'Cultură':              '🎭',
        'Dezvoltare regionala': '📍',
        'Dezvoltare regională': '📍',
        'Coeziune sociala':     '🤝',
        'Coeziune socială':     '🤝',
        'Mediu':                '🌳',
        'Gen':                  '♀',
        'Integrare europeana':  '🇪🇺',
        'Integrare europeană':  '🇪🇺',
        'Agricultura':          '🌾',
        'Agricultură':          '🌾',
        'Clima':                '🌍',
        'Climă':                '🌍',
        'Sanatate':             '🏥',
        'Sănătate':             '🏥',
        'Justitie':             '⚖',
        'Justiție':             '⚖',
        'Diaspora':             '✈',
        'Dezvoltare rurala':    '🏞',
        'Dezvoltare rurală':    '🏞',
        'Energie':              '⚡',
        'Eficienta energetica': '🟢',
        'Eficiență energetică': '🟢',
        'Cercetare':            '🔬',
        'Inovare':              '💡',
        'Patrimoniu':           '🏛',
        'Infrastructura':       '🚧',
        'Infrastructură':       '🚧',
        'Refugiati':            '🆘',
        'Refugiați':            '🆘',
        'Apa & Sanitatie':      '💧',
        'Apă & Sanitație':      '💧',
        'Guvernare':            '🏛',
    };

    function currentUser() {
        try {
            const email = (localStorage.getItem(STORAGE_SESSION) || '').replace(/"/g, '');
            const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '{}');
            return users[email] || null;
        } catch { return null; }
    }

    function getUserTypes(user) {
        if (!user) return [];
        if (Array.isArray(user.audience_types) && user.audience_types.length) return user.audience_types;
        if (user.audience) return [user.audience];
        return [];
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function daysUntil(deadline) {
        if (!deadline) return null;
        const diff = (new Date(deadline) - new Date()) / 86400000;
        return Math.ceil(diff);
    }

    // Toggle state: include apeluri închise (persistat în localStorage)
    const INCLUDE_INACTIVE_KEY = 'grantio-include-inactive';
    function includeInactive() { return localStorage.getItem(INCLUDE_INACTIVE_KEY) === '1'; }
    function setIncludeInactive(v) { localStorage.setItem(INCLUDE_INACTIVE_KEY, v ? '1' : '0'); }

    // ── Apeluri eligibile pe MAI MULTE org_types (după profil) ──────────────
    async function renderEligibleCalls() {
        const container = document.querySelector('#recommended-calls');
        const badge = document.querySelector('#badge-org-type');
        if (!container) return;

        const user = currentUser();
        const types = getUserTypes(user);
        if (types.length === 0) {
            container.innerHTML = '<p class="dash-empty">⚠️ Tipul organizației nu e setat. <a href="#" data-tab="profile">Verifică profilul</a>.</p>';
            if (badge) badge.textContent = '—';
            return;
        }

        // Badge: arată toate tipurile active
        if (badge) {
            const badges = types.map(t => {
                const m = ORG_TYPE_LABELS[t] || { ro: t, icon: '📋' };
                return `${m.icon} ${m.ro}`;
            }).join(' · ');
            badge.textContent = badges;
        }

        container.innerHTML = '<p class="dash-empty">Se încarcă…</p>';
        try {
            // Fetch în paralel pentru fiecare tip — cu param include_inactive
            const qs = includeInactive() ? '?include_inactive=true' : '';
            const allResults = await Promise.all(types.map(async cat => {
                const res = await fetch(`${API_BASE}/calls/for-category/${cat}${qs}`);
                if (!res.ok) return { calls: [], count: 0, inactive_hidden: 0 };
                return res.json();
            }));

            // Merge & dedupe (un apel poate fi eligibil pentru multiple tipuri)
            const callMap = new Map();
            allResults.forEach((data, idx) => {
                (data.calls || []).forEach(c => {
                    if (!callMap.has(c.id)) {
                        callMap.set(c.id, { ...c, _matched_types: [types[idx]] });
                    } else {
                        callMap.get(c.id)._matched_types.push(types[idx]);
                    }
                });
            });

            let merged = Array.from(callMap.values());

            // Filter pe topic dacă selectat
            const activeTopic = selectedTopic();
            const beforeTopic = merged.length;
            if (activeTopic) {
                merged = merged.filter(c => (c.topics || []).includes(activeTopic));
            }

            if (merged.length === 0) {
                const topicNote = activeTopic
                    ? `<p class="dash-empty">Niciun apel pentru domeniul „<strong>${escapeHtml(activeTopic)}</strong>". <button type="button" class="link-btn" onclick="localStorage.removeItem('grantio-selected-topic'); window.location.reload()">Resetează filtru</button></p>`
                    : '<p class="dash-empty">Niciun apel activ momentan pentru tipurile tale de organizație.</p>';
                container.innerHTML = topicNote;
                return;
            }
            // Top 5 după deadline
            const calls = merged.sort((a, b) => {
                const da = daysUntil(a.deadline) ?? 99999;
                const db = daysUntil(b.deadline) ?? 99999;
                return da - db;
            }).slice(0, 5);

            // Sum inactive hidden across all type fetches (unique count approximation)
            const totalInactiveHidden = allResults.reduce((sum, r) => sum + (r.inactive_hidden || 0), 0);

            const toggleHtml = `
                <div class="active-filter-toggle">
                    <label>
                        <input type="checkbox" id="dash-toggle-inactive" ${includeInactive() ? 'checked' : ''}>
                        <span>Afișează și apelurile închise/finalizate</span>
                        ${!includeInactive() && totalInactiveHidden > 0
                            ? `<small class="filter-hint">(${totalInactiveHidden} ascunse pentru a evita pierdere de timp)</small>`
                            : ''}
                    </label>
                </div>
            `;

            const topicBadge = activeTopic
                ? `<div class="topic-filter-banner">🏷 Filtru domeniu: <strong>${escapeHtml(activeTopic)}</strong> (${merged.length} din ${beforeTopic})
                    <button type="button" class="link-btn-inline" id="clear-topic-filter">✕</button></div>`
                : '';

            container.innerHTML = toggleHtml + topicBadge + `
                <div class="dash-call-summary">
                    <strong>${merged.length}</strong> apeluri ${includeInactive() ? 'totale' : 'ACTIVE'} pentru tipurile tale (${types.length})${activeTopic ? ' filtrate pe domeniu' : ''} · top 5 după deadline:
                </div>
                <ul class="dash-call-list">
                    ${calls.map(c => {
                        const days = daysUntil(c.deadline);
                        const isInactive = c.is_active_2026 === false;
                        const urgentCls = isInactive ? 'inactive' : (days != null && days < 30 ? 'urgent' : (days != null && days < 90 ? 'soon' : ''));
                        const deadlineLabel = days != null ? (days < 0 ? 'EXPIRAT' : `${days} zile`) : c.deadline;
                        const matchedIcons = (c._matched_types || []).map(t => ORG_TYPE_LABELS[t]?.icon || '').join('');
                        const statusBadge = isInactive
                            ? `<span class="status-badge-inactive" title="${escapeHtml(c.status_note_ro || 'Apel închis')}">🔒 ÎNCHIS</span>`
                            : '';
                        return `
                            <li class="dash-call-item ${urgentCls}">
                                <div class="dash-call-title">
                                    ${statusBadge}
                                    ${escapeHtml(c.title)}
                                    <span class="dash-call-icons" title="Eligibil pentru: ${c._matched_types.join(', ')}">${matchedIcons}</span>
                                </div>
                                <div class="dash-call-meta">
                                    <span>📍 ${escapeHtml(c.funder_id?.toUpperCase() || '—')}</span>
                                    <span>⏰ ${escapeHtml(deadlineLabel)}</span>
                                    ${c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">Detalii oficiale →</a>` : ''}
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
            // Toggle bind
            const toggleCb = document.querySelector('#dash-toggle-inactive');
            if (toggleCb) {
                toggleCb.addEventListener('change', () => {
                    setIncludeInactive(toggleCb.checked);
                    renderEligibleCalls();
                    renderTopicChips();
                });
            }
            // Clear topic filter inline
            const clearTopicBtn = document.querySelector('#clear-topic-filter');
            if (clearTopicBtn) {
                clearTopicBtn.addEventListener('click', () => {
                    setSelectedTopic(null);
                    renderTopicChips();
                    renderEligibleCalls();
                });
            }
        } catch (err) {
            container.innerHTML = `<p class="dash-empty">⚠️ Eroare la încărcare. Pornește API-ul: <code>uvicorn api.main:app --port 8002</code></p>`;
        }
    }

    // ── Pricing din NUMĂR de tipuri activate ────────────────────────────────
    async function renderPricing() {
        const container = document.querySelector('#dash-pricing');
        if (!container) return;

        const user = currentUser();
        const types = getUserTypes(user);
        if (types.length === 0) {
            container.innerHTML = '<p class="dash-empty">Tipul organizației nu e setat.</p>';
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/pricing/compute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity_types: types }),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const plan = await res.json();
            const savings = plan.savings_vs_separate;
            const savingsHtml = savings && savings.savings_monthly_eur > 0
                ? `<div class="pricing-savings">💰 Economisești <strong>${savings.savings_monthly_eur} €/lună</strong> (${savings.savings_pct}%) vs. abonament separat pentru fiecare tip</div>`
                : '';
            container.innerHTML = `
                <div class="pricing-row">
                    <span class="pricing-label">Plan:</span>
                    <strong>${escapeHtml(plan.label_ro)}</strong>
                </div>
                <div class="pricing-amount">${plan.monthly_eur} <small>€/lună</small></div>
                <div class="pricing-basis">${escapeHtml(plan.description_ro)}</div>
                <div class="pricing-types">${plan.entity_types.map(t => {
                    const m = ORG_TYPE_LABELS[t] || { ro: t, icon: '📋' };
                    return `<span class="pricing-type-pill">${m.icon} ${m.ro}</span>`;
                }).join('')}</div>
                ${savingsHtml}
                <div class="pricing-tier-ladder">
                    <strong>Trepte:</strong>
                    <span class="tier-step ${plan.entity_count === 1 ? 'active' : ''}">1 tip = 20€</span>
                    <span class="tier-step ${plan.entity_count === 2 ? 'active' : ''}">2 tipuri = 30€</span>
                    <span class="tier-step ${plan.entity_count === 3 ? 'active' : ''}">3 tipuri = 45€</span>
                </div>
                <div class="pricing-annual">Anual: ${plan.annual_eur} € · cu reducere 17% = <strong>${plan.annual_with_17pct_discount_eur} €</strong></div>
                <div class="pricing-actions">
                    <button class="btn btn-primary btn-sm" disabled title="Stripe checkout — TODO">💳 Activează abonament ${plan.monthly_eur}€/lună</button>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<p class="dash-empty">⚠️ Tarif nedisponibil offline.</p>`;
        }
    }

    // ── Topic chips filtrate pe profil ─────────────────────────────────────
    const SELECTED_TOPIC_KEY = 'grantio-selected-topic';
    function selectedTopic() { return localStorage.getItem(SELECTED_TOPIC_KEY) || null; }
    function setSelectedTopic(t) {
        if (t) localStorage.setItem(SELECTED_TOPIC_KEY, t);
        else localStorage.removeItem(SELECTED_TOPIC_KEY);
    }

    async function renderTopicChips() {
        const container = document.querySelector('#dash-topic-chips');
        if (!container) return;
        const user = currentUser();
        const types = getUserTypes(user);
        if (types.length === 0) {
            container.innerHTML = '<p class="dash-empty">Setează tipul organizației în profil.</p>';
            return;
        }
        const qs = new URLSearchParams({
            org_categories: types.join(','),
            include_inactive: includeInactive() ? 'true' : 'false',
        });
        try {
            const res = await fetch(`${API_BASE}/calls/topics/counts?${qs}`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (!data.topics || data.topics.length === 0) {
                container.innerHTML = '<p class="dash-empty">Niciun domeniu disponibil.</p>';
                return;
            }
            const active = selectedTopic();
            const chips = data.topics.map(t => {
                const icon = TOPIC_ICONS[t.name] || '🏷';
                const isActive = active === t.name;
                return `
                    <button type="button" class="topic-chip ${isActive ? 'topic-chip-active' : ''}" data-topic="${escapeHtml(t.name)}">
                        <span class="topic-icon">${icon}</span>
                        <span class="topic-name">${escapeHtml(t.name)}</span>
                        <span class="topic-count">${t.count}</span>
                    </button>
                `;
            }).join('');
            const clearBtn = active
                ? `<button type="button" class="topic-chip topic-chip-clear" data-topic="">✕ Resetează filtru "${escapeHtml(active)}"</button>`
                : '';
            container.innerHTML = chips + clearBtn;

            container.querySelectorAll('.topic-chip').forEach(b => {
                b.addEventListener('click', () => {
                    const t = b.dataset.topic;
                    setSelectedTopic(t === selectedTopic() ? null : t);  // toggle
                    renderTopicChips();
                    renderEligibleCalls();  // re-render list cu noul filter
                });
            });
        } catch (err) {
            container.innerHTML = '<p class="dash-empty">⚠️ Eroare la încărcarea domeniilor.</p>';
        }
    }

    // ── Boot ────────────────────────────────────────────────────────────────
    function init() {
        renderEligibleCalls();
        renderPricing();
        renderTopicChips();

        // Refresh when dashboard tab opened sau profil actualizat
        document.querySelectorAll('[data-tab="dashboard"]').forEach(b => {
            b.addEventListener('click', () => {
                setTimeout(() => { renderEligibleCalls(); renderPricing(); renderTopicChips(); }, 100);
            });
        });
        document.addEventListener('grantio:profile-updated', () => {
            renderEligibleCalls();
            renderPricing();
            renderTopicChips();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // small delay so cabinet.js initializes session first
        setTimeout(init, 200);
    }
})();
