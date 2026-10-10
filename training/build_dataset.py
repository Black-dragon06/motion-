#!/usr/bin/env python3
"""Builds training/motion_sft.jsonl: instruction -> response pairs distilled from this project.

Format: one JSON object per line, chat style
  {"messages": [{"role": "system", ...}, {"role": "user", ...}, {"role": "assistant", ...}], "source": "docs/..."}
Usable as few-shot examples, a retrieval corpus, or supervised fine-tuning data.
Every answer reflects what was actually done and measured in this repository.
"""
import json, os

SYSTEM = ("You recreate motion videos from a reference with code (HTML/CSS/SVG + a frame-pure JS timeline, "
          "rendered with Playwright and ffmpeg). You never guess numbers: you measure the reference frames with tools, "
          "build one scene at a time, and verify every change by comparing rendered frames with the reference.")

EX = []
def ex(user, assistant, source):
    EX.append({"messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user.strip()},
                            {"role": "assistant", "content": assistant.strip()}], "source": source})

ex("I have a reference video. What do I do first, before writing any animation code?",
"""1. Probe it: `tools/probe.sh ref.mp4` -> resolution, fps (must be constant), frame count, duration. Every later number depends on these.
2. Extract every frame: `tools/extract_frames.sh ref.mp4 .cache/frames/ref` (frame n = f{n+1:04d}.jpg, 0-based).
3. Find cuts and motion spans: `python3 tools/scene_cuts.py` (isolated spikes = hard cuts; runs = whips/zooms/dissolves).
4. Map the audio: `python3 tools/audio_onsets.py ref.mp4 --highband 4000` (onsets = beats/syllables; high band = click SFX that cuts land on).
5. Contact sheets of everything (`tools/contact_sheet.py --step 2`), notes with frame numbers.
6. Shot list (frames, content, entry, exit) and a layer inventory per shot: DRAW (rebuild in code) / LIFT (footage taken from the reference) / APPROXIMATE.
7. Write the brief. Only then build the engine and the first scene.""", "docs/01-workflow.md")

ex("These are the left-edge x positions of a word per frame: 10:359 11:349 12:343 13:336 14:330 15:326 16:321 17:318 18:315 19:312 20:309 22:304 26:297 30:291 40:284 47:283. What easing is this and how do I code it?",
"""Look at the deltas: -10, -6, -7, -6, -4, -5, -3, -3, -3, -3 ... they shrink by a roughly constant ratio, so it is an exponential settle (expo-out), not a cubic ease.
`python3 tools/fit_easing.py "10:359 ... 47:283"` gives r = 0.901, target 281.7, offset 75.5, RMSE 0.87 px (a power ease-out fits worse, RMSE 2.26).
Code, frame-pure:
```js
const n = f - appear;                     // frames since the word appeared (9 here)
const x = final + off * Math.pow(0.9, n); // 10% of the remaining distance per frame
```
Half-life = ln 0.5 / ln 0.9 = 6.6 frames.""", "docs/04-motion-language.md")

ex("A letter's vertical offset below its rest position per frame after it starts is: 330, 141, 30, -33, -65, -74, -67, -54, -39, -30, -19, -7, -3, -1, 0. Describe the motion and implement it.",
"""It flies up through its rest position, overshoots by 74 px (22% of the 330 px travel) at frame +5 and settles back by +13: a damped spring / back-out. Because the exact shape is measured, store it as keyframes with linear interpolation and reuse it for every letter with a start offset (stagger) and an amplitude:
```js
const L = E.linear;
const RISE = [[-1, 330], [0, 141, L], [1, 30, L], [2, -33, L], [3, -65, L], [4, -74, L], [5, -67, L], [6, -54, L],
  [7, -39, L], [8, -30, L], [9, -19, L], [10, -7, L], [11, -3, L], [12, -1, L], [13, 0, L]];
const n = f - letter.start;                         // e.g. starts 227, 228, 229; dots 232, 234, 236
const y = kf(n, RISE) * letter.amp;                 // dots use amp 0.55
const vy = (kf(n, RISE) - kf(n - 1, RISE)) * letter.amp;
letter.el.style.marginTop = y + 'px';
letter.el.style.filter = Math.abs(vy) > 2 ? blur.css(0.5, Math.abs(vy) * 0.18) : 'none';  // vertical motion blur
```""", "docs/06-recipes.md#13")

