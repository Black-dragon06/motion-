# 15 · Agent playbook — operating rules for an AI doing this job

This is written for an AI coding agent (any model, with or without image input)
that has to recreate a motion video from a reference with code. Follow it
literally. It encodes how this project was done successfully.

## A. Hard rules

1. **Never invent a number you could measure.** Positions, sizes, colours, frame
   numbers, durations, easing ratios — all come from a tool run on the reference.
   If you write a constant, you must be able to name the measurement it came from.
2. **Work on one scene at a time**, in video order, and finish it (QA'd) before the next.
3. **Every scene is `update(f)`, a pure function of the frame number.** No CSS
   animations, timers, `Date.now()`, `Math.random()` (use `rng(seed)`).
4. **Render only the frames you are checking** (`tools/qa.sh`), never the whole
   video to test one change.
5. **After every edit:** run the page (any QA render) and read `[page error]` lines.
   Then look at / measure the REF-vs-NEW result. No edit is done until compared.
6. **Lift footage, draw graphics.** Do not approximate photographic backgrounds.
7. **Per-frame measured keyframes use linear interpolation** (`L`).
8. **Fix the biggest difference first** (missing element > layout > timing >
   colour > blur > detail). Use `tools/score.py` to pick the block.
9. **Write down what you measured** (a constant with a comment, a data file, or a
   file in `analysis/measurements/`). Future you needs the provenance.
10. **Stop polishing a block** when its score is < ~6 or the remainder is a known
    APPROXIMATE item. Move on; come back if time permits.

## B. Standard procedure (checklist)

```
[ ] tools/probe.sh reference.mp4                   -> W, H, fps, frames
[ ] tools/extract_frames.sh reference.mp4 .cache/frames/ref
[ ] python3 tools/scene_cuts.py --json analysis/cuts.json
[ ] python3 tools/audio_onsets.py reference.mp4 --highband 4000
[ ] contact sheets of everything (step 2), notes with frame numbers
[ ] analysis/shots.json: id, from, to, name, entry, exit
[ ] per shot: layer inventory DRAW / LIFT / APPROXIMATE
[ ] BRIEF.md
[ ] engine from templates/ (core.js, main.js, render.mjs)          -> dummy render works
for each scene:
  [ ] plates (if LIFT): extract + mask + inpaint, check them
  [ ] pick a rest frame; measure every element on it; build static layout; qa.sh that frame until it matches
  [ ] measure motion per frame (segments/track_blob/components/flood_rect/scroll_profile)
  [ ] encode it (kf arrays or fitted law); qa.sh 4-8 frames across the motion
  [ ] blur / opacity / secondary motion; qa.sh again
  [ ] cut frames: qa.sh first and last 2 frames
  [ ] score the block
[ ] full render, side-by-side, score report, commit
```

## C. Prompt templates

Use these as the task message for each step (fill the brackets).

**Measure a shot**
> Shot [id] spans frames [A–B]. Run `contact_sheet.py --from A --to B --step 1`.
> List every element with its first and last visible frame. For each element
> choose the right tool (see `tools/README.md`) and measure its box/colour on a
> rest frame and its position per frame during motion. Save outputs to
> `analysis/measurements/[id]-[element].txt` with the command on the first line.
> Do not write scene code yet.

**Build the static layout**
> Using only the measurements in [files], create `composition/scenes/[NN]-[name].js`
> following `templates/scene.template.js`. Make frame [rest frame] match: background,
> every element's box (use `placeText` for text), colours. Then run
> `tools/qa.sh .cache/qa.png 1 1 [rest frame]` and report the differences you see or
> measure (`compare_frames.py --crop`, `diff_heatmap.py`).

**Add motion**
> For element [X], the per-frame track is in [file]. Run `fit_easing.py` on it. If
> RMSE < 1.5 px use the fitted law, otherwise `emit_keyframes.py` → `kf()` with `L`.
> Add motion blur only where the reference shows it (check frames [list]).
> QA frames [list spread over the motion].

**Fix a difference**
> `score.py` says block [name] is worst, worst frame [n]. Compare n−1, n, n+1
> (REF/NEW + heat map). State the single biggest difference as a measurable claim
> ("NEW label ink starts at x=402, REF at 383"), measure both, change one thing,
> re-render, re-measure.

## D. No-vision mode (agent cannot see images)

Everything above works with text output only:

| Instead of looking at… | run |
|---|---|
| a frame | `python3 tools/ascii_frame.py N --cols 120` and `python3 tools/describe_frame.py N` |
| a contact sheet | `segments.py` / `components.py` over the frame range — appearance frames and positions as numbers |
| a REF/NEW comparison | the same measurement on `--src ref` and `--src new`, then compare numbers; `score.py --from A --to B --top 5`; `diff_heatmap.py` prints top/bottom/centre means |
| colours | `sample_colors.py` |
| motion feel | deltas of per-frame tracks; `fit_easing.py` |

Protocol per element: measure REF → implement → render the frame → run the
**same** measurement with `--src new` → the numbers must agree within 2–3 px.
That is a complete feedback loop without vision. Example:

```bash
python3 tools/segments.py --from 45 --box 150,330,1010,420 --mode bright --thr 185 --gap 14 --src ref
python3 tools/segments.py --from 45 --box 150,330,1010,420 --mode bright --thr 185 --gap 14 --src new
```

Real output (intro, frame 45):

```
REF 45 cols [(283, 404), (420, 460), (483, 639), (672, 741)]  rows [(356, 396)]
NEW 45 cols [(284, 401), (422, 459), (486, 636), (671, 738)]  rows [(356, 396)]
```

Every word within 1–3 px, same rows → this element is done.

## E. Context management (small context windows)

* Keep scene files under ~200 lines; move long per-frame tables to `composition/data/*.js`.
* Don't paste tool outputs of hundreds of lines into your reasoning: use `--step`,
  narrower `--box`, or `head`, and save full outputs to files.
* Keep a running `NOTES.md` per project: shots done, scores, open differences.
* Re-read `docs/10-pitfalls.md` when something "can't be right".

## F. Definition of done (per scene)

* Frame count / cut frames identical to the reference.
* Every element present on the same frames.
* Positions within ~3 px on rest frames, motion within ~5 px on measured frames.
* Colours within ~5 RGB of the measured values.
* Block score < ~6, or the remainder is documented as APPROXIMATE.
* No `[page error]` output.

## G. Anti-patterns seen in weak attempts

* Describing motion in words, then writing CSS keyframes from the description.
* `animation: slideIn 0.5s ease-out` — real-time CSS animations can't be frame-sought.
* Guessing durations in seconds ("about half a second").
* One easing for everything (`ease-in-out`).
* Rebuilding photographic backgrounds as gradients.
* Building all scenes first and comparing at the end.
* Rendering the whole video for every test.
* Ignoring the audio.
* Placing text by its CSS box instead of by its ink and baseline.
