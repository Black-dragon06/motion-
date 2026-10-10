# tools/ — measurement & QA toolkit

Everything in this project was **measured, not guessed**. These are the tools that did
the measuring. Every tool prints `--help` with examples.

Conventions:

* frame numbers are **0-based**; frame `n` is stored as `f{n+1:04d}.jpg`
* `--src ref` = reference frames (`.cache/frames/ref`, made by `make frames`),
  `--src new` = our render (`.cache/frames/new`, made by `make frames-new` or `tools/qa.sh`)
* coordinates are pixels of the 1280×720 canvas, origin top-left
* boxes are `x0,y0,x1,y1`

## 1. Get the material

| Tool | Use it for |
|---|---|
| `probe.sh video` | resolution, fps, frame count, colour space, audio. First command of every project. |
| `extract_frames.sh video dir` | all frames as JPGs (q=2). Analysis works on these files. |
| `audio_onsets.py video` | onset frames (clicks, beats, stressed syllables) + loudness per frame. Cuts and pops land on these. |

## 2. Look at the motion

| Tool | Use it for |
|---|---|
| `contact_sheet.py --from A --to B --step S` | a comic strip of frames with frame/time stamps. Step 1 for detail, 2–4 for a whole scene. |
| `frame_grid.py --frames ... --crop ...` | hand-picked key poses, optionally zoomed in (cursor shape, icon detail). |
| `scene_cuts.py` | hard cuts (isolated spikes) and motion spans (whips, zooms, dissolves). Gives the shot list skeleton. |
| `ascii_frame.py N` | a frame as ASCII art — layout check without image viewing. |
| `describe_frame.py N` | a frame as text: colour grid, palette with bboxes, ink regions. For models without vision. |

## 3. Measure

| Tool | Measures | Typical question |
|---|---|---|
| `sample_colors.py N x,y ...` | exact colour at points / median of a mask | "what blue is the button?" |
| `letterbox.py` | black bars per frame | "is the letterbox animated?" |
| `segments.py` | column runs (words/glyphs) + row runs (cap top / baseline) | "where is every word on frames 9–55?" |
| `components.py N --mask ...` | connected blobs: centre, bbox, size | "where is each letter on the arch?" |
| `track_region.py --at x,y` | edges of a flat-colour region per frame | "how does the button scale when clicked?" |
| `flood_rect.py --seed x,y` | rectangle of a moving object per frame (flood fill) | "button rect through a zoom-out" |
| `track_blob.py --box ...` | bright/dark neutral blob per frame | "cursor path" |
| `phase_shift.py A --to B ...` | translation between frames | "is the background static? one plate or many?" |
| `measure_text.mjs` | advance / ink box / ascent of text in our fonts (Chromium) | "which font size gives a 397 px wide 'Button'?" |

## 4. Turn measurements into code

| Tool | Does |
|---|---|
| `fit_easing.py "f:v f:v ..."` | fits exp-settle / power ease-out / ease-in / linear, prints paste-ready JS |
| `emit_keyframes.py --file track.txt --name CUR` | per-frame track → `kf()` keyframe array (linear between measurements), optional simplification |

## 5. Check the result

| Tool | Does |
|---|---|
| `qa.sh out.png 0.5 4 f1 f2 ...` | renders just those frames of our composition and builds a REF/NEW sheet (seconds) |
| `compare_frames.py --frames ...` | REF-over-NEW sheet from existing frames, optional crop |
| `diff_heatmap.py --frames ...` | where the pixels differ (edges = offset, areas = colour) |
| `score.py` | mean abs difference per frame and per segment; `--top N` lists the worst frames |
| `side_by_side.sh ref.mp4 new.mp4 out.mp4` | stacked comparison video with frame numbers |
| `fit_log.mjs` | lists text whose font size is off (fit factor far from 1) |
| `eval_in_page.mjs "expr"` | run JS inside the composition (seek, inspect transforms) |
| `html_to_png.mjs proto.html out.png` | prototype a shape over a reference crop before putting it in a scene |

See `docs/03-measurement-cookbook.md` for worked recipes that chain these tools.
