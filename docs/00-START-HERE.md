# START HERE — how to recreate a motion video with code

This repository is a complete, worked example of recreating a 29-second promo
video (Higgsfield "One Button") **frame-accurately with code**: HTML/CSS/SVG
layers driven by a JavaScript timeline, rendered frame-by-frame with Playwright
(headless Chromium) and encoded with ffmpeg.

It is written as **training material**: every decision, measurement, mistake and
fix is documented so that another model or person can learn the method and apply
it to a new reference video.

## The one idea that matters

> **Do not guess. Measure the reference, frame by frame, and write the
> measurements into the code. Then render, compare against the reference, and
> fix the biggest difference. Repeat.**

Every agent that "can't do motion" fails in the same way: it looks at a
reference, describes it in words ("the text slides in with a nice ease"), writes
CSS animations from that description and gets something that is roughly the
same idea and completely different motion. The fix is not better taste. The fix
is numbers: *on frame 10 the word's left edge is at x=359, on frame 11 at 349,
on frame 12 at 343 …* — and code that reproduces those numbers.

## Reading order

| # | Document | Why read it |
|---|---|---|
| 1 | [`01-workflow.md`](01-workflow.md) | the end-to-end process, phases, checklists and time budget |
| 2 | [`02-reference-analysis.md`](02-reference-analysis.md) | how to take a reference apart: probe, frames, cuts, audio, contact sheets, shot list |
| 3 | [`03-measurement-cookbook.md`](03-measurement-cookbook.md) | 20 concrete recipes: "how do I measure X" with commands and real outputs |
| 4 | [`04-motion-language.md`](04-motion-language.md) | easing, settle, stagger, overshoot, whip, motion blur — as numbers and formulas |
| 5 | [`05-engine-api.md`](05-engine-api.md) | the code engine: `kf()`, `placeText()`, motion blur, cursor, scenes, render loop |
| 6 | [`06-recipes.md`](06-recipes.md) | reusable patterns with code: blur-reveal, typing + scroll, card-to-caret, grids, ribbons, logo draw-on … |
| 7 | [`07-plates-and-inpainting.md`](07-plates-and-inpainting.md) | what to draw vs. what to lift from the reference, and how to paint graphics out |
| 8 | [`08-typography.md`](08-typography.md) | matching type: fonts, baselines, ink boxes, fit factors |
| 9 | [`09-qa-loop.md`](09-qa-loop.md) | how to compare, score and decide what to fix next |
| 10 | [`10-pitfalls.md`](10-pitfalls.md) | every bug hit in this project and its fix — read before you debug |
| 11 | [`11-decision-log.md`](11-decision-log.md) | every significant decision with the alternatives and why |
| 12 | [`12-build-journal.md`](12-build-journal.md) | the whole project in chronological order, including dead ends |
| 13 | [`13-scene-by-scene.md`](13-scene-by-scene.md) | each of the 15 blocks: what the reference does, what was measured, how it was built, residual error |
| 14 | [`14-render-and-delivery.md`](14-render-and-delivery.md) | rendering, encoding, comparison video, git |
| 15 | [`15-agent-playbook.md`](15-agent-playbook.md) | strict operating rules + prompts for an AI agent doing this job (incl. agents without vision) |
| 16 | [`16-worked-example-intro.md`](16-worked-example-intro.md) | one scene built from zero: every command, output, decision and line of code |
| 17 | [`17-exercises.md`](17-exercises.md) | ten practice tasks with answers |
| 18 | [`18-system-prompt.md`](18-system-prompt.md) | ready-to-paste system prompt for an agent harness (e.g. DeepSeek) |
| — | [`glossary.md`](glossary.md) | motion-design and project vocabulary |

Then look at real material:

* `BRIEF.md` — the motion brief written after analysis (in Russian): timing map, shot list, palette, typography, motion language.
* `analysis/` — the measured evidence (`analysis/README.md`), especially `analysis/measurements/*.txt`: each file is *command → raw numbers → where they went in the code*.
* `composition/` — the finished code. Start with `composition/scenes/01-intro.js` (simplest complete scene).
* `templates/` and `examples/` — skeletons and tiny runnable examples to start a new project.
* `tools/` — the measurement and QA toolkit (`tools/README.md`).
* `training/` — 35 instruction → response pairs for few-shot prompting / retrieval / fine-tuning (`training/README.md`).

## Quick start

```bash
npm install                      # playwright
make frames                      # reference frames -> .cache/frames/ref (needed by all analysis tools)
make preview                     # open http://localhost:8080/composition/index.html, arrows = frame step
make qa FRAMES="81 162 346"      # render 3 frames and compare them with the reference -> .cache/qa.png
make render                      # out/higgsfield_one_button.mp4 (1080p, with audio)
make compare                     # out/compare_side_by_side.mp4
make score                       # per-scene similarity numbers
```

## What "as good as the reference" meant here, in numbers

| Metric | Result |
|---|---|
| Frames / fps / duration | 870 / 30 / 29.000 s — identical |
| Cut positions | identical (0 frames off) |
| Mean absolute pixel difference (0–255, 320×180) | 4.2 over the whole video; 1.7–5 in most blocks |
| Worst block | "But…" 227–249 (15.8): the opening frames use the closest available footage |

See `analysis/score_report.txt` and `analysis/sheets/compare/` for the evidence.
