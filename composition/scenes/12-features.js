// 12–16 · Video (560–579) · Voice (580–600) · Image (601–616) · Motion (617–645)
// · Pure Creation (646–690).
// Photo collages are lifted plates (titles painted out); titles and the voice
// player are rebuilt here.
import { makeScene, el, kf, E, clamp, placeText, makeAxisBlur } from '../lib/core.js';
import TITLES from '../data/titles.js';

const L = E.linear;
const PLATE_FRAMES = [];
for (let f = 560; f <= 579; f++) PLATE_FRAMES.push(f);
for (let f = 601; f <= 690; f++) PLATE_FRAMES.push(f);

// voice player squash & stretch (scaleX, scaleY about the pill centre 639.5, 359.5)
const SQ = [[580, [0.82, 0.81]], [581, [0.86, 1.08], L], [582, [0.878, 1.2], L], [583, [0.883, 1.26], L], [584, [0.875, 1.26], L],
  [585, [0.862, 1.22], L], [586, [0.844, 1.14], L], [587, [0.828, 1.07], L], [588, [0.815, 1.0], L], [589, [0.807, 0.94], L],
  [590, [0.799, 0.89], L], [591, [0.804, 0.88], L], [592, [0.85, 0.99], L], [593, [0.92, 0.99], L], [594, [0.96, 0.98], L],
  [595, [0.987, 1], L], [596, [1, 1], L], [597, [1, 1], L], [598, [0.95, 1], L], [599, [0.84, 0.97], L], [600, [0.67, 0.9], L]];
// "Voice" title cap-top
const TY = [[581, 228], [582, 202, L], [583, 187, L], [584, 182, L], [586, 186, L], [588, 180, L], [590, 189, L], [591, 194, L],
  [592, 188, L], [593, 165, L], [594, 151, L], [595, 141, L], [596, 135, L], [597, 134, L], [598, 144, L], [599, 170, L], [600, 212, L]];
const LETTERS = [{ t: 'V', s: 581 }, { t: 'o', s: 582 }, { t: 'i', s: 584 }, { t: 'c', s: 585 }, { t: 'e', s: 586 }];

