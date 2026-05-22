// GrantsHub Moldova – Admin panel (client-side, localStorage + JSON I/O)
(function() {
    'use strict';

    const STORAGE_KEY = 'grantshub_data_v2';
    const DEFAULTS = window.GRANTSHUB_DATA;
    const TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);

    let CALLS = [];
    let FUNDERS = {};
    let TOPICS = {};

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    function loadData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const p = JSON.parse(stored);
                if (p.CALLS && p.FUNDERS) {
                    CALLS = p.CALLS;
                    FUNDERS = p.FUNDERS;
                    TOPICS = p.TOPICS || DEFAULTS.TOPICS;
                    return;
                }
            }
        } catch (e) { console.warn(e); }
        CALLS = [...DEFAULTS.CALLS];
        FUNDERS = { ...DEFAULTS.FUNDERS };
        TOPICS = { ...DEFAULTS.TOPICS };
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ CALLS, FUNDERS, TOPICS }));
            status('✓ Salvat în browser (localStorage)', false);
        } catch (e) {
            status('✗ Eroare la salvare: ' + e.message, true);
        }
    }

    function status(msg, isError) {
        const el = $('#status');
        el.textContent = msg;
        el.classList.toggle('error', !!isError);
        setTimeout(() => { el.textContent = ''; }, 3500);
    }

    function computeStatus(c) {
        const deadline = new Date(c.deadline);
        deadline.setHours(23, 59, 59, 999);
        const opens = new Date(c.opensOn);
        opens.setHours(0, 0, 0, 0);
        const daysToDeadline = Math.ceil((deadline - TODAY) / (24 * 60 * 60 * 1000));
        if (deadline < TODAY) return { status: 'closed', days: daysToDeadline };
        if (opens > TODAY) return { status: 'upcoming', days: daysToDeadline };
        if (c.deadlineType === 'rolling') return { status: 'rolling', days: daysToDeadline };
        if (c.deadlineType === 'expected') return { status: 'expected', days: daysToDeadline };
        if (daysToDeadline <= 14) return { status: 'closing-soon', days: daysToDeadline };
        return { status: 'open', days: daysToDeadline };
    }

    // ---------- Render ----------
    function renderTable() {
        const tbody = $('#rows');
        $('#count').textContent = CALLS.length;

        const sorted = [...CALLS].sort((a, b) => {
            const sa = computeStatus(a), sb = computeStatus(b);
            const order = { 'closing-soon': 0, 'open': 1, 'expected': 2, 'rolling': 3, 'upcoming': 4, 'closed': 5 };
            const oa = order[sa.status], ob = order[sb.status];
            if (oa !== ob) return oa - ob;
            return sa.days - sb.days;
        });

        tbody.innerHTML = sorted.map(c => {
            const s = computeStatus(c);
            const funder = FUNDERS[c.funderId] || { name: '?' };
            const auds = (c.audiences || []).map(a => `<span class="tag aud-${a}">${a}</span>`).join(' ');
            const deadlineDisplay = c.deadlineType === 'rolling' ? 'Rolling'
                : c.deadlineType === 'expected' ? `Așteptat ${c.deadline}`
                : `${c.deadline} (${s.days} zile)`;
            const statusLabel = ({
                'closing-soon': 'Se închide',
                'open': 'Deschis',
                'rolling': 'Rolling',
                'expected': 'Așteptat',
                'upcoming': 'Viitor',
                'closed': 'Închis'
            })[s.status];
            const autoBadge = c.autoDetected ? '<span class="auto-badge" title="Detectat automat — necesită revizuire">AUTO</span>' : '';
            return `
                <tr class="${c.autoDetected ? 'row-auto' : ''}">
                    <td><span class="status-pill ${s.status}">${statusLabel}</span>${autoBadge}</td>
                    <td class="td-title">${escapeHtml(c.title)}<small>id: ${escapeHtml(c.id)}</small></td>
                    <td>${escapeHtml(funder.name)}</td>
                    <td>${escapeHtml(deadlineDisplay)}</td>
                    <td>${auds}</td>
                    <td>
                        <div class="row-actions">
                            <button data-action="edit" data-id="${escapeAttr(c.id)}">Editează</button>
                            <button data-action="delete" data-id="${escapeAttr(c.id)}" class="danger">Șterge</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        $$('button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (btn.dataset.action === 'edit') openForm(id);
                else if (btn.dataset.action === 'delete') deleteCall(id);
            });
        });
    }

    function deleteCall(id) {
        const c = CALLS.find(x => x.id === id);
        if (!c) return;
        if (!confirm(`Sigur ștergi apelul "${c.title}"?`)) return;
        CALLS = CALLS.filter(x => x.id !== id);
        saveData();
        renderTable();
    }

    // ---------- Form ----------
    function openForm(id) {
        const isNew = !id;
        const c = isNew ? blankCall() : CALLS.find(x => x.id === id);
        if (!c) return;

        $('#form-title').textContent = isNew ? 'Apel nou' : `Editează apel: ${c.title}`;

        // Populate funder select
        const funderSel = $('#funder-select');
        funderSel.innerHTML = Object.values(FUNDERS).map(f =>
            `<option value="${escapeAttr(f.id)}">${escapeHtml(f.name)}</option>`
        ).join('');

        // Populate topic checks
        const topicWrap = $('#topic-checks');
        topicWrap.innerHTML = Object.entries(TOPICS).map(([t, ic]) => `
            <label class="check">
                <input type="checkbox" name="topics" value="${escapeAttr(t)}">
                ${ic} ${escapeHtml(t)}
            </label>
        `).join('');

        // Fill form
        const form = $('#call-form');
        form.dataset.editingId = isNew ? '' : id;

        const fields = ['id', 'title', 'funderId', 'type', 'opensOn', 'deadline', 'deadlineType', 'deadlineNote', 'url', 'description', 'budgetTotal', 'budgetPerProject', 'verified', 'verifiedSource'];
        fields.forEach(f => {
            const el = form.elements[f];
            if (el) el.value = c[f] || '';
        });
        form.elements.eligibility.value = (c.eligibility || []).join('\n');

        $$('input[name="audiences"]', form).forEach(cb => {
            cb.checked = (c.audiences || []).includes(cb.value);
        });
        $$('input[name="topics"]', form).forEach(cb => {
            cb.checked = (c.topics || []).includes(cb.value);
        });

        // disable id field on edit
        form.elements.id.disabled = !isNew;

        $('#edit-modal').hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function blankCall() {
        return {
            id: '',
            title: '',
            funderId: Object.keys(FUNDERS)[0] || '',
            type: 'Grant',
            opensOn: TODAY.toISOString().slice(0, 10),
            deadline: '',
            deadlineType: 'fixed',
            deadlineNote: '',
            url: '',
            description: '',
            budgetTotal: '',
            budgetPerProject: '',
            audiences: [],
            topics: [],
            eligibility: [],
            verified: TODAY.toISOString().slice(0, 10),
            verifiedSource: ''
        };
    }

    function closeForm() {
        $('#edit-modal').hidden = true;
        document.body.style.overflow = '';
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const editingId = form.dataset.editingId;

        const fd = new FormData(form);
        const id = (editingId || fd.get('id')).toString().trim();

        if (!editingId && CALLS.some(c => c.id === id)) {
            status(`✗ ID-ul "${id}" există deja`, true);
            return;
        }

        const call = {
            id,
            title: fd.get('title').toString().trim(),
            funderId: fd.get('funderId').toString(),
            type: fd.get('type').toString(),
            opensOn: fd.get('opensOn').toString(),
            deadline: fd.get('deadline').toString(),
            deadlineType: fd.get('deadlineType').toString(),
            deadlineNote: fd.get('deadlineNote').toString().trim(),
            url: fd.get('url').toString().trim(),
            description: fd.get('description').toString().trim(),
            budgetTotal: fd.get('budgetTotal').toString().trim(),
            budgetPerProject: fd.get('budgetPerProject').toString().trim(),
            audiences: fd.getAll('audiences').map(a => a.toString()),
            topics: fd.getAll('topics').map(t => t.toString()),
            eligibility: fd.get('eligibility').toString().split('\n').map(l => l.trim()).filter(Boolean),
            verified: fd.get('verified').toString() || TODAY.toISOString().slice(0, 10),
            verifiedSource: fd.get('verifiedSource').toString().trim()
        };

        if (editingId) {
            const i = CALLS.findIndex(c => c.id === editingId);
            // On save, clear autoDetected flag — entry becomes visible to public
            CALLS[i] = call;
        } else {
            CALLS.push(call);
        }

        saveData();
        renderTable();
        closeForm();
    }

    // ---------- Export / Import ----------
    function exportJSON() {
        const data = { CALLS, FUNDERS, TOPICS };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grantshub-data-${TODAY.toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        status('⇣ Export descărcat. Înlocuiește data.js cu acest fișier pentru deploy permanent.', false);
    }

    function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!parsed.CALLS) throw new Error('Format invalid (lipsă CALLS)');

                // Merge strategy: add new calls (skip duplicates by ID), add new funders (skip existing keys)
                const existingIds = new Set(CALLS.map(c => c.id));
                const newCalls = parsed.CALLS.filter(c => !existingIds.has(c.id));
                const duplicates = parsed.CALLS.length - newCalls.length;

                let newFunders = 0;
                if (parsed.FUNDERS) {
                    for (const [k, v] of Object.entries(parsed.FUNDERS)) {
                        if (!FUNDERS[k]) { FUNDERS[k] = v; newFunders++; }
                    }
                }

                const msg = `Importez ${newCalls.length} apel(uri) noi` +
                    (duplicates > 0 ? ` (${duplicates} duplicat(e) ignorat(e))` : '') +
                    (newFunders > 0 ? ` + ${newFunders} finanțator(i) nou(i)` : '') +
                    `. Apelurile existente sunt păstrate. OK?`;
                if (!confirm(msg)) return;

                CALLS = CALLS.concat(newCalls);
                saveData();
                renderTable();
                status(`✓ +${newCalls.length} apeluri, +${newFunders} finanțatori. ${duplicates} duplicat(e) ignorat(e).`, false);
            } catch (err) {
                status('✗ Import eșuat: ' + err.message, true);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function resetData() {
        if (!confirm('Restaurez datele inițiale din data.js? Modificările locale se vor pierde.')) return;
        localStorage.removeItem(STORAGE_KEY);
        CALLS = [...DEFAULTS.CALLS];
        FUNDERS = { ...DEFAULTS.FUNDERS };
        TOPICS = { ...DEFAULTS.TOPICS };
        renderTable();
        status('↺ Date restaurate din data.js', false);
    }

    function downloadAllICS() {
        const fixed = CALLS.filter(c => c.deadlineType === 'fixed' && computeStatus(c).status !== 'closed');
        if (fixed.length === 0) { status('Nu sunt apeluri cu deadline fix', true); return; }

        const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GrantsHub Moldova//RO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
        fixed.forEach(c => {
            const funder = FUNDERS[c.funderId] || { name: '?' };
            const date = c.deadline.replace(/-/g, '');
            lines.push('BEGIN:VEVENT');
            lines.push(`UID:${c.id}@grantshub.md`);
            lines.push(`DTSTAMP:${formatICS(new Date())}`);
            lines.push(`DTSTART;VALUE=DATE:${date}`);
            lines.push(`DTEND;VALUE=DATE:${date}`);
            lines.push(`SUMMARY:${escICS('[Deadline] ' + c.title)}`);
            lines.push(`DESCRIPTION:${escICS('Finanțator: ' + funder.name + '\\n\\n' + c.description + '\\n\\nAplică: ' + c.url)}`);
            lines.push(`URL:${c.url}`);
            lines.push('BEGIN:VALARM');
            lines.push('TRIGGER:-P7D');
            lines.push('ACTION:DISPLAY');
            lines.push(`DESCRIPTION:${escICS('Apel se închide într-o săptămână: ' + c.title)}`);
            lines.push('END:VALARM');
            lines.push('END:VEVENT');
        });
        lines.push('END:VCALENDAR');

        const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'grantshub-moldova-deadlines.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        status(`📅 Calendar exportat (${fixed.length} apeluri)`, false);
    }

    function formatICS(d) {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    }
    function escICS(s) {
        return String(s).replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function escapeAttr(s) { return escapeHtml(s); }

    // ---------- Init ----------
    function init() {
        loadData();
        renderTable();

        $('#btn-new').addEventListener('click', () => openForm(null));
        $('#btn-export').addEventListener('click', exportJSON);
        $('#file-import').addEventListener('change', handleImport);
        $('#btn-reset').addEventListener('click', resetData);
        $('#btn-download-ics').addEventListener('click', downloadAllICS);

        $('#call-form').addEventListener('submit', handleFormSubmit);
        $$('[data-close]').forEach(el => el.addEventListener('click', closeForm));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeForm(); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
