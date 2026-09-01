'use client';

import * as React from 'react';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type InstallState = {
  /** O navegador ofereceu o convite nativo e podemos dispara-lo. */
  canPrompt: boolean;
  /** iPhone e iPad: a instalacao e manual, pelo menu Compartilhar. */
  isIOS: boolean;
  /** Ja esta rodando como app instalado. */
  isStandalone: boolean;
  /** Terminou de descobrir o ambiente (evita piscar a UI errada). */
  ready: boolean;
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
};

/**
 * Estado de instalacao do PWA.
 *
 * O Chrome dispara `beforeinstallprompt` so quando ja existe um service worker
 * registrado e a pagina esta em HTTPS (ou localhost). O Safari do iPhone nunca
 * dispara esse evento: la a instalacao e feita a mao pelo menu Compartilhar,
 * entao mostramos as instrucoes em vez de um botao que nao faria nada.
 */
export function useInstall(): InstallState {
  const [event, setEvent] = React.useState<InstallEvent | null>(null);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPad no modo desktop se identifica como Mac com toque
      (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsIOS(iOS);
    setIsStandalone(standalone);
    setReady(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      setEvent(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = React.useCallback(async () => {
    if (!event) return 'unavailable' as const;
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    return outcome;
  }, [event]);

  return {
    canPrompt: Boolean(event),
    isIOS,
    isStandalone,
    ready,
    install,
  };
}
