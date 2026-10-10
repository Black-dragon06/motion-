// One scene, four core patterns from docs/06-recipes.md, all as pure functions of f:
//  1. word reveal: fade + blur-in + exponential settle with stagger      (frames 0-40)
//  2. button pop (fast settle) + cursor flight + click squash + glow      (frames 28-62)
//  3. camera whip with ease-in and directional motion blur               (frames 70-89)
// In a real project every number below comes from a measurement of the reference.
import { makeScene, el, kf, E, clamp, placeText, makeAxisBlur } from '../../composition/lib/core.js';
import { makeCursor } from '../../composition/lib/cursor.js';

const L = E.linear;
// final ink-left, appear frame, start offset (px). Ink-lefts computed with tools/measure_text.mjs:
// widths 295 / 161 / 208 px + 16 px spaces, line centred on x = 640.
const WORDS = [
  { t: 'Measure,', x: 290, appear: 4, off: 90 },
  { t: 'don’t', x: 607, appear: 10, off: 90 },
  { t: 'guess.', x: 787, appear: 16, off: 90 },
];
const RATIO = 0.85;                                // settle: 15% of the remaining distance per frame
const BTN = { x: 520, y: 400, w: 240, h: 84 };
// cursor fingertip track (would be measured with tools/track_blob.py)
const CUR = [[30, [1180, 760]], [36, [900, 560], E.outCubic], [44, [742, 470], E.outCubic], [54, [736, 466], L]];
const CLICK = [[54, 1], [56, 0.93, L], [58, 0.9, L], [62, 1, E.outBack]];
// camera whip: x offset, accelerating (ease-in) into the end of the clip
const WHIP = [[70, 0], [89, -1400, E.inCubic]];

export default function create(stage) {
  const sc = makeScene(stage, { start: 0, end: 89, bg: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)' });
  const cam = el('div', { cls: 'fill' }, sc.root);
  const camBlur = makeAxisBlur();

  const words = WORDS.map((w) => ({ ...w, n: el('div', { style: { color: '#F8FAFC' } }, cam) }));
  const btn = el('div', { style: { position: 'absolute', left: BTN.x + 'px', top: BTN.y + 'px', width: BTN.w + 'px',
    height: BTN.h + 'px', borderRadius: '22px', background: '#305CA5', overflow: 'hidden', transformOrigin: '50% 50%' } }, cam);
  const glow = el('div', { cls: 'fill' }, btn);
  const label = el('div', { style: { color: '#E2E8F0' } }, btn);
  const cursor = makeCursor(sc.root, { size: 64 });

  function prepare() {                              // text placement needs loaded fonts -> prepare()
    for (const w of words) placeText(w.n, [[w.t, '600 72px "Inter Display"']], { left: 0, right: null, baseline: 300, fit: false });
    placeText(label, [['Render', '600 40px "Inter Display"']], { left: 62, right: 178, baseline: 56 });
  }

  function update(f) {
    // 1. words
    for (const w of words) {
      const n = f - w.appear;
      if (n < 0) { w.n.style.opacity = '0'; continue; }
      const x = w.x + w.off * Math.pow(RATIO, n);
      w.n.style.opacity = String(clamp(0.25 + n / 3));
      w.n.style.marginLeft = x.toFixed(2) + 'px';          // marginLeft: placeText owns `transform`
      const b = Math.max(0, 6 * (1 - n / 6));
      w.n.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
    }
    // 2. button pop: scale 0.86 -> 1 with a fast exponential settle (r = 0.3), then the click table
    const k = f - 28;
    const pop = k < 0 ? 0 : 1 - 0.14 * Math.pow(0.3, k);
    btn.style.opacity = k < 0 ? '0' : String(clamp(0.4 + k * 0.3));
    btn.style.transform = `scale(${(pop * kf(f, CLICK)).toFixed(4)})`;
    const g = E.inOutSine(clamp((f - 44) / 14));          // hover glow ramps in under the fingertip
    const [cx, cy] = kf(f, CUR);
    glow.style.background = g > 0 ? `radial-gradient(circle ${60 + 120 * g}px at ${cx - BTN.x}px ${cy - BTN.y}px, rgba(22,151,244,${g}) 0%, rgba(48,92,165,0) 100%)` : 'none';
    if (f >= 30 && f < 70) {
      const [px, py] = kf(f - 1, CUR);
      cursor.update({ x: cx, y: cy, s: kf(f, [[54, 1], [58, 0.85, L], [62, 1, L]]), vx: (cx - px) * 0.4, vy: (cy - py) * 0.4 });
    } else cursor.update({ show: false });
    // 3. camera whip: displacement into this frame drives the blur
    const x = kf(f, WHIP), v = x - kf(f - 1, WHIP);
    cam.style.transform = `translateX(${x.toFixed(2)}px)`;
    cam.style.filter = Math.abs(v) > 2 ? camBlur.css(Math.abs(v) * 0.3, 0) : 'none';
  }
  return { ...sc, prepare, update };
}
