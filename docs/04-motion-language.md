# 04 · Motion language — as numbers

Motion designers talk in feelings ("snappy", "smooth", "whip"). Code needs
numbers. This document translates every motion used in the reference into
numbers you can measure and formulas you can type.

## 1. Think in frames

At 30 fps one frame = 33.3 ms. Every timing in this project is a frame index or
a duration in frames:

| Feel | Frames @30 | Example here |
|---|---|---|
| instant / cut | 0–1 | montage hard cuts |
| pop | 3–5 | Apple Pay button 0.86 → 1.0 in 4 frames |
| quick move | 6–10 | "But" letters rise and overshoot in ~9 frames |
| settle / reveal | 15–40 | intro words settle (half-life 6.6 frames, visible motion ~35 frames) |
| slow drift | 40+ | Life saver zoom-out 296–340 |

Write durations in frames in the code. Never in seconds or ms.

## 2. Recognise the easing from the deltas

Take a measured track (positions per frame) and look at the **per-frame
differences** (deltas). The pattern tells you the law:

| Delta pattern | Law | Formula |
|---|---|---|
| constant | linear | `v = a + s·f` |
| shrinking by a constant ratio r | exponential settle ("expo-out") | `v = T + A·r^(f−f0)` |
| shrinking then crossing zero, small opposite deltas, then 0 | overshoot (back-out / spring) | keyframes or `spring()` |
| growing | ease-in (acceleration: whips, exits, pushes) | `v = a + (b−a)·t^p` |
| grow then shrink | ease-in-out (whip with landing) | two segments: ease-in then expo-out |

`tools/fit_easing.py` does this fit for you and prints the JS.

### Real examples from this project

**Exponential settle — intro words** (`01-intro.js`). "We've" left edge:
359, 349, 343, 336, 330, 326, 321 … → deltas −10, −6, −7, −6, −4, −5 … → ratio
≈ 0.9 per frame. Code:

```js
const n = f - w.appear;                       // frames since the word appeared
const x = w.x + w.off * Math.pow(0.9, n);     // 10% of the remaining distance per frame
```

**Faster settle — "No more endless…"** (`09-nomore.js`): ratios 0.72–0.80, start
offsets 70–118 px: same law, snappier.

**Whip-in + settle — close-up camera** (`02-closeup.js`, `CAM_TX`):
270, 254, 218, 144, 87, 60, 42, 29, 19, 13, 8, 5, 3, 2 … 0 → deltas
−16, −36, **−74**, −57, −27, −18, −13, −10, −6 … accelerate for 3 frames, then
settle with r ≈ 0.7. Stored as per-frame keyframes with linear interpolation.

**Accelerating push — end of intro** (`01-intro.js`, `CAM`): scale 1.000, 1.004,
1.009, 1.015, 1.027, 1.043, 1.069, 1.114, 1.163 → deltas grow ~1.5× per frame:
ease-in into the cut. The cut happens at full speed — that is what makes a cut
feel like a "whip".

**Pop — Apple Pay** (`03-montage.js`): scale 0.8625, 0.9625, 0.9875, 0.996, 1.0 →
deltas 0.10, 0.025, 0.0085, 0.004 → r ≈ 0.25–0.33: a very fast settle.

**Overshoot — "But" letters** (`04-but.js`, `RISE`, offset in px below rest):
330, 141, 30, −33, −65, **−74**, −67, −54, −39, −30, −19, −7, −3, −1, 0.
The letter flies up through its rest position, overshoots by 74 px (22% of the
travel) at frame +5 and settles back by frame +13. This is a damped spring; it
was stored as keyframes because they reproduce the exact shape.

**Squash & stretch — Voice player** (`12-features.js`, `SQ`): scaleX/scaleY
0.82/0.81 → 0.88/1.26 → 0.80/0.88 → 1/1. Width and height move out of phase.

**Click — buttons**: scale 1 → 0.915–0.95 over 3–4 frames, then partial return
(`PILL_S` in `02-closeup.js`: 1, 0.995, 0.942, 0.915, 0.986).

## 3. Stagger

Things that appear "together" almost never appear on the same frame:

| Element | Stagger |
|---|---|
| intro words | 9, 18, 27, 35 — on voice-over syllables |
| "But" letters | 1 frame apart (227, 228, 229), dots 2 frames apart (232, 234, 236) |
| "No more endless ai subscriptions" | 382, 383, 385, 387, 391 |
| "And done (:" | 536, 537, 538 |
| "Voice" letters | 581, 582, 584, 585, 586 |
| footer © line | characters fade left→right over frames 5–17 |

Measure the first visible frame of every element. Do not assume an even stagger.

## 4. Opacity and blur on entry

Words do not just appear — they arrive soft and become sharp:

```js
const o = clamp(0.25 + n / 3.2);                 // intro words: 25% on the first frame, full by frame 3
const b = Math.max(0, 6 * (1 - n / 6));          // 6 px blur → 0 over 6 frames
```

Rule of thumb from this reference: **opacity reaches 1 in 2–4 frames, blur
clears in 3–6 frames, position keeps settling much longer** (20–40 frames).
That separation is what makes the reveal feel "premium".

## 5. Motion blur

A real camera smears moving things along their path during the shutter. On fast
frames the reference shows clear directional blur (whips, cursor flights, the
typing scroll). Model:

```
blur length ≈ k × (displacement during this frame)
```

| Where | k (std-dev of gaussian ÷ px moved) |
|---|---|
| close-up whip (camera) | 0.15 on the first frame, 0.3 after |
| typing scroll | 0.12 |
| costs exit whip | 0.3 |
| cursor | 0.2–0.9 (fast exits are smeared much more) |
| intro push | 0.12 |

Implementation (`docs/05-engine-api.md`): an SVG `feGaussianBlur` with a
different deviation in x and y (`makeAxisBlur()`), or rotated to the motion
direction (`makeMotionBlur()`). Use the displacement *into* this frame
(`v = pos(f) − pos(f−1)`) — that is the shutter interval that ends at the frame.
Skip blur below ~1–3 px/frame: tiny blur only makes things look soft.

## 6. Camera moves

A "camera" is a group transform applied to everything in the shot. Find the
**fixed point** of a zoom — the pixel that does not move between frames — and
use it as `transform-origin`:

* intro push: origin (750, 378) — the Button
* close-up: origin (642, 362)
* Pay once dive: origin (631, 360) plus a measured downward drift (`DROP`)

Measure scale from the width of something that does not change by itself (a
word): scale(f) = width(f) / width(rest).

## 7. Secondary motion (what makes it feel alive)

* "before" settles **a beat after** the camera (its own decay 0.89 starting at
  frame 62, `02-closeup.js`).
* "But…" drifts right by 85 px while the letters rise (`DRIFT`).
* The fire bubble wobbles (non-uniform border radius) for the first frames, then
  becomes a circle (`09-nomore.js`).
* The Higgsfield mark's colours cross-fade while it shrinks and blurs (`17-logo.js`, `mix`).

## 8. Timing to sound

Hard cuts land on click SFX (cut frame n, click peak n or n+1). Word reveals land
on voice syllables. When choosing between two plausible frames, use the audio
onset (`tools/audio_onsets.py`, `--highband 4000` for clicks).

## 9. Holds

Between moves things rest. The montage shots are 4–15 frames of almost static
picture — the energy comes from the cuts, not from motion inside the shots. Don't
add motion the reference doesn't have.
