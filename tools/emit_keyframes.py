#!/usr/bin/env python3
"""Turn a measured track into a keyframe array for composition/lib/core.js kf().

Input: lines "frame v1 [v2 ...]" (from a tool's output you trimmed) or --pairs.
Output: [[f, v], [f, v, L], ...] where L = E.linear - per-frame measurements are
interpolated linearly, which reproduces the reference exactly.

  python3 tools/emit_keyframes.py --file cursor.txt --name CUR
  python3 tools/emit_keyframes.py --pairs "20:180,760 21:186,712 22:190,685" --name CUR
  python3 tools/emit_keyframes.py --file x.txt --simplify 1.0    # drop keys reproducible within 1 px

--simplify removes keys whose value is within the tolerance of the straight
line between their neighbours (Ramer-Douglas-Peucker on the frame axis). Use it
for long smooth tracks to keep code readable.
"""
import argparse

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--file', default=None)
ap.add_argument('--pairs', default=None)
ap.add_argument('--name', default='TRACK')
ap.add_argument('--simplify', type=float, default=0)
a = ap.parse_args()

rows = []
if a.file:
    for line in open(a.file):
        p = line.replace(',', ' ').split()
        if p and p[0].lstrip('-').isdigit():
            rows.append((int(p[0]), [float(x) for x in p[1:]]))
else:
    for tok in a.pairs.split():
        fr, vals = tok.split(':')
        rows.append((int(fr), [float(x) for x in vals.split(',')]))


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (fa, va), (fb, vb) = pts[0], pts[-1]
    worst, wi = 0, 0
    for i in range(1, len(pts) - 1):
        f, v = pts[i]
        t = (f - fa) / (fb - fa)
        d = max(abs(v[j] - (va[j] + (vb[j] - va[j]) * t)) for j in range(len(v)))
        if d > worst:
            worst, wi = d, i
    if worst <= eps:
        return [pts[0], pts[-1]]
    return rdp(pts[:wi + 1], eps)[:-1] + rdp(pts[wi:], eps)


if a.simplify > 0:
    rows = rdp(rows, a.simplify)
fmt = lambda v: (f'{v[0]:g}' if len(v) == 1 else '[' + ', '.join(f'{x:g}' for x in v) + ']')
items = [f'[{f}, {fmt(v)}' + (']' if i == 0 else ', L]') for i, (f, v) in enumerate(rows)]
lines, cur = [], ''
for it in items:
    if len(cur) + len(it) > 110:
        lines.append(cur)
        cur = ''
    cur += it + ', '
lines.append(cur.rstrip(', '))
print(f'const {a.name} = [' + '\n  '.join(lines) + '];')
print(f'// {len(rows)} keys; use: const v = kf(f, {a.name});  (L = E.linear)')
