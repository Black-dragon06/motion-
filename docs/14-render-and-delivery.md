# 14 · Render, encode, compare, deliver

## Render

```bash
make render                 # = node scripts/render.mjs  -> out/higgsfield_one_button.mp4
make render-720             # 1280x720 variant
```

What happens (`scripts/render.mjs`):

1. local HTTP server rooted at the repo (fonts/modules need http://);
2. Chromium (`--font-render-hinting=none --disable-lcd-text --disable-gpu-vsync`),
   viewport 1280×720, `deviceScaleFactor: 1.5` → 1920×1080 screenshots;
3. `await window.__ready` (fonts, images, `prepare()`);
4. for f in 0..869: `__seek(f)` → `page.screenshot({type: 'png', clip: 1280×720})` → ffmpeg stdin;
5. ffmpeg: `-f image2pipe -framerate 30 -c:v png -i -` + `-i assets/audio/soundtrack.m4a`
   → `-c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -color_primaries bt709
   -color_trc bt709 -colorspace bt709 -c:a copy -shortest -movflags +faststart`.

Verify the output:

```bash
tools/probe.sh out/higgsfield_one_button.mp4      # 1920x1080, 30/1, nb_frames=870, duration=29.0
```

QA renders (no encode): `node scripts/render.mjs --frames .cache/frames/new --scale 1`
(all frames as JPG, ~35 s) or `--list 81,162,346` / `--from A --to B`.

## Comparison video

```bash
make compare     # tools/side_by_side.sh → out/compare_side_by_side.mp4
```

Reference on top, recreation below, frame number top-right, reference audio.
This file is the best single artefact to show a reviewer.

## Score

```bash
make frames-new && make score     # analysis/scores.json + per-block report
```

## Deliver

* `out/higgsfield_one_button.mp4` — the result
* `out/compare_side_by_side.mp4` — the proof
* `BRIEF.md` — the spec
* commit everything; this repo commits plates and renders on purpose (D25)

```bash
git add -A
git commit -m "…"
git push -u origin <branch>
```
