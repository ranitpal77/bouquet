const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H, CX, BASE, SC;

const flowers = [];
const START = Date.now();

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    CX = W / 2;
    BASE = H * 0.95;
    SC = Math.min(W, H) / 700;
    if (W < 600) SC = W / 350;
    updateFlowerPositions();
}

/* ── HELPERS ─────────────────────────────── */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = x => 1 - Math.pow(1 - x, 3);
const seg = (p, s, e) => easeOut(clamp((p - s) / (e - s), 0, 1));

function bezPt(x0, y0, cx1, cy1, cx2, cy2, x1, y1, t) {
    const m = 1 - t;
    return [
        m * m * m * x0 + 3 * m * m * t * cx1 + 3 * m * t * t * cx2 + t * t * t * x1,
        m * m * m * y0 + 3 * m * m * t * cy1 + 3 * m * t * t * cy2 + t * t * t * y1
    ];
}

function bezAngle(x0, y0, cx1, cy1, cx2, cy2, x1, y1, t) {
    const m = 1 - t;
    const dx = 3 * m * m * (cx1 - x0) + 6 * m * t * (cx2 - cx1) + 3 * t * t * (x1 - cx2);
    const dy = 3 * m * m * (cy1 - y0) + 6 * m * t * (cy2 - cy1) + 3 * t * t * (y1 - cy2);
    return Math.atan2(dy, dx);
}

/* ── ENVIRONMENT ─────────────────────────── */
function drawEnvironment() {
    // Draw a subtle ambient reflection pool near the flower bases
    const pool = ctx.createRadialGradient(CX, BASE, 10, CX, BASE - 20, W);
    pool.addColorStop(0, 'rgba(40, 20, 10, 0.2)');
    pool.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pool;
    ctx.fillRect(0, BASE - 100, W, H - (BASE - 100));
}

function drawStemPoints(points, prog, thick, col) {
    if (prog <= 0 || points.length === 0) return;
    ctx.beginPath();
    const limit = Math.floor((points.length - 1) * prog);
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i <= limit; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    if (prog < 1 && limit < points.length - 1) {
        const nextPt = points[limit + 1];
        const currPt = points[limit];
        const factor = ((points.length - 1) * prog) - limit;
        const px = currPt[0] + (nextPt[0] - currPt[0]) * factor;
        const py = currPt[1] + (nextPt[1] - currPt[1]) * factor;
        ctx.lineTo(px, py);
    }
    ctx.strokeStyle = col; ctx.lineWidth = thick; ctx.lineCap = 'round';
    ctx.stroke();
}

// LILY
function drawLilyLeaf(x, y, rot, size, prog) {
    if (prog <= 0) return;
    const s = size * prog;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.15, s * 0.15, s, 0);
    ctx.quadraticCurveTo(s * 0.15, -s * 0.15, 0, 0);
    const lg = ctx.createLinearGradient(0, 0, s, 0);
    lg.addColorStop(0, '#2d5e20'); lg.addColorStop(1, '#509c3c');
    ctx.fillStyle = lg; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.5, 0, s * 0.9, 0);
    ctx.strokeStyle = 'rgba(0, 40, 0, 0.4)'; ctx.lineWidth = s * 0.02; ctx.stroke();
    ctx.restore();
}
function drawLilyFlower(x, y, size, prog, wob, stemAngle) {
    const s = size * prog * 1.6;
    const rot = (stemAngle + Math.PI / 2) * 0.3 + wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.7);
    pg.addColorStop(0, '#b8e69c'); pg.addColorStop(0.25, '#f5fceb');
    pg.addColorStop(0.8, '#ffffff'); pg.addColorStop(1, '#f2f2f2');

    const drawPetal = (rad, w) => {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-rad * 0.3 * w, -rad * 0.3, -rad * 0.2 * w, -rad * 0.8, 0, -rad);
        ctx.bezierCurveTo(rad * 0.2 * w, -rad * 0.8, rad * 0.3 * w, -rad * 0.3, 0, 0);
        ctx.fillStyle = pg; ctx.fill();
        ctx.strokeStyle = 'rgba(100, 150, 80, 0.15)'; ctx.lineWidth = rad * 0.015;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(rad * 0.02, -rad * 0.5, 0, -rad * 0.9); ctx.stroke();
    }
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i * Math.PI * 2 / 3)); drawPetal(s * 0.9, 0.85); ctx.restore(); }
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i * Math.PI * 2 / 3) + Math.PI / 3); drawPetal(s, 1.0); ctx.restore(); }
    for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate((i * Math.PI * 2 / 6) + Math.PI / 6);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.11, -s * 0.33, 0, -s * 0.55);
        ctx.strokeStyle = '#cce3b6'; ctx.lineWidth = s * 0.02; ctx.stroke();
        ctx.translate(0, -s * 0.55); ctx.rotate(Math.PI / 2 + 0.2);
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.04, s * 0.12, 0, 0, Math.PI * 2); ctx.fillStyle = '#9c3d03'; ctx.fill();
        ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.65); ctx.strokeStyle = '#9dc779'; ctx.lineWidth = s * 0.035; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -s * 0.65, s * 0.04, 0, Math.PI * 2); ctx.fillStyle = '#7aab4d'; ctx.fill();
    ctx.restore();
}

