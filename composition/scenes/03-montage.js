// 03 · Subscription-button montage (frames 99–226): 19 hard-cut shots.
import { makeScene, el, kf, E, clamp, rng, placeText, baselineOffset } from '../lib/core.js';
import { makeCursor } from '../lib/cursor.js';
import * as I from '../lib/icons.js';

const L = E.linear;
const HERO = { x: 306, y: 248, w: 671, h: 224, r: 37 };
const BASE = 384; // label baseline
const LABEL = '500 88px "Inter Display"';
const BOLD = '700 88px "Inter Display"';

const plate = (dir, f) => `../assets/plates/${dir}/${String(f).padStart(3, '0')}.jpg`;

function caption(parent, text, color) {
  const c = el('div', { cls: 'caption', text: `[ ${text} ]`, style: { color, font: '400 11.5px/1 "Inter Text"' } }, parent);
  c.dataset.baseline = '671';
  return c;
}

function box(parent, { x, y, w, h, r = 0, bg = 'transparent', style = {} }) {
  return el('div', { style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px',
    borderRadius: r + 'px', background: bg, ...style } }, parent);
}

function icon(parent, svg, x0, x1, cy, h) {
  const w = x1 - x0;
  const n = el('div', { html: svg(w, h ?? w), style: { position: 'absolute', left: x0 + 'px', top: (cy - (h ?? w) / 2) + 'px' } }, parent);
  return n;
}

// Hero button: rounded rect + optional icon + fitted label.
function hero(parent, { bg, color, runs, textL, textR, border, style = {}, rect = HERO }) {
  const b = box(parent, { ...rect, bg, style: { overflow: 'hidden', ...(border ? { boxShadow: `inset 0 0 0 1.5px ${border}` } : {}), ...style } });
  const label = el('div', { style: { color } }, parent);
  label._fit = () => placeText(label, runs, { left: textL, right: textR, baseline: BASE });
  return { b, label };
}

// Rounded-cell grid. rows: [{y, h, offset, speed}] with cells of width cw and gap gx, sliding horizontally.
function hgrid(parent, { cell, gap, rows, cw = 671, gx = 13, r = 30 }) {
  el('div', { cls: 'fill', style: { background: gap } }, parent);
  const layers = rows.map((row) => {
    const g = el('div', { style: { position: 'absolute', left: '0', top: row.y + 'px', width: '1280px', height: row.h + 'px' } }, parent);
    for (let i = -3; i <= 3; i++) {
      box(g, { x: i * (cw + gx), y: 0, w: cw, h: row.h, r, bg: cell });
    }
    return { g, row };
  });
  return (f, f0) => {
    for (const { g, row } of layers) g.style.transform = `translateX(${(row.x0 + (f - f0) * (row.v || 0)).toFixed(2)}px)`;
  };
}
// Column version (slides vertically).
function vgrid(parent, { cell, gap, cols, ch = 233, gy = 18, r = 30 }) {
  el('div', { cls: 'fill', style: { background: gap } }, parent);
  const layers = cols.map((col) => {
    const g = el('div', { style: { position: 'absolute', top: '0', left: col.x + 'px', width: col.w + 'px', height: '720px' } }, parent);
    for (let i = -3; i <= 3; i++) box(g, { x: 0, y: i * (ch + gy), w: col.w, h: ch, r, bg: cell });
    return { g, col };
  });
  return (f, f0) => {
    for (const { g, col } of layers) g.style.transform = `translateY(${(col.y0 + (f - f0) * (col.v || 0)).toFixed(2)}px)`;
  };
}

function starfield(parent, seed, n, { size = [0.8, 2.6], alpha = [0.35, 1], glow = 4 } = {}) {
  const R = rng(seed);
  const stars = [];
  for (let i = 0; i < n; i++) {
    const s = size[0] + R() * (size[1] - size[0]);
    const d = el('div', { style: { position: 'absolute', left: R() * 1280 + 'px', top: 34 + R() * 652 + 'px', width: s + 'px', height: s + 'px',
      borderRadius: '50%', background: '#fff', boxShadow: `0 0 ${glow}px rgba(255,255,255,.8)` } }, parent);
    stars.push({ d, a: alpha[0] + R() * (alpha[1] - alpha[0]), ph: R() * 6.28 });
  }
  return (f) => { for (const s of stars) s.d.style.opacity = String(s.a * (0.75 + 0.25 * Math.sin(f * 0.9 + s.ph))); };
}

