"""Helpers for building clean background plates out of the reference video.

Only numpy + Pillow are required. The core is a push-pull (pyramid) inpaint
that works very well on the defocused / smooth backgrounds of this piece.
"""
import os
import subprocess
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REF = os.path.join(ROOT, 'reference', 'reference.mp4')
CACHE = os.environ.get('PLATE_CACHE', os.path.join(ROOT, '.cache', 'ref_frames'))


def ref_frame(n):
    """Frame n (0-based) of the reference as float32 RGB array."""
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, f'f{n + 1:04d}.png')
    if not os.path.exists(p):
        if not os.listdir(CACHE):
            subprocess.run(['ffmpeg', '-v', 'error', '-i', REF, os.path.join(CACHE, 'f%04d.png')], check=True)
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float32)


def save(arr, path, quality=90):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if path.endswith('.png'):
        im.save(path)
    else:
        im.save(path, quality=quality, subsampling=0)


def dilate(mask, r):
    if r <= 0:
        return mask
    im = Image.fromarray((mask * 255).astype(np.uint8))
    im = im.filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(im) > 127


def feather(mask, r):
    im = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im).astype(np.float32) / 255.0


def _down(img, w):
    h2, w2 = img.shape[0] // 2, img.shape[1] // 2
    img = img[:h2 * 2, :w2 * 2]
    w = w[:h2 * 2, :w2 * 2]
    iw = img * w[..., None]
    s = iw.reshape(h2, 2, w2, 2, -1).sum(axis=(1, 3))
    ws = w.reshape(h2, 2, w2, 2).sum(axis=(1, 3))
    out = s / np.maximum(ws, 1e-6)[..., None]
    return out, (ws > 0).astype(np.float32) * np.minimum(ws, 1.0)


def _up(img, shape):
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    im = im.resize((shape[1], shape[0]), Image.BILINEAR)
    return np.asarray(im).astype(np.float32)


def inpaint(img, mask, grain=0.0, seed=0):
    """Fill pixels where mask is True from their surroundings (push-pull)."""
    w = (~mask).astype(np.float32)
    levels = [(img, w)]
    cur, cw = img, w
    while min(cur.shape[:2]) > 4 and cw.min() == 0:
        cur, cw = _down(cur, cw)
        levels.append((cur, cw))
    fill = levels[-1][0]
    for im, ww in reversed(levels[:-1]):
        up = _up(fill, im.shape)
        fill = im * ww[..., None] + up * (1 - ww[..., None])
    out = img.copy()
    soft = feather(mask, 1.2)[..., None]
    out = img * (1 - soft) + fill * soft
    if grain > 0:
        rng = np.random.default_rng(seed)
        noise = rng.normal(0, grain, img.shape[:2])[..., None]
        out = out + noise * soft
    return out


def rrect_mask(shape, x0, y0, x1, y1, r):
    """Boolean mask of a rounded rectangle."""
    h, w = shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    cx = np.clip(xx, x0 + r, x1 - r)
    cy = np.clip(yy, y0 + r, y1 - r)
    return (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r