// ROSE
function drawRoseFlower(x, y, size, prog, wob, stemAngle) {
    const s = size * prog * 1.3;
    const rot = (stemAngle + Math.PI / 2) + wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);

    ctx.fillStyle = '#4a000c'; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.1, -s * 0.6, -s * 0.8, -s * 0.35, -s * 1.1);
    ctx.quadraticCurveTo(0, -s * 1.05, s * 0.35, -s * 1.1);
    ctx.bezierCurveTo(s * 0.6, -s * 0.8, s * 0.5, -s * 0.1, 0, 0); ctx.fill();
    ctx.fillStyle = '#730017'; ctx.beginPath(); ctx.moveTo(-s * 0.25, -s * 0.3); ctx.lineTo(-s * 0.25, -s * 0.95);
    ctx.quadraticCurveTo(0, -s * 1.1, s * 0.25, -s * 0.95); ctx.lineTo(s * 0.25, -s * 0.3); ctx.fill();
    ctx.strokeStyle = '#260006'; ctx.lineWidth = s * 0.025; ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.95); ctx.quadraticCurveTo(s * 0.1, -s * 0.8, -s * 0.05, -s * 0.5); ctx.stroke();
    ctx.fillStyle = '#a60022'; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s * 0.5, 0, -s * 0.6, -s * 0.7, -s * 0.3, -s * 1.0);
    ctx.bezierCurveTo(-s * 0.1, -s * 0.8, 0, -s * 0.5, 0, -s * 0.2); ctx.fill();
    ctx.fillStyle = '#d9002d'; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 0.5, 0, s * 0.6, -s * 0.7, s * 0.3, -s * 1.0);
    ctx.bezierCurveTo(s * 0.1, -s * 0.8, 0, -s * 0.5, 0, -s * 0.2); ctx.fill();
    ctx.fillStyle = '#ff0d3d'; ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.4);
    ctx.quadraticCurveTo(0, -s * 0.15, s * 0.35, -s * 0.4); ctx.quadraticCurveTo(0, s * 0.05, -s * 0.35, -s * 0.4); ctx.fill();
    ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.moveTo(-s * 0.25, -s * 0.35);
    ctx.quadraticCurveTo(0, -s * 0.15, s * 0.25, -s * 0.35); ctx.quadraticCurveTo(0, -s * 0.05, -s * 0.25, -s * 0.35); ctx.fill();

    ctx.fillStyle = '#1b6522'; ctx.beginPath(); ctx.moveTo(0, s * 0.05);
    ctx.lineTo(-s * 0.3, -s * 0.1); ctx.lineTo(-s * 0.1, -s * 0.02); ctx.lineTo(-s * 0.4, -s * 0.25);
    ctx.lineTo(-s * 0.15, -s * 0.05); ctx.lineTo(0, -s * 0.15); ctx.lineTo(s * 0.15, -s * 0.05);
    ctx.lineTo(s * 0.4, -s * 0.25); ctx.lineTo(s * 0.1, -s * 0.02); ctx.lineTo(s * 0.3, -s * 0.1); ctx.fill();
    ctx.restore();
}

