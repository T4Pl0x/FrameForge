export type SampleMethod = 'grid' | 'ring' | 'center-mean';

export interface Rect { x: number; y: number; width: number; height: number }

export interface LuminanceSample {
  targetId: string;
  area: Rect;
  bgLuminance: number;
  fgLuminance?: number;
  contrast?: number;
  minContrast?: number;
  n: number;
  method: SampleMethod;
}

export interface SampleRequest {
  cmd: 'sample';
  targetId: string;
  area: Rect;
  dpr: number;
  method?: SampleMethod;
  bitmap?: ImageBitmap;
  fgColor?: { r: number; g: number; b: number; a?: number };
}

export interface SampleResponse {
  ok: true;
  sample: LuminanceSample;
}

