# AGENTS.md — instructions for AI agents working in this repository

You are working in a repository that recreates a reference video **with code**,
frame-accurately. It is both a finished project and a training corpus for the
method. Read this file first, then `docs/00-START-HERE.md`.

## What this repo is

* `reference/reference.mp4` — the video to match (1280×720, 30 fps, 870 frames).
* `composition/` — the recreation: HTML/CSS/SVG layers + a JS timeline. Every scene
  is a pure function `update(frame)`.
* `scripts/render.mjs` — renders frames with Playwright (Chromium) → ffmpeg.
* `tools/` — measurement & QA toolkit (Python + Node). `tools/README.md`.
* `analysis/` — the measured evidence (shot list, cuts, onsets, raw measurements, scores).
* `docs/` — the method, written down: workflow, recipes, pitfalls, decisions, journal.
* `BRIEF.md` — the motion brief (Russian).
* `templates/`, `examples/minimal/` — starting points.
* `training/` — instruction → response pairs; `docs/18-system-prompt.md` — a ready system prompt.

## Rules (from `docs/15-agent-playbook.md`)

1. **Measure, never guess.** Every number in a scene comes from a tool run on the
   reference frames. Name the measurement in a comment or save it to `analysis/measurements/`.
2. **One scene at a time**, video order; static layout on a rest frame first, then motion.
3. **Frame-pure code**: no CSS animations, timers, `Date.now()`, `Math.random()`.
4. **QA after every change** on the frames you touched: `tools/qa.sh .cache/qa.png 0.5 4 <frames>`.
   Read `[page error]` output. Compare numbers with `--src ref` vs `--src new` if you cannot see images.
5. **Lift footage, draw graphics** (`docs/07-plates-and-inpainting.md`).
6. Per-frame keyframes interpolate **linearly** (`kf(f, keys)` with `E.linear`).
7. Fix the **biggest** difference first; use `python3 tools/score.py --top 10` to choose.
8. Keep scene files small; long tables go to `composition/data/`.

## Setup

```bash
npm install            # playwright (Chromium is expected to be installed)
make frames            # reference frames -> .cache/frames/ref (required by tools)
make check             # syntax check
make qa FRAMES="81 162"
```

Requirements: Node ≥ 18, ffmpeg, Python 3 with numpy + Pillow.

## Commands you will use most

| Goal | Command |
|---|---|
| see a span of frames | `python3 tools/contact_sheet.py --from A --to B --out x.png` |
| frame as text (no vision) | `python3 tools/describe_frame.py N`, `python3 tools/ascii_frame.py N` |
| word/glyph boxes | `python3 tools/segments.py --from A --to B --box x0,y0,x1,y1 --mode dark/bright/color/notcolor` |
| colours | `python3 tools/sample_colors.py N x,y ...` |
| object rect per frame | `python3 tools/flood_rect.py --from A --to B --seed x,y` |
| cursor path | `python3 tools/track_blob.py --from A --to B --box ...` |
| easing law | `python3 tools/fit_easing.py "f:v f:v ..."` |
| keyframes from a track | `python3 tools/emit_keyframes.py --file track.txt --name NAME` |
| font size check | `node tools/measure_text.mjs '[["text","700 88px \"Inter Display\""]]'` |
| render frames + compare | `tools/qa.sh out.png 0.5 4 f1 f2 ...` |
| score | `make frames-new && python3 tools/score.py --top 10` |
| debug in page | `node tools/eval_in_page.mjs "window.__seek(100); ..."` |
| final video | `make render && make compare` |

## Conventions

* Frame numbers are 0-based; frame n is stored as `f{n+1:04d}.jpg`.
* Coordinates: px of the 1280×720 canvas, origin top-left; boxes `x0,y0,x1,y1`.
* Text is placed by **ink box + baseline** with `placeText()`.
* Fonts: Inter / Inter Display (bundled) substitute SF Pro.

## Before you change anything

* `docs/10-pitfalls.md` — 30 bugs already hit, with fixes.
* `docs/16-worked-example-intro.md` — one scene built from zero, step by step.