// ------------------------------------------------------------------ shots ---

const SHOTS = [];
const shot = (s, e, build) => SHOTS.push({ s, e, build });

// 1 · Apple Pay -----------------------------------------------------------
shot(99, 113, (root) => {
  el('div', { cls: 'fill', style: { background: '#DEDEDE' } }, root);
  const g = el('div', { cls: 'fill', style: { transformOrigin: '641px 360px' } }, root);
  box(g, { x: 202, y: -120, w: 876, h: 661, r: 46, bg: '#B8B8B8' });
  const dark = '#3B3B3B';
  const t1 = el('div', { style: { color: dark } }, g), t2 = el('div', { style: { color: dark } }, g);
  const t3 = el('div', { style: { color: dark } }, g), t4 = el('div', { style: { color: dark } }, g);
  box(g, { x: 297, y: 66, w: 687, h: 2, bg: '#707070' });
  const btn = box(g, { x: 294, y: 240, w: 696, h: 240, r: 40, bg: '#000' });
  icon(g, I.apple, 507, 573, 352, 79);
  const pay = el('div', { style: { color: '#fff' } }, g);
  caption(root, 'Apple Pay Button', '#8a8a8a');
  const cur = makeCursor(root, { size: 222 });
  const fit = () => {
    placeText(t1, [['Service fee', '500 50px "Inter Display"']], { left: 297, right: 548, baseline: 37 });
    placeText(t2, [['20.15$', '500 50px "Inter Display"']], { left: 824, right: 983, baseline: 37 });
    placeText(t3, [['Total', '500 52px "Inter Display"']], { left: 300, right: 427, baseline: 188 });
    placeText(t4, [['200$', '700 52px "Inter Display"']], { left: 819, right: 979, baseline: 188 });
    placeText(pay, [['Pay', '500 104px "Inter Display"']], { left: 594, right: 782, baseline: 393 });
  };
  const S = [[99, 0.8625], [100, 0.9625, L], [101, 0.9875, L], [102, 0.996, L], [103, 1, L], [104, 1, L], [105, 0.9875, L],
    [106, 0.979, L], [107, 0.9625, L], [108, 0.954, L], [109, 0.95, L], [110, 0.946, L], [111, 0.95, L], [112, 0.954, L], [113, 0.954, L]];
  const C = [[99, [877, 476]], [100, [893, 490]], [101, [896, 491]], [102, [897, 490]], [103, [900, 488]], [104, [904, 486]],
    [105, [909, 483]], [106, [914, 478]], [107, [922, 473]], [108, [931, 466]], [109, [943, 455]], [110, [956, 444]],
    [111, [975, 427]], [112, [997, 406]], [113, [1024, 378]]].map(([f, v]) => [f, v, L]);
  return {
    fit,
    update(f) {
      g.style.transform = `scale(${kf(f, S)})`;
      const [x, y] = kf(f, C), [px, py] = kf(f - 1, C);
      cur.center(x, y, { vx: (x - px) * 0.35, vy: (y - py) * 0.35 });
    },
  };
});

