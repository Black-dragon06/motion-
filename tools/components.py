#!/usr/bin/env python3
"""Connected components of a colour mask: centroid, bbox, size of each blob.

Use when ink is not on a straight line (letters on an arc, scattered icons,
particles). Each component ~ one glyph; sort by x to read the word order.

  python3 tools/components.py 453 --box 0,110,1230,560 --mask "(r>140)&(r-g>80)"     # red letters
  python3 tools/components.py 453 --box 0,110,1230,560 --mask "(r>120)&(g>120)&(b>120)" --min 60
"""
import argparse
from collections import deque
import numpy as np
from _common import load, parse_box

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('frame', type=int)
ap.add_argument('--mask', required=True, help='numpy expression over r,g,b arrays')
ap.add_argument('--box', default='0,0,1280,720')
ap.add_argument('--min', type=int, default=60, help='minimum pixels per component')
ap.add_argument('--link', type=int, default=2, help='neighbourhood radius that still connects pixels')
ap.add_argument('--src', default='ref')
a = ap.parse_args()

im = load(a.frame, a.src)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
m = eval(a.mask, {'np': np}, {'r': r, 'g': g, 'b': b})
x0, y0, x1, y1 = parse_box(a.box)
reg = np.zeros(m.shape, bool)
reg[y0:y1, x0:x1] = True
m = m & reg
lab = np.zeros(m.shape, int)
comps = []
cur = 0
L = a.link
for y, x in zip(*np.where(m)):
    if lab[y, x]:
        continue
    cur += 1
    q = deque([(y, x)])
    lab[y, x] = cur
    pts = []
    while q:
        yy, xx = q.popleft()
        pts.append((yy, xx))
        for dy in range(-L, L + 1):
            for dx in range(-L, L + 1):
                ya, xb = yy + dy, xx + dx
                if 0 <= ya < m.shape[0] and 0 <= xb < m.shape[1] and m[ya, xb] and not lab[ya, xb]:
                    lab[ya, xb] = cur
                    q.append((ya, xb))
    if len(pts) >= a.min:
        p = np.array(pts)
        comps.append((int(p[:, 1].mean()), int(p[:, 0].mean()), int(p[:, 1].min()), int(p[:, 1].max()),
                      int(p[:, 0].min()), int(p[:, 0].max()), len(pts)))
comps.sort()
print(f'{len(comps)} components (cx, cy, w, h, px):')
for cx, cy, xa, xb, ya, yb, n in comps:
    print(f'  centre {cx:4d},{cy:4d}  bbox x {xa}-{xb} y {ya}-{yb}  w {xb - xa:3d} h {yb - ya:3d}  px {n}')
