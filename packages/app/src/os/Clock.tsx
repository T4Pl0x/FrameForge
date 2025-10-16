import { useEffect, useState } from 'react';

function fmt(d: Date){
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  return `${h}:${m}`;
}

export function Clock(){
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000 * 30); return () => clearInterval(t); }, []);
  return <div className="ff-clock" aria-label="Clock">{fmt(now)}</div>;
}

