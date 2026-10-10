#!/usr/bin/env python3
"""Track the extent of a flat-coloured region (button, card, pill) through frames.

The colour is sampled once at (x, y) on the first frame. For every frame the
script reports the run of matching columns along row y and the run of matching
rows along column x (+-60 px window) - i.e. the left/right/top/bottom edges.
Use it to recover scale/position animation (pop-in, click squash, push).

  python3 tools/track_region.py --from 99 --to 113 --at 470,330 --tol 30
"""
import argparse
import numpy as np
from _common import load, runs, hexc

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, required=True)
ap.add_argument('--to', dest='b', type=int, required=True)
ap.add_argument('--at', required=True, help='x,y inside the region on the first frame')
ap.add_argument('--tol', type=int, default=25)
ap.add_argument('--src', default='ref')
a = ap.parse_args()

x, y = [int(v) for v in a.at.split(',')]
ref = None
for n in range(a.a, a.b + 1):
    im = load(n, a.src)
    if ref is None:
        ref = im[y - 2:y + 3, x - 2:x + 3].reshape(-1, 3).mean(0)
        print('colour', hexc(ref))
    m = np.abs(im - ref).max(axis=2) < a.tol
    rx = runs(m[y - 20:y + 20, :].mean(axis=0) > 0.5, 6)
    ry = runs(m[:, max(0, x - 60):x + 60].mean(axis=1) > 0.5, 6)
    pick = lambda rr, c: min(rr, key=lambda r: 0 if r[0] <= c <= r[1] else min(abs(r[0] - c), abs(r[1] - c))) if rr else None
    print(n, 'x', pick(rx, x), 'y', pick(ry, y))
