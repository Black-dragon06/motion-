# 07 · Plates: what to draw, what to lift, and how to paint graphics out

## The decision: DRAW vs LIFT

Code can rebuild anything that is *designed*: text, flat shapes, gradients, UI,
icons, logos, simple particles. Code cannot regenerate *photographed or
AI-generated footage*: a flight over flowered hills, the Creation of Adam painted
in six styles, banana characters, a car interior at night.

For those layers this project **lifts the footage from the reference itself**:
take frame n of the reference, find every graphic element drawn on top of it
(text, buttons, cursor, captions, frames), mask those pixels, fill the hole from
the surrounding pixels, save as `assets/plates/<group>/<n>.jpg`. The scene then
shows plate n on frame n and draws the graphics in code on top.

| Group | Frames | What was painted out |
|---|---|---|
| `landscape` | 0–55 | headline words, Button pill, © footer, cursor, white window frame |
| `closeup` | 56–98 | the whole text band (y 178/248–486), cursor, caption |
| `mojave`, `greyphoto`, `kling`, `banana` | montage | hero button rect, caption, letterbox rows |
| `creation` | 296–381 | button rect (from `composition/data/lifesaver.json`), light sweep spill, letterbox rows |
| `costs` | 453–509 | every letter of the arch + cursor (circles from `composition/data/costs.json`), red leftovers |
| `typing` | 243–295 | typed text, card/caret rect |
| `features` | 560–579, 601–690 | "Video" title, white title lettering on the black card (Motion/Creation) |

`docs/images/plates-before-after.jpg` shows reference vs plate for each group.

**When you have the original footage, use it** — plate files have the same names,
so dropping in clean high-resolution frames upgrades the whole video.

## The inpainting algorithm (push-pull)

`scripts/plate_tools.py::inpaint(img, mask)`:

1. **Pull (down)**: build an image pyramid where each level averages only the
   *known* pixels of the level above (weighted by how many were known). Holes
   shrink by half every level until the coarsest level has no holes.
2. **Push (up)**: going back up, every unknown pixel takes the upsampled value
   from the coarser level; known pixels keep their own value.
3. Feather the mask edge (1.2 px gaussian) and optionally add a little grain
   so the filled area doesn't look plastic.

```python
def inpaint(img, mask, grain=0.0, seed=0):
    w = (~mask).astype(np.float32)
    levels = [(img, w)]
    while min(cur.shape[:2]) > 4 and cw.min() == 0:
        cur, cw = _down(cur, cw)          # weighted 2x2 average of known pixels
        levels.append((cur, cw))
    fill = levels[-1][0]
    for im, ww in reversed(levels[:-1]):
        up = _up(fill, im.shape)          # bilinear upsample
        fill = im * ww + up * (1 - ww)    # keep known pixels
    …
```

Why this algorithm: it needs only numpy, is fast (a frame in ~0.5 s), and is
excellent on **smooth or defocused** backgrounds — sky gradients, bokeh hills,
studio gradients, flat paper. It is bad at **sharp texture** (a fill across
stained glass becomes a smear). That was acceptable here because almost
everything painted out was later covered again by the redrawn graphic of the
same shape.

## How masks were made

Masks must cover the graphic **and its anti-aliased edge, shadow and blur**, but
nothing else. Techniques used (`scripts/extract_plates.py`):

| Technique | Code idea | Used for |
|---|---|---|
| Known geometry | `rrect_mask(x0, y0, x1, y1, r)` from measured rects (+ padding) | buttons, cards |
| Brighter than local background | inpaint the band first, then mask `img − bg > 9` | white headline text on footage |
| Colour key | `(b − r > 55) & (b > 110)` | blue pill |
| Bright neutral blob near a tracked point | `min(rgb) > 205` + box around median | cursor |
| Ring | outer rrect − inner rrect | white window frame |
| Whole band | rows y0..y1 | close-up text band (sky behind is smooth) |
| Darker than threshold | `lum < 110` dilated 10 px | typed black text |
| Circles from layout data | circle per glyph centre, radius ∝ size | arch letters |
| Connected components inside a card | components of light pixels inside the black card | Motion/Creation titles |

Always `dilate()` the mask by a few pixels (3–26 px) — anti-aliasing and blur extend
past the solid pixels. Always mask the **letterbox rows** too: the global letterbox
is drawn on top, and black rows left in a plate bleed into the fill.

## Failure modes (all hit in this project)

* **Everything masked → black plate.** A threshold mask (`lum < 195`) on frames
  where the whole picture was dark masked 100% of the pixels; push-pull with no
  known pixels returns zeros. Fix: frame-specific thresholds (`45` for 243–249).
  Check plates visually or with `luma_stats.py`.
* **Fill smears texture** into the hole (stained glass, LEGO). Acceptable only if
  the redrawn graphic covers the hole. Otherwise pad less, or copy texture from
  another frame where the area is visible (temporal fill) if the camera is static.
* **Mask too small** → ghost edges of the old graphic show around the new one
  (double edges in `diff_heatmap.py`). Increase dilation.
* **Graphic left in the plate on purpose**: when a title is smeared by a whip
  or interleaved in depth with photos (Image 601–616, Motion 617–621), keeping
  it in the plate is better than a perfect redraw that can't match the smear.
  Then don't draw it in code on those frames (otherwise it doubles — P11).

## Reuse before you inpaint

The "But…" shot (227–249) is the intro footage again (R14): plate = frame − 232.
Matching unoccluded regions against existing clean plates found that for free.
Always search existing plates first.

## Regenerating plates

```bash
python3 scripts/extract_plates.py              # all groups (slow: minutes)
python3 scripts/extract_plates.py costs        # one group
```

Reference frames are cached as PNG in `.cache/ref_frames` the first time.
Long groups can exceed a 2-minute command timeout — run them in the background.
