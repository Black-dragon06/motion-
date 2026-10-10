// Simplified brand marks drawn as SVG (for the subscription-button montage).
// Every function returns an SVG string sized to (w, h).

const svg = (w, h, vb, body, extra = '') =>
  `<svg width="${w}" height="${h}" viewBox="${vb}" style="display:block;overflow:visible" ${extra}>${body}</svg>`;

export function apple(w, h, color = '#fff') {
  return svg(w, h, '0 0 84 100', `<path fill="${color}" d="M69.6 53.2c-.1-10.6 8.7-15.7 9.1-16-5-7.2-12.7-8.2-15.4-8.3-6.5-.7-12.8 3.9-16.1 3.9-3.4 0-8.4-3.8-13.9-3.7-7.1.1-13.7 4.2-17.4 10.6-7.5 12.9-1.9 32 5.3 42.5 3.6 5.1 7.8 10.8 13.3 10.6 5.4-.2 7.4-3.4 13.9-3.4 6.4 0 8.3 3.4 13.9 3.3 5.8-.1 9.4-5.1 12.9-10.3 4.1-5.9 5.7-11.6 5.8-11.9-.1-.1-11.2-4.3-11.4-17.3zM59.1 22c2.9-3.6 4.9-8.4 4.3-13.4-4.2.2-9.4 2.8-12.4 6.4-2.7 3.1-5.1 8.2-4.5 13 4.7.4 9.6-2.4 12.6-6z"/>`);
}

export function grok(w, h, color = '#1c1c1c') {
  return svg(w, h, '0 0 100 100', `
    <circle cx="52" cy="48" r="29" fill="none" stroke="${color}" stroke-width="10"/>
    <path d="M6 96 L92 6" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
    <path d="M6 96 L30 70" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`);
}

export function claude(w, h, color = '#C75A2E') {
  // irregular 12-ray starburst
  const rays = [[0, 46], [28, 40], [57, 47], [88, 36], [115, 46], [145, 40], [178, 47], [205, 38], [232, 46], [262, 41], [290, 47], [320, 38]];
  const body = rays.map(([a, l]) => {
    const r = (a * Math.PI) / 180;
    const x = 50 + Math.cos(r) * l, y = 50 + Math.sin(r) * l;
    return `<path d="M50 50 L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${color}" stroke-width="7.5" stroke-linecap="round"/>`;
  }).join('');
  return svg(w, h, '0 0 100 100', body + `<circle cx="50" cy="50" r="9" fill="${color}"/>`);
}

export function gemini(w, h) {
  return svg(w, h, '0 0 100 100', `
    <defs><radialGradient id="gm" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#3a5a94"/><stop offset="1" stop-color="#1d3260"/></radialGradient></defs>
    <path fill="url(#gm)" d="M50 2 C52 30 70 48 98 50 C70 52 52 70 50 98 C48 70 30 52 2 50 C30 48 48 30 50 2Z"/>`);
}

export function perplexity(w, h, color = '#36AFB5') {
  return svg(w, h, '0 0 100 120', `<g fill="none" stroke="${color}" stroke-width="6" stroke-linejoin="miter">
    <path d="M50 4 V116"/>
    <path d="M14 18 L50 50 L86 18 V48"/>
    <path d="M14 18 V48"/>
    <path d="M4 48 H96 V84 H4 Z"/>
    <path d="M14 84 V110 L50 78 L86 110 V84"/>
    <path d="M50 50 L14 84 M50 50 L86 84"/></g>`);
}

export function copilot(w, h) {
  return svg(w, h, '0 0 100 100', `
    <defs>
      <linearGradient id="cp1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2AA6F5"/><stop offset=".5" stop-color="#7A5BF0"/><stop offset="1" stop-color="#E64BB5"/></linearGradient>
      <linearGradient id="cp2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#F9C43A"/><stop offset=".5" stop-color="#8BD34C"/><stop offset="1" stop-color="#2FC3B7"/></linearGradient>
    </defs>
    <path fill="url(#cp2)" d="M30 20 h28 c6 0 9 4 7 10 L50 78 c-2 6-6 9-12 9 H14 c-7 0-10-5-7-11 L22 28 c2-5 4-8 8-8z"/>
    <path fill="url(#cp1)" opacity=".92" d="M48 14 h32 c7 0 10 5 7 11 L72 72 c-2 6-6 9-12 9 H36 c-6 0-9-4-7-10 L42 22 c2-5 3-8 6-8z"/>`);
}

export function runway(w, h, color = '#fff') {
  return svg(w, h, '0 0 100 100', `<g fill="none" stroke="${color}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">
    <rect x="9" y="9" width="27" height="82" rx="13.5"/>
    <path d="M36 12 H62 C78 12 89 23 89 37 C89 51 79 60 64 60 H58 L86 88"/></g>`);
}

