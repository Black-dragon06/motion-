#!/usr/bin/env python3
"""Build clean background plates from the reference video.

Photographic / AI-footage layers of the original (landscape flight, desert,
car interior, Creation-of-Adam variations, banana characters, collage photos)
cannot be generated with code, so they are lifted from the reference and the
motion-graphics overlays (text, cursor, frame, captions) are painted out.
Every graphic element on top of these plates is rebuilt in code.

    python3 scripts/extract_plates.py            # all plates
    python3 scripts/extract_plates.py landscape  # one group
"""
import os
import sys
import numpy as np
from PIL import Image
from plate_tools import ROOT, ref_frame, save, dilate, inpaint, rrect_mask

OUT = os.path.join(ROOT, 'assets', 'plates')


def ring_mask(shape, left, top, r=40, width=4):
    h, w = shape[:2]
    outer = rrect_mask(shape, left - width, top - width, w - 1 - left + width, h - 1 - top + width, r + width)
    inner = rrect_mask(shape, left + width, top + width, w - 1 - left - width, h - 1 - top - width, max(1, r - width))
    return outer & ~inner


# frame -> (left, top) inset of the white window frame in the intro
RING = {19: (0, 1), 20: (2, 3), 21: (5, 4), 22: (8, 6), 23: (10, 7), 24: (11, 8), 25: (12, 8), 26: (13, 9), 27: (14, 9)}


def landscape():
    """Intro flight over the hills, frames 0..55 (camera is moving, so one plate per frame)."""
    prev_cursor = None
    for n in range(0, 56):
        img = ref_frame(n)
        h, w = img.shape[:2]
        mask = np.zeros((h, w), bool)
        # 1. headline + Button pill: brighter-than-background or blue pixels in the text band
        band = np.zeros((h, w), bool)
        band[328:428, 150:1010] = True
        bg = inpaint(img, band)
        diff = img.min(axis=2) - bg.min(axis=2)
        txt = band & (diff > 9)
        r, g, b = img[..., 0], img[..., 1], img[..., 2]
        blue = band & (b - r > 55) & (b > 110) & (b - g > 15)
        mask |= dilate(txt | blue, 6)
        # 2. copyright line
        foot = np.zeros((h, w), bool)
        foot[676:712, 470:810] = True
        fbg = inpaint(img, foot)
        fdiff = img.min(axis=2) - fbg.min(axis=2)
        mask |= dilate(foot & ((fdiff > 14) | (img.min(axis=2) > 170)), 3)
        # 3. cursor (white glove + outline + shadow)
        if n >= 21:
            sub = img[400:715, 20:1260].min(axis=2) > 205
            ys, xs = np.where(sub)
            ys = ys + 400
            xs = xs + 20
            sel = ys < 680 if n >= 22 else np.zeros_like(ys, bool)
            if n == 21:
                sel = (ys > 690) & (xs < 260)
            if sel.sum() > 10:
                mx, my = np.median(xs[sel]), np.median(ys[sel])
                near = (np.abs(xs - mx) < 45) & (np.abs(ys - my) < 45) & sel
                x0, x1, y0, y1 = xs[near].min(), xs[near].max(), ys[near].min(), ys[near].max()
                prev_cursor = (x0, x1, y0, y1)
            if prev_cursor is not None:
                x0, x1, y0, y1 = prev_cursor
                mask[max(0, y0 - 20):min(h, y1 + 24), max(0, x0 - 20):min(w, x1 + 24)] = True
        # 4. white window frame
        if n >= 19:
            left, top = RING.get(n, (15, 10))
            mask |= ring_mask(img.shape, left, top, width=4)
        clean = inpaint(img, mask, grain=1.2, seed=n)
        save(clean, os.path.join(OUT, 'landscape', f'{n:03d}.jpg'), quality=88)
        print('landscape', n, int(mask.sum()))


def caption_mask(img, y0=652, y1=684, x0=380, x1=900):
    h, w = img.shape[:2]
    band = np.zeros((h, w), bool)
    band[y0:y1, x0:x1] = True
    bg = inpaint(img, band)
    d = np.abs(img - bg).max(axis=2)
    return dilate(band & (d > 10), 3)


