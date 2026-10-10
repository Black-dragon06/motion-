# 03 · Measurement cookbook

Twenty recipes. Each one: the question, the command, real output from this
project, how to read it, and where the number went in the code. All outputs are
reproducible with `bash analysis/measurements/run_all.sh`.

General rules:

* **Measure on the reference frames, never on a resized screenshot.**
* Prefer **ink boxes** (where pixels actually are) over guesses about font boxes.
* Measure **every frame** of a motion, not just start and end. Interpolating
  between per-frame measurements is exact; inventing a curve is not.
* When a tool's answer jumps suspiciously on one frame (leak, occlusion, blur),
  look at that frame and fix the value by hand. Write down that you did.

---

## R1 · Exact colour of a flat area

```
$ python3 tools/sample_colors.py 81 640,300 640,440 900,440
640,300  #305ca5  rgb(48,92,165)
```

Sample the middle of flat areas, 2–4 px radius, away from text and edges. For
"what is the brand lime?" take the median of a mask:

```
$ python3 tools/sample_colors.py 740 --median-mask "(g>150)&(b<100)&(g-b>80)"
median of 7299 px: #aad71c
```

→ `composition/scenes/02-closeup.js` button `#305CA5`; `17-logo.js` squiggle `#AAD71C`.

## R2 · A colour that changes over time (glow, grade)

`analysis/measurements/02-hover-glow.txt` — four points sampled every 4 frames:

```
64  700,440 #305ca5   600,440 #305ca5   500,440 #305ca5
76  700,440 #3165b1   600,440 #3060a8   500,440 #305ca5
88  700,440 #248fef   600,440 #2c82dc   500,440 #3067b7
96  700,440 #1697f4   600,440 #2095f5   500,440 #317fd8
```

Read it: a light blue `#1697F4` spot starts near the fingertip (700,440) around
frame 72, grows outward (500,440 starts changing at 84) and peaks at 96. →
radial gradient whose radius and alpha ramp from frame 70 to 96 with `inOutSine`,
centred on the fingertip (`02-closeup.js`, `glow`).

## R3 · Animated letterbox

```
$ python3 tools/letterbox.py --from 50 --to 80 --step 10
  50  top   2  bottom 718
  60  top  18  bottom 701
  70  top  32  bottom 687
  80  top  34  bottom 685
```

The bars are a separate layer animated by keyframes over the whole video
(`composition/main.js`, `BAR`). Full per-frame values: `analysis/letterbox.json`.

## R4 · Word positions over time (the workhorse)

`analysis/measurements/01-intro-words.txt`:

```
$ python3 tools/segments.py --from 8 --to 55 --box 150,330,1010,420 --mode bright --thr 185 --gap 14
 9 cols [(410, 416), (473, 483)]            <- first faint pixels of "We've"
10 cols [(359, 415), (434, 473)]
11 cols [(349, 467)]
…
45 cols [(283, 404), (420, 460), (483, 639), (672, 741)]   <- 4 words: We've, all, pressed, this
```

Choose `--gap` ≈ half a word space so letters merge into words but words stay
separate. From this you get per word: **first visible frame** (9, 18, 27, 35),
**left edge per frame**, **settled left edge**. Text rows (356–396 at frame 45)
give cap-top and baseline.

## R5 · Which easing law? Fit it

`analysis/measurements/01-intro-word-fit.txt`:

```
$ python3 tools/fit_easing.py "10:359 11:349 12:343 13:336 14:330 15:326 16:321 17:318 18:315 19:312 20:309 22:304 26:297 30:291 40:284 47:283"
  rmse   0.87   exp   r=0.901  target=281.7  start_offset=75.5  (half-life 6.6 frames)
  rmse   2.26   pow   p=3.61  from 359.0 @ 10 to 283.0 @ 47
```

Exponential settle wins: each frame the word covers 10% of the remaining
distance. Code: `x = final + offset * 0.9 ** (f - appear)` (`01-intro.js`). The
same law with different ratios (0.72–0.8) drives the "No more…" words
(`09-nomore.js`).

## R6 · Cursor path

```
$ python3 tools/track_blob.py --from 20 --to 55 --box 20,410,1260,684 --thr 205
36 bbox x 278-312 y 424-464  centre 295,444  px 472
…
```

The glove is the brightest near-neutral blob. Exclude areas with white text from
the box. The **centre** track goes into `CUR`; the cursor component converts
centre → fingertip (`cursor.center()`), because the reference cursor is drawn
around its hotspot (the fingertip), not its centre.

