import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Startup debug
console.group('FrameForge App Boot');
console.log('Flags', import.meta.env);
console.groupEnd();

const root = document.getElementById('root')!;
createRoot(root).render(<App />);
