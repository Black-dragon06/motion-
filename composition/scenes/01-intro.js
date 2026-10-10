// 01 · Intro (frames 0–55): flight over the hills, "We've all pressed this [Button]".
import { makeScene, el, set, kf, E, clamp, makeAxisBlur, baselineOffset } from '../lib/core.js';
import { makeCursor } from '../lib/cursor.js';

const START = 0, END = 55;

// Word layout measured from the reference (Inter Display Medium 44px, baseline y=388).
// x = final + offset * 0.9^(f - appear): long exponential settle.
const WORDS = [
  { t: 'We’ve', x: 282, appear: 9, off: 83 },
  { t: 'all', x: 415, appear: 18, off: 89 },
  { t: 'pressed', x: 472, appear: 27, off: 75 },
  { t: 'this', x: 642, appear: 35, off: 81 },
];
const BASELINE = 388;
// Camera push towards the Button (scale around x=750, y=378), accelerating into the whip.
const CAM = [[47, 1], [48, 1.004, E.linear], [49, 1.009, E.linear], [50, 1.015, E.linear], [51, 1.027, E.linear],
  [52, 1.043, E.linear], [53, 1.069, E.linear], [54, 1.114, E.linear], [55, 1.163, E.linear]];
// Cursor centre track (measured every frame).
const CUR = [[20, [180, 760]], [21, [186, 712]], [22, [190, 685]], [23, [193, 670]], [24, [198, 649]], [25, [202, 623]],
  [26, [209, 594]], [27, [217, 567]], [28, [226, 538]], [29, [234, 514]], [30, [244, 495]], [31, [251, 480]],
  [32, [260, 468]], [33, [269, 459]], [34, [277, 452]], [35, [286, 447]], [36, [295, 444]], [37, [303, 442]],
  [38, [312, 442]], [39, [321, 443]], [40, [330, 445]], [41, [341, 448]], [42, [352, 452]], [43, [364, 457]],
  [44, [377, 466]], [45, [392, 471]], [46, [411, 475]], [47, [430, 479]], [48, [451, 481]], [49, [475, 483]],
  [50, [502, 483]], [51, [529, 481]], [52, [555, 478]], [53, [580, 473]], [54, [602, 470]], [55, [617, 460]]]
  .map(([f, v]) => [f, v, E.linear]);
// White window frame inset (left, top) measured per frame.
const RING = [[19, [0, 0]], [20, [2, 3], E.linear], [21, [5, 4], E.linear], [22, [8, 6], E.linear], [23, [10, 7], E.linear],
  [24, [11, 8], E.linear], [25, [12, 8], E.linear], [26, [13, 9], E.linear], [27, [14, 9], E.linear], [28, [15, 10], E.linear]];

const FOOTER = '© All Rights Reserved By MosyCreate.';

export default function create(stage) {
  const sc = makeScene(stage, { start: START, end: END });
  const root = sc.root;

  // background footage (cleaned plate sequence)
  const plates = [];
  for (let i = 0; i <= 55; i++) {
    plates.push(el('img', { cls: 'plate', attrs: { src: `../assets/plates/landscape/${String(i).padStart(3, '0')}.jpg` },
      style: { display: 'none' } }, root));
  }

  // headline group (camera transform applies here)
  const cam = el('div', { cls: 'abs', style: { width: '1280px', height: '720px', transformOrigin: '750px 378px' } }, root);
  const textStyle = {
    position: 'absolute', top: '0', left: '0', whiteSpace: 'nowrap', color: '#fff',
    font: '500 44px/1 "Inter Display"', letterSpacing: '0px',
    textShadow: '0 1px 6px rgba(0,0,0,0.22)',
  };
  const words = WORDS.map((w) => {
    const blur = makeAxisBlur();
    const n = el('div', { text: w.t, style: { ...textStyle } }, cam);
    return { ...w, n, blur };
  });
  let ASC = 38;

  const pill = el('div', {
    style: {
      position: 'absolute', left: '729px', top: '359px', width: '137px', height: '39px', borderRadius: '5px',
      background: '#2F5BA8', color: '#DCE6F6', font: '600 26px/39px "Inter Display"', textAlign: 'center',
      letterSpacing: '-0.2px',
    },
    text: 'Button',
  }, cam);

  // footer typed in
  const footer = el('div', {
    style: {
      position: 'absolute', left: '0', width: '1280px', top: '683px', textAlign: 'center', color: '#fff',
      font: '500 15px/1 "Inter Text"', whiteSpace: 'pre',
    },
  }, root);
  const chars = [...FOOTER].map((c) => el('span', { text: c }, footer));

  // window frame
  const ring = el('div', {
    style: { position: 'absolute', border: '1.6px solid rgba(255,255,255,0.92)', borderRadius: '40px',
      boxShadow: '0 0 1px rgba(255,255,255,0.4)' },
  }, root);

  const cursor = makeCursor(root, { size: 50 });

  let lastPlate = null;
  function prepare() { ASC = baselineOffset('500 44px "Inter Display"'); }
  function update(f) {
    const p = plates[clamp(f, 0, 55)];
    if (p !== lastPlate) { if (lastPlate) lastPlate.style.display = 'none'; p.style.display = ''; lastPlate = p; }

    const s = kf(f, CAM);
    cam.style.transform = `scale(${s})`;

    for (const w of words) {
      const n = f - w.appear;
      if (n < 0) { w.n.style.opacity = '0'; continue; }
      const x = w.x + w.off * Math.pow(0.9, n);
      const xPrev = w.x + w.off * Math.pow(0.9, n - 1);
      const o = clamp(0.25 + n / 3.2);
      const b = Math.max(0, 6 * (1 - n / 6));
      // camera-induced horizontal speed (for motion blur during the push)
      const sPrev = kf(f - 1, CAM);
      const vx = (750 + (x - 750) * s) - (750 + (xPrev - 750) * sPrev);
      const mbx = f >= 50 ? Math.abs(vx) * 0.12 : 0;
      w.n.style.opacity = String(o);
      w.n.style.transform = `translate(${x.toFixed(2)}px, ${(BASELINE - ASC).toFixed(2)}px)`;
      w.n.style.filter = mbx > 0.3 ? w.blur.css(Math.max(mbx, b), b) : (b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none');
    }

    pill.style.opacity = String(kf(f, [[49, 0], [50, 0.1, E.linear], [51, 0.25, E.linear], [52, 0.45, E.linear],
      [53, 0.65, E.linear], [54, 0.85, E.linear], [55, 1, E.linear]]));

    // footer: characters appear left to right between frames 6 and 20
    chars.forEach((c, i) => {
      const t0 = 5 + (i / chars.length) * 12;
      c.style.opacity = String(clamp((f - t0) / 2.5));
    });

    if (f >= 19) {
      const [l, t] = kf(f, RING);
      set(ring, { show: true, left: `${l}px`, top: `${t}px`, width: `${1280 - 2 * l}px`, height: `${720 - 2 * t}px` });
    } else ring.style.display = 'none';

    if (f >= 20) {
      const [x, y] = kf(f, CUR);
      const [px, py] = kf(f - 1, CUR);
      cursor.center(x, y, { vx: (x - px) * 0.25, vy: (y - py) * 0.25 });
    } else cursor.update({ show: false });
  }

  return { ...sc, prepare, update };
}
