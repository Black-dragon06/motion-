# 05 · The engine: deterministic frame rendering with HTML

## Architecture

```
composition/index.html        <div id="stage"> 1280x720 + preview UI + <audio>
composition/styles.css        @font-face, .scene/.fill/.plate/.caption/.bar
composition/main.js           imports scenes, global letterbox, window.__seek / __ready, preview player
composition/lib/core.js       math, easing, keyframes, DOM helpers, blur filters, text placement
composition/lib/cursor.js     the hand cursor (shape, shadow, motion blur, hotspot)
composition/lib/icons.js      SVG brand marks + Higgsfield logo
composition/data/*.js         per-frame measurements too long to keep inline
composition/scenes/NN-*.js    one module per block of the video
scripts/render.mjs            Playwright: seek every frame → PNG → ffmpeg
```

Why HTML/CSS/SVG and not canvas / After Effects / a video library?

* Chromium has excellent text rendering, gradients, blur, SVG paths, clip-paths,
  border radii, blend modes, transforms — everything a motion-graphics layer needs.
* It is inspectable: `tools/eval_in_page.mjs` can ask any element where it is.
* Screenshots are pixel-exact and deterministic when nothing depends on time.
* An agent can write it: it is just DOM + JS.

## The one rule: a frame is a pure function of its number

```js
// every scene
update(f) { /* set styles from f only */ }
```

* No CSS `transition`/`animation`, no `requestAnimationFrame` loops in scenes, no
  `setTimeout`, no `Date.now()`, no `Math.random()` (use the seeded `rng()`).
* Every property that a scene ever changes must be set on **every** `update(f)`
  call of that scene (or reset), because frames are rendered in any order
  (`--from 600 --to 610`, `--list 81,162,346`).
* State that *is* allowed: things computed once in `prepare()` (measurements of
  laid-out text) and caches of "which image is visible" — as long as they are
  re-derived from `f` every time.

## Scene contract

```js
import { makeScene, el, kf, E } from '../lib/core.js';

export default function create(stage) {
  const sc = makeScene(stage, { start: 99, end: 226, bg: '#000' });   // active frame range, z order = creation order
  const root = sc.root;                                              // build DOM under root once
  function prepare() { /* optional: after fonts/images are loaded - measure text, place labels */ }
  function update(f) { /* called only when start <= f <= end */ }
  return { ...sc, prepare, update };
}
```

`main.js` creates every scene once, then `seek(f)` shows the scenes whose range
contains `f` (`display:block`), hides the others, and calls their `update(f)`.
Scenes created later are on top. Two scenes may overlap in time (e.g. a dissolve).

`window.__ready` resolves after fonts (`document.fonts.load` for each weight) and
images are decoded and every `prepare()` has run. **Always await it before
seeking** — measuring text before the font loads gives fallback-font metrics.

## core.js reference

### Math & easing

| API | Use |
|---|---|
| `clamp(v, a=0, b=1)`, `lerp(a, b, t)`, `invLerp(a, b, v)` | basics |
| `E.linear, inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic, inQuart, outQuart, inOutQuart, outQuint, inExpo, outExpo, inOutExpo, inOutSine, outSine, inSine, outBack, inBack, outBackSoft, outBackHard` | standard easings, `t ∈ [0,1] → [0,1]` |
| `E.smooth` = `bezier(0.16, 1, 0.3, 1)` | long premium settle |
| `E.whip` = `bezier(0.7, 0, 0.2, 1)` | strong in-out |
| `bezier(x1, y1, x2, y2)` | any CSS cubic-bezier as a function |
| `decay(n, r=0.9)` | `1 − r^n` — exponential approach |
| `spring(n, {stiffness, damping, mass})` | damped spring step response at n frames |
| `tween(f, f0, f1, v0, v1, ease)` | one clamped segment |

### Keyframes: `kf(f, keys)`

```js
const L = E.linear;
const CAM = [[47, 1], [48, 1.004, L], [49, 1.009, L], [55, 1.163, L]];   // [frame, value, easeIntoThisKey]
const s = kf(f, CAM);                                                    // holds 1 before 47, 1.163 after 55
const CUR = [[20, [180, 760]], [21, [186, 712], L]];                     // values can be arrays
const [x, y] = kf(f, CUR);
```

* The third element is the easing **into** that key from the previous one
  (default `inOutCubic`). For per-frame measurements always use `L` (linear):
  the measurements already contain the easing.
* Before the first key → first value; after the last → last value.
* `kf()` also works with fractional frames, e.g. for velocity: `kf(f, K) − kf(f − 1, K)`.

### DOM helpers

| API | Use |
|---|---|
| `el(tag, {cls, id, text, html, attrs, style}, parent)` | create HTML or SVG element (SVG tags auto-namespaced) |
| `T({x, y, z, s, sx, sy, r, rx, ry, skx, persp})` | transform string (translate → rotate → scale) |
| `set(node, {tf, o, blur, show, ...css})` | shorthand style setter |
| `makeScene(stage, {start, end, z, bg})` | scene root |
| `rng(seed)` | deterministic PRNG for particles/stars |

