/* Custom t-shirt designer: pick a shirt color, add premade layouts,
   uploaded images or text to the front/back, drag them around, then
   add the design to the bag or download a mockup PNG. */
const Customizer = (() => {
  const $ = s => document.querySelector(s);
  const preview = $('#cz-preview');
  const stage = $('#cz-stage');

  const SWATCHES = ['#ffffff', '#f6efe4', '#cfcbc2', '#15171c', '#1f2a44', '#2f5d50', '#7a1f2b', '#ead0d2', '#f2c14e', '#5b8def'];
  const BASE_PRICE = 26, SIDE_PRICE = 7;

  const state = {
    color: '#ffffff', side: 'front', size: 'M', qty: 1,
    layers: { front: [], back: [] },
    selected: null
  };
  let nextId = 1;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const current = () => state.layers[state.side];
  const findLayer = id => current().find(l => l.id === id);

  /* ---------- rendering ---------- */
  function layerSize(L) {
    if (L.kind === 'image') return [110, 110 * L.ar];
    if (L.kind === 'text') return [Math.max(40, L.text.length * 26 * 0.64), 36];
    return [110, 110];
  }

  const transformOf = (L, side) => {
    const pa = Art.PRINT_AREA[side];
    return `translate(${pa.x + L.x} ${pa.y + L.y}) rotate(${L.rot}) scale(${L.scale})`;
  };

  function layerMarkup(L, side, editing) {
    const [w, h] = layerSize(L);
    let inner;
    if (L.kind === 'layout') {
      inner = `<g transform="translate(${-w / 2} ${-h / 2}) scale(${w / 200})">${Layouts.list[L.layout].draw(Art.uid(), Art.inkFor(state.color))}</g>`;
    } else if (L.kind === 'image') {
      inner = `<image href="${L.src}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
    } else {
      inner = `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-family="${esc(L.font)}" font-weight="800" font-size="26" fill="${L.fill}">${esc(L.text)}</text>`;
    }
    const sel = editing && L.id === state.selected
      ? `<rect x="${-w / 2 - 5}" y="${-h / 2 - 5}" width="${w + 10}" height="${h + 10}" fill="none" stroke="#ff5a1f" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>`
      : '';
    const hit = editing ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="transparent"/>` : '';
    return `<g data-layer="${L.id}" transform="${transformOf(L, side)}" style="${editing ? 'cursor:move' : ''}">${hit}${inner}${sel}</g>`;
  }

  function shirtSVG(side, editing) {
    const print = state.layers[side].map(L => layerMarkup(L, side, editing)).join('');
    let svg = Art.shirt({ color: state.color, side, print });
    if (editing) {
      const pa = Art.PRINT_AREA[side];
      const guide = `<rect x="${pa.x}" y="${pa.y}" width="${pa.w}" height="${pa.h}" fill="none" stroke="${Art.inkFor(state.color)}" stroke-opacity=".25" stroke-dasharray="4 5" pointer-events="none"/>`;
      svg = svg.replace(/<\/svg>\s*$/, guide + '</svg>');
    }
    return svg;
  }

  function render() {
    preview.innerHTML = shirtSVG(state.side, true);
    renderControls();
  }

  function renderControls() {
    document.querySelectorAll('[data-side]').forEach(b => b.classList.toggle('active', b.dataset.side === state.side));
    document.querySelectorAll('#cz-colors .swatch').forEach(s => s.classList.toggle('active', s.dataset.color === state.color));
    $('#cz-color-input').value = state.color;

    const L = state.selected && findLayer(state.selected);
    const panel = $('#cz-layer-panel');
    panel.hidden = !L;
    if (L) {
      $('#cz-scale').value = L.scale;
      $('#cz-rot').value = L.rot;
      $('#cz-layer-name').textContent = L.kind === 'layout' ? Layouts.list[L.layout].name : L.kind === 'image' ? 'Your image' : `“${L.text}”`;
    }

    const sides = ['front', 'back'].filter(s => state.layers[s].length).length;
    const price = BASE_PRICE + sides * SIDE_PRICE;
    $('#cz-price').textContent = money(price * state.qty);
    $('#cz-price-note').textContent = sides ? `Base ${money(BASE_PRICE)} + ${sides} printed side${sides > 1 ? 's' : ''}` : 'Plain tee · add a design to print';
    $('#cz-qty').textContent = state.qty;
    document.querySelectorAll('#cz-count-front, #cz-count-back').forEach(el => {
      const n = state.layers[el.id.endsWith('front') ? 'front' : 'back'].length;
      el.textContent = n ? n : '';
    });
  }

  function addLayer(props) {
    const pa = Art.PRINT_AREA[state.side];
    const L = { id: nextId++, x: pa.w / 2, y: pa.h * (props.kind === 'text' ? 0.82 : 0.4), scale: 1, rot: 0, ...props };
    const [w] = layerSize(L);
    L.scale = Math.min(1, (pa.w - 12) / w); // fit inside the print area
    current().push(L);
    state.selected = L.id;
    render();
  }

  function setSide(side) {
    if (side === state.side) return;
    state.selected = null;
    stage.classList.add('turn');
    setTimeout(() => {
      state.side = side;
      render();
      stage.classList.remove('turn');
    }, 220);
  }

  /* ---------- dragging ---------- */
  let drag = null;
  const toSVG = e => {
    const svg = preview.querySelector('svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  preview.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-layer]');
    if (!g) {
      if (state.selected) { state.selected = null; render(); }
      return;
    }
    const L = findLayer(+g.dataset.layer);
    if (state.selected !== L.id) { state.selected = L.id; render(); }
    const p = toSVG(e);
    drag = { L, dx: L.x - p.x, dy: L.y - p.y };
    preview.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  preview.addEventListener('pointermove', e => {
    if (!drag) return;
    const pa = Art.PRINT_AREA[state.side];
    const p = toSVG(e);
    drag.L.x = Math.min(pa.w, Math.max(0, p.x + drag.dx));
    drag.L.y = Math.min(pa.h, Math.max(0, p.y + drag.dy));
    preview.querySelector(`[data-layer="${drag.L.id}"]`)?.setAttribute('transform', transformOf(drag.L, state.side));
  });

  const endDrag = () => { drag = null; };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);

  // Arrow keys nudge the selected layer
  preview.addEventListener('keydown', e => {
    const L = state.selected && findLayer(state.selected);
    const d = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[e.key];
    if (L && d) { L.x += d[0]; L.y += d[1]; render(); e.preventDefault(); }
    if (L && (e.key === 'Delete' || e.key === 'Backspace')) { removeSelected(); e.preventDefault(); }
  });

  function removeSelected() {
    state.layers[state.side] = current().filter(l => l.id !== state.selected);
    state.selected = null;
    render();
  }

  /* ---------- controls ---------- */
  $('#cz-colors').innerHTML = SWATCHES.map(c => `<button class="swatch" data-color="${c}" style="--c:${c}" aria-label="Shirt color ${c}"></button>`).join('');
  $('#cz-colors').addEventListener('click', e => {
    const s = e.target.closest('.swatch');
    if (s) { state.color = s.dataset.color; render(); }
  });
  $('#cz-color-input').addEventListener('input', e => { state.color = e.target.value; render(); });

  document.querySelectorAll('[data-side]').forEach(b => b.addEventListener('click', () => setSide(b.dataset.side)));

  document.querySelectorAll('[data-tab]').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === t));
    document.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== t.dataset.tab);
  }));

  $('#cz-layouts').innerHTML = Object.entries(Layouts.list).map(([k, v]) =>
    `<button class="layout-btn" data-layout="${k}" title="${v.name}">${Layouts.thumb(k)}<span>${v.name}</span></button>`).join('');
  $('#cz-layouts').addEventListener('click', e => {
    const b = e.target.closest('[data-layout]');
    if (b) addLayer({ kind: 'layout', layout: b.dataset.layout });
  });

  // Upload: downscale big images so the design stays light
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) { toast('Please choose an image file'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 700, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const src = file.type === 'image/jpeg' ? c.toDataURL('image/jpeg', 0.88) : c.toDataURL('image/png');
        addLayer({ kind: 'image', src, ar: c.height / c.width });
        toast('Image added. Drag it to position');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  $('#cz-upload').addEventListener('change', e => { handleFile(e.target.files[0]); e.target.value = ''; });
  const drop = $('#cz-drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));

  $('#cz-add-text').addEventListener('click', () => {
    const text = $('#cz-text').value.trim();
    if (!text) { $('#cz-text').focus(); return; }
    addLayer({ kind: 'text', text: text.slice(0, 24), font: $('#cz-font').value, fill: $('#cz-text-color').value });
    $('#cz-text').value = '';
  });
  $('#cz-text').addEventListener('keydown', e => { if (e.key === 'Enter') $('#cz-add-text').click(); });

  const liveUpdate = (key, el) => el.addEventListener('input', () => {
    const L = state.selected && findLayer(state.selected);
    if (!L) return;
    L[key] = +el.value;
    preview.querySelector(`[data-layer="${L.id}"]`)?.setAttribute('transform', transformOf(L, state.side));
  });
  liveUpdate('scale', $('#cz-scale'));
  liveUpdate('rot', $('#cz-rot'));
  $('#cz-delete').addEventListener('click', removeSelected);
  $('#cz-center').addEventListener('click', () => {
    const L = findLayer(state.selected);
    const pa = Art.PRINT_AREA[state.side];
    L.x = pa.w / 2; L.rot = 0;
    render();
  });

  $('#cz-sizes').innerHTML = SIZES.tee.map(s => `<button class="chip${s === state.size ? ' active' : ''}" data-size="${s}">${s}</button>`).join('');
  $('#cz-sizes').addEventListener('click', e => {
    const c = e.target.closest('[data-size]');
    if (!c) return;
    state.size = c.dataset.size;
    document.querySelectorAll('#cz-sizes .chip').forEach(x => x.classList.toggle('active', x === c));
  });
  $('#cz-qty-wrap').addEventListener('click', e => {
    const d = e.target.closest('[data-d]');
    if (d) { state.qty = Math.max(1, state.qty + +d.dataset.d); renderControls(); }
  });

  $('#cz-reset').addEventListener('click', () => {
    state.layers = { front: [], back: [] };
    state.selected = null;
    render();
  });

  $('#cz-add').addEventListener('click', () => {
    const sides = ['front', 'back'].filter(s => state.layers[s].length);
    const price = BASE_PRICE + sides.length * SIDE_PRICE;
    const thumbSide = sides[0] || 'front';
    Cart.add({
      id: 'custom-tee', name: 'Custom Tee', price, size: state.size, qty: state.qty, custom: true,
      thumb: shirtSVG(thumbSide, false)
    });
  });

  $('#cz-download').addEventListener('click', () => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 1000; c.height = 1100;
      const x = c.getContext('2d');
      x.fillStyle = '#ece9e2';
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, 1000, 1100);
      try {
        const a = document.createElement('a');
        a.download = `custom-tee-${state.side}.png`;
        a.href = c.toDataURL('image/png');
        a.click();
      } catch (err) {
        toast('Your browser blocked the download');
      }
    };
    img.src = Art.toDataURL(shirtSVG(state.side, false));
  });

  // Called from the shop's "Customize this tee"
  function load({ color, layout }) {
    state.color = color;
    state.layers = { front: [], back: [] };
    state.side = 'front';
    if (layout) addLayer({ kind: 'layout', layout });
    else render();
  }

  render();
  return { load };
})();
