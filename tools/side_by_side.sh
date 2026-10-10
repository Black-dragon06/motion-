#!/usr/bin/env bash
# Stack reference (top) and recreation (bottom) into one video with frame numbers,
# using the reference audio. This is the single most useful review artefact.
#   tools/side_by_side.sh reference/reference.mp4 out/higgsfield_one_button.mp4 out/compare_side_by_side.mp4
set -euo pipefail
ref="${1:?ref video}"; new="${2:?new video}"; out="${3:-out/compare_side_by_side.mp4}"
FB=/usr/share/fonts/opentype/inter/Inter-Bold.otf; [ -f "$FB" ] || FB=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
FM=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf
ffmpeg -v error -y -i "$ref" -i "$new" -filter_complex \
"[0:v]scale=960:540,drawtext=fontfile=$FB:text='REFERENCE':x=12:y=10:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=6[a];\
[1:v]scale=960:540,drawtext=fontfile=$FB:text='RECREATION (code)':x=12:y=10:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=6[b];\
[a][b]vstack=inputs=2,drawtext=fontfile=$FM:text='%{n}':x=w-80:y=10:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.5[v]" \
  -map "[v]" -map 0:a? -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a copy -movflags +faststart "$out"
echo "wrote $out"