export default function create(stage) {
  const sc = makeScene(stage, { start: 560, end: 690, bg: '#E1E1E1' });
  const root = sc.root;
  const plates = new Map();
  for (const f of PLATE_FRAMES) plates.set(f, el('img', { cls: 'plate', attrs: { src: `../assets/plates/features/${f}.jpg` }, style: { display: 'none' } }, root));

  // ---- titles over plates (geometry measured per frame) ----
  const tLayer = el('div', { cls: 'fill' }, root);
  const wrap = (color) => {
    const w = el('div', { style: { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0' } }, tLayer);
    w.inner = el('div', { style: { color } }, w);
    return w;
  };
  const titles = { video: wrap('#0E0E0E'), image: wrap('#0E0E0E'), motion: wrap('#F4F4F4'), pure: wrap('#F4F4F4'), creation: wrap('#F4F4F4') };
  const tBlur = makeAxisBlur();

  // ---- voice player ----
  const voice = el('div', { cls: 'fill' }, root);
  const grp = el('div', { style: { position: 'absolute', left: '262px', top: '276px', width: '755px', height: '167px', transformOrigin: '377.5px 83.5px' } }, voice);
  el('div', { cls: 'fill', style: { borderRadius: '16px', background: '#C0C0C0', boxShadow: 'inset 0 0 0 1.5px #D2D2D2, 0 2px 6px rgba(0,0,0,0.06)' } }, grp);
  const play = el('div', { style: { position: 'absolute', left: '58px', top: '24px', width: '116px', height: '116px', borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #4A7BC0 0%, #2C5AA2 45%, #1D4486 100%)',
    boxShadow: 'inset 0 0 0 2px rgba(150,180,230,.35), 0 3px 6px rgba(0,0,0,.15)' } }, grp);
  play.innerHTML = '<svg width="116" height="116" viewBox="0 0 116 116" style="display:block"><path d="M47 37 L80 58 L47 79 Z" fill="#F0F3F8" stroke="#F0F3F8" stroke-width="6" stroke-linejoin="round"/></svg>';
  const adam = el('div', { style: { color: '#202020' } }, grp);
  const brood = el('div', { style: { color: '#6E6E6E' } }, grp);
  const sel = el('div', { style: { position: 'absolute', left: '371px', top: '33px', width: '315px', height: '101px', borderRadius: '26px',
    background: '#2149C3', overflow: 'hidden' } }, grp);
  const selTxt = el('div', { style: { color: '#DDE3F3' } }, sel);
  const vBlur = makeAxisBlur();
  const voiceWord = el('div', { style: { color: '#0E0E0E' } }, voice);
  let letters = [];

  function prepare() {
    placeText(titles.video.inner, [['Video', '700 66px "Inter Display"']], { left: 0, right: 196, baseline: 0 });
    placeText(titles.image.inner, [['Image', '700 100px "Inter Display"']], { left: 0, right: 300, baseline: 0 });
    placeText(titles.motion.inner, [['Motion', '700 100px "Inter Display"']], { left: 0, right: 300, baseline: 0 });
    placeText(titles.pure.inner, [['Pure', 'italic 400 100px "Inter Display"']], { left: 0, right: 300, baseline: 0 });
    placeText(titles.creation.inner, [['Creation', '700 100px "Inter Display"']], { left: 0, right: 300, baseline: 0 });
    placeText(adam, [['Adam', '700 54px "Inter Display"']], { left: 218, right: 343, baseline: 84 });
    placeText(brood, [['Brooding, Dark', '400 26px "Inter Text"']], { left: 216, right: 366, baseline: 112 });
    placeText(selTxt, [['Select voice', '600 58px "Inter Display"']], { left: 27, right: 298, baseline: 69 });
    // "Voice": per-letter ink boxes inside x 544..735
    placeText(voiceWord, LETTERS.map((l) => [l.t, '700 72px "Inter Display"']), { left: 544, right: 735, baseline: 0, uniform: true });
    letters = LETTERS.map((l, i) => ({ ...l, n: voiceWord.children[i] }));
  }

  let last = null;
  function update(f) {
    const pl = plates.get(f) || null;
    if (pl !== last) { if (last) last.style.display = 'none'; if (pl) pl.style.display = ''; last = pl; }

    // titles
    const T = TITLES(f);
    for (const key of Object.keys(titles)) {
      const n = titles[key];
      const box = T[key];
      if (!box) { n.style.display = 'none'; continue; }
      const [x0, x1, base, o = 1, blur = 0, rot = 0] = box;
      n.style.display = '';
      const nat = { video: 196, image: 300, motion: 300, pure: 300, creation: 300 }[key];
      const k = (x1 - x0) / nat;
      n.style.transform = `translate(${x0}px, ${base}px) rotate(${rot}deg) scale(${k})`;
      n.style.opacity = String(o);
      n.style.filter = blur > 0.3 ? `blur(${blur}px)` : 'none';
    }

    // voice player
    const on = f >= 580 && f <= 600;
    voice.style.display = on ? '' : 'none';
    if (on) {
      const [sx, sy] = kf(f, SQ);
      grp.style.transform = `scale(${sx}, ${sy})`;
      sel.style.height = kf(f, [[580, 30], [581, 70, L], [582, 95, L], [583, 101, L]]) + 'px';
      sel.style.top = (83.5 - kf(f, [[580, 30], [581, 70, L], [582, 95, L], [583, 101, L]]) / 2) + 'px';
      const ty = kf(f, TY) + 56; // baseline = cap top + cap height
      for (const l of letters) {
        const n = f - l.s;
        if (n < 0) { l.n.style.opacity = '0'; continue; }
        const drop = -70 * Math.pow(0.35, n) * Math.cos(n * 0.9);
        l.n.style.opacity = String(clamp(0.4 + n * 0.4));
        l.n.style.transform = `translateY(${(ty + drop).toFixed(2)}px)`;
      }
      voice.style.filter = f >= 599 ? vBlur.css((f - 598) * 6, (f - 598) * 2) : f <= 580 ? vBlur.css(4, 1) : 'none';
    }
  }
  return { ...sc, prepare, update };
}
