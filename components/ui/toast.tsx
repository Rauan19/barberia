'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  title: string;
  description?: string;
  kind: ToastKind;
};

type ToastInput = { title: string; description?: string; kind?: ToastKind };

const ToastContext = React.createContext<(toast: ToastInput) => void>(() => {});

export function useToast() {
  return React.useContext(ToastContext);
}

const icons: Record<ToastKind, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const tones: Record<ToastKind, string> = {
  success: 'border-success/30 text-success',
  error: 'border-destructive/30 text-destructive',
  info: 'border-border text-foreground',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind: 'success', ...input }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = icons[toast.kind];
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3 shadow-lg animate-fade-in',
                tones[toast.kind],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{toast.description}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
