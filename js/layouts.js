/* Premade print layouts: typographic, one ink plus one accent, in the
   Sole & Thread editorial style. Each one draws inside a 200 x 200 box.
   `ink` is a contrast color picked for the shirt underneath. */
const Layouts = (() => {
  const SERIF = "Instrument Serif, Georgia, 'Times New Roman', serif";
  const SANS = 'Helvetica Neue, Arial, sans-serif';
  const ACCENT = '#b5532c';

  const small = (x, y, text, ink, size = 6.5, anchor = 'middle', spacing = 2.4) =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${SANS}" font-size="${size}" font-weight="600" letter-spacing="${spacing}" fill="${ink}">${text}</text>`;

  const list = {
    sunset: {
      name: 'Golden Hour',
      draw: (id, ink) => {
        let rays = '';
        for (let i = 0; i < 9; i++) {
          const a = Math.PI + (i / 8) * Math.PI;
          rays += `<path d="M${(100 + Math.cos(a) * 40).toFixed(1)} ${(92 + Math.sin(a) * 40).toFixed(1)} L${(100 + Math.cos(a) * 52).toFixed(1)} ${(92 + Math.sin(a) * 52).toFixed(1)}"/>`;
        }
        return `
        <g fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round">${rays}
          <path d="M66 92 A34 34 0 0 1 134 92"/>
        </g>
        <path d="M68 92 A32 32 0 0 1 132 92Z" fill="${ACCENT}"/>
        <path d="M40 96 H160" stroke="${ink}" stroke-width="1.4"/>
        <path d="M58 103 H142 M76 109 H124" stroke="${ink}" stroke-width="1" opacity=".7"/>
        <text x="100" y="146" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="34" fill="${ink}">Golden Hour</text>
        ${small(100, 166, 'SOLE &amp; THREAD · EST. MMXXVI', ink, 6)}`;
      }
    },
    grid: {
      name: 'Index No. 01',
      draw: (id, ink) => {
        let marks = '';
        for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
          const x = 44 + c * 28, y = 34 + r * 22;
          marks += r === 2 && c === 2
            ? `<circle cx="${x}" cy="${y}" r="5" fill="${ACCENT}"/>`
            : `<path d="M${x - 3} ${y} H${x + 3} M${x} ${y - 3} V${y + 3}" stroke="${ink}" stroke-width="1"/>`;
        }
        return `${marks}
          <path d="M30 150 H170" stroke="${ink}" stroke-width="1"/>
          <text x="30" y="178" font-family="${SERIF}" font-size="30" fill="${ink}">Index</text>
          ${small(170, 162, 'NO. 01', ink, 6.5, 'end')}
          ${small(170, 176, '42 / 42', ink, 6.5, 'end')}`;
      }
    },
    wild: {
      name: 'Stay Wild',
      draw: (id, ink) => `
        ${small(100, 40, '— FIELD NOTES —', ink, 6.5)}
        <text x="100" y="104" text-anchor="middle" font-family="${SERIF}" font-size="62" fill="${ink}">Stay</text>
        <text x="100" y="152" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="62" fill="${ACCENT}">wild.</text>
        <path d="M62 170 H138" stroke="${ink}" stroke-width="1"/>
        ${small(100, 184, '51.5072° N · 0.1276° W', ink, 6, 'middle', 1.6)}`
    },
    wave: {
      name: 'Long Way Home',
      draw: (id, ink) => {
        let waves = '';
        for (let i = 0; i < 7; i++) {
          const y = 52 + i * 11;
          waves += `<path d="M36 ${y} Q53 ${y - 9} 70 ${y} T104 ${y} T138 ${y} T172 ${y}" stroke="${i === 3 ? ACCENT : ink}" stroke-width="${i === 3 ? 2 : 1.1}"/>`;
        }
        return `<g fill="none" stroke-linecap="round">${waves}</g>
          <text x="100" y="158" text-anchor="middle" font-family="${SERIF}" font-size="26" fill="${ink}">the long way <tspan font-style="italic">home</tspan></text>
          ${small(100, 178, 'DROP 01 · COASTAL', ink, 6)}`;
      }
    },
    badge: {
      name: 'Club Crest',
      draw: (id, ink) => `
        <defs><path id="${id}-p" d="M100 100 m-70 0 a70 70 0 1 1 140 0 a70 70 0 1 1 -140 0"/></defs>
        <circle cx="100" cy="100" r="86" fill="none" stroke="${ink}" stroke-width="1.2"/>
        <circle cx="100" cy="100" r="56" fill="none" stroke="${ink}" stroke-width="1.2"/>
        <text font-family="${SANS}" font-size="9" font-weight="600" letter-spacing="5.2" fill="${ink}">
          <textPath href="#${id}-p">SOLE &amp; THREAD · RUN CLUB · EST. MMXXVI ·</textPath>
        </text>
        <text x="100" y="112" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="40" fill="${ACCENT}">S&amp;T</text>`
    },
    bloom: {
      name: 'Bloom',
      draw: (id, ink) => `
        <g fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M100 150 C98 120 102 100 100 76"/>
          <path d="M100 124 C84 116 74 118 66 126 C78 132 90 130 100 124Z"/>
          <path d="M100 108 C114 100 126 102 132 110 C122 116 110 114 100 108Z"/>
          <path d="M100 76 C88 66 88 48 100 36 C112 48 112 66 100 76Z"/>
          <path d="M100 76 C86 74 74 62 74 48 C88 50 98 60 100 76Z"/>
          <path d="M100 76 C114 74 126 62 126 48 C112 50 102 60 100 76Z"/>
        </g>
        <circle cx="100" cy="60" r="4" fill="${ACCENT}"/>
        <text x="100" y="180" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="30" fill="${ink}">Bloom</text>`
    }
  };

  // Markup for a layout centred in a shirt's print area (shirt coordinates)
  function place(key, side, ink, scale = 1) {
    const pa = Art.PRINT_AREA[side];
    const size = 120 * scale;
    const x = pa.x + (pa.w - size) / 2, y = pa.y + 18;
    return `<g transform="translate(${x} ${y}) scale(${size / 200})">${list[key].draw(Art.uid(), ink)}</g>`;
  }

  // Stand-alone square thumbnail
  function thumb(key, bg = '#e2dccf') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220"><rect x="-10" y="-10" width="220" height="220" fill="${bg}"/>${list[key].draw(Art.uid(), Art.inkFor(bg))}</svg>`;
  }

  return { list, place, thumb };
})();
