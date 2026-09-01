'use client';

import * as React from 'react';
import { Download, X } from 'lucide-react';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'bb-install-dismissed';

/** Convite para instalar o app na tela inicial do celular. */
export function InstallPrompt() {
  const [event, setEvent] = React.useState<InstallEvent | null>(null);
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // localStorage bloqueado: segue mostrando o convite.
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setHidden(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // sem persistência, apenas some nesta sessão
    }
  }

  if (hidden || !event) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg animate-fade-in lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Download className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Instalar na tela inicial</p>
        <p className="text-xs text-muted-foreground">Abre como app, sem barra do navegador.</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await event.prompt();
          await event.userChoice;
          dismiss();
        }}
        className="h-8 shrink-0 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