export function kling(w, h, color = '#fff') {
  return svg(w, h, '0 0 100 100', `<g fill="none" stroke="${color}" stroke-width="4">
    <ellipse cx="50" cy="50" rx="44" ry="26" transform="rotate(-38 50 50)"/>
    <ellipse cx="50" cy="50" rx="40" ry="20" transform="rotate(32 50 50)"/>
    <path d="M22 66 C38 44 62 36 82 30"/></g>`);
}

export function luma(w, h) {
  return svg(w, h, '0 0 100 110', `
    <path d="M36 4 L36 62 L6 80 L6 30 Z" fill="#d9d9e0"/>
    <path d="M36 62 L90 76 L52 104 L6 80 Z" fill="#c4c4cc"/>
    <path d="M36 4 L36 62 L90 76 Z" fill="#a9a9b4" opacity=".55"/>`);
}

export function sora(w, h) {
  return svg(w, h, '0 0 100 100', `
    <path fill="#0B2A6B" d="M50 6c9 0 15 6 18 12 8-1 16 5 17 14 8 4 12 12 9 21 5 7 3 17-5 22 0 9-8 16-17 15-4 7-13 10-21 6-8 5-18 3-23-4-9 1-17-6-17-15-7-5-9-15-4-22-3-9 2-18 10-21 1-9 9-15 17-14 3-8 9-14 16-14z"/>
    <ellipse cx="38" cy="52" rx="9" ry="12" fill="#fff"/><ellipse cx="62" cy="52" rx="9" ry="12" fill="#fff"/>
    <circle cx="40" cy="55" r="4" fill="#0B2A6B"/><circle cx="60" cy="55" r="4" fill="#0B2A6B"/>
    <path d="M40 44 l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z M64 44 l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#0B2A6B" opacity=".7"/>`);
}

export function openai(w, h, color = '#fff', glow = 0) {
  // six interlocking links around a hexagonal core
  const link = 'M38 60 L38 30 A18 18 0 0 1 72 26 L72 34';
  const g = Array.from({ length: 6 }, (_, i) => `<path d="${link}" transform="rotate(${i * 60} 50 50)"/>`).join('');
  return svg(w, h, '0 0 100 100', `
    ${glow ? `<g fill="none" stroke="${color}" stroke-width="8" opacity=".5" style="filter:blur(${glow}px)">${g}</g>` : ''}
    <g fill="none" stroke="${color}" stroke-width="4.8" stroke-linejoin="round">${g}</g>`);
}

export function banana(w, h) {
  return `<div style="width:${w}px;height:${h}px;font:${Math.round(h * 0.86)}px/1 'Noto Color Emoji';display:flex;align-items:center;justify-content:center">🍌</div>`;
}

export function sparkle(w, h, color = '#fff', sw = 6) {
  return svg(w, h, '0 0 100 100', `<path d="M50 6 C52 34 66 48 94 50 C66 52 52 66 50 94 C48 66 34 52 6 50 C34 48 48 34 50 6Z" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/>`);
}

export function check(w, h, color = '#bbb') {
  return svg(w, h, '0 0 100 100', `<path d="M10 52 L38 80 L92 18" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`);
}

// Higgsfield brand mark: squiggle traced from the reference (plaque = 0..100)
const HIGGS_PTS = [[8.8, 32], [21.6, 25.2], [31.4, 20.4], [40.2, 23.3], [37.3, 33], [26.5, 45.6], [21.6, 54.4], [24.5, 61.2],
  [31.4, 60.2], [42.2, 50.5], [51, 41.7], [60.8, 35.9], [68.6, 35.9], [74.5, 42.7], [75.5, 52.4], [70.6, 66], [62.7, 75.7],
  [56.9, 79.6], [53.9, 75.7], [54.9, 68], [62.7, 58.3], [74.5, 53.4], [93.1, 52.4]];
function catmull(pts, k = 0.5) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k * 2, p1[1] + ((p2[1] - p0[1]) / 6) * k * 2];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k * 2, p2[1] - ((p3[1] - p1[1]) / 6) * k * 2];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
export const HIGGS_SQUIGGLE = catmull(HIGGS_PTS);
export function higgsfield(w, h, { bg = '#161616', fg = '#AAD71C', radius = 19, sw = 9.4 } = {}) {
  return svg(w, h, '0 0 100 100', `
    ${bg ? `<rect x="0" y="0" width="100" height="100" rx="${radius}" fill="${bg}"/>` : ''}
    <path d="${HIGGS_SQUIGGLE}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`);
}
