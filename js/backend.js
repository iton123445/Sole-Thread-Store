/* Thin wrapper around Supabase: accounts, products, orders and product images.
   When js/config.js has no Supabase keys (or the library didn't load),
   Backend.enabled is false and the site runs in demo mode. */
const Backend = (() => {
  const cfg = window.SITE_CONFIG || {};
  const enabled = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient);
  const sb = enabled ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const BUCKET = 'product-images';

  const fail = error => { if (error) throw new Error(error.message || 'Something went wrong'); };
  const pageURL = file => new URL(file, location.href).href;

  /* ---------- products: site shape <-> table row ---------- */
  const toRow = (p, sort = 0) => ({
    id: p.id, type: p.type, name: p.name, price: p.price,
    tag: p.tag || null, featured: !!p.featured,
    description: p.desc || '', details: p.details || [],
    colors: p.colors || null, color: p.color || null, layout: p.layout || null,
    image: p.image || null, sort: p.sort ?? sort
  });
  const fromRow = r => {
    const p = { id: r.id, type: r.type, name: r.name, price: +r.price, desc: r.description, sort: r.sort };
    if (r.tag) p.tag = r.tag;
    if (r.featured) p.featured = true;
    if (Array.isArray(r.details) && r.details.length) p.details = r.details;
    if (r.colors) p.colors = r.colors;
    if (r.color) p.color = r.color;
    if (r.layout) p.layout = r.layout;
    if (r.image) p.image = r.image;
    return p;
  };

  async function listProducts() {
    const { data, error } = await sb.from('products').select('*').order('sort').order('created_at', { ascending: false });
    fail(error);
    return data.map(fromRow);
  }
  async function saveProduct(p) {
    const { error } = await sb.from('products').upsert(toRow(p));
    fail(error);
  }
  async function saveProducts(list) {
    const { error } = await sb.from('products').upsert(list.map((p, i) => toRow(p, i)));
    fail(error);
  }
  async function deleteProduct(id) {
    const { error } = await sb.from('products').delete().eq('id', id);
    fail(error);
  }

  // Upload a data-URL image to Storage and return its public URL
  async function uploadImage(dataUrl, name) {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[blob.type] || 'png';
    const path = `${name}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
    fail(error);
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  /* ---------- accounts ---------- */
  let user = null;
  const listeners = new Set();
  const ready = enabled
    ? sb.auth.getSession().then(({ data }) => { user = data.session?.user || null; return user; })
    : Promise.resolve(null);

  if (enabled) {
    sb.auth.onAuthStateChange((event, session) => {
      user = session?.user || null;
      listeners.forEach(fn => fn(user, event));
    });
  }
  const onAuth = fn => { listeners.add(fn); return () => listeners.delete(fn); };

  async function signUp(email, password, name) {
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: pageURL('account.html') }
    });
    fail(error);
    return { needsConfirmation: !data.session };
  }
  async function signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    fail(error);
  }
  async function signOut() {
    const { error } = await sb.auth.signOut();
    fail(error);
  }
  async function resetPassword(email) {
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: pageURL('account.html') });
    fail(error);
  }
  async function updatePassword(password) {
    const { error } = await sb.auth.updateUser({ password });
    fail(error);
  }
  async function isAdmin() {
    if (!user) return false;
    const { data, error } = await sb.rpc('is_admin');
    if (error) return false;
    return data === true;
  }
  const displayName = u => u?.user_metadata?.full_name || u?.email?.split('@')[0] || '';

  /* ---------- orders ---------- */
  async function createOrder({ items, total, shipping }) {
    const { data, error } = await sb.from('orders').insert({ items, total, shipping }).select('id').single();
    fail(error);
    return data.id;
  }
  async function listOrders(limit = 50) {
    const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
    fail(error);
    return data;
  }

  return {
    enabled, ready, onAuth,
    get user() { return user; },
    displayName,
    listProducts, saveProduct, saveProducts, deleteProduct, uploadImage,
    signUp, signIn, signOut, resetPassword, updatePassword, isAdmin,
    createOrder, listOrders
  };
})();
