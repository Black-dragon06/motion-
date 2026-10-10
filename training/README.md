# training/ — data for teaching a model this method

| File | What |
|---|---|
| `motion_sft.jsonl` | 35 instruction → response pairs (chat format: system / user / assistant + `source`) distilled from this project: analysis steps, easing identification from real tracks, measurement → code, debugging real bugs, QA decisions, rendering. Every answer reflects what was actually measured and done here. |
| `build_dataset.py` | generates `motion_sft.jsonl` (edit the examples there, then re-run) |

## Ways to use it with a model such as DeepSeek

1. **System prompt** — `docs/18-system-prompt.md` (ready to paste). Cheapest and most effective first step.
2. **Few-shot** — put 3–6 relevant pairs from `motion_sft.jsonl` before the task
   (e.g. for "add motion to this element": the easing-fit, keyframes and motion-blur examples).
3. **Retrieval** — index `docs/*.md`, `analysis/measurements/*.txt`, `tools/*.py` docstrings and
   `motion_sft.jsonl`; retrieve by the task ("measure a label", "typing scroll", "black plate").
4. **Fine-tuning** — the JSONL is in the common chat format accepted by most SFT pipelines.
   35 examples teach the *style* (measure → numbers → code → verify); for real gains add
   pairs from new projects in the same format: every time a reference is recreated,
   add its measurement → code pairs and its bug → fix pairs.

## What a model must learn (the curriculum, in order)

1. Frame-pure rendering (`docs/05-engine-api.md`).
2. Reading a reference as numbers (`docs/02-reference-analysis.md`, `docs/03-measurement-cookbook.md`).
3. Motion laws from deltas (`docs/04-motion-language.md`).
4. Placing text by ink box and baseline (`docs/08-typography.md`).
5. Lift vs draw (`docs/07-plates-and-inpainting.md`).
6. The QA loop and prioritisation (`docs/09-qa-loop.md`).
7. The pitfalls (`docs/10-pitfalls.md`).
8. A complete worked scene (`docs/16-worked-example-intro.md`), then the exercises (`docs/17-exercises.md`).
