// NN · <Shot name> (frames START–END)
// Reference: <one line: what happens, with frame numbers>
// Measurements: analysis/measurements/<NN>-*.txt   (every constant below must come from one of them)
import { makeScene, el, kf, E, clamp, placeText, makeAxisBlur, baselineOffset } from '../lib/core.js';
import { makeCursor } from '../lib/cursor.js';

const START = 0, END = 0;            // first and last frame of this scene (0-based, inclusive)
const L = E.linear;                  // per-frame measured keys are always linear

// ---- measured constants -------------------------------------------------------------
// Static layout on the rest frame <N> (tools/segments.py / flood_rect.py / sample_colors.py)
const BG = '#000000';
const TITLE = { text: 'Title', font: '600 64px "Inter Display"', left: 100, right: 400, baseline: 360, color: '#ffffff' };
// Motion per frame (tools/track_blob.py / segments.py ... -> tools/emit_keyframes.py)
const TITLE_X = [[START, 0], [START + 1, 0, L]];               // x offset per frame
const TITLE_O = [[START, 0], [START + 3, 1, L]];               // opacity per frame
// Cursor glove centre per frame (tools/track_blob.py), or delete
const CUR = [[START, [640, 900]], [START + 10, [640, 400], L]];

export default function create(stage) {
  const sc = makeScene(stage, { start: START, end: END, bg: BG });
  const root = sc.root;

  // ---- build the DOM once (back to front = creation order) ----
  // const plates = []; for (let f = START; f <= END; f++) plates.push(el('img', { cls: 'plate', attrs: { src: `../assets/plates/<group>/${f}.jpg` }, style: { display: 'none' } }, root));
  const cam = el('div', { cls: 'fill', style: { transformOrigin: '640px 360px' } }, root);   // camera group
  const camBlur = makeAxisBlur();
  const title = el('div', { style: { color: TITLE.color } }, cam);
  const cursor = makeCursor(root, { size: 56 });

  // ---- after fonts/images are ready: measure & place text ----
  function prepare() {
    placeText(title, [[TITLE.text, TITLE.font]], { left: TITLE.left, right: TITLE.right, baseline: TITLE.baseline });
  }

  // ---- frame f -> styles. Pure: set EVERY animated property on every call. ----
  function update(f) {
    // plates: show plate f, hide the previous one (see docs/06-recipes.md #1)

    const x = kf(f, TITLE_X);
    const v = x - kf(f - 1, TITLE_X);                 // displacement into this frame -> motion blur
    title.style.marginLeft = x.toFixed(2) + 'px';     // placeText owns `transform`; use margin/wrappers for motion
    title.style.opacity = String(kf(f, TITLE_O));
    cam.style.filter = Math.abs(v) > 2 ? camBlur.css(Math.abs(v) * 0.2, 0) : 'none';

    const [cx, cy] = kf(f, CUR), [px, py] = kf(f - 1, CUR);
    cursor.center(cx, cy, { vx: (cx - px) * 0.3, vy: (cy - py) * 0.3 });
  }

  return { ...sc, prepare, update };
}
