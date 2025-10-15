/* eslint-disable no-restricted-globals */
// CanvasA11y Worker — ring + grid sampling for contrast/luminance

/**
Expected protocol:
Main thread posts SampleRequest: { id, targetId, bounds:{x,y,w,h}, state, mode: 'ring'|'grid', ring?, grid?, tokenKey? }
Worker will request a bitmap by posting: { type:'needBitmap', id, region:{x,y,w,h} }
Main replies with: { type:'bitmap', id, bitmap: ImageBitmap }
Worker replies with SampleResponse: { id, targetId, state, mode, surroundingLuminance, textBgContrast, iconBgContrast, meta:{samples,usedMedian}, cacheKey }
*/

function CLAMP01(x) { return Math.min(1, Math.max(0, x)); }
function toLin(c) { const v = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); return v; }
function relLum(r, g, b) { const R = toLin(r / 255), G = toLin(g / 255), B = toLin(b / 255); return 0.2126 * R + 0.7152 * G + 0.0722 * B; }
function RATIO(L1, L2) { const a = Math.max(L1, L2), b = Math.min(L1, L2); return (a + 0.05) / (b + 0.05); }
function parseColor(input) {
  if (!input || typeof input !== 'string') return null;
  let h = input.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) h = h.split('').map(c=>c+c).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  if ([r,g,b].some(Number.isNaN)) return null;
  return { r, g, b };
}

const pending = new Map();

async function requestBitmap(id, region) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('bitmap timeout')); }, 3000);
    pending.set(id, (payload) => { clearTimeout(timer); resolve(payload); });
    self.postMessage({ type: 'needBitmap', id, region });
  });
}

function sampleBand(ctx, outer, inner, bandW) {
  const rects = [
    { x: outer.x, y: outer.y, w: outer.w, h: bandW },
    { x: outer.x, y: outer.y + outer.h - bandW, w: outer.w, h: bandW },
    { x: outer.x, y: outer.y + bandW, w: bandW, h: inner.h - 2*bandW },
    { x: outer.x + outer.w - bandW, y: outer.y + bandW, w: bandW, h: inner.h - 2*bandW },
  ];
  const vals = [];
  for (const r of rects) {
    const img = ctx.getImageData(r.x, r.y, r.w, r.h).data;
    for (let i=0;i<img.length;i+=4) vals.push(relLum(img[i], img[i+1], img[i+2]));
  }
  vals.sort((a,b)=>a-b);
  const n = vals.length || 1;
  const median = vals[Math.floor(n/2)] || 0;
  const mean = vals.reduce((a,b)=>a+b,0) / n;
  const outFrac = (vals.filter(v => v>0.85).length + vals.filter(v => v<0.15).length) / n;
  return { value: outFrac>0.3 ? median : mean, samples: n, usedMedian: outFrac>0.3 };
}

self.onmessage = async (evt) => {
  const msg = evt.data || {};
  if (msg.type === 'bitmap' && pending.has(msg.id)) {
    const cb = pending.get(msg.id); pending.delete(msg.id); cb(msg);
    return;
  }
  const req = msg; // SampleRequest
  if (!req || !req.id || !req.bounds || !req.mode) return;

  const cacheKey = [req.targetId, req.state, req.mode, req.tokenKey || '', req.bounds.x|0, req.bounds.y|0, req.bounds.w|0, req.bounds.h|0].join('|');
  try {
    const { id, bounds, mode } = req;
    const bmpMsg = await requestBitmap(id, bounds);
    const bmp = bmpMsg.bitmap;
    if (!bmp) throw new Error('no bitmap provided');
    const canvas = new OffscreenCanvas(bounds.w, bounds.h);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);

    if (mode === 'ring') {
      const t = Math.max(1, Math.floor(req.ring?.thicknessPx || 2));
      const off = Math.max(0, Math.floor(req.ring?.offsetPx || 0));
      const band = Math.max(4, Math.ceil(t));
      const outer = { x: Math.max(0, off + t/2 - band), y: Math.max(0, off + t/2 - band), w: Math.min(bounds.w, bounds.w - 2*Math.max(0, off + t/2 - band)), h: Math.min(bounds.h, bounds.h - 2*Math.max(0, off + t/2 - band)) };
      const inner = { x: Math.max(0, off + t/2), y: Math.max(0, off + t/2), w: Math.min(bounds.w, bounds.w - 2*(off + t/2)), h: Math.min(bounds.h, bounds.h - 2*(off + t/2)) };
      const bandRes = sampleBand(ctx, outer, inner, band);
      const ringCol = parseColor(req.ring?.color || '#4C7DFF') || { r: 76, g: 125, b: 255 };
      const _lRing = relLum(ringCol.r, ringCol.g, ringCol.b);
      const lSurr = bandRes.value;
      const resp = { id: req.id, targetId: req.targetId, state: req.state, mode: 'ring', surroundingLuminance: Number(lSurr.toFixed(3)), meta: { samples: bandRes.samples, usedMedian: bandRes.usedMedian }, cacheKey };
      self.postMessage(resp);
      return;
    }

    if (mode === 'grid') {
      const cols = Math.max(1, Math.floor(req.grid?.cols || 5));
      const rows = Math.max(1, Math.floor(req.grid?.rows || 5));
      const cw = Math.max(1, Math.floor(bounds.w / cols));
      const ch = Math.max(1, Math.floor(bounds.h / rows));
      const vals = [];
      for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
        const x = c*cw, y = r*ch, w = (c===cols-1 ? bounds.w - x : cw), h = (r===rows-1 ? bounds.h - y : ch);
        const img = ctx.getImageData(x,y,w,h).data;
        let acc=0, n=0;
        for (let i=0;i<img.length;i+=4) { acc += relLum(img[i], img[i+1], img[i+2]); n++; }
        vals.push(acc/(n||1));
      }
      vals.sort((a,b)=>a-b);
      const mean = vals.reduce((a,b)=>a+b,0) / (vals.length||1);
      const median = vals[Math.floor(vals.length/2)] || mean;
      const _lBg = (vals.filter(v=>v>0.85).length + vals.filter(v=>v<0.15).length) / (vals.length||1) > 0.3 ? median : mean;
      // Note: main thread should compute fg/icon luminance from resolved color; worker reports background only
      const resp = { id: req.id, targetId: req.targetId, state: req.state, mode: 'grid', meta: { samples: vals.length, usedMedian: false }, cacheKey, textBgContrast: undefined, iconBgContrast: undefined };
      self.postMessage(resp);
      return;
    }
  } catch (e) {
    self.postMessage({ id: req.id, error: String(e?.message || e), cacheKey });
  }
};
