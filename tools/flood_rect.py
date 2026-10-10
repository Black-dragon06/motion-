#!/usr/bin/env python3
"""Measure an object's rectangle by flood-filling from a seed point, every frame.

More robust than track_region.py when the object moves: the seed is searched in
a small window for the most uniform patch, then a 4-connected flood fill with
colour tolerance gives the region; rows/cols with enough coverage give the box.
Output can be saved as JSON {frame: {color, l, r, t, b, area}}.

  python3 tools/flood_rect.py --from 296 --to 381 --seed 488,360 --json btn.json
  python3 tools/flood_rect.py --from 154 --to 159 --seed 330,300 --tol 28
  python3 tools/flood_rect.py --from 296 --to 381 --seed-track "296:484,360 310:363,410 340:354,330 352:460,444 381:395,474"

Gotcha: when the object changes colour (style flashes) or text touches the
edge, the fill leaks - check the 'area' column for jumps and fix those frames
by hand (that is what was done for frames 341 and 347-350 in this project).
"""
import argparse, json
from collections import deque
import numpy as np
from _common import load, hexc

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, required=True)
ap.add_argument('--to', dest='b', type=int, required=True)
ap.add_argument('--seed', default=None, help='x,y (fixed seed)')
ap.add_argument('--seed-track', default=None, help='"f:x,y f:x,y ..." seed path, linearly interpolated (for moving objects)')
ap.add_argument('--tol', type=int, default=28)
ap.add_argument('--src', default='ref')
ap.add_argument('--json', default=None)
a = ap.parse_args()

track = []
if a.seed_track:
    for tok in a.seed_track.split():
        fr, xy = tok.split(':')
        track.append((int(fr), [int(v) for v in xy.split(',')]))


def seed_at(n):
    if not track:
        return [int(v) for v in a.seed.split(',')]
    if n <= track[0][0]:
        return track[0][1]
    for (fa, pa), (fb, pb) in zip(track, track[1:]):
        if fa <= n <= fb:
            t = (n - fa) / (fb - fa)
            return [int(pa[i] + (pb[i] - pa[i]) * t) for i in (0, 1)]
    return track[-1][1]


out = {}
for n in range(a.a, a.b + 1):
    im = load(n, a.src)
    sx0, sy0 = seed_at(n)
    best = None
    for dx in range(-15, 16, 3):
        for dy in range(-30, 31, 10):
            p = im[sy0 + dy - 2:sy0 + dy + 3, sx0 + dx - 2:sx0 + dx + 3].reshape(-1, 3)
            v = p.std(axis=0).sum()
            if best is None or v < best[0]:
                best = (v, sx0 + dx, sy0 + dy)
    _, sx, sy = best
    c = im[sy - 2:sy + 3, sx - 2:sx + 3].reshape(-1, 3).mean(0)
    m = np.abs(im - c).max(axis=2) < a.tol
    seen = np.zeros(m.shape, bool)
    q = deque([(sy, sx)])
    seen[sy, sx] = True
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and not seen[yy, xx] and m[yy, xx]:
                seen[yy, xx] = True
                q.append((yy, xx))
    rows = np.where(seen.sum(axis=1) > 40)[0]
    cols = np.where(seen.sum(axis=0) > 15)[0]
    if not len(rows) or not len(cols):
        print(n, 'no region')
        continue
    out[n] = dict(color=hexc(c), l=int(cols.min()), r=int(cols.max()), t=int(rows.min()), b=int(rows.max()), area=int(seen.sum()))
    print(n, out[n])
if a.json:
    json.dump(out, open(a.json, 'w'), indent=1)
    print('wrote', a.json)
