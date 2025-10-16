export type AppId = "publish"|"agents"|"tools"|"settings"|"processes"|"logs"|"approvals";
let DOCK_OFFSET = 240;
export function setDockOffset(n: number){ DOCK_OFFSET = Math.max(0, n|0); }
export type WinId = string;
export interface WinSpec { id: WinId; app: AppId; title: string; x: number; y: number; w: number; h: number; z: number; minimized?: boolean; }

type Sub = () => void;

class WindowManager {
  private windows: WinSpec[] = [];
  private subs: Set<Sub> = new Set();
  private zTop = 10;
  private activeId: WinId | null = null;

  subscribe(fn: Sub){ this.subs.add(fn); return () => this.subs.delete(fn); }
  private emit(){ for (const fn of this.subs) fn(); }
  list(): WinSpec[] { return this.windows.slice().sort((a,b)=>a.z-b.z); }
  getActive(): WinId | null { return this.activeId; }

  open(app: AppId, opts?: Partial<WinSpec>): WinId {
    const id: WinId = `w_${Math.random().toString(36).slice(2,8)}`;
    const w: WinSpec = {
      id, app,
      title: opts?.title ?? app[0].toUpperCase() + app.slice(1),
      x: opts?.x ?? (DOCK_OFFSET + 40),
      y: opts?.y ?? 120,
      w: opts?.w ?? 720,
      h: opts?.h ?? 460,
      z: ++this.zTop,
      minimized: opts?.minimized ?? false
    };
    this.windows.push(w);
    this.focus(id);
    this.emit();
    return id;
  }
  close(id: WinId){
    this.windows = this.windows.filter(w => w.id !== id);
    if (this.activeId === id) this.activeId = null;
    this.emit();
  }
  focus(id: WinId){
    const w = this.windows.find(w => w.id === id);
    if (!w) return;
    w.z = ++this.zTop; w.minimized = false; this.activeId = id; this.emit();
  }
  minimize(id: WinId){
    const w = this.windows.find(w => w.id === id);
    if (!w) return;
    w.minimized = true; this.emit();
  }
  snap(id: WinId, pos: "left"|"right"|"max"){
    const w = this.windows.find(w => w.id === id);
    if (!w) return;
    const vw = window.innerWidth; const vh = window.innerHeight - 28; // account bottom bar
    const usable = vw - DOCK_OFFSET;
    if (pos === 'left') { w.x = DOCK_OFFSET; w.y = 0; w.w = Math.max(320, Math.floor(usable/2)); w.h = Math.max(240, vh); }
    else if (pos === 'right') { w.x = DOCK_OFFSET + Math.floor(usable/2); w.y = 0; w.w = Math.max(320, Math.floor(usable/2)); w.h = Math.max(240, vh); }
    else { w.x = DOCK_OFFSET; w.y = 0; w.w = usable; w.h = vh; }
    this.focus(id);
  }
  nextWindow(){
    if (this.windows.length === 0) return;
    const ordered = this.list().filter(w => !w.minimized);
    if (ordered.length === 0) return;
    if (!this.activeId) return this.focus(ordered[0].id);
    const idx = ordered.findIndex(w => w.id === this.activeId);
    const next = ordered[(idx+1) % ordered.length];
    this.focus(next.id);
  }
}

export const WM = new WindowManager();
