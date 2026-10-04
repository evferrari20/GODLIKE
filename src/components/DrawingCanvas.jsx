import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { uid, toast } from '../store';
import { BRUSHES, GUIDES, POSES, PALETTE, dab, strokeSegment, floodFill, drawGuide, hexToRgb, rgbToHex, loadImage, fileToDataURL } from '../lib/drawing';

const SHAPES = { line: { icon: '╱', label: 'Line', key: 'l' }, rect: { icon: '▭', label: 'Rectangle', key: 'r' }, ellipse: { icon: '◯', label: 'Ellipse', key: 'o' } };
const OTHER = {
  fill: { icon: '🪣', label: 'Paint bucket', key: 'g' },
  text: { icon: 'T', label: 'Text', key: 't' },
  picker: { icon: '💉', label: 'Eyedropper', key: 'i' },
  select: { icon: '⬚', label: 'Select & move', key: 'v' },
  hand: { icon: '✋', label: 'Pan (or hold Space)', key: 'h' },
};
const FONTS = ['Inter, sans-serif', 'Georgia, serif', '"Courier Prime", monospace', '"Cormorant Garamond", serif', 'Impact, sans-serif', '"Comic Sans MS", cursive'];
const MAX_UNDO = 40;
const HANDLE = 10;

/**
 * Layered raster drawing surface. Each layer is its own <canvas>; a stroke
 * canvas previews the live brush stroke, and guide/overlay canvases sit on top
 * (never exported). Layer pixels are saved back as PNG data URLs.
 */
