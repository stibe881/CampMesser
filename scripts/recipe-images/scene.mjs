// Gemeinsame Bildsprache für die Rezept-Bildkarten: warmer Himmel, Hügel,
// Tischkante, darauf das Gericht in flachen Formen.
export const W = 800,
  H = 600;

export const C = {
  skyTop: "#FBF3E2",
  skyBot: "#F0DFBE",
  sun: "#F5C877",
  hillFar: "#A9BFA4",
  hillNear: "#6E9273",
  hillDark: "#4C7358",
  table: "#C9AE86",
  tableDark: "#B2966E",
  tableEdge: "#9C7F58",
  ink: "#2C3A33",
  cream: "#F7F1E4",
  steel: "#D8D3C8",
  steelDark: "#A9A296",
};

export function bg() {
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.skyTop}"/>
      <stop offset="1" stop-color="${C.skyBot}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.2" r="0.42">
      <stop offset="0" stop-color="${C.sun}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${C.sun}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tbl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.table}"/>
      <stop offset="1" stop-color="${C.tableDark}"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#3A2E1C" stop-opacity="0.18"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <circle cx="628" cy="128" r="46" fill="${C.sun}" opacity="0.9"/>
  <path d="M0 322 L118 262 L206 300 L318 236 L430 296 L540 250 L654 300 L760 258 L800 280 L800 400 L0 400 Z" fill="${C.hillFar}" opacity="0.75"/>
  <path d="M0 356 L96 312 L192 348 L296 300 L402 350 L512 312 L628 356 L742 316 L800 342 L800 430 L0 430 Z" fill="${C.hillNear}" opacity="0.85"/>
  <path d="M0 402 L140 366 L262 400 L392 362 L520 402 L648 368 L800 400 L800 452 L0 452 Z" fill="${C.hillDark}" opacity="0.55"/>
  <rect x="0" y="430" width="${W}" height="${H - 430}" fill="url(#tbl)"/>
  <rect x="0" y="430" width="${W}" height="10" fill="${C.tableEdge}" opacity="0.55"/>
  <g opacity="0.16" fill="#6B5334">
    <ellipse cx="120" cy="512" rx="96" ry="12"/>
    <ellipse cx="690" cy="556" rx="120" ry="14"/>
    <ellipse cx="380" cy="580" rx="150" ry="16"/>
  </g>`;
}

export function shadow(cx, cy, rx, ry = rx * 0.22) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#5C4222" opacity="0.22"/>`;
}

/** Dampf-Schwaden über dem Gericht. */
export function steam(cx, cy, n = 3) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = cx + (i - (n - 1) / 2) * 46;
    const h = 78 + (i % 2) * 26;
    out += `<path d="M${x} ${cy} c -20 -${h * 0.3} 20 -${h * 0.45} 0 -${h * 0.7} c -18 -${h * 0.2} 14 -${h * 0.3} 2 -${h * 0.5}" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="9" stroke-linecap="round"/>`;
  }
  return out;
}

/** Schüssel mit farbigem Inhalt; gibt auch die Oberkante des Inhalts zurück. */
export function bowl(cx, cy, rx, fill, rim = "#3B5D74") {
  const ry = rx * 0.3;
  return `
  ${shadow(cx, cy + rx * 0.44, rx * 1.02)}
  <path d="M${cx - rx} ${cy} a ${rx} ${rx * 0.62} 0 0 0 ${rx * 2} 0 Z" fill="${C.cream}"/>
  <path d="M${cx - rx} ${cy} a ${rx} ${rx * 0.62} 0 0 0 ${rx * 2} 0 Z" fill="#000" opacity="0.06"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.cream}"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${rim}" stroke-width="9"/>
  <ellipse cx="${cx}" cy="${cy + 3}" rx="${rx - 16}" ry="${ry - 7}" fill="${fill}"/>`;
}

