#!/usr/bin/env node
// Deterministic frame-by-frame renderer:
//   node scripts/render.mjs                         -> out/higgsfield_one_button.mp4 (1920x1080 + audio)
//   node scripts/render.mjs --scale 1 --out out/x.mp4
//   node scripts/render.mjs --from 0 --to 120 --frames out/frames   (dump JPGs for QA)
//   node scripts/render.mjs --page examples/minimal/index.html --audio none --scale 1 --out out/example.mp4
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const scale = Number(args.scale ?? 1.5);
const from = Number(args.from ?? 0);
const toArg = args.to != null ? Number(args.to) : null;
const framesDir = args.frames ? path.resolve(args.frames) : null;
const outFile = path.resolve(args.out ?? path.join(ROOT, 'out', 'higgsfield_one_button.mp4'));
const withAudio = !args['no-audio'] && args.audio !== 'none' && !framesDir && from === 0 && toArg == null;
const list = args.list ? String(args.list).split(',').map(Number) : null;
const pageUrl = args.page ? '/' + String(args.page).replace(/^\//, '') : '/composition/index.html';
const audioArg = args.audio ?? path.join(ROOT, 'assets/audio/soundtrack.m4a');

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try { return require(p); } catch {}
  }
  throw new Error('playwright not found: run `npm install`');
}
const { chromium } = loadPlaywright();

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.m4a': 'audio/mp4', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--font-render-hinting=none', '--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: scale });
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[page error]', e.message));
await page.goto(`http://127.0.0.1:${port}${pageUrl}?render`);
await page.evaluate(() => window.__ready);
const total = await page.evaluate(() => window.__total);
const to = Math.min(toArg ?? total - 1, total - 1);
const frames = list ?? Array.from({ length: to - from + 1 }, (_, i) => from + i);

let ff = null;
if (framesDir) fs.mkdirSync(framesDir, { recursive: true });
else {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const a = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-'];
  if (withAudio) a.push('-i', path.resolve(audioArg), '-map', '0:v', '-map', '1:a', '-c:a', 'copy', '-shortest');
  a.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', outFile);
  ff = spawn('ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] });
}

const t0 = Date.now();
for (let k = 0; k < frames.length; k++) {
  const f = frames[k];
  await page.evaluate((n) => window.__seek(n), f);
  const buf = await page.screenshot({ type: framesDir ? 'jpeg' : 'png', quality: framesDir ? 95 : undefined,
    clip: { x: 0, y: 0, width: 1280, height: 720 }, animations: 'disabled', caret: 'hide' });
  if (framesDir) fs.writeFileSync(path.join(framesDir, `f${String(f + 1).padStart(4, '0')}.jpg`), buf);
  else if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (k % 60 === 0) process.stdout.write(`\rframe ${f} (${k + 1}/${frames.length}) ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
process.stdout.write('\n');
if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); console.log('wrote', outFile); }
await browser.close();
server.close();
