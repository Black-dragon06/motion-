# 08 · Typography: matching type you don't have

## 1. Identify, then substitute honestly

The reference is set in **SF Pro Display / SF Pro Text** (Apple; not freely
redistributable). The recreation uses **Inter Display / Inter** (OFL, bundled in
`assets/fonts/`): closest metrics, same geometric-grotesque construction.
Differences that remain and that you must compensate for:

* Inter glyphs are slightly **wider** (≈ 5–8% for lowercase at display sizes).
* Inter cap height 0.727 em vs SF ≈ 0.705 em.
* Letter shapes (t, y, a) differ a little — unfixable, accept it.

Weights used: Regular 400 (body lines), Medium 500 (most display text),
SemiBold 600 (UI labels, arch letters), Bold 700 (emphasis words: "Button",
"This", "That", "endless", "And done", "Higgsfield").

## 2. Measure ink, not boxes

A text element's CSS box (line height, side bearings) is invisible. What you can
measure in the reference is **ink**: the leftmost/rightmost/top/bottom pixels of
the letters (`segments.py`). So all placement is done in ink coordinates:

* `left`, `right` = ink extent of the run
* `baseline` = bottom of letters without descenders (B, u, t, o, n…)
* cap top = top of capitals; x-height = top of lowercase

## 3. Choose the font size

```
size = reference_cap_height / font_cap_ratio        (Inter Display ≈ 0.727)
```

then confirm with the width: `node tools/measure_text.mjs '[["Button","700 133px \"Inter Display\""]]'`.

| Text | Reference ink | Chosen font | Measured ink |
|---|---|---|---|
| close-up "Button" | 442–841 (399 px), cap 95 | Inter Display Bold 133 px | 397 px, ascent 97 |
| intro "We've" | 283–404, cap ~32 | Inter Display Medium 44 px | 119 px advance |
| montage labels | e.g. "Get Gemini" 470–885 | Inter Display Medium 88 px | fitted per label |
| typed line | cap 238 (241→479) | Inter Display Medium/Bold 328 px | glyph boxes remapped |

If height matches but width doesn't → the typeface is narrower/wider → correct
with **scaleX only**. If both are off by the same factor → the size is wrong →
change the size (or scale uniformly).

## 4. placeText — measured box in, positioned text out

```js
placeText(node, [['Upgrade ', '500 88px "Inter Display"'], ['This', '700 88px "Inter Display"']],
          { left: 370, right: 909, baseline: 384 });
```

What it does (`composition/lib/core.js`):

1. creates one `inline-block` span per run (mixed weights/colours in one line);
2. measures the runs' ink with canvas `measureText` (`actualBoundingBoxLeft/Right`);
3. `k = (right − left) / inkWidth`;
4. `uniform: 'auto'` → if |k − 1| ≤ 0.1 scale **x only** (clamped to ±20%), else scale both axes;
5. translates so ink-left lands on `left` and the baseline (`baselineOffset(font)`) lands on `baseline`;
6. logs `[text, k]` to `window.__fitLog`.

`node tools/fit_log.mjs` prints every fit with |k − 1| > 0.08. A long list means
base font sizes were guessed — fix the sizes. (In this project the final list has
27 of 69 entries > 0.1, mostly small UI texts where the uniform fit is fine.)

## 5. Baselines in the DOM

`baselineOffset(font)` inserts a probe `inline-block` into a `line-height:1` div
and reads its `offsetTop`: the distance from the top of the text box to the
baseline. Use it to place by baseline:

```js
node.style.top = (BASELINE - baselineOffset('500 44px "Inter Display"')) + 'px';
```

Never hard-code `0.8 * fontSize` — it differs per font and weight.

## 6. Long lines drift — anchor glyphs

Width errors accumulate along a line. The typed line "But, what if one Button"
is ~3200 px long in document space; with Inter's advances the end drifted
20–45 px from the reference. Fix (`04-but.js`): measure the ink box of each glyph
in the reference (doc space = screen x + pan), place each glyph's ink on its
measured box with its own `scaleX`; glyphs that couldn't be measured (occluded by
the caret) are interpolated between measured neighbours at 92% of their natural
width. Same idea for any long line or per-letter animation: **anchor to
measurements, don't trust advances.**

## 7. Glyph centres for rotated letters

When letters rotate around their centre (the arch in shot 10), the rotation
pivot must be the **ink centre**, which is not the centre of the CSS box (the
box includes ascender/descender space). `10-costs.js` computes each glyph's ink
centre with `inkMetrics()` and shifts the glyph so its ink centre sits on the
200×200 box centre that the transform rotates around.

## 8. Small text

Captions (`[ Simple Button ]`, 11.5 px Inter Text, ~78% white): match position by
baseline (671) and centre; opacity was raised from 0.55 to 0.78 after comparing
(thin text looks lighter after JPEG/scaling).

## 9. Text effects seen in the reference

| Effect | How |
|---|---|
| soft shadow under white text on footage | `text-shadow: 0 1px 6px rgba(0,0,0,.22)` |
| chromatic aberration on white letters (costs) | two coloured `text-shadow`s ±3 px (red / cyan) |
| blur-in | `filter: blur(npx)` decreasing |
| motion-blurred text | SVG anisotropic blur (`makeAxisBlur`) |
| italic "Pure" | `italic 400` Inter Display |
