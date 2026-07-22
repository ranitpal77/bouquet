const messageInput = document.getElementById('message');
const presetsContainer = document.getElementById('presets');
const fontSelector = document.querySelector('.font-selector');
const linkPreview = document.getElementById('link-preview');
const btnCopy = document.getElementById('btn-copy');
const btnPreview = document.getElementById('btn-preview');
const toast = document.getElementById('toast');
const flowerCountInput = document.getElementById('flower-count');
const flowerTypeSelect = document.getElementById('flower-type');
const growValueInput = document.getElementById('grow-value');
const growUnitSelect = document.getElementById('grow-unit');
const backgroundSelect = document.getElementById('background-select');

let selectedPreset = null;
let selectedFont = 'inter';

// Responsive maximum flower count by device tier
function getMaxFlowers() {
    const w = window.innerWidth;
    if (w < 600) return 25;
    if (w < 1024) return 50;
    return 100;
}


let toastTimer = null;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Keep the flower-count input's max attribute (and hint) in sync with the tier,
function applyFlowerMax() {
    const max = getMaxFlowers();
    flowerCountInput.max = max;
    flowerCountInput.placeholder = `Auto count (Max ${max})`;
    const val = parseInt(flowerCountInput.value, 10);
    if (Number.isFinite(val) && val > max) {
        flowerCountInput.value = max;
        updateLink();
    }
}

function getBaseUrl() {
    const loc = window.location;
    const pathname = loc.pathname.replace(/\/create\/?(index\.html)?$/, '/');
    return loc.protocol + '//' + loc.host + pathname;
}

function updateLink() {
    const baseUrl = getBaseUrl();
    let url = baseUrl;
    const textValue = messageInput.value.trim();
    let hasQuery = false;

    if (selectedPreset) {
        url += `?${selectedPreset}`;
        hasQuery = true;
    } else if (textValue) {
        url += `?text=${encodeURIComponent(textValue)}`;
        hasQuery = true;
    }

    if (selectedPreset || textValue) {
        if (selectedFont === 'mono') {
            url += `&font=mono`;
        }
    }

    const appendParam = (key, value) => {
        url += (hasQuery ? '&' : '?') + `${key}=${value}`;
        hasQuery = true;
    };

    const countValue = parseInt(flowerCountInput.value, 10);
    if (Number.isFinite(countValue) && countValue > 0) {
        appendParam('count', Math.min(countValue, getMaxFlowers()));
    }

    if (flowerTypeSelect.value) {
        appendParam('flower', flowerTypeSelect.value);
    }

    // Growth timer parameter (capped at 1 hour max)
    const GROW_MAX = { sec: 3600, min: 60, hr: 1 };
    const growValue = parseFloat(growValueInput.value);
    if (Number.isFinite(growValue) && growValue > 0) {
        appendParam('grow', Math.min(growValue, GROW_MAX[growUnitSelect.value]));
        appendParam('unit', growUnitSelect.value);
    }

    if (backgroundSelect.value) {
        appendParam('bg', backgroundSelect.value);
    }

    linkPreview.value = url;
    linkPreview.scrollLeft = 0;
    btnPreview.href = url;
}

messageInput.addEventListener('input', () => {
    if (messageInput.value.trim() !== '') {
        selectedPreset = null;
        document.querySelectorAll('.preset-tag').forEach(tag => tag.classList.remove('active'));
    }
    updateLink();
});

presetsContainer.addEventListener('click', (e) => {
    const tag = e.target.closest('.preset-tag');
    if (!tag) return;

    const presetKey = tag.dataset.preset;

    if (tag.classList.contains('active')) {
        tag.classList.remove('active');
        selectedPreset = null;
    } else {
        document.querySelectorAll('.preset-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        selectedPreset = presetKey;
        messageInput.value = '';
    }
    updateLink();
});

fontSelector.addEventListener('click', (e) => {
    const option = e.target.closest('.font-option');
    if (!option) return;

    document.querySelectorAll('.font-option').forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
    selectedFont = option.dataset.font;
    updateLink();
});

flowerCountInput.addEventListener('input', () => {
    const max = getMaxFlowers();
    const val = parseInt(flowerCountInput.value, 10);
    if (Number.isFinite(val) && val > max) {
        flowerCountInput.value = max;
        showToast(`MAX is ${max}`);
    }
    updateLink();
});
flowerTypeSelect.addEventListener('change', updateLink);
growValueInput.addEventListener('input', updateLink);
growUnitSelect.addEventListener('change', () => {
    const GROW_MAX = { sec: 3600, min: 60, hr: 1 };
    growValueInput.max = GROW_MAX[growUnitSelect.value];
    const v = parseFloat(growValueInput.value);
    if (Number.isFinite(v) && v > GROW_MAX[growUnitSelect.value]) {
        growValueInput.value = GROW_MAX[growUnitSelect.value];
    }
    updateLink();
});
backgroundSelect.addEventListener('change', updateLink);

btnCopy.addEventListener('click', () => {
    const textToCopy = linkPreview.value;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Link copied! 🌸');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
});

updateLink();

// Device-based flower-count cap on load and whenever the viewport
applyFlowerMax();
window.addEventListener('resize', applyFlowerMax);

// Shared procedural sky background for creator UI
const bgCanvas = document.getElementById('bg');
const bgCtx = bgCanvas.getContext('2d');
const creatorSky = GardenBackground.createSky({ sun: false, moon: false, clouds: true, stars: true, mist: false });
const SKY_START = Date.now();

function resizeSky() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    let sc = Math.min(bgCanvas.width, bgCanvas.height) / 700;
    if (bgCanvas.width < 600) sc = bgCanvas.width / 350;
    creatorSky.resize(bgCanvas.width, bgCanvas.height, sc, bgCanvas.height * 0.95);
}

function drawSky() {
    const frame = creatorSky.render(bgCtx, Date.now() - SKY_START);
    if (!frame) {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    } else if (frame.lighting) {
        const [lr, lg, lb, la] = frame.lighting;
        if (la > 0.004) {
            bgCtx.fillStyle = `rgba(${Math.round(lr)}, ${Math.round(lg)}, ${Math.round(lb)}, ${la.toFixed(3)})`;
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        }
    }
    requestAnimationFrame(drawSky);
}

resizeSky();
window.addEventListener('resize', resizeSky);
creatorSky.setTheme(backgroundSelect.value || 'dynamic');
backgroundSelect.addEventListener('change', () => creatorSky.setTheme(backgroundSelect.value || 'dynamic'));
drawSky();
