# 01 · The workflow, end to end

This is the exact process used for this project, in the order it was done.
Each phase lists its **inputs**, **actions**, **outputs** and a **done when**
check. Do not skip phases; each one makes the next one cheap.

```
reference.mp4
   │  Phase 0  setup: probe, frames, audio
   ▼
frames/ + audio  ──►  Phase 1  watch & segment: contact sheets, cuts, onsets  ──►  shot list
                                                                                      │
   ┌──────────────────────────────────────────────────────────────────────────────────┘
   ▼
Phase 2  inventory: every layer of every shot → DRAW / LIFT / APPROXIMATE
   ▼
Phase 3  measure: positions, sizes, colours, fonts, curves (numbers per frame)
   ▼
Phase 4  brief: write it all down (BRIEF.md)
   ▼
Phase 5  engine: deterministic frame renderer (once per project)
   ▼
Phase 6  build scene by scene  ◄──────────┐
   ▼                                        │
Phase 7  QA: render frames, compare, score ─┘  (loop until the scene is close)
   ▼
Phase 8  final render, side-by-side video, commit
```

---

## Phase 0 — Setup (10 minutes)

**Do:**

```bash
tools/probe.sh reference/reference.mp4          # 1280x720, 30/1 fps, 870 frames, 29.0 s, h264 + aac
tools/extract_frames.sh reference/reference.mp4 .cache/frames/ref
ffmpeg -i reference/reference.mp4 -vn -c:a copy assets/audio/soundtrack.m4a
```

**Why:** every later number is a frame index or a pixel coordinate. You must know
the canvas size and the frame rate before you measure anything, and you need
every frame on disk as an image so tools can read pixels.

**Done when:** you know W×H, fps, frame count, and `ls .cache/frames/ref | wc -l` equals the frame count.

---

## Phase 1 — Watch & segment (30–60 minutes)

**Do:**

1. Contact sheets of the whole video at step 2 (every 2nd frame), 72 frames per sheet:
   `python3 tools/contact_sheet.py --from 0 --to 143 --step 2 --cols 6 --width 320 --out s1.png` …
2. Cut detection: `python3 tools/scene_cuts.py` → hard cuts (isolated spikes) and motion spans.
3. Audio: `python3 tools/audio_onsets.py reference/reference.mp4` → onset frames.
4. Read the sheets like a comic strip. For every cut write one line: frames, what is on screen, how it enters, how it leaves.

**Output:** a shot list (`analysis/shots.json`, table in `BRIEF.md` §3). Here: 36 shots,
19 of them inside a 4-second button montage cut on click SFX.

**Rules:**

* Cut frame = **first frame of the new shot** (frame 99 is the first Apple Pay frame).
* Cuts cluster on audio onsets. If a cut is between two onsets, re-check it.
* A run of consecutive moderate differences is not a cut, it is a whip / zoom / dissolve. Look at it at step 1.

**Done when:** every frame belongs to exactly one shot and every shot has an entry and exit.

---

## Phase 2 — Inventory (30 minutes)

For every shot, list its **layers** back to front and classify each one:

| Class | Meaning | Examples here |
|---|---|---|
| **DRAW** | rebuild in code (vector, text, UI) | all text, every button, cursor, icons, logo, particles, grids, ribbons, letterbox, bubble |
| **LIFT** | photographic / AI footage that code cannot generate → take from the reference with graphics painted out | hills landscape, Mojave desert, car interior, bananas, Creation of Adam in 6 styles, collages |
| **APPROXIMATE** | exists but can't be matched exactly; get close and move on | font (SF Pro → Inter), particle positions, star fields |

Write this table down (here: `BRIEF.md` §5). It decides the whole architecture:
DRAW layers become DOM/SVG elements; LIFT layers become plate image sequences
(`docs/07-plates-and-inpainting.md`).

**Done when:** every visible pixel in every shot is covered by a classified layer.

---

## Phase 3 — Measure (the longest phase: 40–50% of the time)

For every DRAW element, measure what you will need to reproduce it:

