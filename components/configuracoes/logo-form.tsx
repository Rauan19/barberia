'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, ImagePlus, Trash2 } from 'lucide-react';

import { removeLogoAction, uploadLogoAction } from '@/app/actions/perfil';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { initials } from '@/lib/utils';

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
  const [preview, setPreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Logo atualizada!' });
    setPreview(null);
    setFileName('');
    router.refresh();
  }, [state, toast, router]);

  React.useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const src = preview ?? (hasLogo ? `/b/${slug}/logo` : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo da barbearia</CardTitle>
        <CardDescription>
          Aparece no menu e na sua página pública. PNG, JPG, WEBP ou SVG até 1 MB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            handled.current = false;
            formAction(formData);
          }}
          className="flex flex-col gap-4 sm:flex-row sm:items-start"
        >
          <div className="flex items-center gap-4">
            {src ? (
              <Image
                src={src}
                alt="Logo da barbearia"
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-xl border border-border object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-secondary text-xl font-semibold">
                {initials(title)}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <input
              ref={inputRef}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                setPreview(URL.createObjectURL(file));
              }}
            />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
                Escolher imagem
              </Button>
              {fileName ? <SubmitButton>Enviar logo</SubmitButton> : null}
            </div>

            {fileName ? (
              <p className="truncate text-xs text-muted-foreground">{fileName}</p>
            ) : null}

            {state.error ? (
              <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {state.error}
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
