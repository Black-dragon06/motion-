// 17 · "All in one place." with the Higgsfield mark growing out of a line (690–756)
// 18 · night-mode lockup "Higgsfield / All in one place." and fade out (756–869).
import { makeScene, el, kf, E, clamp, lerp, placeText } from '../lib/core.js';
import { HIGGS_SQUIGGLE } from '../lib/icons.js';

const L = E.linear;
// mark rect [left, right, top, bottom]
const MARK = [[692, [638, 639.5, 173, 328]], [698, [635, 641, 173, 327], L], [700, [633, 643, 171, 327], L], [702, [631, 645, 171, 327], L],
  [704, [628, 649, 170, 327], L], [706, [623, 653, 169, 327], L], [708, [618, 658, 168, 327], L], [710, [611, 665, 167, 327], L],
  [712, [602, 674, 166, 327], L], [714, [594, 684, 166, 327], L], [716, [583, 693, 165, 327], L], [718, [576, 700, 164, 326], L],
  [720, [570, 706, 163, 326], L], [722, [566, 710, 163, 326], L], [726, [560, 716, 161, 326], L], [730, [556, 720, 159, 326], L],
  [740, [553, 723, 156, 325], L], [750, [550, 723, 152, 324], L], [754, [541, 710, 153, 323], L], [756, [533, 698, 155, 322], L],
  [758, [520, 677, 160, 320], L], [760, [495, 645, 170, 318], L], [762, [456, 579, 196, 323], L], [764, [409, 515, 234, 341], L],
  [766, [390, 483, 265, 358], L], [768, [383, 469, 285, 371], L], [770, [380, 461, 298, 380], L], [774, [376, 454, 311, 389], L],
  [780, [374, 451, 314, 392], L], [858, [374 - 30, 451 + 0, 314 - 6, 392 + 6], L]];
// tagline words [left, right] per frame (light phase), baseline 370
const WORDS = [
  { t: 'All', s: 692, k: [[692, [672, 687]], [694, [666, 687]], [696, [645, 672]], [698, [632, 662]], [700, [622, 654]], [702, [614, 647]], [704, [601, 634]],
    [706, [594, 628]], [708, [588, 623]], [710, [584, 619]], [712, [580, 616]], [714, [570, 607]], [716, [562, 599]], [718, [557, 594]], [720, [553, 591]],
    [722, [550, 588]], [724, [547, 586]], [726, [529, 568]], [728, [521, 560]], [730, [516, 556]], [732, [513, 553]], [734, [510, 550]], [736, [508, 548]],
    [738, [506, 546]], [740, [505, 545]], [744, [502, 543]], [748, [500, 541]], [752, [499, 540]], [756, [500, 540]]] },
  { t: 'in', s: 704, k: [[704, [712, 728]], [706, [692, 708]], [708, [675, 695]], [710, [663, 684]], [712, [655, 676]], [714, [642, 663]], [716, [630, 653]],
    [718, [623, 646]], [720, [617, 641]], [722, [613, 637]], [724, [609, 633]], [726, [589, 614]], [728, [580, 605]], [730, [575, 600]], [732, [570, 596]],
    [734, [567, 592]], [736, [564, 590]], [738, [562, 587]], [740, [560, 586]], [744, [557, 583]], [748, [555, 581]], [752, [554, 580]], [756, [554, 580]]] },
  { t: 'one', s: 715, k: [[715, [775, 830]], [716, [755, 810]], [718, [707, 756]], [720, [690, 743]], [722, [679, 733]], [724, [670, 726]], [726, [646, 704]],
    [728, [635, 693]], [730, [627, 686]], [732, [621, 681]], [734, [615, 676]], [736, [611, 672]], [738, [608, 669]], [740, [605, 667]], [744, [600, 663]],
    [748, [596, 660]], [752, [594, 658]], [756, [594, 657]]] },
  { t: 'place', s: 726, k: [[726, [840, 935]], [728, [800, 895]], [730, [762, 853]], [732, [735, 823]], [734, [717, 803]], [736, [709, 797]],
    [738, [702, 792]], [740, [696, 789]], [744, [688, 784]], [748, [682, 780]], [752, [677, 777]], [756, [674, 774]]] },
];
// tagline group transform for the move into the lockup (from light-phase layout to final)
// light layout spans 499..786 @ baseline 370; final spans 532.5..747.5 @ baseline 446.5
const TAG = [[756, [0, 0, 1]], [758, [2, 4, 0.985], L], [760, [10, 14, 0.94], L], [762, [22, 38, 0.86], L], [764, [28, 56, 0.8], L],
  [766, [32, 68, 0.765], L], [768, [33, 73, 0.752], L], [770, [33.5, 75, 0.748], L], [780, [34, 76.5, 0.746], L]];

