# 16 · Worked example — building the intro (frames 0–55) from zero

This walks through one complete scene exactly as it was built: every command,
its real output, the decision it led to, and the code it became. Do the same
for any scene of any video.

Final code: `composition/scenes/01-intro.js`. Final score of the block: 5.8.

---

## Step 1 — Look at every frame

```bash
python3 tools/contact_sheet.py --from 0 --to 55 --cols 8 --width 240 --out .cache/intro.png
```

Notes written from the sheet (with frame numbers — always):

```
0–8   defocused hills, camera drifting forward, nothing else
9     "We've" appears, faint + blurred, moving left
18    "all"   27 "pressed"   35 "this"     (each one: fade + blur + slide left, long settle)
5–17  "© All Rights Reserved By MosyCreate." types in at the bottom centre
19–28 thin white rounded frame grows in from the screen edges to a 15/10 px inset
20    hand cursor enters bottom-left, travels right under the words
49–55 blue pill "Button" fades in after "this"; whole line accelerates toward it (camera push)
50    letterbox starts growing (continues in the next shot)
```

## Step 2 — Inventory

| Layer | Class | Plan |
|---|---|---|
| hills footage | LIFT | plates 000–055 with all graphics painted out |
| 4 words | DRAW | measured settle |
| pill "Button" | DRAW | colour/opacity ramp |
| © footer | DRAW | per-character sweep |
| window frame | DRAW | bordered div, inset per frame |
| cursor | DRAW | traced hand, per-frame track |
| letterbox | DRAW | global layer in main.js |

## Step 3 — Plates

`python3 scripts/extract_plates.py landscape` — for each frame: mask = (pixels
brighter than the inpainted band by > 9 in the text band) ∪ (blue pill pixels) ∪
(footer pixels) ∪ (cursor box from the bright blob) ∪ (window ring), dilated, then
push-pull inpaint. First version left faint footer and cursor ghosts → widened the
footer band and the cursor box (+20/+24 px). Check: `docs/images/plates-before-after.jpg` row 1.

## Step 4 — Words: when, where, how

```
$ python3 tools/segments.py --from 8 --to 55 --box 150,330,1010,420 --mode bright --thr 185 --gap 14
 9 cols [(410, 416), (473, 483)]
10 cols [(359, 415), (434, 473)]
…
45 cols [(283, 404), (420, 460), (483, 639), (672, 741)]  rows [(356, 396)]
```

* Appear frames from the first frame each word has ink: **9, 18, 27, 35**.
* Left edges on frame 45 (last frame before the push): **283, 420, 483, 672**.
  The later words are *still settling* on 45, so the final x is not the frame-45
  value: `final = x45 − off · 0.9^(45 − appear)`. "this" appeared on 35 →
  remaining 81 · 0.9¹⁰ = 28 px → final 672 − 28 ≈ 642 (ink-left ≈ element left
  for these glyphs, ±1 px). Same for "pressed" (483 − 11 = 472), "all"
  (420 − 5 = 415), "We've" (283 − 2 ≈ 282).
* Baseline: rows of "We've" alone →

```
$ python3 tools/segments.py --from 45 --box 270,330,410,420 --mode bright --thr 185 --gap 14
45 cols [(283, 404)]  rows [(356, 389)]          # bottom of 'W','e','v' = baseline ≈ 388
```

* Font: reference "We've" ink 283–404 = 121 px, cap 356→388 = 32 px.

```
$ node tools/measure_text.mjs '[["We’ve","500 44px \"Inter Display\""]]'
We’ve | 500 44px "Inter Display" | 119.1 | 0 | 118.2 | 118.2 | 33 | 1
```

  Inter Display Medium 44 px: ink 118 px, cap 33 px → match (ratio 1.02). Use it.

* Easing: left edge of "We've" per frame →

