'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { removeLogoAction, uploadLogoAction } from '@/app/actions/perfil';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { initials } from '@/lib/utils';
import { prepareLogo, formatBytes, type ResizeResult } from '@/lib/image';

export function LogoForm({
  slug,
  hasLogo,
  title,
}: {
  slug: string;
  hasLogo: boolean;
  title: string;
}) {
  const [state, formAction] = useActionState(uploadLogoAction, idleState);
  const [picked, setPicked] = React.useState<ResizeResult | null>(null);
  const [preparing, setPreparing] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Logo atualizada!' });
    setPicked(null);
    router.refresh();
  }, [state, toast, router]);

  React.useEffect(
    () => () => {
      if (picked) URL.revokeObjectURL(picked.previewUrl);
    },
    [picked],
  );

  async function handlePick(file: File) {
    setLocalError(null);
    setPreparing(true);
    try {
      const result = await prepareLogo(file);
      setPicked(result);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Não consegui abrir essa imagem. Tente um PNG ou JPG.',
      );
      setPicked(null);
    } finally {
      setPreparing(false);
    }
  }

  const src = picked?.previewUrl ?? (hasLogo ? `/b/${slug}/logo` : null);
  const error = localError ?? state.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo da barbearia</CardTitle>
        <CardDescription>
          Aparece no menu e na sua página pública. Pode mandar a imagem do tamanho que
          for: ela é reduzida aqui no seu celular antes de subir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            handled.current = false;
            if (picked) formData.set('logo', picked.file, picked.file.name);
            formAction(formData);
          }}
          className="flex flex-col gap-4 sm:flex-row sm:items-start"
        >
          {src ? (
            <Image
              src={src}
              alt="Logo da barbearia"
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl font-semibold">
              {initials(title)}
            </span>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <input
              ref={inputRef}
              type="file"
              name="logo"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePick(file);
              }}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={preparing}
                onClick={() => inputRef.current?.click()}
              >
                {preparing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {preparing ? 'Preparando...' : 'Escolher imagem'}
              </Button>
              {picked ? <SubmitButton>Enviar logo</SubmitButton> : null}
            </div>

            {picked ? (
              <p className="text-xs text-muted-foreground">
                {picked.resized
                  ? `Reduzida de ${formatBytes(picked.originalBytes)} para ${formatBytes(picked.finalBytes)}.`
                  : `Arquivo vetorial, enviado como está (${formatBytes(picked.finalBytes)}).`}
              </p>
            ) : null}

            {error ? (
              <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : null}
          </div>
        </form>

        {hasLogo ? (
          <form action={removeLogoAction} className="mt-4 border-t border-border pt-4">
            <ConfirmButton
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              message="Remover a logo da barbearia?"
            >
              <Trash2 className="h-4 w-4" />
              Remover logo
            </ConfirmButton>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
