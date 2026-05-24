/* Grantio loading screen controller.
   Expune window.GrantioLoading cu .show() și .hide().
   Default: ascunde automat la window.load. */

(function() {
    'use strict';

    const SELECTOR = '#grantio-loading';
    const MIN_VISIBLE_MS = 600;  // anti-flash: dacă pagina e foarte rapidă, mai ținem 600ms
    let shownAt = Date.now();

    function el() { return document.querySelector(SELECTOR); }

    function hide() {
        const node = el();
        if (!node || node.classList.contains('hidden')) return;
        const elapsed = Date.now() - shownAt;
        const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
        setTimeout(() => {
            node.classList.add('fading');
            setTimeout(() => node.classList.add('hidden'), 400);
        }, wait);
    }

    function show(subtitle) {
        let node = el();
        if (!node) return;
        node.classList.remove('hidden');
        node.classList.remove('fading');
        shownAt = Date.now();
        if (subtitle) {
            const sub = node.querySelector('.gl-subtitle');
            if (sub) sub.textContent = subtitle;
        }
    }

    window.GrantioLoading = { show, hide };

    // Auto-hide la window.load
    if (document.readyState === 'complete') {
        hide();
    } else {
        window.addEventListener('load', hide);
    }
})();