ex("I wrote `.word { animation: slideIn .6s ease-out }` to recreate a text reveal. Why is this wrong for this kind of work and what should I write instead?",
"""CSS animations run in real time: the renderer can't seek them to an exact frame, frames rendered out of order (QA renders of single frames) show the wrong state, and 'ease-out .6s' is a guess, not the reference's motion.
Write a pure function of the frame number with measured values:
```js
function update(f) {
  for (const w of words) {
    const n = f - w.appear;                       // measured first visible frame
    if (n < 0) { w.el.style.opacity = '0'; continue; }
    w.el.style.opacity = String(clamp(0.25 + n / 3.2));
    w.el.style.transform = `translate(${w.x + w.off * Math.pow(0.9, n)}px, ${BASELINE - ASC}px)`;
    const b = Math.max(0, 6 * (1 - n / 6));
    w.el.style.filter = b > 0.05 ? `blur(${b}px)` : 'none';
  }
}
```
No CSS transitions/animations, timers, Date.now() or Math.random() anywhere in scene code.""", "docs/05-engine-api.md")

ex("How do I measure the label on a flat button and place my text exactly there?",
"""Mask everything that is not the button colour and read column/row runs:
`python3 tools/segments.py --from 156 --box 330,285,955,440 --mode notcolor --color '#eceffe' --tol 70 --gap 9`
-> `156 cols [(383, 600), (625, 818), (828, 885)] rows [(314, 393)]` (icon+'Get', 'Gemini' ...). Take the ink left/right of the words and the baseline (bottom row of letters without descenders; 384 for these labels).
Then place the text by ink, not by CSS box, after fonts load:
```js
function prepare() {
  placeText(label, [['Get Gemini', '500 88px "Inter Display"']], { left: 470, right: 885, baseline: 384 });
}
```
placeText computes the scale (x-only for small corrections, uniform if the size is >10% off) and the translation so the ink lands on [left, right] and the baseline on 384.""", "docs/03-measurement-cookbook.md#R9")

ex("The reference word 'Button' has ink from x=442 to x=841 and cap height 95 px. Which font size should I use in Inter Display Bold?",
"""Size from the cap height: 95 / 0.727 (Inter Display cap ratio) ≈ 131 px. Confirm with the width in the real renderer:
`node tools/measure_text.mjs '[["Button","700 133px \\"Inter Display\\""]]'` -> ink width 397 px, ascent 97.
Reference ink width 399 px -> ratio 1.005, cap 97 vs 95: 133 px matches both. If the height matched but the width didn't, the typeface is narrower/wider: keep the size and correct with scaleX only.""", "docs/08-typography.md")

ex("At the end of a shot the whole text line accelerates toward a button. The left edge of the first word on frames 47, 50, 53, 55 is 283, 275, 250, 204; the button (fixed point) is at x=750. What is the camera scale?",
"""Everything scales around the fixed point, so scale(f) = (750 - x(f)) / (750 - x_rest) with x_rest = 283:
47 -> 1.000, 50 -> 1.017, 53 -> 1.071, 55 -> 1.169. The deltas grow every frame: an ease-in push that reaches full speed at the cut. Implement as a group transform with per-frame keys:
```js
cam.style.transformOrigin = '750px 378px';
const CAM = [[47, 1], [48, 1.004, L], [49, 1.009, L], [50, 1.015, L], [51, 1.027, L], [52, 1.043, L], [53, 1.069, L], [54, 1.114, L], [55, 1.163, L]];
cam.style.transform = `scale(${kf(f, CAM)})`;
```""", "docs/16-worked-example-intro.md")

