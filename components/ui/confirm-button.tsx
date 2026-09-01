'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';

/** Botao de acao destrutiva: pede confirmacao antes de enviar o form. */
export function ConfirmButton({
  message,
  children,
  ...props
}: ButtonProps & { message: string }) {
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
          return;
        }
        setPending(true);
      }}
      {...props}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
