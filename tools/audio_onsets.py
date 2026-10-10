#!/usr/bin/env python3
"""Audio analysis aligned to video frames: onsets (beats / clicks / syllables) and loudness.

Motion in promo videos is cut to the soundtrack: hard cuts sit on clicks/SFX,
words pop on stressed syllables. Knowing the onset frames tells you WHEN things
must happen before you know WHAT happens.

Method: mono 22.05 kHz, one analysis hop per video frame (sr/fps samples),
spectral flux (positive change of the magnitude spectrum) normalised to 0..1,
local maxima above --min are onsets. RMS per frame is printed every 15 frames.

  python3 tools/audio_onsets.py reference/reference.mp4
  python3 tools/audio_onsets.py reference/reference.mp4 --json analysis/audio.json --png analysis/spectrogram.png
  python3 tools/audio_onsets.py reference/reference.mp4 --highband 4000     # click SFX that broadband flux misses
"""
import argparse, json, os, subprocess, tempfile, wave
import numpy as np

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('video')
ap.add_argument('--fps', type=float, default=30)
ap.add_argument('--min', type=float, default=0.25, help='onset threshold on normalised flux')
ap.add_argument('--highband', type=float, default=0, help='also report energy above this frequency (Hz) per frame, e.g. 4000 for click SFX')
ap.add_argument('--json', default=None)
ap.add_argument('--png', default=None, help='also write a spectrogram image (ffmpeg showspectrumpic)')
a = ap.parse_args()

tmp = tempfile.mkdtemp()
wav = os.path.join(tmp, 'a.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-vn', '-ac', '1', '-ar', '22050', wav], check=True)
w = wave.open(wav)
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
hop = int(round(sr / a.fps))
n = len(x) // hop
rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
win = 1024
prev = None
flux = []
for i in range(n):
    seg = x[i * hop:i * hop + win]
    if len(seg) < win:
        seg = np.pad(seg, (0, win - len(seg)))
    S = np.abs(np.fft.rfft(seg * np.hanning(win)))
    flux.append(0.0 if prev is None else float(np.sum(np.maximum(S - prev, 0))))
    prev = S
flux = np.array(flux)
flux /= flux.max() or 1
hb = None
if a.highband:
    freqs = np.fft.rfftfreq(win, 1 / sr)
    hb = []
    for i in range(n):
        seg = x[i * hop:i * hop + win]
        if len(seg) < win:
            seg = np.pad(seg, (0, win - len(seg)))
        hb.append(float(np.abs(np.fft.rfft(seg * np.hanning(win)))[freqs > a.highband].sum()))
    hb = np.array(hb)
    hb /= hb.max() or 1
onsets = [i for i in range(1, n - 1) if flux[i] > flux[i - 1] and flux[i] >= flux[i + 1] and flux[i] > a.min]
print('onset frames:', onsets)
print('onset times :', [round(i / a.fps, 2) for i in onsets])
print('rms every 15 frames (0.5 s):')
for i in range(0, n, 15):
    bar = '#' * int(rms[i] * 120)
    print(f'  f{i:4d} {i / a.fps:5.2f}s {rms[i]:.3f} {bar}')
if hb is not None:
    # local (rolling 31-frame) median: clicks are judged against their surroundings, not the loud VO parts
    loc = np.array([np.median(hb[max(0, i - 15):i + 16]) for i in range(n)])
    peaks = [i for i in range(1, n - 1) if hb[i] > hb[i - 1] and hb[i] >= hb[i + 1] and hb[i] > 2.5 * loc[i] and hb[i] > 0.01]
    print(f'high band > {a.highband:.0f} Hz: peaks above 2.5x the local median (click SFX):', peaks)
if a.json:
    os.makedirs(os.path.dirname(a.json) or '.', exist_ok=True)
    json.dump({'fps': a.fps, 'onsets': onsets, 'flux': [round(float(v), 3) for v in flux],
               'rms': [round(float(v), 4) for v in rms]}, open(a.json, 'w'), indent=1)
    print('wrote', a.json)
if a.png:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-lavfi',
                    'showspectrumpic=s=1740x400:legend=1:scale=log:fscale=log:stop=8000', a.png], check=True)
    print('wrote', a.png)
