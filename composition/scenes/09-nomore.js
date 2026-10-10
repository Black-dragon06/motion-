// 09 · "No more endless ai subscriptions" + 🔥 thought bubble + cursor (382–452).
import { makeScene, el, kf, E, clamp, placeText, makeAxisBlur } from '../lib/core.js';
import { makeCursor } from '../lib/cursor.js';

const L = E.linear;
const REG = '400 70px "Inter Display"';
const BOLD = '700 70px "Inter Display"';
// word: final x (ink left, before camera zoom), ink width, first frame, start offset, settle ratio per frame
const WORDS = [
  { t: 'No', x: 138, w: 80, s: 382, a: 70, r: 0.74, font: REG, color: '#121212' },
  { t: 'more', x: 239, w: 144, s: 383, a: 92, r: 0.73, font: REG, color: '#121212' },
  { t: 'endless', x: 405, w: 246, s: 385, a: 101, r: 0.72, font: BOLD, color: '#2350B4' },
  { t: 'ai', x: 676, w: 44, s: 387, a: 118, r: 0.73, font: REG, color: '#121212' },
  { t: 'subscriptions', x: 741, w: 388, s: 391, a: 111, r: 0.8, font: REG, color: '#121212' },
];
const BASE = 384;
// thought bubble: [right, top, radius] of the main circle in screen space
const BUB = [[404, [1118, 320, 0]], [405, [1169, 242, 44], L], [406, [1221, 176, 70], L], [407, [1243, 151, 82], L],
  [408, [1256, 143, 88], L], [409, [1257, 150, 85], L], [410, [1250, 167, 78], L], [411, [1238, 186, 68], L], [412, [1229, 200, 62], L],
  [413, [1225, 205, 60], L], [414, [1229, 203, 62], L], [415, [1235, 195, 66], L], [416, [1243, 185, 71], L], [417, [1248, 177, 74], L],
  [418, [1250, 173, 76], L], [419, [1248, 173, 75], L], [420, [1245, 176, 73], L], [421, [1241, 180, 71], L], [422, [1239, 183, 70], L],
  [424, [1240, 183, 70], L], [428, [1249, 177, 74], L], [432, [1247, 179, 73], L], [440, [1253, 176, 76], L], [452, [1263, 171, 79], L]];
const TAIL = [[401, 0], [402, 5, L], [403, 12, L], [404, 15, L], [406, 12, L], [409, 10, L]];
// cursor glove centre
const CUR = [[421, [-30, 500]], [422, [52, 526]], [423, [121, 559]], [424, [166, 584]], [426, [238, 606]], [428, [288, 611]],
  [430, [326, 615]], [432, [355, 616]], [434, [381, 615]], [436, [402, 613]], [438, [421, 610]], [440, [439, 603]], [442, [456, 595]],
  [444, [474, 584]], [446, [492, 569]], [448, [512, 548]], [450, [535, 517]], [452, [560, 467]]].map(([f, v]) => [f, v, L]);

export default function create(stage) {
  const sc = makeScene(stage, { start: 382, end: 452 });
  const root = sc.root;
  const bg = el('div', { cls: 'fill', style: { background: '#E5E5E5' } }, root);
  const zoom = el('div', { cls: 'fill', style: { transformOrigin: '1123px 365px' } }, root);
  const words = WORDS.map((w) => ({ ...w, n: el('div', { style: { color: w.color } }, zoom), blur: makeAxisBlur() }));

  const bub = el('div', { style: { position: 'absolute', left: '0', top: '0', background: '#2350B4' } }, root);
  const tail = el('div', { style: { position: 'absolute', borderRadius: '50%', background: '#2350B4' } }, root);
  const fire = el('div', { text: '🔥', style: { position: 'absolute', left: '0', top: '0', width: '100px', height: '100px',
    font: '72px/100px "Noto Color Emoji"', textAlign: 'center', transformOrigin: '50px 50px' } }, root);
  const cursor = makeCursor(root, { size: 66 });

  function prepare() {
    for (const w of words) placeText(w.n, [[w.t, w.font]], { left: 0, right: w.w, baseline: BASE });
  }

  function update(f) {
    bg.style.opacity = f >= 388 ? '1' : '0';
    const z = f >= 395 ? 1 + 0.00145 * (f - 395) : 1;
    zoom.style.transform = `scale(${z})`;
    for (const w of words) {
      const n = f - w.s;
      if (n < 0) { w.n.style.display = 'none'; continue; }
      w.n.style.display = '';
      const x = w.x + w.a * Math.pow(w.r, n);
      const v = w.a * (Math.pow(w.r, n - 1) - Math.pow(w.r, n));
      w.n.style.marginLeft = x.toFixed(2) + 'px';
      w.n.style.opacity = String(clamp(0.3 + n * 0.3));
      const b = Math.max(0, 3.5 - n * 1.2);
      w.n.style.filter = (v > 2 || b > 0.05) ? w.blur.css(b + v * 0.12, b) : 'none';
    }

    // bubble
    if (f >= 402) {
      const [right, top, R] = kf(f, BUB);
      const show = R > 0.5;
      bub.style.display = show ? '' : 'none';
      if (show) {
        const wob = f <= 410 ? 1 : 0;
        Object.assign(bub.style, { left: right - 2 * R + 'px', top: top + 'px', width: 2 * R + 'px', height: 2 * R * (wob ? 0.92 : 1) + 'px',
          borderRadius: wob ? '55% 45% 52% 48% / 48% 55% 45% 52%' : '50%' });
      }
      const tr = kf(f, TAIL);
      Object.assign(tail.style, { display: '', left: 1100 - tr + 'px', top: 329 - tr + 'px', width: 2 * tr + 'px', height: 2 * tr + 'px' });
      const fs = kf(f, [[409, 0], [410, 0.6, L], [411, 1.05, L], [412, 0.95, L], [413, 0.85, L], [418, 1.04, L], [422, 0.96, L], [428, 1]]);
      fire.style.display = fs > 0.01 ? '' : 'none';
      fire.style.transform = `translate(${right - R - 50}px, ${top + R - 50}px) scale(${(fs * R / 56).toFixed(3)})`;
    } else { bub.style.display = 'none'; tail.style.display = 'none'; fire.style.display = 'none'; }

    if (f >= 421) {
      const [x, y] = kf(f, CUR), [px, py] = kf(f - 1, CUR);
      cursor.center(x, y, { vx: (x - px) * 0.3, vy: (y - py) * 0.3 });
    } else cursor.update({ show: false });
  }
  return { ...sc, prepare, update };
}
