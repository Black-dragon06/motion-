#!/usr/bin/env python3
"""Track a bright (or dark) low-saturation blob - typically the mouse cursor.

The white glove of a cursor is the brightest near-neutral thing in most frames.
Restrict the search box so text / white UI is excluded, and read the bbox and
median centre per frame. Feed the centre track to emit_keyframes.py.

  python3 tools/track_blob.py --from 18 --to 55 --box 20,400,1260,715 --thr 205
  python3 tools/track_blob.py --from 418 --to 452 --box 0,410,1000,640 --mode dark --thr 120
"""
import argparse
import numpy as np
from _common import load, parse_box

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, required=True)
ap.add_argument('--to', dest='b', type=int, required=True)
ap.add_argument('--box', default='0,0,1280,720', help='search box x0,y0,x1,y1')
ap.add_argument('--mode', choices=['bright', 'dark'], default='bright')
ap.add_argument('--thr', type=int, default=235)
ap.add_argument('--src', default='ref')
a = ap.parse_args()

x0, y0, x1, y1 = parse_box(a.box)
for n in range(a.a, a.b + 1):
    sub = load(n, a.src)[y0:y1, x0:x1]
    if a.mode == 'bright':
        m = (sub.min(axis=2) > a.thr) & ((sub.max(axis=2) - sub.min(axis=2)) < 25)
    else:
        m = sub.max(axis=2) < a.thr
    ys, xs = np.where(m)
    if len(xs) < 15:
        print(n, '-')
        continue
    print(f'{n} bbox x {xs.min() + x0}-{xs.max() + x0} y {ys.min() + y0}-{ys.max() + y0}  '
          f'centre {int(np.median(xs)) + x0},{int(np.median(ys)) + y0}  px {len(xs)}')