def montage():
    """Photographic backgrounds of the button montage, hero button painted out."""
    jobs = [('mojave', 141, 147, (300, 242, 982, 477, 42)),
            ('greyphoto', 148, 153, (300, 242, 982, 477, 42)),
            ('kling', 178, 183, (300, 242, 982, 477, 42)),
            ('banana', 216, 221, (250, 225, 1032, 500, 60))]
    for name, a, b, (x0, y0, x1, y1, r) in jobs:
        for n in range(a, b + 1):
            img = ref_frame(n)
            mask = rrect_mask(img.shape, x0, y0, x1, y1, r)
            mask[650:690, 380:900] = True      # caption
            mask[:34] = True                   # letterbox rows carry no picture
            mask[686:] = True
            clean = inpaint(img, mask, grain=1.0, seed=n)
            save(clean, os.path.join(OUT, name, f'{n:03d}.jpg'), quality=90)
        print(name, a, b)


def lifesaver():
    """Creation-of-Adam footage (Life saver / style flashes / Higgsfield), button painted out."""
    import json
    rects = json.load(open(os.path.join(ROOT, 'composition', 'data', 'lifesaver.json')))
    for n in range(296, 382):
        l, r, t, b = rects[str(n)]
        img = ref_frame(n)
        pad = 12
        rad = max(12, int((b - t) * 0.16))
        mask = rrect_mask(img.shape, l - pad, t - pad, r + pad, b + pad, rad + pad)
        if 296 <= n <= 300:   # light sweep spills past the right edge
            mask |= rrect_mask(img.shape, l - pad, t - pad, r + 60, b + pad, rad + pad)
        mask[:max(29, 0)] = True
        mask[691:] = True
        clean = inpaint(img, mask, grain=1.4, seed=n)
        save(clean, os.path.join(OUT, 'creation', f'{n:03d}.jpg'), quality=86)
    print('creation 296..381')


def costs_progress(f):
    t = min(1.0, max(0.0, (f - 453) / 38))
    return 1 - (1 - t) ** 3


def costs():
    """Dark card table behind the arched 'No more unnecessary costs' line, lettering painted out."""
    import json
    d = json.load(open(os.path.join(ROOT, 'composition', 'data', 'costs.json')))
    ex = dict((a, b) for a, b in d['exit'])
    for n in range(453, 510):
        img = ref_frame(n)
        h, w = img.shape[:2]
        p = costs_progress(n)
        keys = sorted(ex)
        tx = 0.0
        for a, b in zip(keys, keys[1:]):
            if a <= n <= b:
                tx = ex[a] + (ex[b] - ex[a]) * (n - a) / (b - a)
        yy, xx = np.mgrid[0:h, 0:w]
        mask = np.zeros((h, w), bool)
        items = [(g['a'], g['b'], g['b'][3] * 0.62) for g in d['glyphs']]
        items.append((d['cursor']['a'], d['cursor']['b'], 48))
        for a, b, rad in items:
            cx = a[0] + (b[0] - a[0]) * p + tx
            cy = a[1] + (b[1] - a[1]) * p
            mask |= (xx - cx) ** 2 + (yy - cy) ** 2 <= (rad + 14 + abs(tx) * 0.25) ** 2
        # also catch any leftover lettering pixels inside the text band
        r, g, b = img[..., 0], img[..., 1], img[..., 2]
        band = np.zeros((h, w), bool)
        band[150:500, 60:1200] = True
        red = (r > 120) & (r - g > 60)
        mask |= dilate(band & red & dilate(mask, 40), 6)
        mask[:47] = True
        mask[673:] = True
        clean = inpaint(img, mask, grain=1.2, seed=n)
        save(clean, os.path.join(OUT, 'costs', f'{n}.jpg'), quality=86)
    print('costs 453..509')