### Blur

```js
const ab = makeAxisBlur();                       // one SVG filter, reusable
node.style.filter = ab.css(sx, sy);              // gaussian std-dev in x and y (px); 'none' when ~0

const mb = makeMotionBlur(parent);               // wrapper pair, blur along any direction
mb.update(vx, vy, extra);                        // vx,vy = displacement this frame; content goes into mb.inner
```

Both filters use `filterUnits="userSpaceOnUse"` with a huge region (±4000 px):
the default filter region (bounding box +10%) clips long blurs —
`docs/10-pitfalls.md` P3.

### Text

| API | Use |
|---|---|
| `baselineOffset(font)` | px from the top of a `line-height:1` box to the baseline, measured in the DOM |
| `inkMetrics([[text, font], ...])` | advance, inkL, inkR, ascent, descent of a run list (canvas `measureText`) |
| `placeText(node, runs, {left, right, baseline, fit, maxStretch, uniform})` | **place text so its ink spans [left, right] and its baseline is at `baseline`** |

`placeText` is the bridge between measurement and rendering: you measured
"the label's ink goes from x=470 to x=885, baseline 384" — you call
`placeText(label, [['Get Gemini', '500 88px "Inter Display"']], {left: 470, right: 885, baseline: 384})`
and it computes the scale and translation. `uniform: 'auto'` scales only
horizontally for small corrections (typeface width differs) and uniformly when
the size is clearly off (> 10%). See `docs/08-typography.md`. Every call is logged
to `window.__fitLog`; `node tools/fit_log.mjs` lists the suspicious ones.

## cursor.js

```js
const cursor = makeCursor(root, { size: 56 });           // px of the 680-unit design box
cursor.update({ x, y, r, s, o, vx, vy, blur, grab, show, filter });   // x,y = FINGERTIP (hotspot)
cursor.center(cx, cy, { vx, vy, r, s });                  // place by glove centre (what track_blob measures)
```

The hand was traced from the reference close-up (frame 81) over a 4× crop
(`docs/images/proto-cursor-trace.jpg`): white fill, 24-unit black stroke, 3 finger
lines, hard offset shadow (16, 24) at 62% opacity. `vx, vy` drive the motion blur.

## icons.js

SVG strings: `apple, grok, claude, gemini, perplexity, copilot, runway, kling, luma,
sora, openai, banana (emoji), sparkle, check, higgsfield` plus `HIGGS_SQUIGGLE`
(the logo path, Catmull-Rom spline through 23 traced points). Each takes `(w, h, ...colours)`.
They are simplified look-alikes sized to the measured icon boxes, not official artwork.

## main.js — global layers and the seek loop

* Builds every scene, then the **letterbox** (`.bar` top/bottom, z 1000) driven by the
  `BAR` keyframes (measured with `tools/letterbox.py`).
* `seek(f)` → show/hide scenes, `update(f)`, letterbox.
* Preview mode (no `?render`): scales the stage to the window, scrubber, ← → step a
  frame, space plays with the soundtrack (`audio.currentTime * 30` drives the frame).

## render.mjs

```bash
node scripts/render.mjs                                  # all frames, 1920x1080, audio → out/higgsfield_one_button.mp4
node scripts/render.mjs --scale 1 --out out/x.mp4         # 1280x720
node scripts/render.mjs --from 99 --to 226 --frames dir   # JPGs for QA (no video)
node scripts/render.mjs --list 81,162,346 --frames dir    # just these frames
```

Inside: a tiny static HTTP server (fonts and ES modules don't load from `file://`),
Chromium with `--font-render-hinting=none --disable-lcd-text` (stable glyph edges),
viewport 1280×720 with `deviceScaleFactor = scale` (1.5 → 1920×1080 with sharp text),
for each frame `page.evaluate(__seek(f))` → `page.screenshot({type:'png'})` →
written to ffmpeg's stdin (`-f image2pipe -c:v png`). Encoder: libx264 `-preset slow
-crf 14 -pix_fmt yuv420p`, BT.709 tags, `+faststart`, reference audio copied, `-shortest`.

870 frames at 1080p take ~3 minutes; at 720p ~35 seconds.

## CSS conventions (styles.css)

| Class | Meaning |
|---|---|
| `#stage` | 1280×720, overflow hidden, black |
| `.scene` | absolute full-frame layer, `display:none` until active |
| `.fill` | absolute 100%×100% |
| `.plate` | full-frame `<img>` (object-fit cover) |
| `.caption` | the small centred `[ Name Button ]` caption, top set from baseline in `prepare()` |
| `.bar` | letterbox bars |

Fonts are bundled (`assets/fonts`, OFL) and declared with `@font-face` — never rely on system fonts.
