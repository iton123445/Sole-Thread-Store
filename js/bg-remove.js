/* In-browser background remover for product photos.
   Works on cut-out style shots: a plain, light or fake-checkerboard
   background around the product. It learns the background colours from the
   image border, flood-fills from the edges through anything that matches,
   softens the cut edge, then crops and centres the product on a square.
   Returns a data URL (WebP, or PNG where WebP isn't supported). */
const BgRemove = (() => {
  const MAX_IN = 1000;   // work size
  const OUT = 800;       // output square size

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read that image'));
      img.src = src;
    });
  }

  // Most common colours along the border (quantised), covering most of it
  function borderPalette(d, w, h) {
    const counts = new Map();
    const add = i => {
      if (d[i + 3] < 20) return; // already transparent
      const key = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      const c = counts.get(key);
      if (c) { c.n++; c.r += d[i]; c.g += d[i + 1]; c.b += d[i + 2]; }
      else counts.set(key, { n: 1, r: d[i], g: d[i + 1], b: d[i + 2] });
    };
    for (let x = 0; x < w; x++) { add(x * 4); add(((h - 1) * w + x) * 4); }
    for (let y = 0; y < h; y++) { add(y * w * 4); add((y * w + w - 1) * 4); }
    const all = [...counts.values()].sort((a, b) => b.n - a.n);
    const total = all.reduce((s, c) => s + c.n, 0) || 1;
    const out = [];
    let covered = 0;
    for (const c of all) {
      out.push([c.r / c.n, c.g / c.n, c.b / c.n]);
      covered += c.n;
      if (covered / total > 0.92 || out.length >= 6) break;
    }
    return out;
  }

  // Run lengths of alternating colours along a line of border pixels
  function runs(getPixel, len, a, b, tol2) {
    const out = [];
    let cur = -1, start = 0;
    for (let i = 0; i < len; i++) {
      const px = getPixel(i);
      const which = dist2(px, a) <= tol2 ? 0 : dist2(px, b) <= tol2 ? 1 : 2;
      if (which === 2) continue; // blurred grid line
      if (which !== cur) { if (cur !== -1) out.push({ at: i, len: i - start, from: cur }); cur = which; start = i; }
    }
    return out;
  }
  const dist2 = (p, c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;

  /* A "fake transparency" checkerboard: two light colours in a regular grid.
     Returns { cell, ox, oy, colors:[parity0, parity1] } or null. */
  function detectChecker(d, w, h, pal) {
    if (pal.length < 2) return null;
    const [a, b] = pal;
    if (dist2(a, b) < 150) return null; // too similar to be a checkerboard
    const tol2 = 22 * 22;
    const px = i => [d[i], d[i + 1], d[i + 2]];
    const rowRuns = runs(x => px(x * 4), w, a, b, tol2);
    const colRuns = runs(y => px(y * w * 4), h, a, b, tol2);
    const lens = [...rowRuns, ...colRuns].slice(1).map(r => r.len).filter(l => l > 3).sort((m, n) => m - n);
    if (lens.length < 6) return null;
    const cell = lens[lens.length >> 1];
    const firstX = rowRuns[0]?.at ?? 0, firstY = colRuns[0]?.at ?? 0;
    const ox = (cell - (firstX % cell)) % cell, oy = (cell - (firstY % cell)) % cell;
    const parity = (x, y) => (Math.floor((x + ox) / cell) + Math.floor((y + oy) / cell)) & 1;
    // which colour sits on parity 0? check the corner pixel
    const corner = px(0);
    const colors = dist2(corner, a) <= dist2(corner, b) ? (parity(0, 0) ? [b, a] : [a, b]) : (parity(0, 0) ? [a, b] : [b, a]);
    // validate against the whole border
    let ok = 0, n = 0;
    const test = (x, y) => {
      const i = (y * w + x) * 4;
      n++;
      if (dist2(px(i), colors[parity(x, y)]) <= tol2) ok++;
    };
    for (let x = 0; x < w; x += 2) { test(x, 0); test(x, h - 1); }
    for (let y = 0; y < h; y += 2) { test(0, y); test(w - 1, y); }
    return ok / n > 0.7 ? { cell, ox, oy, colors, parity } : null;
  }

  /**
   * @param {string} src     image URL / data URL
   * @param {number} strength 0–100: how different a colour may be and still count as background
   * @param {boolean} remove  false = keep the background, just crop/centre
   */
  async function process(src, { strength = 25, remove = true } = {}) {
    const img = await loadImage(src);
    const k = Math.min(1, MAX_IN / Math.max(img.width, img.height));
    const w = Math.round(img.width * k), h = Math.round(img.height * k);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h), d = id.data;

    if (remove) {
      const pal = borderPalette(d, w, h);
      const checker = detectChecker(d, w, h, pal);
      const tol = 6 + strength * 0.7;       // RGB distance
      const tol2 = tol * tol;
      const isBg = checker
        // checkerboard: each square only matches its own colour, so a white sole
        // over a grey square is kept. Pixels right on a grid line (blurred by
        // JPEG) may match either colour.
        ? i => {
          if (d[i + 3] < 20) return true;
          const p = i >> 2, x = p % w, y = (p - x) / w;
          const pix = [d[i], d[i + 1], d[i + 2]];
          const gx = (x + checker.ox) % checker.cell, gy = (y + checker.oy) % checker.cell;
          const onLine = gx < 2 || gx > checker.cell - 3 || gy < 2 || gy > checker.cell - 3;
          if (onLine) return dist2(pix, checker.colors[0]) <= tol2 * 2.5 || dist2(pix, checker.colors[1]) <= tol2 * 2.5;
          return dist2(pix, checker.colors[checker.parity(x, y)]) <= tol2;
        }
        : i => {
          if (d[i + 3] < 20) return true;
          const pix = [d[i], d[i + 1], d[i + 2]];
          for (const c of pal) if (dist2(pix, c) <= tol2) return true;
          return false;
        };

      // flood fill from every border pixel
      const bg = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0, tail = 0;
      const seed = p => { if (!bg[p] && isBg(p * 4)) { bg[p] = 1; queue[tail++] = p; } };
      for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
      while (head < tail) {
        const p = queue[head++], x = p % w, y = (p - x) / w;
        if (x > 0) seed(p - 1);
        if (x < w - 1) seed(p + 1);
        if (y > 0) seed(p - w);
        if (y < h - 1) seed(p + w);
      }

      // clear background; soften the 1px rim of the product
      for (let p = 0; p < w * h; p++) {
        if (bg[p]) { d[p * 4 + 3] = 0; continue; }
        const x = p % w, y = (p - x) / w;
        const edge = (x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) || (y > 0 && bg[p - w]) || (y < h - 1 && bg[p + w]);
        if (edge) d[p * 4 + 3] = Math.min(d[p * 4 + 3], 150);
      }
      ctx.putImageData(id, 0, 0);
    }

    // crop to the product and centre it on a square with some breathing room
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 40) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) throw new Error('Nothing left after removing the background. Try a lower strength');
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    const out = document.createElement('canvas');
    out.width = out.height = OUT;
    const s = (OUT * 0.88) / Math.max(bw, bh);
    out.getContext('2d').drawImage(c, minX, minY, bw, bh, (OUT - bw * s) / 2, (OUT - bh * s) / 2, bw * s, bh * s);

    const webp = out.toDataURL('image/webp', 0.9);
    return webp.startsWith('data:image/webp') ? webp : out.toDataURL('image/png');
  }

  return { process };
})();
