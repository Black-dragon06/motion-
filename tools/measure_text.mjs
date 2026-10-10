#!/usr/bin/env node
// Measure text exactly as Chromium will draw it, with the project fonts:
// advance width, ink box (left/right), ascent/descent. Use it to pick a font
// size/weight that matches a measured word box in the reference BEFORE writing
// a scene.
//
//   node tools/measure_text.mjs '[["We’ve","500 44px \"Inter Display\""],["pressed","500 44px \"Inter Display\""]]'
//
// Output per item: text | font | advance | inkLeft | inkRight | inkWidth | ascent | descent
// Rule of thumb: reference ink width / measured ink width = scale to apply to
// the font size (if the cap height also matches) or to scaleX (if only the
// width differs - different typeface).
import { withPage } from './_browser.mjs';

const items = JSON.parse(process.argv[2] || '[]');
if (!items.length) { console.error('usage: node tools/measure_text.mjs \'[["text","css font"]]\''); process.exit(1); }
const rows = await withPage((page) => page.evaluate(async (items) => {
  await window.__ready;
  for (const [, f] of items) await document.fonts.load(f);
  const c = document.createElement('canvas').getContext('2d');
  return items.map(([t, f]) => {
    c.font = f;
    const m = c.measureText(t);
    return [t, f, m.width, -m.actualBoundingBoxLeft, m.actualBoundingBoxRight, m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      m.actualBoundingBoxAscent, m.actualBoundingBoxDescent].map((v) => (typeof v === 'number' ? +v.toFixed(1) : v));
  });
}, items));
console.log('text | font | advance | inkL | inkR | inkW | ascent | descent');
for (const r of rows) console.log(r.join(' | '));
