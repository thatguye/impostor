import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register offline-first PWA service worker with instant autoUpdate & controllerchange reload
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let hasReloadedForUpdate = false;
  const hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || hasReloadedForUpdate) return;
    hasReloadedForUpdate = true;
    window.location.reload();
  });

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const checkForUpdate = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', checkForUpdate);
    },
    onRegisterError() {
      // Fail silently in restricted preview frames if SW registration is disallowed
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
