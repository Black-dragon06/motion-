// 11 · "Pay once, And done (:" (510–559): the cursor paints a swoosh under
// "Pay once,", the blue answer pops in, the camera dives in.
import { makeScene, el, kf, E, clamp, placeText, makeAxisBlur } from '../lib/core.js';
import { makeCursor } from '../lib/cursor.js';

const L = E.linear;
const BASE = 383;
// camera scale about (631, 360) and extra y drop, measured from the "Pay" left edge
const ZOOM = [[530, 1], [531, 1, L], [532, 1.009, L], [533, 1.018, L], [534, 1.032, L], [535, 1.05, L], [536, 1.073, L], [537, 1.1, L],
  [538, 1.136, L], [539, 1.195, L], [540, 1.286, L], [541, 1.441, L], [542, 1.564, L], [543, 1.636, L], [544, 1.682, L], [545, 1.718, L],
  [546, 1.741, L], [547, 1.759, L], [548, 1.777, L], [549, 1.786, L], [550, 1.8, L], [551, 1.818, L], [552, 1.836, L], [553, 1.864, L],
  [554, 1.895, L], [555, 1.941, L], [556, 2.0, L], [557, 2.077, L], [558, 2.186, L]];
const DROP = [[550, 0], [552, 4, L], [553, 7, L], [554, 11.5, L], [555, 17.6, L], [556, 27, L], [557, 40, L], [558, 60, L]];
const SWOOSH_END = [[512, 408], [513, 441, L], [514, 486, L], [515, 488, L], [516, 514, L], [517, 539, L], [518, 555, L], [519, 567, L],
  [520, 575, L], [521, 582, L], [522, 590, L], [524, 599, L], [526, 607, L], [531, 614, L]];
// glove bottom-right corner
const CUR = [[510, [60, 445]], [511, [207, 448]], [512, [330, 448]], [513, [420, 450]], [514, [480, 451]], [515, [531, 452]],
  [516, [561, 453]], [517, [584, 455]], [518, [601, 457]], [519, [617, 459]], [520, [629, 461]], [521, [639, 463]], [522, [647, 465]],
  [523, [654, 467]], [524, [659, 468]], [525, [664, 469]], [526, [668, 471]], [527, [672, 473]], [528, [677, 476]], [529, [682, 478]],
  [530, [688, 482]], [531, [695, 486]], [532, [704, 490]], [533, [716, 495]], [534, [732, 500]], [535, [752, 507]], [536, [780, 514]],
  [537, [822, 522]], [538, [873, 531]], [539, [949, 542]], [540, [1059, 555]], [541, [1242, 572]], [542, [1450, 590]]].map(([f, v]) => [f, v, L]);

export default function create(stage) {
  const sc = makeScene(stage, { start: 510, end: 559, bg: '#E1E1E1' });
  const root = sc.root;
  const cam = el('div', { cls: 'fill', style: { transformOrigin: '631px 360px' } }, root);
  const camBlur = makeAxisBlur();

  const pay = el('div', { style: { color: '#111' } }, cam);
  const once = el('div', { style: { color: '#111' } }, cam);
  const ans = ['And', 'done', '(:'].map(() => el('div', { style: { color: '#2350B4' } }, cam));
  const ANS = [{ l: 631, r: 725, s: 536 }, { l: 739, r: 857, s: 537 }, { l: 867, r: 892, s: 538 }];

  // brush swoosh (thick at the start, tapering into a downward flick)
  const sw = el('div', { style: { position: 'absolute', left: '0', top: '0', width: '1280px', height: '720px' } }, cam);
  sw.innerHTML = `<svg width="1280" height="720" style="position:absolute;left:0;top:0;overflow:visible">
    <path d="M412 389 C455 386 520 386 560 392 C585 396 602 403 614 411 C598 406 578 402 556 400 C515 398 455 400 413 402 C405 402 402 389 412 389 Z" fill="#2350B4"/></svg>`;

  const cursor = makeCursor(root, { size: 70 });

  function prepare() {
    placeText(pay, [['Pay', '500 65px "Inter Display"']], { left: 414, right: 493, baseline: BASE });
    placeText(once, [['once,', '500 65px "Inter Display"']], { left: 505, right: 623, baseline: BASE });
    ['And', 'done', '(:'].forEach((t, i) => placeText(ans[i], [[t, '700 72px "Inter Display"']], { left: ANS[i].l, right: ANS[i].r, baseline: BASE }));
  }

  function update(f) {
    const z = kf(f, ZOOM), dy = kf(f, DROP);
    cam.style.transform = `translateY(${dy}px) scale(${z})`;
    const dz = Math.abs(kf(f, ZOOM) - kf(f - 1, ZOOM));
    cam.style.filter = f >= 556 ? camBlur.css(2 + (f - 555) * 1.5, 1 + (f - 555) * 2.2) : (dz > 0.05 ? camBlur.css(dz * 40, dz * 10) : 'none');
    cam.style.opacity = f >= 559 ? '0' : '1';

    const word = (n, s) => {
      const k = f - s;
      n.style.opacity = String(clamp(k < 0 ? 0 : 0.35 + k * 0.33));
      n.style.marginLeft = (k < 0 ? 0 : 14 * Math.pow(0.55, k)).toFixed(2) + 'px';
      n.style.filter = k >= 0 && k < 3 ? `blur(${(2.5 - k).toFixed(1)}px)` : 'none';
    };
    word(pay, 512); word(once, 514);
    ans.forEach((n, i) => {
      const k = f - ANS[i].s;
      n.style.opacity = String(clamp(k < 0 ? 0 : 0.3 + k * 0.35));
      n.style.marginTop = (k < 0 ? 0 : 16 * Math.pow(0.5, k)).toFixed(2) + 'px';
      n.style.filter = k >= 0 && k < 3 ? `blur(${(2.4 - k * 0.8).toFixed(1)}px)` : 'none';
    });

    const end = kf(f, SWOOSH_END);
    sw.style.clipPath = `inset(0 ${1280 - end}px 0 0)`;
    sw.style.display = f >= 513 ? '' : 'none';

    if (f <= 541) {
      const [x, y] = kf(f, CUR), [px, py] = kf(f - 1, CUR);
      cursor.center(x - 28, y - 27, { vx: (x - px) * 0.55, vy: (y - py) * 0.55 });
    } else cursor.update({ show: false });
  }
  return { ...sc, prepare, update };
}
