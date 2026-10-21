/* Product illustrations as SVG strings.
   Every product image on the site (shop cards, particle showcases,
   customizer preview, admin) is generated here, so there are no image assets. */
const Art = (() => {
  let uidCounter = 0;
  const uid = () => 'a' + (++uidCounter);

  function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // amt > 0 mixes toward white, amt < 0 toward black
  function shade(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    const mix = c => Math.round(c + (t - c) * p);
    return '#' + [mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  // Ink color that reads well on a given shirt color
  const inkFor = color => luminance(color) > 0.55 ? '#16161b' : '#f7f4ee';

  /* ---------- T-shirt ---------- */
  const PRINT_AREA = {
    front: { x: 130, y: 98, w: 140, h: 200 },
    back: { x: 130, y: 80, w: 140, h: 210 }
  };

  const SHIRT_BODY = 'L305 48 L372 118 L334 168 L296 142 L298 408 Q200 418 102 408 L104 142 L66 168 L28 118 L95 48 Z';

  function shirt({ color = '#ffffff', side = 'front', print = '', id = uid() } = {}) {
    const dark = shade(color, -0.22);
    const darker = shade(color, -0.42);
    const light = shade(color, 0.14);
    const neck = side === 'front' ? 'M150 30 Q200 72 250 30 ' : 'M150 30 Q200 46 250 30 ';
    const neckLine = neck.trim();
    const pa = PRINT_AREA[side];
    // On the front you can see the inside of the back neck, with a woven label
    const inner = side === 'front'
      ? `<path d="M150 30 Q200 46 250 30 Q200 72 150 30Z" fill="${darker}"/>
         <rect x="190" y="40" width="20" height="9" rx="1" fill="${shade(color, luminance(color) > 0.5 ? -0.75 : 0.75)}" opacity=".85"/>`
      : '';
    const ribs = side === 'front' ? 'M153 33 Q200 66 247 33' : 'M153 33 Q200 43 247 33';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440">
  <defs>
    <linearGradient id="${id}-sh" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".26"/>
      <stop offset=".2" stop-color="#000" stop-opacity="0"/>
      <stop offset=".46" stop-color="#fff" stop-opacity=".08"/>
      <stop offset=".8" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".26"/>
    </linearGradient>
    <linearGradient id="${id}-v" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
      <stop offset=".35" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".12"/>
    </linearGradient>
    <filter id="${id}-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="${id}-tex" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.05"/>
    </filter>
    <clipPath id="${id}-body"><path d="${neck}${SHIRT_BODY}"/></clipPath>
    <clipPath id="${id}-pa"><rect x="${pa.x}" y="${pa.y}" width="${pa.w}" height="${pa.h}"/></clipPath>
  </defs>
  ${inner}
  <path d="${neck}${SHIRT_BODY}" fill="${color}"/>
  <g clip-path="url(#${id}-body)"><g clip-path="url(#${id}-pa)" opacity=".97">${print}</g></g>
  <g clip-path="url(#${id}-body)" fill="none" stroke-linecap="round" pointer-events="none">
    <rect x="0" y="0" width="400" height="440" filter="url(#${id}-tex)" opacity=".1"/>
    <path d="M28 118 L95 48 Q112 100 104 142 L66 168Z" fill="#000" opacity=".05"/>
    <path d="M372 118 L305 48 Q288 100 296 142 L334 168Z" fill="#000" opacity=".05"/>
    <g filter="url(#${id}-blur)">
      <path d="M132 170 Q146 280 128 396" stroke="#000" stroke-width="16" opacity=".09"/>
      <path d="M272 160 Q256 280 276 398" stroke="#000" stroke-width="18" opacity=".08"/>
      <path d="M184 300 Q206 350 196 404" stroke="#000" stroke-width="10" opacity=".06"/>
      <path d="M164 150 Q178 260 160 380" stroke="#fff" stroke-width="12" opacity=".1"/>
      <path d="M234 140 Q222 250 242 384" stroke="#fff" stroke-width="10" opacity=".08"/>
      <path d="M110 150 Q150 136 200 140 Q250 136 292 150" stroke="#000" stroke-width="8" opacity=".07"/>
    </g>
    <path d="${neck}${SHIRT_BODY}" fill="url(#${id}-sh)"/>
    <path d="${neck}${SHIRT_BODY}" fill="url(#${id}-v)"/>
    <path d="M95 48 Q112 100 104 142" stroke="${dark}" stroke-width="2.2" opacity=".75"/>
    <path d="M305 48 Q288 100 296 142" stroke="${dark}" stroke-width="2.2" opacity=".75"/>
    <path d="M40 130 L74 160" stroke="${dark}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".7"/>
    <path d="M360 130 L326 160" stroke="${dark}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".7"/>
    <path d="M104 398 Q200 408 296 398" stroke="${dark}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".7"/>
    <path d="M104 402 Q200 412 296 402" stroke="${dark}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".5"/>
  </g>
  <g pointer-events="none" fill="none" stroke-linecap="round">
    <path d="${neckLine}" stroke="${dark}" stroke-width="10"/>
    <path d="${ribs}" stroke="${light}" stroke-width="5" stroke-dasharray="1.2 2.2" opacity=".55"/>
    <path d="${neckLine}" stroke="#000" stroke-width="10" opacity=".08" transform="translate(0 3)"/>
  </g>
</svg>`;
  }

  /* ---------- Shoe ---------- */
  const UPPER = 'M38 198 L36 128 Q36 98 64 92 L118 86 Q132 62 168 58 L196 60 Q214 98 258 118 Q322 140 360 158 Q390 172 388 196 Z';

  function shoe({ upper = '#eeeeee', accent = '#ff5a1f', sole = '#ffffff', lace = '#dddddd', side = 'front', id = uid() } = {}) {
    const flip = side === 'back' ? ' transform="translate(400 0) scale(-1 1)"' : '';
    const stitch = shade(upper, luminance(upper) > 0.5 ? -0.32 : 0.35);

    let laces = '';
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const x = 186 + (262 - 186) * t, y = 72 + (124 - 72) * t;
      laces += `
        <path d="M${x - 12} ${y + 6} L${x + 9} ${y - 8}" stroke="#000" stroke-width="5.5" stroke-linecap="round" opacity=".22" transform="translate(1 2)"/>
        <path d="M${x - 12} ${y + 6} L${x + 9} ${y - 8}" stroke="${lace}" stroke-width="5" stroke-linecap="round"/>
        <path d="M${x - 10} ${y + 3.6} L${x + 7} ${y - 8}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>
        <circle cx="${x - 9}" cy="${y + 10}" r="3.2" fill="${shade(upper, -0.55)}" stroke="${shade(upper, 0.35)}" stroke-width="1"/>`;
    }

    let perf = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      perf += `<circle cx="${328 + c * 8 + (r % 2) * 4}" cy="${170 + r * 7}" r="1.3" fill="#000" opacity=".22"/>`;
    }

    let tread = '';
    for (let x = 44; x < 366; x += 7) tread += `<path d="M${x} 237 L${x + 2} 244"/>`;

    const stripe = side === 'front'
      ? `<path d="M104 182 Q166 118 252 138 Q302 150 334 128 Q306 174 242 170 Q170 164 104 182Z" fill="${accent}"/>
         <path d="M104 182 Q166 118 252 138 Q302 150 334 128 Q306 174 242 170 Q170 164 104 182Z" fill="url(#${id}-ac)"/>
         <path d="M114 176 Q168 128 250 145 Q296 154 322 138" fill="none" stroke="${shade(accent, -0.3)}" stroke-width="1" stroke-dasharray="3 3"/>`
      : `<path d="M98 150 Q150 128 200 150 T300 150" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round"/>
         <path d="M112 172 Q160 152 206 172 T296 170" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".75"/>
         <circle cx="300" cy="176" r="9" fill="${accent}"/>`;

    const logoX = side === 'front' ? 62 : 338;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">
  <defs>
    <linearGradient id="${id}-v" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".3"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".2"/>
    </linearGradient>
    <linearGradient id="${id}-h" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".22"/>
      <stop offset=".22" stop-color="#000" stop-opacity="0"/>
      <stop offset=".72" stop-color="#fff" stop-opacity=".12"/>
      <stop offset="1" stop-color="#000" stop-opacity=".14"/>
    </linearGradient>
    <linearGradient id="${id}-ac" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".25"/>
      <stop offset="1" stop-color="#000" stop-opacity=".15"/>
    </linearGradient>
    <linearGradient id="${id}-sole" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${shade(sole, 0.1)}"/>
      <stop offset="1" stop-color="${shade(sole, -0.14)}"/>
    </linearGradient>
    <filter id="${id}-gs" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
    <clipPath id="${id}-up"><path d="${UPPER}"/></clipPath>
  </defs>
  <ellipse cx="205" cy="246" rx="176" ry="9" fill="#000" opacity=".28" filter="url(#${id}-gs)"/>
  <g${flip}>
    <path d="M36 222 L368 222 Q392 222 390 234 Q388 244 364 244 L46 244 Q26 244 26 232 Q28 222 36 222Z" fill="${shade(sole, -0.55)}"/>
    <g stroke="${shade(sole, -0.7)}" stroke-width="3" stroke-linecap="round">${tread}</g>
    <path d="M32 196 L372 192 Q394 194 392 214 Q390 228 366 228 L42 228 Q24 228 24 212 Q24 198 32 196Z" fill="url(#${id}-sole)"/>
    <path d="M58 214 Q130 206 200 212 T362 208" fill="none" stroke="${shade(sole, -0.2)}" stroke-width="2.5"/>
    <path d="M60 203 L360 199" stroke="#fff" stroke-width="1.5" opacity=".55"/>

    <path d="M160 58 Q176 34 204 42 Q214 52 206 72 Q196 64 180 62Z" fill="${shade(upper, 0.06)}"/>
    <rect x="182" y="44" width="14" height="9" rx="1.5" fill="${accent}" transform="rotate(14 189 48)"/>
    <path d="${UPPER}" fill="${upper}"/>
    <g clip-path="url(#${id}-up)">
      <path d="M300 140 Q340 150 362 160 Q390 174 388 196 L298 196 Q288 168 300 140Z" fill="${shade(upper, -0.08)}"/>
      <path d="M304 146 Q294 170 302 192" fill="none" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3"/>
      ${perf}
      <path d="M38 198 L36 128 Q36 100 60 94 L84 92 Q98 140 92 198Z" fill="${shade(upper, -0.13)}"/>
      <path d="M88 96 Q100 140 96 196" fill="none" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3"/>
      <path d="M176 64 Q200 100 262 128 L276 120 Q216 94 198 60Z" fill="${shade(upper, -0.06)}"/>
      ${stripe}
      <path d="M44 191 Q200 185 386 189" fill="none" stroke="#000" stroke-width="1.5" opacity=".16"/>
      <path d="M44 190 L44 132 Q44 106 66 100 L120 94" fill="none" stroke="${stitch}" stroke-width="1" stroke-dasharray="3 3"/>
      <rect x="0" y="0" width="400" height="260" fill="url(#${id}-v)"/>
      <rect x="0" y="0" width="400" height="260" fill="url(#${id}-h)"/>
      <path d="M212 96 Q280 128 352 156" fill="none" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>
    </g>
    <path d="M64 92 Q100 74 118 86 Q132 62 168 58 Q150 70 140 88 Q110 98 64 92Z" fill="${shade(upper, -0.62)}"/>
    <path d="M64 92 Q100 74 118 86 Q132 62 168 58" fill="none" stroke="${shade(upper, -0.18)}" stroke-width="5" stroke-linecap="round"/>
    <path d="M36 122 Q30 100 40 88 L54 91 Q45 108 48 124Z" fill="${accent}"/>
    <path d="M40 92 Q36 104 40 118" fill="none" stroke="#fff" stroke-width="1" opacity=".4"/>
    ${laces}
    <path d="M34 197 L372 193" stroke="#000" stroke-width="2" opacity=".16"/>
  </g>
  <text x="${logoX}" y="176" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="13" fill="${accent}">S&amp;T</text>
</svg>`;
  }

  const toDataURL = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  return { shirt, shoe, shade, inkFor, luminance, uid, toDataURL, PRINT_AREA };
})();
