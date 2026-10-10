#!/usr/bin/env python3
"""Brightness statistics per frame - for fades, flashes, dissolves and grade changes.

Prints mean / max / 99th-percentile luma and mean colour (optionally inside a box).
A fade to black shows as max luma falling to 0; a dissolve to a flat colour as the
mean colour converging and the std (texture) collapsing; a desaturation as
saturation falling. Divide (value - start) / (end - start) to get opacity per frame.

  python3 tools/luma_stats.py --from 780 --to 869 --step 6                 # final fade-out
  python3 tools/luma_stats.py --from 352 --to 400 --step 3 --box 100,100,400,250   # Higgsfield dissolve
"""
import argparse
import numpy as np
from _common import load, parse_box, hexc

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, required=True)
ap.add_argument('--to', dest='b', type=int, required=True)
ap.add_argument('--step', type=int, default=1)
ap.add_argument('--box', default='0,0,1280,720')
ap.add_argument('--src', default='ref')
a = ap.parse_args()

x0, y0, x1, y1 = parse_box(a.box)
print('frame   mean   max   p99   std   sat   mean-colour')
for n in range(a.a, a.b + 1, a.step):
    im = load(n, a.src)[y0:y1, x0:x1].astype(float)
    lum = im @ np.array([0.2126, 0.7152, 0.0722])
    sat = (im.max(axis=2) - im.min(axis=2)).mean()
    print(f'{n:5d} {lum.mean():6.1f} {lum.max():5.0f} {np.percentile(lum, 99):5.0f} {lum.std():5.1f} {sat:5.1f}   {hexc(im.reshape(-1, 3).mean(0))}')
