#!/usr/bin/env python3
"""Render a frame as ASCII art (luminance) - a text-only "eye" for layout.

Useful for agents without vision and for quick terminal checks: you can see the
letterbox, where text sits, where a button is. Combine with --invert on light
backgrounds. 2 rows of pixels ~ 1 character cell aspect is corrected.

  python3 tools/ascii_frame.py 81 --cols 100
  python3 tools/ascii_frame.py 382 --cols 120 --invert --crop 0,250,1280,470
"""
import argparse
import numpy as np
from PIL import Image
from _common import load_img, parse_box

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('frame', type=int)
ap.add_argument('--src', default='ref')
ap.add_argument('--cols', type=int, default=100)
ap.add_argument('--crop', default=None)
ap.add_argument('--invert', action='store_true')
a = ap.parse_args()

img = load_img(a.frame, a.src).convert('L')
if a.crop:
    img = img.crop(parse_box(a.crop))
rows = max(1, int(a.cols * img.height / img.width * 0.5))
g = np.asarray(img.resize((a.cols, rows), Image.BOX)).astype(float) / 255
ramp = ' .:-=+*#%@'
if a.invert:
    g = 1 - g
print(f'frame {a.frame}  ({img.width}x{img.height} -> {a.cols}x{rows}; 1 char = {img.width / a.cols:.1f} px wide)')
for row in g:
    print(''.join(ramp[min(len(ramp) - 1, int(v * len(ramp)))] for v in row))
