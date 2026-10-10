# 17 · Exercises (with answers)

Practice the method on this reference before using it on a new one. Each
exercise: a task, the tools to use, and the answer from this project to check
against. Do them in a copy of `examples/minimal/` (`cp -r examples/minimal examples/playground`)
so you don't break the main composition.

---

### E1 · Measure the Apple Pay pop (frames 99–104)
Find the scale of the black button on each frame.
*Tools:* `track_region.py --from 99 --to 104 --at 470,330 --tol 30`. *Answer:* heights 207, 231, 237, 239, 239, 239 →
scale 0.866, 0.967, 0.992, 1.0 (the code's `S` in `composition/scenes/03-montage.js` uses 0.8625, 0.9625, 0.9875, 0.996, 1 —
within one pixel).

### E2 · Identify the easing of "endless"
Track the left edge of "endless" on 385–400 and fit it.
*Tools:* `segments.py --box 0,300,1280,420 --mode dark --thr 200 --gap 11`, `fit_easing.py`.
*Answer:* exponential settle with r ≈ 0.72 (`09-nomore.js` WORDS).

### E3 · Find every montage cut and the click that goes with it
*Tools:* `scene_cuts.py`, `audio_onsets.py --highband 4000`.
*Answer:* cuts 99, 114, 124 … 222; clicks on the cut frame or one frame later.

### E4 · Rebuild the Gemini shot (154–159) in a playground scene
Background gradient, stars, hero button, icon, label, caption.
*Tools:* `sample_colors.py 156 30,60 640,60 30,650 640,650`, `flood_rect.py --from 156 --to 156 --seed 330,300`,
`segments.py --from 156 --box 330,285,955,440 --mode notcolor --color '#eceffe' --tol 70 --gap 6`.
*Answer:* gradient `#1E3A69 → #220E4D`, button `#ECEFFE` 306..976 × 248..471 r≈37, label ink
470..885 baseline 384, icon 383..462. Check with `compare_frames.py --frames 156`.

### E5 · Squash & stretch of the Voice player
Get scaleX/scaleY for 580–596.
*Tools:* `flood_rect.py --from 580 --to 596 --seed 560,420 --tol 12`, divide by 755 × 167.
*Answer:* `SQ` in `12-features.js`.

### E6 · Typing scroll curve
Recover the pan for 250–295.
*Tools:* `scroll_profile.py` with `--right` from the caret positions.
*Answer:* `05-typing-pan.txt` / `PAN` in `04-but.js` (0, 29, 44, 70, 159, 248, …, 2358).

### E7 · Fade timing of the ending
When does the fade start and how does opacity evolve?
*Tools:* `luma_stats.py --from 780 --to 869 --step 3`.
*Answer:* max luma 255 until 822, then ≈ linear to 0 at 869 → opacity keys in `17-logo.js`.

### E8 · Where does the "But…" footage come from?
*Tools:* compare a strip of frames 233–245 with all intro plates (R14 in the cookbook).
*Answer:* the intro footage, plate = frame − 232.

### E9 · Without looking at any image, describe frame 497
*Tools:* `describe_frame.py 497`, `components.py 497 --mask "(r>140)&(r-g>80)"`.
*Answer:* dark background, white "No more" bottom-left rotated, red letters of
"unnecessary" on an arch peaking at x≈651 y≈178 (the big C), white "costs" on the right,
grabbing cursor near the top of the arch.

### E10 · Fix a deliberately broken scene
In a copy of `09-nomore.js` change the decay ratio of "subscriptions" from 0.8 to 0.95,
render frames 391–400, and find the problem using only `segments.py --src ref/new`.
*Answer:* on 392–400 the NEW left edge of "subscriptions" stays to the right of REF and
converges much later; its per-frame deltas shrink by 0.95 instead of ~0.8.