ex("Text in a typing shot scrolls left as letters are typed, irregularly. How do I recover the scroll?",
"""Compare the darkness profile of each column between consecutive frames and find the shift that matches best; the cumulative sum is the pan in document coordinates. Exclude the moving caret with a per-frame right limit:
`python3 tools/scroll_profile.py --from 250 --to 295 --box 0,250,1280,470 --right "250:234 251:322 ..."`
-> 251 shift 29, 252 shift 15, 254 shift 89 ... pan 0, 29, 44, 70, 159, 248, ... 2358.
Then put every glyph in document space and draw it at x - pan(f):
```js
const PAN = [[250, 0], [251, 29, L], [252, 44, L], /* ... */ [295, 2358, L]];
c.el.style.transform = `translate(${c.x - kf(f, PAN)}px, ${479 - base}px) scaleX(${c.k})`;
typeLayer.style.filter = typeBlur.css(Math.abs(kf(f, PAN) - kf(f - 1, PAN)) * 0.12, 0);
```""", "docs/03-measurement-cookbook.md#R12")

ex("The background behind my graphics is filmed footage (hills, flowers). Should I recreate it with gradients?",
"""No. Code can't regenerate photographic footage, and approximations score badly (here a scaled plate + haze gradient scored 17.4; lifted plates 9.6). Lift it from the reference: for every frame mask the graphics drawn on top (text, buttons, cursor, captions, letterbox rows), dilate the mask a few px, fill it with push-pull inpainting, save as assets/plates/<group>/<frame>.jpg, show plate f on frame f and redraw the graphics in code on top. First check with `tools/phase_shift.py` whether the background is static (one plate is enough) or moving (one plate per frame), and search existing clean plates for reused footage.""", "docs/07-plates-and-inpainting.md")

ex("My lifted plate for frame 249 came out completely black. What happened?",
"""The inpainting mask covered every pixel. The mask was `lum < 195` (meant to catch dark text), but on that frame the whole picture is darker than 195, so nothing was left to pull from and push-pull returned zeros. Use frame-range-specific thresholds (here 45 for frames 243-249, 110 afterwards), mask known geometry instead of thresholds where possible, and check every plate (`tools/luma_stats.py` or a contact sheet of the plate folder) before using it.""", "docs/10-pitfalls.md#P10")

ex("After adding rotated letters on an arc, all the letters appear scattered randomly across the frame. Each glyph object has fields t (text), a, b (poses). I added `g.t = el('div', ...)` for an inner element. Why?",
"""You overwrote the glyph's text field `t` with a DOM node. Later `inkMetrics([[g.t, FONT]])` measured the string "[object HTMLDivElement]", whose huge ink box produced huge centring offsets. Rename the DOM reference (e.g. `g.inner`) and never reuse a data field name for an element.""", "docs/10-pitfalls.md#P5")

ex("My directional motion blur is cut off with a hard straight edge on fast frames. I use an SVG feGaussianBlur filter on the element.",
"""The SVG filter region defaults to the element's bounding box plus 10%, so a long smear is clipped. Give the filter a huge user-space region:
```js
el('filter', { id, attrs: { filterUnits: 'userSpaceOnUse', x: -4000, y: -4000, width: 8000, height: 8000,
  'color-interpolation-filters': 'sRGB' } }, defs);
// <feGaussianBlur stdDeviation="sx sy"> with sx along the motion
```
`makeAxisBlur()` / `makeMotionBlur()` in composition/lib/core.js already do this.""", "docs/10-pitfalls.md#P3")

ex("A title shows twice, slightly offset, during a whip transition.",
"""The plate for those frames still contains the title (it wasn't masked, or it is smeared by the whip and impossible to mask), and the code draws it again. Choose one per frame range: either mask it out of the plate and draw it, or keep it in the plate and do not draw it. In this project the 'Motion' whip frames 617-621 keep the plate untouched and the drawn title starts at 622.""", "docs/10-pitfalls.md#P11")

