#!/usr/bin/env bash
# Print the technical passport of a video: resolution, fps, frame count, duration,
# codecs, colour space, audio. Always run this first - every later number
# (frame indices, pixel coordinates) depends on it.
#   tools/probe.sh reference/reference.mp4
set -euo pipefail
v="${1:?usage: tools/probe.sh video.mp4}"
ffprobe -v error -show_format -show_streams "$v" \
  | grep -E '^(codec_name|width|height|r_frame_rate|avg_frame_rate|nb_frames|duration|pix_fmt|color_space|color_transfer|color_primaries|sample_rate|channels|bit_rate)='
