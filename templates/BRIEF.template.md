# Motion brief — <project>

> Written after analysis, before scene code. Every timing in frames @<fps>, every
> coordinate in px of the <W>×<H> canvas.

## 0. Passport
| Parameter | Value |
|---|---|
| Format | W×H |
| Frame rate | fps (constant?) |
| Duration | N frames = S s |
| Codecs / colour | h264 yuv420p BT.709, AAC |
| Genre | promo / explainer / kinetic type / UI demo |

## 1. Narrative & voice-over
| Frames | Time | On screen / VO |
|---|---|---|

## 2. Visual system
### 2.1 Palette (measured hex)
### 2.2 Typography (reference font → substitute, sizes, weights, tracking)
### 2.3 UI kit (buttons, cards, radii, shadows, cursor)
### 2.4 Global layers (letterbox table, frames, grain)
### 2.5 Motion language (reveal law, settle ratios, whips, blur factors, stagger)

## 3. Timing map / shot list
| # | Frames | Shot | Entry | Exit |
|---|---|---|---|---|

## 4. Per-shot breakdown
For each shot: layers back→front (DRAW / LIFT / APPROXIMATE), measured geometry,
motion per element with frame numbers, transitions.

## 5. Assets (what is drawn, what is lifted, fonts, audio)

## 6. Technical plan (files, data, render settings)

## 7. Acceptance criteria
1. frame count / fps / duration identical
2. cuts on the same frames
3. positions ±3 px on rest frames, colours ΔRGB ≤ 5
4. per-block score < 6 (tools/score.py) or documented APPROXIMATE
