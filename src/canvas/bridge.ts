export interface Rect { x: number; y: number; width: number; height: number }
export interface RenderBitmapOptions { area: Rect; dpr?: number }

export interface CanvasSurface {
  getRenderBitmap(opts: RenderBitmapOptions): Promise<ImageBitmap>;
  getRenderPixels?(opts: RenderBitmapOptions): Promise<ImageData>;
}

