# 02 · Taking the reference apart

Goal of this step: turn a video you *watch* into data you can *use* — a shot list
with frame numbers, the soundtrack's beat map, and a list of layers per shot.

## 1. Probe

```
$ tools/probe.sh reference/reference.mp4
codec_name=h264  width=1280  height=720  pix_fmt=yuv420p  color_space=bt709
r_frame_rate=30/1  avg_frame_rate=30/1  nb_frames=870  duration=29.000000
codec_name=aac  sample_rate=48000  channels=2  duration=29.118708
```

Write down: **1280×720, 30 fps constant, 870 frames, 29.0 s, BT.709, AAC stereo.**
Constant frame rate matters: with variable frame rate the "frame number" of an
event differs between tools. (If a reference is VFR, convert it first:
`ffmpeg -i in.mp4 -vf fps=30 -c:v libx264 -crf 12 ref_cfr.mp4`.)

The audio is 0.12 s longer than the video; the final mux uses `-shortest`.

## 2. Frames on disk

```bash
tools/extract_frames.sh reference/reference.mp4 .cache/frames/ref    # f0001.jpg .. f0870.jpg, JPEG q2
```

**Frame index convention (used in every doc and tool):** frame `n` is 0-based and
lives in `f{n+1:04d}.jpg`. Frame 0 = `f0001.jpg`, frame 869 = `f0870.jpg`.
`frame / 30` = seconds.

## 3. Look at every frame (contact sheets)

```bash
python3 tools/contact_sheet.py --from 0 --to 95 --step 2 --cols 6 --width 320 --out s0.png
```

Read each sheet like a comic strip and write notes **with frame numbers**. Example
notes taken from the first sheet of this project:

```
0–8    blurry hills, nothing else (camera slowly flying forward)
9      "We've" appears (faint, blurred), slides left
18     "all" appears to the right of it; 27 "pressed"; 35 "this"
19–26  a thin white rounded frame grows in from the screen edges
20     a hand cursor enters from bottom-left
49–55  blue pill "Button" fades in; whole line starts zooming toward it
56     hard cut to a huge close-up "…this [Button] befo"
```

Then zoom in on fast parts at step 1 (every frame). Fast parts are where all the
craft is: a 6-frame whip, a 3-frame pop, a 2-frame overshoot.

What to note for every shot (checklist):

- [ ] background: solid / gradient / footage? static or moving?
- [ ] each element: first visible frame, last visible frame, how it enters (fade, slide, pop, blur, wipe, typed), how it exits
- [ ] camera: push / pull / pan / whip (everything moves together) vs. element motion
- [ ] motion blur: direction and length on fast frames
- [ ] colour grading changes (here: "But…" desaturates on 236–244; "Higgsfield" goes b/w on 356–360)
- [ ] letterbox bars (here they animate 6 times!)
- [ ] the cursor (here it appears in 7 scenes, always as a separate layer with its own path)
- [ ] text: words or letters appear separately? by which law?
- [ ] what is footage (LIFT) and what is graphics (DRAW)

## 4. Cuts and motion spans

```
$ python3 tools/scene_cuts.py
hard cuts (isolated spikes, first frame of the new shot): [56, 114, 124, 134, 141, 148, 154, 160, 166, 172, 178,
  184, 190, 196, 200, 205, 211, 216, 222, 227, 352, 453, 510, 560]
motion spans (whips / zooms / dissolves): [(98, 100), (248, 298), (341, 343), (346, 350), (562, 566), (601, 624),
  (645, 656), (761, 766)]
```

How it works: every frame is shrunk to 160×90 and compared to the previous one
(mean absolute difference). Hard cuts are **isolated spikes** (one frame, values
30–160). Whips, zooms, dissolves and fast typing are **runs** of moderate values.
Some cuts hide inside runs (99 inside 98–100, 296 inside 248–298, 617 inside
601–624): look at those spans at step 1.

`ffmpeg -vf "select='gt(scene,0.15)',showinfo"` was tried first; it fired on
every montage cut but also produced many false positives in the typing scene and
missed nothing important — the 160×90 difference is simpler to reason about.

## 5. Audio = the timing grid

```
$ python3 tools/audio_onsets.py reference/reference.mp4
onset frames: [5, 10, 18, 20, 25, 35, 43, 47, 55, 61, 65, 71, 227, 230, 232, 254, 260, 274, 276, 282, ...]
```

Read it together with the visuals:

* 10, 18, 27(≈25), 35 — the four intro words appear on 9, 18, 27, 35: **words are cut to the voice-over syllables**.
* 99–226 has almost no broadband onsets, yet the montage cuts every 4–15 frames. The cuts are
  marked by short **click SFX** that only show in the high band: energy above 4 kHz is ~0.008 of
  max in the montage and jumps to 0.02–0.05 exactly one frame after every cut
  (99→99, 114→115, 124→125, 134→135 … 216→217). So: **cut on frame n, click peaks on n or n+1.**
  Check high-band energy when the broadband onset list looks empty.
* 227, 230, 232 — "But" + the dots popping in.
* RMS (loudness) shows the voice-over: bursts at ~15, 45, 75 (intro line), low during the
  montage 90–225 (music + clicks only), loud again 255–290 ("what if one Button").

Rule used throughout: **if you are unsure on which frame something happens,
take the onset frame.**

## 6. The shot list

Combine notes, cuts and onsets into one table (`analysis/shots.json`, `BRIEF.md` §3):

| # | Frames | Shot | Entry | Exit |
|---|---|---|---|---|
| 01 | 0–55 | intro hills, "We've all pressed this [Button]" | words fade+slide | accelerating push |
| 02 | 56–98 | close-up "this [Button] befo", hover glow, click | hard cut with motion blur | hard cut |
| 03.01–03.19 | 99–226 | 19 subscription buttons, 4–15 frames each | hard cuts on clicks | hard cuts |
| 04 | 227–249 | "But…" rising letters, desaturate, card closes | letters fly up | card shrinks |
| 05 | 250–295 | typing "But, what if one Button", card = caret | card becomes caret | hard cut |
| … | … | … | … | … |

## 7. Inventory of layers

For each shot list layers back→front and classify DRAW / LIFT / APPROXIMATE
(`docs/01-workflow.md` Phase 2). Example — shot 06 "Life saver":

```
back   Creation-of-Adam painting, slow zoom-out          LIFT  (assets/plates/creation/296..340)
       light sweep across the button 296-304              DRAW
       blue button 670x212, radius ~26, #305CA5           DRAW  (rect per frame from flood_rect)
front  "Life saver" SemiBold                              DRAW  (font APPROXIMATE: Inter for SF Pro)
       black letterbox 29-139 px                          DRAW  (global layer)
```

## 8. Without vision

If you cannot look at images, the same information is available as text:

```bash
python3 tools/ascii_frame.py 81 --cols 100        # layout as ASCII art
python3 tools/describe_frame.py 81                # colour grid, palette with bboxes, ink regions
python3 tools/segments.py --from 81 --box 0,250,1280,480 --mode bright --thr 200 --gap 20   # word boxes
```

`describe_frame.py 81` reports e.g. palette `#3c6289 9.7% bbox x 352-935 y 260-471`
— the blue button — and ink region `x 438-846 y 306-412 text-like line` — its label.
That is enough to rebuild the layout. See `docs/15-agent-playbook.md` §"No-vision mode".
