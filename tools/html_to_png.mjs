#!/usr/bin/env node
// Render a scratch HTML file to PNG through the repo server - for prototyping a
// shape (SVG path, icon, button) on top of a reference crop before it goes into
// a scene. Put the crop in .cache/ and reference it as /.cache/crop.png.
//
//   node tools/html_to_png.mjs proto.html out.png 1360 680
//
// Pattern used for the cursor and the OpenAI knot: left half = reference crop,
// right half = SVG candidate; or SVG at 55% opacity directly over the crop.
import fs from 'node:fs';
import { withPage } from './_browser.mjs';

const [file, out, w = 1280, h = 720] = process.argv.slice(2);
if (!file || !out) { console.error('usage: node tools/html_to_png.mjs in.html out.png [w h]'); process.exit(1); }
const html = fs.readFileSync(file, 'utf8');
await withPage(async (page) => { await page.waitForTimeout(300); await page.screenshot({ path: out }); },
  { url: '/__proto.html', extra: { '/__proto.html': html }, viewport: { width: +w, height: +h } });
console.log('wrote', out);
