// 02 · Close-up (frames 56–98): whip into "…this [Button] before", hover glow, click.
import { makeScene, el, kf, E, clamp, makeAxisBlur, baselineOffset } from '../lib/core.js';
import { makeCursor } from '../lib/cursor.js';

const START = 56, END = 98;
const L = E.linear;
// Camera over the final layout: translate x + scale around (642, 362). Measured per frame.
const CAM_TX = [[55, 270], [56, 254, L], [57, 218, L], [58, 144, L], [59, 87, L], [60, 60, L], [61, 42, L], [62, 29, L],
  [63, 19, L], [64, 13, L], [65, 8, L], [66, 5, L], [67, 3, L], [68, 2, L], [70, 1, L], [72, 0, L]];
const CAM_S = [[55, 0.7], [56, 0.78, L], [57, 0.83, L], [58, 0.906, L], [59, 0.917, L], [60, 0.935, L], [61, 0.949, L],
  [62, 0.957, L], [63, 0.966, L], [64, 0.971, L], [65, 0.978, L], [66, 0.981, L], [67, 0.985, L], [68, 0.988, L],
  [70, 0.991, L], [72, 0.993, L], [76, 1, L]];
// Cursor glove bottom-right corner (white area), measured.
const CUR = [[61, [470, 790]], [62, [505, 762]], [63, [540, 745]], [64, [572, 728]], [65, [604, 712]], [66, [634, 697]],
  [67, [663, 682]], [68, [690, 668]], [69, [715, 655]], [70, [738, 644]], [71, [759, 633]], [72, [778, 623]],
  [73, [795, 613]], [74, [811, 604]], [75, [825, 595]], [76, [838, 587]], [77, [850, 580]], [78, [861, 574]],
  [79, [870, 568]], [80, [878, 562]], [81, [886, 557]], [82, [892, 553]], [83, [898, 549]], [84, [903, 545]],
  [85, [907, 542]], [86, [911, 540]], [87, [913, 538]], [88, [916, 536]], [89, [917, 535]], [90, [918, 534]],
  [91, [919, 534]], [92, [918, 531]], [93, [911, 523]], [94, [903, 513]], [95, [895, 503]], [96, [888, 494]],
  [97, [888, 491]], [98, [870, 491]]].map(([f, v]) => [f, v, L]);
const CUR_S = [[92, 1], [93, 0.95, L], [94, 0.9, L], [95, 0.86, L], [96, 0.82, L], [97, 0.8, L]];
const PILL_S = [[94, 1], [95, 0.995, L], [96, 0.942, L], [97, 0.915, L], [98, 0.986, E.outCubic]];

