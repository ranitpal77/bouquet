// FloatingWindows — reusable draggable / resizable glass window manager
// Register tools once, then open/close/toggle by id. Windows keep their
// position and size while open, stack on focus, and stay inside the viewport.
const FloatingWindows = (() => {
    'use strict';

    const MARGIN = 8;
    const HEADER_H = 44;
    const BASE_Z = 12000;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const defs = new Map();   // id -> definition
    const wins = new Map();   // id -> live window record
    const order = [];         // stacking order, last = front
    let cascade = 0;

    const SVG = {
        minimize:
            '<svg class="ic-min" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>' +
            '<svg class="ic-restore" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="14" height="12" rx="2"/></svg>',
        close:
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    };

    function restack() {
        order.forEach((id, i) => {
            const w = wins.get(id);
            if (w) w.el.style.zIndex = BASE_Z + i * 2;
        });
    }

    function focus(id) {
        const idx = order.indexOf(id);
        if (idx === -1 || idx === order.length - 1) return;
        order.splice(idx, 1);
        order.push(id);
        restack();
    }

    const effH = w => (w.min ? HEADER_H : w.h);

    // Clamp the rect fully inside the viewport and push it to the DOM
    function applyRect(w) {
        const vw = window.innerWidth, vh = window.innerHeight;
        const maxW = vw - MARGIN * 2, maxH = vh - MARGIN * 2;
        w.w = clamp(w.w, Math.min(w.minW, maxW), maxW);
        w.h = clamp(w.h, Math.min(w.minH, maxH), maxH);
        w.x = clamp(w.x, MARGIN, Math.max(MARGIN, vw - w.w - MARGIN));
        w.y = clamp(w.y, MARGIN, Math.max(MARGIN, vh - effH(w) - MARGIN));
        w.el.style.left = w.x + 'px';
        w.el.style.top = w.y + 'px';
        w.el.style.width = w.w + 'px';
        w.el.style.height = effH(w) + 'px';
    }

    function makeDraggable(w) {
        const header = w.el.querySelector('.fw-header');
        let pid = null, sx = 0, sy = 0, ox = 0, oy = 0;

        header.addEventListener('pointerdown', e => {
            if (e.target.closest('.fw-btn')) return;
            pid = e.pointerId;
            header.setPointerCapture(pid);
            sx = e.clientX; sy = e.clientY; ox = w.x; oy = w.y;
            w.el.classList.add('fw-dragging');
            e.preventDefault();
        });
        header.addEventListener('pointermove', e => {
            if (pid === null || e.pointerId !== pid) return;
            w.x = ox + e.clientX - sx;
            w.y = oy + e.clientY - sy;
            applyRect(w);
        });
        const end = e => {
            if (pid === null || e.pointerId !== pid) return;
            pid = null;
            w.el.classList.remove('fw-dragging');
        };
        header.addEventListener('pointerup', end);
        header.addEventListener('pointercancel', end);
        header.addEventListener('dblclick', e => {
            if (!e.target.closest('.fw-btn')) toggleMinimize(w.id);
        });
    }

    function makeResizable(w) {
        const grip = w.el.querySelector('.fw-resize');
        let pid = null, sx = 0, sy = 0, ow = 0, oh = 0;

        grip.addEventListener('pointerdown', e => {
            pid = e.pointerId;
            grip.setPointerCapture(pid);
            sx = e.clientX; sy = e.clientY; ow = w.w; oh = w.h;
            w.el.classList.add('fw-resizing');
            e.preventDefault();
        });
        grip.addEventListener('pointermove', e => {
            if (pid === null || e.pointerId !== pid) return;
            w.w = ow + e.clientX - sx;
            w.h = oh + e.clientY - sy;
            applyRect(w);
        });
        const end = e => {
            if (pid === null || e.pointerId !== pid) return;
            pid = null;
            w.el.classList.remove('fw-resizing');
        };
        grip.addEventListener('pointerup', end);
        grip.addEventListener('pointercancel', end);
    }

    function toggleMinimize(id) {
        const w = wins.get(id);
        if (!w) return;
        w.min = !w.min;
        w.el.classList.toggle('fw-min', w.min);
        applyRect(w);
    }

    function open(id) {
        const def = defs.get(id);
        if (!def) return null;

        const existing = wins.get(id);
        if (existing) {
            if (existing.min) toggleMinimize(id);
            focus(id);
            return existing;
        }

        const vw = window.innerWidth, vh = window.innerHeight;
        const w = {
            id, def,
            w: def.width || 320,
            h: def.height || 360,
            minW: def.minWidth || 240,
            minH: def.minHeight || 150,
            x: 0, y: 0,
            min: false,
            el: null
        };
        w.w = Math.min(w.w, vw - MARGIN * 2);
        w.h = Math.min(w.h, vh - MARGIN * 2);

        const off = (cascade++ % 5) * 26;
        w.x = def.x != null ? def.x : Math.round((vw - w.w) / 2) + off;
        w.y = def.y != null ? def.y : Math.round((vh - w.h) / 2) + off;

        const el = document.createElement('section');
        el.className = 'fw fw-enter';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', def.title);
        el.innerHTML =
            '<header class="fw-header">' +
                '<span class="fw-title">' + def.title + '</span>' +
                '<div class="fw-actions">' +
                    '<button class="fw-btn fw-btn-min" aria-label="Minimize">' + SVG.minimize + '</button>' +
                    '<button class="fw-btn fw-btn-close" aria-label="Close">' + SVG.close + '</button>' +
                '</div>' +
            '</header>' +
            '<div class="fw-body"></div>' +
            '<div class="fw-resize" aria-hidden="true"></div>';
        document.body.appendChild(el);
        w.el = el;

        wins.set(id, w);
        order.push(id);
        restack();
        applyRect(w);

        el.addEventListener('pointerdown', () => focus(id), true);
        el.querySelector('.fw-btn-min').addEventListener('click', () => toggleMinimize(id));
        el.querySelector('.fw-btn-close').addEventListener('click', () => close(id));
        makeDraggable(w);
        makeResizable(w);

        if (typeof def.build === 'function') def.build(el.querySelector('.fw-body'), api);

        // Double rAF so the enter transition runs after first paint
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('fw-enter')));
        return w;
    }

    function close(id) {
        const w = wins.get(id);
        if (!w) return;
        wins.delete(id);
        order.splice(order.indexOf(id), 1);
        w.el.classList.add('fw-leave');
        setTimeout(() => w.el.remove(), 360);
        restack();
        if (typeof w.def.onClose === 'function') w.def.onClose();
    }

    window.addEventListener('resize', () => wins.forEach(applyRect));

    const api = {
        register(id, def) { defs.set(id, def); },
        open,
        close,
        toggle(id) { wins.has(id) ? close(id) : open(id); },
        focus,
        minimize: toggleMinimize,
        isOpen(id) { return wins.has(id); }
    };
    return api;
})();