// SUNFLOWER
function drawSunflowerLeaf(x, y, rot, size, prog) {
    if (prog <= 0) return; const s = size * prog;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.4, s * 0.3, s, 0); ctx.quadraticCurveTo(s * 0.4, -s * 0.3, 0, 0);
    const lg = ctx.createLinearGradient(0, 0, s, 0); lg.addColorStop(0, '#1b6522'); lg.addColorStop(1, '#348f32');
    ctx.fillStyle = lg; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.5, 0, s * 0.9, 0);
    ctx.strokeStyle = 'rgba(0, 50, 0, 0.4)'; ctx.lineWidth = s * 0.03; ctx.stroke();
    ctx.restore();
}
function drawSunflowerFlower(x, y, size, prog, wob, stemAngle) {
    const s = size * prog * 1.5;
    const rot = (stemAngle + Math.PI / 2) * 0.4 + wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);

    const drawRing = (rad, c, col, off) => {
        ctx.fillStyle = col;
        for (let i = 0; i < c; i++) {
            ctx.save(); ctx.rotate((i / c) * Math.PI * 2 + off);
            ctx.beginPath(); ctx.moveTo(0, -rad * 0.1); ctx.quadraticCurveTo(rad * 0.2, -rad * 0.5, 0, -rad);
            ctx.quadraticCurveTo(-rad * 0.2, -rad * 0.5, 0, -rad * 0.1); ctx.fill();
            ctx.strokeStyle = 'rgba(210, 100, 0, 0.3)'; ctx.lineWidth = rad * 0.015;
            ctx.beginPath(); ctx.moveTo(0, -rad * 0.2); ctx.lineTo(0, -rad * 0.85); ctx.stroke(); ctx.restore();
        }
    };
    ctx.fillStyle = '#1b6522';
    for (let i = 0; i < 16; i++) {
        ctx.save(); ctx.rotate((i / 16) * Math.PI * 2); ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-s * 0.08, -s * 0.4); ctx.lineTo(0, -s * 0.55); ctx.lineTo(s * 0.08, -s * 0.4); ctx.fill(); ctx.restore();
    }
    drawRing(s * 0.95, 24, '#ffaa00', 0);
    drawRing(s * 0.85, 24, '#ffd700', Math.PI / 24);

    ctx.fillStyle = '#4a2511'; ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3b10'; ctx.beginPath(); ctx.arc(0, 0, s * 0.33, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1805'; ctx.beginPath(); ctx.arc(0, 0, s * 0.20, 0, Math.PI * 2); ctx.fill();
    
    // Optimized seed rendering: 45 seeds instead of 200, slightly larger size
    ctx.fillStyle = '#6b4412';
    const seeds = Math.min(45, Math.floor(45 * prog));
    for (let i = 0; i < seeds; i++) {
        const r = Math.sqrt(i) * (s * 0.052); 
        if (r > s * 0.38) break;
        const a = i * 2.39996; 
        ctx.beginPath(); 
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, s * 0.021, 0, Math.PI * 2); 
        ctx.fill();
    }
    ctx.restore();
}

