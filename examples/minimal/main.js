// Minimal composition: the smallest complete setup that follows the engine contract.
//  * every scene: create(stage) -> { root, start, end, prepare?, update(f) }
//  * window.__ready  : resolves when fonts + images are ready and prepare() ran
//  * window.__seek(f): draws frame f (pure function of f)
//  * window.__total  : number of frames
// Render: node scripts/render.mjs --page examples/minimal/index.html --audio none --scale 1 --out out/example_minimal.mp4
import scene from './scene.js';

const TOTAL = 90;
const stage = document.getElementById('stage');
const params = new URLSearchParams(location.search);
if (params.has('render')) document.body.classList.add('render');

const scenes = [scene(stage)];

function seek(f) {
  f = Math.max(0, Math.min(TOTAL - 1, Math.round(f)));
  for (const s of scenes) {
    const on = f >= s.start && f <= s.end;
    s.root.style.display = on ? 'block' : 'none';
    if (on) s.update(f);
  }
  return f;
}

window.__ready = (async () => {
  await document.fonts.ready;
  for (const w of [500, 600, 700]) await document.fonts.load(`${w} 20px "Inter Display"`);
  for (const s of scenes) if (s.prepare) s.prepare();
  seek(0);
})();
window.__seek = seek;
window.__total = TOTAL;

if (!params.has('render')) {   // tiny preview: drag the slider or use arrow keys
  const scrub = document.getElementById('scrub'), fr = document.getElementById('fr');
  const show = (f) => { scrub.value = seek(f); fr.textContent = scrub.value; };
  scrub.oninput = () => show(+scrub.value);
  addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(+scrub.value + 1); if (e.key === 'ArrowLeft') show(+scrub.value - 1); });
  window.__ready.then(() => show(0));
}
