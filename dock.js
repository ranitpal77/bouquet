// GardenDock — floating right-edge navigation dock.
// Edge-proximity reveal, 5s idle auto-hide (dock + cursor), theme popover,
// toolbox popover, fullscreen toggle. Popovers and windows keep it visible.
const GardenDock = (() => {
    'use strict';

    const EDGE_PX = 70;
    const IDLE_MS = 5000;
    const html = document.documentElement;
    const touchMode = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    const ic = inner =>
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';

    const ICONS = {
        expand: '<svg class="ic-expand" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
        compress: '<svg class="ic-compress" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>',
        theme: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
        toolbox: ic('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
        sound: ic('<path d="M11 5 6.5 9H3v6h3.5L11 19V5Z"/><path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.8 7a7 7 0 0 1 0 10"/>')
    };

    const THEME_OPTIONS = [
        { value: 'dynamic', label: 'Dynamic', note: 'Default' },
        { value: 'day', label: 'Day' },
        { value: 'night', label: 'Night' },
        { value: 'minimal', label: 'Minimal' }
    ];

    // ---------- DOM ----------
    const layer = document.createElement('div');
    layer.className = 'dock-layer';

    const dock = document.createElement('nav');
    dock.className = 'dock';
    dock.setAttribute('aria-label', 'Garden tools');
    dock.innerHTML =
        '<button class="dock-btn" id="dockFs" data-tip="Full Screen" aria-label="Toggle full screen">' + ICONS.expand + ICONS.compress + '</button>' +
        '<button class="dock-btn" id="dockTheme" data-tip="Theme" aria-label="Background theme" aria-haspopup="true">' + ICONS.theme + '</button>' +
        '<button class="dock-btn" id="dockTools" data-tip="Toolbox" aria-label="Toolbox" aria-haspopup="true">' + ICONS.toolbox + '</button>';

    const themePop = document.createElement('div');
    themePop.className = 'dock-popover';
    themePop.setAttribute('role', 'menu');
    themePop.innerHTML =
        '<div class="pop-title">Background</div>' +
        THEME_OPTIONS.map(o =>
            '<button class="pop-item" role="menuitemradio" data-theme="' + o.value + '">' +
                '<span class="pop-radio" aria-hidden="true"></span>' +
                '<span class="pop-label">' + o.label + '</span>' +
                (o.note ? '<span class="pop-note">' + o.note + '</span>' : '') +
            '</button>'
        ).join('');

    const toolsPop = document.createElement('div');
    toolsPop.className = 'dock-popover';
    toolsPop.setAttribute('role', 'menu');
    toolsPop.innerHTML =
        '<div class="pop-title">Toolbox</div>' +
        '<button class="pop-item" role="menuitem" data-tool="ambient-sounds">' +
            ICONS.sound +
            '<span class="pop-label">Ambient Sounds</span>' +
        '</button>';

    layer.appendChild(dock);
    layer.appendChild(themePop);
    layer.appendChild(toolsPop);
    document.body.appendChild(layer);

    const fsBtn = dock.querySelector('#dockFs');
    const themeBtn = dock.querySelector('#dockTheme');
    const toolsBtn = dock.querySelector('#dockTools');

    // ---------- Fullscreen ----------
    const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

    function toggleFullscreen() {
        const el = html;
        if (!fsElement()) {
            const req = el.requestFullscreen || el.webkitRequestFullscreen;
            if (req) {
                const p = req.call(el);
                if (p && p.catch) p.catch(() => { });
            }
        } else {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) exit.call(document);
        }
    }

    function syncFullscreen() {
        html.classList.toggle('is-fullscreen', !!fsElement());
    }
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    fsBtn.addEventListener('click', toggleFullscreen);

    // ---------- Theme ----------
    function currentTheme() {
        try {
            if (typeof sky !== 'undefined' && sky.theme) return sky.theme;
        } catch (e) { /* sky not present on this page */ }
        return 'dynamic';
    }

    function markTheme(value) {
        themePop.querySelectorAll('.pop-item').forEach(b => {
            const on = b.dataset.theme === value;
            b.classList.toggle('active', on);
            b.setAttribute('aria-checked', on);
        });
    }

    themePop.addEventListener('click', e => {
        const item = e.target.closest('.pop-item');
        if (!item) return;
        const value = item.dataset.theme;
        if (typeof setBackgroundTheme === 'function') setBackgroundTheme(value);
        markTheme(value);
    });

    // ---------- Toolbox ----------
    toolsPop.addEventListener('click', e => {
        const item = e.target.closest('.pop-item');
        if (!item) return;
        closePopovers();
        FloatingWindows.open(item.dataset.tool);
    });

    // ---------- Popovers ----------
    let openPop = null;

    function positionPop(pop, btn) {
        const br = btn.getBoundingClientRect();
        const dr = dock.getBoundingClientRect();
        const ph = pop.offsetHeight;
        const top = Math.max(10, Math.min(br.top + br.height / 2 - ph / 2, window.innerHeight - ph - 10));
        pop.style.top = top + 'px';
        pop.style.right = (window.innerWidth - dr.left + 12) + 'px';
    }

    function closePopovers() {
        if (!openPop) return;
        openPop.classList.remove('pop-open');
        openPop = null;
        layer.classList.remove('pop-active');
        dock.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('dock-btn-active'));
    }

    function togglePop(pop, btn) {
        if (openPop === pop) { closePopovers(); return; }
        closePopovers();
        if (pop === themePop) markTheme(currentTheme());
        positionPop(pop, btn);
        pop.classList.add('pop-open');
        btn.classList.add('dock-btn-active');
        layer.classList.add('pop-active');
        openPop = pop;
    }

    themeBtn.addEventListener('click', () => togglePop(themePop, themeBtn));
    toolsBtn.addEventListener('click', () => togglePop(toolsPop, toolsBtn));

    document.addEventListener('pointerdown', e => {
        if (openPop && !e.target.closest('.dock, .dock-popover')) closePopovers();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closePopovers();
    });
    window.addEventListener('resize', closePopovers);

    // ---------- Auto-hide: dock + cursor ----------
    let dockShown = false;
    let idleTimer = null;
    let hideTimer = null;

    function showDock() {
        clearTimeout(hideTimer);
        hideTimer = null;
        if (!dockShown) {
            dockShown = true;
            dock.classList.add('dock-visible');
        }
    }

    function hideDock() {
        if (!dockShown || openPop) return;
        dockShown = false;
        dock.classList.remove('dock-visible');
    }

    function scheduleHide() {
        if (hideTimer || !dockShown) return;
        hideTimer = setTimeout(() => {
            hideTimer = null;
            hideDock();
        }, 300);
    }

    const overUI = target =>
        !!(target && target.closest && target.closest('.dock, .dock-popover, .fw'));

    function onActivity(e) {
        html.classList.remove('cursor-idle');

        const onUI = overUI(e.target);
        const inZone = e.clientX >= window.innerWidth - EDGE_PX;

        if (inZone || openPop) {
            showDock();
        } else if (onUI) {
            // Hovering a popover/window keeps an already-visible dock alive,
            // but doesn't reveal it from the middle of the screen
            if (dockShown) showDock();
        } else {
            scheduleHide();
        }

        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            html.classList.add('cursor-idle');
            const hoveringUI = document.querySelector('.dock:hover, .dock-popover:hover, .fw:hover');
            if (!hoveringUI && !openPop) hideDock();
        }, IDLE_MS);
    }

    if (touchMode) {
        // No hover/edge proximity on touch — keep the dock available
        requestAnimationFrame(() => showDock());
    } else {
        window.addEventListener('mousemove', onActivity, { passive: true });
        window.addEventListener('mousedown', onActivity, { passive: true });
    }

    return {
        show: showDock,
        hide: hideDock,
        closePopovers
    };
})();
