#!/usr/bin/env python3
"""Measure horizontal scrolling of content between consecutive frames (pan curve).

For each frame pair (n-1, n) the darkness profile of every column inside the box
is compared for shifts 0..max; the best match is the scroll in px. Cumulative sum
= pan curve in "document" coordinates. This recovered the typing-scene camera:
the typed line scrolls left so the newest glyph stays next to the caret.

A moving occluder (the caret / card) breaks the match, so pass --right "f:x ..."
to only use columns left of x on frame f (x = caret left edge - margin).

  python3 tools/scroll_profile.py --from 250 --to 295 --box 0,250,1280,470 \\
      --right "250:234 251:322 252:404 256:596 262:744 282:974 295:862"
"""
import argparse
import numpy as np
from _common import load, parse_box

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, required=True)
ap.add_argument('--to', dest='b', type=int, required=True)
ap.add_argument('--box', required=True)
ap.add_argument('--right', default='', help='"f:x ..." usable right limit per frame (interpolated)')
ap.add_argument('--max', type=int, default=120, help='largest shift to test (px/frame)')
ap.add_argument('--dir', choices=['left', 'right'], default='left', help='content moves left (normal reading scroll) or right')
ap.add_argument('--src', default='ref')
a = ap.parse_args()

x0, y0, x1, y1 = parse_box(a.box)
lim = sorted((int(t.split(':')[0]), int(t.split(':')[1])) for t in a.right.split()) if a.right else []


def right_at(n):
    if not lim:
        return x1
    if n <= lim[0][0]:
        return lim[0][1]
    for (fa, xa), (fb, xb) in zip(lim, lim[1:]):
        if fa <= n <= fb:
            return int(xa + (xb - xa) * (n - fa) / (fb - fa))
    return lim[-1][1]


pan = 0
print(f'{a.a} shift 0 pan 0')
for n in range(a.a + 1, a.b + 1):
    A = 255 - load(n - 1, a.src, 'L')[y0:y1]
    B = 255 - load(n, a.src, 'L')[y0:y1]
    cut = max(x0 + 200, min(right_at(n - 1), right_at(n)))
    pa, pb = A[:, x0:cut].sum(axis=0).astype(float), B[:, x0:cut].sum(axis=0).astype(float)
    L = len(pa)
    best = None
    for s in range(0, min(a.max, L - 50)):
        d = np.abs(pb[:L - s] - pa[s:]).mean() if a.dir == 'left' else np.abs(pb[s:] - pa[:L - s]).mean()
        if best is None or d < best[0]:
            best = (d, s)
    pan += best[1]
    print(f'{n} shift {best[1]} pan {pan}')
