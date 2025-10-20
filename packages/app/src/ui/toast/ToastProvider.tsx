import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; kind: "success"|"error"|"info"|"warn"; text: string };
const ToastCtx = createContext<{ push:(t:Omit<Toast,"id">)=>void; items:Toast[]; remove:(id:string)=>void }|null>(null);

export function ToastProvider({ children }:{children:React.ReactNode}) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast,"id">) => {
    const id = Math.random().toString(36).slice(2,8);
    setItems(prev => [...prev, { ...t, id }]);
    setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);
  const remove = useCallback((id:string)=> setItems(prev => prev.filter(x => x.id !== id)), []);
  const value = useMemo(()=>({ push, items, remove }), [push, items, remove]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="ff-toasts" role="status" aria-live="polite">
        {items.map(t => (
          <div key={t.id} className={`ff-toast ff-${t.kind}`} onClick={()=>remove(t.id)}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast(){ const v=useContext(ToastCtx); if(!v) throw new Error("ToastProvider missing"); return v; }
