#!/usr/bin/env python3
"""Grid of hand-picked frames (optionally cropped) - for looking closely at key poses.

  python3 tools/frame_grid.py --frames 0 25 50 52 53 55 --scale 0.5 --cols 3 --out key.png
  python3 tools/frame_grid.py --frames 81 --crop 730,420,900,590 --scale 4 --cols 1 --out cursor.png
"""
import argparse
from PIL import Image
from _common import load_img, label, parse_frames, parse_box

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--frames', nargs='+', required=True)
ap.add_argument('--scale', type=float, default=0.5)
ap.add_argument('--cols', type=int, default=3)
ap.add_argument('--crop', default=None, help='x0,y0,x1,y1 in full-frame pixels')
ap.add_argument('--src', default='ref')
ap.add_argument('--out', required=True)
a = ap.parse_args()

frames = parse_frames(' '.join(a.frames))
tiles = []
for n in frames:
    im = load_img(n, a.src)
    if a.crop:
        im = im.crop(parse_box(a.crop))
    im = im.resize((max(1, int(im.width * a.scale)), max(1, int(im.height * a.scale))), Image.LANCZOS)
    tiles.append(label(im, str(n)))
w, h = tiles[0].size
rows = (len(tiles) + a.cols - 1) // a.cols
S = Image.new('RGB', (w * a.cols, h * rows), 'black')
for i, t in enumerate(tiles):
    S.paste(t, ((i % a.cols) * w, (i // a.cols) * h))
S.save(a.out)
print('wrote', a.out)
