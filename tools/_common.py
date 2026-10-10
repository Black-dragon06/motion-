"""Shared helpers for the analysis tools.

Conventions (used everywhere in this repo):
  * Frame numbers are 0-based (frame 0 = first frame, 869 = last of 870).
  * Frames on disk are named f0001.jpg ... f0870.jpg (ffmpeg %04d is 1-based),
    so frame n lives in f{n+1:04d}.jpg.
  * "ref" = frames of the reference video, "new" = frames of our render.

Directories (override with environment variables):
  MOTION_REF_DIR   default .cache/frames/ref   (make frames)
  MOTION_NEW_DIR   default .cache/frames/new   (make frames-new)
"""
import os
import sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REF_DIR = os.environ.get('MOTION_REF_DIR', os.path.join(ROOT, '.cache', 'frames', 'ref'))
NEW_DIR = os.environ.get('MOTION_NEW_DIR', os.path.join(ROOT, '.cache', 'frames', 'new'))
W, H, FPS = 1280, 720, 30


def src_dir(src):
    """'ref' | 'new' | any directory path -> directory path."""
    if src == 'ref':
        return REF_DIR
    if src == 'new':
        return NEW_DIR
    return src


def frame_path(n, src='ref'):
    return os.path.join(src_dir(src), f'f{n + 1:04d}.jpg')


def load(n, src='ref', mode='RGB'):
    """Frame n as an int array (H, W, 3) for RGB or (H, W) for 'L'."""
    p = frame_path(n, src)
    if not os.path.exists(p):
        sys.exit(f'missing frame {p} - run `make frames` (ref) or `make frames-new` (new) first')
    return np.asarray(Image.open(p).convert(mode)).astype(int)


def load_img(n, src='ref'):
    return Image.open(frame_path(n, src)).convert('RGB')


def runs(mask1d, gap=2):
    """Contiguous True runs of a 1-D boolean array as [(start, end)], merging gaps <= gap."""
    idx = np.where(mask1d)[0]
    if len(idx) == 0:
        return []
    out = []
    s = p = idx[0]
    for v in idx[1:]:
        if v - p > gap:
            out.append((int(s), int(p)))
            s = v
        p = v
    out.append((int(s), int(p)))
    return out


def hexc(rgb):
    r, g, b = [int(round(v)) for v in rgb[:3]]
    return f'#{r:02x}{g:02x}{b:02x}'


def parse_hex(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)])


def parse_frames(spec):
    """'10 20 30' / '10,20,30' / '10-20' / '10-40:5' -> list of ints."""
    out = []
    for tok in spec.replace(',', ' ').split():
        if '-' in tok:
            rng, _, step = tok.partition(':')
            a, b = [int(v) for v in rng.split('-')]
            out += list(range(a, b + 1, int(step) if step else 1))
        else:
            out.append(int(tok))
    return out


def parse_box(spec):
    """'x0,y0,x1,y1' -> tuple of ints (x1/y1 exclusive)."""
    return tuple(int(v) for v in spec.split(','))


def font(size=16, bold=True):
    from PIL import ImageFont
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def label(im, text, size=16):
    """Burn a small white label with red text into the top-left corner."""
    from PIL import ImageDraw
    d = ImageDraw.Draw(im)
    f = font(size)
    w = int(d.textlength(text, font=f)) + 8
    d.rectangle([0, 0, w, size + 4], fill='white')
    d.text((3, 1), text, fill='red', font=f)
    return im
