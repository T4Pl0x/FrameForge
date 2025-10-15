/// <reference lib="webworker" />
import type { SampleRequest, SampleResponse } from './types';

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const relLuminance = (r: number, g: number, b: number) => 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
const contrastRatio = (L1: number, L2: number) => {
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
};

self.onmessage = async (e: MessageEvent<SampleRequest>) => {
  const msg = e.data;
  if (msg.cmd !== 'sample' || !msg.bitmap) return;
  const { area, targetId, method = 'grid', dpr, fgColor } = msg;
  const off = new OffscreenCanvas(area.width * dpr, area.height * dpr);
  const ctx = off.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(
    msg.bitmap,
    area.x * dpr,
    area.y * dpr,
    area.width * dpr,
    area.height * dpr,
    0,
    0,
    area.width * dpr,
    area.height * dpr,
  );

  // Grid sampling (5x5)
  const steps = 5;
  const dx = Math.max(1, Math.floor((area.width * dpr) / steps));
  const dy = Math.max(1, Math.floor((area.height * dpr) / steps));
  let sumL = 0;
  let minL = 1;
  let maxL = 0;
  let count = 0;
  for (let y = dy >> 1; y < off.height; y += dy) {
    for (let x = dx >> 1; x < off.width; x += dx) {
      const data = ctx.getImageData(x, y, 1, 1).data;
      const L = relLuminance(data[0] / 255, data[1] / 255, data[2] / 255);
      sumL += L;
      count++;
      if (L < minL) minL = L;
      if (L > maxL) maxL = L;
    }
  }
  const bgL = sumL / (count || 1);

  let fgL: number | undefined;
  let cr: number | undefined;
  let minCR: number | undefined;
  if (fgColor) {
    fgL = relLuminance(fgColor.r / 255, fgColor.g / 255, fgColor.b / 255);
    cr = contrastRatio(fgL, bgL);
    minCR = Math.min(contrastRatio(fgL, minL), contrastRatio(fgL, maxL));
  }

  const resp: SampleResponse = {
    ok: true,
    sample: {
      targetId,
      area,
      bgLuminance: bgL,
      fgLuminance: fgL,
      contrast: cr,
      minContrast: minCR,
      n: count,
      method,
    },
  };
  (self as unknown as Worker).postMessage(resp);
};