// TULIP
function drawTulipLeaf(x, y, rot, size, prog) {
    if (prog <= 0) return; const s = size * prog;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 0.3, s * 0.25, s * 0.8, s * 0.1, s, 0);
    ctx.bezierCurveTo(s * 0.8, -s * 0.15, s * 0.3, -s * 0.25, 0, 0);
    const lg = ctx.createLinearGradient(0, 0, s, 0);
    lg.addColorStop(0, '#2e5441'); lg.addColorStop(0.5, '#4b7a62'); lg.addColorStop(1, '#335e47');
    ctx.fillStyle = lg; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.5, 0, s * 0.9, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = s * 0.03; ctx.stroke();
    ctx.restore();
}
function drawTulipFlower(x, y, size, prog, wob, stemAngle) {
    const s = size * prog * 1.5;
    const rot = (stemAngle + Math.PI / 2) * 0.2 + wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const pg = ctx.createLinearGradient(0, -s, 0, 0);
    pg.addColorStop(0, '#fce4ec'); pg.addColorStop(0.3, '#f48fb1');
    pg.addColorStop(0.7, '#d81b60'); pg.addColorStop(1, '#7a9650');
    ctx.fillStyle = pg;

    ctx.beginPath(); ctx.moveTo(-s * 0.1, 0); ctx.bezierCurveTo(-s * 0.35, -s * 0.4, -s * 0.25, -s * 0.95, 0, -s * 1.05); ctx.bezierCurveTo(s * 0.25, -s * 0.95, s * 0.35, -s * 0.4, s * 0.1, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-s * 0.4, -s * 0.1, -s * 0.55, -s * 0.7, -s * 0.3, -s * 0.95); ctx.bezierCurveTo(-s * 0.1, -s * 0.8, 0, -s * 0.4, 0, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 0.4, -s * 0.1, s * 0.55, -s * 0.7, s * 0.3, -s * 0.95); ctx.bezierCurveTo(s * 0.1, -s * 0.8, 0, -s * 0.4, 0, 0); ctx.fill();

    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-s * 0.45, -s * 0.3, -s * 0.45, -s * 0.85, -s * 0.1, -s * 1.0); ctx.bezierCurveTo(0, -s * 0.8, s * 0.1, -s * 0.3, 0, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 0.45, -s * 0.3, s * 0.45, -s * 0.85, s * 0.1, -s * 1.0); ctx.bezierCurveTo(0, -s * 0.8, -s * 0.1, -s * 0.3, 0, 0); ctx.fill();

    const fg = ctx.createLinearGradient(0, -s, 0, 0);
    fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.2, '#ff80ab'); fg.addColorStop(0.7, '#c2185b'); fg.addColorStop(1, '#556b2f');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(-s * 0.15, 0); ctx.bezierCurveTo(-s * 0.35, -s * 0.4, -s * 0.25, -s * 0.9, 0, -s * 0.95); ctx.bezierCurveTo(s * 0.25, -s * 0.9, s * 0.35, -s * 0.4, s * 0.15, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = s * 0.015; ctx.stroke();
    ctx.restore();
}

// GENERIC AESTHETIC
function drawGenericFlower(x, y, size, prog, wob) {
    const s = size * prog;
    const rot = wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.rotate((i / 5) * Math.PI * 2 - Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, -s * 0.58, s * 0.295, s * 0.46, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e04838'; ctx.fill(); ctx.restore();
    }
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.31);
    cg.addColorStop(0, '#fff8d0'); cg.addColorStop(0.42, '#ffcc44'); cg.addColorStop(1, '#ff9922');
    ctx.beginPath(); ctx.arc(0, 0, s * 0.29, 0, Math.PI * 2); ctx.fillStyle = cg; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, s * 0.10, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,252,200,0.92)'; ctx.fill(); ctx.restore();
}

/* ── GAME/INTERACTION LOGIC ─────────────── */
const FLOWER_DEFS = {
    lily: { sd: '#234a1c', sl: '#468f3b', leaves: [0.2, 0.5, 0.8] },
    rose: { sd: '#1b6522', sl: '#2caa38', leaves: [] },
    sunflower: { sd: '#164a1a', sl: '#2caa38', leaves: [0.3, 0.6] },
    tulip: { sd: '#365e47', sl: '#518567', leaves: [0.2, 0.4] },
    generic: { sd: '#1b6522', sl: '#2caa38', leaves: [] }
};

