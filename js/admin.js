/* Demo admin: add / edit / delete products, set badges and the homepage hero.
   The catalog is saved to localStorage (read by data.js on the store) and can
   be exported as a replacement js/catalog.js. */
(() => {
  const $ = s => document.querySelector(s);
  const form = $('#editor-form');
  const F = form.elements;
  const clone = o => JSON.parse(JSON.stringify(o));

  let products = clone(PRODUCTS);
  let filter = 'all';
  let editingId = null;   // id of the product being edited, null for a new one
  let draftType = 'shoe';

  const BLANK = {
    shoe: { type: 'shoe', name: '', price: 120, tag: 'New', desc: '', colors: { upper: '#f2f2f2', accent: '#ff5a1f', sole: '#ffffff', lace: '#dddddd' } },
    tee: { type: 'tee', name: '', price: 32, tag: 'New', desc: '', color: '#ffffff', layout: 'sunset' }
  };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function toast(msg) {
    const el = $('.toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function hasSaved() {
    try { return !!localStorage.getItem(CATALOG_KEY); } catch (e) { return false; }
  }

  function persist() {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(products));
    } catch (e) {
      toast('Could not save: browser storage is blocked');
      return false;
    }
    renderStatus();
    return true;
  }

  function renderStatus() {
    $('#catalog-status').textContent = `${products.length} products · ` +
      (hasSaved() ? 'using changes saved in this browser' : 'using the built-in catalog');
  }

  const heroOf = type => products.find(p => p.type === type && p.featured);

  /* ---------- list ---------- */
  function renderList() {
    const rows = products.filter(p => filter === 'all' || p.type === filter);
    $('#product-rows').innerHTML = rows.length ? rows.map(p => `
      <div class="p-row${p.id === editingId ? ' active' : ''}" data-edit="${p.id}" tabindex="0" role="button" aria-label="Edit ${esc(p.name)}">
        <div class="p-thumb">${productArt(p, 'front')}</div>
        <div class="p-main">
          <strong>${esc(p.name)}</strong>
          <span class="muted small">${p.type === 'shoe' ? 'Sneaker' : 'T-shirt'} · ${money(+p.price)}</span>
          <div class="p-badges">
            ${p.featured ? '<span class="pill hero">Hero</span>' : ''}
            ${p.tag ? `<span class="pill">${esc(p.tag)}</span>` : ''}
          </div>
        </div>
        ${p.featured ? '' : `<button class="btn btn-small btn-ghost" data-hero="${p.id}" title="Show this in the homepage hero">Set as hero</button>`}
      </div>`).join('') : '<p class="muted empty-list">No products here yet.</p>';
  }

  $('.list-filters').addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    document.querySelectorAll('.list-filters button').forEach(x => x.classList.toggle('active', x === b));
    renderList();
  });

  $('#product-rows').addEventListener('click', e => {
    const h = e.target.closest('[data-hero]');
    if (h) {
      setHero(h.dataset.hero);
      persist();
      renderList();
      if (editingId) openEditor(editingId);
      toast(`${products.find(p => p.id === h.dataset.hero).name} is now the hero`);
      return;
    }
    const r = e.target.closest('[data-edit]');
    if (r) openEditor(r.dataset.edit);
  });
  $('#product-rows').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('[data-edit]')) openEditor(e.target.dataset.edit);
  });

  function setHero(id) {
    const type = products.find(p => p.id === id).type;
    products.forEach(p => {
      if (p.type !== type) return;
      if (p.id === id) p.featured = true;
      else delete p.featured;
    });
  }

  /* ---------- editor ---------- */
  $('#layout-pick').innerHTML = Object.entries(Layouts.list).map(([k, v]) => `
    <label class="layout-opt">
      <input type="radio" name="layout" value="${k}">
      ${Layouts.thumb(k)}
      <span>${v.name}</span>
    </label>`).join('');

  function openEditor(id, type) {
    const p = id ? products.find(x => x.id === id) : clone(BLANK[type]);
    editingId = id || null;
    draftType = p.type;

    $('#editor-empty').hidden = true;
    form.hidden = false;
    $('#form-error').textContent = '';
    $('#editor-title').textContent = id ? `Edit ${p.name}` : `New ${p.type === 'shoe' ? 'shoe' : 'tee'}`;
    $('#editor-id').textContent = id ? `id: ${p.id}` : '';
    $('#delete-btn').hidden = !id;

    F.name.value = p.name;
    F.price.value = p.price;
    F.tag.value = p.tag || '';
    F.desc.value = p.desc || '';
    F.details.value = (p.details || []).join('\n');
    F.featured.checked = !!p.featured;
    photo = { original: null, image: p.image || null };
    $('#photo-status').textContent = '';
    renderPhoto();
    if (p.type === 'shoe') {
      for (const k of ['upper', 'accent', 'sole', 'lace']) F[k].value = p.colors[k];
    } else {
      F.color.value = p.color;
      const r = form.querySelector(`input[name=layout][value="${p.layout}"]`) || form.querySelector('input[name=layout]');
      r.checked = true;
    }
    document.querySelectorAll('.type-fields').forEach(f => f.hidden = f.dataset.for !== p.type);

    const current = heroOf(p.type);
    $('#hero-note').textContent = current && current.id !== id
      ? `Replaces ${current.name} as the ${p.type === 'shoe' ? 'shoe' : 'tee'} hero.`
      : p.featured ? `This is the current ${p.type} hero.` : '';

    renderList();
    updatePreview();
    if (!id) F.name.focus();
    if (innerWidth < 900) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Product object from the current form values
  function readForm() {
    const p = {
      type: draftType,
      // the store renders these as HTML, so keep them free of markup
      name: F.name.value.replace(/[<>]/g, '').trim(),
      price: Math.round(+F.price.value * 100) / 100,
      desc: F.desc.value.replace(/[<>]/g, '').trim()
    };
    if (F.tag.value) p.tag = F.tag.value;
    const details = F.details.value.split('\n').map(l => l.replace(/[<>]/g, '').trim()).filter(Boolean).slice(0, 8);
    if (details.length) p.details = details;
    if (draftType === 'shoe') {
      p.colors = { upper: F.upper.value, accent: F.accent.value, sole: F.sole.value, lace: F.lace.value };
      if (photo.image) p.image = photo.image;
    } else {
      p.color = F.color.value;
      p.layout = form.querySelector('input[name=layout]:checked').value;
    }
    return p;
  }

  function updatePreview() {
    const p = readForm();
    $('#pv-front').innerHTML = productArt(p, 'front');
    $('#pv-back').innerHTML = productArt(p, 'back');
  }
  form.addEventListener('input', updatePreview);

  /* ---------- product photo + background removal ---------- */
  let photo = { original: null, image: null };

  function renderPhoto() {
    const has = !!photo.image;
    $('#photo-drop').hidden = has;
    $('#photo-result').hidden = !has;
    $('#colorway-fields').classList.toggle('dimmed', has);
    if (!has) return;
    $('#photo-cutout').src = photo.image;
    // an already-saved photo has no original to re-process, so only show the cut-out
    const canTune = !!photo.original;
    $('#photo-original').closest('figure').hidden = !canTune;
    if (canTune) $('#photo-original').src = photo.original;
    document.querySelectorAll('#photo-result .toggle-row, #photo-result .range-row').forEach(el => el.hidden = !canTune);
  }

  let runId = 0;
  async function processPhoto() {
    if (!photo.original) return;
    const mine = ++runId;
    $('#photo-status').textContent = $('#photo-remove').checked ? 'Removing background…' : 'Preparing photo…';
    try {
      const image = await BgRemove.process(photo.original, {
        strength: +$('#photo-strength').value,
        remove: $('#photo-remove').checked
      });
      if (mine !== runId) return; // a newer run started
      photo.image = image;
      $('#photo-status').textContent = 'Check the cut-out. If edges of the product disappear, lower the strength; if background is left over, raise it.';
      renderPhoto();
      updatePreview();
    } catch (err) {
      if (mine === runId) $('#photo-status').textContent = err.message;
    }
  }

  function loadPhotoFile(file) {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) { toast('Please choose a PNG, JPG or WebP image'); return; }
    if (file.size > 15 * 1024 * 1024) { toast('That image is over 15 MB. Please use a smaller one'); return; }
    const reader = new FileReader();
    reader.onload = () => { photo.original = reader.result; processPhoto(); };
    reader.readAsDataURL(file);
  }

  $('#photo-input').addEventListener('change', e => { loadPhotoFile(e.target.files[0]); e.target.value = ''; });
  const drop = $('#photo-drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => loadPhotoFile(e.dataTransfer.files[0]));
  $('#photo-strength').addEventListener('change', processPhoto);
  $('#photo-remove').addEventListener('change', processPhoto);
  $('#photo-replace').addEventListener('click', () => $('#photo-input').click());
  $('#photo-clear').addEventListener('click', () => {
    photo = { original: null, image: null };
    $('#photo-status').textContent = '';
    renderPhoto();
    updatePreview();
  });

  function slugify(name, type) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || type;
    let id = base, n = 2;
    while (products.some(p => p.id === id)) id = `${base}-${n++}`;
    return id;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const p = readForm();
    if (!p.name) { $('#form-error').textContent = 'Please give the product a name.'; F.name.focus(); return; }
    if (!(p.price > 0)) { $('#form-error').textContent = 'Price must be more than 0.'; F.price.focus(); return; }
    if (!p.desc) p.desc = p.type === 'shoe' ? 'A fresh new silhouette from Sole & Thread.' : 'Heavyweight organic cotton tee.';

    let saved;
    if (editingId) {
      const i = products.findIndex(x => x.id === editingId);
      saved = { id: editingId, ...p };
      if (products[i].featured) saved.featured = true;
      products[i] = saved;
    } else {
      saved = { id: slugify(p.name, p.type), ...p };
      products.unshift(saved); // newest first so it leads the shop grid
    }
    if (F.featured.checked) setHero(saved.id);
    else delete saved.featured;

    if (!persist()) return;
    toast(`Saved ${saved.name}${F.featured.checked ? ' as the hero' : ''}`);
    openEditor(saved.id);
  });

  function closeEditor() {
    editingId = null;
    form.hidden = true;
    $('#editor-empty').hidden = false;
    renderList();
  }
  $('#cancel-btn').addEventListener('click', closeEditor);

  $('#delete-btn').addEventListener('click', () => {
    const p = products.find(x => x.id === editingId);
    if (!p || !confirm(`Delete "${p.name}"? This removes it from the store in this browser.`)) return;
    products = products.filter(x => x.id !== editingId);
    persist();
    toast(`Deleted ${p.name}`);
    closeEditor();
  });

  document.querySelectorAll('[data-new]').forEach(b => b.addEventListener('click', () => openEditor(null, b.dataset.new)));

  $('#reset-btn').addEventListener('click', () => {
    if (!confirm('Discard all changes saved in this browser and go back to the built-in catalog?')) return;
    try { localStorage.removeItem(CATALOG_KEY); } catch (e) { /* ignore */ }
    products = clone(DEFAULT_PRODUCTS);
    closeEditor();
    renderStatus();
    toast('Back to the built-in catalog');
  });

  $('#export-btn').addEventListener('click', () => {
    const header = `/* Built-in product catalog, exported from admin.html on ${new Date().toISOString().slice(0, 10)}.
   type:     'shoe' (uses colors) or 'tee' (uses color + layout from layouts.js)
   tag:      badge on the card ('New', 'Best seller', 'Limited', 'Sale'), optional
   featured: true puts the product in the scroll showcase at the top of the page */
`;
    const text = header + 'const DEFAULT_PRODUCTS = ' + JSON.stringify(products, null, 2) + ';\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    a.download = 'catalog.js';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Downloaded catalog.js. Replace js/catalog.js with it');
  });

  renderStatus();
  renderList();
})();
