'use client';

import * as React from 'react';

/** Form de filtros que reenvia a pagina assim que algum campo muda. */
export function FilterForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      className={className}
      onChange={() => ref.current?.requestSubmit()}
    >
      {children}
    </form>
  );
}
