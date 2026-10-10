#!/usr/bin/env python3
"""Estimate the translation between two frames (camera pan / plate drift).

Phase correlation on a grey region. Answers "is the background static or moving,
and by how much?" - which decides whether one clean plate is enough or you need
a plate per frame. Also prints the mean abs difference of the region.

  python3 tools/phase_shift.py 0 --to 1 2 5 10 --box 100,450,1200,700
  python3 tools/phase_shift.py 141 --to 142 143 144 145 --box 0,40,1280,240

Output dy, dx = how far frame B content moved relative to A (wrap-around
values close to the region size mean "no reliable peak": the content changed).
"""
import argparse
import numpy as np
from _common import load, parse_box, parse_frames

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('a', type=int)
ap.add_argument('--to', nargs='+', required=True)
ap.add_argument('--box', default='0,0,1280,720')
ap.add_argument('--src', default='ref')
a = ap.parse_args()

x0, y0, x1, y1 = parse_box(a.box)
A = load(a.a, a.src, 'L').astype(float)[y0:y1, x0:x1]
for n in parse_frames(' '.join(a.to)):
    B = load(n, a.src, 'L').astype(float)[y0:y1, x0:x1]
    FA = np.fft.fft2(A - A.mean())
    FB = np.fft.fft2(B - B.mean())
    R = FA * np.conj(FB)
    R /= np.abs(R) + 1e-9
    c = np.real(np.fft.ifft2(R))
    i = np.unravel_index(np.argmax(c), c.shape)
    dy, dx = [int(v if v < s / 2 else v - s) for v, s in zip(i, c.shape)]
    print(f'{a.a} -> {n}:  dx {-dx:5d}  dy {-dy:5d}   peak {c.max():.3f}   meandiff {np.abs(A - B).mean():.1f}')
