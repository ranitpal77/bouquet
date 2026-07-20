// GardenBackground — shared procedural sky module
// Renders dynamic 24-hour celestial features (sun, moon, stars, clouds, ambient lighting)
const GardenBackground = (() => {
    'use strict';

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const smooth01 = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
    const rise = (h, a, b) => smooth01((h - a) / (b - a));
    const lerpDeep = (a, b, f) => Array.isArray(a) ? a.map((v, i) => lerpDeep(v, b[i], f)) : a + (b - a) * f;

    // Keyframe sampler over 24h clock
    function sampleKeys(keys, h) {
        for (let i = 1; i < keys.length; i++) {
            if (h <= keys[i].h) {
                const f = smooth01((h - keys[i - 1].h) / (keys[i].h - keys[i - 1].h || 1));
                return lerpDeep(keys[i - 1].c, keys[i].c, f);
            }
        }
        return keys[0].c;
    }

    // Solar day boundaries
    const SUNRISE = 6.0;
    const SUNSET = 19.0;

    // Sky gradient keyframes across 24h cycle
    const NIGHT_C = [[4, 10, 30], [10, 23, 52], [20, 38, 74]];
    const SKY_KEYS = [
        { h: 0.0, c: NIGHT_C },
        { h: 4.4, c: NIGHT_C },
        { h: 5.3, c: [[24, 26, 66], [64, 44, 96], [142, 84, 120]] },
        { h: 6.1, c: [[56, 70, 130], [196, 110, 120], [246, 158, 106]] },
        { h: 7.2, c: [[112, 168, 216], [176, 208, 235], [250, 226, 190]] },
        { h: 9.0, c: [[90, 167, 224], [165, 209, 240], [233, 245, 252]] },
        { h: 12.0, c: [[80, 158, 224], [160, 206, 240], [236, 246, 252]] },
        { h: 16.5, c: [[98, 164, 214], [180, 208, 230], [244, 236, 214]] },
        { h: 18.4, c: [[86, 120, 180], [228, 168, 110], [248, 178, 96]] },
        { h: 19.4, c: [[58, 52, 108], [196, 98, 110], [236, 140, 110]] },
        { h: 20.3, c: [[16, 24, 60], [30, 42, 86], [60, 64, 110]] },
        { h: 21.4, c: NIGHT_C },
        { h: 24.0, c: NIGHT_C }
    ];

    // Ambient lighting tint keyframes
    const NIGHT_L = [40, 70, 140, 0.16];
    const LIGHT_KEYS = [
        { h: 0.0, c: NIGHT_L },
        { h: 4.6, c: NIGHT_L },
        { h: 6.2, c: [255, 170, 110, 0.10] },
        { h: 8.5, c: [255, 220, 170, 0.04] },
        { h: 12.0, c: [255, 255, 255, 0.0] },
        { h: 16.0, c: [255, 225, 170, 0.03] },
        { h: 18.6, c: [255, 150, 60, 0.10] },
        { h: 19.7, c: [235, 105, 95, 0.12] },
        { h: 20.9, c: NIGHT_L },
        { h: 24.0, c: NIGHT_L }
    ];

    // Ground shadow tints
    const GROUND_DAY = [[6, 16, 9, 0.98], [20, 44, 24, 0.82]];
    const GROUND_NIGHT = [[2, 5, 14, 0.99], [4, 9, 22, 0.78]];

    // Lunar phase fraction
    const SYNODIC = 29.530588853;
    const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);
    function moonPhaseFraction(date) {
        const days = (date.getTime() - NEW_MOON_EPOCH) / 86400000;
        return ((days % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC;
    }

    // Cloud sprite generator
    function makeCloudSprite(w, h) {
        const pad = h * 0.6;
        const cv = document.createElement('canvas');
        cv.width = Math.max(2, Math.ceil(w + pad * 2));
        cv.height = Math.max(2, Math.ceil(h + pad * 2));
        const c = cv.getContext('2d');
        c.filter = `blur(${Math.max(1, h * 0.025)}px)`;

        const puff = (px, py, pr, a) => {
            const g = c.createRadialGradient(px, py, pr * 0.1, px, py, pr);
            g.addColorStop(0, `rgba(255, 255, 255, ${a.toFixed(3)})`);
            g.addColorStop(0.6, `rgba(255, 255, 255, ${(a * 0.45).toFixed(3)})`);
            g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            c.fillStyle = g;
            c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.fill();
        };

        const n = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < n; i++) {
            const fx = clamp((i + 0.5) / n + (Math.random() - 0.5) * 0.14, 0.06, 0.94);
            const centrality = 1 - Math.abs(fx - 0.5) * 2;
            const pr = h * (0.2 + 0.13 * centrality + Math.random() * 0.1);
            const px = pad + fx * w;
            const py = pad + h * (0.6 - centrality * 0.12 + (Math.random() - 0.5) * 0.16);
            puff(px, py, pr, 0.72 + Math.random() * 0.18);
        }

        const m = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < m; i++) {
            const ang = Math.random() * Math.PI * 2;
            const px = pad + w * (0.5 + Math.cos(ang) * (0.3 + Math.random() * 0.18));
            const py = pad + h * (0.55 + Math.sin(ang) * (0.22 + Math.random() * 0.12));
            const pr = h * (0.1 + Math.random() * 0.1);
            puff(clamp(px, pad * 0.5, cv.width - pad * 0.5), clamp(py, pad * 0.5, cv.height - pad * 0.5), pr, 0.4 + Math.random() * 0.25);
        }
        return cv;
    }

    // Warm-tinted cloud copy
    function tintCloudSprite(sprite) {
        const cv = document.createElement('canvas');
        cv.width = sprite.width;
        cv.height = sprite.height;
        const c = cv.getContext('2d');
        c.drawImage(sprite, 0, 0);
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = 'rgba(255, 148, 92, 0.6)';
        c.fillRect(0, 0, cv.width, cv.height);
        return cv;
    }

    const DEFAULT_SHADOW_STOPS = [[0, 'rgba(0, 0, 0, 0.99)'], [0.4, 'rgba(0, 0, 0, 0.78)'], [1, 'rgba(0, 0, 0, 0)']];

    function createSky(features = {}) {
        const feat = {
            sun: features.sun !== false,
            moon: features.moon !== false,
            clouds: features.clouds !== false,
            stars: features.stars !== false,
            mist: features.mist !== false
        };

        let W = 0, H = 0, SC = 1, BASE = 0;
        let clouds = [], stars = [];
        let sunR = 46, moonR = 34;
        let themeName = 'minimal';
        let hourOverride = null;

        // Static theme presets
        const THEMES = {
            dynamic: {},
            day: { hour: 9.2, sun: [0.17, 0.17] },
            night: { hour: 22, moon: [0.83, 0.17] }
        };

        function initSprites() {
            sunR = 46 * SC;
            moonR = 34 * SC;
            clouds = [];
            if (feat.clouds) {
                const n = clamp(Math.round(W / 260), 4, 9);
                for (let i = 0; i < n; i++) {
                    const scale = 0.55 + Math.random() * 0.9;
                    const cw = (200 + Math.random() * 90) * scale * SC;
                    const ch = cw * (0.34 + Math.random() * 0.16);
                    const sprite = makeCloudSprite(cw, ch);
                    clouds.push({
                        sprite,
                        warmSprite: tintCloudSprite(sprite),
                        x: Math.random() * (W + sprite.width),
                        y: H * (0.04 + Math.random() * 0.38),
                        w: sprite.width,
                        speed: (0.008 + scale * 0.014) * SC,
                        alpha: 0.55 + scale * 0.3
                    });
                }
            }
            stars = [];
            if (feat.stars) {
                const ns = Math.min(200, Math.floor((W * H) / 9000));
                for (let i = 0; i < ns; i++) {
                    stars.push({
                        x: Math.random() * W,
                        y: Math.random() * H * 0.75,
                        r: (0.4 + Math.random() * 1.1) * SC,
                        phase: Math.random() * Math.PI * 2,
                        speed: 0.0008 + Math.random() * 0.0022
                    });
                }
            }
        }

        function drawSun(ctx, x, y, a) {
            ctx.globalAlpha = a;
            const r = sunR;
            const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
            glow.addColorStop(0, 'rgba(255, 246, 200, 0.55)');
            glow.addColorStop(0.35, 'rgba(255, 240, 180, 0.18)');
            glow.addColorStop(1, 'rgba(255, 240, 180, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
            const core = ctx.createRadialGradient(x, y, 0, x, y, r);
            core.addColorStop(0, '#fffdf2');
            core.addColorStop(0.55, '#ffedb0');
            core.addColorStop(1, 'rgba(255, 228, 150, 0)');
            ctx.fillStyle = core;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Lit lunar region path
        function litMoonPath(ctx, x, y, r, p) {
            const litRight = p < 0.5;
            const term = Math.cos(2 * Math.PI * p);
            ctx.beginPath();
            ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !litRight);
            const ccw = litRight ? (term > 0) : (term < 0);
            ctx.ellipse(x, y, r * Math.abs(term), r, 0, Math.PI / 2, -Math.PI / 2, ccw);
            ctx.closePath();
        }

        function drawMoon(ctx, x, y, a, phase) {
            const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
            const r = moonR;

            ctx.globalAlpha = a * (0.25 + 0.75 * illum);
            const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
            glow.addColorStop(0, 'rgba(220, 232, 255, 0.35)');
            glow.addColorStop(0.35, 'rgba(200, 218, 255, 0.12)');
            glow.addColorStop(1, 'rgba(200, 218, 255, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);

            ctx.globalAlpha = a;
            ctx.fillStyle = 'rgba(150, 165, 195, 0.16)';
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

            if (illum > 0.005) {
                const disc = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
                disc.addColorStop(0, '#fbfbf2');
                disc.addColorStop(0.8, '#dbe0ec');
                disc.addColorStop(1, '#c3cbdd');
                ctx.fillStyle = disc;
                litMoonPath(ctx, x, y, r, phase);
                ctx.fill();

                ctx.save();
                litMoonPath(ctx, x, y, r, phase);
                ctx.clip();
                ctx.fillStyle = 'rgba(170, 180, 200, 0.35)';
                [[-0.32, -0.1, 0.16], [0.18, 0.22, 0.12], [0.05, -0.35, 0.09], [0.34, -0.14, 0.07]].forEach(([ox, oy, or]) => {
                    ctx.beginPath();
                    ctx.arc(x + r * ox, y + r * oy, r * or, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }
            ctx.globalAlpha = 1;
        }

        // Sky rendering engine
        function renderAt(ctx, hour, t, pins) {
            const daylight = rise(hour, 5.2, 7.2) * (1 - rise(hour, 18.2, 20.2));
            const warmth = Math.max(
                rise(hour, 5.4, 6.3) * (1 - rise(hour, 7.0, 8.2)),
                rise(hour, 17.6, 18.7) * (1 - rise(hour, 19.5, 20.2))
            );

            const [top, mid, bot] = sampleKeys(SKY_KEYS, hour).map(c => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`);
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, top);
            sky.addColorStop(0.55, mid);
            sky.addColorStop(1, bot);
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H);

            // Stars
            if (feat.stars) {
                const visible = clamp((1 - rise(hour, 4.8, 6.4)) + rise(hour, 19.4, 21), 0, 1);
                const midnightDepth = clamp(1 - Math.min(hour, 24 - hour) / 5, 0, 1);
                const starA = visible * (0.7 + 0.3 * midnightDepth);
                if (starA > 0.01) {
                    ctx.fillStyle = '#ffffff';
                    stars.forEach(s => {
                        ctx.globalAlpha = starA * (0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)));
                        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
                    });
                    ctx.globalAlpha = 1;
                }
            }

            // Sun
            if (feat.sun) {
                const sunA = rise(hour, 5.7, 6.6) * (1 - rise(hour, 18.8, 19.7));
                if (sunA > 0.01) {
                    const f = clamp((hour - SUNRISE) / (SUNSET - SUNRISE), 0, 1);
                    const x = pins.sun ? W * pins.sun[0] : W * (0.06 + 0.88 * f);
                    const y = pins.sun ? H * pins.sun[1] : H * 0.95 - Math.sin(Math.PI * f) * H * 0.83;
                    drawSun(ctx, x, y, sunA);
                }
            }

            // Moon
            if (feat.moon) {
                const moonA = clamp((1 - rise(hour, 5.0, 6.3)) + rise(hour, 18.9, 20.4), 0, 1);
                if (moonA > 0.01) {
                    const f = clamp(((hour - SUNSET + 24) % 24) / (24 - SUNSET + SUNRISE), 0, 1);
                    const x = pins.moon ? W * pins.moon[0] : W * (0.94 - 0.88 * f);
                    const y = pins.moon ? H * pins.moon[1] : H * 0.95 - Math.sin(Math.PI * f) * H * 0.8;
                    drawMoon(ctx, x, y, moonA, moonPhaseFraction(new Date()));
                }
            }

            // Clouds
            if (feat.clouds) {
                const cloudVis = 0.1 + 0.9 * daylight;
                clouds.forEach(cl => {
                    const x = ((cl.x + t * cl.speed) % (W + cl.w)) - cl.w;
                    ctx.globalAlpha = cl.alpha * cloudVis * (1 - warmth * 0.55);
                    ctx.drawImage(cl.sprite, x, cl.y);
                    if (warmth > 0.02) {
                        ctx.globalAlpha = cl.alpha * cloudVis * warmth;
                        ctx.drawImage(cl.warmSprite, x, cl.y);
                    }
                });
                ctx.globalAlpha = 1;
            }

            // Horizon mist
            if (feat.mist && daylight > 0.01) {
                const mistTop = BASE - H * 0.34;
                const mist = ctx.createLinearGradient(0, mistTop, 0, BASE + 40);
                mist.addColorStop(0, 'rgba(226, 238, 246, 0)');
                mist.addColorStop(0.7, `rgba(226, 238, 246, ${(0.34 * daylight).toFixed(3)})`);
                mist.addColorStop(1, `rgba(214, 230, 238, ${(0.5 * daylight).toFixed(3)})`);
                ctx.fillStyle = mist;
                ctx.fillRect(0, mistTop, W, BASE + 40 - mistTop);
            }

            // Ground shadow stops
            const gs = GROUND_NIGHT.map((n, i) => n.map((v, k) => v + (GROUND_DAY[i][k] - v) * daylight));
            const rgba = c => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
            const gsFade = gs[1].slice();
            gsFade[3] *= 0.45;
            return {
                shadowStops: [[0, rgba(gs[0])], [0.3, rgba(gs[1])], [0.62, rgba(gsFade)], [1, 'rgba(0, 0, 0, 0)']],
                lighting: sampleKeys(LIGHT_KEYS, hour)
            };
        }

        return {
            resize(w, h, sc, base) {
                W = w; H = h; SC = sc; BASE = base;
                if (themeName !== 'minimal') initSprites();
            },
            setTheme(name) {
                const prev = themeName;
                themeName = (name === 'minimal' || name === 'current') ? 'minimal'
                    : (THEMES[name] ? name : 'dynamic');
                if (themeName !== 'minimal' && (prev === 'minimal' || clouds.length + stars.length === 0)) initSprites();
            },
            setHourOverride(h) {
                hourOverride = (Number.isFinite(h) && h >= 0 && h <= 24) ? h : null;
            },
            get theme() { return themeName; },
            render(ctx, t) {
                if (themeName === 'minimal' || !W) return null;
                const preset = THEMES[themeName];
                let hour;
                if (preset.hour !== undefined) {
                    hour = preset.hour;
                } else if (hourOverride !== null) {
                    hour = hourOverride;
                } else {
                    const d = new Date();
                    hour = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
                }
                return renderAt(ctx, hour, t, preset);
            }
        };
    }

    return { createSky, DEFAULT_SHADOW_STOPS };
})();
