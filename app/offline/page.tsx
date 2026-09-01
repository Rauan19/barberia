import { WifiOff } from 'lucide-react';

export const metadata = { title: 'Sem conexão' };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <WifiOff className="h-8 w-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Você está sem conexão</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Conecte-se à internet para ver seus cortes, sua agenda e o financeiro.
      </p>
    </div>
  );
}
