# analysis/ — everything that was learned from the reference

This folder is the **evidence** behind every number in `composition/`. It is the
"reading" half of the job; `composition/` is the "writing" half.

| File | What it is | Made by |
|---|---|---|
| `shots.json` | the shot list: 36 shots with frames, entry/exit transition, technique, plates used | written by hand from the contact sheets + cuts |
| `segments.json` | the 15 blocks used for scoring and for `docs/13-scene-by-scene.md` | by hand |
| `cuts.json` | per-frame difference to the previous frame, hard cuts, motion spans | `tools/scene_cuts.py --json` |
| `audio.json` | onset frames, spectral flux and RMS per video frame | `tools/audio_onsets.py --json` |
| `spectrogram.png` | log-frequency spectrogram of the soundtrack (VO, music, click SFX) | `tools/audio_onsets.py --png` |
| `letterbox.json` | top/bottom black bar height for every frame | `tools/letterbox.py --json` |
| `scores.json`, `score_report.txt` | final REF-vs-NEW difference per frame and per block | `tools/score.py --json` |
| `sheets/reference/*.jpg` | contact sheet of every block of the reference, frame numbers stamped | `tools/contact_sheet.py` |
| `sheets/compare/*.jpg` | 8 frames per block: reference on top, our render below | `tools/compare_frames.py` |
| `measurements/*.txt` | raw outputs of the measurement tools; first two lines = the command and **where the numbers are used in the code** | `measurements/run_all.sh` |

## How to read `measurements/`

Every file is a *measurement → code* pair. Example, `01-intro-words.txt`:

```
# $ python3 tools/segments.py --from 8 --to 55 --box 150,330,1010,420 --mode bright --thr 185 --gap 14
# used in: composition/scenes/01-intro.js WORDS (x final, appear frame, start offset) ...
9 cols [(410, 416), (473, 483)]  rows [(367, 367), ...]       <- "We've" starts appearing on frame 9
...
45 cols [(283, 404), (420, 460), (483, 639), (672, 741)]       <- 4 words, x ranges, nearly settled
```

From those column runs the code takes: the frame each word first appears,
its left edge on the first visible frame (start offset) and its left edge when
settled (final x). `01-intro-word-fit.txt` shows the easing fit that turned the
per-frame positions into `x = final + offset * 0.9^n`.

Regenerate everything with:

```bash
make frames                          # reference frames -> .cache/frames/ref
bash analysis/measurements/run_all.sh
python3 tools/scene_cuts.py --json analysis/cuts.json
python3 tools/audio_onsets.py reference/reference.mp4 --json analysis/audio.json --png analysis/spectrogram.png
make frames-new && python3 tools/score.py --json analysis/scores.json
```

## Key facts (memorise these before touching the code)

* 1280×720, 30 fps, 870 frames = 29.0 s, H.264 + AAC.
* Hard cuts (first frame of the new shot): 56, 99, 114, 124, 134, 141, 148, 154, 160, 166, 172, 178, 184, 190, 196,
  200, 205, 211, 216, 222, 227, 296, 341–351 (style flashes), 352, 453, 510, 560, 601, 617.
* Montage shots are 4–15 frames long and land on click SFX onsets.
* Letterbox: 0 px until frame 50 → 34 px (frames 76–238) → 139 px during typing (266–282) → 29 px (312–766) → 0 after 776.
* Palette anchors: UI blue `#305CA5`, text blue `#2350B4`, paper `#E5E5E5`/`#E1E1E1`, brand lime `#AAD71C` (light) /
  `#D6FF25` (on black), logo plaque `#161616`, costs red `#EC1218`.
