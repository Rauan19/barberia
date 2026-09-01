'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Esconde o botão flutuante enquanto o barbeiro rola a lista para baixo,
 * para não cobrir os botões de cada linha. Volta assim que ele sobe.
 */
export function ScrollAwareFab({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = React.useState(false);
  const lastY = React.useRef(0);

  React.useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && y > 120);
        lastY.current = y;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 transition-all duration-200 lg:hidden',
        hidden ? 'pointer-events-none translate-y-4 opacity-0' : 'translate-y-0 opacity-100',
      )}
    >
      {children}
    </div>
  );
}
