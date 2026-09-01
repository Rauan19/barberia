import { Scissors } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scissors className="h-5 w-5" />
        </span>
        Barbearia
      </div>
      {children}
      <p className="text-xs text-muted-foreground">
        Gestão de cortes, clientes e financeiro.
      </p>
    </div>
  );
}
