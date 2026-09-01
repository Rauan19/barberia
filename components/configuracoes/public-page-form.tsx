'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Copy, ExternalLink } from 'lucide-react';

import { updatePublicPageAction } from '@/app/actions/perfil';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormField, Input, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';

export function PublicPageForm({
  slug,
  phone,
  address,
  bio,
}: {
  slug: string;
  phone: string | null;
  address: string | null;
  bio: string | null;
}) {
  const [state, formAction] = useActionState(updatePublicPageAction, idleState);
  const [copied, setCopied] = React.useState(false);
  const [origin, setOrigin] = React.useState('');
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => setOrigin(window.location.origin), []);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Página atualizada!' });
    router.refresh();
  }, [state, toast, router]);

  const url = `${origin}/b/${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Não consegui copiar', kind: 'error' });
    }
  }

  return (
    <Card id="pagina-publica">
      <CardHeader>
        <CardTitle>Página pública de agendamento</CardTitle>
        <CardDescription>
          Mande esse link para os clientes ou coloque na bio do Instagram.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-2">
          <code className="min-w-0 flex-1 truncate px-1 text-sm">{url}</code>
          <Button size="icon" variant="ghost" onClick={copy} title="Copiar link">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
          <a
            href={`/b/${slug}`}
            target="_blank"
            rel="noreferrer"
            title="Abrir página"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <form
          action={(formData) => {
            handled.current = false;
            formAction(formData);
          }}
          className="flex flex-col gap-4"
        >
          <FormField
            label="Endereço da página"
            htmlFor="slug"
            hint="Letras minúsculas, números e hífen."
          >
            <div className="flex items-center gap-1">
              <span className="shrink-0 text-sm text-muted-foreground">/b/</span>
              <Input id="slug" name="slug" defaultValue={slug} required />
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="WhatsApp" htmlFor="phone" hint="Aparece como botão de contato">
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={phone ?? ''}
                placeholder="75 99999-9999"
              />
            </FormField>

            <FormField label="Endereço" htmlFor="address" hint="Opcional">
              <Input
                id="address"
                name="address"
                defaultValue={address ?? ''}
                placeholder="Rua das Flores, 123"
              />
            </FormField>
          </div>

          <FormField label="Sobre a barbearia" htmlFor="bio" hint="Opcional">
            <Textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={bio ?? ''}
              placeholder="Corte na régua, atendimento com hora marcada."
            />
          </FormField>

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="sm:w-fit">Salvar página</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
