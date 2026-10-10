# templates/

| File | Use |
|---|---|
| `scene.template.js` | skeleton of a scene module: measured constants on top, DOM built once, `prepare()` for text, pure `update(f)` |
| `BRIEF.template.md` | structure of the motion brief to write after analysis |
| `NOTES.template.md` | running notes for an agent (status per block, measurements, decisions, next step) |

## Start a new project from this repository

```bash
# 1. new reference
cp /path/to/new.mp4 reference/reference.mp4
tools/probe.sh reference/reference.mp4            # set W, H, FPS, TOTAL_FRAMES in composition/lib/core.js
make frames                                       # .cache/frames/ref
ffmpeg -i reference/reference.mp4 -vn -c:a copy assets/audio/soundtrack.m4a

# 2. clear the old composition but keep the engine
#    keep: composition/lib/*, composition/index.html, composition/styles.css, scripts/render.mjs, scripts/plate_tools.py
#    replace: composition/scenes/*, composition/data/*, the scene imports + BAR keys in composition/main.js,
#             the plate groups in scripts/extract_plates.py, assets/plates/*

# 3. analysis -> analysis/shots.json, BRIEF.md (from BRIEF.template.md), NOTES.md (from NOTES.template.md)

# 4. one scene at a time: cp templates/scene.template.js composition/scenes/01-<name>.js,
#    import it in composition/main.js, measure, build, tools/qa.sh, repeat
```

For a quick sandbox (no reference needed): `examples/minimal/` is a complete
3-second composition using the same engine; render it with
`node scripts/render.mjs --page examples/minimal/index.html --audio none --scale 1 --out out/example_minimal.mp4`.
