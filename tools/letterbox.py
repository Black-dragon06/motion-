#!/usr/bin/env python3
"""Track black letterbox bars / the visible picture area per frame.

Reports the first/last row and column where more than half the pixels are not
black. A growing/shrinking top value = animated letterbox (a layer of its own).

  python3 tools/letterbox.py --from 0 --to 869 --step 6
  python3 tools/letterbox.py --from 236 --to 300 --step 2 --thr 30
"""
import argparse
import numpy as np
from _common import load

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, default=0)
ap.add_argument('--to', dest='b', type=int, default=869)
ap.add_argument('--step', type=int, default=6)
ap.add_argument('--thr', type=int, default=30, help='luma above this counts as picture')
ap.add_argument('--src', default='ref')
ap.add_argument('--json', default=None, help='save {frame: [top_bar, bottom_bar]}')
a = ap.parse_args()
import json
res = {}

for n in range(a.a, a.b + 1, a.step):
    im = load(n, a.src, 'L')
    rows = np.where((im > a.thr).mean(axis=1) > 0.5)[0]
    cols = np.where((im > a.thr).mean(axis=0) > 0.5)[0]
    if len(rows) and len(cols):
        res[n] = [int(rows.min()), int(719 - rows.max())]
        print(f'{n:4d}  top {rows.min():3d}  bottom {rows.max():3d}  (bar {rows.min():3d}px / {719 - rows.max():3d}px)  left {cols.min():4d} right {cols.max():4d}')
    else:
        print(f'{n:4d}  no picture (black frame)')
if a.json:
    json.dump(res, open(a.json, 'w'))
    print('wrote', a.json)
