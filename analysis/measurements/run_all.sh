#!/usr/bin/env bash
# Re-runs every key measurement that the composition is built from and saves the raw
# tool output next to this script. Each file starts with the command and the place
# in the code where the numbers ended up - read them as "measurement -> code" pairs.
#   bash analysis/measurements/run_all.sh        (needs `make frames` first)
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=analysis/measurements
m() {  # m <file> <used-in> <command...>
  local f="$OUT/$1"; local used="$2"; shift 2
  { echo "# \$ $*"; echo "# used in: $used"; "$@"; } > "$f" 2>&1
  echo "  $f ($(wc -l < "$f") lines)"
}

m 01-intro-words.txt "composition/scenes/01-intro.js WORDS (x final, appear frame, start offset) + fit_easing -> 0.9^n" \
  python3 tools/segments.py --from 8 --to 55 --box 150,330,1010,420 --mode bright --thr 185 --gap 14
m 01-intro-word-fit.txt "composition/scenes/01-intro.js: x = final + off * 0.9^(f - appear)" \
  python3 tools/fit_easing.py "10:359 11:349 12:343 13:336 14:330 15:326 16:321 17:318 18:315 19:312 20:309 22:304 26:297 30:291 40:284 47:283"
m 01-intro-cursor.txt "composition/scenes/01-intro.js CUR (glove centre per frame)" \
  python3 tools/track_blob.py --from 20 --to 55 --box 20,410,1260,684 --thr 205
m 01-letterbox.txt "composition/main.js BAR keyframes (global letterbox)" \
  python3 tools/letterbox.py --from 0 --to 869 --step 2
m 01-pill-colour.txt "composition/scenes/01-intro.js pill fade-in (colour ramps 49..55)" \
  python3 tools/sample_colors.py 52 736,388,1 862,370,1 800,365,1
m 02-closeup-text.txt "composition/scenes/02-closeup.js: baseline 411, 'this' 16..314, 'befo' from 963, caption" \
  python3 tools/segments.py --from 64 --to 98 --step 2 --box 0,260,1280,420 --mode bright --thr 225 --gap 20
m 02-closeup-pill.txt "composition/scenes/02-closeup.js pill rect 349..936 x 256..469, PILL_S click squash 94..98, CAM_TX/CAM_S whip-in" \
  python3 tools/segments.py --from 56 --to 98 --box 0,150,1280,560 --mode color --color '#305ca5' --tol 40 --gap 30 --min-count 40
m 02-closeup-cursor.txt "composition/scenes/02-closeup.js CUR (glove bottom-right corner)" \
  python3 tools/track_blob.py --from 56 --to 98 --box 0,418,1280,650 --thr 200
m 02-hover-glow.txt "composition/scenes/02-closeup.js glow radius/intensity ramp 70..96 (#305ca5 -> #1697f4)" \
  bash -c 'for n in 64 68 72 76 80 84 88 92 96; do echo -n "$n  "; python3 tools/sample_colors.py $n 700,440 600,440 500,440 750,300 | tr "\n" " "; echo; done'
m 03-applepay-button.txt "composition/scenes/03-montage.js Apple Pay group scale S (pop 0.86->1, click 0.95)" \
  python3 tools/track_region.py --from 99 --to 113 --at 470,330 --tol 30
m 03-applepay-cursor.txt "composition/scenes/03-montage.js Apple Pay + GPT cursor track C" \
  python3 tools/track_blob.py --from 99 --to 118 --box 790,120,1279,640 --thr 225
m 03-hero-buttons.txt "composition/scenes/03-montage.js HERO {x:306,y:248,w:671,h:224,r:37} and fills of every shot" \
  bash -c 'for n in 145 150 156 162 169 174 186 198 202 208 213 224; do echo -n "$n "; python3 tools/flood_rect.py --from $n --to $n --seed 330,300 | tail -1; done'
m 03-labels.txt "composition/scenes/03-montage.js textL/textR of every label (ink left/right), baseline 384" \
  bash -c 'for p in 145:1b284a 150:ebecdc 156:eceffe 162:1c1c1c 174:9de424 186:423956 202:d17159 208:d7c8ab; do n=${p%%:*}; c=${p##*:}; python3 tools/segments.py --from $n --box 330,285,955,440 --mode notcolor --color "#$c" --tol 70 --gap 9; done'
m 03-grid-cells.txt "composition/scenes/03-montage.js hgrid() rows (Runway/brown) and vgrid() columns (red)" \
  bash -c 'for n in 172 174 177 205 208 211 215; do echo "== $n"; python3 tools/segments.py --from $n --box 0,95,1280,105 --mode notcolor --color "#2a2a28" --tol 25 --gap 3 | head -1; done'
m 03-copilot-ribbon.txt "composition/scenes/03-montage.js FRONT ribbon path: centre of each row span = a point on the path, span height = stroke width / sin(angle)" \
  bash -c 'for x in $(seq 0 40 680); do echo -n "x=$x "; python3 tools/segments.py --from 171 --box $x,34,$((x+1)),686 --mode color --color "#a97ab6" --tol 45 --gap 4 | sed "s/.*rows/rows/"; done'
