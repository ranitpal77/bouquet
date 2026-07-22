// AmbientSounds — looping ambient audio mixer with per-channel fades.
// Registers the "Ambient Sounds" floating window; audio lives outside the
// window DOM so playback survives minimize and continues over the garden.
const AmbientSounds = (() => {
    'use strict';

    const FADE_MS = 700;
    const TICK_MS = 50;

    const ic = (paths, extra = '') =>
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + paths + extra + '</svg>';

    const SOUNDS = [
        {
            id: 'rain',
            name: 'Rain',
            file: 'assets/public/audio/rain.mp3',
            icon: ic('<path d="M7 15a4.5 4.5 0 1 1 .8-8.93A5 5 0 0 1 17.6 8 3.5 3.5 0 0 1 17 15H7Z"/><path d="M8.5 18v1.6M12 17.5v1.6M15.5 18v1.6"/>')
        },
        {
            id: 'ocean',
            name: 'Ocean Waves',
            file: 'assets/public/audio/ocean-waves.mp3',
            icon: ic('<path d="M3 8.5c2 0 2.5-1.5 4.5-1.5S10 8.5 12 8.5 14.5 7 16.5 7 19 8.5 21 8.5"/><path d="M3 13.5c2 0 2.5-1.5 4.5-1.5s2.5 1.5 4.5 1.5 2.5-1.5 4.5-1.5 2.5 1.5 4.5 1.5"/><path d="M3 18.5c2 0 2.5-1.5 4.5-1.5s2.5 1.5 4.5 1.5 2.5-1.5 4.5-1.5 2.5 1.5 4.5 1.5"/>')
        },
        {
            id: 'fireplace',
            name: 'Fireplace',
            file: 'assets/public/audio/fire-place.mp3',
            icon: ic('<path d="M12 21c3.9 0 6.5-2.4 6.5-6 0-2.5-1.4-4.6-3-6.5-.5 1-1.3 1.7-2.2 2C13.6 8 13 5.5 10.5 3c.3 2.7-1 4.2-2.4 5.8C6.7 10.4 5.5 12.3 5.5 15c0 3.6 2.6 6 6.5 6Z"/>')
        }
    ];

    const channels = new Map();
    let ticker = null;

    function channel(def) {
        let c = channels.get(def.id);
        if (c) return c;
        const audio = new Audio();
        audio.src = def.file;
        audio.loop = true;
        audio.preload = 'none';
        audio.volume = 0;
        c = { def, audio, on: false, level: 0.7, vol: 0, ui: null };
        channels.set(def.id, c);
        return c;
    }

    // Single fade ticker for all channels; stops itself when settled
    function tick() {
        let busy = false;
        channels.forEach(c => {
            const target = c.on ? c.level : 0;
            const step = TICK_MS / FADE_MS;
            if (Math.abs(c.vol - target) > 0.004) {
                c.vol += Math.sign(target - c.vol) * Math.min(step, Math.abs(target - c.vol));
                busy = true;
            } else {
                c.vol = target;
            }
            c.audio.volume = Math.max(0, Math.min(1, c.vol));
            if (!c.on && c.vol <= 0.004 && !c.audio.paused) c.audio.pause();
        });
        if (!busy && ticker) {
            clearInterval(ticker);
            ticker = null;
        }
    }

    const kick = () => { if (!ticker) ticker = setInterval(tick, TICK_MS); };

    function setOn(id, on) {
        const c = channels.get(id);
        if (!c || c.on === on) return;
        c.on = on;
        if (on) {
            if (c.audio.preload === 'none') c.audio.preload = 'auto';
            if (c.audio.paused) c.audio.play().catch(() => { c.on = false; syncRow(c); });
        }
        kick();
        syncRow(c);
    }

    function setLevel(id, level) {
        const c = channels.get(id);
        if (!c) return;
        c.level = level;
        if (c.on) kick();
    }

    function stopAll() {
        channels.forEach(c => setOn(c.def.id, false));
    }

    function syncRow(c) {
        // Guard only on ui presence — the row may not be in the DOM yet at
        // build time; syncRow always targets the latest c.ui, so a detached
        // node from a closed window is never touched after reassignment.
        if (!c.ui) return;
        c.ui.row.classList.toggle('am-on', c.on);
        c.ui.toggle.checked = c.on;
        c.ui.vol.value = c.level;
        c.ui.vol.style.setProperty('--fill', (c.level * 100) + '%');
    }

    function buildRow(def) {
        const c = channel(def);
        const row = document.createElement('div');
        row.className = 'am-row';
        row.innerHTML =
            '<div class="am-ic" aria-hidden="true">' + def.icon + '</div>' +
            '<div class="am-main">' +
                '<div class="am-top">' +
                    '<span class="am-name">' + def.name + '</span>' +
                    '<span class="am-eq" aria-hidden="true"><span></span><span></span><span></span></span>' +
                    '<label class="am-switch">' +
                        '<input type="checkbox" aria-label="' + def.name + ' on/off">' +
                        '<span class="am-knob"></span>' +
                    '</label>' +
                '</div>' +
                '<input class="am-vol" type="range" min="0" max="1" step="0.01" aria-label="' + def.name + ' volume">' +
            '</div>';

        const toggle = row.querySelector('.am-switch input');
        const vol = row.querySelector('.am-vol');

        vol.value = c.level;
        vol.style.setProperty('--fill', (c.level * 100) + '%');

        toggle.addEventListener('change', () => setOn(def.id, toggle.checked));
        vol.addEventListener('input', () => {
            const v = parseFloat(vol.value);
            vol.style.setProperty('--fill', (v * 100) + '%');
            setLevel(def.id, v);
        });

        c.ui = { row, toggle, vol };
        syncRow(c);
        return row;
    }

    FloatingWindows.register('ambient-sounds', {
        title: 'Ambient Sounds',
        width: 336,
        height: 356,
        minWidth: 280,
        minHeight: 220,
        build(body) {
            body.classList.add('am-body');
            SOUNDS.forEach(def => body.appendChild(buildRow(def)));

            const foot = document.createElement('div');
            foot.className = 'am-foot';
            foot.innerHTML =
                '<span class="am-hint">Plays in background</span>' +
                '<button class="am-stop" type="button">Stop all</button>';
            foot.querySelector('.am-stop').addEventListener('click', stopAll);
            body.appendChild(foot);
        }
        // No onClose handler: audio engine runs independently of the window.
        // Rows re-sync from channel state on every open (buildRow → syncRow),
        // so reopening restores toggles and volume levels automatically.
    });

    return { stopAll };
})();