ex("My text looks condensed compared to the reference even though its left and right edges match.",
"""The base font size is wrong and the fit only scaled x. If the measured ink width / natural ink width (k) is far from 1 (here 0.77), fix the font size (choose it from the cap height) or scale uniformly. placeText(..., {uniform: 'auto'}) scales uniformly when |k-1| > 0.1; `node tools/fit_log.mjs` lists all suspicious fits.""", "docs/10-pitfalls.md#P13")

ex("How do I implement motion blur for an element moving with a keyframed track?",
"""Use the displacement into the current frame (the shutter interval that ends at this frame) and blur along it, with std-dev about 0.12-0.3 x displacement; skip it below ~1-3 px/frame.
```js
const x = kf(f, TRACK), v = x - kf(f - 1, TRACK);
node.style.transform = `translateX(${x}px)`;
node.style.filter = Math.abs(v) > 2 ? axisBlur.css(Math.abs(v) * 0.3, 0) : 'none';
// any direction: const mb = makeMotionBlur(parent); mb.update(vx, vy) and put the content in mb.inner
```
If the first visible frame must already be blurred, add a key before it, otherwise kf() holds the first value and v = 0 there.""", "docs/04-motion-language.md#5")

ex("A button's height per frame (rest 239) is: 99: 207, 100: 231, 101: 237, 102-104: 239, then 105: 237, 106: 235, 107: 231, 108: 229, 110: 227, 111: 228, 113: 229. Write the scale keys.",
"""Scale = height / rest height:
pop 99-102: 0.866, 0.967, 0.992, 1.0 -> a very fast exponential settle (deltas 0.10, 0.025, 0.008: ratio ~0.25-0.33)
click 104-113: 1, 0.992, 0.983, 0.967, 0.958, 0.95 (110), then a slight return to 0.958 -> press squash with a small rebound
```js
const S = [[99, 0.866], [100, 0.967, L], [101, 0.992, L], [102, 1, L], [104, 1, L], [105, 0.992, L], [106, 0.983, L],
  [107, 0.967, L], [108, 0.958, L], [110, 0.95, L], [111, 0.954, L], [112, 0.958, L]];
group.style.transform = `scale(${kf(f, S)})`;   // transform-origin = button centre
```
Use a dimension that is not cut off by the frame or covered by the cursor (here the height; the cursor overlaps the right edge).""", "analysis/measurements/03-applepay-button.txt")

ex("Rects of a pill per frame: 580: 619x135, 581: 649x180, 583: 663x209, 590: 603x149, 596: 755x167 (rest). What is this motion?",
"""Divide by the rest size 755x167: 580 -> 0.82 x 0.81, 581 -> 0.86 x 1.08, 583 -> 0.88 x 1.25 (stretched tall), 590 -> 0.80 x 0.89 (squashed), 596 -> 1 x 1. Width and height move out of phase: squash & stretch. Store both as keys and scale a group around the pill centre:
```js
const SQ = [[580, [0.82, 0.81]], [581, [0.86, 1.08], L], [583, [0.88, 1.25], L], [590, [0.80, 0.89], L], [596, [1, 1], L]];
const [sx, sy] = kf(f, SQ); grp.style.transform = `scale(${sx}, ${sy})`;
```""", "docs/03-measurement-cookbook.md#R19")

ex("luma_stats shows max luma 255 until frame 822, then 231 (828), 203 (834), 170 (840), 142 (846), 107 (852), 76 (858), 36 (864). Implement the ending.",
"""A fade to black starting at 822: opacity = max/255 -> 1, 0.9, 0.8, 0.67, 0.56, 0.42, 0.3, 0.14, then 0 at 869.
```js
root.style.opacity = String(kf(f, [[822, 1], [828, 0.9], [834, 0.8], [840, 0.67], [846, 0.56], [852, 0.42], [858, 0.3], [864, 0.14], [869, 0]]));
```""", "docs/03-measurement-cookbook.md#R18")