def _components(m, min_area=12):
    """Connected components (8-neighbour) -> list of (area, x0, x1, y0, y1, mask)."""
    from collections import deque
    h, w = m.shape
    lab = np.zeros((h, w), np.int32)
    out = []
    ys, xs = np.nonzero(m)
    cur = 0
    for y, x in zip(ys, xs):
        if lab[y, x]:
            continue
        cur += 1
        q = deque([(y, x)])
        lab[y, x] = cur
        pts = []
        while q:
            yy, xx = q.popleft()
            pts.append((yy, xx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    a, b = yy + dy, xx + dx
                    if 0 <= a < h and 0 <= b < w and m[a, b] and not lab[a, b]:
                        lab[a, b] = cur
                        q.append((a, b))
        if len(pts) >= min_area:
            p = np.array(pts)
            out.append((len(pts), p[:, 1].min(), p[:, 1].max(), p[:, 0].min(), p[:, 0].max(), p))
    return out


VIDEO_S = {560: .68, 561: .82, 562: .93, 563: .98, 564: 1.01, 565: 1.01, 566: 1.0, 567: .98, 568: .95, 569: .94, 570: .93,
           571: .93, 572: .94, 573: .95, 574: .95, 575: .95, 576: .95, 577: .95}


def features():
    """Video ring / Image collage / Motion + Pure Creation collage, titles painted out."""
    for n in list(range(560, 580)) + list(range(601, 691)):
        img = ref_frame(n)
        h, w = img.shape[:2]
        mask = np.zeros((h, w), bool)
        mx = img.max(axis=2)
        mn = img.min(axis=2)
        if n in VIDEO_S:
            sc = VIDEO_S[n]
            box = np.zeros((h, w), bool)
            box[int(362 - 40 * sc):int(362 + 40 * sc), int(641 - 112 * sc):int(641 + 112 * sc)] = True
            mask = dilate(box & (mx < 140), 4)
        elif 601 <= n <= 616:
            # "Image" is interleaved in depth with the flying photo cards, so it stays in the plate
            pass
        elif 617 <= n <= 621:
            # whip into "Motion": title is motion-blurred into the footage, keep it in the plate
            pass
        elif n >= 622:
            # white lettering on the black title card
            card = (mx < 40)
            box = np.zeros((h, w), bool)
            box[60:640, 120:1100] = True
            comps = _components(card & box, 400)
            if comps:
                area, x0, x1, y0, y1, pts = max(comps, key=lambda c: c[0])
                inside = np.zeros((h, w), bool)
                inside[y0:y1 + 1, x0:x1 + 1] = True
                txt = inside & (mn > 120) & ((mx - mn) < 60)
                keep = np.zeros((h, w), bool)
                boxes = []
                for a2, xa, xb, ya, yb, p2 in _components(txt, 6):
                    if (yb - ya) < 120 and (xb - xa) < 160:
                        keep[p2[:, 0], p2[:, 1]] = True
                        boxes.append((xa, xb, ya, yb))
                if boxes:
                    # the letters that overlap the bright keyhole merge with it, so clear the whole title band
                    bx0 = min(b[0] for b in boxes); bx1 = max(b[1] for b in boxes)
                    by0 = min(b[2] for b in boxes); by1 = max(b[3] for b in boxes)
                    band = np.zeros((h, w), bool)
                    band[max(y0, by0 - 4):min(y1, by1 + 5), max(x0, bx0 - 6):min(x1, bx1 + 7)] = True
                    keep |= band & (mn > 60)
                mask = dilate(keep, 4)
        mask[:29] = True
        mask[691:] = True
        clean = inpaint(img, mask, grain=1.0, seed=n)
        save(clean, os.path.join(OUT, 'features', f'{n}.jpg'), quality=86)
    print('features done')


def closeup():
    """Hill flight behind the 'this Button before' close-up; text band, cursor and caption painted out."""
    for n in range(56, 99):
        img = ref_frame(n)
        h, w = img.shape[:2]
        mask = np.zeros((h, w), bool)
        mask[178 if n < 64 else 248:486, :] = True
        white = (img.min(axis=2) > 200)
        white[:486] = False
        mask |= dilate(white, 26)
        mask[650:690, 520:760] = True
        mask[:36] = True
        mask[684:] = True
        clean = inpaint(img, mask, grain=1.0, seed=n)
        save(clean, os.path.join(OUT, 'closeup', f'{n}.jpg'), quality=88)
    print('closeup done')


def typing():
    """Cream/lime gradient behind the typed line (and around the closing 'But…' card)."""
    import re
    src = open(os.path.join(ROOT, 'composition', 'scenes', '04-but.js')).read()
    card = {int(a): [float(v) for v in b.split(',')] for a, b in re.findall(r'\[(\d+), \[([\d., ]+)\]', src.split('const CARD')[1].split(';')[0])}
    for n in range(243, 296):
        img = ref_frame(n)
        h, w = img.shape[:2]
        lum = img.mean(axis=2)
        mask = dilate(lum < (45 if n <= 249 else 110), 10)
        if n in card:
            l, r, t, b = card[n]
            mask[int(t) - 8:int(b) + 8, int(l) - 8:int(r) + 8] = True
        clean = inpaint(img, mask, grain=0.6, seed=n)
        save(clean, os.path.join(OUT, 'typing', f'{n}.jpg'), quality=88)
    print('typing done')


GROUPS = {'closeup': closeup, 'typing': typing, 'landscape': landscape, 'montage': montage, 'lifesaver': lifesaver, 'costs': costs, 'features': features}

if __name__ == '__main__':
    names = sys.argv[1:] or list(GROUPS)
    for name in names:
        GROUPS[name]()
