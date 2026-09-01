'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker.
 *
 * Roda tambem em desenvolvimento porque o Chrome so oferece a instalacao do PWA
 * depois que existe um service worker ativo. Sem isso, o botao "Instalar" nunca
 * apareceria nem no `localhost` nem em producao no primeiro acesso.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Falhar o registro nao pode quebrar o app.
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