ex("score.py reports: intro 5.8, close-up 9.6, montage 5.0, But... 15.8 (worst frame 245), typing 6.5, others < 5. What should I do next?",
"""Work on 'But...' (highest mean). Render and compare frames 244-246 (`tools/qa.sh .cache/qa.png 0.5 3 244 245 246`) and a heat map (`tools/diff_heatmap.py --frames 245`). State the biggest difference as a measurable claim (e.g. 'the side strips around the shrinking card are black in NEW and olive in REF'), measure it in both, change one thing, re-render, re-score. Stop when the block is < ~6 or the remainder is a documented approximation (here frames 227-232 have no clean footage).""", "docs/09-qa-loop.md")

ex("I can't view images. REF frame 45 segments: cols [(283, 404), (420, 460), (483, 639), (672, 741)] rows [(356, 396)]. NEW: cols [(284, 401), (422, 459), (486, 636), (671, 738)] rows [(356, 396)]. Is the layout right?",
"""Yes. Same number of words, every left/right edge within 1-3 px, identical rows (cap top 356, descender bottom 396). Remaining differences are below the glyph-shape difference of the substitute font. Move on to the next element or the motion check (run the same command over the frame range with --src ref and --src new and compare per frame).""", "docs/15-agent-playbook.md#D")

ex("Give me the skeleton of a scene module for this engine.",
"""```js
import { makeScene, el, kf, E, clamp, placeText, makeAxisBlur } from '../lib/core.js';
const START = 0, END = 55;            // measured shot range
const L = E.linear;
const TITLE_X = [[START, 0], [START + 1, 0, L]];   // measured per-frame track

export default function create(stage) {
  const sc = makeScene(stage, { start: START, end: END, bg: '#000' });
  const title = el('div', { style: { color: '#fff' } }, sc.root);   // build DOM once
  function prepare() {                                              // after fonts load
    placeText(title, [['Title', '600 64px "Inter Display"']], { left: 100, right: 400, baseline: 360 });
  }
  function update(f) {                                              // pure function of f
    title.style.marginLeft = kf(f, TITLE_X) + 'px';
  }
  return { ...sc, prepare, update };
}
```
Register it in composition/main.js; main.js shows scenes whose [start, end] contains f and calls update(f). Full template: templates/scene.template.js.""", "templates/scene.template.js")

ex("Letters rotate around their own centres on an arc, but the rotation looks off-centre. I centre a 200x200 box on the measured centroid and rotate it.",
"""The measured centroid is the centre of the ink; the CSS box centre is not (it includes ascender/descender space and side bearings). Shift each glyph so its ink centre sits on the box centre:
```js
const m = inkMetrics([[glyph, FONT]]);
const cx = (m.inkL + m.inkR) / 2, cy = baselineOffset(FONT) - (m.asc - m.desc) / 2;
inner.style.transform = `translate(${100 - cx}px, ${100 - cy}px)`;
box.style.transform = `translate(${x - 100}px, ${y - 100}px) rotate(${r}deg) scale(${s})`;   // transform-origin 100px 100px
```""", "docs/06-recipes.md#19")

ex("How do I make a full-frame card shrink into a thin text caret, the way a video transition does it?",
"""Treat the card as a crop window (overflow:hidden) whose rect is measured per frame, and animate its content separately (scale/shift/blur) so it does not just get cropped:
```js
const [l, r, t, b] = kf(f, CARD);                   // measured window rect per frame
Object.assign(card.style, { left: l + 'px', top: t + 'px', width: (r - l) + 'px', height: (b - t) + 'px' });
inner.style.left = -l + 'px'; inner.style.top = -t + 'px';   // keep content in screen coordinates
inner.style.transform = `translateX(${kf(f, SHIFT)}px) scale(${kf(f, SCALE)})`;
inner.style.filter = `blur(${kf(f, BLUR)}px)`;
dark.style.opacity = kf(f, DARK);                   // fades to black: it becomes the caret
```
Give the window an opaque background so scaled-down content never reveals the layer behind; after the morph the same element is the caret.""", "docs/06-recipes.md#14")

