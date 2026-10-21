/* Cart state (saved in localStorage), drawer and demo checkout */
const Cart = (() => {
  const KEY = 'st-cart-v1';
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { items = []; }

  const $ = s => document.querySelector(s);
  const drawer = $('#cart');
  const list = $('#cart-items');
  const countEl = $('#cart-count');
  const subtotalEl = $('#cart-subtotal');

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); }
    catch (e) { toast('Cart is too large to save, but it still works for this visit.'); }
  }

  function add(item) {
    // identical catalog items stack; custom designs are always their own line
    const existing = !item.custom && items.find(i => i.id === item.id && i.size === item.size);
    if (existing) existing.qty += item.qty;
    else items.push({ ...item, key: Date.now() + '-' + Math.random().toString(36).slice(2, 7) });
    save(); render();
    countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
    toast(`Added ${item.name} to your bag`);
  }

  function setQty(key, qty) {
    const it = items.find(i => i.key === key);
    if (!it) return;
    it.qty = qty;
    if (it.qty <= 0) items = items.filter(i => i.key !== key);
    save(); render();
  }

  const total = () => items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = () => items.reduce((s, i) => s + i.qty, 0);

  function render() {
    countEl.textContent = count();
    countEl.hidden = count() === 0;
    subtotalEl.textContent = money(total());
    $('#checkout-btn').disabled = items.length === 0;
    if (!items.length) {
      list.innerHTML = `<div class="cart-empty"><p>Your bag is empty.</p><a href="#shop" class="btn btn-ghost" data-close-cart>Start shopping</a></div>`;
      return;
    }
    list.innerHTML = items.map(i => `
      <div class="cart-item">
        <div class="cart-thumb">${i.thumb}</div>
        <div class="cart-info">
          <strong>${i.name}</strong>
          <span class="muted">${i.size}${i.custom ? ' · Custom design' : ''}</span>
          <div class="qty">
            <button aria-label="Decrease quantity" data-qty="${i.key}" data-d="-1">−</button>
            <span>${i.qty}</span>
            <button aria-label="Increase quantity" data-qty="${i.key}" data-d="1">+</button>
          </div>
        </div>
        <div class="cart-right">
          <span>${money(i.price * i.qty)}</span>
          <button class="link" data-remove="${i.key}">Remove</button>
        </div>
      </div>`).join('');
  }

  list.addEventListener('click', e => {
    const q = e.target.closest('[data-qty]');
    if (q) {
      const it = items.find(i => i.key === q.dataset.qty);
      if (it) setQty(it.key, it.qty + +q.dataset.d);
    }
    const r = e.target.closest('[data-remove]');
    if (r) setQty(r.dataset.remove, 0);
  });

  function open() { drawer.classList.add('open'); document.body.classList.add('lock'); }
  function close() { drawer.classList.remove('open'); document.body.classList.remove('lock'); }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-cart]')) open();
    if (e.target.closest('[data-close-cart]')) close();
  });

  /* ---- demo checkout ---- */
  const modal = $('#checkout');
  $('#checkout-btn').addEventListener('click', () => {
    close();
    $('#checkout-total').textContent = money(total());
    $('#checkout-form').hidden = false;
    $('#checkout-done').hidden = true;
    Modal.open(modal);
  });

  $('#checkout-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = new FormData(e.target).get('name') || 'friend';
    $('#order-name').textContent = String(name).split(' ')[0];
    $('#order-id').textContent = '#ST' + Math.floor(100000 + Math.random() * 900000);
    e.target.hidden = true;
    $('#checkout-done').hidden = false;
    items = []; save(); render();
    e.target.reset();
  });

  render();
  return { add, open, close };
})();

/* Small shared helpers */
function toast(msg) {
  const el = document.querySelector('.toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

const Modal = {
  open(el) { el.classList.add('open'); document.body.classList.add('lock'); el.querySelector('.modal-close')?.focus(); },
  close(el) { el.classList.remove('open'); document.body.classList.remove('lock'); }
};
document.addEventListener('click', e => {
  const m = e.target.closest('.modal');
  if (m && (e.target === m || e.target.closest('.modal-close'))) Modal.close(m);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.modal.open').forEach(Modal.close);
  Cart.close();
});
