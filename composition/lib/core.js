// Core timeline helpers. Everything is a pure function of the frame number,
// so any frame can be rendered in any order (deterministic render).

export const W = 1280;
export const H = 720;
export const FPS = 30;
export const TOTAL_FRAMES = 870;

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));

// ---------------------------------------------------------------- easing ---

// CSS-style cubic-bezier, solved with Newton + bisection.
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

export const E = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
  // the long "settle" curve used by most reveals in the reference
  smooth: bezier(0.16, 1, 0.3, 1),
  // ease-in-out with a strong middle, used for whips
  whip: bezier(0.7, 0, 0.2, 1),
};
E.outBackSoft = (t) => E.outBack(t, 1.1);
E.outBackHard = (t) => E.outBack(t, 2.4);

// Exponential approach: fraction of the distance left after n frames is r^n.
export const decay = (n, perFrame = 0.9) => 1 - Math.pow(perFrame, Math.max(0, n));

// Damped spring step response, frames since start -> 0..1 (with overshoot).
export function spring(n, { stiffness = 170, damping = 18, mass = 1 } = {}) {
  if (n <= 0) return 0;
  const t = n / FPS;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

// tween(f, f0, f1, v0, v1, ease): clamped interpolation between two frames.
export function tween(f, f0, f1, v0, v1, ease = E.linear) {
  const t = clamp(invLerp(f0, f1, f));
  return lerp(v0, v1, ease(t));
}

// Keyframes: [[frame, value, easeIntoThisKey?], ...]. Values can be numbers
// or arrays of numbers. Holds first/last value outside the range.
export function kf(f, keys) {
  if (f <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (f >= last[0]) return last[1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, ease = E.inOutCubic] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (f <= f1) {
      const t = ease(clamp(invLerp(f0, f1, f)));
      if (Array.isArray(v0)) return v0.map((a, j) => lerp(a, v1[j], t));
      return lerp(v0, v1, t);
    }
  }
  return last[1];
}

// Smooth sample of a keyframed track a little before and after f, used to
// derive velocity for motion blur.
export function velocity(fn, f, h = 0.5) {
  const a = fn(f - h), b = fn(f + h);
  if (Array.isArray(a)) return a.map((v, i) => (b[i] - v) / (2 * h));
  return (b - a) / (2 * h);
}

// ------------------------------------------------------------------- DOM ---

export function el(tag, opts = {}, parent) {
  const isSvg = ['svg', 'path', 'g', 'circle', 'rect', 'defs', 'filter', 'feGaussianBlur', 'linearGradient',
    'radialGradient', 'stop', 'ellipse', 'polygon', 'line', 'clipPath', 'mask', 'feOffset', 'feMerge',
    'feMergeNode', 'feColorMatrix', 'feComponentTransfer', 'feFuncA', 'text', 'use', 'polyline'].includes(tag);
  const n = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  if (opts.cls) n.setAttribute('class', opts.cls);
  if (opts.id) n.id = opts.id;
  if (opts.html != null) n.innerHTML = opts.html;
  if (opts.text != null) n.textContent = opts.text;
  if (opts.attrs) for (const k in opts.attrs) n.setAttribute(k, opts.attrs[k]);
  if (opts.style) Object.assign(n.style, opts.style);
  if (parent) parent.appendChild(n);
  return n;
}

// Build a transform string. Order: translate -> rotate -> scale.
export function T({ x = 0, y = 0, z, s, sx, sy, r, rx, ry, skx, persp } = {}) {
  let t = '';
  if (persp) t += `perspective(${persp}px) `;
  t += `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, ${(z || 0).toFixed(3)}px)`;
  if (rx) t += ` rotateX(${rx}deg)`;
  if (ry) t += ` rotateY(${ry}deg)`;
  if (r) t += ` rotate(${r}deg)`;
  if (skx) t += ` skewX(${skx}deg)`;
  const scx = sx ?? s ?? 1, scy = sy ?? s ?? 1;
  if (scx !== 1 || scy !== 1) t += ` scale(${scx}, ${scy})`;
  return t;
}

export function set(node, props) {
  const st = node.style;
  for (const k in props) {
    const v = props[k];
    if (k === 'tf') st.transform = typeof v === 'string' ? v : T(v);
    else if (k === 'o') st.opacity = String(clamp(v));
    else if (k === 'blur') st.filter = v > 0.05 ? `blur(${v.toFixed(2)}px)` : 'none';
    else if (k === 'show') st.display = v ? '' : 'none';
    else st[k] = v;
  }
}

// ----------------------------------------------------------- motion blur ---
// Directional blur via an SVG gaussian blur with anisotropic deviation,
// applied inside a rotated wrapper so it can point in any direction.
// mb = makeMotionBlur(parent) -> { outer, inner, update(dx, dy, amount) }

const svgDefs = (() => {
  let defs = null;
  return () => {
    if (defs) return defs;
    const svg = el('svg', { attrs: { width: 0, height: 0, style: 'position:absolute;width:0;height:0' } }, document.body);
    defs = el('defs', {}, svg);
    return defs;
  };
})();

let mbCounter = 0;
export function makeMotionBlur(parent, opts = {}) {
  const id = `mb${mbCounter++}`;
  const filter = el('filter', {
    id,
    attrs: { filterUnits: 'userSpaceOnUse', x: -4000, y: -4000, width: 8000, height: 8000, 'color-interpolation-filters': 'sRGB' },
  }, svgDefs());
  const blur = el('feGaussianBlur', { attrs: { stdDeviation: '0 0' } }, filter);
  const outer = el('div', { cls: 'mb-outer', style: { position: 'absolute', left: '0', top: '0' } }, parent);
  const inner = el('div', { cls: 'mb-inner', style: { position: 'absolute', left: '0', top: '0' } }, outer);
  const extra = opts.extraBlur || 0;
  return {
    outer, inner,
    // vx, vy: pixel motion during the shutter interval
    update(vx, vy, extraBlur = extra) {
      const len = Math.hypot(vx, vy);
      if (len < 0.8 && extraBlur < 0.05) {
        outer.style.filter = 'none';
        outer.style.transform = '';
        inner.style.transform = '';
        return;
      }
      const ang = Math.atan2(vy, vx) * 180 / Math.PI;
      blur.setAttribute('stdDeviation', `${(len / 2.6 + extraBlur).toFixed(2)} ${extraBlur.toFixed(2)}`); // len = shutter smear in px
      outer.style.transform = `rotate(${ang}deg)`;
      inner.style.transform = `rotate(${-ang}deg)`;
      outer.style.filter = `url(#${id})`;
    },
  };
}

// Plain axis-aligned anisotropic blur filter, reusable for big layers.
export function makeAxisBlur() {
  const id = `ab${mbCounter++}`;
  const filter = el('filter', {
    id,
    attrs: { filterUnits: 'userSpaceOnUse', x: -4000, y: -4000, width: 8000, height: 8000, 'color-interpolation-filters': 'sRGB' },
  }, svgDefs());
  const blur = el('feGaussianBlur', { attrs: { stdDeviation: '0 0' } }, filter);
  return {
    css(sx, sy) {
      if (sx < 0.05 && sy < 0.05) return 'none';
      blur.setAttribute('stdDeviation', `${sx.toFixed(2)} ${sy.toFixed(2)}`);
      return `url(#${id})`;
    },
  };
}

// --------------------------------------------------------------- scenes ---

export function makeScene(stage, { start, end, z = 0, bg }) {
  const root = el('div', { cls: 'scene', style: { zIndex: String(z), background: bg || 'transparent' } }, stage);
  return { root, start, end, active: (f) => f >= start && f <= end };
}

// Seeded PRNG so particle fields are identical on every render.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Measure text with the same font the DOM uses (fonts must be loaded).
const measureCtx = document.createElement('canvas').getContext('2d');
export function textWidth(text, font) {
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
}

// Distance from the top of a line box (line-height: 1) to the baseline for a
// given CSS font, measured in the live DOM so text can be placed by baseline.
const baseCache = new Map();
export function baselineOffset(font) {
  if (baseCache.has(font)) return baseCache.get(font);
  const box = document.createElement('div');
  Object.assign(box.style, { position: 'absolute', left: '-9999px', top: '0', font, lineHeight: '1', whiteSpace: 'nowrap' });
  box.textContent = 'Hxg';
  const probe = document.createElement('span');
  Object.assign(probe.style, { display: 'inline-block', width: '1px', height: '0px', verticalAlign: 'baseline' });
  box.appendChild(probe);
  document.body.appendChild(box);
  const v = probe.offsetTop;
  box.remove();
  baseCache.set(font, v);
  return v;
}

// Ink metrics of a run list [[text, cssFont], ...] laid out on one line.
export function inkMetrics(runs) {
  let x = 0, inkL = Infinity, inkR = -Infinity, asc = 0, desc = 0;
  for (const [t, font] of runs) {
    measureCtx.font = font;
    const m = measureCtx.measureText(t);
    inkL = Math.min(inkL, x - m.actualBoundingBoxLeft);
    inkR = Math.max(inkR, x + m.actualBoundingBoxRight);
    asc = Math.max(asc, m.actualBoundingBoxAscent);
    desc = Math.max(desc, m.actualBoundingBoxDescent);
    x += m.width;
  }
  return { advance: x, inkL, inkR, asc, desc };
}

// Lay out styled runs so the ink spans [left, right] (via a small horizontal
// scale) and the baseline sits at `baseline`. Coordinates are in the parent's space.
// runs: [[text, cssFont, color?], ...]
// uniform: true = scale both axes (font size unknown), false = horizontal only (font metrics differ),
// 'auto' = horizontal for small corrections, uniform when the size is clearly off.
export function placeText(node, runs, { left, right, baseline, fit = true, maxStretch = 0.2, uniform = 'auto' }) {
  node.innerHTML = '';
  Object.assign(node.style, { position: 'absolute', whiteSpace: 'pre', lineHeight: '1', left: '0', top: '0' });
  for (const [t, font, color] of runs) {
    const s = document.createElement('span');
    s.style.display = 'inline-block';
    s.textContent = t;
    s.style.font = font;
    s.style.lineHeight = '1';
    if (color) s.style.color = color;
    node.appendChild(s);
  }
  const m = inkMetrics(runs);
  const ink = m.inkR - m.inkL;
  let k = 1;
  if (fit && right != null) k = (right - left) / ink;
  if (uniform === 'auto') uniform = Math.abs(k - 1) > 0.1;
  if (!uniform) k = Math.max(1 - maxStretch, Math.min(1 + maxStretch, k));
  (window.__fitLog = window.__fitLog || []).push([runs.map((r) => r[0]).join(''), +k.toFixed(3)]);
  const b = baselineOffset(runs[0][1]);
  node.style.transformOrigin = '0 0';
  const ky = uniform ? k : 1;
  node.style.transform = `translate(${(left - m.inkL * k).toFixed(2)}px, ${(baseline - b * ky).toFixed(2)}px) scale(${k.toFixed(4)}, ${ky.toFixed(4)})`;
  return { k, ...m };
}