function updateFlowerPositions() {
    flowers.forEach(f => {
        f.bx = f.rbx * W;
        f.by = f.rby * H;
        f.tx = f.rx * W;
        f.ty = f.ry * H;
        f.cp1x = f.rcp1x * W;
        f.cp1y = f.rcp1y * H;
        f.cp2x = f.rcp2x * W;
        f.cp2y = f.rcp2y * H;
        f.size = f.rSize * SC;
        f.thick = f.rThick * SC;

        // Re-calculate stem points
        f.stemPoints = [];
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
            f.stemPoints.push(bezPt(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, i / steps));
        }

        // Re-calculate leaf positions
        f.leafData = f.leaves.map((lt, leafIdx) => {
            const [lx, ly] = bezPt(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, lt);
            const lAngle = bezAngle(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, lt);
            return {
                lt, lx, ly, lAngle,
                lDir: f.leafData && f.leafData[leafIdx] ? f.leafData[leafIdx].lDir : (leafIdx % 2 === 0 ? f.dir : -f.dir)
            };
        });

        f.headAngle = bezAngle(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, 1.0);
    });
}

function spawnAutomaticFlowers() {
    flowers.length = 0;
    const count = W < 600 ? 10 : (W < 1024 ? 14 : 20); // mobile: 10, tablet: 14, desktop: 20
    const types = Object.keys(FLOWER_DEFS);

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const def = FLOWER_DEFS[type];

        const fraction = (i + 0.5) / count;
        let tx = 50 + fraction * (W - 100) + (Math.random() - 0.5) * (W / count * 0.4);
        let ty = BASE - 120 - Math.random() * (H * 0.45);

        if (tx < 50) tx = 50;
        if (tx > W - 50) tx = W - 50;
        if (ty < 80) ty = 80;
        if (ty > BASE - 100) ty = BASE - 100;

        const size = (30 + Math.random() * 20) * SC;
        const thick = (3 + Math.random() * 1.2) * SC;

        const xSpread = ((tx / W) - 0.5) * (W * 0.35);
        const bx = CX + xSpread;
        const by = BASE + Math.random() * 15;

        const cp1x = bx;
        const cp1y = by - Math.abs(by - ty) * 0.4;
        const cp2x = tx - (tx - bx) * 0.2;
        const cp2y = ty + Math.abs(by - ty) * 0.4;

        const f = {
            type,
            rx: tx / W,
            ry: ty / H,
            rbx: bx / W,
            rby: by / H,
            rcp1x: cp1x / W,
            rcp1y: cp1y / H,
            rcp2x: cp2x / W,
            rcp2y: cp2y / H,
            rSize: size / SC,
            rThick: thick / SC,
            leaves: def.leaves,
            startTime: Date.now() + i * 180 + Math.random() * 80,
            duration: 2200 + Math.random() * 1000,
            wobble: Math.random() * Math.PI * 2,
            sd: def.sd,
            sl: def.sl,
            dir: Math.random() < 0.5 ? 1 : -1
        };

        flowers.push(f);
    }
    updateFlowerPositions();
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    drawEnvironment();

    const now = Date.now();
    const t = now - START;

    // Pass 1: Draw Stems and Leaves
    flowers.forEach((f) => {
        const rawP = Math.min((now - f.startTime) / f.duration, 1);
        if (rawP <= 0) return;
        
        const sp = easeOut(rawP);

        // Draw Stems
        drawStemPoints(f.stemPoints, sp, f.thick, f.sd);
        drawStemPoints(f.stemPoints, sp, f.thick * 0.5, f.sl);

        // Draw Leaves
        f.leafData.forEach((ld) => {
            if (sp > ld.lt) {
                const lProg = clamp((sp - ld.lt) * 4, 0, 1);
                if (f.type === 'lily') {
                    drawLilyLeaf(ld.lx, ld.ly, ld.lAngle + (Math.PI / 2.8) * ld.lDir, f.size * 1.5, lProg);
                } else if (f.type === 'sunflower') {
                    drawSunflowerLeaf(ld.lx, ld.ly, ld.lAngle + (Math.PI / 2.5) * ld.lDir, f.size * 1.6, lProg);
                } else if (f.type === 'tulip') {
                    drawTulipLeaf(ld.lx, ld.ly, ld.lAngle + (Math.PI / 8) * ld.lDir, f.size * 2.2, lProg);
                }
            }
        });
    });

    // Pass 2: Draw a soft fading bottom shadow to hide the starting point of the flower stems
    const shadowGrad = ctx.createLinearGradient(0, H, 0, BASE - 110);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.98)');
    shadowGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.75)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, BASE - 110, W, H - (BASE - 110));

    // Pass 3: Draw Flower Heads on top of the bottom shadow overlay
    flowers.forEach((f) => {
        const rawP = Math.min((now - f.startTime) / f.duration, 1);
        if (rawP <= 0) return;
        
        const sp = easeOut(rawP);
        const fp = easeOut(clamp((rawP - 0.5) / 0.5, 0, 1));

        let fx, fy;
        if (sp < 1) {
            const idx = (f.stemPoints.length - 1) * sp;
            const limit = Math.floor(idx);
            const currPt = f.stemPoints[limit];
            if (limit < f.stemPoints.length - 1) {
                const nextPt = f.stemPoints[limit + 1];
                const factor = idx - limit;
                fx = currPt[0] + (nextPt[0] - currPt[0]) * factor;
                fy = currPt[1] + (nextPt[1] - currPt[1]) * factor;
            } else {
                fx = currPt[0];
                fy = currPt[1];
            }
        } else {
            fx = f.tx;
            fy = f.ty;
        }

        const wob = Math.sin(t * 0.0013 + f.wobble) * 0.05;

        if (f.type === 'lily') drawLilyFlower(fx, fy, f.size, fp, wob, f.headAngle);
        else if (f.type === 'rose') drawRoseFlower(fx, fy, f.size, fp, wob, f.headAngle);
        else if (f.type === 'sunflower') drawSunflowerFlower(fx, fy, f.size, fp, wob, f.headAngle);
        else if (f.type === 'tulip') drawTulipFlower(fx, fy, f.size, fp, wob, f.headAngle);
        else if (f.type === 'generic') drawGenericFlower(fx, fy, f.size, fp, wob);
    });

    requestAnimationFrame(draw);
}

