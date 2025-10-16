import { useEffect, useState } from 'react';
import { Notifs, Toast } from '@frameforge/os';

export function Toaster(){
  const [queue, setQueue] = useState<Toast[]>([]);
  useEffect(() => Notifs.sub((t) => {
    setQueue(q => [...q, t]);
    setTimeout(() => setQueue(q => q.filter(x => x.id !== t.id)), 3000);
  }), []);
  if (queue.length === 0) return null;
  return (
    <div style={{ position:'fixed', right: 12, bottom: 48, display:'flex', flexDirection:'column', gap:8, zIndex: 200 }}>
      {queue.map(t => (
        <div key={t.id} style={{ background:'rgba(22,26,34,0.9)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', fontSize:12 }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