export default function create(stage) {
  const sc = makeScene(stage, { start: 690, end: 869 });
  const root = sc.root;
  const bg = el('div', { cls: 'fill', style: { background: '#E1E1E1' } }, root);
  // tail of the collage dissolve from the previous shot
  const ghost = el('img', { cls: 'plate', attrs: { src: '../assets/plates/features/690.jpg' } }, root);
  const zoom = el('div', { cls: 'fill', style: { transformOrigin: '623px 383px' } }, root);

  // mark: plaque + squiggle (clipped to the plaque while it grows)
  const mark = el('div', { style: { position: 'absolute', overflow: 'hidden' } }, zoom);
  const ns = 'http://www.w3.org/2000/svg';
  mark.innerHTML = `<svg viewBox="0 0 100 100" width="170" height="170" style="position:absolute;display:block">
    <path d="${HIGGS_SQUIGGLE}" fill="none" stroke-width="9.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const msvg = mark.firstElementChild;
  const mpath = msvg.querySelector('path');

  // wordmark + tagline
  const word = el('div', { style: { position: 'absolute', left: '0', top: '0', color: '#fff' } }, zoom);
  const tag = el('div', { cls: 'fill', style: { transformOrigin: '0 0' } }, zoom);
  const words = WORDS.map((w) => {
    const wrap = el('div', { style: { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0' } }, tag);
    const inner = el('div', {}, wrap);
    return { ...w, wrap, inner };
  });
  const dot = el('div', { style: { position: 'absolute', left: '0', top: '0' } }, tag);

  let nat = {};
  function prepare() {
    placeText(word, [['Higgsfield', '700 82px "Inter Display"']], { left: 466.5, right: 873.5, baseline: 382.5 });
    for (const w of words) {
      const font = w.t === 'place' ? '600 38px "Inter Display"' : '400 38px "Inter Display"';
      const m = placeText(w.inner, [[w.t, font]], { left: 0, right: null, baseline: 0, fit: false });
      nat[w.t] = m.inkR - m.inkL;
    }
    placeText(dot, [['.', '600 38px "Inter Display"']], { left: 790, right: null, baseline: 370, fit: false });
  }

  function update(f) {
    // background: light grey → black
    const g = kf(f, [[750, 224], [754, 217, L], [756, 208, L], [758, 194, L], [760, 171, L], [762, 127, L], [764, 72, L], [766, 41, L],
      [768, 23, L], [770, 13, L], [774, 3, L], [780, 0, L]]);
    bg.style.background = `rgb(${g},${g},${g})`;
    const night = clamp((f - 757) / 6); // 0 = light look, 1 = lockup look
    ghost.style.opacity = String(kf(f, [[690, 1], [692, 0.6, L], [694, 0.3, L], [697, 0, L]]));
    ghost.style.display = f <= 697 ? '' : 'none';
    const mix = kf(f, [[752, 0], [756, 0.12, L], [758, 0.22, L], [761, 0.38, L], [763, 0.6, L], [764, 0.75, L], [766, 0.92, L], [768, 1, L]]);
    const mixc = (a, b) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], mix))).join(',')})`;
    zoom.style.transform = `scale(${f > 780 ? 1 + (f - 780) * 0.00085 : 1})`;
    root.style.opacity = String(kf(f, [[822, 1], [828, 0.9], [834, 0.8], [840, 0.67], [846, 0.56], [852, 0.42], [858, 0.3], [864, 0.14], [869, 0]]));

    // mark
    if (f >= 692) {
      const [l, r, t, b] = kf(f, MARK);
      const w = r - l, h = b - t;
      const rad = Math.min(w / 2, kf(f, [[740, 36], [762, 26], [780, 15]]));
      Object.assign(mark.style, { display: '', left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px', borderRadius: rad + 'px',
        background: mixc([22, 22, 22], [214, 255, 37]) });
      const mb = kf(f, [[754, 0], [758, 3], [762, 5], [765, 2], [768, 0]]);
      mark.style.filter = mb > 0.05 ? `blur(${mb}px)` : 'none';
      // squiggle lives in a fixed 170px plaque centred on the final light-phase mark, then follows the mark when it shrinks
      const S = f <= 750 ? 170 : w;
      const cx = f <= 750 ? 638 : (l + r) / 2, cy = f <= 750 ? 240.5 : (t + b) / 2;
      msvg.setAttribute('width', S); msvg.setAttribute('height', S);
      msvg.style.left = (cx - S / 2 - l) + 'px';
      msvg.style.top = (cy - S / 2 - t) + 'px';
      mpath.setAttribute('stroke', mixc([170, 215, 28], [29, 36, 22]));
      const draw = kf(f, [[700, 0], [716, 1, E.linear]]);
      mpath.setAttribute('stroke-dasharray', '400');
      mpath.setAttribute('stroke-dashoffset', String(400 * (1 - draw)));
    } else mark.style.display = 'none';

    // wordmark
    word.style.display = f >= 758 ? '' : 'none';
    word.style.filter = `blur(${kf(f, [[758, 12], [760, 8], [762, 5], [764, 2], [766, 0]])}px)`;
    word.style.opacity = String(kf(f, [[758, 0.2], [761, 0.35], [763, 0.75], [764, 1]]));

    // tagline
    const [tx, ty, ts] = kf(f, TAG);
    tag.style.transform = `translate(${499 + tx}px, ${370 + ty}px) scale(${ts}) translate(-499px, -370px)`;
    const tb = kf(f, [[755, 0], [758, 2], [761, 3], [764, 1.2], [766, 0]]);
    tag.style.filter = tb > 0.05 ? `blur(${tb}px)` : 'none';
    tag.style.opacity = String(kf(f, [[756, 1], [759, 0.75], [762, 0.7], [765, 1]]));
    for (const w of words) {
      const n = f - w.s;
      if (n < 0) { w.wrap.style.display = 'none'; continue; }
      w.wrap.style.display = '';
      const [x0, x1] = kf(f, w.k.map(([ff, v]) => [ff, v, L]));
      const k = (x1 - x0) / nat[w.t];
      w.wrap.style.transform = `translate(${x0}px, 370px) scale(${k})`;
      w.wrap.style.opacity = String(clamp(0.35 + n * 0.3));
      w.wrap.style.filter = n < 3 ? `blur(${(2 - n * 0.7).toFixed(1)}px)` : 'none';
      const lime = night > 0.5 ? '#D6FF25' : '#A3C530';
      w.inner.style.color = w.t === 'place' ? lime : (night > 0.5 ? '#FFFFFF' : '#141414');
    }
    const pw = WORDS[3];
    dot.style.display = f >= 728 ? '' : 'none';
    if (f >= 728) {
      const [, x1] = kf(f, pw.k.map(([ff, v]) => [ff, v, L]));
      dot.style.left = (x1 + 3 - 790) + 'px';
      dot.style.color = night > 0.5 ? '#fff' : '#141414';
    }
  }
  return { ...sc, update, prepare };
}
