# Motion recreation toolkit — common commands. `make help` lists them.
REF      ?= reference/reference.mp4
REF_DIR  ?= .cache/frames/ref
NEW_DIR  ?= .cache/frames/new
FRAMES   ?= 81 162 346 497
SCALE    ?= 0.5
COLS     ?= 4

.PHONY: help frames frames-new preview render render-720 compare score qa analysis measurements plates example check

help:
	@echo "make frames         reference frames -> $(REF_DIR) (needed by all analysis tools)"
	@echo "make frames-new     render every frame of the composition -> $(NEW_DIR)"
	@echo "make preview        http://localhost:8080/composition/index.html (arrows = frame step, space = play)"
	@echo "make qa FRAMES=\"81 90\"  render those frames and build REF/NEW sheet -> .cache/qa.png"
	@echo "make score          per-frame / per-block difference vs reference (needs frames + frames-new)"
	@echo "make render         out/higgsfield_one_button.mp4 (1920x1080, audio)"
	@echo "make render-720     out/higgsfield_one_button_720p.mp4"
	@echo "make compare        out/compare_side_by_side.mp4 (reference over recreation)"
	@echo "make analysis       cuts, audio onsets, letterbox -> analysis/"
	@echo "make measurements   re-run every key measurement -> analysis/measurements/"
	@echo "make plates         re-extract all footage plates from the reference (slow)"
	@echo "make example        render examples/minimal -> out/example_minimal.mp4"
	@echo "make check          syntax-check all JS and Python"

frames:
	@if [ "$$(ls $(REF_DIR) 2>/dev/null | wc -l)" -lt 2 ]; then tools/extract_frames.sh $(REF) $(REF_DIR); else echo "$(REF_DIR) already has frames"; fi

frames-new:
	node scripts/render.mjs --frames $(NEW_DIR) --scale 1

preview:
	npx --yes http-server -c-1 -p 8080 . -o /composition/index.html

qa:
	MOTION_NEW_DIR=$(NEW_DIR) tools/qa.sh .cache/qa.png $(SCALE) $(COLS) $(FRAMES)

score:
	python3 tools/score.py --json analysis/scores.json --top 10 | tee analysis/score_report.txt

render:
	node scripts/render.mjs

render-720:
	node scripts/render.mjs --scale 1 --out out/higgsfield_one_button_720p.mp4

compare:
	tools/side_by_side.sh $(REF) out/higgsfield_one_button.mp4 out/compare_side_by_side.mp4

analysis: frames
	python3 tools/scene_cuts.py --json analysis/cuts.json
	python3 tools/audio_onsets.py $(REF) --json analysis/audio.json --png analysis/spectrogram.png
	python3 tools/letterbox.py --from 0 --to 869 --step 1 --json analysis/letterbox.json > /dev/null

measurements: frames
	bash analysis/measurements/run_all.sh

plates:
	python3 scripts/extract_plates.py

example:
	node scripts/render.mjs --page examples/minimal/index.html --audio none --scale 1 --out out/example_minimal.mp4

check:
	@for f in composition/*.js composition/lib/*.js composition/scenes/*.js composition/data/*.js examples/minimal/*.js tools/*.mjs scripts/*.mjs; do node --check $$f || exit 1; done
	@python3 -m py_compile tools/*.py scripts/*.py && echo "all JS and Python files parse"
