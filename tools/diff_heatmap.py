#!/usr/bin/env python3
"""Where exactly do REF and NEW differ? Absolute-difference heat map (x3 gain).

Bright outlines = edges in different places (offset / wrong size).
Bright filled areas = wrong colour or missing element. Doubled edges = the same
object drawn twice at slightly different positions. Also prints the mean
difference of the top bars, bottom bars and centre - a quick letterbox check.

  python3 tools/diff_heatmap.py --frames 230 240 256 270 --out heat.png
"""
import argparse
import numpy as np
from PIL import Image
from _common import load, parse_frames

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--frames', nargs='+', required=True)
ap.add_argument('--gain', type=float, default=3)
ap.add_argument('--out', required=True)
a = ap.parse_args()

frames = parse_frames(' '.join(a.frames))
tiles = []
for n in frames:
    d = np.abs(load(n, 'ref').astype(float) - load(n, 'new').astype(float)).mean(axis=2)
    print(f'{n}: top {d[:40].mean():5.1f}  bottom {d[680:].mean():5.1f}  centre {d[100:620].mean():5.1f}')
    tiles.append(Image.fromarray(np.clip(d * a.gain, 0, 255).astype(np.uint8)).resize((640, 360)))
S = Image.new('L', (1280, 360 * ((len(tiles) + 1) // 2)))
for i, t in enumerate(tiles):
    S.paste(t, ((i % 2) * 640, (i // 2) * 360))
S.save(a.out)
print('wrote', a.out)