ex("The video has 19 different subscription buttons, each on screen 4-15 frames, cut on clicks. How do I structure the code?",
"""A shot registry with shared helpers in one scene module:
```js
const SHOTS = [];
const shot = (s, e, build) => SHOTS.push({ s, e, build });
shot(154, 159, (root) => {
  el('div', { cls: 'fill', style: { background: 'linear-gradient(180deg, #1E3A69, #220E4D)' } }, root);
  const st = starfield(root, 21, 46);
  const h = hero(root, { bg: '#ECEFFE', color: '#162250', runs: [['Get Gemini', LABEL]], textL: 470, textR: 885 });
  caption(root, 'Gemini Subscription Button', 'rgba(220,220,255,0.78)');
  return { fit() { h.label._fit(); }, update: st };
});
// scene update(f): show the shot whose [s, e] contains f, hide the others, call its update(f)
```
Measure the shared geometry once (hero rect 306..976 x 248..471, radius 37, label baseline 384, caption baseline 671) so every shot is 5-30 lines and consistent.""", "docs/06-recipes.md#7")

ex("The onset detector finds almost no onsets during a fast montage, but the cuts obviously sit on click sounds.",
"""Broadband spectral flux is dominated by music/voice; short clicks live in the high band. Measure energy above ~4 kHz per video frame and look for peaks above a local (rolling) median:
`python3 tools/audio_onsets.py ref.mp4 --highband 4000` -> peaks 99, 115, 125, 135, 142, 149, 155, 161 ... i.e. on the cut frame or one frame after it. Use those frames when deciding exact cut timing.""", "docs/02-reference-analysis.md#5")

ex("The black letterbox bars change height several times across different scenes. Where should that live?",
"""In one global layer, not in the scenes: two .bar divs above everything, driven by one keyframe track measured with `tools/letterbox.py` over the whole video (here 0 -> 34 px around frames 50-76, 139 px during typing, 29 px from 312, 0 after 776):
```js
const h = kf(f, BAR);
barTop.style.height = barBot.style.height = h + 'px';
```
Also mask the letterbox rows when lifting plates, since the global layer draws them anyway.""", "docs/06-recipes.md#25")

ex("How is the final video rendered and why these settings?",
"""`node scripts/render.mjs`: a local HTTP server (fonts/ES modules don't load from file://), Chromium with --font-render-hinting=none --disable-lcd-text, viewport 1280x720 with deviceScaleFactor 1.5 (sharp 1920x1080 text, coordinates stay in 1280x720), await window.__ready (fonts, images, prepare()), then for each frame __seek(f) -> PNG screenshot -> ffmpeg stdin (image2pipe). Encoding: libx264 -preset slow -crf 14 (no gradient banding), yuv420p, BT.709 tags, reference audio copied, -shortest, +faststart. Verify with tools/probe.sh (870 frames, 29.0 s).""", "docs/14-render-and-delivery.md")

ex("I need random-looking particles. Can I use Math.random()?",
"""No: every render (and every single-frame QA render) must produce identical pixels. Use the seeded PRNG and compute positions from f:
```js
const R = rng(7);
const parts = Array.from({ length: 70 }, () => ({ a: R() * Math.PI * 2, d: 60 + R() * 700, v: 0.012 + R() * 0.02 }));
// update(f):
const d = p.d * (1 + p.v * (f - start) * 3);
p.el.style.transform = `translate(${641 + Math.cos(p.a) * d * 1.3}px, ${360 + Math.sin(p.a) * d * 0.75}px)`;
```
Particles are APPROXIMATE: match density, size range, blur and direction, not individual positions.""", "docs/06-recipes.md#10")

