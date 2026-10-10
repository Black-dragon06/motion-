# 06 · Recipes — reusable motion patterns with code

Every recipe is used in this project. Code is quoted from the real files (sometimes
shortened); open the file for the full context.

---

## 1. Footage background as a plate sequence

*Where:* every LIFT shot (`01-intro.js`, `02-closeup.js`, `06-lifesaver.js`, …)

```js
const plates = [];
for (let i = START; i <= END; i++)
  plates.push(el('img', { cls: 'plate', attrs: { src: `../assets/plates/closeup/${i}.jpg` }, style: { display: 'none' } }, root));
let last = null;
function update(f) {
  const p = plates[clamp(f - START, 0, plates.length - 1)];
  if (p !== last) { if (last) last.style.display = 'none'; p.style.display = ''; last = p; }
}
```

All images are created up front so `__ready` can wait for them to decode; switching
is a `display` toggle (no network, no flicker). Plates are named by the *reference*
frame they came from, so plate index = frame.

## 2. Word reveal: fade + blur + exponential settle

*Where:* intro line (`01-intro.js`), "No more endless…" (`09-nomore.js`)

```js
const WORDS = [ { t: 'We’ve', x: 282, appear: 9, off: 83 }, { t: 'all', x: 415, appear: 18, off: 89 }, … ];
for (const w of words) {
  const n = f - w.appear;
  if (n < 0) { w.n.style.opacity = '0'; continue; }
  const x = w.x + w.off * Math.pow(0.9, n);           // settle: 10% of remaining distance per frame
  const o = clamp(0.25 + n / 3.2);                    // fully opaque after ~3 frames
  const b = Math.max(0, 6 * (1 - n / 6));             // blur 6 px -> 0 in 6 frames
  w.n.style.opacity = String(o);
  w.n.style.transform = `translate(${x}px, ${BASELINE - ASC}px)`;
  w.n.style.filter = b > 0.05 ? `blur(${b}px)` : 'none';
}
```

Measure: `appear` = first frame with ink, `x` = settled ink-left, `off` = first-frame
ink-left − x (R4), ratio from `fit_easing.py` (R5).

## 3. Characters typed in by opacity sweep

*Where:* © footer (`01-intro.js`)

```js
const chars = [...FOOTER].map((c) => el('span', { text: c }, footer));
chars.forEach((c, i) => { const t0 = 5 + (i / chars.length) * 12; c.style.opacity = String(clamp((f - t0) / 2.5)); });
```

## 4. Camera push / whip on a group, with motion blur

*Where:* `01-intro.js` (push into the Button), `02-closeup.js` (whip in)

```js
const cam = el('div', { cls: 'abs', style: { width: '1280px', height: '720px', transformOrigin: '642px 362px' } }, root);
const camBlur = makeAxisBlur();
// in update:
const tx = kf(f, CAM_TX), s = kf(f, CAM_S);
const v = kf(f, CAM_TX) - kf(f - 1, CAM_TX);          // displacement into this frame
cam.style.transform = `translateX(${tx}px) scale(${s})`;
cam.style.filter = camBlur.css(Math.abs(v) * 0.3, 0);  // horizontal smear
```

