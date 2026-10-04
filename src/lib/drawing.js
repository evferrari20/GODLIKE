// Drawing engine helpers: brush dabs, flood fill, colour utils, and the
// non-printing guides (grids, perspective, turnarounds and pose mannequins).

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export const BRUSHES = {
  pen:      { label: 'Ink Pen',   key: 'b', icon: '✒', spacing: 0.12, pressureSize: true,  hardness: 1 },
  pencil:   { label: 'Pencil',    key: 'p', icon: '✏', spacing: 0.2,  pressureSize: false, hardness: 1, grain: true },
  marker:   { label: 'Marker',    key: 'm', icon: '🖍', spacing: 0.1,  pressureSize: false, hardness: 1, square: true },
  airbrush: { label: 'Airbrush',  key: 'a', icon: '💨', spacing: 0.08, pressureSize: false, hardness: 0, flow: 0.08 },
  watercolor: { label: 'Watercolor', key: 'w', icon: '💧', spacing: 0.1, pressureSize: true, hardness: 0.3, flow: 0.18 },
  eraser:   { label: 'Eraser',    key: 'e', icon: '⌫', spacing: 0.1,  pressureSize: true,  hardness: 0.9 },
};

/** Stamp one dab of the given brush. */
export function dab(ctx, brush, x, y, size, color, pressure, angle = 0) {
  const r = Math.max(0.5, (brush.pressureSize ? size * (0.2 + pressure * 0.9) : size) / 2);
  if (brush.grain) {
    // Pencil: speckled graphite texture.
    ctx.fillStyle = color;
    const n = Math.ceil(r * r * 0.9) + 2;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * r;
      ctx.globalAlpha = 0.25 + Math.random() * 0.5 * (0.4 + pressure);
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.1, 1.1);
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (brush.square) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.5);
    ctx.fillStyle = color;
    ctx.fillRect(-r * 0.35, -r, r * 0.7, r * 2);
    ctx.restore();
    return;
  }
  if (brush.hardness < 1) {
    const [R, G, B] = hexToRgb(color);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const flow = brush.flow ?? 1;
    g.addColorStop(0, `rgba(${R},${G},${B},${flow})`);
    g.addColorStop(Math.max(0.01, brush.hardness), `rgba(${R},${G},${B},${flow * 0.6})`);
    g.addColorStop(1, `rgba(${R},${G},${B},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Interpolate dabs between two points, returning leftover distance. */
export function strokeSegment(ctx, brush, a, b, size, color, carry = 0) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const step = Math.max(0.5, size * brush.spacing);
  let t = step - carry;
  while (t <= dist) {
    const f = t / dist;
    dab(ctx, brush, a.x + dx * f, a.y + dy * f, size, color, a.p + (b.p - a.p) * f);
    t += step;
  }
  return dist - (t - step);
}

/**
 * Scanline flood fill. Reads boundaries from `sample` (composite ImageData),
 * writes `rgba` into `target` ImageData. Grows the fill by 1px so it tucks
 * under anti-aliased line art.
 */
export function floodFill(sample, target, x, y, rgba, tolerance = 40) {
  const { width: w, height: h, data } = sample;
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  const i0 = (y * w + x) * 4;
  const sr = data[i0], sg = data[i0 + 1], sb = data[i0 + 2], sa = data[i0 + 3];
  const match = (i) => Math.abs(data[i] - sr) + Math.abs(data[i + 1] - sg) + Math.abs(data[i + 2] - sb) + Math.abs(data[i + 3] - sa) <= tolerance * 2;
  const mask = new Uint8Array(w * h);
  const stack = [[x, y]];
  while (stack.length) {
    let [cx, cy] = stack.pop();
    while (cx >= 0 && !mask[cy * w + cx] && match((cy * w + cx) * 4)) cx--;
    cx++;
    let up = false, down = false;
    while (cx < w && !mask[cy * w + cx] && match((cy * w + cx) * 4)) {
      mask[cy * w + cx] = 1;
      if (cy > 0) {
        const m = !mask[(cy - 1) * w + cx] && match(((cy - 1) * w + cx) * 4);
        if (m && !up) { stack.push([cx, cy - 1]); up = true; } else if (!m) up = false;
      }
      if (cy < h - 1) {
        const m = !mask[(cy + 1) * w + cx] && match(((cy + 1) * w + cx) * 4);
        if (m && !down) { stack.push([cx, cy + 1]); down = true; } else if (!m) down = false;
      }
      cx++;
    }
  }
  const out = target.data;
  const [r, g, b, a] = rgba;
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const k = yy * w + xx;
      const grow = mask[k] || (xx > 0 && mask[k - 1]) || (xx < w - 1 && mask[k + 1]) || (yy > 0 && mask[k - w]) || (yy < h - 1 && mask[k + w]);
      if (grow) { const j = k * 4; out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = a; }
    }
  }
  return true;
}

// ---------------- Guides ----------------

export const GUIDES = {
  none: 'None',
  grid: 'Grid',
  thirds: 'Rule of thirds',
  persp1: 'Perspective: 1-point',
  persp2: 'Perspective: 2-point',
  turnaround: 'Character turnaround (front/side/back)',
  pose: 'Figure pose mannequin',
  frame: 'Film frame 2.39:1',
  vertical: 'Vertical frame 9:16',
};

export const POSES = {
  standing: { label: 'Standing', j: { lean: 0, lA: [200, 170], rA: [-20, 10], lL: [95, 95], rL: [85, 85] } },
  walking: { label: 'Walking', j: { lean: 4, lA: [140, 120], rA: [40, 70], lL: [115, 80], rL: [65, 110] } },
  running: { label: 'Running', j: { lean: 14, lA: [120, 40], rA: [60, 150], lL: [140, 60], rL: [40, 150] } },
  sitting: { label: 'Sitting', j: { lean: 0, lA: [120, 80], rA: [60, 100], lL: [180, 90], rL: [0, 90], sit: true } },
  pointing: { label: 'Pointing', j: { lean: -3, lA: [200, 170], rA: [-10, -10], lL: [100, 90], rL: [80, 90] } },
  heroic: { label: 'Heroic', j: { lean: 0, lA: [235, 120], rA: [-55, 60], lL: [115, 100], rL: [65, 80] } },
  crouch: { label: 'Crouching', j: { lean: 25, lA: [130, 90], rA: [50, 90], lL: [160, 50], rL: [20, 130] } },
};

function limb(ctx, x, y, a1, a2, l1, l2) {
  const r = Math.PI / 180;
  const x1 = x + Math.cos(a1 * r) * l1, y1 = y + Math.sin(a1 * r) * l1;
  const x2 = x1 + Math.cos(a2 * r) * l2, y2 = y1 + Math.sin(a2 * r) * l2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x1, y1, l1 * 0.09, 0, Math.PI * 2); ctx.stroke();
}

/** A simple eight-heads-tall mannequin in a named pose. */
export function drawMannequin(ctx, cx, top, height, poseKey) {
  const p = POSES[poseKey]?.j || POSES.standing.j;
  const H = height / 8; // one head
  ctx.save();
  ctx.lineWidth = Math.max(2, H * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const lean = (p.lean * Math.PI) / 180;
  const hipY = top + H * (p.sit ? 4.6 : 4);
  const neck = { x: cx + Math.sin(lean) * H * 2.6, y: hipY - Math.cos(lean) * H * 2.6 };
  // head
  ctx.beginPath(); ctx.ellipse(neck.x, neck.y - H * 0.6, H * 0.38, H * 0.5, lean, 0, Math.PI * 2); ctx.stroke();
  // spine & ribcage & pelvis
  ctx.beginPath(); ctx.moveTo(neck.x, neck.y - H * 0.1); ctx.lineTo(cx, hipY); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(neck.x * 0.7 + cx * 0.3, neck.y + H * 0.8, H * 0.55, H * 0.75, lean, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, hipY - H * 0.15, H * 0.5, H * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
  // shoulders
  const sh = { lx: neck.x - H * 0.75, rx: neck.x + H * 0.75, y: neck.y + H * 0.25 };
  ctx.beginPath(); ctx.moveTo(sh.lx, sh.y); ctx.lineTo(sh.rx, sh.y); ctx.stroke();
  limb(ctx, sh.lx, sh.y, p.lA[0] - 90 + 180 - 180 + (p.lA[0] > 180 ? 0 : 0), p.lA[1], H * 1.4, H * 1.3);
  limb(ctx, sh.rx, sh.y, p.rA[0], p.rA[1], H * 1.4, H * 1.3);
  // legs
  limb(ctx, cx - H * 0.3, hipY, p.lL[0], p.lL[1], H * 1.9, H * 1.9);
  limb(ctx, cx + H * 0.3, hipY, p.rL[0], p.rL[1], H * 1.9, H * 1.9);
  ctx.restore();
}

export function drawGuide(ctx, w, h, guide, opts = {}) {
  ctx.clearRect(0, 0, w, h);
  if (guide === 'none') return;
  ctx.save();
  ctx.strokeStyle = opts.color || 'rgba(47,134,192,0.55)';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.2;
  const vp = opts.vp || { x: w / 2, y: h * 0.45 };

  if (guide === 'grid') {
    const s = opts.gridSize || 50;
    ctx.globalAlpha = 0.6;
    for (let x = s; x < w; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = s; y < h; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }
  if (guide === 'thirds') {
    for (const f of [1 / 3, 2 / 3]) {
      ctx.beginPath(); ctx.moveTo(w * f, 0); ctx.lineTo(w * f, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h * f); ctx.lineTo(w, h * f); ctx.stroke();
    }
  }
  if (guide === 'persp1') {
    ctx.beginPath(); ctx.moveTo(0, vp.y); ctx.lineTo(w, vp.y); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(vp.x, vp.y); ctx.lineTo(vp.x + Math.cos(a) * w * 2, vp.y + Math.sin(a) * w * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(vp.x, vp.y, 6, 0, Math.PI * 2); ctx.fill();
  }
  if (guide === 'persp2') {
    const l = { x: -w * 0.15, y: vp.y }, r = { x: w * 1.15, y: vp.y };
    ctx.beginPath(); ctx.moveTo(0, vp.y); ctx.lineTo(w, vp.y); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    for (const p of [l, r]) {
      for (let i = -12; i <= 12; i++) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p === l ? w * 1.2 : -w * 0.2, p.y + i * h * 0.12); ctx.stroke();
      }
    }
    for (let x = w * 0.1; x < w; x += w * 0.1) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  }
  if (guide === 'turnaround') {
    const top = h * 0.08, bottom = h * 0.92, H = (bottom - top) / 8;
    ctx.font = `${Math.round(H * 0.22)}px sans-serif`;
    for (let i = 0; i <= 8; i++) {
      const y = top + i * H;
      ctx.globalAlpha = i === 0 || i === 8 ? 0.9 : 0.4;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.globalAlpha = 0.8;
      ctx.fillText(['top of head', 'chin', 'nipples', 'navel', 'crotch', 'mid-thigh', 'knees', 'mid-calf', 'feet'][i], 6, y - 4);
    }
    ctx.globalAlpha = 0.85;
    ['FRONT', 'SIDE', 'BACK'].forEach((label, i) => {
      const cx = (w / 3) * (i + 0.5);
      ctx.fillText(label, cx - 20, h * 0.05);
      ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bottom); ctx.stroke(); ctx.globalAlpha = 0.85;
      if (i > 0) { ctx.beginPath(); ctx.moveTo((w / 3) * i, 0); ctx.lineTo((w / 3) * i, h); ctx.stroke(); }
      ctx.globalAlpha = 0.45;
      drawMannequin(ctx, cx, top, bottom - top, 'standing');
      ctx.globalAlpha = 0.85;
    });
  }
  if (guide === 'pose') {
    ctx.globalAlpha = 0.6;
    drawMannequin(ctx, w / 2, h * 0.07, h * 0.86, opts.pose || 'standing');
  }
  if (guide === 'frame' || guide === 'vertical') {
    const ratio = guide === 'frame' ? 2.39 : 9 / 16;
    let fw = w * 0.92, fh = fw / ratio;
    if (fh > h * 0.92) { fh = h * 0.92; fw = fh * ratio; }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, w, (h - fh) / 2); ctx.fillRect(0, (h + fh) / 2, w, (h - fh) / 2);
    ctx.fillRect(0, (h - fh) / 2, (w - fw) / 2, fh); ctx.fillRect((w + fw) / 2, (h - fh) / 2, (w - fw) / 2, fh);
    ctx.lineWidth = 2; ctx.strokeRect((w - fw) / 2, (h - fh) / 2, fw, fh);
    ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
    for (const f of [1 / 3, 2 / 3]) {
      ctx.beginPath(); ctx.moveTo((w - fw) / 2 + fw * f, (h - fh) / 2); ctx.lineTo((w - fw) / 2 + fw * f, (h + fh) / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo((w - fw) / 2, (h - fh) / 2 + fh * f); ctx.lineTo((w + fw) / 2, (h - fh) / 2 + fh * f); ctx.stroke();
    }
  }
  ctx.restore();
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load that image.'));
    img.src = src;
  });
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export const PALETTE = [
  '#000000', '#3a3a3a', '#7a7a7a', '#bdbdbd', '#ffffff', '#f3e6d4', '#e4bf8f', '#c99a68',
  '#8a5a32', '#6e2a1c', '#a3241b', '#d9634c', '#f0a08f', '#e0a84a', '#f4d35e', '#b7c96b',
  '#6fb38a', '#2f7a55', '#14453a', '#2f86c0', '#135078', '#0e3a5a', '#1c2541', '#9b6fc0',
  '#5e3a87', '#e48fb1', '#f1c9a5', '#d9a07c', '#a8714f', '#7a4a2e', '#4a2c1a', '#2b1a10',
];