## R7 · Scale animation of a button (pop, click squash)

`analysis/measurements/03-applepay-button.txt` (black Apple Pay button):

```
99 x (341, 553) y (256, 463)
100 x (308, 543) y (244, 475)
101 x (299, 540) y (241, 478)
103 x (294, 539) y (240, 479)       <- rest size
105 … 110 shrinks again             <- click
```

Height 207 → 231 → 237 → 239: scale = height / rest height → 0.866, 0.967, 0.992,
1.0 (code: 0.8625, 0.9625, 0.9875, 0.996, 1) … then down to 0.95 on the click (frame 110) (`03-montage.js`, Apple Pay `S`). Use the dimension
that is not cut off by the frame or overlapped by the cursor.

## R8 · A moving object's rectangle (flood fill + seed track)

`analysis/measurements/06-lifesaver-rects.txt`:

```
$ python3 tools/flood_rect.py --from 296 --to 381 --seed-track "296:488,300 305:392,300 …"
299 {'color': '#3763aa', 'l': 423, 'r': 669, …}   <- a light sweep crosses the button: fill stops early
341 {'color': '#825538', 'l': 319, 'r': 944, …}
349 {'color': '#dbb27c', 'l': 16, 'r': 1010, …}   <- LEAK: oil-paint style, button merges with background
```

Flood fill is robust for flat shapes but **check the `area` column for jumps**.
Fix bad frames by hand from neighbours or known geometry: here the button has a
fixed width of 670 until frame 332, so `r = l + 670`; frames 341 and 347–350 were
set manually (`composition/data/lifesaver.json`). The extraction script writes the
final per-frame rects into `composition/data/lifesaver.js`.

## R9 · Text on a flat button: ink box of the label

`analysis/measurements/03-labels.txt`:

```
$ python3 tools/segments.py --from 156 --box 330,285,955,440 --mode notcolor --color "#eceffe" --tol 70 --gap 9
156 cols [(383, 600), (625, 818), (828, 885)]  rows [(314, 393)]
```

`notcolor` = everything that is not the button colour. First run = the Gemini icon
(383–462 when split with a smaller gap), then the words. → `textL`/`textR` for
`placeText()`, baseline from the bottom row of letters without descenders (384
for all montage labels).

## R10 · Font size from a measured word box

Measure the reference ink width of a word, then measure the same word in your
font:

```
$ node tools/measure_text.mjs '[["Button","700 133px \"Inter Display\""]]'
Button | 700 133px "Inter Display" | 410.2 | 7 | 404.3 | 397.3 | 97 | 2
```

Reference "Button" ink: 442–841 = 399 px, cap height 314→409 = 95 px.
Inter Display Bold 133 px: ink 397 px, ascent 97 → match. If the width ratio
differs from the height ratio the typeface is narrower/wider: keep the size from
the height and fix the width with `scaleX` (`docs/08-typography.md`).

## R11 · Letters scattered on an arc

`analysis/measurements/10-costs-red-497.txt`:

```
$ python3 tools/components.py 497 --box 0,110,1230,560 --mask "(r>140)&(r-g>80)"
  centre  484, 321  bbox x 465-507 y 297-343  w  42 h  46   <- 'u'
  centre  517, 252  bbox x 492-543 y 226-283  w  51 h  57   <- 'n' (big)
  centre  573, 247  …                                       <- 'n'
```

Each connected component ≈ one glyph. Sort by x to recover the word order. Per
glyph store centre, size (from height) and rotation (eyeballed from the contact
sheet or from the orientation of the bbox). Do it on two frames (453 start, 497
settled) and interpolate: `composition/data/costs.json`.

## R12 · Scroll / pan curve

`analysis/measurements/05-typing-pan.txt`:

```
$ python3 tools/scroll_profile.py --from 250 --to 295 --box 0,250,1280,470 --right "250:234 …"
251 shift 29 pan 29
252 shift 15 pan 44
254 shift 89 pan 159          <- fast scroll between typed glyphs (motion-blurred)
…
295 shift 29 pan 2358
```

The typed line moves left so the newest letter stays next to the caret.
Comparing column darkness profiles between consecutive frames gives the shift;
the cumulative sum is the pan in document coordinates (`04-but.js`, `PAN`).
`--right` excludes the moving caret from the comparison.

## R13 · Is the background moving? (one plate or one per frame)

