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

  /* ---- demo checkout (saved to the account when signed in) ---- */
  const modal = $('#checkout');
  const form = $('#checkout-form');
  const accountsOn = () => !!(typeof Backend !== 'undefined' && Backend.enabled);

  $('#checkout-btn').addEventListener('click', () => {
    close();
    $('#checkout-total').textContent = money(total());
    form.hidden = false;
    $('#checkout-done').hidden = true;
    const user = accountsOn() ? Backend.user : null;
    const next = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    const notice = form.querySelector('.notice');
    if (user) {
      notice.textContent = 'Demo store: no payment is taken. This order will be saved to your account.';
      if (!form.elements.name.value) form.elements.name.value = Backend.displayName(user);
      form.elements.email.value = user.email;
    } else if (accountsOn()) {
      notice.innerHTML = `Demo store: no payment is taken. <a class="link" href="account.html?next=${next}">Sign in</a> to save this order to your account.`;
    } else {
      notice.textContent = 'Demo store: no payment is taken and no data leaves your browser.';
    }
    Modal.open(modal);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || 'friend');
    const submit = form.querySelector('[type=submit]');
    let orderId = 'ST' + Math.floor(100000 + Math.random() * 900000);
    let saved = false;

    if (accountsOn() && Backend.user) {
      submit.disabled = true;
      submit.textContent = 'Placing order…';
      try {
        const id = await Backend.createOrder({
          // product art and photos stay out of the database
          items: items.map(({ id, name, price, size, qty, custom }) => ({ id, name, price, size, qty, custom: !!custom })),
          total: total(),
          shipping: { name, address: String(fd.get('address') || '') }
        });
        orderId = 'ST' + String(id).padStart(6, '0');
        saved = true;
      } catch (err) {
        toast('Could not save the order: ' + err.message);
        return;
      } finally {
        submit.disabled = false;
        submit.textContent = 'Place demo order';
      }
    }

    $('#order-name').textContent = name.split(' ')[0];
    $('#order-id').textContent = '#' + orderId;
    $('#order-saved').hidden = !saved;
    form.hidden = true;
    $('#checkout-done').hidden = false;
    items = []; save(); render();
    form.reset();
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
