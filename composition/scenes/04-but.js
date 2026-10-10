// 04 · "But…" (227–249) → card squeezes into a text caret → 05 · typing
// "But, what if one Button" (249–295).
import { makeScene, el, kf, E, clamp, lerp, makeAxisBlur, placeText, inkMetrics, baselineOffset } from '../lib/core.js';

const L = E.linear;
const BUT_FONT = '500 326px "Inter Display"';
const TYPE_FONT = '500 328px "Inter Display"';
const TYPE_BOLD = '700 328px "Inter Display"';

// "But..." glyph ink boxes at rest (frame 240), baseline 479.
const GLYPHS = [
  { t: 'B', l: 296, r: 464, s: 227, amp: 1 },
  { t: 'u', l: 493, r: 632, s: 228, amp: 1 },
  { t: 't', l: 653, r: 738, s: 229, amp: 1 },
  { t: '.', l: 775, r: 811, s: 232, amp: 0.55 },
  { t: '.', l: 860, r: 896, s: 234, amp: 0.55 },
  { t: '.', l: 945, r: 981, s: 236, amp: 0.55 },
];
// vertical offset of a glyph n frames after it starts (measured on the B)
const RISE = [[-1, 330], [0, 141, L], [1, 30, L], [2, -33, L], [3, -65, L], [4, -74, L], [5, -67, L], [6, -54, L], [7, -39, L],
  [8, -30, L], [9, -19, L], [10, -7, L], [11, -3, L], [12, -1, L], [13, 0, L]];
const DRIFT = [[227, -85], [228, -76, L], [229, -66, L], [230, -56, L], [231, -47, L], [232, -38, L], [233, -30, L], [234, -24, L],
  [235, -18, L], [236, -13, L], [237, -8, L], [238, -4, L], [239, -2, L], [240, 0, L]];
// card rect [l, r, t, b] (the "But…" frame squeezing into the caret)
const CARD = [[238, [0, 1280, 34, 686]], [240, [6, 1273, 36, 684], L], [242, [17, 1262, 38, 682], L], [244, [37, 1241, 41, 679], L],
  [246, [80, 1200, 47, 673], L], [248, [150, 1130, 52, 668], L], [249, [200, 1092, 60, 660], L], [250, [284, 1007, 70, 650], L],
  [251, [372, 914, 88, 632], L], [252, [454, 839, 108, 610], L], [253, [512, 794, 120, 598], L], [254, [564, 779, 131, 588], L],
  [255, [608, 773, 137, 582], L], [256, [646, 774, 142, 577], L], [257, [679, 779, 145, 574], L], [258, [708, 786, 148, 571], L],
  [259, [734, 796, 150, 569], L], [260, [756, 807, 151, 568], L], [261, [777, 819, 152, 567], L], [262, [794, 828, 153, 566], L]];
// caret left edge after it has fully formed
const CARET = [[262, 794], [263, 807], [264, 816], [265, 827], [266, 838], [267, 851], [268, 865], [269, 880], [270, 897], [271, 914],
  [272, 931], [273, 947], [274, 963], [275, 976], [276, 988], [277, 998], [278, 1006], [279, 1013], [280, 1018], [281, 1021],
  [282, 1024], [283, 1025], [284, 1025], [285, 1023], [286, 1021], [287, 1017], [288, 1012], [289, 1005], [290, 997], [291, 986],
  [292, 972], [293, 955], [294, 935], [295, 912]].map(([f, v]) => [f, v, L]);
// content scale / x-shift inside the closing window
const CSCALE = [[240, 1], [244, 0.987, L], [246, 0.98, L], [248, 0.97, L], [249, 0.92, L], [250, 0.84, L], [251, 0.76, L], [252, 0.68, L],
  [254, 0.52, L], [256, 0.38, L], [258, 0.28, L], [262, 0.15, L]];
const CSHIFT = [[240, 0], [244, -16, L], [246, -35, L], [248, -57, L], [249, -20, L], [250, 21, L], [251, 48, L], [252, 74, L],
  [254, 150, L], [256, 250, L], [258, 330, L], [262, 420, L]];
// doc-space ink boxes of the typed glyphs (spaces excluded), measured in the reference
const REF_GLYPHS = { 0: [98, 266], 1: [296, 433], 5: [884, 1023], 6: [1057, 1192], 7: [1216, 1299], 8: [1401, 1431], 9: [1456, 1540],
  13: [2240, 2422], 14: [2449, 2608], 15: [2632, 2732], 16: [2751, 2852], 17: [2874, 3043], 18: [3072, 3231] };
