# 12 · Build journal — the whole project in order

What actually happened, step by step, including what went wrong. Use it to see
how the workflow plays out in practice and how long things take.

## Day 1 — analysis

1. **Probe** the upload: 1280×720, 30 fps, 870 frames, 29 s, AAC. Copied it to
   `reference/reference.mp4`, extracted all frames as JPG.
2. **First look**: a 6×10 contact sheet at 2 fps of the whole video, then sheets
   of every 2nd frame per ~2.4 s. Wrote down what happens with frame numbers.
3. **Cuts**: ffmpeg `scene` filter, then a 160×90 frame-difference scan — the latter
   became `tools/scene_cuts.py`. Found the 19-shot montage (99–226) and the motion spans.
4. **Audio**: onset detection per video frame + spectrogram → words land on VO
   syllables, cuts on clicks.
5. **Per-shot study** at full resolution: grids of key frames for every shot
   (intro, close-up, each montage button, But…, typing, Life saver, style
   flashes, No more, costs, Pay once, Video/Voice/Image/Motion, logo).
6. **First measurements**: word columns per frame in the intro, letterbox bounds
   for the whole video, button geometry of every montage shot (all heroes share
   306–976 × 248–471, radius ~37), colours of every fill/background.
7. **Brief**: wrote `BRIEF.md` (Russian) with the timing map, palette,
   typography, UI kit, letterbox table, motion language and a per-shot breakdown.

## Day 1 — engine

8. `composition/lib/core.js` (easing, `kf`, DOM helpers, blur filters), `main.js` (scene
   registry, letterbox, `__seek`, preview), `render.mjs` (Playwright → ffmpeg),
   stub scenes. Tested: 6 frames rendered as JPG.

## Day 1 — scenes

9. **Intro (0–55).** Built plates first: `extract_plates.py landscape` masks the
   words, pill, footer, cursor and window ring and inpaints them. First mask
   left traces of the footer and cursor → widened masks. Words: per-frame
   columns → exponential settle r = 0.9. **First cursor** (generic macOS hand,
   40 px) looked wrong → traced the reference cursor on a 4× crop of frame 81
   (`docs/images/proto-cursor-trace.jpg`), added `cursor.center()` because the
   measured track is the glove centre. Removed an invented 12° tilt.
10. **Close-up (56–98).** Measured pill edges, text columns, cursor, hover-glow
    colours per frame. Pill 349–936 × 256–469 with a dark lip; label Inter Display
    Bold 133 px. Camera whip as per-frame `CAM_TX`/`CAM_S`. First background:
    intro plate scaled ×2 + a haze gradient (looked plausible, **scored 17** —
    fixed later). "before" settles a beat after the camera (separate decay).
11. **Montage (99–226).** Measured all 19 shots (hero rect, label ink boxes, icon
    boxes, background colours, grid cell geometry, ribbon path, Kling blob radius,
    Luma ring rects, Sora/OpenAI icon scale per frame). Built a shot registry with
    helpers. Plates only for 4 photographic shots. Prototyped the OpenAI knot in
    6 variants over the crop (`docs/images/proto-openai-knot-variants.jpg`), Runway R
    from a crop. Raised caption opacity 0.55 → 0.78.
12. **But… + typing (227–295).** Measured letters per frame (rise curve with a 74 px
    overshoot, 1-frame stagger), the card rect per frame as it shrinks into the
    caret, caret x per frame, typing events (which character appears on which
    frame), and the scroll per frame by column-profile matching (became
    `tools/scroll_profile.py`). First typing background: 3 animated radial blobs.
13. **Life saver / styles / Higgsfield (296–388).** Flood-filled the button rect on
    every frame (fixed 341, 347–350 by hand), lifted the Creation-of-Adam plates
    with the button painted out, built a per-frame look table for the style flashes
    and a label cross-fade.
14. **No more endless (382–452).** Per-word decays, the fire bubble as a measured
    (right, top, radius) track with a blob phase, cursor track.
15. **Costs (453–509).** Connected components of red and white letters on frames
    453 and 497 → two poses per glyph; plates with circles painted out around
    every glyph. **Bug:** letters scattered across the frame — a DOM node stored as
    `g.t` replaced the glyph's text (P5). After the fix, glyphs centred on their ink.
16. **Pay once (510–559).** Words, swoosh reveal tied to the cursor, zoom measured
    from the width of "Pay once,". **Bug:** text looked condensed — font sizes
    65/72 px were too big and the x-only fit squashed them (P13) → `placeText`
    `uniform: 'auto'`.
17. **Features (560–690).** Lifted collage plates; tried to measure the titles
    automatically on the black card → too noisy, wrote the title tracks by hand
    from the measurements (`composition/data/titles.js`). Voice player: flood-filled pill per
    frame → squash & stretch table; "Voice" letters as spans of one fitted word.
18. **Logo (690–869).** Measured the line → plaque growth, the words, the colours
    on light and black; traced the squiggle (23 points); colour inversion during
    the dark transition; lockup; final fade from max luma.

## Day 1 — QA rounds

19. **First full render + score: 5.47.** Worst blocks: close-up (17.4), But…
    (19.8), typing (19.5).
20. Diff heat maps showed the hills texture glowing everywhere in the close-up →
    wrong background. **Lifted close-up plates** from frames 56–98 (text band
    painted out). Close-up 17.4 → 9.6.
21. **Typing**: column comparison showed our glyphs drifting right by 20–45 px →
    remapped every glyph onto its measured box (P15). Lifted typing plates
    (gradient behind the text). **Bug:** some plates came out black — the mask
    `lum < 195` covered entire dark frames (P10) → per-range thresholds. Typing 19.5 → 6.5.
22. **But…**: matched its hills against the intro plates → same footage, offset
    232 frames. Card-to-caret: content blur/contrast, darkening schedule, dark
    window background (P12). But… 19.8 → 15.8.
23. Close-up: removed an invented whip on frame 98 (reference is sharp there),
    lowered blur on 56–57. Intro: faster word opacity, less push blur.
24. Features: the "Motion" whip frames 617–621 doubled the title (P11) → kept the
    plate untouched there. Bubble emoji smaller. Tagline blur during the dark
    transition; logo colour-mix timing.
25. **Final: 4.23.** Rendered 1080p with audio, built the side-by-side video,
    committed and pushed.

## Day 2 — making it teachable

26. Ported every analysis snippet into `tools/` with CLI arguments and docs; added
    tools for text-only agents (`ascii_frame.py`, `describe_frame.py`), easing fit,
    keyframe emission, scroll profiles, brightness stats, high-band click detection.
27. Regenerated every key measurement into `analysis/measurements/` with the
    command and the code location in each file; contact sheets and compare sheets
    per block; cuts, onsets, letterbox, scores as JSON.
28. Wrote `docs/`, templates, examples, `AGENTS.md`, `Makefile`.

## What made the biggest difference (in order)

1. Lifting footage instead of approximating it.
2. Measuring every frame of fast motion instead of start/end only.
3. Comparing REF/NEW on the same frames after every change.
4. Anchoring text to measured ink boxes.
5. Tracing shapes (cursor, logo) over zoomed reference crops.