| Need | Tool | Example |
|---|---|---|
| exact colours | `sample_colors.py` | button `#305CA5`, glow peak `#1697F4` |
| static geometry (rest pose) | `segments.py`, `flood_rect.py`, `track_region.py` | hero button 306..976 × 248..471, radius 37 |
| text: font size/weight, baseline, word boxes | `segments.py` + `measure_text.mjs` | "Button" ink 442..884, baseline 409 → Inter Display Bold 133 px |
| motion: position/scale per frame | `segments.py` / `track_blob.py` / `components.py` per frame | word x 359, 349, 343, 336 … |
| easing law | `fit_easing.py` | exp settle r = 0.90 |
| timing | contact sheet at step 1 + onsets | "We've" first visible on frame 9 |
| camera / background motion | `phase_shift.py`, `scroll_profile.py` | typing pan 0, 29, 44, 70, 159 … |

Write every measurement into a file or straight into a constant in the scene. The
`analysis/measurements/*.txt` files show the raw outputs used in this project.

**Done when:** for the shot you are about to build, you could fill a spreadsheet
"frame × element → x, y, scale, opacity, colour" without guessing.

---

## Phase 4 — Brief (1 hour)

Write the brief **before** writing scene code (`BRIEF.md`): passport, narrative/VO,
palette, typography, UI kit, letterbox table, motion language, timing map, shot list,
per-shot breakdown, assets, tech plan, acceptance criteria.

**Why:** it forces you to have an answer for every element, it is the spec you
QA against, and it is what a human motion designer would hand over.

---

## Phase 5 — Engine (1–2 hours, once)

A deterministic frame renderer (`docs/05-engine-api.md`):

* every scene is `update(frame)` — **a pure function of the frame number**, no timers, no CSS animations, no `Date.now()`;
* `window.__seek(f)` shows exactly frame f; the renderer calls it for 0..N-1 and screenshots each;
* PNG frames are piped into ffmpeg; audio is the reference soundtrack.

**Done when:** a dummy scene renders to an MP4 with the right frame count and duration.

---

## Phase 6 — Build, one scene at a time

Inside a scene always work in this order:

1. **Background** (plate sequence or solid/gradient). Compare one frame — it must already match.
2. **Static layout at a rest frame** — pick a frame where nothing moves (e.g. frame 81 for the close-up)
   and make every element land on the measured boxes. Compare that single frame until it is near-perfect.
3. **Appearance timing** — on which frame each element appears / disappears.
4. **Motion curves** — keyframes from per-frame measurements (`kf()` with linear interpolation),
   or a fitted law (exp settle, spring). Check 4–8 frames spread over the motion.
5. **Secondary effects** — motion blur, opacity ramps, blur-ins, glows, shadows.
6. **Transitions in/out** — the frames around the cuts.

Never start step N+1 while step N is visibly wrong: motion on top of a wrong
layout is impossible to judge.

---

## Phase 7 — QA loop (runs inside Phase 6, continuously)

```bash
tools/qa.sh .cache/qa.png 0.5 4 81 90 96 98        # render 4 frames + REF/NEW sheet, ~3 s
python3 tools/diff_heatmap.py --frames 90 --out .cache/heat.png
make frames-new && python3 tools/score.py --top 10  # whole-video numbers, worst frames
```

Pick the worst block, look at its worst frame, fix the biggest visible difference,
re-render. Stop a block when its score is in the "same picture" range (< ~6) or the
remaining difference is something you classified as APPROXIMATE. See `docs/09-qa-loop.md`.

---

## Phase 8 — Deliver

```bash
make render      # 1920x1080 (deviceScaleFactor 1.5), crf 14, reference audio, faststart
make compare     # stacked REF/NEW with frame counter
make score       # final numbers for the README / brief
git add -A && git commit && git push
```

---

## Time budget actually spent on this project (≈ 29 s video)

| Phase | Share |
|---|---|
| Setup + watching + shot list | 10% |
| Measuring (interleaved with building) | 40% |
| Brief | 5% |
| Engine | 5% |
| Building scenes | 25% |
| QA iterations (render / compare / fix) | 15% |

The single biggest time sink was *not* writing code — it was finding the right
numbers. The single biggest quality jump came from replacing guessed backgrounds
and guessed curves with measured ones (`docs/12-build-journal.md`).