Transform origin = the fixed point of the zoom (measure it: the pixel that doesn't move).

## 5. Hover light that follows the cursor

*Where:* `02-closeup.js`

```js
const t = E.inOutSine(clamp((f - 70) / 26));          // ramps in 70 -> 96
const R = 140 + 330 * t;
glow.style.background = `radial-gradient(circle ${R}px at ${fx}px ${fy}px,
  rgba(22,151,244,${t}) 0%, rgba(26,145,240,${0.92 * t}) 30%, rgba(40,120,210,${0.45 * t}) 65%, rgba(48,92,165,0) 100%)`;
```

`glow` is a child of the button body with `overflow:hidden`, so the light is clipped
to the button. `fx, fy` = fingertip in button coordinates.

## 6. Click squash

```js
const PILL_S = [[94, 1], [95, 0.995, L], [96, 0.942, L], [97, 0.915, L], [98, 0.986, E.outCubic]];
pill.style.transform = `scale(${kf(f, PILL_S)})`;    // transform-origin = button centre
```

The cursor shrinks with it (`CUR_S` 1 → 0.8): the reference cursor "presses in".

## 7. Hard-cut montage: a shot registry

*Where:* `03-montage.js` (19 shots in 128 frames)

```js
const SHOTS = [];
const shot = (s, e, build) => SHOTS.push({ s, e, build });
shot(141, 147, (root) => {                         // each shot builds its own DOM once
  const p = plateShot(root, 'mojave', 141, 147);
  const h = hero(root, { bg: '#1B284A', color: '#FFFAEC', runs: [['Upgrade ', LABEL], ['This', BOLD]], textL: 370, textR: 909 });
  caption(root, 'Upgrade This Button', 'rgba(230,230,240,0.78)');
  return { fit() { h.label._fit(); }, update: p };  // fit() runs in prepare(), update(f) per frame
});
// scene: show the shot whose [s, e] contains f, hide the rest
```

Shared helpers keep 19 shots consistent: `HERO` rect (306,248, 671×224, r 37),
`hero()` (button + fitted label), `caption()`, `plateShot()`, `hgrid()/vgrid()`,
`starfield()`, `icon()`. Measure the shared geometry once (R9), then each shot is
5–30 lines.

## 8. Label on a button fitted to measured ink

```js
const label = el('div', { style: { color } }, parent);
label._fit = () => placeText(label, [['Upgrade ', '500 88px "Inter Display"'], ['That', '700 88px "Inter Display"']],
                             { left: 370, right: 922, baseline: 384 });
```

Mixed weights are separate runs. `placeText` must run after fonts load → call it
from `prepare()` / `fit()`.

## 9. Sliding grid of rounded cells

*Where:* Runway, Upgrade This (brown), Upgrade That (red)

```js
function hgrid(parent, { cell, gap, rows, cw = 671, gx = 13, r = 30 }) {
  el('div', { cls: 'fill', style: { background: gap } }, parent);         // gap colour = background
  const layers = rows.map((row) => {
    const g = el('div', { style: { position: 'absolute', left: '0', top: row.y + 'px', width: '1280px', height: row.h + 'px' } }, parent);
    for (let i = -3; i <= 3; i++) box(g, { x: i * (cw + gx), y: 0, w: cw, h: row.h, r, bg: cell });
    return { g, row };
  });
  return (f, f0) => { for (const { g, row } of layers) g.style.transform = `translateX(${row.x0 + (f - f0) * row.v}px)`; };
}
```

Rows move at constant measured speeds (−7.67, 0, +4 px/frame). A box in gap colour
behind the hero button hides the middle row's cell edges.

## 10. Particles and stars (deterministic)

```js
const R = rng(7);                                         // same seed -> same field every render
for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, d = 60 + R() * 700, … }
// update: radial burst
const d = p.d * (1 + p.v * t * 3);
p.n.style.transform = `translate(${641 + Math.cos(p.a) * d * 1.3}px, ${360 + Math.sin(p.a) * d * 0.75}px) rotate(${p.a}rad)`;
```

Positions are APPROXIMATE (the reference particles can't be matched one by one);
match density, size range, blur and direction instead.

## 11. A ribbon that goes behind AND in front of a button

*Where:* Copilot (`03-montage.js`)

Split the path in two SVGs: the part that passes in front (z 3) and the part behind
(z 1); the button layer sits at z 2. Draw them on with `stroke-dashoffset`:

```js
pf.setAttribute('stroke-dasharray', `${lf} ${lf}`);
pf.setAttribute('stroke-dashoffset', String(lf * (1 - tf)));   // tf: 0.8 -> 1 over 166..168
```

`lf = path.getTotalLength()` must be read after the SVG is in the DOM (`fit()`).
The tail fades out with a `userSpaceOnUse` linear gradient stroke.

## 12. Circle reveal with colour-inverted text

*Where:* Kling (`03-montage.js`)

Two copies of the label: white (outside the blob) and dark (inside). The dark copy
is in a full-frame container clipped to the same circle as the blob:

```js
clip.style.clipPath = `circle(${r}px at 640px 360px)`;
Object.assign(blob.style, { left: (334 - r) + 'px', top: (112 - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px' });
```

## 13. Letters rising with overshoot + vertical motion blur

*Where:* "But…" (`04-but.js`)

```js
const RISE = [[-1, 330], [0, 141, L], [1, 30, L], [2, -33, L], [3, -65, L], [4, -74, L], [5, -67, L], …, [13, 0, L]];
const n = f - gl.s;                                     // per-letter start: 227, 228, 229, dots 232/234/236
const y = kf(n, RISE) * gl.amp, vy = (kf(n, RISE) - kf(n - 1, RISE)) * gl.amp;
gl.n.style.marginTop = y + 'px';
gl.n.style.filter = Math.abs(vy) > 2 ? gl.blur.css(0.5, Math.abs(vy) * 0.18) : 'none';
```

One measured curve (on the "B"), reused for every letter with a start offset and an
amplitude (dots 0.55). This is how to build a stagger from a single measurement.

## 14. Card closing into a text caret (crop-window morph)

*Where:* `04-but.js`, frames 238–262 (`docs/images/motion-card-to-caret.jpg`)

The card is a window (`overflow:hidden`) whose rect shrinks from full frame to a
34×413 bar; the content inside is scaled and shifted separately so the picture
doesn't just get cropped:

```js
const [l, r, t, b] = kf(f, CARD);                                   // measured window rect per frame
Object.assign(card.style, { left: l + 'px', top: t + 'px', width: (r - l) + 'px', height: (b - t) + 'px' });
inner.style.left = -l + 'px'; inner.style.top = -t + 'px';          // inner stays in screen coordinates
inner.style.transform = `translateX(${kf(f, CSHIFT)}px) scale(${kf(f, CSCALE)})`;
inner.style.filter = `blur(${cb}px) contrast(…)`;                  // content blurs and flattens
cardDark.style.opacity = …;                                         // fades to black: it becomes the caret
```

After frame 262 the window *is* the caret: same element, rect = `[CARET(f), CARET(f)+34, 153, 566]`.
Give the window a dark background so gaps never show the layer behind (P12).

## 15. Typing with a scrolling document

*Where:* `04-but.js`, 250–295

* `TYPED` = list of (frame, characters added). Each character is its own element.
* Characters live in **document coordinates** (x along the infinite line); the
  screen shows `x − pan(f)` where `pan` is the measured scroll curve (R12).
* Glyph boxes were remapped to the reference's measured glyph boxes, because the
  reference font is narrower (P15):

```js
c.k = (R0 - L0) / c.inkW;               // per-glyph scaleX to the measured width
c.x = L0 - c.inkL * c.k;                 // place ink-left exactly
c.n.style.transform = `translate(${c.x - p}px, ${479 - base}px) scaleX(${c.k})`;
```

* Scroll blur: `typeLayer.style.filter = typeBlur.css(Math.abs(v) * 0.12, 0)`.

## 16. Object rect from per-frame data + per-frame look table

*Where:* Life saver / style flashes / Higgsfield (`06-lifesaver.js`)

```js
import RECTS from '../data/lifesaver.js';            // {frame: [l, r, t, b]} from flood_rect.py
const [l, r, t, b] = RECTS[f];
const s = (r - l) / W0;                               // the button is one 670x212 design, scaled
btn.style.transform = `translate(${l}px, ${(t + b) / 2 - H0 * s / 2}px) scale(${s})`;
const k = look(f);                                    // style flash: colours/border per frame range
face.style.background = k.bg;
```

The label morph "Life saver" → "Higgsfield" (342–345) is a cross-fade of two
pre-fitted labels with a slight blur.

## 17. Dissolve to a flat colour

```js
const white = el('div', { cls: 'fill', style: { background: '#E5E5E5', opacity: '0' } }, root);
white.style.opacity = String(kf(f, [[381, 0], [382, 0.35, L], [385, 0.82, L], [388, 1, L]]));
```

Measure the progress with `luma_stats.py` (std of texture → 0, R18).

## 18. Thought bubble: blob that becomes a circle

*Where:* `09-nomore.js`

```js
const [right, top, R] = kf(f, BUB);                    // measured right edge, top, radius per frame
Object.assign(bub.style, { left: right - 2 * R + 'px', top: top + 'px', width: 2 * R + 'px',
  height: 2 * R * (wob ? 0.92 : 1) + 'px', borderRadius: wob ? '55% 45% 52% 48% / 48% 55% 45% 52%' : '50%' });
```

Irregular `border-radius` for the first frames = organic blob; then 50% = circle.
The emoji scales with an overshoot table.

## 19. Letters on an arch, centred on their ink

*Where:* "No more unnecessary costs" (`10-costs.js`, data in `composition/data/costs.json`)

Each glyph has a pose `a` (frame 453) and `b` (frame 491): centre x, y, rotation,
size. Progress `t = 1 − (1 − (f−453)/38)^3`. The crucial detail: put the **ink
centre** of the glyph at the measured centre (the components tool measures ink),
not the em-box centre:

```js
const m = inkMetrics([[g.t, FONT]]);
const cx = (m.inkL + m.inkR) / 2, cy = base - (m.asc - m.desc) / 2;   // ink centre inside the text box
g.inner.style.transform = `translate(${100 - cx}px, ${100 - cy}px)`; // move it to the 200x200 box centre
g.n.style.transform = `translate(${x - 100}px, ${y - 100}px) rotate(${r}deg) scale(${s})`;
```

## 20. Brush swoosh revealed with the cursor

*Where:* `11-payonce.js`

A filled SVG brush shape (thick start, tapering flick) revealed left→right with
`clip-path: inset(0 ${1280 - end}px 0 0)` where `end` = measured right edge of the blue
stroke per frame (`SWOOSH_END`) — the cursor's x on that frame.

## 21. Camera dive into the next shot

```js
cam.style.transform = `translateY(${kf(f, DROP)}px) scale(${kf(f, ZOOM)})`;   // origin 631,360
cam.style.filter = f >= 556 ? camBlur.css(2 + (f - 555) * 1.5, 1 + (f - 555) * 2.2) : …;  // zoom blur at the end
```

## 22. Squash & stretch + letters dropping in

*Where:* Voice (`12-features.js`)

```js
const [sx, sy] = kf(f, SQ);                               // measured w/h ratios
grp.style.transform = `scale(${sx}, ${sy})`;
const drop = -70 * Math.pow(0.35, n) * Math.cos(n * 0.9); // each letter: damped drop from above
```

The word is one `placeText` with one run per letter (`inline-block` spans), so each
letter can be translated on its own while keeping correct kerning/spacing.

## 23. Titles composited over lifted collage plates

*Where:* Video / Motion / Pure Creation (`12-features.js`, `composition/data/titles.js`)

The collage photos are LIFT; the titles are DRAW, placed every frame from a measured
track `[inkLeft, inkRight, baseline, opacity, blur, rotation]`:

```js
n.style.transform = `translate(${x0}px, ${base}px) rotate(${rot}deg) scale(${(x1 - x0) / natW})`;
```

Where the title is interleaved in depth with the photos (Image) or smeared by a
whip (Motion 617–621), it is left in the plate instead — don't fight the footage.

## 24. Logo build: line → plaque → draw-on → inversion → lockup

*Where:* `17-logo.js`

1. A 1-px line grows into a rounded plaque: `MARK` rect per frame, radius = min(w/2, 36).
2. The squiggle draws on: `stroke-dasharray 400; stroke-dashoffset 400·(1−draw)`, draw 0→1 over 700–716,
   clipped by the growing plaque (`overflow:hidden`) — the plaque reveals it as it widens.
3. Background goes grey → black (`g` keys 750–780).
4. Colours cross-fade: plaque `#161616 → #D6FF25`, squiggle `#AAD71C → #1D2416`, with blur 0→5→0 px.
5. The tagline group moves/scales into the lockup (`TAG`), the wordmark blurs in (12 px → 0).
6. Global fade 822–869.

## 25. Global letterbox

`main.js`: two black bars with a height keyframe track measured over the whole
video (0 → 34 → 139 → 29 → 0 px). Keep it global: it spans many scenes.

---

### Pattern summary: which tool feeds which recipe

| Recipe | Measured with |
|---|---|
| word reveal | `segments.py` + `fit_easing.py` |
| camera push/whip | `segments.py` (word/pill edges per frame), zoom from widths |
| cursor | `track_blob.py` |
| click / pop | `track_region.py` |
| button through zoom-out | `flood_rect.py --seed-track` |
| labels | `segments.py --mode notcolor` + `measure_text.mjs` |
| arch letters | `components.py` |
| typing scroll | `scroll_profile.py` |
| fades/dissolves | `luma_stats.py` |
| squash & stretch | `flood_rect.py` |
| letterbox | `letterbox.py` |
