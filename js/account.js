/* Account page: sign in, create account, reset password, order history */
(() => {
  const $ = s => document.querySelector(s);
  const views = document.querySelectorAll('.auth-view');
  const show = name => {
    $('#auth-loading').hidden = true;
    views.forEach(v => v.hidden = v.dataset.view !== name);
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function toast(msg) {
    const el = $('.toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  if (!Backend.enabled) { show('off'); return; }

  // Where to go after signing in (only pages on this site)
  const nextParam = new URLSearchParams(location.search).get('next');
  const next = nextParam && /^[a-z0-9-]+\.html(\?[\w=&%-]*)?(#[\w-]*)?$/i.test(nextParam) ? nextParam : null;

  /* ---------- tabs and sub-forms ---------- */
  function showPanel(name) {
    document.querySelectorAll('[data-auth-panel]').forEach(f => f.hidden = f.dataset.authPanel !== name);
    document.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.toggle('active', t.dataset.authTab === name));
    document.querySelectorAll('.form-error').forEach(e => e.textContent = '');
    const first = document.querySelector(`[data-auth-panel="${name}"] input`);
    if (first) first.focus();
  }
  document.querySelectorAll('[data-auth-tab]').forEach(t => t.addEventListener('click', () => showPanel(t.dataset.authTab)));
  document.querySelectorAll('[data-show]').forEach(b => b.addEventListener('click', () => showPanel(b.dataset.show)));

  // Run a form action with a busy button and inline errors
  function handle(form, action) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const err = form.querySelector('.form-error');
      err.textContent = '';
      if (!form.checkValidity()) {
        const bad = form.querySelector(':invalid');
        err.textContent = bad.type === 'email' ? 'Please enter a valid email address.'
          : bad.name === 'password' && bad.minLength > 0 ? 'Password must be at least 8 characters.'
          : 'Please fill in every field.';
        bad.focus();
        return;
      }
      const btn = form.querySelector('[type=submit]');
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Please wait…';
      try {
        await action(Object.fromEntries(new FormData(form)));
      } catch (ex) {
        err.textContent = friendly(ex.message);
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }

  const friendly = msg =>
    /invalid login credentials/i.test(msg) ? 'That email and password don’t match. Please try again.'
      : /email not confirmed/i.test(msg) ? 'Please confirm your email first. Check your inbox for the link.'
      : /already registered/i.test(msg) ? 'An account with this email already exists. Try signing in.'
      : /rate limit|too many/i.test(msg) ? 'Too many attempts. Please wait a minute and try again.'
      : /failed to fetch|network/i.test(msg) ? 'Can’t reach the server right now. Check your connection and try again.'
      : msg;

  handle($('#signin-form'), async ({ email, password }) => {
    await Backend.signIn(email.trim(), password);
    if (next) location.href = next;
  });

  handle($('#signup-form'), async ({ name, email, password }) => {
    const { needsConfirmation } = await Backend.signUp(email.trim(), password, name.trim());
    if (needsConfirmation) {
      $('#signup-form').reset();
      showPanel('signin');
      toast(`Almost there: we sent a confirmation link to ${email.trim()}`);
      $('#signin-form .form-error').textContent = 'Check your inbox and click the confirmation link, then sign in here.';
    } else if (next) location.href = next;
  });

  handle($('#forgot-form'), async ({ email }) => {
    await Backend.resetPassword(email.trim());
    $('#forgot-form .form-error').textContent = '';
    toast('If that email has an account, a reset link is on its way');
    showPanel('signin');
  });

  handle($('#recovery-form'), async ({ password }) => {
    await Backend.updatePassword(password);
    toast('Password updated');
    history.replaceState(null, '', location.pathname);
    render(Backend.user);
  });

  $('#signout-btn').addEventListener('click', async () => {
    await Backend.signOut();
    toast('Signed out');
  });

  /* ---------- signed-in view ---------- */
  async function renderAccount(user) {
    show('signed-in');
    $('#account-name').textContent = Backend.displayName(user);
    $('#account-email').textContent = user.email;

    const admin = await Backend.isAdmin();
    $('#admin-link').hidden = !admin;
    $('#account-eyebrow').textContent = admin ? 'Admin account' : 'Your account';

    const box = $('#orders');
    box.innerHTML = '<p class="muted small">Loading orders…</p>';
    try {
      // admins can read every order; on this page show only their own
      const orders = (await Backend.listOrders()).filter(o => o.user_id === user.id);
      box.innerHTML = orders.length ? orders.map(o => `
        <article class="order">
          <div class="order-head">
            <strong>#ST${String(o.id).padStart(6, '0')}</strong>
            <span class="muted small">${new Date(o.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span class="order-total">${money(+o.total)}</span>
          </div>
          <ul>${o.items.map(i => `<li>${esc(i.name)} <span class="muted">· ${esc(i.size)} · ×${+i.qty}</span></li>`).join('')}</ul>
        </article>`).join('')
        : '<p class="muted">No orders yet. <a class="link" href="index.html#shop">Find something you like</a>.</p>';
    } catch (ex) {
      box.innerHTML = `<p class="muted">Couldn't load your orders (${esc(ex.message)}).</p>`;
    }
  }

  let recovering = /type=recovery/.test(location.hash);
  function render(user) {
    if (recovering) { show('recovery'); return; }
    if (user) renderAccount(user);
    else { show('signed-out'); }
  }

  Backend.onAuth((user, event) => {
    if (event === 'PASSWORD_RECOVERY') recovering = true;
    if (event === 'USER_UPDATED') recovering = false;
    render(user);
  });
  Backend.ready.then(render);
})();
