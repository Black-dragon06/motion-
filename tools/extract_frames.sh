#!/usr/bin/env bash
# Dump every frame of a video as high-quality JPEGs named f0001.jpg ... (1-based
# file names; frame n lives in f{n+1:04d}.jpg). Also extracts the audio.
#   tools/extract_frames.sh reference/reference.mp4 .cache/frames/ref
set -euo pipefail
v="${1:?usage: tools/extract_frames.sh video.mp4 outdir}"
out="${2:-.cache/frames/ref}"
mkdir -p "$out"
ffmpeg -v error -y -i "$v" -q:v 2 "$out/f%04d.jpg"
echo "frames: $(ls "$out" | wc -l) -> $out"
