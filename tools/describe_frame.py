#!/usr/bin/env python3
"""Describe a frame as TEXT - for agents/models that cannot look at images.

Prints:
  1. a colour grid (default 8 x 6 cells): dominant colour of each cell as hex
  2. the palette: the frame quantised to N colours, each with coverage %,
     bounding box and number of separate blobs
  3. "ink" regions: high-contrast connected regions (text, icons, UI edges)
     with bbox, size and mean colour - usually one line per word / object
Combined with segments.py / components.py this is enough to rebuild a layout
without ever seeing the picture.

  python3 tools/describe_frame.py 81
  python3 tools/describe_frame.py 162 --src new --grid 16x9 --colors 10
"""
import argparse
from collections import deque
import numpy as np
from PIL import Image, ImageFilter
from _common import load_img, hexc

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('frame', type=int)
ap.add_argument('--src', default='ref')
ap.add_argument('--grid', default='8x6')
ap.add_argument('--colors', type=int, default=8)
ap.add_argument('--ink', type=int, default=40, help='edge contrast threshold for ink regions')
a = ap.parse_args()

img = load_img(a.frame, a.src)
W, H = img.size
gx, gy = [int(v) for v in a.grid.split('x')]
arr = np.asarray(img).astype(int)
print(f'frame {a.frame} ({a.src}) {W}x{H}')
print(f'\n1) colour grid {gx}x{gy} (cell = {W // gx}x{H // gy} px, median colour):')
for j in range(gy):
    row = []
    for i in range(gx):
        c = np.median(arr[j * H // gy:(j + 1) * H // gy, i * W // gx:(i + 1) * W // gx].reshape(-1, 3), axis=0)
        row.append(hexc(c))
    print('   ' + ' '.join(row))

small = img.resize((320, 180), Image.BILINEAR)
q = small.quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT)
pal = q.getpalette()[:a.colors * 3]
qa = np.asarray(q)
print(f'\n2) palette ({a.colors} colours), coverage / bbox in full-frame px / blobs:')
for k in sorted(range(a.colors), key=lambda k: -(qa == k).sum()):
    m = qa == k
    if m.sum() == 0:
        continue
    ys, xs = np.where(m)
    lab = np.zeros(m.shape, int)
    blobs = 0
    for y, x in zip(ys, xs):
        if lab[y, x]:
            continue
        blobs += 1
        dq = deque([(y, x)])
        lab[y, x] = 1
        while dq:
            yy, xx = dq.popleft()
            for yb, xb in ((yy + 1, xx), (yy - 1, xx), (yy, xx + 1), (yy, xx - 1)):
                if 0 <= yb < 180 and 0 <= xb < 320 and m[yb, xb] and not lab[yb, xb]:
                    lab[yb, xb] = 1
                    dq.append((yb, xb))
    print(f'   {hexc(pal[k * 3:k * 3 + 3])}  {100 * m.mean():5.1f}%  bbox x {xs.min() * 4}-{xs.max() * 4 + 3} '
          f'y {ys.min() * 4}-{ys.max() * 4 + 3}  blobs {blobs}')

g = np.asarray(img.convert('L').filter(ImageFilter.FIND_EDGES)).astype(int)
edge = g > a.ink
e2 = np.asarray(Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
lab = np.zeros(e2.shape, int)
regs = []
for y, x in zip(*np.where(e2[::2, ::2])):
    y, x = y * 2, x * 2
    if lab[y, x]:
        continue
    dq = deque([(y, x)])
    lab[y, x] = 1
    pts = []
    while dq:
        yy, xx = dq.popleft()
        pts.append((yy, xx))
        for yb, xb in ((yy + 2, xx), (yy - 2, xx), (yy, xx + 2), (yy, xx - 2)):
            if 0 <= yb < H and 0 <= xb < W and e2[yb, xb] and not lab[yb, xb]:
                lab[yb, xb] = 1
                dq.append((yb, xb))
    if len(pts) > 30:
        p = np.array(pts)
        x0, x1, y0, y1 = p[:, 1].min(), p[:, 1].max(), p[:, 0].min(), p[:, 0].max()
        if (x1 - x0) > W * 0.9 and (y1 - y0) > H * 0.9:
            continue
        inside = arr[y0:y1 + 1, x0:x1 + 1].reshape(-1, 3)
        dark, light = np.percentile(inside.mean(axis=1), [10, 90])
        regs.append((y0, x0, x1, y1, len(pts), dark, light))
regs.sort()
print(f'\n3) ink regions (high-contrast blobs: text lines, icons, UI edges), top-to-bottom:')
for y0, x0, x1, y1, n, dark, light in regs[:40]:
    shape = 'text-like line' if (x1 - x0) > 3 * (y1 - y0) and (y1 - y0) < 200 else 'object'
    print(f'   x {x0:4d}-{x1:4d}  y {y0:3d}-{y1:3d}  ({x1 - x0}x{y1 - y0})  {shape:14s}  luma dark {dark:.0f} / light {light:.0f}')
if len(regs) > 40:
    print(f'   ... {len(regs) - 40} more')
