import { TOTAL_FRAMES, FPS, el, kf, E } from './lib/core.js';
import intro from './scenes/01-intro.js';
import closeup from './scenes/02-closeup.js';
import montage from './scenes/03-montage.js';
import but from './scenes/04-but.js';
import lifesaver from './scenes/06-lifesaver.js';
import nomore from './scenes/09-nomore.js';
import costs from './scenes/10-costs.js';
import payonce from './scenes/11-payonce.js';
import features from './scenes/12-features.js';
import logo from './scenes/17-logo.js';

const stage = document.getElementById('stage');
const params = new URLSearchParams(location.search);
if (params.has('render')) document.body.classList.add('render');

const factories = [intro, closeup, montage, but, lifesaver, nomore, costs, payonce, features, logo];
const scenes = factories.map((make) => make(stage));

// Global letterbox (height of each bar in px), measured from the reference.
const barTop = el('div', { cls: 'bar', style: { top: '0' } }, stage);
const barBot = el('div', { cls: 'bar', style: { bottom: '0' } }, stage);
const o = E.outCubic, i = E.inCubic, io = E.inOutCubic, l = E.linear;
const BAR = [
  [0, 0], [50, 0], [52, 3, i], [56, 7, i], [60, 18, l], [64, 27, o], [70, 32, o], [76, 34, o],
  [238, 34], [240, 36, i], [244, 41, i], [248, 52, i], [252, 81, l], [256, 118, l], [260, 131, o], [266, 138, o], [270, 139, o],
  [282, 139], [286, 137, i], [290, 131, i], [294, 110, i], [296, 76, l], [298, 52, o], [304, 33, o], [312, 29, o],
  [412, 29], [424, 31, i], [440, 37, i], [452, 47, i],
  [453, 47], [509, 47], [510, 80], [513, 71, o], [525, 50, o], [537, 39, o], [549, 33, o], [561, 30, o], [573, 29, o],
  [766, 29], [776, 0, io],
];
function letterbox(f) {
  const h = kf(f, BAR);
  barTop.style.height = h.toFixed(2) + 'px';
  barBot.style.height = h.toFixed(2) + 'px';
}

let current = -1;
function seek(f) {
  f = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(f)));
  for (const s of scenes) {
    const on = f >= s.start && f <= s.end;
    s.root.style.display = on ? 'block' : 'none';
    if (on) s.update(f);
  }
  letterbox(f);
  current = f;
  return f;
}

async function ready() {
  await document.fonts.ready;
  const fams = ['400 20px "Inter Display"', '500 20px "Inter Display"', '600 20px "Inter Display"', '700 20px "Inter Display"',
    '800 20px "Inter Display"', 'italic 400 20px "Inter Display"', 'italic 500 20px "Inter Display"',
    '400 20px "Inter Text"', '500 20px "Inter Text"', '600 20px "Inter Text"', '700 20px "Inter Text"'];
  await Promise.all(fams.map((f) => document.fonts.load(f)));
  const imgs = [...document.querySelectorAll('img')];
  await Promise.all(imgs.map((im) => (im.complete && im.naturalWidth ? im.decode().catch(() => {}) :
    new Promise((res) => { im.onload = () => im.decode().then(res, res); im.onerror = res; }))));
  for (const s of scenes) if (s.prepare) s.prepare();
  seek(0);
}

window.__ready = ready();
window.__seek = seek;
window.__total = TOTAL_FRAMES;

// ------------------------------------------------------------ preview UI ---
if (!params.has('render')) {
  const scrub = document.getElementById('scrub');
  const fr = document.getElementById('fr');
  const audio = document.getElementById('audio');
  const play = document.getElementById('play');
  const fit = () => {
    const k = Math.min(innerWidth / 1280, (innerHeight - 40) / 720);
    stage.style.transform = `scale(${k})`;
    document.getElementById('ui').style.top = 720 * k + 4 + 'px';
    document.getElementById('ui').style.width = 1280 * k + 'px';
  };
  addEventListener('resize', fit); fit();
  const show = (f) => { seek(f); scrub.value = current; fr.textContent = `${current}  ${(current / FPS).toFixed(2)}s`; };
  window.__ready.then(() => show(+(params.get('f') || 0)));
  scrub.addEventListener('input', () => { audio.pause(); show(+scrub.value); });
  let raf = 0;
  const tick = () => { show(audio.currentTime * FPS); if (!audio.paused) raf = requestAnimationFrame(tick); };
  play.onclick = () => {
    if (audio.paused) { audio.currentTime = current / FPS; audio.play(); raf = requestAnimationFrame(tick); }
    else { audio.pause(); cancelAnimationFrame(raf); }
  };
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === ' ') play.onclick();
  });
}
