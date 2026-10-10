#!/usr/bin/env node
// Evaluate a JavaScript expression inside the running composition (after fonts
// and images are ready). The debugger for "why is this element in the wrong
// place?": seek to a frame, then inspect transforms, computed styles, metrics.
//
//   node tools/eval_in_page.mjs "window.__seek(491); document.querySelectorAll('.scene').length"
//   node tools/eval_in_page.mjs "(async () => { const m = await import('/composition/lib/core.js');
//        return JSON.stringify(m.inkMetrics([['N','600 100px \"Inter Display\"']])); })()"
import { withPage } from './_browser.mjs';

const expr = process.argv[2];
if (!expr) { console.error('usage: node tools/eval_in_page.mjs "<js expression>"'); process.exit(1); }
const out = await withPage(async (page) => { await page.evaluate(() => window.__ready); return page.evaluate(expr); });
console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
