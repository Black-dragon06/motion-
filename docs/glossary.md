# Glossary

| Term | Meaning in this project |
|---|---|
| **reference** | the video being recreated (`reference/reference.mp4`) |
| **frame n** | 0-based frame index; file `f{n+1:04d}.jpg`; time = n / 30 s |
| **shot** | a continuous piece between two cuts |
| **block / segment** | a group of shots treated together (15 blocks, `analysis/segments.json`) |
| **hard cut** | instant change of picture between two frames |
| **whip / whip pan** | very fast camera move with heavy motion blur, often across a cut |
| **push / pull** | camera moving toward / away (scale up / down) |
| **settle** | the decelerating end of a move; here usually exponential |
| **overshoot** | passing the target and coming back (back-out / spring) |
| **stagger** | elements of a group starting at different frames |
| **squash & stretch** | width and height scaling out of phase to suggest elasticity |
| **ease-in / ease-out** | accelerating / decelerating |
| **expo-out / exp settle** | `v = T + A·r^n`: covers a fixed fraction (1−r) of the remaining distance each frame |
| **half-life** | frames to halve the remaining distance: `ln 0.5 / ln r` (r = 0.9 → 6.6 frames) |
| **motion blur** | smear along the direction of motion during the shutter interval |
| **letterbox** | black bars top/bottom; animated here |
| **plate** | a background image for one frame, here lifted from the reference with graphics removed |
| **LIFT / DRAW / APPROXIMATE** | footage taken from the reference / rebuilt in code / matched only roughly |
| **inpainting** | filling masked pixels from their surroundings (push-pull) |
| **mask** | boolean image of pixels to remove/fill |
| **ink box** | the bounding box of the actually painted pixels of text/shape |
| **baseline** | the line letters sit on (bottom of B, u, t, n) |
| **cap height** | height of capital letters above the baseline |
| **advance** | horizontal distance a glyph moves the pen (includes side bearings) |
| **fit factor k** | measured ink width / natural ink width in our font |
| **hotspot** | the cursor's active point (fingertip) |
| **contact sheet** | grid of consecutive frames with frame numbers |
| **REF / NEW** | reference frames / our rendered frames |
| **score** | mean absolute RGB difference REF vs NEW at 320×180 |
| **kf** | keyframe interpolation function in `composition/lib/core.js` |
| **L** | `E.linear`, used between per-frame measured keys |
| **seek** | render the composition at a given frame (`window.__seek(f)`) |
| **document space** | coordinates of content before a scroll/pan (typing line) |
| **crop window** | an `overflow:hidden` element whose rect animates, revealing part of its content |
| **dashoffset draw-on** | animating `stroke-dashoffset` from the path length to 0 to draw a stroke |