```
$ python3 tools/fit_easing.py "10:359 11:349 12:343 13:336 14:330 15:326 16:321 17:318 18:315 19:312 20:309 22:304 26:297 30:291 40:284 47:283"
  rmse 0.87   exp   r=0.901  target=281.7  start_offset=75.5  (half-life 6.6 frames)
```

  → `x = final + off * 0.9^(f − appear)`; per-word offsets from the first frame:
  83, 89, 75, 81.

```js
const WORDS = [
  { t: 'We’ve', x: 282, appear: 9, off: 83 },
  { t: 'all', x: 415, appear: 18, off: 89 },
  { t: 'pressed', x: 472, appear: 27, off: 75 },
  { t: 'this', x: 642, appear: 35, off: 81 },
];
```

* Opacity/blur: on the contact sheet the word is ~25% visible and blurred on its
  first frame, fully opaque by the 3rd, sharp by the 6th → `o = 0.25 + n/3.2`,
  `blur = 6·(1 − n/6)`.

## Step 5 — The camera push (47–55)

Word edges keep moving left even after settling — the whole line scales around a
fixed point near the Button. Left edge of "We've":

```
47: 283   50: 275   51: 270   52: 262   53: 250   54: 230   55: 204
```

With the fixed point at x = 750 (the pill), scale = (750 − x(f)) / (750 − 283):
53 → 1.071, 55 → 1.169. Keys `CAM`: 1, 1.004, 1.009, 1.015, 1.027, 1.043, 1.069,
1.114, 1.163 (deltas grow → ease-in, the cut lands at full speed).
Horizontal blur from the camera-induced velocity × 0.12 on frames ≥ 50.

## Step 6 — The pill

```
$ python3 tools/sample_colors.py 52 736,388,1 862,370,1 800,365,1
736,388  #487b96 …        # frame 50–55: teal→blue as the pill fades in over the hills
$ python3 tools/sample_colors.py 55 736,388,1
736,388  #315ca8
```

Pill box from the blue mask on 52–55: x 728–871, y 358–399 → div at 729,359,
137×39, radius 5, `#2F5BA8`, label Inter Display SemiBold 26 px. Opacity keys
0 → 1 over 49–55 linear.

## Step 7 — Footer, ring, cursor

* Footer: characters appear left→right between ~5 and ~17 → per-char opacity with
  `t0 = 5 + i/len·12`, ramp 2.5 frames. Inter Text Medium 15 px, centred, baseline 697.
* Ring: brightest row near the top edge per frame (inset 0 → 15/10 px over 19–28):

```python
col = im[0:40, 640].sum(axis=1); top = argmax(col)      # ring is the brightest thin line
row = im[360, 0:40].sum(axis=1); left = argmax(row)
```

  → `RING` keys, a div with `border: 1.6px solid rgba(255,255,255,.92); border-radius: 40px`.
* Cursor: `track_blob.py --from 20 --to 55 --box 20,410,1260,684 --thr 205` → glove
  centre per frame → `CUR`; `cursor.center(x, y, {vx, vy})` with blur 0.25 × velocity.
  Size 50 px chosen by overlaying on frame 38 (`frame_grid.py --crop 260,390,380,500 --scale 4`).

## Step 8 — Assemble and compare

```bash
tools/qa.sh .cache/qa-intro.png 0.5 3 12 30 44 52 54 55
python3 tools/score.py --from 0 --to 55
```

Iterations that happened:

1. Cursor too small/wrong shape → traced cursor, `center()` helper.
2. Words at 54–55 too blurred → push blur factor 0.32 → 0.12.
3. "pressed" too dim on its first frames → opacity ramp `n/5` → `0.25 + n/3.2`.

Numeric check that the layout is right (no vision needed):

```
REF 45 cols [(283, 404), (420, 460), (483, 639), (672, 741)]
NEW 45 cols [(284, 401), (422, 459), (486, 636), (671, 738)]
```

Done: block score 5.8, the remaining difference is mostly glyph shape (Inter vs SF)
and the inpainted plate texture.
