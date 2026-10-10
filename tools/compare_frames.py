#!/usr/bin/env python3
"""REF-over-NEW comparison sheet: for each frame, the reference tile on top and our
render directly below it (labelled), so misalignment is obvious at a glance.

  python3 tools/compare_frames.py --frames 99 113 124 --scale 0.5 --cols 3 --out cmp.png
  python3 tools/compare_frames.py --frames 81 --crop 300,240,980,490 --scale 1 --cols 1 --out pill.png
"""
import argparse, os
from PIL import Image
from _common import frame_path, label, parse_frames, parse_box

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--frames', nargs='+', required=True)
ap.add_argument('--scale', type=float, default=0.5)
ap.add_argument('--cols', type=int, default=4)
ap.add_argument('--crop', default=None)
ap.add_argument('--ref', default='ref')
ap.add_argument('--new', default='new')
ap.add_argument('--out', required=True)
a = ap.parse_args()

frames = parse_frames(' '.join(a.frames))
box = parse_box(a.crop) if a.crop else (0, 0, 1280, 720)
w, h = int((box[2] - box[0]) * a.scale), int((box[3] - box[1]) * a.scale)
rows = (len(frames) + a.cols - 1) // a.cols
S = Image.new('RGB', (w * a.cols, (2 * h + 4) * rows), 'red')
for i, n in enumerate(frames):
    tiles = []
    for src, tag in ((a.ref, 'REF'), (a.new, 'NEW')):
        p = frame_path(n, src)
        im = Image.open(p).convert('RGB').crop(box).resize((w, h)) if os.path.exists(p) else Image.new('RGB', (w, h), 'gray')
        tiles.append(label(im, f'{tag} {n}', 14))
    x, y = (i % a.cols) * w, (i // a.cols) * (2 * h + 4)
    S.paste(tiles[0], (x, y))
    S.paste(tiles[1], (x, y + h))
S.save(a.out)
print('wrote', a.out)