const DrawingCanvas = forwardRef(function DrawingCanvas({ design, onSave, panelSlot }, ref) {
  const W = design.width, H = design.height;
  const [layers, setLayers] = useState(() => design.layers.map(({ data: _d, ...m }) => m));
  const [active, setActive] = useState(design.layers.at(-1)?.id);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#1d140f');
  const [size, setSize] = useState(8);
  const [opacity, setOpacity] = useState(1);
  const [fillShapes, setFillShapes] = useState(false);
  const [font, setFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState(36);
  const [tolerance, setTolerance] = useState(40);
  const [guide, setGuide] = useState(design.guide || 'none');
  const [pose, setPose] = useState('standing');
  const [guideAlpha, setGuideAlpha] = useState(0.7);
  const [view, setView] = useState({ zoom: 0.6, x: 40, y: 30 });
  const [floating, setFloating] = useState(null);
  const [textBox, setTextBox] = useState(null);
  const [recent, setRecent] = useState([]);
  const [, force] = useState(0);

  const canv = useRef({});
  const strokeRef = useRef();
  const guideRef = useRef();
  const overlayRef = useRef();
  const areaRef = useRef();
  const stageRef = useRef();
  const op = useRef(null);
  const undo = useRef({ past: [], future: [] });
  const dirty = useRef(new Set());
  const saveTimer = useRef();
  const spaceDown = useRef(false);

  // ---------- load layers ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const l of design.layers) {
        const c = canv.current[l.id];
        if (!c) continue;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        if (l.data) {
          try { const img = await loadImage(l.data); if (!cancelled) ctx.drawImage(img, 0, 0); } catch { /* skip */ }
        } else if (l.paper) {
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
        }
      }
    })();
    fitView();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.id]);

  const fitView = () => {
    const a = areaRef.current;
    if (!a) return;
    const z = Math.min((a.clientWidth - 60) / W, (a.clientHeight - 60) / H, 1.5);
    setView({ zoom: z, x: (a.clientWidth - W * z) / 2, y: (a.clientHeight - H * z) / 2 });
  };

  // ---------- guides ----------
  useEffect(() => {
    const g = guideRef.current;
    if (g) drawGuide(g.getContext('2d'), W, H, guide, { pose });
  }, [guide, pose, W, H]);

  // ---------- saving ----------
  const composite = useCallback((maxW = W, mime = 'image/png', quality = 0.9) => {
    const s = Math.min(1, maxW / W);
    const c = document.createElement('canvas');
    c.width = Math.round(W * s); c.height = Math.round(H * s);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    for (const l of layers) {
      if (!l.visible) continue;
      ctx.globalAlpha = l.opacity;
      ctx.drawImage(canv.current[l.id], 0, 0, c.width, c.height);
    }
    return c.toDataURL(mime, quality);
  }, [layers, W, H]);

  const scheduleSave = useCallback((layerIds, metaOverride) => {
    (layerIds || []).forEach((id) => dirty.current.add(id));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const meta = metaOverride || layers;
      const prev = Object.fromEntries(design.layers.map((l) => [l.id, l.data]));
      const out = meta.map((m) => ({ ...m, data: dirty.current.has(m.id) || prev[m.id] === undefined ? canv.current[m.id]?.toDataURL('image/png') : prev[m.id] }));
      dirty.current.clear();
      onSave({ layers: out, thumb: composite(360, 'image/jpeg', 0.8), guide });
    }, 600);
  }, [layers, design.layers, onSave, composite, guide]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);
  // Persist layer structure changes (order, visibility, names).
  const firstMeta = useRef(true);
  useEffect(() => {
    if (firstMeta.current) { firstMeta.current = false; return; }
    scheduleSave([], layers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, guide]);

  // ---------- undo ----------
  const beginOp = (layerId) => {
    const src = canv.current[layerId];
    const backup = document.createElement('canvas');
    backup.width = W; backup.height = H;
    backup.getContext('2d').drawImage(src, 0, 0);
    return backup;
  };
  const endOp = (layerId, backup, box) => {
    const x = Math.max(0, Math.floor(box?.x ?? 0)), y = Math.max(0, Math.floor(box?.y ?? 0));
    const w = Math.min(W - x, Math.ceil(box?.w ?? W)), h = Math.min(H - y, Math.ceil(box?.h ?? H));
    if (w <= 0 || h <= 0) return;
    const before = backup.getContext('2d').getImageData(x, y, w, h);
    const after = canv.current[layerId].getContext('2d').getImageData(x, y, w, h);
    undo.current.past.push({ layerId, x, y, before, after });
    if (undo.current.past.length > MAX_UNDO) undo.current.past.shift();
    undo.current.future = [];
    scheduleSave([layerId]);
    force((n) => n + 1);
  };
  const doUndo = () => {
    const s = undo.current.past.pop();
    if (!s || !canv.current[s.layerId]) return;
    canv.current[s.layerId].getContext('2d').putImageData(s.before, s.x, s.y);
    undo.current.future.push(s);
    scheduleSave([s.layerId]);
    force((n) => n + 1);
  };
  const doRedo = () => {
    const s = undo.current.future.pop();
    if (!s || !canv.current[s.layerId]) return;
    canv.current[s.layerId].getContext('2d').putImageData(s.after, s.x, s.y);
    undo.current.past.push(s);
    scheduleSave([s.layerId]);
    force((n) => n + 1);
  };

  // ---------- helpers ----------
  const toCanvas = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, p: e.pointerType === 'pen' ? e.pressure || 0.5 : 0.6 };
  };
  const activeLayer = layers.find((l) => l.id === active);
  const pickColor = (c) => { setColor(c); setRecent((r) => [c, ...r.filter((x) => x !== c)].slice(0, 8)); };
  const compositeData = () => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    for (const l of layers) if (l.visible) { ctx.globalAlpha = l.opacity; ctx.drawImage(canv.current[l.id], 0, 0); }
    return ctx.getImageData(0, 0, W, H);
  };
  const clearOverlay = () => overlayRef.current.getContext('2d').clearRect(0, 0, W, H);

  // ---------- floating (transform) ----------
  const drawFloating = useCallback((f = floating) => {
    const o = overlayRef.current;
    if (!o) return;
    const ctx = o.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    if (!f) return;
    ctx.save();
    ctx.translate(f.x + f.w / 2, f.y + f.h / 2);
    ctx.rotate(f.rot);
    ctx.drawImage(f.img, -f.w / 2, -f.h / 2, f.w, f.h);
    ctx.strokeStyle = '#2f86c0'; ctx.lineWidth = 2 / view.zoom; ctx.setLineDash([6 / view.zoom, 4 / view.zoom]);
    ctx.strokeRect(-f.w / 2, -f.h / 2, f.w, f.h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#fff';
    const hs = HANDLE / view.zoom;
    for (const [hx, hy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.fillRect(hx * f.w / 2 - hs / 2, hy * f.h / 2 - hs / 2, hs, hs);
      ctx.strokeRect(hx * f.w / 2 - hs / 2, hy * f.h / 2 - hs / 2, hs, hs);
    }
    ctx.beginPath(); ctx.moveTo(0, -f.h / 2); ctx.lineTo(0, -f.h / 2 - 30 / view.zoom); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -f.h / 2 - 30 / view.zoom, hs * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }, [floating, view.zoom, W, H]);
  useEffect(() => { drawFloating(); }, [drawFloating]);

  const hitFloating = (pt) => {
    const f = floating;
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    const cos = Math.cos(-f.rot), sin = Math.sin(-f.rot);
    const lx = (pt.x - cx) * cos - (pt.y - cy) * sin, ly = (pt.x - cx) * sin + (pt.y - cy) * cos;
    const hs = (HANDLE * 1.6) / view.zoom;
    if (Math.hypot(lx, ly + f.h / 2 + 30 / view.zoom) < hs) return 'rotate';
    for (const [hx, hy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) if (Math.abs(lx - hx * f.w / 2) < hs && Math.abs(ly - hy * f.h / 2) < hs) return 'scale';
    if (Math.abs(lx) <= f.w / 2 && Math.abs(ly) <= f.h / 2) return 'move';
    return null;
  };

  const applyFloating = () => {
    const f = floating;
    if (!f) return;
    const backup = f.backup || beginOp(f.layerId);
    const ctx = canv.current[f.layerId].getContext('2d');
    ctx.save();
    ctx.translate(f.x + f.w / 2, f.y + f.h / 2);
    ctx.rotate(f.rot);
    ctx.drawImage(f.img, -f.w / 2, -f.h / 2, f.w, f.h);
    ctx.restore();
    endOp(f.layerId, backup);
    setFloating(null);
    clearOverlay();
  };
  const cancelFloating = () => {
    const f = floating;
    if (!f) return;
    if (f.backup) {
      const ctx = canv.current[f.layerId].getContext('2d');
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(f.backup, 0, 0);
    }
    setFloating(null);
    clearOverlay();
  };

  const addLayer = (name = `Layer ${layers.length}`, afterId = active) => {
    const l = { id: uid(), name, visible: true, opacity: 1 };
    setLayers((ls) => {
      const i = ls.findIndex((x) => x.id === afterId);
      const next = [...ls];
      next.splice(i + 1, 0, l);
      return next;
    });
    setActive(l.id);
    return l.id;
  };

  const placeImage = async (src, name = 'Image') => {
    const img = await loadImage(src);
    if (floating) applyFloating();
    const id = addLayer(name);
    const s = Math.min(1, (W * 0.8) / img.width, (H * 0.8) / img.height);
    const w = img.width * s, h = img.height * s;
    // Wait a frame for the new layer canvas to mount.
    requestAnimationFrame(() => {
      setFloating({ img, x: (W - w) / 2, y: (H - h) / 2, w, h, rot: 0, layerId: id, ratio: w / h });
      setTool('select');
    });
  };

  useImperativeHandle(ref, () => ({
    placeImage,
    composite: (maxW, mime, q) => composite(maxW, mime, q),
    setColor: pickColor,
  }));

  // ---------- pointer handling ----------
  const onPointerDown = (e) => {
    if (e.button === 2) return;
    const pt = toCanvas(e);
    areaRef.current.setPointerCapture(e.pointerId);
    if (textBox) commitText();

    if (tool === 'hand' || spaceDown.current || e.button === 1) {
      op.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
      return;
    }
    if (floating) {
      const hit = hitFloating(pt);
      if (hit) { op.current = { kind: 'xf-' + hit, start: pt, f0: { ...floating } }; return; }
      applyFloating();
      return;
    }
    if (!activeLayer) return;
    if (!activeLayer.visible) return toast('That layer is hidden. Show it to draw on it.');

    if (BRUSHES[tool]) {
      const brush = BRUSHES[tool];
      const backup = beginOp(active);
      const target = tool === 'eraser' ? canv.current[active].getContext('2d') : strokeRef.current.getContext('2d');
      if (tool === 'eraser') { target.save(); target.globalCompositeOperation = 'destination-out'; target.globalAlpha = opacity; }
      else { target.clearRect(0, 0, W, H); strokeRef.current.style.opacity = opacity; }
      dab(target, brush, pt.x, pt.y, size, tool === 'eraser' ? '#000' : color, pt.p);
      op.current = { kind: 'brush', brush, target, backup, last: pt, carry: 0, box: { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y } };
      return;
    }
    if (SHAPES[tool]) { op.current = { kind: 'shape', start: pt, end: pt }; return; }
    if (tool === 'select') { op.current = { kind: 'marquee', start: pt, end: pt }; return; }
    if (tool === 'fill') {
      const backup = beginOp(active);
      const ctx = canv.current[active].getContext('2d');
      const target = ctx.getImageData(0, 0, W, H);
      const [r, g, b] = hexToRgb(color);
      if (floodFill(compositeData(), target, pt.x, pt.y, [r, g, b, Math.round(opacity * 255)], tolerance)) {
        ctx.putImageData(target, 0, 0);
        endOp(active, backup);
      }
      return;
    }
    if (tool === 'picker') {
      const d = compositeData();
      const i = (Math.floor(pt.y) * W + Math.floor(pt.x)) * 4;
      pickColor(rgbToHex(d.data[i], d.data[i + 1], d.data[i + 2]));
      return;
    }
    if (tool === 'text') { setTextBox({ x: pt.x, y: pt.y, value: '' }); }
  };

  const onPointerMove = (e) => {
    const o = op.current;
    if (!o) return;
    if (o.kind === 'pan') { setView((v) => ({ ...v, x: o.vx + e.clientX - o.sx, y: o.vy + e.clientY - o.sy })); return; }
    const pt = toCanvas(e);
    if (o.kind === 'brush') {
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of events) {
        const raw = toCanvas(ev);
        // Light smoothing: move part-way toward the pointer.
        const p = { x: o.last.x + (raw.x - o.last.x) * 0.6, y: o.last.y + (raw.y - o.last.y) * 0.6, p: raw.p };
        o.carry = strokeSegment(o.target, o.brush, o.last, p, size, tool === 'eraser' ? '#000' : color, o.carry);
        o.last = p;
        o.box.x0 = Math.min(o.box.x0, p.x); o.box.y0 = Math.min(o.box.y0, p.y);
        o.box.x1 = Math.max(o.box.x1, p.x); o.box.y1 = Math.max(o.box.y1, p.y);
      }
      return;
    }
    if (o.kind === 'shape' || o.kind === 'marquee') {
      o.end = e.shiftKey && o.kind === 'shape' ? constrain(o.start, pt, tool) : pt;
      const ctx = overlayRef.current.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      if (o.kind === 'shape') drawShape(ctx, tool, o.start, o.end, { color, size, fill: fillShapes, alpha: opacity });
      else { ctx.setLineDash([6, 4]); ctx.strokeStyle = '#2f86c0'; ctx.lineWidth = 1.5 / view.zoom; ctx.strokeRect(o.start.x, o.start.y, o.end.x - o.start.x, o.end.y - o.start.y); ctx.setLineDash([]); }
      return;
    }
    if (o.kind.startsWith('xf-')) {
      const f0 = o.f0;
      let f = { ...f0 };
      if (o.kind === 'xf-move') { f.x = f0.x + pt.x - o.start.x; f.y = f0.y + pt.y - o.start.y; }
      if (o.kind === 'xf-scale') {
        const cx = f0.x + f0.w / 2, cy = f0.y + f0.h / 2;
        const d0 = Math.hypot(o.start.x - cx, o.start.y - cy), d1 = Math.hypot(pt.x - cx, pt.y - cy);
        const s = Math.max(0.05, d1 / d0);
        f.w = f0.w * s; f.h = f0.h * s; f.x = cx - f.w / 2; f.y = cy - f.h / 2;
      }
      if (o.kind === 'xf-rotate') {
        const cx = f0.x + f0.w / 2, cy = f0.y + f0.h / 2;
        let a = Math.atan2(pt.y - cy, pt.x - cx) + Math.PI / 2;
        if (e.shiftKey) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12);
        f.rot = a;
      }
      setFloating(f);
    }
  };

  const onPointerUp = () => {
    const o = op.current;
    op.current = null;
    if (!o) return;
    if (o.kind === 'brush') {
      const pad = size + 4;
      const box = { x: o.box.x0 - pad, y: o.box.y0 - pad, w: o.box.x1 - o.box.x0 + pad * 2, h: o.box.y1 - o.box.y0 + pad * 2 };
      if (tool === 'eraser') o.target.restore();
      else {
        const ctx = canv.current[active].getContext('2d');
        ctx.save(); ctx.globalAlpha = opacity; ctx.drawImage(strokeRef.current, 0, 0); ctx.restore();
        o.target.clearRect(0, 0, W, H);
      }
      endOp(active, o.backup, box);
      if (tool !== 'eraser') pickColor(color);
    }
    if (o.kind === 'shape') {
      clearOverlay();
      if (Math.hypot(o.end.x - o.start.x, o.end.y - o.start.y) < 2) return;
      const backup = beginOp(active);
      drawShape(canv.current[active].getContext('2d'), tool, o.start, o.end, { color, size, fill: fillShapes, alpha: opacity });
      endOp(active, backup);
    }
    if (o.kind === 'marquee') {
      clearOverlay();
      const x = Math.max(0, Math.min(o.start.x, o.end.x)), y = Math.max(0, Math.min(o.start.y, o.end.y));
      const w = Math.min(W - x, Math.abs(o.end.x - o.start.x)), h = Math.min(H - y, Math.abs(o.end.y - o.start.y));
      if (w < 3 || h < 3) return;
      const backup = beginOp(active);
      const img = document.createElement('canvas');
      img.width = w; img.height = h;
      img.getContext('2d').drawImage(canv.current[active], x, y, w, h, 0, 0, w, h);
      canv.current[active].getContext('2d').clearRect(x, y, w, h);
      setFloating({ img, x, y, w, h, rot: 0, layerId: active, backup });
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const r = areaRef.current.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      setView((v) => {
        const z = Math.min(8, Math.max(0.1, v.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
        return { zoom: z, x: mx - ((mx - v.x) / v.zoom) * z, y: my - ((my - v.y) / v.zoom) * z };
      });
    } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
  };
  useEffect(() => {
    const a = areaRef.current;
    a.addEventListener('wheel', onWheel, { passive: false });
    return () => a.removeEventListener('wheel', onWheel);
  });

  const commitText = () => {
    const t = textBox;
    setTextBox(null);
    if (!t?.value.trim() || !active) return;
    const backup = beginOp(active);
    const ctx = canv.current[active].getContext('2d');
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${font}`;
    ctx.textBaseline = 'top';
    t.value.split('\n').forEach((line, i) => ctx.fillText(line, t.x, t.y + i * fontSize * 1.2));
    ctx.restore();
    endOp(active, backup);
  };

  // ---------- keyboard ----------
  useEffect(() => {
    const down = (e) => {
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); return e.shiftKey ? doRedo() : doUndo(); }
      if ((e.metaKey || e.ctrlKey) && k === 'y') { e.preventDefault(); return doRedo(); }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') { spaceDown.current = true; e.preventDefault(); return; }
      if (k === 'enter' && floating) return applyFloating();
      if (k === 'escape' && floating) return cancelFloating();
      if (k === '[') return setSize((s) => Math.max(1, Math.round(s * 0.85)));
      if (k === ']') return setSize((s) => Math.min(300, Math.round(s * 1.18 + 1)));
      if ((k === 'delete' || k === 'backspace') && floating) { if (floating.backup) endOp(floating.layerId, floating.backup); setFloating(null); clearOverlay(); return; }
      const all = { ...BRUSHES, ...SHAPES, ...OTHER };
      const hit = Object.entries(all).find(([, v]) => v.key === k);
      if (hit) setTool(hit[0]);
    };
    const up = (e) => { if (e.code === 'Space') spaceDown.current = false; };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); };
  });

  // ---------- drag & drop images ----------
  const onDrop = async (e) => {
    e.preventDefault();
    const f = [...e.dataTransfer.files].find((x) => x.type.startsWith('image/'));
    if (f) placeImage(await fileToDataURL(f), f.name.replace(/\.\w+$/, ''));
  };

  // ---------- layer ops ----------
  const setLayer = (id, patch) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const moveLayer = (id, d) => setLayers((ls) => {
    const i = ls.findIndex((l) => l.id === id), j = i + d;
    if (j < 0 || j >= ls.length) return ls;
    const n = [...ls]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const deleteLayer = (id) => {
    if (layers.length <= 1) return;
    if (!confirm('Delete this layer?')) return;
    const rest = layers.filter((l) => l.id !== id);
    setLayers(rest);
    if (active === id) setActive(rest.at(-1).id);
    undo.current.past = undo.current.past.filter((s) => s.layerId !== id);
  };
  const duplicateLayer = (id) => {
    const src = canv.current[id];
    const nid = addLayer(`${layers.find((l) => l.id === id)?.name} copy`, id);
    requestAnimationFrame(() => { canv.current[nid]?.getContext('2d').drawImage(src, 0, 0); scheduleSave([nid]); force((n) => n + 1); });
  };
  const mergeDown = (id) => {
    const i = layers.findIndex((l) => l.id === id);
    if (i <= 0) return;
    const below = layers[i - 1], me = layers[i];
    const backup = beginOp(below.id);
    const ctx = canv.current[below.id].getContext('2d');
    ctx.save(); ctx.globalAlpha = me.opacity; ctx.drawImage(canv.current[me.id], 0, 0); ctx.restore();
    endOp(below.id, backup);
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setActive(below.id);
  };
  const clearLayer = (id) => {
    const backup = beginOp(id);
    canv.current[id].getContext('2d').clearRect(0, 0, W, H);
    endOp(id, backup);
  };

  const activeIndex = layers.findIndex((l) => l.id === active);
  const cursor = tool === 'hand' ? 'grab' : tool === 'picker' ? 'copy' : tool === 'text' ? 'text' : floating ? 'move' : 'crosshair';

  const ToolBtn = ({ id, def }) => (
    <button className={`tool ${tool === id ? 'on' : ''}`} title={`${def.label} (${def.key.toUpperCase()})`} onClick={() => setTool(id)}>{def.icon}</button>
  );

  return (
    <div className="studio" style={{ flex: 1, minHeight: 0 }}>
      <div className="toolrail">
        {Object.entries(BRUSHES).map(([id, d]) => <ToolBtn key={id} id={id} def={d} />)}
        <div className="tool-sep" />
        {Object.entries(SHAPES).map(([id, d]) => <ToolBtn key={id} id={id} def={d} />)}
        <div className="tool-sep" />
        {Object.entries(OTHER).map(([id, d]) => <ToolBtn key={id} id={id} def={d} />)}
        <div className="tool-sep" />
        <button className="tool" title="Undo (Ctrl+Z)" onClick={doUndo} disabled={!undo.current.past.length}>↶</button>
        <button className="tool" title="Redo (Ctrl+Shift+Z)" onClick={doRedo} disabled={!undo.current.future.length}>↷</button>
        <label className="tool" title="Import image (or drag one onto the canvas)" style={{ cursor: 'pointer' }}>
          🖼<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) placeImage(await fileToDataURL(f), f.name.replace(/\.\w+$/, '')); e.target.value = ''; }} />
        </label>
        <div className="tool-sep" />
        <input type="color" value={color} onChange={(e) => pickColor(e.target.value)} title="Color" style={{ width: 36, height: 36, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />
      </div>

      <div
        className="canvas-area"
        ref={areaRef}
        style={{ cursor, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="canvas-stage" ref={stageRef} style={{ width: W, height: H, transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
          {layers.map((l, i) => (
            <canvas key={l.id} ref={(n) => { if (n) canv.current[l.id] = n; }} width={W} height={H}
              style={{ zIndex: i * 2, opacity: l.opacity, display: l.visible ? 'block' : 'none', background: i === 0 ? 'transparent' : undefined }} />
          ))}
          <canvas ref={strokeRef} width={W} height={H} style={{ zIndex: activeIndex * 2 + 1, pointerEvents: 'none' }} />
          <canvas ref={guideRef} width={W} height={H} style={{ zIndex: 1000, opacity: guideAlpha, pointerEvents: 'none' }} />
          <canvas ref={overlayRef} width={W} height={H} style={{ zIndex: 1001, pointerEvents: 'none' }} />
          {textBox && (
            <textarea
              autoFocus
              value={textBox.value}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => setTextBox({ ...textBox, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); } if (e.key === 'Escape') setTextBox(null); }}
              placeholder="Type, then Enter"
              style={{ position: 'absolute', left: textBox.x, top: textBox.y, zIndex: 1002, font: `${fontSize}px ${font}`, color, background: 'rgba(255,255,255,.6)', border: '1px dashed #2f86c0', minWidth: 200, lineHeight: 1.2, padding: 0, resize: 'both' }}
            />
          )}
        </div>
        <div className="canvas-hud" onPointerDown={(e) => e.stopPropagation()}>
          <button className="btn xs ghost" onClick={() => setView((v) => ({ ...v, zoom: Math.max(0.1, v.zoom / 1.25) }))}>−</button>
          <span style={{ minWidth: 42, textAlign: 'center' }}>{Math.round(view.zoom * 100)}%</span>
          <button className="btn xs ghost" onClick={() => setView((v) => ({ ...v, zoom: Math.min(8, v.zoom * 1.25) }))}>+</button>
          <button className="btn xs ghost" onClick={fitView}>Fit</button>
          {floating && <>
            <span className="faint">|</span>
            <span className="small">Drag to move · corners scale · top handle rotates</span>
            <button className="btn xs primary" onClick={applyFloating}>Apply ⏎</button>
            <button className="btn xs" onClick={cancelFloating}>Cancel</button>
          </>}
        </div>
      </div>

      <div className="studio-panel">
        <div className="panel-sec">
          <h4>{(BRUSHES[tool] || SHAPES[tool] || OTHER[tool])?.label}</h4>
          {(BRUSHES[tool] || SHAPES[tool]) && (
            <div className="field"><label>Size: {size}px</label><input type="range" min={1} max={200} value={size} onChange={(e) => setSize(Number(e.target.value))} /></div>
          )}
          {(BRUSHES[tool] || SHAPES[tool] || tool === 'fill' || tool === 'text') && (
            <div className="field"><label>Opacity: {Math.round(opacity * 100)}%</label><input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} /></div>
          )}
          {SHAPES[tool] && tool !== 'line' && <label className="row small"><input type="checkbox" checked={fillShapes} onChange={(e) => setFillShapes(e.target.checked)} /> Filled shape</label>}
          {SHAPES[tool] && <div className="faint small">Hold Shift for straight lines, squares and circles.</div>}
          {tool === 'fill' && <div className="field"><label>Gap tolerance: {tolerance}</label><input type="range" min={0} max={160} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} /><div className="help">Fills the enclosed area you click, using lines on all visible layers. Tip: ink on one layer, color on a layer below.</div></div>}
          {tool === 'text' && (
            <div className="col" style={{ gap: 6 }}>
              <select className="select" value={font} onChange={(e) => setFont(e.target.value)}>{FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0].replace(/"/g, '')}</option>)}</select>
              <div className="field"><label>Font size: {fontSize}</label><input type="range" min={10} max={200} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} /></div>
              <div className="faint small">Click the canvas to place text. Use it for labels like "leather, worn at the elbows".</div>
            </div>
          )}
          {tool === 'select' && <div className="faint small">Drag a box to lift part of the layer, then move, scale or rotate it. Enter applies, Esc cancels, Delete removes.</div>}
        </div>

        <div className="panel-sec">
          <h4>Color</h4>
          <div className="row" style={{ marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 6, background: color, border: '1px solid var(--line)' }} />
            <input className="input" value={color} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && pickColor(e.target.value)} style={{ fontFamily: 'var(--font-script)' }} />
          </div>
          <div className="swatches">{PALETTE.map((c) => <div key={c} className={`swatch ${c === color ? 'on' : ''}`} style={{ background: c }} onClick={() => pickColor(c)} />)}</div>
          {recent.length > 0 && <><div className="faint small" style={{ margin: '8px 0 4px' }}>Recent</div><div className="swatches">{recent.map((c) => <div key={c} className="swatch" style={{ background: c }} onClick={() => setColor(c)} />)}</div></>}
        </div>

        <div className="panel-sec">
          <div className="row"><h4 style={{ margin: 0 }}>Layers</h4><div className="spacer" /><button className="btn xs" onClick={() => addLayer()}>+ Layer</button></div>
          <div className="col" style={{ gap: 3, marginTop: 8 }}>
            {[...layers].reverse().map((l) => (
              <div key={l.id} className={`layer ${l.id === active ? 'on' : ''}`} onClick={() => setActive(l.id)}>
                <button className="btn xs ghost" style={{ padding: '0 4px' }} onClick={(e) => { e.stopPropagation(); setLayer(l.id, { visible: !l.visible }); }} title="Show/hide">{l.visible ? '👁' : '◌'}</button>
                <input className="lname" value={l.name} onChange={(e) => setLayer(l.id, { name: e.target.value })} onClick={(e) => e.stopPropagation()} />
                <span className="faint small">{Math.round(l.opacity * 100)}%</span>
              </div>
            ))}
          </div>
          {activeLayer && (
            <div className="col" style={{ gap: 6, marginTop: 8 }}>
              <div className="field"><label>Layer opacity</label><input type="range" min={0} max={1} step={0.05} value={activeLayer.opacity} onChange={(e) => setLayer(active, { opacity: Number(e.target.value) })} /></div>
              <div className="row wrap" style={{ gap: 4 }}>
                <button className="btn xs" onClick={() => moveLayer(active, 1)} title="Move up">▲</button>
                <button className="btn xs" onClick={() => moveLayer(active, -1)} title="Move down">▼</button>
                <button className="btn xs" onClick={() => duplicateLayer(active)}>Duplicate</button>
                <button className="btn xs" onClick={() => mergeDown(active)}>Merge ↓</button>
                <button className="btn xs" onClick={() => clearLayer(active)}>Clear</button>
                <button className="btn xs danger" onClick={() => deleteLayer(active)}>Delete</button>
              </div>
            </div>
          )}
          <div className="why" style={{ marginTop: 8 }}>Artists sketch, ink and color on separate layers so each can be changed without wrecking the others.</div>
        </div>

        <div className="panel-sec">
          <h4>Guides & templates</h4>
          <select className="select" value={guide} onChange={(e) => setGuide(e.target.value)}>{Object.entries(GUIDES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          {guide === 'pose' && (
            <div className="row wrap" style={{ marginTop: 6, gap: 4 }}>{Object.entries(POSES).map(([k, p]) => <button key={k} className={`chip ${pose === k ? 'on' : ''}`} onClick={() => setPose(k)}>{p.label}</button>)}</div>
          )}
          {guide !== 'none' && <div className="field" style={{ marginTop: 6 }}><label>Guide visibility</label><input type="range" min={0.1} max={1} step={0.05} value={guideAlpha} onChange={(e) => setGuideAlpha(Number(e.target.value))} /></div>}
          <div className="why" style={{ marginTop: 6 }}>Guides never print or export. Draw over them on a new layer.</div>
        </div>

        {panelSlot}
      </div>
    </div>
  );
});

function constrain(a, b, tool) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (tool === 'line') {
    const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    const d = Math.hypot(dx, dy);
    return { x: a.x + Math.cos(ang) * d, y: a.y + Math.sin(ang) * d };
  }
  const s = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: a.x + Math.sign(dx || 1) * s, y: a.y + Math.sign(dy || 1) * s };
}

function drawShape(ctx, tool, a, b, { color, size, fill, alpha }) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (tool === 'line') { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  if (tool === 'rect') { ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y); fill ? ctx.fill() : ctx.stroke(); }
  if (tool === 'ellipse') { ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2); fill ? ctx.fill() : ctx.stroke(); }
  ctx.restore();
}

export default DrawingCanvas;
