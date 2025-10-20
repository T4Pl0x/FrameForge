import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './ui/toast/ToastProvider';
import './styles.css';
import { logger } from '@shared/logger';

// Startup debug
logger.info('App boot');
logger.debug('Flags', import.meta.env);

const root = document.getElementById('root')!;
createRoot(root).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
