#!/usr/bin/env python3
"""Fit an easing model to a measured track (frame -> value) and print JS you can paste.

Every motion in a reference can be measured as numbers per frame (x of a word,
scale of a button, height of a bar). Instead of guessing an easing, fit one:

  exp   v = T + A * r^(f - f0)          exponential settle ("expo-out", what most
                                         text reveals in After Effects look like)
  pow   v = v0 + (v1 - v0) * (1 - (1 - t)^p),  t = (f - f0)/(f1 - f0)
                                         ease-out of power p (p=2 quad, 3 cubic, 4 quart)
  pin   v = v0 + (v1 - v0) * t^p        ease-in (accelerating: whips, exits)
  lin   straight line

  python3 tools/fit_easing.py "10:359 11:349 12:343 13:336 14:330 15:326 16:321 17:318 18:315 19:312 20:309 22:304 26:297 30:291 40:284 47:283"
  python3 tools/fit_easing.py --file track.txt          # lines "frame value"

The intro word "We've" above fits exp with r = 0.90: every frame the word covers
10% of the remaining distance. That is why the code uses `x = final + off * 0.9^n`.
If no model fits well (RMSE > ~2 px) keep the measured keyframes as they are
(tools/emit_keyframes.py) - linear interpolation between per-frame measurements
is always exact.
"""
import argparse, sys
import numpy as np

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('pairs', nargs='?', default=None, help='"f:v f:v ..."')
ap.add_argument('--file', default=None)
a = ap.parse_args()

pts = []
if a.file:
    for line in open(a.file):
        p = line.replace(',', ' ').split()
        if len(p) >= 2:
            pts.append((float(p[0]), float(p[1])))
elif a.pairs:
    pts = [tuple(float(x) for x in t.split(':')) for t in a.pairs.split()]
else:
    sys.exit('give pairs or --file')
f = np.array([p[0] for p in pts])
v = np.array([p[1] for p in pts])
f0, f1 = f[0], f[-1]
res = []

# exponential settle
best = None
for r in np.linspace(0.3, 0.995, 400):
    X = np.vstack([np.ones_like(f), r ** (f - f0)]).T
    coef, *_ = np.linalg.lstsq(X, v, rcond=None)
    e = np.sqrt(np.mean((X @ coef - v) ** 2))
    if best is None or e < best[0]:
        best = (e, r, coef)
e, r, (T, A) = best
res.append((e, f'exp   r={r:.3f}  target={T:.1f}  start_offset={A:.1f}  (half-life {np.log(0.5) / np.log(r):.1f} frames)',
            f'const x = {T:.1f} + {A:.1f} * Math.pow({r:.3f}, f - {int(f0)});'))

t = (f - f0) / (f1 - f0 or 1)
for name, fn in (('pow', lambda t, p: 1 - (1 - t) ** p), ('pin', lambda t, p: t ** p)):
    bb = None
    for p in np.linspace(0.5, 8, 300):
        y = v[0] + (v[-1] - v[0]) * fn(t, p)
        e = np.sqrt(np.mean((y - v) ** 2))
        if bb is None or e < bb[0]:
            bb = (e, p)
    js = ('1 - Math.pow(1 - t, %.2f)' if name == 'pow' else 'Math.pow(t, %.2f)') % bb[1]
    res.append((bb[0], f'{name}   p={bb[1]:.2f}  from {v[0]:.1f} @ {int(f0)} to {v[-1]:.1f} @ {int(f1)}',
                f'const t = clamp((f - {int(f0)}) / {int(f1 - f0)}); const x = {v[0]:.1f} + {v[-1] - v[0]:.1f} * ({js});'))
coef = np.polyfit(f, v, 1)
res.append((np.sqrt(np.mean((np.polyval(coef, f) - v) ** 2)), f'lin   slope={coef[0]:.2f}/frame',
            f'const x = {coef[1]:.1f} + {coef[0]:.3f} * f;'))
res.sort(key=lambda x: x[0])
print('model fits, best first (RMSE in the units of your values):')
for e, desc, js in res:
    print(f'  rmse {e:6.2f}   {desc}\n               {js}')
