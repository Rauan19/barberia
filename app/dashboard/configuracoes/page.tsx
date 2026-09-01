import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { getCurrentUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';
import { prisma } from '@/lib/db';
import { formatDateBR } from '@/lib/date';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { ProfileForm } from '@/components/configuracoes/profile-form';
import { LogoForm } from '@/components/configuracoes/logo-form';
import { PublicPageForm } from '@/components/configuracoes/public-page-form';
import { PasswordForm } from '@/components/configuracoes/password-form';
import { InstallCard } from '@/components/pwa/install-card';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [clients, cuts, services, appointments] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.cut.count({ where: { userId: user.id } }),
    prisma.service.count({ where: { userId: user.id } }),
    prisma.appointment.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Configurações" description="Sua conta e seus dados." />

      <ProfileForm name={user.name} email={user.email} barbershop={user.barbershop} />

      <LogoForm
        slug={user.slug}
        hasLogo={user.hasLogo}
        title={user.barbershop || user.name}
      />

      <PublicPageForm
        slug={user.slug}
        phone={user.phone}
        address={user.address}
        bio={user.bio}
      />

      <InstallCard />

      <PasswordForm />

      <Card className="p-5">
        <p className="text-sm font-semibold">Seus dados</p>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Clientes</dt>
            <dd className="text-lg font-semibold tabular">{clients}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cortes</dt>
            <dd className="text-lg font-semibold tabular">{cuts}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Serviços</dt>
            <dd className="text-lg font-semibold tabular">{services}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Agendamentos</dt>
            <dd className="text-lg font-semibold tabular">{appointments}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Conta criada em {formatDateBR(user.createdAt)}.
        </p>
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold">Sessão</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Encerre a sessão neste dispositivo.
        </p>
        <form action={logoutAction} className="mt-3">
          <Button type="submit" variant="outline" className="text-destructive">
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </form>
      </Card>
    </div>
  );
}
