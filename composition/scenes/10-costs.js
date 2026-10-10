// 10 · "No more unnecessary costs" (453–509): lettering on an arch above a dark
// table of subscription cards; the arch tightens, then whips out to the left.
import { makeScene, el, kf, E, clamp, lerp, makeAxisBlur, inkMetrics, baselineOffset } from '../lib/core.js';
import { makeCursor } from '../lib/cursor.js';
import DATA from '../data/costs.js';

const FONT = '600 100px "Inter Display"';
const progress = (f) => 1 - Math.pow(1 - clamp((f - 453) / 38), 3);
const EXIT = DATA.exit.map(([f, v]) => [f, v, E.linear]);

export default function create(stage) {
  const sc = makeScene(stage, { start: 453, end: 509, bg: '#111' });
  const root = sc.root;
  const plates = [];
  for (let f = 453; f <= 509; f++) plates.push(el('img', { cls: 'plate', attrs: { src: `../assets/plates/costs/${f}.jpg` }, style: { display: 'none' } }, root));

  const group = el('div', { cls: 'fill' }, root);
  const groupBlur = makeAxisBlur();
  const glyphs = DATA.glyphs.map((g) => {
    const red = g.c === 'r';
    const n = el('div', { style: {
      position: 'absolute', left: '0', top: '0', width: '200px', height: '200px', transformOrigin: '100px 100px',
      color: red ? '#EC1218' : '#E9E9E9',
      textShadow: red ? '0 0 1px rgba(255,40,40,.6)' : '-3px 0 0 rgba(255,40,60,.55), 3px 0 0 rgba(40,220,255,.5)',
      filter: g.blur > 0.5 ? `blur(${g.blur}px)` : 'none',
    } }, group);
    const t = el('div', { text: g.t, style: { position: 'absolute', left: '0', top: '0', font: FONT, lineHeight: '1', whiteSpace: 'pre' } }, n);
    return { ...g, n, inner: t };
  });
  // put each glyph's ink centre on the box centre so positions/rotations match the measured centroids
  function prepare() {
    const base = baselineOffset(FONT);
    for (const g of glyphs) {
      const m = inkMetrics([[g.t, FONT]]);
      const cx = (m.inkL + m.inkR) / 2, cy = base - (m.asc - m.desc) / 2;
      g.inner.style.transform = `translate(${(100 - cx).toFixed(2)}px, ${(100 - cy).toFixed(2)}px)`;
    }
  }
  const cursor = makeCursor(root, { size: 72 });

  let last = null;
  function update(f) {
    const p = plates[clamp(f - 453, 0, 56)];
    if (p !== last) { if (last) last.style.display = 'none'; p.style.display = ''; last = p; }
    const t = progress(f);
    const tx = f >= 491 ? kf(f, EXIT) : 0;
    const v = Math.abs(kf(f, EXIT) - kf(f - 1, EXIT));
    group.style.transform = `translateX(${tx}px)`;
    group.style.filter = v > 2 ? groupBlur.css(v * 0.3, 0) : 'none';
    for (const g of glyphs) {
      const x = lerp(g.a[0], g.b[0], t), y = lerp(g.a[1], g.b[1], t);
      const r = lerp(g.a[2], g.b[2], t), s = lerp(g.a[3], g.b[3], t) / 100;
      // glyph centre ≈ x-height centre: nudge lowercase down a touch
      g.n.style.transform = `translate(${x - 100}px, ${y - 100}px) rotate(${r}deg) scale(${s})`;
    }
    const cx = lerp(DATA.cursor.a[0], DATA.cursor.b[0], t) + tx, cy = lerp(DATA.cursor.a[1], DATA.cursor.b[1], t);
    const cr = lerp(DATA.cursor.a[2], DATA.cursor.b[2], clamp((f - 466) / 22));
    cursor.center(cx, cy, { r: cr, vx: v * 0.8, vy: 0 });
  }
  return { ...sc, prepare, update };
}
