/* Product page: product.html?id=<product id> */
CatalogReady.then(() => {
  const $ = s => document.querySelector(s);
  const root = $('#pdp');
  const id = new URLSearchParams(location.search).get('id');
  const p = PRODUCTS.find(x => x.id === id);

  if (!p) {
    root.innerHTML = `
      <section class="pdp-missing">
        <p class="eyebrow">Not found</p>
        <h1 class="display">This one has <em>walked off.</em></h1>
        <p class="muted">The product may have been removed or renamed.</p>
        <a class="btn" href="index.html#shop">Back to the shop</a>
      </section>`;
    return;
  }

  document.title = `${p.name} | Sole & Thread`;
  document.querySelector('meta[name=description]').setAttribute('content', p.desc);

  const isShoe = p.type === 'shoe';
  const sizes = SIZES[p.type];

  // Gallery views: front, back and two close-up crops of the same artwork
  const crop = (svg, vb) => svg.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`);
  const CROPS = p.image
    ? ['200 140 200 200', '0 120 210 210']
    : isShoe ? ['240 110 160 104', '120 24 170 110'] : ['118 80 164 164', '110 6 180 120'];
  const views = [
    { label: 'Front', svg: () => productArt(p, 'front') },
    { label: 'Back', svg: () => productArt(p, 'back') },
    { label: 'Detail', svg: () => crop(productArt(p, 'front'), CROPS[0]) },
    { label: 'Detail', svg: () => crop(productArt(p, isShoe ? 'front' : 'back'), CROPS[1]) }
  ];

  const MATERIALS = isShoe
    ? ['Spot clean with a soft brush and cool water.', 'Air dry away from direct heat.', 'Bring them back to any stockist for a resole when the tread wears down.']
    : ['Machine wash cold, inside out, with similar colors.', 'Line dry; do not tumble dry.', 'Iron on the reverse; do not iron the print.'];

  const related = PRODUCTS.filter(x => x.id !== p.id).sort((a, b) => (b.type === p.type) - (a.type === p.type)).slice(0, 3);

  root.innerHTML = `
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="index.html">Home</a><span>/</span>
      <a href="index.html#shop">${isShoe ? 'Sneakers' : 'Tees'}</a><span>/</span>
      <span aria-current="page">${p.name}</span>
    </nav>

    <div class="pdp-grid">
      <section class="gallery" aria-label="Product images">
        <div class="gallery-stage" id="stage" title="Drag to turn">
          <div class="gallery-art" id="stage-art">${views[0].svg()}</div>
          ${p.tag ? `<span class="tag">${p.tag}</span>` : ''}
          <button class="text-link gallery-turn" id="turn">Turn around <span aria-hidden="true">↻</span></button>
        </div>
        <div class="thumbs" role="tablist">
          ${views.map((v, i) => `<button class="thumb${i === 0 ? ' active' : ''}" data-view="${i}" role="tab" aria-label="${v.label} view">${v.svg()}</button>`).join('')}
        </div>
      </section>

      <section class="pdp-info">
        <p class="eyebrow">Drop 01 · ${productCode(p)}${p.tag ? ` · ${p.tag}` : ''}</p>
        <h1 class="display">${p.name}</h1>
        <p class="price big">${money(p.price)}</p>
        <p class="pdp-desc">${p.desc}</p>

        <div class="pdp-field">
          <div class="pdp-field-head">
            <span class="field-label">Size</span>
            <button class="link" id="size-guide-btn">Size guide</button>
          </div>
          <div class="chips" id="sizes">
            ${sizes.map(s => `<button class="chip" data-size="${s}">${s}</button>`).join('')}
          </div>
        </div>

        <div class="qv-actions">
          <div class="qty big" id="qty"><button data-d="-1" aria-label="Decrease">−</button><span>1</span><button data-d="1" aria-label="Increase">+</button></div>
          <button class="btn" id="add">Select a size</button>
        </div>
        ${!isShoe ? `<a class="text-link" href="index.html?customize=${encodeURIComponent(p.id)}#customize">Customize this tee <span aria-hidden="true">→</span></a>` : ''}

        <div class="accordion">
          <details open>
            <summary>Details</summary>
            <ul class="details">${productDetails(p).map(d => `<li>${d}</li>`).join('')}</ul>
          </details>
          <details>
            <summary>Materials &amp; care</summary>
            <ul class="details">${MATERIALS.map(d => `<li>${d}</li>`).join('')}</ul>
          </details>
          <details>
            <summary>Shipping &amp; returns</summary>
            <p class="muted">Free carbon-neutral shipping on orders over $100, delivered in 2 to 4 working days. Not right? Return it within 30 days, worn indoors, for a full refund.</p>
          </details>
        </div>
      </section>
    </div>

    <section class="related">
      <div class="section-head">
        <h2 class="display">You may <em>also like</em></h2>
        <a class="text-link" href="index.html#shop">View all <span aria-hidden="true">→</span></a>
      </div>
      <div class="grid related-grid">
        ${related.map((r, i) => `
          <article class="card" style="--i:${i}">
            <div class="card-media">
              <a class="card-link" href="${productURL(r)}" aria-label="${r.name}"></a>
              <div class="flip">
                <div class="face front">${productArt(r, 'front')}</div>
                <div class="face back">${productArt(r, 'back')}</div>
              </div>
              ${r.tag ? `<span class="tag">${r.tag}</span>` : ''}
            </div>
            <div class="card-body">
              <div><h3><a href="${productURL(r)}">${r.name}</a></h3><span class="muted">${r.type === 'shoe' ? 'Sneaker' : 'T-shirt'}</span></div>
              <span class="price">${money(r.price)}</span>
            </div>
          </article>`).join('')}
      </div>
    </section>`;

  /* ---------- gallery ---------- */
  const stageArt = $('#stage-art');
  let view = 0;
  function show(i, animate = 'fade') {
    view = i;
    document.querySelectorAll('.thumb').forEach((t, n) => t.classList.toggle('active', n === i));
    stageArt.classList.add(animate === 'turn' ? 'turning' : 'fading');
    setTimeout(() => {
      stageArt.innerHTML = views[i].svg();
      stageArt.classList.remove('turning', 'fading');
    }, 260);
  }
  document.querySelector('.thumbs').addEventListener('click', e => {
    const t = e.target.closest('[data-view]');
    if (t && +t.dataset.view !== view) show(+t.dataset.view);
  });
  const turn = () => show(view === 0 ? 1 : 0, 'turn');
  $('#turn').addEventListener('click', turn);

  // drag sideways on the image to turn it around
  let dragX = null;
  const stage = $('#stage');
  stage.addEventListener('pointerdown', e => { if (!e.target.closest('button')) dragX = e.clientX; });
  addEventListener('pointerup', e => {
    if (dragX !== null && Math.abs(e.clientX - dragX) > 50) turn();
    dragX = null;
  });

  /* ---------- size, quantity, add to bag ---------- */
  let size = null, qty = 1;
  const addBtn = $('#add');
  $('#sizes').addEventListener('click', e => {
    const c = e.target.closest('[data-size]');
    if (!c) return;
    size = c.dataset.size;
    document.querySelectorAll('#sizes .chip').forEach(x => x.classList.toggle('active', x === c));
    addBtn.textContent = `Add to bag · ${money(p.price * qty)}`;
  });
  $('#qty').addEventListener('click', e => {
    const d = e.target.closest('[data-d]');
    if (!d) return;
    qty = Math.max(1, qty + +d.dataset.d);
    $('#qty span').textContent = qty;
    if (size) addBtn.textContent = `Add to bag · ${money(p.price * qty)}`;
  });
  addBtn.addEventListener('click', () => {
    if (!size) {
      $('#sizes').classList.remove('shake'); void $('#sizes').offsetWidth; $('#sizes').classList.add('shake');
      toast('Please choose a size');
      return;
    }
    Cart.add({ id: p.id, name: p.name, price: p.price, size, qty, thumb: productArt(p, 'front') });
    Cart.open();
  });

  /* ---------- size guide ---------- */
  const guide = isShoe
    ? { head: ['US', 'UK', 'EU', 'CM'], rows: [['6', '5.5', '38.5', '24'], ['7', '6.5', '40', '25'], ['8', '7.5', '41', '26'], ['9', '8.5', '42.5', '27'], ['10', '9.5', '44', '28'], ['11', '10.5', '45', '29'], ['12', '11.5', '46.5', '30']], note: 'Between sizes? Our lasts run true to size; go up half a size for the Halo Trainer.' }
    : { head: ['Size', 'Chest (cm)', 'Length (cm)'], rows: [['XS', '96', '66'], ['S', '102', '69'], ['M', '108', '72'], ['L', '114', '74'], ['XL', '120', '76'], ['XXL', '126', '78']], note: 'Measured flat across the chest and doubled. For a closer fit, size down.' };
  $('#size-guide-btn').addEventListener('click', () => {
    const m = $('#size-guide');
    m.querySelector('.modal-body').innerHTML = `
      <h2 class="guide-title">Size guide</h2>
      <table class="guide">
        <thead><tr>${guide.head.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${guide.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      <p class="muted small">${guide.note}</p>`;
    Modal.open(m);
  });

  Site.observeReveals(root);
});
