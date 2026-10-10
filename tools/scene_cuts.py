#!/usr/bin/env python3
"""Find hard cuts and fast-motion spans.

Method: shrink every frame to 160x90 and take the mean absolute RGB difference
to the previous frame. Hard cuts give a single isolated spike (often > 30);
whip pans / zooms give a *run* of moderate values (12-30) over several frames.
This is more reliable than ffmpeg's `select=gt(scene,..)` for graphic videos.

  python3 tools/scene_cuts.py                       # reference, threshold 12
  python3 tools/scene_cuts.py --src new --threshold 20
  python3 tools/scene_cuts.py --json analysis/cuts.json

Output: one line per frame above threshold, then a summary of hard cuts
(isolated spikes) vs motion spans (consecutive frames).
"""
import argparse, json, os
import numpy as np
from PIL import Image
from _common import frame_path, runs

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--src', default='ref')
ap.add_argument('--threshold', type=float, default=12)
ap.add_argument('--frames', type=int, default=None, help='number of frames (default: all on disk)')
ap.add_argument('--json', default=None)
a = ap.parse_args()

n = a.frames
if n is None:
    n = 0
    while os.path.exists(frame_path(n, a.src)):
        n += 1
prev = None
diff = [0.0]
for i in range(n):
    im = np.asarray(Image.open(frame_path(i, a.src)).convert('RGB').resize((160, 90))).astype(float)
    if prev is not None:
        diff.append(float(np.abs(im - prev).mean()))
    prev = im
diff = np.array(diff)
hot = diff > a.threshold
for i in np.where(hot)[0]:
    print(f'{i:4d}  {diff[i]:6.1f}')
spans = runs(hot, gap=1)
cuts = [s for s, e in spans if s == e]
moves = [(s, e) for s, e in spans if e > s]
print('\nhard cuts (isolated spikes, first frame of the new shot):', cuts)
print('motion spans (whips / zooms / dissolves):', moves)
if a.json:
    os.makedirs(os.path.dirname(a.json) or '.', exist_ok=True)
    json.dump({'threshold': a.threshold, 'diff': [round(float(v), 2) for v in diff], 'cuts': cuts,
               'motion_spans': moves}, open(a.json, 'w'), indent=1)
    print('wrote', a.json)