```
$ python3 tools/phase_shift.py 64 --to 68 72 --box 0,560,1280,680
64 -> 68:  dx 0  dy 2   peak 0.160   meandiff 18.8
```

Small shift but a high mean difference → the footage itself changes (flowers,
parallax, flying camera). Decision: **one plate per frame**, lifted from the
same frame of the reference (`docs/07-plates-and-inpainting.md`). A static
background would show ~0 shift and a tiny meandiff → one plate is enough.

## R14 · Find where a moving background came from

The "But…" shot (227–249) shows the same hills as the intro. Matching an
unoccluded strip against all intro plates:

```
236 best plate 4 (8.5)      239 best plate 7 (9.7)      242 best plate 10 (15.2)
```

→ the "But…" shot reuses the intro footage with an offset: plate = frame − 232
(`04-but.js`). Always try to reuse clean footage before inpainting heavily.

## R15 · Grid geometry

`analysis/measurements/03-grid-cells.txt` — one row of a rounded-cell grid:

```
172 cols [(0, 268), (281, 951), (965, 1279)]
174 cols [(0, 252), (266, 936), (950, 1279)]
177 cols [(0, 230), (243, 913), (926, 1279)]
```

Cell width 671, gap 13 px; the top row moves −7.67 px/frame. Middle and bottom
rows measured the same way → `hgrid()` rows with `x0` and `v` (`03-montage.js`).

## R16 · Path of a ribbon / stroke

`analysis/measurements/03-copilot-ribbon.txt` — one-pixel-wide boxes every 40 px:

```
x=0 rows [(365, 546)]   x=40 rows [(267, 399)]   x=80 rows [(193, 295)] … x=240 rows [(80, 128)]
```

The centre of each span is a point on the stroke's centre line; the span height
is the stroke width divided by |sin(angle)|, so at the top of the arc (x=240,
nearly horizontal) the span height ≈ the true width (48 px → stroke-width 47).
Points → cubic Bézier path `FRONT` in `03-montage.js`.

## R17 · Camera zoom from text width

`analysis/measurements/11-payonce-dark.txt`: "Pay once," spans 414–623 at rest
(width 209). On frame 548 it spans 241–615 → width 374 → zoom = 374 / 209 ≈ 1.78.
With the zoom centre c = 631: a screen x maps back to layout x as
`x = c + (X − c) / zoom` — used to recover the "And done (:" positions measured
while zoomed (`11-payonce.js`, `ZOOM`).

## R18 · Fades and dissolves from brightness

`analysis/measurements/18-fade.txt` — final fade:

```
frame   mean   max   p99
  816    6.0   255   253
  828    5.1   231   202
  846    3.0   142   114
  864    0.8    36    28
```

opacity = max / 255 → `root.style.opacity` keys 822→869 (`17-logo.js`).

`analysis/measurements/08-higgsfield-fade.txt` — dissolve to grey:

```
352  mean 177 std 15.8 sat 84.9      <- warm photo
358  mean 149 std 19.5 sat  8.0      <- b/w grade done (saturation collapsed 352->358)
376  mean 199 std  7.1               <- texture fading
388  mean 228 std  0.3               <- flat #e4e4e4
```

Saturation tells you when the grade happened; std (texture) tells you the
dissolve progress: alpha = 1 − std / std₀.

## R19 · Squash & stretch

`analysis/measurements/12-voice-pill.txt`:

```
580 l 330 r 949 t 292 b 427      -> 619 x 135
581 l 315 r 964 t 270 b 450      -> 649 x 180
583 l 308 r 971 t 254 b 463      -> 663 x 209
```

Divide by the rest size (755 × 167 at frame 596) → scaleX/scaleY per frame
(`12-features.js`, `SQ`): 0.82×0.81 → 0.88×1.26 (stretch) → 0.80×0.88 (squash)
→ 1×1. Height and width do not move together — that *is* squash & stretch.

## R20 · Appearance timing and blur amount

* First visible frame = first frame where the element's mask is non-empty in
  `segments.py` output (e.g. "pressed" on 27).
* Blur amount: look at the width of the edge ramp. A sharp edge goes from
  background to ink in 1–2 px; on a blurred word the ramp is 6–12 px. At
  30 fps a motion-blurred object smears roughly `speed × shutter`; this project
  uses blur ≈ 0.12–0.3 × the per-frame displacement (`docs/04-motion-language.md`).
