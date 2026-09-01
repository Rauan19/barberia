'use client';

import * as React from 'react';
import { Download, Share, X } from 'lucide-react';

import { useInstall } from '@/components/pwa/use-install';

const DISMISS_KEY = 'bb-install-dismissed';

/**
 * Convite flutuante para instalar o app.
 * No iPhone nao existe convite nativo, entao mostramos o caminho manual.
 */
export function InstallPrompt() {
  const { canPrompt, isIOS, isStandalone, ready, install } = useInstall();
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    try {
      setDismissed(Boolean(localStorage.getItem(DISMISS_KEY)));
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // sem persistencia, some apenas nesta sessao
    }
  }

  if (!ready || dismissed || isStandalone) return null;
  if (!canPrompt && !isIOS) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg animate-fade-in lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {isIOS ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Instalar na tela inicial</p>
        <p className="text-xs text-muted-foreground">
          {isIOS
            ? 'Toque em Compartilhar e depois em Adicionar à Tela de Início.'
            : 'Abre como app, sem barra do navegador.'}
        </p>
      </div>

      {canPrompt ? (
        <button
          type="button"
          onClick={async () => {
            await install();
            dismiss();
          }}
          className="h-8 shrink-0 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
        >
          Instalar
        </button>
      ) : null}

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
