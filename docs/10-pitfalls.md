# 10 · Pitfalls — every bug hit in this project and its fix

Read this before debugging. Each entry: **symptom → cause → fix → how to avoid**.

### P1 · Text in the wrong place / wrong width on the first render
**Cause:** text measured (canvas `measureText`, `offsetTop`) before the web font
loaded → fallback-font metrics. **Fix:** `window.__ready` awaits
`document.fonts.load()` for every weight + image decode, then runs every scene's
`prepare()`. Measure text only in `prepare()` or later.

### P2 · Fonts / modules don't load in headless Chromium
**Cause:** `file://` URLs — ES modules and `@font-face` are blocked.
**Fix:** serve the repo over a local HTTP server (`render.mjs`, `tools/_browser.mjs`).

### P3 · Motion blur is cut off with a hard edge
**Cause:** SVG filter region defaults to the element's bounding box + 10%; a
40 px smear gets clipped. **Fix:** `filterUnits="userSpaceOnUse"` with a huge
region (`x=-4000 y=-4000 width=8000 height=8000`) in `makeMotionBlur` / `makeAxisBlur`.

### P4 · `transform` on a span does nothing
**Cause:** transforms don't apply to `display:inline` elements. **Fix:**
`placeText()` makes every run span `display:inline-block`; the Voice letters
animate their spans with `translateY`.

### P5 · Letters of the arch scattered all over the frame
**Cause:** the inner element was stored as `g.t`, overwriting the glyph text
property `t`; `inkMetrics([[g.t, FONT]])` then measured the string
"[object HTMLDivElement]" → huge offsets. **Fix:** name it `g.inner`.
**Avoid:** never reuse a data field name for a DOM node.

### P6 · `ReferenceError` on load after a patch
**Cause:** a new `const glyphs` declared later in the same function where the
outer `glyphs` was used earlier → temporal dead zone. **Fix:** rename (`typed`).
**Avoid:** after every patch run the page and read `[page error]` output.

### P7 · A patch silently did nothing
**Cause:** scripted search-and-replace where the "old" string didn't match exactly
(whitespace, an earlier edit). **Fix/avoid:** after scripted edits, `grep` for the
new text; prefer exact-match edit tools that fail loudly.

### P8 · No motion blur on the first frame of a fast move
**Cause:** velocity = `kf(f) − kf(f−1)`, and `kf` holds the first value before the
first key → velocity 0 on the first keyed frame. **Fix:** add a key *before* the
first visible frame (GPT cursor: `[113, [1024, 378]]`).

### P9 · Measured rectangle jumps on a few frames
**Cause:** flood fill leaks into a similar background (oil-paint style) or stops
at a light sweep. **Fix:** check `area`, replace bad frames by hand from known
geometry (`r = l + 670`), keep the fixed data in `composition/data/`.

### P10 · A plate is completely black
**Cause:** inpainting mask covered every pixel (threshold `lum < 195` on a dark
frame) → push-pull has nothing to pull from. **Fix:** per-frame-range thresholds;
verify plates (`luma_stats.py`, contact sheet of the plate folder).

### P11 · A title appears twice, slightly offset
**Cause:** the plate still contained the title (not masked on those frames) and
the code drew it again. **Fix:** either mask it out of the plate *and* draw it, or
keep it in the plate and *don't* draw it (Motion 617–621).

### P12 · A light band appears inside a shrinking card
**Cause:** the card is a crop window; its content was scaled down so the content
no longer covered the window → the layer behind showed through. **Fix:** give the
window an opaque dark background.

### P13 · Text looks condensed or stretched
**Cause:** horizontal-only fit with a wrong base font size (k = 0.77 clamped to 0.8).
**Fix:** choose the size from the cap height; `placeText(..., {uniform: 'auto'})`
scales uniformly when |k−1| > 0.1; check `tools/fit_log.mjs`.

### P14 · Everything looks soft / smeared
**Cause:** motion-blur factors too high (intro 0.32, typing 0.22) or blur on frames
where the reference is sharp (close-up frame 98 had a fake whip). **Fix:** factors
0.12–0.3; compare blur against the reference frame by frame; no blur below ~1–3 px/frame.

### P15 · A long line of text drifts away from the reference
**Cause:** substitute font advances accumulate error (20–45 px over the typed line).
**Fix:** anchor each glyph to its measured ink box (`REF_GLYPHS`) with its own scaleX.

### P16 · Background "looks right" but scores badly
**Cause:** a guessed background (intro plate scaled ×2 + haze overlay) instead of the
real footage of those frames. **Fix:** lift plates from the same frames
(close-up score 17.4 → 9.6). **Avoid:** never invent a background you can lift.

### P17 · Shot uses footage from elsewhere in the video
**Cause/fix:** the "But…" hills are the intro footage offset by 232 frames;
matching found it (R14). Search before inpainting.

### P18 · The cursor looks "off" even at the right position
**Cause:** a generic hand drawn from memory. **Fix:** trace the reference cursor on a
4× crop with an overlay prototype (`docs/images/proto-cursor-trace.jpg`); keep the
hotspot (fingertip) as the anchor; drop invented default rotations.

### P19 · An icon is recognisably wrong
**Fix:** prototype 4–6 variants side by side over the reference crop with
`tools/html_to_png.mjs` and pick the closest (`docs/images/proto-openai-knot-variants.jpg`).

### P20 · Emoji / icon size wrong relative to its container
**Fix:** measure the container (bubble radius) and the icon box on the same frame;
scale by the ratio (fire emoji `R/56`, not `R/46`).

### P21 · Captions barely visible
**Cause:** thin 11 px text at 55% alpha renders lighter than the reference.
**Fix:** 78%. Compare small text at 2× crop.

### P22 · Off-by-one frame everywhere
**Cause:** ffmpeg frame files are 1-based (`f0001.jpg` = frame 0).
**Fix:** one convention, one helper (`tools/_common.py::frame_path`). Everything is 0-based.

### P23 · Forgetting `L` in keyframes
**Cause:** `kf()` defaults to `inOutCubic` between keys. With per-frame measured
keys this adds a wobble inside every frame interval. **Fix:** per-frame keys always `L`.

### P24 · Two code paths fight over `transform`
**Cause:** one place sets `style.transform` for position, another for drift → last
write wins. **Fix:** use a different property (`marginLeft`/`marginTop` for drift,
as in the "But…" letters) or nest wrapper elements (one transform each).

### P25 · Blank plates on the first rendered frames
**Cause:** seeking before `<img>`s decoded. **Fix:** `__ready` awaits `img.decode()`
for all images; the renderer awaits `__ready`.

### P26 · Black rows bleed into lifted plates
**Cause:** the reference letterbox is part of the reference pixels. **Fix:** mask
letterbox rows when extracting plates (the global letterbox is drawn on top anyway).

### P27 · Long jobs killed by a command timeout
**Cause:** plate extraction for 60–90 frames takes minutes. **Fix:** run in the
background and wait for completion; split by group (`extract_plates.py costs`).

### P28 · The score spikes on one frame
**Cause:** usually a cut or an appearance one frame early/late. **Fix:** compare
frames n−1, n, n+1 around the spike.

### P29 · Over-trusting the onset detector
**Cause:** broadband spectral flux misses short high-frequency clicks.
**Fix:** `audio_onsets.py --highband 4000` (local-median peaks).

### P30 · A whole scene "feels" wrong though stills match
**Cause:** easing between measured keys wrong, or a missing secondary motion (a word
settling a beat later). **Fix:** contact sheet at step 1 of both REF and NEW for the
span; compare delta patterns (`docs/04-motion-language.md` §2).
