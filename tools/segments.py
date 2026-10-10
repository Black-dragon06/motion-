#!/usr/bin/env python3
"""Segment text (or any ink) in a band into words/glyphs by column runs.

Builds a mask (dark / bright / colour), then reports runs of columns that contain
ink ("word boxes" when --gap is ~ a word space, "glyph boxes" when --gap is 1-3)
and the run of rows (cap-top .. baseline/descender). This is the workhorse for
measuring where every word sits on every frame.

  # words of the intro headline (white text) on frames 9..55
  python3 tools/segments.py --from 9 --to 55 --box 0,330,1280,420 --mode bright --thr 185 --gap 14
  # typed black glyphs, tight gap
  python3 tools/segments.py --from 250 --to 295 --box 0,240,1280,480 --mode dark --thr 90 --gap 5
  # blue words only
  python3 tools/segments.py --from 536 --to 548 --mode color --color '#2350B4' --tol 60 --gap 12
  # label on a flat button: everything that is not the button colour
  python3 tools/segments.py --from 156 --box 320,255,965,465 --mode notcolor --color '#eceffe' --tol 70 --gap 6

Columns/rows are absolute frame pixels. min-count filters noise (a column needs
at least that many ink pixels).
"""
import argparse
import numpy as np
from _common import load, runs, parse_box, parse_hex

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, required=True)
ap.add_argument('--to', dest='b', type=int, default=None)
ap.add_argument('--step', type=int, default=1)
ap.add_argument('--box', default='0,0,1280,720')
ap.add_argument('--mode', choices=['dark', 'bright', 'color', 'notcolor'], default='dark',
                help='notcolor = everything that differs from --color by more than --tol (text on a flat button)')
ap.add_argument('--thr', type=int, default=100)
ap.add_argument('--color', default=None)
ap.add_argument('--tol', type=int, default=50)
ap.add_argument('--gap', type=int, default=10)
ap.add_argument('--min-count', type=int, default=1)
ap.add_argument('--src', default='ref')
a = ap.parse_args()

x0, y0, x1, y1 = parse_box(a.box)
for n in range(a.a, (a.b if a.b is not None else a.a) + 1, a.step):
    sub = load(n, a.src)[y0:y1, x0:x1]
    if a.mode == 'dark':
        m = sub.max(axis=2) < a.thr
    elif a.mode == 'bright':
        m = (sub.min(axis=2) > a.thr) & ((sub.max(axis=2) - sub.min(axis=2)) < 40)
    elif a.mode == 'color':
        m = np.abs(sub - parse_hex(a.color)).max(axis=2) < a.tol
    else:
        m = np.abs(sub - parse_hex(a.color)).max(axis=2) > a.tol
    cols = [(s + x0, e + x0) for s, e in runs(m.sum(axis=0) >= a.min_count, a.gap)]
    rows = [(s + y0, e + y0) for s, e in runs(m.sum(axis=1) >= a.min_count, 3)]
    print(n, 'cols', cols, ' rows', rows)
