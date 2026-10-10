#!/usr/bin/env python3
"""Sample exact colours: mean RGB in a (2r+1)^2 window around each point, as hex.

Never eyeball colours from a screenshot - JPEG + your monitor lie. Sample the
centre of flat areas (button fill, background) away from edges and text, and
sample several points to see gradients.

  python3 tools/sample_colors.py 81 640,300 640,440 900,440        # frame 81
  python3 tools/sample_colors.py 162 640,360,4 640,120 --src new
  python3 tools/sample_colors.py 740 --median-mask "g>150&b<100"     # median of masked pixels

--median-mask takes a numpy expression over r, g, b arrays; prints the median
colour of matching pixels (great for "what exact lime is the logo?").
"""
import argparse
import numpy as np
from _common import load, hexc

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('frame', type=int)
ap.add_argument('points', nargs='*', help='x,y or x,y,r')
ap.add_argument('--src', default='ref')
ap.add_argument('--median-mask', default=None)
a = ap.parse_args()

im = load(a.frame, a.src)
for p in a.points:
    v = [int(t) for t in p.split(',')]
    x, y = v[0], v[1]
    r = v[2] if len(v) > 2 else 2
    c = im[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1].reshape(-1, 3).mean(0)
    print(f'{x},{y}  {hexc(c)}  rgb({int(c[0])},{int(c[1])},{int(c[2])})')
if a.median_mask:
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    m = eval(a.median_mask, {'np': np}, {'r': r, 'g': g, 'b': b})
    if m.sum() == 0:
        print('mask matched nothing')
    else:
        c = np.median(im[m].reshape(-1, 3), axis=0)
        print(f'median of {int(m.sum())} px: {hexc(c)}')
