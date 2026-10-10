// macOS-style "pointing hand" cursor, traced from the reference close-up
// (frame 81). Drawn tilted like in the reference; `r` rotates it around the
// fingertip hotspot. Includes the hard offset shadow and directional blur.
import { el, makeMotionBlur } from './core.js';

// 680x680 design space. Hotspot = fingertip.
const HOT = { x: 142, y: 36 };
const VB = 680;
export const HAND_PATH =
  'M118 78C104 42 160 12 195 42L302 200C312 140 372 112 392 178C405 110 478 92 497 160' +
  'C513 100 585 96 602 142C628 222 652 362 646 448C642 478 622 494 598 494L548 500L392 556' +
  'C368 560 352 552 340 540C292 498 186 434 120 392C84 368 78 322 102 296C126 272 196 286 258 318Z';
const LINES = 'M378 300L420 438M444 282L490 420M512 262L560 400';
// closed fist used while "grabbing" (dark costs scene)
const GRAB_PATH =
  'M196 236C190 186 236 160 270 180C282 140 330 126 360 156C380 118 432 112 458 150C484 120 540 128 552 178' +
  'C590 190 616 228 606 280C596 362 600 430 574 474L548 500L392 556C368 560 352 552 340 540' +
  'C292 498 220 430 196 380C176 340 172 300 196 236Z';
const GRAB_LINES = 'M330 290L372 420M410 270L452 400M490 250L532 380';

export function makeCursor(parent, { size = 60, shadow = true, z = 50 } = {}) {
  const wrap = el('div', { cls: 'cursor', style: { position: 'absolute', left: '0', top: '0', zIndex: String(z) } }, parent);
  const mb = makeMotionBlur(wrap);
  const box = el('div', { style: { position: 'absolute', width: size + 'px', height: size + 'px' } }, mb.inner);
  const k = size / VB;
  const svg = (path, lines) => `
    <svg viewBox="0 0 ${VB} ${VB}" width="${size}" height="${size}" style="overflow:visible;display:block">
      ${shadow ? `<path d="${path}" transform="translate(16 24)" fill="#000" opacity="0.62"
        style="filter:blur(${Math.max(0.4, 5 * k).toFixed(2)}px)"/>` : ''}
      <path d="${path}" fill="#fff" stroke="#000" stroke-width="24" stroke-linejoin="round"/>
      <path d="${lines}" stroke="#000" stroke-width="21" stroke-linecap="round" fill="none"/>
    </svg>`;
  box.innerHTML = svg(HAND_PATH, LINES);
  const hot = { x: HOT.x * k, y: HOT.y * k };
  let mode = 'point';
  return {
    el: wrap,
    size,
    // x, y = fingertip position; vx, vy = smear length (px) for motion blur
    update({ x, y, o = 1, s = 1, r = 0, vx = 0, vy = 0, show = true, grab = false, blur = 0, filter = '' }) {
      if (!show || o <= 0.001) { wrap.style.display = 'none'; return; }
      wrap.style.display = '';
      if (grab !== (mode === 'grab')) {
        mode = grab ? 'grab' : 'point';
        box.innerHTML = grab ? svg(GRAB_PATH, GRAB_LINES) : svg(HAND_PATH, LINES);
      }
      wrap.style.opacity = String(o);
      box.style.filter = filter;
      box.style.transformOrigin = `${hot.x}px ${hot.y}px`;
      box.style.transform = `translate(${(x - hot.x).toFixed(2)}px, ${(y - hot.y).toFixed(2)}px) rotate(${r}deg) scale(${s})`;
      mb.update(vx, vy, blur);
    },
    // place by glove centre instead of fingertip
    center(cx, cy, opts = {}) {
      const r = ((opts.r || 0) * Math.PI) / 180, s = opts.s || 1;
      const dx = 228 * k * s, dy = 264 * k * s;
      const ox = dx * Math.cos(r) - dy * Math.sin(r), oy = dx * Math.sin(r) + dy * Math.cos(r);
      this.update({ ...opts, x: cx - ox, y: cy - oy });
    },
  };
}
