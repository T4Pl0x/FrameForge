import { WM } from './windowing';
import { Clock } from './Clock';

export function Tray(){
  const items = [
    { id: 'gates', label: 'Gates', open: () => WM.open('processes', { title: 'Gates' }) },
    { id: 'broker', label: 'Broker', open: () => WM.open('processes', { title: 'Broker' }) },
    { id: 'agents', label: 'Agents', open: () => WM.open('agents') },
    { id: 'rag', label: 'RAG', open: () => WM.open('tools', { title: 'RAG' }) },
    { id: 'notifs', label: 'Notifs', open: () => WM.open('logs', { title: 'Notifications' }) },
  ];
  return (
    <div className="ff-tray" role="toolbar" aria-label="System Tray">
      {items.map(it => (
        <button key={it.id} className="ff-tray-item" title={it.label} onClick={it.open}>{it.label}</button>
      ))}
      <Clock />
    </div>
  );
}
