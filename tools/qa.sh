#!/usr/bin/env bash
# The inner QA loop: render only the listed frames of OUR composition, then build a
# REF-over-NEW comparison sheet. Takes ~2-5 s, so run it after every change.
#   tools/qa.sh out.png 0.5 4 99 113 124 160
# args: output png, scale of each tile (0.5 = 640x360), columns, frame numbers...
set -euo pipefail
cd "$(dirname "$0")/.."
out="${1:?out.png}"; scale="${2:?scale}"; cols="${3:?cols}"; shift 3
list=$(echo "$@" | tr ' ' ',')
NEW="${MOTION_NEW_DIR:-.cache/frames/new}"
node scripts/render.mjs --frames "$NEW" --list "$list" --scale 1 >/dev/null
python3 tools/compare_frames.py --frames "$@" --scale "$scale" --cols "$cols" --out "$out"
echo "wrote $out"