resize();
window.addEventListener('resize', resize);
spawnAutomaticFlowers();
draw();

// Retrieve text from Query Parameter (e.g. ?text=Happy+Birthday or preset flags like ?birthday or ?exam)
const urlParams = new URLSearchParams(window.location.search);
let textParam = urlParams.get('text') || urlParams.get('msg');
const fontParam = urlParams.get('font');
const uiElement = document.getElementById('ui');

// Check for preset situational flags if no custom text is provided
if (!textParam) {
    if (urlParams.has('birthday')) {
        textParam = "Happy Birthday! Wishing you a beautiful day 🌸🎂";
    } else if (urlParams.has('exam')) {
        textParam = "Best wishes for your exam! You've got this! 📝✨";
    } else if (urlParams.has('love') || urlParams.has('anniversary')) {
        textParam = "Thinking of you always... ❤️🌸";
    } else if (urlParams.has('sorry')) {
        textParam = "I'm so sorry. Here are some flowers for you... 🌸🥺";
    } else if (urlParams.has('getwell')) {
        textParam = "Get well soon! Wishing you a speedy recovery 🌸🍵";
    } else if (urlParams.has('thankyou') || urlParams.has('thanks')) {
        textParam = "Thank you so much! 🌸✨";
    } else if (urlParams.has('cheer')) {
        textParam = "Just a little garden to brighten your day! 🌸✨";
    }
}

if (textParam) {
    uiElement.textContent = textParam;
    if (fontParam === 'mono' || fontParam === 'jetbrains') {
        uiElement.style.fontFamily = "'JetBrains Mono', monospace";
    } else {
        uiElement.style.fontFamily = "'Inter', sans-serif";
    }
    uiElement.style.display = 'block';
} else {
    uiElement.style.display = 'none';
}
