// GrantsHub Moldova – Public app logic (apeluri deschise + calendar)
(function() {
    'use strict';

    const STORAGE_KEY = 'grantshub_data_v2';
    const CLOSING_SOON_DAYS = 14;

    // Load data: prefer localStorage (admin edits), fallback to data.js
    function loadData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.CALLS && parsed.FUNDERS) return parsed;
            }
        } catch (e) {
            console.warn('localStorage parse failed, using defaults', e);
        }
        return window.GRANTSHUB_DATA;
    }

    const data = loadData();
    const TOPICS = data.TOPICS;
    const FUNDERS = data.FUNDERS;
    let CALLS = data.CALLS;

    const TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);

    const state = {
        audience: 'all',
        urgency: 'all',
        type: 'all',
        topic: null,
        search: ''
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function init() {
        // Filter out auto-detected entries (visible only in admin until reviewed)
        CALLS = CALLS.filter(c => !c.autoDetected);

        // Compute status & days remaining for each call
        CALLS = CALLS.map(c => {
            const deadline = new Date(c.deadline);
            deadline.setHours(23, 59, 59, 999);
            const opens = new Date(c.opensOn);
            opens.setHours(0, 0, 0, 0);
            const msPerDay = 24 * 60 * 60 * 1000;
            const daysToDeadline = Math.ceil((deadline - TODAY) / msPerDay);

            let status;
            if (deadline < TODAY) status = 'closed';
            else if (c.deadlineType === 'rolling') status = 'rolling';
            else if (c.deadlineType === 'expected') status = 'expected';
            else if (opens > TODAY) status = 'upcoming';
            else if (daysToDeadline <= CLOSING_SOON_DAYS) status = 'closing-soon';
            else status = 'open';

            return { ...c, computedStatus: status, daysToDeadline };
        }).filter(c => c.computedStatus !== 'closed'); // Hide closed

        renderStats();
        renderTopicChips();
        renderCards();
        attachEvents();
    }

    // ---------- Stats ----------
    function renderStats() {
        // Every visible call (CALLS already filters autoDetected and closed)
        const total = CALLS.length;
        const soon = CALLS.filter(c => c.computedStatus === 'closing-soon').length;
        const rolling = CALLS.filter(c => c.computedStatus === 'rolling').length;
        const funderIds = new Set(CALLS.map(c => c.funderId));
        $('#stat-open').textContent = total;
        $('#stat-soon').textContent = soon;
        $('#stat-rolling').textContent = rolling;
        $('#stat-funders').textContent = funderIds.size;

        $('#badge-text').textContent = `${total} apeluri active · ${soon} se închid în mai puțin de 14 zile`;

        // Update audience card counts
        ['ONG', 'IMM', 'Public', 'APL'].forEach(a => {
            const n = CALLS.filter(c => c.audiences.includes(a)).length;
            const el = $(`[data-aud-count="${a}"]`);
            if (el) el.textContent = `${n} apeluri →`;
        });
    }

    // ---------- Topic chips ----------
    function renderTopicChips() {
        const container = $('#topic-chips');
        const counts = {};
        Object.keys(TOPICS).forEach(t => {
            counts[t] = CALLS.filter(c => c.topics.includes(t)).length;
        });
        const sorted = Object.entries(TOPICS)
            .filter(([t]) => counts[t] > 0)
            .sort((a, b) => counts[b[0]] - counts[a[0]]);

        container.innerHTML = sorted.map(([topic, icon]) => `
            <button class="topic-chip" data-topic="${topic}">
                <span>${icon} ${topic}</span>
                <span class="count">${counts[topic]}</span>
            </button>
        `).join('');

        $$('.topic-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const topic = btn.dataset.topic;
                if (state.topic === topic) {
                    state.topic = null;
                    btn.classList.remove('active');
                } else {
                    $$('.topic-chip').forEach(b => b.classList.remove('active'));
                    state.topic = topic;
                    btn.classList.add('active');
                }
                document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
                renderCards();
            });
        });
    }

    // ---------- Cards ----------
    function renderCards() {
        const filtered = CALLS.filter(c => {
            if (state.audience !== 'all' && !c.audiences.includes(state.audience)) return false;
            if (state.type !== 'all' && c.type !== state.type) return false;
            if (state.topic && !c.topics.includes(state.topic)) return false;
            if (state.urgency !== 'all') {
                if (state.urgency === 'closing-soon' && c.computedStatus !== 'closing-soon') return false;
                if (state.urgency === 'open' && !['open', 'expected'].includes(c.computedStatus)) return false;
                if (state.urgency === 'rolling' && c.computedStatus !== 'rolling') return false;
            }
            if (state.search) {
                const q = state.search.toLowerCase();
                const funder = FUNDERS[c.funderId] || {};
                const hay = (c.title + ' ' + funder.name + ' ' + c.description + ' ' + c.topics.join(' ')).toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        // Sort: closing-soon first, then open by deadline, then rolling/expected last
        const order = { 'closing-soon': 0, 'open': 1, 'expected': 2, 'rolling': 3 };
        filtered.sort((a, b) => {
            const oa = order[a.computedStatus] ?? 4;
            const ob = order[b.computedStatus] ?? 4;
            if (oa !== ob) return oa - ob;
            return a.daysToDeadline - b.daysToDeadline;
        });

        const container = $('#cards-container');
        const empty = $('#empty-state');
        $('#result-count').textContent = `${filtered.length} apeluri active corespund filtrelor.`;

        if (filtered.length === 0) {
            container.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        container.innerHTML = filtered.map(c => renderCard(c)).join('');

        $$('.card').forEach(card => {
            card.addEventListener('click', e => {
                if (e.target.closest('a, .card-action-btn')) return;
                openModal(card.dataset.id);
            });
        });
        $$('.card-cal-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                downloadICS([CALLS.find(c => c.id === btn.dataset.id)]);
            });
        });
    }

    function renderCard(c) {
        const funder = FUNDERS[c.funderId] || { name: 'Necunoscut', short: '?', logoColor: 'navy' };
        const audTags = c.audiences.map(a => `<span class="tag aud-${a}">${a}</span>`).join('');
        const topicTags = c.topics.slice(0, 2).map(t => `<span class="tag">${TOPICS[t] || ''} ${t}</span>`).join('');
        const statusBadge = statusBadgeHtml(c);
        const deadlineDisplay = formatDeadline(c);

        return `
            <article class="card status-${c.computedStatus}" data-id="${c.id}">
                ${statusBadge}
                <div class="card-head">
                    <div class="card-logo ${funder.logoColor || ''}">${escapeHtml(funder.short)}</div>
                    <div class="card-title">
                        <div class="card-funder">${escapeHtml(funder.name)}</div>
                        <h3>${escapeHtml(c.title)}</h3>
                    </div>
                </div>
                <div class="card-deadline">${deadlineDisplay}</div>
                <p class="card-desc">${escapeHtml(c.description)}</p>
                <div class="card-tags">${audTags}${topicTags}</div>
                <div class="card-foot">
                    <a href="${escapeAttr(c.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Aplică ↗</a>
                    <button class="card-cal-btn card-action-btn" data-id="${c.id}" title="Adaugă în calendar">📅 .ics</button>
                </div>
            </article>
        `;
    }

    function statusBadgeHtml(c) {
        const map = {
            'closing-soon': { cls: 'urgent', text: `🔥 Se închide în ${c.daysToDeadline} zile` },
            'open': { cls: 'open', text: '● Deschis' },
            'rolling': { cls: 'rolling', text: '↻ Rolling / permanent' },
            'expected': { cls: 'expected', text: '◷ Așteptat' },
            'upcoming': { cls: 'upcoming', text: '◷ Se deschide' }
        };
        const s = map[c.computedStatus] || { cls: 'open', text: '● Deschis' };
        return `<span class="status-badge ${s.cls}">${s.text}</span>`;
    }

    function formatDeadline(c) {
        if (c.deadlineType === 'rolling') {
            return `<strong>Rolling</strong> · ${escapeHtml(c.deadlineNote || 'Apel deschis permanent')}`;
        }
        if (c.deadlineType === 'expected') {
            return `<strong>Așteptat:</strong> ${escapeHtml(c.deadlineNote || 'Vezi site oficial')}`;
        }
        const d = new Date(c.deadline);
        const dateStr = d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
        const days = c.daysToDeadline;
        const urgency = days <= 7 ? '🔥' : (days <= 14 ? '⏰' : '📅');
        return `${urgency} <strong>Deadline: ${dateStr}</strong> · ${days} zile rămase`;
    }

    // ---------- Modal ----------
    function openModal(id) {
        const c = CALLS.find(x => x.id === id);
        if (!c) return;
        const funder = FUNDERS[c.funderId] || { name: 'Necunoscut' };
        const modal = $('#modal');
        const content = $('#modal-content');

        const audTags = c.audiences.map(a => `<span class="tag aud-${a}">${a}</span>`).join('');
        const topicTags = c.topics.map(t => `<span class="tag">${TOPICS[t] || ''} ${t}</span>`).join('');

        content.innerHTML = `
            ${statusBadgeHtml(c)}
            <h2>${escapeHtml(c.title)}</h2>
            <div class="modal-origin">${escapeHtml(funder.name)} · ${escapeHtml(funder.originLabel || '')}</div>

            <div class="modal-deadline-box">
                ${formatDeadline(c)}
            </div>

            <p style="color: var(--ink-2); font-size: 15px;">${escapeHtml(c.description)}</p>

            <h4>Beneficiari eligibili</h4>
            <div class="modal-tags">${audTags}</div>

            <h4>Criterii de eligibilitate</h4>
            <ul class="modal-list">
                ${c.eligibility.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
            </ul>

            <h4>Domenii</h4>
            <div class="modal-tags">${topicTags}</div>

            <h4>Tip suport</h4>
            <p style="margin: 0; color: var(--ink-2);">${typeLabel(c.type)}</p>

            ${c.budgetPerProject ? `<h4>Mărime grant</h4><p style="margin:0; color:var(--ink-2);">${escapeHtml(c.budgetPerProject)}</p>` : ''}
            ${c.budgetTotal ? `<p style="margin:4px 0 0; color:var(--ink-3); font-size:13px;">Buget total: ${escapeHtml(c.budgetTotal)}</p>` : ''}

            <div class="modal-meta">
                ${c.verifiedSource ? `<small>✓ Verificat: ${escapeHtml(c.verified)} · sursă: ${escapeHtml(c.verifiedSource)}</small>` : ''}
            </div>

            <div class="modal-actions">
                <a href="${escapeAttr(c.url)}" class="modal-link" target="_blank" rel="noopener noreferrer">
                    Site oficial / Aplică ↗
                </a>
                <button class="modal-link secondary" id="modal-ics">📅 Adaugă în calendar</button>
            </div>
        `;

        $('#modal-ics').addEventListener('click', () => downloadICS([c]));

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        $('#modal').hidden = true;
        document.body.style.overflow = '';
    }

    function typeLabel(t) {
        return ({
            'Grant': 'Grant nerambursabil',
            'Cofinantare': 'Cofinanțare',
            'Credit': 'Credit preferențial',
            'Subventie': 'Subvenție',
            'AT': 'Asistență tehnică'
        })[t] || t;
    }

    // ---------- ICS Calendar export ----------
    function downloadICS(calls) {
        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//GrantsHub Moldova//RO',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        calls.forEach(c => {
            if (!c.deadline || c.deadlineType === 'rolling' || c.deadlineType === 'expected') {
                // skip — no fixed date to add
                return;
            }
            const funder = FUNDERS[c.funderId] || { name: 'Necunoscut' };
            const date = c.deadline.replace(/-/g, '');
            const uid = `${c.id}@grantshub.md`;
            const summary = `[Deadline] ${c.title}`;
            const desc = `Finanțator: ${funder.name}\\n\\n${c.description}\\n\\nAplică: ${c.url}`;

            lines.push('BEGIN:VEVENT');
            lines.push(`UID:${uid}`);
            lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
            lines.push(`DTSTART;VALUE=DATE:${date}`);
            lines.push(`DTEND;VALUE=DATE:${date}`);
            lines.push(`SUMMARY:${escapeICS(summary)}`);
            lines.push(`DESCRIPTION:${escapeICS(desc)}`);
            lines.push(`URL:${c.url}`);
            lines.push('BEGIN:VALARM');
            lines.push('TRIGGER:-P7D');
            lines.push('ACTION:DISPLAY');
            lines.push(`DESCRIPTION:Apel se închide într-o săptămână: ${escapeICS(c.title)}`);
            lines.push('END:VALARM');
            lines.push('END:VEVENT');
        });

        lines.push('END:VCALENDAR');
        const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = calls.length === 1 ? `grantshub-${calls[0].id}.ics` : 'grantshub-moldova-deadlines.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function formatICSDate(d) {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    }
    function escapeICS(s) {
        return String(s).replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
    }

    // ---------- Events ----------
    function attachEvents() {
        $$('#filter-audience .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                $$('#filter-audience .chip').forEach(c => c.classList.remove('chip-active'));
                chip.classList.add('chip-active');
                state.audience = chip.dataset.aud;
                renderCards();
            });
        });
        $$('#filter-urgency .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                $$('#filter-urgency .chip').forEach(c => c.classList.remove('chip-active'));
                chip.classList.add('chip-active');
                state.urgency = chip.dataset.urgency;
                renderCards();
            });
        });
        $$('#filter-type .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                $$('#filter-type .chip').forEach(c => c.classList.remove('chip-active'));
                chip.classList.add('chip-active');
                state.type = chip.dataset.type;
                renderCards();
            });
        });

        $$('.audience-card').forEach(card => {
            card.addEventListener('click', () => {
                const aud = card.dataset.filterAud;
                $$('#filter-audience .chip').forEach(c => c.classList.remove('chip-active'));
                $(`#filter-audience .chip[data-aud="${aud}"]`).classList.add('chip-active');
                state.audience = aud;
                renderCards();
                document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
            });
        });

        const searchInput = $('#search');
        let timer;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                state.search = searchInput.value.trim();
                renderCards();
            }, 150);
        });

        $('#reset-filters').addEventListener('click', () => {
            state.audience = 'all';
            state.urgency = 'all';
            state.type = 'all';
            state.topic = null;
            state.search = '';
            searchInput.value = '';
            $$('.chip').forEach(c => c.classList.remove('chip-active'));
            $$('#filter-audience .chip[data-aud="all"]').forEach(c => c.classList.add('chip-active'));
            $$('#filter-urgency .chip[data-urgency="all"]').forEach(c => c.classList.add('chip-active'));
            $$('#filter-type .chip[data-type="all"]').forEach(c => c.classList.add('chip-active'));
            $$('.topic-chip').forEach(c => c.classList.remove('active'));
            renderCards();
        });

        // Master ICS download
        $('#download-all-ics').addEventListener('click', () => {
            downloadICS(CALLS.filter(c => c.deadlineType === 'fixed'));
        });

        $$('[data-close]').forEach(el => el.addEventListener('click', closeModal));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeModal();
        });
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function escapeAttr(s) { return escapeHtml(s); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
