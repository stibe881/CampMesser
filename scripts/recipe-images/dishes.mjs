import { C, bowl, pan, plate, grill, shadow, steam, svg } from "./scene.mjs";

const dot = (x, y, r, f, o = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" opacity="${o}"/>`;

/** Streut Punkte deterministisch (kein Math.random – reproduzierbare Bilder). */
function scatter(cx, cy, rx, ry, n, seed, draw) {
  let out = "";
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const a = (s / 2147483648) * Math.PI * 2;
    s = (s * 1103515245 + 12345) % 2147483648;
    const d = Math.sqrt(s / 2147483648);
    out += draw(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, i);
  }
  return out;
}

const spoon = (x, y, rot) => `
  <g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="0" y="-7" width="150" height="14" rx="7" fill="#C9C4B8"/>
    <ellipse cx="-14" cy="0" rx="32" ry="22" fill="#D8D3C8"/>
    <ellipse cx="-14" cy="-2" rx="24" ry="15" fill="#BDB8AC"/>
  </g>`;

export const dishes = {
  // Birchermüesli: Schüssel mit Müesli, Beeren und Apfelraffel
  "birchermuesli-overnight": () =>
    svg(`
    ${bowl(400, 468, 175, "#E9DCBE")}
    ${scatter(400, 470, 130, 34, 26, 7, (x, y, i) => dot(x, y, 5 + (i % 3), "#CDBC96", 0.9))}
    ${dot(340, 462, 21, "#C0374B")}${dot(352, 454, 6, "#D9566A", 0.7)}
    ${dot(404, 452, 19, "#C0374B")}${dot(414, 445, 5, "#D9566A", 0.7)}
    ${dot(452, 470, 17, "#3C4E86")}${dot(372, 484, 15, "#3C4E86")}
    ${dot(430, 486, 13, "#4A5E96")}
    ${scatter(400, 474, 120, 28, 12, 21, (x, y) => dot(x, y, 4, "#F6EFDD", 0.85))}
    <path d="M300 448 q 40 -16 76 -4" stroke="#F3E6C4" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.8"/>
    ${spoon(556, 556, -14)}`),

  // Pancakes: Stapel mit Sirup und Beere
  "camping-pancakes": () =>
    svg(`
    ${plate(400, 486, 200)}
    <g>
      <ellipse cx="400" cy="470" rx="128" ry="40" fill="#C2843F"/>
      <ellipse cx="400" cy="460" rx="128" ry="40" fill="#DDA35A"/>
      <ellipse cx="400" cy="430" rx="124" ry="38" fill="#C2843F"/>
      <ellipse cx="400" cy="421" rx="124" ry="38" fill="#E0AA63"/>
      <ellipse cx="400" cy="392" rx="118" ry="36" fill="#C2843F"/>
      <ellipse cx="400" cy="383" rx="118" ry="36" fill="#E7B36D"/>
      <ellipse cx="386" cy="379" rx="52" ry="15" fill="#F0C68A" opacity="0.7"/>
    </g>
    <path d="M330 374 q -18 34 -8 62 q -22 26 -6 54" stroke="#A9631E" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M470 372 q 20 30 10 58" stroke="#A9631E" stroke-width="13" fill="none" stroke-linecap="round"/>
    <ellipse cx="400" cy="366" rx="46" ry="13" fill="#B87227" opacity="0.85"/>
    ${dot(414, 356, 17, "#C0374B")}${dot(422, 348, 5, "#D9566A", 0.7)}
    ${dot(372, 360, 13, "#3C4E86")}`),

  // Rösti mit Spiegelei in der Pfanne
  "roesti-spiegelei": () =>
    svg(`
    ${pan(390, 462, 196, "#2E2B27")}
    <ellipse cx="390" cy="464" rx="164" ry="66" fill="#C98C3C"/>
    <ellipse cx="390" cy="458" rx="164" ry="66" fill="#DEA84F"/>
    ${scatter(390, 458, 150, 58, 34, 11, (x, y, i) => `<rect x="${x}" y="${y}" width="${16 + (i % 3) * 8}" height="6" rx="3" fill="${i % 2 ? "#C9853A" : "#EFC077"}" opacity="0.85" transform="rotate(${(i * 37) % 180} ${x} ${y})"/>`)}
    <ellipse cx="386" cy="450" rx="92" ry="40" fill="#FAF3E4"/>
    <ellipse cx="368" cy="440" rx="34" ry="26" fill="#F2B02A"/>
    <ellipse cx="360" cy="433" rx="13" ry="9" fill="#F8CC63" opacity="0.8"/>
    <path d="M300 486 q 60 24 130 10" stroke="#B87227" stroke-width="6" fill="none" opacity="0.5" stroke-linecap="round"/>
    ${steam(390, 372, 3)}`),

  // Ghackets mit Hörnli und Apfelmus
  "ghackets-hoernli": () =>
    svg(`
    ${plate(400, 484, 214)}
    <g><g transform="translate(297 476) rotate(236)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(333 465) rotate(38)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(308 451) rotate(217)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(385 446) rotate(135)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(354 483) rotate(107)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(381 464) rotate(356)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(351 451) rotate(194)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(367 495) rotate(253)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(321 479) rotate(118)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(274 437) rotate(266)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(252 472) rotate(282)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(340 467) rotate(88)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(276 475) rotate(143)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(297 494) rotate(258)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(311 478) rotate(300)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(348 469) rotate(45)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(399 460) rotate(252)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(350 437) rotate(300)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(264 470) rotate(135)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(270 484) rotate(133)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(260 448) rotate(26)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g><g transform="translate(338 465) rotate(323)"><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#D6BE86" stroke-width="21" fill="none" stroke-linecap="round"/><path d="M-17 8 a 17 17 0 0 1 34 0" stroke="#F4E6BE" stroke-width="14" fill="none" stroke-linecap="round"/></g></g>
    <ellipse cx="486" cy="474" rx="86" ry="32" fill="#5E3A22"/>
    <ellipse cx="486" cy="466" rx="86" ry="32" fill="#7A4C2E"/>
    ${scatter(486, 462, 74, 24, 30, 13, (x, y, i) => `<rect x="${x - 9}" y="${y - 6}" width="18" height="12" rx="5" fill="${i % 3 === 0 ? "#5E3A22" : "#93603A"}" transform="rotate(${(i * 61) % 180} ${x} ${y})"/>`)}
    <path d="M432 448 q 52 -18 104 -2" stroke="#A2704A" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.7"/>
    <ellipse cx="392" cy="520" rx="56" ry="19" fill="#D3AC57"/>
    <ellipse cx="392" cy="514" rx="46" ry="15" fill="#E6C87C"/>
    ${scatter(392, 514, 30, 9, 6, 77, (x, y) => dot(x, y, 3, "#C29B4C", 0.7))}
    ${scatter(400, 458, 150, 34, 9, 71, (x, y) => dot(x, y, 4, "#6E9273", 0.85))}
    ${steam(430, 372, 2)}`),

  // Forellen-Päckli auf dem Grillrost
  "forellen-paeckli": () =>
    svg(`
    ${grill(400, 480, 430)}
    <g>
      <path d="M198 476 q 26 -58 100 -58 h 204 q 74 0 100 58 q -62 24 -202 24 q -140 0 -202 -24 Z" fill="#C9CBCE"/>
      <path d="M198 476 q 26 -58 100 -58 h 204 q 74 0 100 58 q -62 16 -202 16 q -140 0 -202 -16 Z" fill="#DDE0E3"/>
      <path d="M232 452 q 22 -30 68 -30 h 200 q 46 0 68 30 q -56 14 -168 14 q -112 0 -168 -14 Z" fill="#EEF0F2"/>
      <path d="M198 476 l 18 -22 l 16 20 l 18 -24 l 16 22 M602 476 l -18 -22 l -16 20 l -18 -24 l -16 22" fill="none" stroke="#B4B7BB" stroke-width="6" stroke-linejoin="round"/>
      <path d="M262 462 q 30 -22 78 -26 M540 462 q -30 -22 -78 -26" stroke="#B4B7BB" stroke-width="5" fill="none" opacity="0.8"/>
    </g>
    <g transform="translate(400 424)">
      <path d="M-150 6 q 62 -46 150 -46 q 88 0 148 46 q -60 40 -148 40 q -88 0 -150 -40 Z" fill="#C08772"/>
      <path d="M-150 6 q 62 -42 150 -42 q 88 0 148 42 q -60 16 -148 16 q -88 0 -150 -16 Z" fill="#DFAB95"/>
      <path d="M-150 6 q 62 -42 150 -42 q 40 0 74 9 q -70 22 -224 33 Z" fill="#EBC3B0" opacity="0.8"/>
      <path d="M148 6 l 46 -26 l 0 52 Z" fill="#B87C68"/>
      <path d="M148 6 l 46 -26 l -6 26 Z" fill="#C99283"/>
      <path d="M-56 -30 q 26 -14 54 -6 q 24 8 34 24" fill="none" stroke="#B87C68" stroke-width="5" opacity="0.7"/>
      ${dot(-104, -4, 7, "#4A342D")}
      <path d="M-70 8 q 34 10 70 2" stroke="#B87C68" stroke-width="5" fill="none" opacity="0.7"/>
    </g>
    <g transform="translate(268 402)">
      <path d="M0 0 q 34 -22 74 -14 q -30 26 -74 14 Z" fill="#6E9273"/>
      <path d="M0 0 q 34 -22 74 -14" stroke="#557E5E" stroke-width="4" fill="none"/>
    </g>
    <g transform="translate(520 396)">
      <circle r="34" fill="#EFCB55"/><circle r="27" fill="#F7E08C"/>
      <path d="M0 -27 L0 27 M-27 0 L27 0 M-19 -19 L19 19 M-19 19 L19 -19" stroke="#EFCB55" stroke-width="4"/>
    </g>
    ${steam(400, 344, 3)}`),

  // Maiskolben in der Glut
  "maiskolben-glut": () =>
    svg(`
    ${grill(400, 480, 430)}
      <g transform="translate(344 436) rotate(-7) scale(0.74)">
        <rect x="-118" y="-32" width="236" height="64" rx="32" fill="#C9862B"/>
        <rect x="-118" y="-32" width="236" height="52" rx="26" fill="#EFC055"/>
        <rect x="-108" y="-23" width="16" height="14" rx="6" fill="#C9862B"/><rect x="-88" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-68" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-48" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-28" y="-23" width="16" height="14" rx="6" fill="#C9862B"/><rect x="-8" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="12" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="32" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="52" y="-23" width="16" height="14" rx="6" fill="#C9862B"/><rect x="72" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="92" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-98" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-78" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-58" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-38" y="-7" width="16" height="14" rx="6" fill="#C9862B"/><rect x="-18" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="2" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="22" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="42" y="-7" width="16" height="14" rx="6" fill="#C9862B"/><rect x="62" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="82" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="102" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-108" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-88" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-68" y="9" width="16" height="14" rx="6" fill="#C9862B"/><rect x="-48" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-28" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-8" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="12" y="9" width="16" height="14" rx="6" fill="#C9862B"/><rect x="32" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="52" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="72" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="92" y="9" width="16" height="14" rx="6" fill="#C9862B"/>
        <path d="M-116 -14 q -54 -14 -84 6 q 48 26 88 12 Z" fill="#7FA37F"/>
        <path d="M-116 6 q -48 16 -70 42 q 52 4 76 -22 Z" fill="#5E8C63"/>
        <path d="M-190 -8 q 40 -8 74 -4" stroke="#557E5E" stroke-width="4" fill="none" opacity="0.7"/>
      </g>
      <g transform="translate(438 458) rotate(6) scale(0.7)">
        <rect x="-118" y="-32" width="236" height="64" rx="32" fill="#C9862B"/>
        <rect x="-118" y="-32" width="236" height="52" rx="26" fill="#EFC055"/>
        <rect x="-108" y="-23" width="16" height="14" rx="6" fill="#C9862B"/><rect x="-88" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-68" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-48" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-28" y="-23" width="16" height="14" rx="6" fill="#C9862B"/><rect x="-8" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="12" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="32" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="52" y="-23" width="16" height="14" rx="6" fill="#C9862B"/><rect x="72" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="92" y="-23" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-98" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-78" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-58" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-38" y="-7" width="16" height="14" rx="6" fill="#C9862B"/><rect x="-18" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="2" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="22" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="42" y="-7" width="16" height="14" rx="6" fill="#C9862B"/><rect x="62" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="82" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="102" y="-7" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-108" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-88" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-68" y="9" width="16" height="14" rx="6" fill="#C9862B"/><rect x="-48" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-28" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="-8" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="12" y="9" width="16" height="14" rx="6" fill="#C9862B"/><rect x="32" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="52" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="72" y="9" width="16" height="14" rx="6" fill="#F6D588"/><rect x="92" y="9" width="16" height="14" rx="6" fill="#C9862B"/>
        <path d="M-116 -14 q -54 -14 -84 6 q 48 26 88 12 Z" fill="#7FA37F"/>
        <path d="M-116 6 q -48 16 -70 42 q 52 4 76 -22 Z" fill="#5E8C63"/>
        <path d="M-190 -8 q 40 -8 74 -4" stroke="#557E5E" stroke-width="4" fill="none" opacity="0.7"/>
      </g>
    ${steam(410, 336, 2)}`),

  // Poulet-Reis-Pfanne
  "poulet-reis-pfanne": () =>
    svg(`
    ${pan(390, 462, 196, "#2E2B27")}
    <ellipse cx="390" cy="460" rx="166" ry="68" fill="#EFE4CB"/>
    ${scatter(390, 460, 152, 60, 90, 3, (x, y, i) => `<rect x="${x - 6}" y="${y - 3}" width="12" height="6" rx="3" fill="${i % 5 === 0 ? "#DCCEB0" : "#F8F1E1"}" transform="rotate(${(i * 41) % 180} ${x} ${y})"/>`)}
    ${scatter(390, 456, 130, 48, 11, 29, (x, y, i) => `<rect x="${x - 22}" y="${y - 16}" width="46" height="30" rx="14" fill="${i % 2 ? "#EFC078" : "#E3AC5E"}" transform="rotate(${(i * 67) % 180} ${x} ${y})"/>`)}
    ${scatter(390, 462, 140, 54, 22, 47, (x, y) => dot(x, y, 8, "#6E9273", 0.95))}
    ${scatter(390, 466, 128, 46, 5, 59, (x, y, i) => `<rect x="${x - 26}" y="${y - 5}" width="44" height="9" rx="4" fill="${i % 2 ? "#C24F22" : "#D9772F"}" transform="rotate(${(i * 83) % 180} ${x} ${y})"/>`)}
    ${steam(390, 372, 3)}`),

  // Raclette-Pfännli mit geschmolzenem Käse
  "raclette-pfaennli": () =>
    svg(`
    ${shadow(380, 540, 210)}
    <g transform="translate(360 452)">
      <rect x="140" y="-11" width="210" height="22" rx="11" fill="#4A4640"/>
      <rect x="300" y="-11" width="60" height="22" rx="11" fill="#6B5B4B"/>
      <rect x="-160" y="-52" width="310" height="104" rx="26" fill="#3F3B36"/>
      <rect x="-160" y="-62" width="310" height="104" rx="26" fill="#57524B"/>
      <rect x="-148" y="-52" width="286" height="86" rx="20" fill="#2E2B27"/>
      <rect x="-140" y="-46" width="270" height="74" rx="16" fill="#EFC55F"/>
      <path d="M-140 -20 q 60 -26 130 -6 q 70 20 140 -8 l 0 48 q -70 22 -140 2 q -70 -20 -130 6 Z" fill="#F7D986" opacity="0.9"/>
      ${scatter(-10, -8, 110, 26, 9, 23, (x, y) => dot(x, y, 7, "#C98A2F", 0.5))}
      <path d="M-60 -34 q 24 -12 46 -2" stroke="#FAE9AE" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.9"/>
    </g>
    <g>
      <ellipse cx="176" cy="536" rx="60" ry="42" fill="#D8B87C"/>
      <ellipse cx="176" cy="526" rx="60" ry="42" fill="#E5CB98"/>
      ${scatter(176, 522, 40, 26, 7, 91, (x, y) => dot(x, y, 4, "#C7A470", 0.7))}
      <ellipse cx="270" cy="566" rx="52" ry="36" fill="#D8B87C"/>
      <ellipse cx="270" cy="558" rx="52" ry="36" fill="#E5CB98"/>
    </g>
    ${steam(360, 356, 2)}`),

  // Thon-Wraps, angeschnitten
  "thon-wraps": () =>
    svg(`
    ${plate(400, 502, 224)}
    ${[
      { x: 312, y: 446, r: -14, s: 1 },
      { x: 474, y: 462, r: 11, s: 0.94 },
    ]
      .map(
        w => `
      <g transform="translate(${w.x} ${w.y}) rotate(${w.r}) scale(${w.s})">
        <path d="M-50 -104 q 50 -20 100 0 l 0 200 q -50 20 -100 0 Z" fill="#DFC08A"/>
        <path d="M-50 -104 q 50 -20 100 0 l 0 46 q -50 20 -100 0 Z" fill="#EBD3A6"/>
        <path d="M-46 -40 q 46 18 92 0 M-48 24 q 48 18 96 0 M-50 88 q 50 18 100 0" stroke="#C9A874" stroke-width="5" fill="none" opacity="0.9"/>
        <ellipse cx="0" cy="-104" rx="50" ry="19" fill="#F3E6CB"/>
        <ellipse cx="0" cy="-104" rx="38" ry="14" fill="#E4CFA4"/>
        <path d="M-34 -110 q 34 -14 68 0 q -34 14 -68 0 Z" fill="#D98E63"/>
        <path d="M-30 -100 q 32 14 62 -2" stroke="#6E9273" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M-22 -113 q 22 -9 44 -1" stroke="#8FB08C" stroke-width="6" fill="none" stroke-linecap="round"/>
        ${dot(-14, -108, 7, "#C24F22")}${dot(18, -101, 6, "#C24F22")}
        <ellipse cx="2" cy="-104" rx="14" ry="7" fill="#EFD7B0"/>
      </g>`
      )
      .join("")}
    ${dot(226, 546, 15, "#6E9273", 0.9)}${dot(566, 538, 12, "#C24F22", 0.85)}
    ${dot(252, 566, 9, "#8FB08C", 0.9)}`),

  // Gegrillte Ananas-Scheiben
  "grill-ananas": () =>
    svg(`
    ${grill(400, 470, 420)}
    ${[
      { x: 262, y: 436, s: 1 },
      { x: 404, y: 452, s: 1.08 },
      { x: 546, y: 432, s: 0.96 },
    ]
      .map(
        r => `
      <g transform="translate(${r.x} ${r.y}) scale(${r.s})">
        <ellipse cx="0" cy="10" rx="96" ry="34" fill="#C08A26"/>
        <ellipse cx="0" cy="0" rx="96" ry="34" fill="#EFBE44"/>
        <ellipse cx="0" cy="0" rx="96" ry="34" fill="none" stroke="#D9A02F" stroke-width="8"/>
        <ellipse cx="0" cy="0" rx="26" ry="10" fill="#D9A02F"/>
        <path d="M-70 -12 L-30 16 M-24 -18 L14 14 M22 -18 L60 12" stroke="#8A5518" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
        <ellipse cx="-30" cy="-14" rx="34" ry="9" fill="#F7D97E" opacity="0.6"/>
      </g>`
      )
      .join("")}
    ${steam(400, 350, 2)}`),

  // Gerstensuppe mit Löffel
  gerstensuppe: () =>
    svg(`
    ${bowl(392, 466, 178, "#D7A95E")}
    ${scatter(392, 470, 132, 32, 30, 19, (x, y, i) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="${i % 3 === 0 ? "#F0E0BB" : "#E8D2A0"}" transform="rotate(${(i * 47) % 180} ${x} ${y})"/>`)}
    ${scatter(392, 468, 126, 30, 12, 37, (x, y) => dot(x, y, 8, "#D9772F", 0.95))}
    ${scatter(392, 472, 120, 28, 9, 53, (x, y) => dot(x, y, 7, "#6E9273", 0.9))}
    <ellipse cx="352" cy="454" rx="40" ry="12" fill="#E3BE7A" opacity="0.6"/>
    ${spoon(560, 548, -18)}
    ${steam(392, 400, 3)}`),

  // Fotzelschnitten mit Zimtzucker
  fotzelschnitten: () =>
    svg(`
    ${plate(400, 490, 208)}
    ${[
      { x: 318, y: 442, r: -12 },
      { x: 452, y: 424, r: 9 },
      { x: 396, y: 478, r: -3 },
    ]
      .map(
        s => `
      <g transform="translate(${s.x} ${s.y}) rotate(${s.r})">
        <rect x="-104" y="-56" width="208" height="112" rx="22" fill="#BE7F32"/>
        <rect x="-104" y="-64" width="208" height="112" rx="22" fill="#E0A754"/>
        <rect x="-92" y="-54" width="184" height="42" rx="16" fill="#EFC077" opacity="0.75"/>
        ${scatter(0, -8, 84, 40, 16, 27, (x, y) => dot(x, y, 5, "#B87227", 0.45))}
      </g>`
      )
      .join("")}
    ${scatter(396, 452, 130, 62, 40, 61, (x, y) => dot(x, y, 4, "#FFFFFF", 0.75))}
    <ellipse cx="396" cy="404" rx="70" ry="16" fill="#FFFFFF" opacity="0.3"/>
    ${dot(238, 528, 15, "#C0374B")}${dot(268, 542, 11, "#3C4E86")}`),
};
