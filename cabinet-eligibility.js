// ============ Grantio Eligibility — Cabinet tab integration ============
// Reads form input → POST /eligibility/scan → renders verdict cards.
// Requires Grantio Eligibility API running locally (uvicorn api.main:app --port 8001).

(function() {
    'use strict';

    // Configure once per deployment:
    //   local dev → http://localhost:8001
    //   production → https://api.grantio.io
    const API_BASE = (window.GRANTIO_API_BASE || 'http://localhost:8001').replace(/\/$/, '');

    // Centralized doc catalog — IDs match calls.json `required_documents.id`.
    // Adding a new document here makes it selectable in the form.
    const DOC_CATALOG = [
        { id: 'extras_registru_comercial', label: 'Extras Registru de Stat (persoane juridice)' },
        { id: 'extras_registru_ong', label: 'Extras Registru de Stat (ONG non-profit)' },
        { id: 'extras_registru', label: 'Extras Registru de Stat (generic)' },
        { id: 'buletin_identitate', label: 'Buletin de identitate (copie)' },
        { id: 'plan_afaceri', label: 'Plan de afaceri' },
        { id: 'plan_afaceri_agricol', label: 'Plan de afaceri agricol' },
        { id: 'plan_investitional', label: 'Plan investițional' },
        { id: 'buget_detaliat', label: 'Buget detaliat al proiectului' },
        { id: 'declaratie_tva_12luni', label: 'Declarații TVA 12 luni' },
        { id: 'situatii_financiare', label: 'Situații financiare auditate' },
        { id: 'oferta_furnizor', label: 'Ofertă / cotație furnizor' },
        { id: 'dovada_cofinantare', label: 'Dovada cofinanțării' },
        { id: 'dovada_terenuri', label: 'Dovada deținerii terenurilor' },
        { id: 'dovada_munca_strainatate', label: 'Dovadă muncă în străinătate / remitențe' },
        { id: 'acord_instruire', label: 'Acord pentru instruire' },
        { id: 'diploma_studii', label: 'Diplomă studii relevante' },
        { id: 'audit_energetic', label: 'Audit energetic' },
        { id: 'oferta_tehnica', label: 'Ofertă tehnică (echipamente RE)' },
        { id: 'decizia_consiliu_local', label: 'Decizia Consiliului Local' },
        { id: 'studiu_fezabilitate', label: 'Studiu de fezabilitate' },
        { id: 'plan_strategic_local', label: 'Plan strategic local' },
        { id: 'matricea_log_frame', label: 'Matricea logică (log-frame)' },
        { id: 'plan_monitorizare', label: 'Plan M&E' },
        { id: 'statut_ong', label: 'Statutul ONG-ului' },
        { id: 'raport_activitate_2ani', label: 'Rapoarte activitate ultimii 2 ani' },
        { id: 'raport_activitate_3ani', label: 'Rapoarte activitate ultimii 3 ani' },
        { id: 'pitch_deck', label: 'Pitch deck' },
        { id: 'echipa_cv', label: 'CV-uri echipa fondatoare' },
        { id: 'mvp_demo', label: 'Demo MVP / validare piață' },
        { id: 'plan_crestere', label: 'Plan de creștere 3 ani' },
        { id: 'due_diligence_compliance', label: 'Declarații compliance donator' },
        { id: 'prior_donor_references', label: 'Referințe de la donatori anteriori' },
        { id: 'concept_note', label: 'Concept note' },
        { id: 'studiu_baseline', label: 'Studiu baseline pentru indicatori' },
        { id: 'scrisoare_suport_apl', label: 'Scrisoare suport APL' },
    ];

    const STATUS_META = {
        eligible:    { label: 'ELIGIBIL',   icon: '✓', cssClass: 'verdict-eligible'   },
        partial:     { label: 'PARȚIAL',    icon: '◐', cssClass: 'verdict-partial'    },
        ineligible:  { label: 'INELIGIBIL', icon: '✗', cssClass: 'verdict-ineligible' },
    };

    const $ = sel => document.querySelector(sel);

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // ── Init document checkboxes ────────────────────────────────────────────
    function renderDocGrid() {
        const grid = $('#elig-doc-grid');
        if (!grid) return;
        grid.innerHTML = DOC_CATALOG.map(d => `
            <label class="elig-doc-chip">
                <input type="checkbox" name="doc" value="${escapeHtml(d.id)}">
                <span>${escapeHtml(d.label)}</span>
            </label>
        `).join('');
    }

    // ── API health check ────────────────────────────────────────────────────
    async function checkApiHealth() {
        const statusEl = $('#elig-api-status');
        if (!statusEl) return;
        try {
            const res = await fetch(`${API_BASE}/`, { method: 'GET' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            statusEl.innerHTML = `✅ Conectat la Grantio API · ${data.calls_loaded} apeluri în catalog · <a href="${API_BASE}/docs" target="_blank">Swagger UI</a>`;
            statusEl.classList.add('elig-api-ok');
        } catch (err) {
            statusEl.innerHTML = `⚠️ Grantio API nu răspunde la <code>${API_BASE}</code>. Pornește local cu: <code>uvicorn api.main:app --reload --port 8001</code> din folder-ul <code>grantio-eligibility/</code>.`;
            statusEl.classList.add('elig-api-error');
        }
    }

    // ── Form → ApplicantProfile payload ─────────────────────────────────────
    function buildProfile(form) {
        const fd = new FormData(form);
        const get = (name) => {
            const v = fd.get(name);
            return v === null || v === '' ? null : v;
        };
        const getNum = (name) => {
            const v = get(name);
            return v == null ? null : Number(v);
        };
        const sectorsRaw = get('sectors');
        const sectors = sectorsRaw
            ? sectorsRaw.toString().split(',').map(s => s.trim()).filter(Boolean)
            : [];
        const availableDocs = fd.getAll('doc').map(String);

        // Build payload — only include fields the user filled in (let Pydantic defaults handle the rest).
        const profile = {
            entity_type: get('entity_type'),
            country_registration: get('country_registration') || 'MD',
            country_citizenship: get('country_citizenship') || 'MD',
            sectors,
            available_docs: availableDocs,
            prior_eu_projects: getNum('prior_eu_projects') ?? 0,
        };

        // Helper for tri-state checkbox (checked=true, unchecked=null which lets engine skip rule)
        const cb = (name) => fd.get(name) === 'on' ? true : null;

        // Optional fields — include only if filled
        const optional = {
            // Basics
            founder_age: getNum('founder_age'),
            founder_gender: get('founder_gender'),
            months_since_founding: getNum('months_since_founding'),
            annual_turnover_mdl: getNum('annual_turnover_mdl'),
            staff_count: getNum('staff_count'),
            own_investment_mdl: getNum('own_investment_mdl'),
            activity_type: get('activity_type'),
            project_subcategory: get('project_subcategory'),
            is_diaspora_returnee: cb('is_diaspora_returnee'),
            has_remittance_experience: cb('has_remittance_experience'),
            can_cofinance: cb('can_cofinance'),
            accepts_mandatory_training: cb('accepts_mandatory_training'),

            // Agriculture (AIPA)
            agricultural_land_ha: getNum('agricultural_land_ha'),
            land_tenure_years_secured: getNum('land_tenure_years_secured'),
            subprogram_target: get('subprogram_target'),
            has_ansa_registration: cb('has_ansa_registration'),
            is_first_time_farmer: cb('is_first_time_farmer'),
            has_agricultural_education: cb('has_agricultural_education'),

            // APL / Public
            has_strategic_local_dev_plan: cb('has_strategic_local_dev_plan'),
            has_local_council_decision: cb('has_local_council_decision'),
            prior_eu_audit_findings: cb('prior_eu_audit_findings'),

            // Startup
            team_size_founders: getNum('team_size_founders'),
            ip_protection_status: get('ip_protection_status'),
            has_mvp_or_validation: cb('has_mvp_or_validation'),

            // Maturity
            prior_grant_completed_count: getNum('prior_grant_completed_count'),
            prior_donor_count: getNum('prior_donor_count'),
            audited_financials_years: getNum('audited_financials_years'),

            // USAID
            has_duns_number: cb('has_duns_number'),
            usaid_compliance_signed: cb('usaid_compliance_signed'),
            is_export_oriented: cb('is_export_oriented'),

            // Community / Climate
            project_duration_months: getNum('project_duration_months'),
            has_apl_support_letter: cb('has_apl_support_letter'),
            community_engagement_plan: cb('community_engagement_plan'),
            has_baseline_measurement_plan: cb('has_baseline_measurement_plan'),
            climate_indicator_smart: cb('climate_indicator_smart'),
        };
        for (const [k, v] of Object.entries(optional)) {
            if (v !== null && v !== '') profile[k] = v;
        }
        return profile;
    }

    // ── Render verdict cards ────────────────────────────────────────────────
    function renderResults(verdicts) {
        const summary = $('#elig-summary');
        const list = $('#elig-verdicts');
        const wrap = $('#elig-results');
        wrap.hidden = false;

        const counts = { eligible: 0, partial: 0, ineligible: 0 };
        verdicts.forEach(v => counts[v.status]++);
        summary.innerHTML = `
            <h3>${verdicts.length} apeluri analizate</h3>
            <div class="elig-counters">
                <span class="cnt cnt-eligible">✓ ${counts.eligible} eligibil${counts.eligible === 1 ? '' : 'e'}</span>
                <span class="cnt cnt-partial">◐ ${counts.partial} parțial${counts.partial === 1 ? '' : 'e'}</span>
                <span class="cnt cnt-ineligible">✗ ${counts.ineligible} ineligibil${counts.ineligible === 1 ? '' : 'e'}</span>
            </div>
        `;

        list.innerHTML = verdicts.map(v => renderVerdictCard(v)).join('');
        wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderVerdictCard(v) {
        const meta = STATUS_META[v.status];
        const failedHtml = v.failed_hard_rules.length
            ? `<details class="verdict-details">
                <summary>⚠️ ${v.failed_hard_rules.length} criteriu/criterii neîndeplinit(e)</summary>
                <ul>${v.failed_hard_rules.map(r => `
                    <li><strong>${escapeHtml(r.description)}</strong>${r.reason ? `<br><small>${escapeHtml(r.reason)}</small>` : ''}</li>
                `).join('')}</ul>
            </details>` : '';
        const docsHtml = v.missing_documents.length
            ? `<details class="verdict-details">
                <summary>📎 ${v.missing_documents.length} document(e) de pregătit</summary>
                <ul>${v.missing_documents.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
            </details>` : '';
        const suggHtml = v.suggestions.length
            ? `<div class="verdict-suggestions">
                <strong>💡 Sugestii:</strong>
                <ul>${v.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
            </div>` : '';

        return `
            <article class="verdict-card ${meta.cssClass}">
                <header class="verdict-head">
                    <span class="verdict-badge">${meta.icon} ${meta.label}</span>
                    <span class="verdict-score">Reguli: ${escapeHtml(v.hard_score)}</span>
                </header>
                <h4 class="verdict-title">${escapeHtml(v.call_title)}</h4>
                ${failedHtml}
                ${docsHtml}
                ${suggHtml}
            </article>
        `;
    }

    // ── Submit handler ──────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const profile = buildProfile(form);

        if (!profile.entity_type) {
            alert('Selectează tipul entității înainte de verificare.');
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Se verifică…';

        try {
            const res = await fetch(`${API_BASE}/eligibility/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.detail || `HTTP ${res.status}`);
            }
            const verdicts = await res.json();
            renderResults(verdicts);
        } catch (err) {
            alert(`Eroare la verificare: ${err.message}\n\nVerifică că Grantio API rulează la ${API_BASE}.`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    // ── Reset ───────────────────────────────────────────────────────────────
    function handleReset() {
        const form = $('#form-eligibility');
        if (form) form.reset();
        const results = $('#elig-results');
        if (results) results.hidden = true;
    }

    // ── Boot ────────────────────────────────────────────────────────────────
    function init() {
        renderDocGrid();
        checkApiHealth();
        const form = $('#form-eligibility');
        if (form) form.addEventListener('submit', handleSubmit);
        const resetBtn = $('#elig-reset');
        if (resetBtn) resetBtn.addEventListener('click', handleReset);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