export default function create(stage) {
  const sc = makeScene(stage, { start: START, end: END });
  const root = sc.root;

  // background: hill flight plates lifted from the reference (text band / cursor painted out)
  const bgs = [];
  for (let i = START; i <= END; i++) {
    bgs.push(el('img', { cls: 'plate', attrs: { src: `../assets/plates/closeup/${i}.jpg` }, style: { display: 'none' } }, root));
  }
  const cam = el('div', { cls: 'abs', style: { width: '1280px', height: '720px', transformOrigin: '642px 362px' } }, root);
  const camBlur = makeAxisBlur();
  const FONT = '500 187px "Inter Display"';
  const word = (t, x) => el('div', { text: t, style: { position: 'absolute', left: x + 'px', top: '0', font: FONT,
    lineHeight: '1', color: '#fff', whiteSpace: 'nowrap', textShadow: '0 2px 14px rgba(0,0,0,0.12)' } }, cam);
  const wPressed = word('pressed', 16 - 40 - 664);
  const wThis = word('this', 16);
  const wBefore = word('before', 953);

  // the Button
  const pill = el('div', { style: { position: 'absolute', left: '349px', top: '256px', width: '587px', height: '213px',
    transformOrigin: '642px 362px' } }, cam);
  pill.style.transformOrigin = '293px 106px';
  el('div', { style: { position: 'absolute', left: '0', top: '7px', width: '587px', height: '206px', borderRadius: '28px',
    background: '#06378D' } }, pill); // dark lip
  const body = el('div', { style: { position: 'absolute', left: '0', top: '0', width: '587px', height: '207px', borderRadius: '28px',
    background: 'linear-gradient(180deg, #3264B0 0%, #305CA5 12%, #305CA5 85%, #3163AA 100%)', overflow: 'hidden',
    boxShadow: 'inset 0 -2px 0 rgba(110,160,230,0.55), inset -2px 0 0 rgba(10,50,130,0.45)' } }, pill);
  const glow = el('div', { cls: 'fill' }, body);
  const label = el('div', { text: 'Button', style: { position: 'absolute', left: '0', width: '587px', top: '0', textAlign: 'center',
    font: '700 133px "Inter Display"', lineHeight: '1', color: '#DCDCDB', letterSpacing: '0px' } }, body);

  const caption = el('div', { cls: 'caption', style: { font: '400 11.5px/1 "Inter Text"', top: '0', color: 'rgba(255,255,255,0.55)' } }, root);
  const capChars = [...'[ Simple Button ]'].map((c) => el('span', { text: c }, caption));

  const cursor = makeCursor(root, { size: 170 });

  let base = 160, baseLbl = 100;
  function prepare() {
    base = baselineOffset(FONT);
    baseLbl = baselineOffset('700 133px "Inter Display"');
    for (const w of [wPressed, wThis, wBefore]) w.style.top = (411 - base) + 'px';
    label.style.top = (409 - 256 - baseLbl) + 'px';
    caption.style.top = (671 - baselineOffset('400 11.5px "Inter Text"')) + 'px';
  }

  let last = null;
  function update(f) {
    const bg = bgs[clamp(f - START, 0, bgs.length - 1)];
    if (bg !== last) { if (last) last.style.display = 'none'; bg.style.display = ''; last = bg; }

    const tx = kf(f, CAM_TX), s = kf(f, CAM_S);
    const v = kf(f, CAM_TX) - kf(f - 1, CAM_TX); // shutter before the frame
    cam.style.transform = `translateX(${tx}px) scale(${s})`;
    const mb = Math.abs(v) * (f <= 57 ? 0.15 : 0.3);
    cam.style.filter = camBlur.css(mb, 0);

    pill.style.transform = `scale(${kf(f, PILL_S)})`;
    // "before" settles on its own, a beat after the camera
    const bOff = (f < 62 ? 52 : 52 * Math.pow(0.89, f - 62)) + kf(f, [[95, 0], [96, 5, L], [97, 14, L], [98, 30, L]]);
    wBefore.style.transform = `translateX(${bOff.toFixed(2)}px)`;

    // hover light following the fingertip
    const [cx, cy] = kf(f, CUR);
    const t = E.inOutSine(clamp((f - 70) / 26));
    const fx = (cx - 123) - 349, fy = (cy - 127) - 256 + 40; // fingertip in pill space
    const R = 140 + 330 * t;
    glow.style.background = t > 0.001
      ? `radial-gradient(circle ${R}px at ${fx}px ${fy}px, rgba(22,151,244,${t}) 0%, rgba(26,145,240,${0.92 * t}) 30%, rgba(40,120,210,${0.45 * t}) 65%, rgba(48,92,165,0) 100%)`
      : 'none';

    capChars.forEach((c, i) => { c.style.opacity = String(clamp((f - (58 + i * 0.35)) / 2)); });

    if (f >= 61) {
      const cs = kf(f, CUR_S);
      const [px, py] = kf(f - 1, CUR);
      // hotspot is ~(123,127) px up-left of the glove's bottom-right corner at size 170
      cursor.update({ x: cx - 123, y: cy - 127, s: cs, vx: (cx - px) * 0.2, vy: (cy - py) * 0.2 });
    } else cursor.update({ show: false });
  }

  return { ...sc, prepare, update };
}
