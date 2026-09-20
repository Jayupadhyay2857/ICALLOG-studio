import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/serviceWorkerRegistration.ts';
import { initOfflineDB } from './lib/offlineIndexedDB.ts';

// Bootstrap offline capabilities: Service Worker asset precaching & IndexedDB
if (typeof window !== 'undefined') {
  registerServiceWorker().catch(console.warn);
  initOfflineDB().catch(console.warn);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

