# 09 · The QA loop — compare, score, fix the biggest thing

The reference is the spec. Quality = closeness to the reference, judged on
**the same frames, side by side**, and measured with a number.

## The loop

```
1. pick 4–8 frames of the scene you are working on (rest pose + key motion frames + both cut edges)
2. tools/qa.sh .cache/qa.png 0.5 4 <frames>          # renders only those frames, REF over NEW
3. look: what is the single biggest difference?      # layout > timing > colour > blur > detail
4. measure that thing in the reference (tools/*), fix the code
5. repeat until the scene looks the same; then score the whole scene
```

Rendering 4 frames takes ~3 s; a full 720p render ~35 s. Never re-render the
whole video to check one change.

## Reading a REF/NEW sheet

`tools/compare_frames.py` puts the reference tile on top and ours directly
below with the same scale. Look for, in this order:

1. **Missing or extra elements** (a title doubled, a bubble missing).
2. **Layout**: positions and sizes. Draw an imaginary vertical line through a
   letter edge in both tiles.
3. **Timing**: element present in one tile and not the other on the same frame
   → appearance frame wrong.
4. **Colour / brightness** of large areas.
5. **Blur / softness**, shadows, small details.

## The heat map

```bash
python3 tools/diff_heatmap.py --frames 230 240 256 270 --out heat.png
```

`docs/images/heatmap-example.jpg` is a real one from mid-project:

* bright **outlines of letters** = text in a slightly different place (offset);
* **doubled outlines** = same object at two positions;
* bright **filled regions** = wrong colour/content (the hills texture in the
  close-up glowed everywhere → wrong background source → replaced by lifted
  plates, score 17.4 → 9.6);
* the numbers printed (top / bottom / centre) catch letterbox errors instantly.

## The score

```bash
make frames-new                    # or: node scripts/render.mjs --frames .cache/frames/new --scale 1
python3 tools/score.py --top 10
```

Mean absolute RGB difference on 320×180 thumbnails, per frame, per block
(`analysis/segments.json`). Thumbnails forgive sub-pixel offsets and JPEG noise
but punish layout, colour and timing errors.

| Score | Meaning |
|---|---|
| < 3 | indistinguishable at normal viewing |
| 3–6 | same picture, small differences (font shape, blur amount, particles) |
| 6–12 | visible detail differences (offset text, wrong shape) |
| > 12 | wrong content or wrong timing on this frame |

Use it to **prioritise**: work on the block with the highest mean, look at its
worst frame. Score history in this project:

| Stage | Whole video |
|---|---|
| first complete render | 5.47 |
| close-up + typing on lifted plates, typing glyph remap, "But…" footage mapping | 4.54 |
| card/caret fixes, Motion whip kept in plate, bubble/tagline tweaks | 4.24 |
| final | **4.23** (per block 1.7 – 15.8, `analysis/score_report.txt`) |

## Don't trust the number alone

* A frame can score well and look wrong (a small but important element missing
  on a large flat background). Always also look.
* A frame can score badly because of **one-frame timing** at a cut (the whole
  picture is different). Check cut frames explicitly.
* Generated textures (particles, stars) never score 0 — don't chase them.
* Over-blur scores better than a sharp offset. Don't add blur to cheat the metric.

## Final review

```bash
make render && make compare          # out/compare_side_by_side.mp4
```

Watch the stacked video at full speed, then scrub through it. Motion problems
(stutter, wrong easing feel, a pop) are often only visible in motion.