// typing events: [frame, text appended, bold?]
const TYPED = [[250, 'B'], [251, 'u'], [252, 't'], [254, ','], [255, 'w'], [257, 'h'], [259, 'a'], [260, 't'], [263, ' i'], [265, 'f'],
  [269, ' o'], [270, 'n'], [272, 'e'], [275, ' B', 1], [276, 'u', 1], [278, 't', 1], [281, 't', 1], [284, 'o', 1], [290, 'n', 1]];

export default function create(stage) {
  const sc = makeScene(stage, { start: 227, end: 295 });
  const root = sc.root;

  // typing background (revealed behind the card from 244)
  const tbg = el('div', { cls: 'fill', style: { background: '#F8ECCF' } }, root);
  const tplates = [];
  for (let f = 243; f <= 295; f++) tplates.push(el('img', { cls: 'plate', attrs: { src: `../assets/plates/typing/${f}.jpg` }, style: { display: 'none' } }, tbg));

  // typed text + caret
  const typeLayer = el('div', { cls: 'fill' }, root);
  const typeBlur = makeAxisBlur();
  const chars = [];
  for (const [f, t, bold] of TYPED) {
    for (const ch of t) {
      const font = bold ? TYPE_BOLD : TYPE_FONT;
      const n = el('div', { text: ch, style: { position: 'absolute', left: '0', top: '0', font, lineHeight: '1', color: '#080808', whiteSpace: 'pre', transformOrigin: '0 0' } }, typeLayer);
      chars.push({ f, ch, font, n, x: 0 });
    }
  }

  // the "But…" card (photo + white letters), squeezed by CARD
  const card = el('div', { style: { position: 'absolute', left: '0', top: '0', width: '1280px', height: '720px', overflow: 'hidden', background: '#3A3D41' } }, root);
  const inner = el('div', { style: { position: 'absolute', left: '0', top: '0', width: '1280px', height: '720px', transformOrigin: '0 360px' } }, card);
  const plates = [];
  for (let i = 0; i <= 21; i++) {
    plates.push(el('img', { cls: 'plate', attrs: { src: `../assets/plates/landscape/${String(Math.max(0, i - 5)).padStart(3, '0')}.jpg` },
      style: { display: 'none' } }, inner));
  }
  const glyphs = GLYPHS.map((g) => {
    const n = el('div', { style: { color: '#fff' } }, inner);
    return { ...g, n, blur: makeAxisBlur() };
  });
  const cardDark = el('div', { cls: 'fill', style: { background: '#0b0b0b' } }, card);

  let base = 260;
  function prepare() {
    for (const g of glyphs) placeText(g.n, [[g.t, BUT_FONT]], { left: g.l, right: g.r, baseline: 479, maxStretch: 0.18, uniform: g.t === '.' });
    // layout of the typed line in document space (x = ink-left of first char = 0)
    let x = 0;
    const first = inkMetrics([[chars[0].ch, chars[0].font]]);
    x = 96 - first.inkL; // B sits at x=96 when it is typed (frame 250, pan 0)
    for (const c of chars) { c.x = x; x += inkMetrics([[c.ch, c.font]]).advance - 4; }
    // Re-map onto the glyph boxes measured in the reference (SF Pro is ~8% narrower
    // than Inter, with looser spacing): known boxes are used as is, the rest are
    // interpolated between their neighbours.
    const typed = chars.filter((c) => c.ch !== ' ');
    typed.forEach((c) => { const m = inkMetrics([[c.ch, c.font]]); c.inkL = m.inkL; c.inkW = m.inkR - m.inkL; c.myC = c.x + m.inkL + c.inkW / 2; });
    const known = typed.map((c, i) => (REF_GLYPHS[i] ? i : -1)).filter((i) => i >= 0);
    typed.forEach((c, i) => {
      let L0, R0;
      if (REF_GLYPHS[i]) [L0, R0] = REF_GLYPHS[i];
      else {
        const a = known.filter((k) => k < i).pop(), b = known.find((k) => k > i);
        const ca = (REF_GLYPHS[a][0] + REF_GLYPHS[a][1]) / 2, cb = (REF_GLYPHS[b][0] + REF_GLYPHS[b][1]) / 2;
        const t = (c.myC - typed[a].myC) / (typed[b].myC - typed[a].myC);
        const cc = ca + (cb - ca) * t, w = c.inkW * 0.92;
        L0 = cc - w / 2; R0 = cc + w / 2;
      }
      c.k = (R0 - L0) / c.inkW;
      c.x = L0 - c.inkL * c.k;
    });
    base = baselineOffset(TYPE_FONT);
  }

  // horizontal scroll of the typed line, measured frame-by-frame from the reference
  const PAN = [[250, 0], [251, 29], [252, 44], [253, 70], [254, 159], [255, 248], [256, 337], [257, 419], [258, 480], [259, 540], [260, 598], [261, 656], [262, 714], [263, 765], [264, 795], [265, 825], [266, 855], [267, 902], [268, 996], [269, 1090], [270, 1184], [271, 1278], [272, 1371], [273, 1460], [274, 1543], [275, 1619], [276, 1688], [277, 1751], [278, 1808], [279, 1860], [280, 1907], [281, 1950], [282, 1990], [283, 2027], [284, 2061], [285, 2092], [286, 2121], [287, 2148], [288, 2174], [289, 2199], [290, 2224], [291, 2249], [292, 2274], [293, 2301], [294, 2329], [295, 2358]].map(([f, v]) => [f, v, L]);
  const pan = (f) => kf(f, PAN);

  let lastPlate = null;
  function update(f) {
    // --- "But…" ---
    const pl = plates[clamp(f - 227, 0, 21)];
    if (pl !== lastPlate) { if (lastPlate) lastPlate.style.display = 'none'; pl.style.display = ''; lastPlate = pl; }
    const g = kf(f, [[236, 0], [244, 1, E.inOutSine]]);
    pl.style.filter = `saturate(${lerp(1, 0.22, g)}) brightness(${lerp(1, 0.86, g)}) contrast(${lerp(1, 0.92, g)})`;
    const dx = kf(f, DRIFT);
    for (const gl of glyphs) {
      const n = f - gl.s;
      if (n < 0) { gl.n.style.opacity = '0'; continue; }
      const y = kf(n, RISE) * gl.amp, vy = (kf(n, RISE) - kf(n - 1, RISE)) * gl.amp;
      gl.n.style.opacity = String(clamp(0.45 + n * 0.4));
      gl.n.parentNode === inner && (gl.n.style.marginLeft = dx + 'px');
      gl.n.style.marginTop = y.toFixed(2) + 'px';
      gl.n.style.filter = Math.abs(vy) > 2 ? gl.blur.css(0.5, Math.abs(vy) * 0.18) : 'none';
    }

    // --- card squeeze: a crop window that closes in on the content ---
    const [l, r, t, b] = f < 238 ? [0, 1280, 34, 686] : f >= 262 ? [kf(f, CARET), kf(f, CARET) + 34, 153, 566] : kf(f, CARD);
    Object.assign(card.style, { left: l + 'px', top: t + 'px', width: (r - l) + 'px', height: (b - t) + 'px' });
    const sc = kf(f, CSCALE), ax = kf(f, CSHIFT);
    inner.style.left = -l + 'px';
    inner.style.top = -t + 'px';
    inner.style.transform = `translateX(${ax}px) scale(${sc})`;
    const cb = kf(f, [[244, 0], [247, 3], [250, 7], [254, 9]]);
    inner.style.filter = cb > 0.05 ? `blur(${cb}px) contrast(${1 - cb * 0.045}) brightness(${1 + cb * 0.015})` : 'none';
    card.style.borderRadius = (f < 238 ? 0 : kf(f, [[238, 0], [244, 14], [250, 10], [262, 3]])) + 'px';
    cardDark.style.opacity = String(kf(f, [[250, 0], [251, 0.25, L], [252, 0.45, L], [254, 0.78, L], [256, 0.92, L], [258, 1, L]]));

    tbg.style.display = f >= 243 ? '' : 'none';
    tplates.forEach((im, i) => { im.style.display = i === clamp(f - 243, 0, 52) ? '' : 'none'; });

    // --- typing ---
    typeLayer.style.display = f >= 250 ? '' : 'none';
    if (f >= 250) {
      const p = pan(f), v = pan(f) - pan(f - 1);
      for (const c of chars) {
        const on = f >= c.f;
        c.n.style.display = on ? '' : 'none';
        if (on) c.n.style.transform = `translate(${(c.x - p).toFixed(2)}px, ${479 - base}px) scaleX(${(c.k || 1).toFixed(4)})`;
      }
      typeLayer.style.filter = Math.abs(v) > 3 ? typeBlur.css(Math.abs(v) * 0.12, 0) : 'none';
    }
  }

  return { ...sc, prepare, update };
}
