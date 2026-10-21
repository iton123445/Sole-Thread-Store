/* Scroll-driven particle showcase.
   The product is rasterised into thousands of particles. As the section
   scrolls, they scatter into 3D space, rejoin, then the whole product
   rotates 180° around the vertical axis to reveal its back side. */
class ParticleShowcase {
  constructor(section, { front, back, aspect }) {
    this.section = section;
    this.stage = section.querySelector('.stage');
    this.canvas = section.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.captions = [...section.querySelectorAll('.cap, .scroll-cue')];
    this.bar = section.querySelector('.progress span');
    this.svgs = { front, back };
    this.aspect = aspect; // height / width of the artwork
    this.particles = [];
    this.progress = 0;
    this.visible = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.loop = this.loop.bind(this);
    this.build().then(() => {
      new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
        if (this.visible) requestAnimationFrame(this.loop);
      }).observe(section);
    });

    let t;
    addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => this.build(), 200);
    });
  }

  static loadImage(svg) {
    // `svg` is either SVG markup, or { src, flip } for a photo file
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (typeof svg === 'string' || !svg.flip) return resolve(img);
        // mirrored copy for the back view
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const x = c.getContext('2d');
        x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(img, 0, 0);
        resolve(c);
      };
      img.onerror = reject;
      if (typeof svg !== 'string' && /^https?:/.test(svg.src)) img.crossOrigin = 'anonymous'; // e.g. Supabase Storage
      img.src = typeof svg === 'string' ? Art.toDataURL(svg) : svg.src;
    });
  }

  static sample(img, w, h, gap) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    const data = x.getImageData(0, 0, w, h).data;
    const pts = [];
    for (let y = 0; y < h; y += gap) {
      for (let xx = 0; xx < w; xx += gap) {
        const i = (y * w + xx) * 4;
        if (data[i + 3] > 150) pts.push({ x: xx - w / 2, y: y - h / 2, c: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})` });
      }
    }
    return pts;
  }

  async build() {
    const vw = innerWidth, vh = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = vw; this.h = vh;
    this.canvas.width = vw * dpr;
    this.canvas.height = vh * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let front, back, fi, bi;
    try {
      // load once; resizes only re-sample
      if (!this.loaded) this.loaded = await Promise.all([ParticleShowcase.loadImage(this.svgs.front), ParticleShowcase.loadImage(this.svgs.back)]);
      [fi, bi] = this.loaded;
      // photos bring their own proportions
      if (typeof this.svgs.front !== 'string') this.aspect = (fi.naturalHeight || fi.height) / (fi.naturalWidth || fi.width);
    } catch (err) {
      return this.fallback();
    }

    // Artwork size: fit within 78% width / 56% height of the viewport
    let aw = Math.min(vw * 0.78, 680);
    if (aw * this.aspect > vh * 0.56) aw = (vh * 0.56) / this.aspect;
    const ah = aw * this.aspect;
    this.gap = 3;

    try {
      front = ParticleShowcase.sample(fi, Math.round(aw), Math.round(ah), this.gap);
      back = ParticleShowcase.sample(bi, Math.round(aw), Math.round(ah), this.gap);
      this.art = { front: fi, back: bi, w: aw, h: ah };
    } catch (err) {
      // canvas sampling not allowed (e.g. a photo opened from file://): show a static image
      return this.fallback();
    }

    // Equal counts, then sort both by y so the front/back swap at 90° is seamless
    const n = Math.max(front.length, back.length);
    const pad = arr => { while (arr.length < n) arr.push({ ...arr[(Math.random() * arr.length) | 0] }); };
    pad(front); pad(back);
    const byY = (a, b) => a.y - b.y || a.x - b.x;
    front.sort(byY); back.sort(byY);

    const R = Math.max(vw, vh) * 0.7;
    this.particles = front.map((f, i) => {
      // random point inside a sphere
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = R * Math.cbrt(Math.random()) + 60;
      const s = Math.sqrt(1 - u * u);
      return {
        f, b: back[i],
        sx: r * s * Math.cos(th), sy: r * u * 0.8, sz: r * s * Math.sin(th),
        d1: Math.random() * 0.3, d2: Math.random() * 0.3,
        size: this.gap + 0.6
      };
    });
    this.render(performance.now());
  }

  fallback() {
    this.section.classList.add('no-canvas');
    const img = this.section.querySelector('.static-fallback');
    if (img) img.src = typeof this.svgs.front === 'string' ? Art.toDataURL(this.svgs.front) : this.svgs.front.src;
  }

  readProgress() {
    const rect = this.section.getBoundingClientRect();
    const total = rect.height - innerHeight;
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  loop(now) {
    if (!this.visible) return;
    this.render(now);
    requestAnimationFrame(this.loop);
  }

  render(now) {
    const p = this.reduced ? 0 : this.readProgress();
    this.progress = p;
    this.updateCaptions(p);
    if (this.bar) this.bar.style.transform = `scaleX(${p})`;
    if (!this.particles.length) return;

    const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const t = now / 1000;

    // Phase timings within the section's scroll progress
    const scatterT = clamp((p - 0.12) / 0.26);
    const joinT = clamp((p - 0.4) / 0.24);
    const rotT = ease(clamp((p - 0.68) / 0.26));
    const theta = rotT * Math.PI + Math.sin(t * 0.8) * 0.14;
    const cos = Math.cos(theta), sin = Math.sin(theta);
    const showBack = cos < 0;

    // scattered cloud slowly spins
    const spin = t * 0.25 + scatterT * 1.2;
    const cs = Math.cos(spin), ss = Math.sin(spin);

    // Smaller and lower under the intro headline, slightly raised above the final caption
    const heroT = ease(clamp(p / 0.12));
    const endT = ease(clamp((p - 0.66) / 0.1));
    const zoom = 0.72 + 0.28 * heroT - 0.1 * endT;
    const ctx = this.ctx, cx = this.w / 2;
    const cy = this.h / 2 + 10 + this.h * (0.16 * (1 - heroT) - 0.07 * endT);
    const F = 1100;
    const bob = Math.sin(t * 1.4) * 6;
    ctx.clearRect(0, 0, this.w, this.h);

    // While every particle is home, draw the real artwork for crisp edges,
    // crossfading to particles as soon as any of them start to move.
    const crisp = this.art ? Math.max(0, 1 - (this.lastMaxA || 0) * 25) : 0;
    if (crisp > 0) {
      const img = showBack ? this.art.back : this.art.front;
      ctx.save();
      ctx.globalAlpha = crisp;
      ctx.translate(cx, cy + bob * zoom);
      ctx.scale(Math.abs(cos) * zoom, zoom);
      ctx.drawImage(img, -this.art.w / 2, -this.art.h / 2, this.art.w, this.art.h);
      ctx.restore();
    }
    let maxA = 0;

    for (const q of this.particles) {
      let hx, hz, hy, col;
      if (!showBack) { hx = q.f.x * cos; hz = q.f.x * sin; hy = q.f.y; col = q.f.c; }
      else { hx = -q.b.x * cos; hz = -q.b.x * sin; hy = q.b.y; col = q.b.c; }
      hy += bob;

      // how far this particle is from home (0 = assembled, 1 = fully scattered)
      let a = p < 0.4
        ? ease(clamp(scatterT * 1.3 - q.d1))
        : 1 - ease(clamp(joinT * 1.3 - q.d2));

      if (a > maxA) maxA = a;
      if (a < 0.02 && crisp >= 1) continue;

      let x = hx, y = hy, z = hz;
      if (a > 0) {
        const tx = q.sx * cs - q.sz * ss, tz = q.sx * ss + q.sz * cs;
        x += (tx - hx) * a; y += (q.sy - hy) * a; z += (tz - hz) * a;
      }

      const depth = F / (F + z);
      if (depth <= 0) continue;
      const k = depth * zoom;
      const px = cx + x * k, py = cy + y * k;
      ctx.fillStyle = col;

      if (a < 0.02) {
        // assembled: tight squares read as a solid, crisp product
        const sz = q.size * k;
        ctx.globalAlpha = 1 - crisp;
        ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      } else {
        // in flight: soft round dots; ones flying toward the camera blur into large faint bokeh
        const near = depth > 1.35 ? Math.min(1, (depth - 1.35) / 0.6) * a : 0;
        const r = (q.size * k * (0.42 - a * 0.1)) * (1 + near * 3.5);
        ctx.globalAlpha = Math.min(1, 0.3 + depth * 0.55) * (1 - near * 0.8);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, 6.2832);
        ctx.fill();
      }
    }
    this.lastMaxA = maxA;
    this.drawDust(t);
    ctx.globalAlpha = 1;
  }

  // Slow-drifting dust motes in front of the product, for depth
  drawDust(t) {
    if (!this.dust) {
      this.dust = Array.from({ length: 46 }, () => ({
        x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.4,
        s: Math.random() * 0.02 + 0.006, o: Math.random() * Math.PI * 2
      }));
    }
    const ctx = this.ctx;
    ctx.fillStyle = '#f3ede2';
    for (const d of this.dust) {
      const y = ((d.y - t * d.s) % 1 + 1) % 1;
      const x = d.x + Math.sin(t * 0.3 + d.o) * 0.01;
      ctx.globalAlpha = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t + d.o));
      ctx.beginPath();
      ctx.arc(x * this.w, y * this.h, d.r, 0, 6.2832);
      ctx.fill();
    }
  }

  updateCaptions(p) {
    for (const el of this.captions) {
      const a = +el.dataset.in, b = +el.dataset.out, f = 0.04;
      let o;
      if (a === 0) o = p <= b ? Math.min(1, (b - p) / f) : 0;
      else o = Math.min(1, Math.max(0, Math.min((p - a) / f, (b - p) / f)));
      el.style.opacity = o;
      el.style.transform = `translateY(${(1 - o) * 24}px)`;
      el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
    }
  }
}