/** Pfanne von schräg oben, mit Stiel nach rechts. */
export function pan(cx, cy, rx, fill) {
  const ry = rx * 0.42;
  return `
  ${shadow(cx, cy + ry + 26, rx * 1.05)}
  <rect x="${cx + rx - 6}" y="${cy - 13}" width="${rx * 0.92}" height="26" rx="13" fill="#4A4640"/>
  <rect x="${cx + rx * 1.5}" y="${cy - 13}" width="${rx * 0.44}" height="26" rx="13" fill="#6B5B4B"/>
  <ellipse cx="${cx}" cy="${cy + 16}" rx="${rx}" ry="${ry}" fill="#3F3B36"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#57524B"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx - 14}" ry="${ry - 7}" fill="#2E2B27"/>
  <ellipse cx="${cx}" cy="${cy + 2}" rx="${rx - 24}" ry="${ry - 13}" fill="${fill}"/>`;
}

/** Teller von schräg oben. */
export function plate(cx, cy, rx, rim = "#3B5D74") {
  const ry = rx * 0.34;
  return `
  ${shadow(cx, cy + ry + 16, rx * 1.02)}
  <ellipse cx="${cx}" cy="${cy + 10}" rx="${rx}" ry="${ry}" fill="#D9D2C2"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.cream}"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${rim}" stroke-width="8" opacity="0.9"/>
  <ellipse cx="${cx}" cy="${cy + 1}" rx="${rx - 30}" ry="${ry - 12}" fill="#EFE7D6"/>`;
}

/** Feuerschale mit Glutbett und Rost darüber. */
export function grill(cx, cy, w) {
  const half = w / 2;
  let bars = "";
  for (let i = 0; i <= 9; i++) {
    const x = cx - half + 10 + ((w - 20) / 9) * i;
    bars += `<rect x="${x - 4}" y="${cy - 7}" width="8" height="14" rx="4" fill="${C.steelDark}"/>`;
  }
  let embers = "";
  for (let i = 0; i < 10; i++) {
    const x = cx - half + 22 + i * ((w - 44) / 9);
    const y = cy + 24 + ((i % 3) - 1) * 6;
    embers += `<ellipse cx="${x}" cy="${y}" rx="${15 + (i % 3) * 5}" ry="10" fill="${i % 2 ? "#E0722F" : "#BF4A20"}"/>`;
    if (i % 3 === 0)
      embers += `<ellipse cx="${x}" cy="${y - 2}" rx="8" ry="5" fill="#F7B15A"/>`;
  }
  return `
  ${shadow(cx, cy + 128, half * 1.02)}
  <rect x="${cx - half + 26}" y="${cy + 76}" width="14" height="52" rx="7" fill="#4A4640" transform="rotate(9 ${cx - half + 33} ${cy + 100})"/>
  <rect x="${cx + half - 40}" y="${cy + 76}" width="14" height="52" rx="7" fill="#4A4640" transform="rotate(-9 ${cx + half - 33} ${cy + 100})"/>
  <rect x="${cx - half - 14}" y="${cy + 4}" width="${w + 28}" height="80" rx="16" fill="#3F3B36"/>
  <rect x="${cx - half - 6}" y="${cy + 8}" width="${w + 12}" height="36" rx="10" fill="#241F1B"/>
  ${embers}
  <rect x="${cx - half - 14}" y="${cy + 40}" width="${w + 28}" height="44" rx="14" fill="#4A4640"/>
  <rect x="${cx - half - 14}" y="${cy + 40}" width="${w + 28}" height="7" fill="#2A2724" opacity="0.55"/>
  <rect x="${cx - half}" y="${cy - 7}" width="${w}" height="14" rx="7" fill="${C.steel}"/>
  ${bars}
  <rect x="${cx - half}" y="${cy - 7}" width="${w}" height="6" rx="3" fill="#EDE9E0" opacity="0.7"/>`;
}

export function svg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg()}<g transform="translate(400 438) scale(1.32) translate(-400 -470)">${inner}</g><rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`;
}
