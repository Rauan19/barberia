'use client';

import { CheckCircle2, Download, Share, SquarePlus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInstall } from '@/components/pwa/use-install';

/** Bloco fixo em Configuracoes, para instalar o app a qualquer momento. */
export function InstallCard() {
  const { canPrompt, isIOS, isStandalone, ready, install } = useInstall();

  if (!ready) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instalar no celular</CardTitle>
        <CardDescription>
          O app abre em tela cheia, sem a barra do navegador, com ícone junto dos
          seus outros aplicativos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isStandalone ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            Você já está usando o app instalado.
          </p>
        ) : isIOS ? (
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                1
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                Toque no botão <Share className="h-4 w-4 text-primary" />
                <strong className="font-medium">Compartilhar</strong>, na barra de baixo
                do Safari.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                2
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                Role e escolha <SquarePlus className="h-4 w-4 text-primary" />
                <strong className="font-medium">Adicionar à Tela de Início</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                3
              </span>
              <span>Confirme em Adicionar. Pronto, o ícone aparece na tela inicial.</span>
            </li>
          </ol>
        ) : canPrompt ? (
          <Button onClick={() => install()}>
            <Download className="h-4 w-4" />
            Instalar app
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Seu navegador ainda não ofereceu a instalação. No Chrome do Android, abra o
            menu de três pontos e escolha <strong className="font-medium">Instalar app</strong>{' '}
            ou Adicionar à tela inicial.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
