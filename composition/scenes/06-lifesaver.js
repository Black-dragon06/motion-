// 06–08 · "Life saver" between the hands of the Creation of Adam (296–340),
// style flashes (341–351), "Higgsfield" (352–381) dissolving into white.
import { makeScene, el, kf, E, clamp, placeText } from '../lib/core.js';
import RECTS from '../data/lifesaver.js';

const L = E.linear;
const W0 = 670, H0 = 212;

// per-frame button look
function look(f) {
  if (f <= 340) return { bg: '#305CA5', text: '#DCDDE0', label: 'life' };
  if (f <= 342) return { bg: '#835639', text: '#E2DCD6', label: 'life', border: 'rgba(60,35,20,.6)' };
  if (f <= 345) return { bg: 'rgba(150,118,70,0.82)', text: '#D2C5B3', label: 'morph' };
  if (f === 346) return { bg: '#2894B0', text: '#E4F2F6', label: 'higgs', border: '#111', bw: 6 };
  if (f <= 348) return { bg: '#3E3E3B', text: '#E0DFDA', label: 'higgs', border: 'rgba(255,255,255,.15)' };
  if (f === 349) return { bg: '#93603A', text: '#ECE2D8', label: 'higgs' };
  if (f <= 351) return { bg: '#5D6C86', text: '#E0E0E4', label: 'higgs' };
  return { bg: '#305CA5', text: '#DCDFE5', label: 'higgs' };
}

export default function create(stage) {
  const sc = makeScene(stage, { start: 296, end: 388 });
  const root = sc.root;
  const plates = [];
  for (let f = 296; f <= 381; f++) {
    plates.push(el('img', { cls: 'plate', attrs: { src: `../assets/plates/creation/${f}.jpg` }, style: { display: 'none' } }, root));
  }
  const white = el('div', { cls: 'fill', style: { background: '#E5E5E5', opacity: '0' } }, root);

  const btn = el('div', { style: { position: 'absolute', left: '0', top: '0', width: W0 + 'px', height: H0 + 'px', transformOrigin: '0 0' } }, root);
  const face = el('div', { cls: 'fill', style: { borderRadius: '26px', overflow: 'hidden' } }, btn);
  const sheen = el('div', { style: { position: 'absolute', top: '-80px', left: '0', width: '160px', height: '380px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(190,215,255,.55) 50%, rgba(255,255,255,0) 100%)', filter: 'blur(10px)' } }, face);
  const life = el('div', {}, btn);
  const higgs = el('div', {}, btn);

  function prepare() {
    placeText(life, [['Life saver', '600 112px "Inter Display"']], { left: 48, right: 620, baseline: 144, uniform: false });
    placeText(higgs, [['Higgsfield', '600 112px "Inter Display"']], { left: 38, right: 632, baseline: 150, uniform: false });
  }

  let last = null;
  function update(f) {
    const pf = clamp(f, 296, 381);
    const p = plates[pf - 296];
    if (p !== last) { if (last) last.style.display = 'none'; p.style.display = ''; last = p; }
    // dissolve to the flat grey of the next scene
    white.style.opacity = String(kf(f, [[381, 0], [382, 0.35, L], [383, 0.55, L], [384, 0.7, L], [385, 0.82, L], [386, 0.9, L], [388, 1, L]]));

    const [l, r, t, b] = RECTS[pf];
    const s = (r - l) / W0;
    const cy = (t + b) / 2;
    btn.style.transform = `translate(${l}px, ${(cy - (H0 * s) / 2).toFixed(2)}px) scale(${s.toFixed(4)})`;
    const k = look(f);
    face.style.background = k.bg;
    face.style.boxShadow = (k.border ? `inset 0 0 0 ${k.bw || 3}px ${k.border}, ` : '') + 'inset 0 2px 0 rgba(255,255,255,.12), inset 0 -3px 0 rgba(0,0,0,.12)';
    life.style.color = k.text; higgs.style.color = k.text;
    const m = k.label === 'morph' ? kf(f, [[342, 0], [345, 1]]) : k.label === 'higgs' ? 1 : 0;
    life.style.opacity = String(1 - m);
    higgs.style.opacity = String(m);
    life.style.filter = k.label === 'morph' ? 'blur(1.5px)' : 'none';
    higgs.style.filter = life.style.filter;
    sheen.style.display = f <= 305 ? '' : 'none';
    sheen.style.transform = `translateX(${(-200 + (f - 296) * 95).toFixed(1)}px) rotate(20deg)`;
    // Higgsfield fades with the photo (measured fill colour lightens 365 → 381)
    const fade = kf(f, [[364, 0], [368, 0.08, L], [372, 0.28, L], [376, 0.6, L], [379, 0.8, L], [382, 0.93, L], [386, 1, L]]);
    btn.style.opacity = String(1 - fade);
    btn.style.display = f > 387 ? 'none' : '';
  }

  return { ...sc, prepare, update };
}
