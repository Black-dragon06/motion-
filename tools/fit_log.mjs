#!/usr/bin/env node
// List every placeText() call whose fit factor k is far from 1.
// k = measured ink width in the reference / natural ink width of our font.
// k far from 1 means the chosen font size is wrong (fix the size), not that
// the text should be squashed. placeText() switches to uniform scaling when
// |k-1| > 0.1, but a correct base size always looks better.
//
//   node tools/fit_log.mjs            # threshold 0.08
//   node tools/fit_log.mjs 0.03
import { withPage } from './_browser.mjs';

const thr = +(process.argv[2] || 0.08);
const log = await withPage(async (page) => { await page.evaluate(() => window.__ready); return page.evaluate(() => window.__fitLog || []); });
let n = 0;
for (const [t, k] of log) if (Math.abs(k - 1) > thr) { console.log(k.toFixed(3).padStart(6), JSON.stringify(t)); n++; }
console.log(`${n} of ${log.length} placeText() fits are off by more than ${thr}`);
