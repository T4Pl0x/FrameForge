import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { logger } from '@shared/logger';

// Startup debug
logger.info('App boot');
logger.debug('Flags', import.meta.env);

const root = document.getElementById('root')!;
createRoot(root).render(<App />);