// 2 · Buy GPT 5 -----------------------------------------------------------
shot(114, 123, (root) => {
  el('div', { cls: 'fill', style: { background: '#313131' } }, root);
  box(root, { x: 150, y: -40, w: 980, h: 800, r: 0, bg: 'linear-gradient(90deg, #302F3C 0%, #302E44 50%, #302C4D 100%)',
    style: { boxShadow: 'inset 2px 0 0 #63616F, inset -2px 0 0 #635C90' } });
  const muted = '#5E5891';
  const l1 = el('div', { style: { color: muted } }, root), l2 = el('div', { style: { color: muted } }, root);
  const pill = box(root, { x: 246, y: 242, w: 791, h: 235, r: 118,
    bg: 'linear-gradient(180deg, #5E5893 0%, #57508A 55%, #4D4680 100%)',
    style: { overflow: 'hidden', boxShadow: 'inset 0 0 0 1.5px rgba(190,185,235,0.55)' } });
  const sheen = el('div', { style: { position: 'absolute', left: '0', top: '-60px', width: '220px', height: '400px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(210,205,255,0.32) 50%, rgba(255,255,255,0) 100%)', filter: 'blur(14px)' } }, pill);
  const lbl = el('div', { style: { color: '#E0E0E3' } }, root);
  icon(root, (w, h) => I.sparkle(w, h, '#fff', 7), 296, 344, 573, 48);
  const core = el('div', { style: { color: '#fff' } }, root);
  el('div', { html: I.sparkle(46, 46, '#fff', 7), style: { position: 'absolute', left: '298px', top: '660px', transform: 'rotate(20deg)' } }, root);
  const more = el('div', { style: { color: '#fff' } }, root);
  caption(root, 'ChatGPT Subscription Button', 'rgba(220,220,230,0.78)');
  const cur = makeCursor(root, { size: 222 });
  const C = [[113, [1024, 378]], [114, [1059, 337]], [115, [1096, 279]], [116, [1140, 200]], [117, [1179, 135]], [118, [1230, 60]]].map(([f, v]) => [f, v, L]);
  return {
    fit() {
      placeText(l1, [['-Upscale Photo up to 4k', '400 48px "Inter Display"']], { left: 275, right: 918, baseline: 72 });
      placeText(l2, [['-Unlimited  access', '400 48px "Inter Display"']], { left: 275, right: 770, baseline: 165 });
      placeText(lbl, [['Buy GPT 5', '500 104px "Inter Display"']], { left: 395, right: 880, baseline: 397 });
      placeText(core, [['Core model', '400 40px "Inter Text"']], { left: 396, right: 627, baseline: 588 });
      placeText(more, [['More messages and uploads', '400 40px "Inter Text"']], { left: 396, right: 968, baseline: 700 });
    },
    update(f) {
      sheen.style.transform = `translateX(${(-260 + (f - 114) * 95).toFixed(1)}px) rotate(18deg)`;
      if (f <= 118) {
        const [x, y] = kf(f, C), [px, py] = kf(f - 1, C);
        cur.center(x, y, { vx: (x - px) * 0.9, vy: (y - py) * 0.9 });
      } else cur.update({ show: false });
    },
  };
});

