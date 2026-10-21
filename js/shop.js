/* Product grid with flip-on-hover cards, filters and quick view */
const Shop = (() => {
  const grid = document.querySelector('#product-grid');
  const qv = document.querySelector('#quickview');
  let filter = 'all';

  function card(p, i) {
    return `
      <article class="card" data-type="${p.type}" style="--i:${i}">
        <div class="card-media">
          <a class="card-link" href="${productURL(p)}" aria-label="${p.name}"></a>
          <div class="flip">
            <div class="face front">${productArt(p, 'front')}</div>
            <div class="face back">${productArt(p, 'back')}</div>
          </div>
          ${p.tag ? `<span class="tag">${p.tag}</span>` : ''}
          <button class="card-cta" data-view="${p.id}">Quick view</button>
        </div>
        <div class="card-body">
          <div>
            <h3><a href="${productURL(p)}">${p.name}</a></h3>
            <span class="muted">${p.type === 'shoe' ? 'Sneaker' : 'T-shirt'}</span>
          </div>
          <span class="price">${money(p.price)}</span>
        </div>
      </article>`;
  }

  function render() {
    grid.innerHTML = PRODUCTS.filter(p => filter === 'all' || p.type === filter).map((p, i) => card(p, i)).join('');
  }

  document.querySelector('.filters').addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('active', x === b));
    render();
  });

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-view]');
    if (b) quickView(PRODUCTS.find(p => p.id === b.dataset.view));
  });

  function quickView(p) {
    let side = 'front';
    const sizes = SIZES[p.type];
    qv.querySelector('.modal-body').innerHTML = `
      <div class="qv">
        <div class="qv-media">
          <div class="qv-art">${productArt(p, 'front')}</div>
          <button class="text-link" id="qv-turn">Turn around <span aria-hidden="true">↻</span></button>
        </div>
        <div class="qv-info">
          <p class="eyebrow">Drop 01 · ${productCode(p)}${p.tag ? ` · ${p.tag}` : ''}</p>
          <h2>${p.name}</h2>
          <p class="price big">${money(p.price)}</p>
          <p class="muted">${p.desc}</p>
          <ul class="details">${productDetails(p).map(d => `<li>${d}</li>`).join('')}</ul>
          <label class="field-label">Size</label>
          <div class="chips" id="qv-sizes">
            ${sizes.map((s, i) => `<button class="chip${i === 2 ? ' active' : ''}" data-size="${s}">${s}</button>`).join('')}
          </div>
          <div class="qv-actions">
            <div class="qty big"><button data-d="-1" aria-label="Decrease">−</button><span id="qv-qty">1</span><button data-d="1" aria-label="Increase">+</button></div>
            <button class="btn" id="qv-add">Add to bag</button>
          </div>
          <a class="text-link" href="${productURL(p)}">Full details <span aria-hidden="true">→</span></a>
          ${p.type === 'tee' ? `<button class="text-link" id="qv-custom">Customize this tee <span aria-hidden="true">→</span></button>` : ''}
        </div>
      </div>`;

    const art = qv.querySelector('.qv-art');
    let size = sizes[2], qty = 1;

    qv.querySelector('#qv-turn').onclick = () => {
      art.classList.add('turning');
      setTimeout(() => {
        side = side === 'front' ? 'back' : 'front';
        art.innerHTML = productArt(p, side);
        art.classList.remove('turning');
      }, 250);
    };
    qv.querySelector('#qv-sizes').onclick = e => {
      const c = e.target.closest('[data-size]');
      if (!c) return;
      size = c.dataset.size;
      qv.querySelectorAll('#qv-sizes .chip').forEach(x => x.classList.toggle('active', x === c));
    };
    qv.querySelector('.qty').onclick = e => {
      const d = e.target.closest('[data-d]');
      if (!d) return;
      qty = Math.max(1, qty + +d.dataset.d);
      qv.querySelector('#qv-qty').textContent = qty;
    };
    qv.querySelector('#qv-add').onclick = () => {
      Cart.add({ id: p.id, name: p.name, price: p.price, size, qty, thumb: productArt(p, 'front') });
      Modal.close(qv);
    };
    const custom = qv.querySelector('#qv-custom');
    if (custom) custom.onclick = () => {
      Modal.close(qv);
      Customizer.load({ color: p.color, layout: p.layout });
      Site.scrollTo(document.querySelector('#customize'));
    };

    Modal.open(qv);
  }

  render();
  return { quickView };
})();
