# Higgsfield — «One Button» · motion-video recreation in code

A 29-second promo video recreated **frame-accurately with code** (HTML/CSS/SVG layers,
a JS timeline, Playwright frame capture, ffmpeg), plus the complete method, toolkit and
documentation needed to learn to do it — written so another model (or person) can repeat it.

| | |
|---|---|
| **Result** | `out/higgsfield_one_button.mp4` — 1920×1080, 30 fps, 870 frames (29.0 s), audio |
| **Proof** | `out/compare_side_by_side.mp4` — reference on top, recreation below, frame counter |
| **Similarity** | mean abs pixel difference 4.2 / 255 over the whole video (`analysis/score_report.txt`) |
| **Brief** | `BRIEF.md` — motion brief: timing map, shot list, palette, typography, motion language (RU) |

## Learn the method

Start with **[`docs/00-START-HERE.md`](docs/00-START-HERE.md)**. AI agents: **[`AGENTS.md`](AGENTS.md)**.

| Folder | Contents |
|---|---|
| `docs/` | workflow, reference analysis, measurement cookbook, motion language as numbers, engine API, 25 recipes, plates & inpainting, typography, QA loop, 30 pitfalls, decision log, build journal, scene-by-scene, agent playbook, worked example, exercises, glossary |
| `tools/` | 29 measurement / QA tools (contact sheets, cuts, audio onsets, colours, word boxes, components, flood fill, cursor tracking, scroll curves, easing fit, keyframe emitter, score, heat maps, text-only frame descriptions, font measuring, page eval) |
| `analysis/` | shot list, cuts, onsets, letterbox, scores, per-scene contact & compare sheets, 33 raw measurement files (command → numbers → where used in code) |
| `composition/` | the recreation: engine (`composition/lib/`), 10 scene modules, measured data |
| `scripts/` | renderer (`render.mjs`), plate extraction + inpainting |
| `templates/`, `examples/minimal/` | skeletons and a 3-second runnable example |
| `training/` | instruction → response dataset (JSONL) + how to use it to teach a model |
| `assets/` | fonts (OFL), soundtrack, footage plates lifted from the reference |
| `reference/` | the reference video |

## Quick start

```bash
npm install             # playwright (needs Chromium)
make frames             # reference frames for the tools
make preview            # interactive player: ← → frame step, space = play
make qa FRAMES="81 162 346 497"     # render 4 frames + compare with the reference -> .cache/qa.png
make render             # final 1080p video
make compare            # side-by-side video
make help               # everything else
```

Requires Node ≥ 18, ffmpeg, Python 3 + numpy + Pillow.

## How it works (one paragraph)

The reference was taken apart frame by frame: cuts, audio onsets, every element's
position, size, colour and timing measured with the scripts in `tools/`. Designed
elements (all text, buttons, UI, cursor, icons, logo, particles, transitions) are
rebuilt in code; photographic footage that code can't generate is lifted from the
reference with the graphics painted out (`assets/plates/`). Each scene is a pure
function of the frame number, so any frame renders on its own; Playwright screenshots
every frame and ffmpeg encodes them with the original soundtrack. Every change was
checked by rendering the affected frames and comparing them with the reference.
