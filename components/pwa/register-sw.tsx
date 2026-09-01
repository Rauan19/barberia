'use client';

import { useEffect } from 'react';

/** Registra o service worker apenas em produção. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Falhar o registro não pode quebrar o app.
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