m 04-but-letters.txt "composition/scenes/04-but.js GLYPHS rest boxes (frame 240) + RISE/DRIFT curves" \
  python3 tools/segments.py --from 227 --to 249 --box 0,60,1280,660 --mode bright --thr 200 --gap 8 --min-count 3
m 05-typing-pan.txt "composition/scenes/04-but.js PAN (document scroll per frame)" \
  python3 tools/scroll_profile.py --from 250 --to 295 --box 0,250,1280,470 --right "250:234 251:322 252:404 253:462 254:514 255:558 256:596 257:629 258:658 259:684 260:706 261:727 262:744 263:757 264:766 265:777 266:788 267:801 268:815 269:830 270:847 271:864 272:881 273:897 274:913 275:926 276:938 277:948 278:956 279:963 280:968 281:971 282:974 283:975 284:975 285:973 286:971 287:967 288:962 289:955 290:947 291:936 292:922 293:905 294:885 295:862"
m 05-typing-glyphs.txt "composition/scenes/04-but.js REF_GLYPHS (doc x = screen x + pan) and CARET track" \
  python3 tools/segments.py --from 250 --to 295 --box 0,240,1280,480 --mode dark --thr 90 --gap 5 --min-count 4
m 06-lifesaver-rects.txt "composition/data/lifesaver.json (button rect per frame; 341, 347-350 fixed by hand)" \
  python3 tools/flood_rect.py --from 296 --to 381 --seed-track "296:488,300 305:392,300 330:330,300 340:349,300 345:387,300 352:460,320 381:489,320"
m 08-higgsfield-fade.txt "composition/scenes/06-lifesaver.js b/w grade 356-360, white overlay + button fade 364-388 (std -> 0 = flat grey)" \
  python3 tools/luma_stats.py --from 352 --to 400 --step 3 --box 100,100,400,250
m 09-nomore-words.txt "composition/scenes/09-nomore.js WORDS (x final, start frame, decay ratio)" \
  python3 tools/segments.py --from 382 --to 452 --step 2 --box 0,300,1280,420 --mode dark --thr 200 --gap 11
m 09-bubble.txt "composition/scenes/09-nomore.js BUB (right, top, radius) and TAIL" \
  python3 tools/segments.py --from 400 --to 452 --step 2 --box 1000,34,1279,340 --mode color --color '#2350b4' --tol 70 --gap 3
m 09-cursor.txt "composition/scenes/09-nomore.js CUR" \
  python3 tools/track_blob.py --from 418 --to 452 --box 0,410,1000,640 --mode dark --thr 120
m 10-costs-red-453.txt "composition/data/costs.json glyph 'a' poses (red letters)" \
  python3 tools/components.py 453 --box 0,110,1230,560 --mask "(r>140)&(r-g>80)"
m 10-costs-red-497.txt "composition/data/costs.json glyph 'b' poses (red letters)" \
  python3 tools/components.py 497 --box 0,110,1230,560 --mask "(r>140)&(r-g>80)"
m 10-costs-white-497.txt "composition/data/costs.json glyph 'b' poses (white letters + cursor)" \
  python3 tools/components.py 497 --box 0,110,1230,560 --mask "(r>120)&(g>120)&(b>120)"
m 11-payonce-dark.txt "composition/scenes/11-payonce.js 'Pay'/'once,' boxes, ZOOM/DROP curves (unzoom: x = 631 + (X-631)/zoom)" \
  python3 tools/segments.py --from 510 --to 559 --box 0,80,1280,640 --mode dark --thr 110 --gap 14
m 11-payonce-blue.txt "composition/scenes/11-payonce.js swoosh end SWOOSH_END and 'And done (:' boxes" \
  python3 tools/segments.py --from 510 --to 559 --box 0,80,1280,640 --mode color --color '#2350b4' --tol 70 --gap 14
m 12-voice-pill.txt "composition/scenes/12-features.js SQ squash&stretch (pill rect / 755x167)" \
  python3 tools/flood_rect.py --from 578 --to 601 --seed 560,420 --tol 12
m 12-voice-title.txt "composition/scenes/12-features.js TY (cap top of 'Voice')" \
  python3 tools/segments.py --from 580 --to 600 --box 400,100,900,300 --mode dark --thr 70 --gap 12
m 17-logo-words.txt "composition/scenes/17-logo.js WORDS per-frame [left,right]" \
  python3 tools/segments.py --from 690 --to 760 --step 2 --box 400,340,1000,400 --mode dark --thr 150 --gap 9
m 17-logo-mark.txt "composition/scenes/17-logo.js MARK rect per frame" \
  python3 tools/segments.py --from 690 --to 780 --step 2 --box 300,100,1000,345 --mode dark --thr 45 --gap 3 --min-count 20
m 18-fade.txt "composition/scenes/17-logo.js final fade: root opacity = max luma / 255 (822..869)" \
  python3 tools/luma_stats.py --from 780 --to 869 --step 6
echo done
