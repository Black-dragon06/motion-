#!/usr/bin/env python3
"""Contact sheet: a grid of consecutive frames, each stamped with "frame  seconds".

This is how you SEE motion: look at every frame (step 1) of a short span or every
2nd-4th frame of a scene. Read it row by row like a comic strip.

  python3 tools/contact_sheet.py --from 0 --to 35 --cols 6 --width 320 --out sheet.png
  python3 tools/contact_sheet.py --from 99 --to 226 --step 2 --src new --out montage_new.png
"""
import argparse
from PIL import Image
from _common import load_img, label, FPS

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--from', dest='a', type=int, required=True)
ap.add_argument('--to', dest='b', type=int, required=True)
ap.add_argument('--step', type=int, default=1)
ap.add_argument('--cols', type=int, default=6)
ap.add_argument('--width', type=int, default=320, help='tile width in px (height keeps 16:9)')
ap.add_argument('--src', default='ref')
ap.add_argument('--out', required=True)
a = ap.parse_args()

idx = list(range(a.a, a.b + 1, a.step))
w = a.width
h = int(w * 9 / 16)
rows = (len(idx) + a.cols - 1) // a.cols
sheet = Image.new('RGB', (a.cols * w, rows * h), 'black')
for i, n in enumerate(idx):
    im = load_img(n, a.src).resize((w, h))
    label(im, f'{n} {n / FPS:.2f}', max(12, w // 20))
    sheet.paste(im, ((i % a.cols) * w, (i // a.cols) * h))
sheet.save(a.out)
print('wrote', a.out, f'({len(idx)} frames)')
