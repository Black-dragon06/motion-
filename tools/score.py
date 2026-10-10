#!/usr/bin/env python3
"""Objective similarity score: mean absolute RGB difference REF vs NEW per frame.

Frames are downscaled to 320x180 first (forgives sub-pixel offsets and JPEG
noise, punishes wrong layout, colour, timing). 0 = identical. Rough reading:
  < 3   indistinguishable at normal viewing
  3-6   same picture, small differences (font, blur amount, noise)
  6-12  visibly different detail (offset text, wrong shape, missing element)
  > 12  wrong content / wrong timing on this frame
Per-segment means show where to work next; 'worst' is the frame to look at.

  python3 tools/score.py                                  # uses analysis/segments.json if present
  python3 tools/score.py --from 227 --to 295 --top 10     # range, ten worst frames
"""
import argparse, json, os
import numpy as np
from PIL import Image
from _common import frame_path, ROOT

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, default=0)
ap.add_argument('--to', dest='b', type=int, default=None)
ap.add_argument('--segments', default=os.path.join(ROOT, 'analysis', 'segments.json'))
ap.add_argument('--top', type=int, default=0)
ap.add_argument('--json', default=None)
a = ap.parse_args()

b = a.b
if b is None:
    b = a.a
    while os.path.exists(frame_path(b + 1, 'ref')) and os.path.exists(frame_path(b + 1, 'new')):
        b += 1
sc = {}
for n in range(a.a, b + 1):
    A = np.asarray(Image.open(frame_path(n, 'ref')).convert('RGB').resize((320, 180), Image.BILINEAR)).astype(float)
    B = np.asarray(Image.open(frame_path(n, 'new')).convert('RGB').resize((320, 180), Image.BILINEAR)).astype(float)
    sc[n] = float(np.abs(A - B).mean())
vals = np.array(list(sc.values()))
print(f'frames {a.a}-{b}: mean {vals.mean():.2f}  median {np.median(vals):.2f}')
if os.path.exists(a.segments):
    for s in json.load(open(a.segments)):
        fr = [sc[n] for n in range(s['from'], s['to'] + 1) if n in sc]
        if fr:
            w = max(range(s['from'], s['to'] + 1), key=lambda n: sc.get(n, -1))
            print(f"  {s['name']:28s} {s['from']:4d}-{s['to']:4d}  mean {np.mean(fr):6.2f}  worst {w} ({sc[w]:.1f})")
if a.top:
    print('worst frames:', ', '.join(f'{n} ({v:.1f})' for n, v in sorted(sc.items(), key=lambda kv: -kv[1])[:a.top]))
if a.json:
    json.dump({str(k): round(v, 2) for k, v in sc.items()}, open(a.json, 'w'))
    print('wrote', a.json)
