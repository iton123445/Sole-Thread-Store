/* Store data helpers.
   PRODUCTS is filled by CatalogReady, from (in order of preference):
     1. the Supabase products table, when Supabase is configured
     2. the admin's saved catalog in this browser (demo mode only)
     3. DEFAULT_PRODUCTS in catalog.js
   Pages render their products after `await CatalogReady`. */
const CATALOG_KEY = 'st-products-v1';
const PRODUCTS = [];
let CATALOG_SOURCE = 'built-in';   // 'database' | 'browser' | 'built-in'

const CatalogReady = (async () => {
  let list = null;
  if ((typeof Backend !== 'undefined' && Backend.enabled)) {
    try {
      const rows = await Backend.listProducts();
      if (rows.length) { list = rows; CATALOG_SOURCE = 'database'; }
    } catch (e) { console.warn('Could not load products from the database; using the built-in catalog.', e); }
  } else {
    try {
      const saved = JSON.parse(localStorage.getItem(CATALOG_KEY));
      if (Array.isArray(saved) && saved.length) { list = saved; CATALOG_SOURCE = 'browser'; }
    } catch (e) { /* storage blocked or corrupt: use defaults */ }
  }
  PRODUCTS.push(...(list || JSON.parse(JSON.stringify(DEFAULT_PRODUCTS))));
  return PRODUCTS;
})();

const SIZES = {
  shoe: ['US 6', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
  tee: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
};

// A product photo (cut-out, square) wrapped in SVG so it drops in wherever drawn art is used.
// There is no separate back shot, so the back view mirrors the photo.
function photoArt(src, side = 'front') {
  const flip = side === 'back' ? ' transform="translate(400 0) scale(-1 1)"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><g${flip}><image href="${src}" width="400" height="400" preserveAspectRatio="xMidYMid meet"/></g></svg>`;
}

// SVG markup for a catalog product, front or back
function productArt(p, side = 'front') {
  if (p.image) return photoArt(p.image, side);
  if (p.type === 'shoe') return Art.shoe({ ...p.colors, side });
  const ink = Art.inkFor(p.color);
  const print = side === 'front'
    ? Layouts.place(p.layout, 'front', ink)
    : `<text x="200" y="118" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="10" letter-spacing="1.5" fill="${ink}">SOLE &amp; THREAD</text>`;
  return Art.shirt({ color: p.color, side, print });
}

const featured = type => PRODUCTS.find(p => p.type === type && p.featured) || PRODUCTS.find(p => p.type === type);

const money = n => '$' + n.toFixed(2);

// Short product code, e.g. ST-AERORU
const productCode = p => 'ST-' + p.id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();

// Bullet points for a product (its own, or sensible defaults for its type)
const DEFAULT_DETAILS = {
  shoe: ['Responsive foam midsole', 'Recycled rubber outsole', 'Resoleable construction', 'Free returns within 30 days'],
  tee: ['240 gsm organic cotton jersey', 'Relaxed fit, dropped shoulder', 'Water-based print', 'Pre-shrunk and garment washed']
};
const productDetails = p => (Array.isArray(p.details) && p.details.length ? p.details : DEFAULT_DETAILS[p.type]);