ex("A ribbon passes behind a button and then in front of it. How do I get the depth right?",
"""Split the stroke path in two at the crossing: the part that is in front goes in an SVG layer above the button (z 3), the part behind in a layer below it (z 1), the button sits at z 2. Draw each part on with stroke-dashoffset (`len = path.getTotalLength()` read after the path is in the DOM):
```js
p.setAttribute('stroke-dasharray', `${len} ${len}`);
p.setAttribute('stroke-dashoffset', String(len * (1 - progress)));
```""", "docs/06-recipes.md#11")

ex("Inside a growing circle the button turns cyan and the label turns dark; outside it stays white. How?",
"""Two copies of the label: white (normal layer) and dark (inside a full-frame container clipped to the same circle as the blob):
```js
clip.style.clipPath = `circle(${r}px at 640px 360px)`;
Object.assign(blob.style, { left: (cx - r) + 'px', top: (cy - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px' });
```
r comes from the measured blob radius per frame.""", "docs/06-recipes.md#12")

ex("My motion between per-frame measured keys looks slightly wobbly even though every key is correct.",
"""kf() defaults to inOutCubic easing between keys. With one key per frame that adds an S-curve inside every interval. Mark per-frame measured keys as linear: `[[20, [180, 760]], [21, [186, 712], E.linear], ...]` (or `.map(([f, v]) => [f, v, E.linear])`). The measurements already contain the easing.""", "docs/10-pitfalls.md#P23")

ex("segments.py on frames 8-40 shows ink first appearing for four words on frames 9, 18, 27 and 35. The audio onsets include 10, 18, 25, 35. What does that tell me?",
"""The words are cut to the voice-over syllables, with an uneven stagger (9, 9, 8 frames). Use the measured appear frames exactly; never assume an even stagger. When a measurement is ambiguous by a frame, prefer the onset frame.""", "docs/04-motion-language.md#3")

ex("How do I draw a logo stroke on and then invert the logo colours?",
"""Draw-on: path with stroke-dasharray = a length >= the path length and stroke-dashoffset going from that length to 0 (here 400 * (1 - draw), draw 0 -> 1 over frames 700-716), inside a plaque with overflow:hidden whose rect grows from a line (measured per frame) so the plaque also reveals the stroke. Inversion: cross-fade the colours with one mix factor and blur the mark while it changes (plaque #161616 -> #D6FF25, stroke #AAD71C -> #1D2416, blur 0 -> 5 -> 0 px):
```js
const mix = kf(f, [[752, 0], [758, 0.22, L], [764, 0.75, L], [768, 1, L]]);
const mixc = (a, b) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * mix)).join(',')})`;
mark.style.background = mixc([22, 22, 22], [214, 255, 37]);
path.setAttribute('stroke', mixc([170, 215, 28], [29, 36, 22]));
```""", "docs/06-recipes.md#24")

ex("What does 'done' mean for a recreated scene?",
"""Same cut frames as the reference; every element present on the same frames; positions within ~3 px on rest frames and ~5 px on measured motion frames; colours within ~5 RGB of the measured values; block score (mean abs difference at 320x180) below ~6 or the remainder documented as an approximation (substitute font shapes, generative particles, missing footage); no page errors; measurements saved so the numbers can be traced.""", "docs/15-agent-playbook.md#F")

ex("Why render the whole video only at the end?",
"""Because checking one change needs only the frames it affects: `tools/qa.sh out.png 0.5 4 81 90 96 98` renders 4 frames in ~3 s and builds a REF/NEW sheet; a full 720p render takes ~35 s and 1080p ~3 min. Fast feedback loops are what make frame-accurate work possible. Render everything for the score (`make frames-new && tools/score.py`) and for delivery.""", "docs/09-qa-loop.md")

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'motion_sft.jsonl')
with open(out, 'w') as fh:
    for e in EX:
        fh.write(json.dumps(e, ensure_ascii=False) + '\n')
print(f'wrote {out}: {len(EX)} examples')
