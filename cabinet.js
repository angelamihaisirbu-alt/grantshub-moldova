// Cabinet beneficiar — DEMO mode (localStorage only).
// To make this real (cross-device, real emails, realtime messaging), wire up Supabase.
// See the //SUPABASE: comments below for swap points.

(function() {
    'use strict';

    const STORAGE_USERS = 'grantshub_cabinet_users_v1';   // map email -> {name, organization, phone, audience, avatar}
    const STORAGE_SESSION = 'grantshub_cabinet_session_v1'; // current user email
    const STORAGE_MSGS = 'grantshub_cabinet_msgs_v1';     // map email -> [{from, body, time}]
    const STORAGE_CONS = 'grantshub_cabinet_cons_v1';     // map email -> [{title, date, status}]
    const STORAGE_OTP = 'grantshub_cabinet_otp_v1';       // temp: {email, code, expires}
    const STORAGE_BANNER = 'grantshub_cabinet_banner_v1';

    const AVATARS = ['👤','👨','👩','🧑','👨‍💼','👩‍💼','🧑‍💼','👨‍🌾','👩‍🌾','🧑‍🏫','👨‍🎓','👩‍🎓'];

    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    }
    function writeJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

    function genOTP() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // ============ Auth screen routing ============
    function showAuthPanel(name) {
        $$('#screen-auth .auth-panel').forEach(p => p.hidden = true);
        $('#auth-' + name).hidden = false;
    }

    function goTo(target) {
        if (target === 'welcome') showAuthPanel('welcome');
        else if (target === 'register') showAuthPanel('register');
        else if (target === 'login') showAuthPanel('login');
        else if (target === 'otp') showAuthPanel('otp');
    }

    // ============ Registration (cu validări org_type) ============
    $('#form-register').addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const email = fd.get('email').toString().toLowerCase().trim();
        const name = fd.get('name').toString().trim();
        const organization = (fd.get('organization') || '').toString().trim();
        const orgType = (fd.get('org_type') || '').toString().trim();

        // ── VALIDĂRI ──
        if (!email || !name || !organization) {
            alert('Completează toate câmpurile obligatorii (email, nume, organizație).');
            return;
        }
        if (!['ngo', 'public', 'private'].includes(orgType)) {
            alert('Selectează un tip de organizație (ONG / Autoritate publică / Companie privată).');
            return;
        }
        const users = readJSON(STORAGE_USERS, {});
        if (users[email]) {
            alert('Există deja un cont cu acest email. Folosește "Am deja cont".');
            return;
        }

        // Salvăm cu tipul PRIMARY imutabil + audience_types[] extensibil
        users[email] = {
            name, email, organization,
            audience_primary: orgType,                // tipul principal — imutabil
            audience_types: [orgType],                // listă — extensibilă în profil (până la 3)
            audience: orgType,                        // legacy compat
            audience_locked_at: new Date().toISOString(),
            phone: '', avatar: '👤',
            createdAt: new Date().toISOString(),
        };
        writeJSON(STORAGE_USERS, users);

        // SUPABASE: replace with supabase.auth.signInWithOtp({ email })
        const code = genOTP();
        writeJSON(STORAGE_OTP, { email, code, expires: Date.now() + 10 * 60 * 1000 });
        showOTP(email, code);
    });

    // ============ Login ============
    $('#form-login').addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const email = fd.get('email').toString().toLowerCase().trim();
        const users = readJSON(STORAGE_USERS, {});
        if (!users[email]) {
            alert('Nu există cont cu acest email. Înregistrează-te mai întâi.');
            return;
        }
        // SUPABASE: replace with supabase.auth.signInWithOtp({ email })
        const code = genOTP();
        writeJSON(STORAGE_OTP, { email, code, expires: Date.now() + 10 * 60 * 1000 });
        showOTP(email, code);
    });

    function showOTP(email, code) {
        $('#otp-mock-to').textContent = email;
        $('#otp-display').textContent = code.split('').join(' ');
        $('#otp-target-email').textContent = '(' + email + ')';
        showAuthPanel('otp');
        $('#form-otp input[name="code"]').value = '';
        $('#form-otp input[name="code"]').focus();
    }

    // ============ OTP verification ============
    $('#form-otp').addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const entered = fd.get('code').toString().trim();
        const otp = readJSON(STORAGE_OTP, null);
        if (!otp) { alert('Sesiune OTP expirată. Reîncearcă.'); goTo('welcome'); return; }
        if (Date.now() > otp.expires) { alert('Codul a expirat. Cere unul nou.'); goTo('welcome'); return; }
        if (entered !== otp.code) { alert('Cod incorect.'); return; }

        // Auth success
        // SUPABASE: replace with supabase.auth.verifyOtp({ email, token, type: 'email' })
        localStorage.setItem(STORAGE_SESSION, otp.email);
        localStorage.removeItem(STORAGE_OTP);
        loadApp();
    });

    // ============ Navigation: goto buttons ============
    $$('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => goTo(btn.dataset.goto));
    });

    // ============ App loading ============
    function loadApp() {
        const email = localStorage.getItem(STORAGE_SESSION);
        if (!email) return;
        const users = readJSON(STORAGE_USERS, {});
        const user = users[email];
        if (!user) {
            // Stale session
            localStorage.removeItem(STORAGE_SESSION);
            return;
        }

        $('#screen-auth').hidden = true;
        $('#screen-app').hidden = false;
        $('#logout-cabinet').hidden = false;

        $('#user-name').textContent = user.name || email.split('@')[0];
        $('#user-email-display').textContent = email;
        $('#top-avatar').textContent = user.avatar || '👤';

        renderDashboard(user);
        renderMessages(user);
        renderProfile(user);
    }

    function logout() {
        if (!confirm('Sigur te deconectezi?')) return;
        localStorage.removeItem(STORAGE_SESSION);
        location.reload();
    }
    $('#logout-cabinet').addEventListener('click', logout);

    // ============ Dashboard ============
    function renderDashboard(user) {
        // Consultations
        const allCons = readJSON(STORAGE_CONS, {});
        const cons = allCons[user.email] || [];
        const consWrap = $('#consultations-list');
        if (cons.length === 0) {
            consWrap.innerHTML = '<p class="dash-empty">Nu ai consultații. <a href="consultatii.html">Solicită una →</a></p>';
        } else {
            consWrap.innerHTML = cons.map(c => `
                <div class="consultation-item">
                    <strong>${escapeHtml(c.title)}</strong>
                    <small>${escapeHtml(c.date)} · status: ${escapeHtml(c.status)}</small>
                </div>
            `).join('');
        }

        // Messages preview (last 2)
        const allMsgs = readJSON(STORAGE_MSGS, {});
        const msgs = allMsgs[user.email] || [];
        const recent = msgs.slice(-2);
        const msgPreview = $('#messages-preview');
        if (recent.length === 0) {
            msgPreview.innerHTML = '<p class="dash-empty">Niciun mesaj încă. <a href="#" onclick="document.querySelector(\'[data-tab=messages]\').click(); return false;">Scrie primul →</a></p>';
        } else {
            msgPreview.innerHTML = recent.map(m => `
                <div class="consultation-item">
                    <strong>${m.from === 'me' ? 'Tu' : 'Echipa'}</strong>
                    <small>${escapeHtml(m.body.slice(0, 80))}${m.body.length > 80 ? '…' : ''}</small>
                </div>
            `).join('');
        }

        // Recommended calls — based on audience in profile
        const rec = $('#recommended-calls');
        if (!user.audience) {
            rec.innerHTML = '<p class="dash-empty">Configurează profilul (tip beneficiar) pentru recomandări personalizate.</p>';
        } else {
            rec.innerHTML = `
                <p class="dash-empty">Bazat pe profilul tău (${escapeHtml(user.audience)}):</p>
                <ul class="dash-links">
                    <li><a href="index.html#catalog">📂 Vezi apelurile pentru ${escapeHtml(user.audience)} →</a></li>
                </ul>
            `;
        }
    }

    // ============ Messages ============
    function renderMessages(user) {
        const allMsgs = readJSON(STORAGE_MSGS, {});
        const msgs = allMsgs[user.email] || [];
        const thread = $('#chat-thread');
        // Keep the initial team welcome message + append stored
        // (we don't store the initial welcome, render dynamically)
        const stored = msgs.map(m => renderMsgHtml(m)).join('');
        // Welcome message always first
        thread.innerHTML = `
            <div class="msg msg-team">
                <div class="msg-avatar">🛡</div>
                <div class="msg-bubble">
                    <div class="msg-from">Echipa AO Centrul de Excelență</div>
                    <div class="msg-body">Salut, ${escapeHtml(user.name || 'beneficiar')}! Mă bucur să te văd în cabinet. Spune-mi dacă vrei să discutăm despre o linie de finanțare specifică sau dacă ai întrebări pe procesul de aplicare. 👋</div>
                    <div class="msg-time">Mesaj de bun venit</div>
                </div>
            </div>
            ${stored}
        `;
        thread.scrollTop = thread.scrollHeight;
        updateMsgBadge(msgs);
    }

    function renderMsgHtml(m) {
        const isMe = m.from === 'me';
        return `
            <div class="msg ${isMe ? 'msg-me' : 'msg-team'}">
                <div class="msg-avatar">${isMe ? '👤' : '🛡'}</div>
                <div class="msg-bubble">
                    <div class="msg-from">${isMe ? 'Tu' : 'Echipa'}</div>
                    <div class="msg-body">${escapeHtml(m.body)}</div>
                    <div class="msg-time">${escapeHtml(m.time)}</div>
                </div>
            </div>
        `;
    }

    function updateMsgBadge(msgs) {
        const unread = msgs.filter(m => m.from !== 'me' && !m.read).length;
        const badge = $('#msg-badge');
        if (unread > 0) { badge.textContent = unread; badge.hidden = false; }
        else { badge.hidden = true; }
    }

    $('#form-message').addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = fd.get('body').toString().trim();
        if (!body) return;

        const email = localStorage.getItem(STORAGE_SESSION);
        const allMsgs = readJSON(STORAGE_MSGS, {});
        const msgs = allMsgs[email] || [];

        const now = new Date();
        const time = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

        // SUPABASE: replace with INSERT INTO messages (...) + realtime subscription on responses
        msgs.push({ from: 'me', body, time, read: true });

        // Fake auto-reply after 2 seconds (only in DEMO)
        setTimeout(() => {
            const allMsgs2 = readJSON(STORAGE_MSGS, {});
            const msgs2 = allMsgs2[email] || [];
            msgs2.push({
                from: 'team',
                body: 'Mulțumim pentru mesaj! Un membru al echipei îți va răspunde în max. 2 zile lucrătoare. În DEMO mode, mesajele se salvează doar local.',
                time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                read: false
            });
            allMsgs2[email] = msgs2;
            writeJSON(STORAGE_MSGS, allMsgs2);

            const users = readJSON(STORAGE_USERS, {});
            if (users[email]) renderMessages(users[email]);
        }, 1800);

        allMsgs[email] = msgs;
        writeJSON(STORAGE_MSGS, allMsgs);
        e.target.reset();

        const users = readJSON(STORAGE_USERS, {});
        if (users[email]) renderMessages(users[email]);
    });

    // ============ Profile ============
    const TIER_PRICES = { 1: 20, 2: 30, 3: 45 };

    function getUserTypes(user) {
        // Migrare legacy: dacă user are doar `audience` string → convertim la audience_types[]
        if (Array.isArray(user.audience_types) && user.audience_types.length) {
            return user.audience_types;
        }
        if (user.audience) return [user.audience];
        return [];
    }

    function renderProfile(user) {
        const form = $('#form-profile');
        form.elements.name.value = user.name || '';
        form.elements.email.value = user.email || '';
        form.elements.organization.value = user.organization || '';
        form.elements.phone.value = user.phone || '';

        // Populare multi-checkbox tipuri + lock pe primary
        const primary = user.audience_primary || user.audience || '';
        const types = getUserTypes(user);
        document.querySelectorAll('input[data-typecheck]').forEach(cb => {
            const v = cb.value;
            cb.checked = types.includes(v);
            // Primary type e LOCKED — nu se poate elimina
            if (v === primary && primary) {
                cb.disabled = true;
                cb.checked = true;
                const status = cb.closest('.profile-type-check').querySelector('.profile-type-status');
                if (status) status.textContent = '✓ Tip principal — blocat';
            } else {
                cb.disabled = false;
                const status = cb.closest('.profile-type-check').querySelector('.profile-type-status');
                if (status) status.textContent = cb.checked ? '✓ Activ' : 'Inactiv — bifează pentru a adăuga';
            }
        });
        updateProfileTariff();

        // Bind change listeners pentru tariff live (idempotent)
        document.querySelectorAll('input[data-typecheck]').forEach(cb => {
            cb.removeEventListener('change', updateProfileTariff);
            cb.addEventListener('change', updateProfileTariff);
        });

        // Avatar grid
        const grid = $('#avatar-grid');
        grid.innerHTML = AVATARS.map(a => `
            <button type="button" class="avatar-option ${a === user.avatar ? 'selected' : ''}" data-av="${a}">${a}</button>
        `).join('');
        grid.querySelectorAll('.avatar-option').forEach(btn => {
            btn.addEventListener('click', () => {
                grid.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    function updateProfileTariff() {
        const checked = document.querySelectorAll('input[data-typecheck]:checked').length;
        const n = Math.max(1, Math.min(3, checked));
        const price = TIER_PRICES[n];

        const liveEl = document.querySelector('#profile-tariff-live');
        if (liveEl) {
            liveEl.querySelector('.tariff-count').textContent = `${n} tip${n > 1 ? 'uri' : ''} selectat${n > 1 ? 'e' : ''}`;
            liveEl.querySelector('.tariff-amount').innerHTML = `${price} €<small>/lună</small>`;
        }

        // Highlight active tier step
        document.querySelectorAll('.tier-step').forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.tierStep, 10) === n);
        });

        // Update inline status per checkbox
        document.querySelectorAll('input[data-typecheck]').forEach(cb => {
            const status = cb.closest('.profile-type-check')?.querySelector('.profile-type-status');
            if (status && !cb.disabled) {
                status.textContent = cb.checked ? '✓ Activ' : 'Inactiv — bifează pentru a adăuga';
            }
        });
    }

    $('#form-profile').addEventListener('submit', e => {
        e.preventDefault();
        const email = localStorage.getItem(STORAGE_SESSION);
        const users = readJSON(STORAGE_USERS, {});
        const user = users[email];
        if (!user) return;

        const fd = new FormData(e.target);
        user.name = fd.get('name').toString().trim();
        user.organization = fd.get('organization').toString().trim();
        user.phone = fd.get('phone').toString().trim();

        // Salvăm audience_types[] din checkbox-uri
        const types = fd.getAll('audience_types').map(String);
        const primary = user.audience_primary || user.audience || types[0];
        // Asigură că primary e mereu inclus (în caz că s-a debifat cumva)
        if (primary && !types.includes(primary)) types.unshift(primary);
        user.audience_types = types.slice(0, 3);
        user.audience = primary;  // legacy compat
        user.audience_primary = primary;
        user.tariff_monthly_eur = TIER_PRICES[Math.max(1, Math.min(3, user.audience_types.length))];

        const selectedAv = $('.avatar-option.selected');
        if (selectedAv) user.avatar = selectedAv.dataset.av;

        users[email] = user;
        writeJSON(STORAGE_USERS, users);

        $('#user-name').textContent = user.name || email.split('@')[0];
        $('#top-avatar').textContent = user.avatar;

        $('#profile-saved').hidden = false;
        setTimeout(() => { $('#profile-saved').hidden = true; }, 2500);

        renderDashboard(user); // refresh recommendations
        // Notify dashboard widget să re-fetch
        document.dispatchEvent(new CustomEvent('grantio:profile-updated', { detail: user }));
    });

    // ============ Tabs ============
    $$('.tab').forEach(t => {
        t.addEventListener('click', () => {
            $$('.tab').forEach(x => x.classList.remove('tab-active'));
            t.classList.add('tab-active');
            const target = t.dataset.tab;
            $$('.tab-panel').forEach(p => p.hidden = true);
            $('#panel-' + target).hidden = false;
            if (target === 'messages') {
                // Mark messages as read
                const email = localStorage.getItem(STORAGE_SESSION);
                const allMsgs = readJSON(STORAGE_MSGS, {});
                const msgs = (allMsgs[email] || []).map(m => ({ ...m, read: true }));
                allMsgs[email] = msgs;
                writeJSON(STORAGE_MSGS, allMsgs);
                updateMsgBadge(msgs);
            }
        });
    });

    // ============ DEMO banner dismissal ============
    if (sessionStorage.getItem(STORAGE_BANNER) === 'dismissed') {
        document.querySelector('.demo-banner').classList.add('hidden');
    }
    $('#demo-banner-close').addEventListener('click', () => {
        document.querySelector('.demo-banner').classList.add('hidden');
        sessionStorage.setItem(STORAGE_BANNER, 'dismissed');
    });

    // ============ Boot ============
    if (localStorage.getItem(STORAGE_SESSION)) {
        loadApp();
    } else {
        showAuthPanel('welcome');
    }
})();