// 3 · Try Grok -------------------------------------------------------------
shot(124, 133, (root) => {
  el('div', { cls: 'fill', style: { background: 'radial-gradient(ellipse 70% 70% at 50% 45%, #232323 0%, #121212 60%, #070707 100%)' } }, root);
  const R = rng(7);
  const parts = [];
  for (let i = 0; i < 70; i++) {
    const a = R() * Math.PI * 2, d = 60 + R() * 700, streak = R() < 0.45;
    const s = 2 + R() * 6;
    const n = el('div', { style: { position: 'absolute', left: '0', top: '0', width: (streak ? s * 3.2 : s) + 'px', height: s * (streak ? 0.55 : 1) + 'px',
      borderRadius: '6px', background: '#fff', filter: `blur(${(0.4 + R() * 1.8).toFixed(1)}px)`, opacity: String(0.35 + R() * 0.6) } }, root);
    parts.push({ n, a, d, v: 0.012 + R() * 0.02, streak });
  }
  const b = box(root, { ...HERO, bg: 'linear-gradient(180deg, #CACACA 0%, #BDBDBD 55%, #B3B3B3 100%)', style: { overflow: 'hidden',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)' } });
  const R2 = rng(11);
  for (let i = 0; i < 9; i++) {
    const s = 10 + R2() * 18;
    el('div', { style: { position: 'absolute', left: R2() * 640 + 'px', top: R2() * 210 + 'px', width: s + 'px', height: s + 'px', borderRadius: '50%',
      background: 'rgba(255,255,255,0.75)', filter: 'blur(5px)' } }, b);
  }
  icon(root, (w, h) => I.grok(w, h, '#1C1C1C'), 400, 485, 358, 85);
  const lbl = el('div', { style: { color: '#1C1C1C' } }, root);
  caption(root, 'Grok Subscription Button', 'rgba(200,200,200,0.78)');
  return {
    fit() { placeText(lbl, [['Try Grok', LABEL]], { left: 498, right: 899, baseline: BASE }); },
    update(f) {
      const t = f - 124;
      for (const p of parts) {
        const d = p.d * (1 + p.v * t * 3);
        const x = 641 + Math.cos(p.a) * d * 1.3, y = 360 + Math.sin(p.a) * d * 0.75;
        p.n.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(p.a * 180 / Math.PI).toFixed(1)}deg)`;
      }
    },
  };
});

// Claude pricing-page layout, shared by the dark (134) and mauve (222) shots.
function claudePage(root, pal, capText) {
  el('div', { cls: 'fill', style: { background: pal.outer } }, root);
  box(root, { x: 0, y: 0, w: 133, h: 720, bg: pal.outerL });
  box(root, { x: 133, y: 0, w: 2, h: 720, bg: pal.sep });
  box(root, { x: 135, y: 0, w: 84, h: 720, bg: pal.col });
  box(root, { x: 1061, y: 0, w: 101, h: 720, bg: pal.col });
  box(root, { x: 1162, y: 0, w: 118, h: 720, bg: pal.outerR });
  box(root, { x: 219, y: 0, w: 842, h: 720, bg: pal.card, style: { boxShadow: `inset 1.5px 0 0 ${pal.sep}, inset -1.5px 0 0 ${pal.sep}` } });
  box(root, { x: 219, y: 518, w: 842, h: 3, bg: pal.line });
  const pro = el('div', { style: { color: pal.title } }, root);
  const sub = el('div', { style: { color: pal.sub } }, root);
  const ev = el('div', { style: { color: pal.sub } }, root);
  const cc = el('div', { style: { color: pal.sub } }, root);
  icon(root, (w, h) => I.check(w, h, pal.check), 279, 315, 655, 36);
  return {
    fit() {
      placeText(pro, [['Pro', '700 54px "Inter Display"']], { left: 278, right: 357, baseline: 111 });
      placeText(sub, [['Research, code, and organize', '400 40px "Inter Display"']], { left: 278, right: 773, baseline: 170 });
      placeText(ev, [['Everything in Free and:', '500 40px "Inter Display"']], { left: 277, right: 675, baseline: 598 });
      placeText(cc, [['Claude Code directly in your', '400 40px "Inter Display"']], { left: 340, right: 834, baseline: 664 });
    },
  };
}

// 4 · Buy Claude (dark page) ---------------------------------------------
shot(134, 140, (root) => {
  const page = claudePage(root, { outer: '#3D3D3D', outerL: '#414141', outerR: '#474747', sep: '#5a5a5a', col: '#171717', card: '#3E3D3E',
    line: '#4e4e4e', title: '#F2F2F2', sub: '#CFCFCF', check: '#9a9a9a' });
  box(root, { x: 255, y: 244, w: 773, h: 231, r: 42, bg: '#D9D9D9' });
  icon(root, (w, h) => I.claude(w, h, '#C9602F'), 368, 455, 358, 87);
  const lbl = el('div', { style: { color: '#C9602F' } }, root);
  caption(root, 'Claude Subscription Button', 'rgba(205,90,45,0.78)');
  return { fit() { page.fit(); placeText(lbl, [['Buy Claude', LABEL]], { left: 469, right: 921, baseline: BASE }); }, update() {} };
});

// plate + hero helpers for the photographic shots
function plateShot(root, dir, a, b) {
  const imgs = [];
  for (let f = a; f <= b; f++) imgs.push(el('img', { cls: 'plate', attrs: { src: plate(dir, f) }, style: { display: 'none' } }, root));
  let last = null;
  return (f) => {
    const im = imgs[clamp(f - a, 0, imgs.length - 1)];
    if (im !== last) { if (last) last.style.display = 'none'; im.style.display = ''; last = im; }
  };
}

// 5 · Upgrade This (Mojave) -------------------------------------------------
shot(141, 147, (root) => {
  const p = plateShot(root, 'mojave', 141, 147);
  const h = hero(root, { bg: '#1B284A', color: '#FFFAEC', border: 'rgba(140,150,200,0.45)',
    runs: [['Upgrade ', LABEL], ['This', BOLD]], textL: 370, textR: 909 });
  caption(root, 'Upgrade This Button', 'rgba(230,230,240,0.78)');
  return { fit() { h.label._fit(); }, update: p };
});

// 6 · Upgrade That (grey) --------------------------------------------------
shot(148, 153, (root) => {
  const p = plateShot(root, 'greyphoto', 148, 153);
  const h = hero(root, { bg: '#EBECDC', color: '#151515', runs: [['Upgrade ', LABEL], ['That', BOLD]], textL: 370, textR: 922 });
  caption(root, 'Upgrade That Button', 'rgba(240,240,240,0.78)');
  return { fit() { h.label._fit(); }, update: p };
});

// 7 · Get Gemini -------------------------------------------------------------
shot(154, 159, (root) => {
  el('div', { cls: 'fill', style: { background: 'linear-gradient(180deg, #1E3A69 0%, #1F3363 40%, #21204F 80%, #220E4D 100%)' } }, root);
  const st = starfield(root, 21, 46, { size: [1, 3.2], glow: 5 });
  const h = hero(root, { bg: '#ECEFFE', color: '#162250', runs: [['Get Gemini', LABEL]], textL: 470, textR: 885 });
  icon(root, I.gemini, 383, 462, 354, 79);
  caption(root, 'Gemini Subscription Button', 'rgba(220,220,255,0.78)');
  return { fit() { h.label._fit(); }, update: st };
});

// 8 · Try Perplexity -------------------------------------------------------
shot(160, 165, (root) => {
  el('div', { cls: 'fill', style: { background: '#868A89' } }, root);
  const band = box(root, { x: 0, y: 219, w: 1280, h: 281, bg: '#F3F7F5' });
  const h = hero(root, { bg: '#1C1C1C', color: '#36B2B7', runs: [['Try Perplexity', LABEL]], textL: 428, textR: 935 });
  icon(root, (w, h2) => I.perplexity(w, h2, '#36B2B7'), 358, 423, 357, 78);
  caption(root, 'Perplexity Subscription Button', 'rgba(60,60,60,0.78)');
  const B = [[160, [219, 500]], [162, [214, 504], L], [165, [209, 509], L]];
  return {
    fit() { h.label._fit(); },
    update(f) { const [t, b] = kf(f, B); band.style.top = t + 'px'; band.style.height = (b - t + 1) + 'px'; },
  };
});

// 9 · Buy Copilot ------------------------------------------------------------
shot(166, 171, (root) => {
  el('div', { cls: 'fill', style: { background:
    'radial-gradient(ellipse 60% 60% at 100% 100%, #F6BBB3 0%, rgba(246,187,179,0) 100%),' +
    'radial-gradient(ellipse 60% 70% at 0% 100%, #D6B0E3 0%, rgba(214,176,227,0) 100%),' +
    'linear-gradient(180deg, #E4D6EE 0%, #ECD3E2 60%, #EDC7D2 100%)' } }, root);
  const ns = 'http://www.w3.org/2000/svg';
  const mk = (z) => {
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('width', '1280'); s.setAttribute('height', '720');
    Object.assign(s.style, { position: 'absolute', left: '0', top: '0', zIndex: String(z), overflow: 'visible' });
    root.appendChild(s);
    return s;
  };
  const back = mk(1), front = mk(3);
  const FRONT = 'M-20 520 C10 400 60 260 140 170 C190 115 230 100 260 104 C300 108 340 135 370 190 C410 265 430 390 470 490 C495 545 525 572 560 572 C595 572 620 548 650 515';
  const BACK = 'M650 515 C690 470 712 360 738 280 C770 190 860 110 965 80';
  const stroke = (svg, d, op) => {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', op ? 'url(#ribbonFade)' : '#A97AB6');
    p.setAttribute('stroke-width', '47'); p.setAttribute('stroke-linecap', 'butt');
    p.style.filter = 'drop-shadow(6px 8px 10px rgba(80,40,90,0.25))';
    if (op) p.setAttribute('opacity', op);
    svg.appendChild(p);
    return p;
  };
  back.innerHTML = '<defs><linearGradient id="ribbonFade" gradientUnits="userSpaceOnUse" x1="650" y1="515" x2="965" y2="80">' +
    '<stop offset="0" stop-color="#A97AB6"/><stop offset=".45" stop-color="#B784B8"/><stop offset=".8" stop-color="#EBAFB4" stop-opacity=".8"/>' +
    '<stop offset="1" stop-color="#F3C2BE" stop-opacity="0"/></linearGradient></defs>';
  const pb = stroke(back, BACK, '1');
  const pf = stroke(front, FRONT);
  const btnLayer = el('div', { cls: 'fill', style: { zIndex: '2' } }, root);
  const h = hero(btnLayer, { bg: '#0D7FCF', color: '#fff', runs: [['Buy Copilot', LABEL]], textL: 473, textR: 907 });
  icon(btnLayer, I.copilot, 390, 468, 358, 78);
  caption(root, 'Copilot Subscription Button', 'rgba(90,70,100,0.78)');
  let lf = 0, lb = 0;
  return {
    fit() { h.label._fit(); lf = pf.getTotalLength(); lb = pb.getTotalLength(); },
    update(f) {
      const tf = kf(f, [[166, 0.8], [167, 0.9, L], [168, 1, L]]);
      const tb = kf(f, [[168, 0], [169, 0.45, L], [170, 0.8, L], [171, 1, L]]);
      pf.setAttribute('stroke-dasharray', `${lf} ${lf}`); pf.setAttribute('stroke-dashoffset', String(lf * (1 - tf)));
      pb.setAttribute('stroke-dasharray', `${lb} ${lb}`); pb.setAttribute('stroke-dashoffset', String(lb * (1 - tb)));
    },
  };
});

// 10 · Try Runway ------------------------------------------------------------
shot(172, 177, (root) => {
  const g = hgrid(root, { cell: '#3F4F2A', gap: '#292928', rows: [
    { y: -8, h: 233, x0: 281 - 684, v: -7.67 }, { y: 243, h: 233, x0: 306 - 684, v: 0 }, { y: 493, h: 233, x0: 320 - 684, v: 4 }] });
  box(root, { x: 296, y: 240, w: 691, h: 240, bg: '#292928' });
  const h = hero(root, { bg: '#9EE026', color: '#fff', runs: [['Try Runway', LABEL]], textL: 464, textR: 900 });
  icon(root, (w, h2) => I.runway(w, h2, '#fff'), 392, 457, 359, 65);
  caption(root, 'Runway Subscription Button', 'rgba(220,230,200,0.78)');
  return { fit() { h.label._fit(); }, update: (f) => g(f, 172) };
});

// 11 · Buy Kling 3.0 -----------------------------------------------------------
shot(178, 183, (root) => {
  const p = plateShot(root, 'kling', 178, 183);
  const b = box(root, { ...HERO, bg: 'rgba(25,32,40,0.35)', style: { overflow: 'hidden', boxShadow: 'inset 0 0 0 1.5px #3CD3B2',
    backdropFilter: 'blur(6px)' } });
  const blob = el('div', { style: { position: 'absolute', borderRadius: '50%',
    background: 'linear-gradient(90deg, #34F29B 0%, #2FE6B8 50%, #2CDAD3 100%)' } }, b);
  const white = el('div', { style: { color: '#fff' } }, root);
  const clip = el('div', { cls: 'fill', style: { overflow: 'hidden' } }, root);
  const dark = el('div', { style: { color: '#0F1E1C' } }, clip);
  icon(root, (w, h) => I.kling(w, h, '#fff'), 358, 425, 356, 67);
  caption(root, 'Kling 3.0 Subscription Button', 'rgba(200,200,210,0.78)');
  const RAD = [[178, 188], [179, 218, L], [180, 248, L], [181, 278, L], [182, 307, L], [183, 420, L]];
  return {
    fit() {
      const runs = [['Buy Kling 3.0', LABEL]];
      placeText(white, runs, { left: 430, right: 927, baseline: BASE });
      placeText(dark, runs, { left: 430, right: 927, baseline: BASE });
    },
    update(f) {
      p(f);
      const r = kf(f, RAD);
      Object.assign(blob.style, { left: (334 - r) + 'px', top: (112 - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px' });
      clip.style.clipPath = `circle(${r}px at 640px 360px)`;
    },
  };
});

// 12 · Luma AI -------------------------------------------------------------------
shot(184, 189, (root) => {
  el('div', { cls: 'fill', style: { background: 'linear-gradient(100deg, #7C8DAA 0%, #8E9AB8 50%, #A6B0CD 100%)' } }, root);
  const rings = [0, 1].map(() => box(root, { x: 0, y: 0, w: 10, h: 10, r: 60, style: { border: '6px solid #4A4163', filter: 'blur(0.6px)' } }));
  const h = hero(root, { bg: '#433A57', color: '#fff', runs: [['Luma AI', LABEL]], textL: 538, textR: 836 });
  icon(root, I.luma, 450, 524, 362, 82);
  caption(root, 'Luma Ai Subscription Button', 'rgba(70,70,100,0.78)');
  // ring rects per frame: [top, bottom, left, right]
  const R1 = [[184, [223, 497, 270, 1012]], [189, [187, 533, 237, 1044], L]];
  const R2 = [[184, [187, 533, 233, 1049]], [189, [121, 598, 170, 1112], L]];
  return {
    fit() { h.label._fit(); },
    update(f) {
      [R1, R2].forEach((K, i) => {
        const [t, b, l, r] = kf(f, K);
        Object.assign(rings[i].style, { left: l + 'px', top: t + 'px', width: (r - l) + 'px', height: (b - t) + 'px', borderRadius: (48 + i * 16) + 'px' });
      });
    },
  };
});

// 13 · Get Sora ----------------------------------------------------------------
shot(190, 195, (root) => {
  el('div', { cls: 'fill', style: { background: 'linear-gradient(180deg, #062D66 0%, #0A4396 50%, #1162CB 100%)' } }, root);
  const st = starfield(root, 33, 40, { size: [1, 3.4], glow: 5 });
  const h = hero(root, { bg: '#DEDEDE', color: '#16296A', runs: [['Get Sora', LABEL]], textL: 495, textR: 878 });
  const ic = el('div', { html: I.sora(100, 100), style: { position: 'absolute', left: '372px', top: '305px', width: '100px', height: '100px', transformOrigin: '0 0' } }, root);
  caption(root, 'Sora Subscription Button', 'rgba(220,230,255,0.78)');
  const SZ = [[190, 73], [191, 94, L], [192, 121, L], [193, 137, L], [194, 141, L], [195, 134, L]];
  return {
    fit() { h.label._fit(); },
    update(f) { st(f); ic.style.transform = `translate(52px, 50px) scale(${kf(f, SZ) / 88}) translate(-50px, -50px)`; },
  };
});

// 14 · GPT 5.5 ---------------------------------------------------------------
shot(196, 199, (root) => {
  el('div', { cls: 'fill', style: { background: '#DEDEDE' } }, root);
  const h = hero(root, { bg: '#000', color: '#E9E9E9', runs: [['GPT 5.5', LABEL]], textL: 517, textR: 863 });
  const ic = el('div', { style: { position: 'absolute', left: '376px', top: '309px', width: '100px', height: '100px', transformOrigin: '0 0' } }, root);
  caption(root, 'GPT 5.5 Subscription Button', 'rgba(90,90,90,0.78)');
  const SZ = [[196, 161], [197, 141, L], [198, 116, L], [199, 93, L]];
  return {
    fit() { h.label._fit(); },
    update(f) {
      const glow = f <= 197 ? 3 : 0;
      ic.innerHTML = I.openai(100, 100, '#F2F2F2', glow);
      ic.style.transform = `translate(50px, 50px) scale(${kf(f, SZ) / 74}) translate(-50px, -50px)`;
    },
  };
});

// 15 · Buy Claude (cream) ------------------------------------------------------
shot(200, 204, (root) => {
  el('div', { cls: 'fill', style: { background: '#FCEFE7' } }, root);
  const h = hero(root, { bg: '#D17159', color: '#fff', runs: [['Buy Claude', LABEL]], textL: 469, textR: 921 });
  icon(root, (w, hh) => I.claude(w, hh, '#fff'), 368, 455, 358, 87);
  caption(root, 'Claude Subscription Button', 'rgba(150,110,100,0.78)');
  return { fit() { h.label._fit(); }, update() {} };
});

// 16 · Upgrade This (brown grid) ----------------------------------------------
shot(205, 210, (root) => {
  const g = hgrid(root, { cell: '#685C4E', gap: '#4C4238', rows: [
    { y: -8, h: 233, x0: 281 - 684, v: -8 }, { y: 243, h: 233, x0: 306 - 684, v: 0 }, { y: 493, h: 233, x0: 319 - 684, v: 4 }] });
  box(root, { x: 296, y: 240, w: 691, h: 240, bg: '#4C4238' });
  const h = hero(root, { bg: '#D7C8AB', color: '#4F4337', runs: [['Upgrade ', LABEL], ['This', BOLD]], textL: 371, textR: 909 });
  caption(root, 'Upgrade This Button', 'rgba(220,210,190,0.78)');
  return { fit() { h.label._fit(); }, update: (f) => g(f, 205) };
});

// 17 · Upgrade That (red grid) -----------------------------------------------
shot(211, 215, (root) => {
  const g = vgrid(root, { cell: '#8E252C', gap: '#770004', cols: [
    { x: -378, w: 671, y0: 249, v: 4.5 }, { x: 306, w: 671, y0: 244, v: 0 }, { x: 989, w: 671, y0: 239, v: -4.5 }] });
  box(root, { x: 300, y: 228, w: 683, h: 264, bg: '#770004' });
  const h = hero(root, { bg: '#EBECDC', color: '#151515', runs: [['Upgrade ', LABEL], ['That', BOLD]], textL: 370, textR: 922 });
  caption(root, 'Upgrade That Button', 'rgba(240,200,200,0.78)');
  return { fit() { h.label._fit(); }, update: (f) => g(f, 211) };
});

// 18 · Banana ----------------------------------------------------------------------
shot(216, 221, (root) => {
  const p = plateShot(root, 'banana', 216, 221);
  const b = box(root, { x: 0, y: 0, w: 10, h: 10, r: 38, bg: '#2C408A' });
  const grp = el('div', { cls: 'fill', style: { transformOrigin: '641px 359px' } }, root);
  icon(grp, I.banana, 422, 501, 352, 79);
  const lbl = el('div', { style: { color: '#fff' } }, grp);
  caption(root, 'Nano Banana Subscription Button', 'rgba(90,70,0,0.78)');
  const RECT = [[216, [297, 986, 241, 478]], [217, [288, 995, 237, 481], L], [218, [279, 1004, 235, 484], L], [219, [271, 1013, 232, 487], L],
    [220, [262, 1020, 229, 490], L]];
  return {
    fit() { placeText(lbl, [['Banana', '700 88px "Inter Display"']], { left: 516, right: 853, baseline: 381 }); },
    update(f) {
      p(f);
      const [l, r, t, bt] = kf(f, RECT);
      Object.assign(b.style, { left: l + 'px', top: t + 'px', width: (r - l) + 'px', height: (bt - t) + 'px' });
      grp.style.transform = `scale(${((r - l) / 689) ** 0.5})`;
    },
  };
});

// 19 · Buy Claude (mauve page) ---------------------------------------------------
shot(222, 226, (root) => {
  const page = claudePage(root, { outer: '#8A6962', outerL: '#8A6962', outerR: '#78564D', sep: '#B49A92', col: '#FCEFE7', card: '#967B72',
    line: '#B99C94', title: '#FFF6F2', sub: '#F0E2DC', check: '#E8D6CF' });
  const h = hero(root, { bg: '#D17159', color: '#fff', runs: [['Buy Claude', LABEL]], textL: 469, textR: 921,
    style: { boxShadow: 'inset 0 0 0 1.5px #6E3A2E' } });
  icon(root, (w, hh) => I.claude(w, hh, '#fff'), 368, 455, 358, 87);
  caption(root, 'Claude Subscription Button', 'rgba(110,60,50,0.78)');
  return { fit() { page.fit(); h.label._fit(); }, update() {} };
});

// -------------------------------------------------------------------------------

export default function create(stage) {
  const sc = makeScene(stage, { start: 99, end: 226 });
  const built = SHOTS.map((s) => {
    const root = el('div', { cls: 'fill', style: { display: 'none' } }, sc.root);
    return { ...s, root, api: s.build(root) };
  });
  function prepare() {
    for (const b of built) {
      b.root.style.display = '';
      b.api.fit && b.api.fit();
      for (const c of b.root.querySelectorAll('.caption')) {
        c.style.top = (+c.dataset.baseline - baselineOffset('400 11.5px "Inter Text"')) + 'px';
      }
      b.root.style.display = 'none';
    }
  }
  let cur = null;
  function update(f) {
    const s = built.find((b) => f >= b.s && f <= b.e);
    if (s !== cur) { if (cur) cur.root.style.display = 'none'; if (s) s.root.style.display = ''; cur = s; }
    if (s && s.api.update) s.api.update(f);
  }
  return { ...sc, prepare, update };
}
