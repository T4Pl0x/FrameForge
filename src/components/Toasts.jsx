import React, { useEffect, useState } from 'react';

export default function Toasts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    let id = 1;
    const on = (e) => {
      const t = { id: id++, ...e.detail };
      setList((prev) => [...prev, t]);
      setTimeout(() => setList((prev) => prev.filter((x) => x.id !== t.id)), 5000);
    };
    window.addEventListener('ff:toast', on);
    return () => window.removeEventListener('ff:toast', on);
  }, []);
  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, display: 'grid', gap: 8 }}>
      {list.map((t) => (
        <div key={t.id} style={{ padding: '8px 12px', borderRadius: 8, color: 'white', background: t.kind === 'error' ? '#DC2626' : '#059669', boxShadow: '0 10px 20px rgba(0,0,0,.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{t.msg}</span>
            {t.href && (
              <a href={t.href} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'rgba(255,255,255,0.9)' }}>
                {t.hrefLabel || 'Open'}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
