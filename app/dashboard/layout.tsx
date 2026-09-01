import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileTopbar } from '@/components/layout/mobile-nav';
import { MobileBottomNav } from '@/components/layout/bottom-nav';
import { QuickAction } from '@/components/layout/quick-action';
import { ToastProvider } from '@/components/ui/toast';
import { InstallPrompt } from '@/components/pwa/install-prompt';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <Sidebar name={user.name} barbershop={user.barbershop} hasLogo={user.hasLogo} slug={user.slug} />
        <MobileTopbar
          barbershop={user.barbershop}
          hasLogo={user.hasLogo}
          slug={user.slug}
        />

        <main className="lg:pl-60">
          <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:pb-10 lg:pt-6">
            {children}
          </div>
        </main>

        <QuickAction userId={user.id} />
        <MobileBottomNav />
        <InstallPrompt />
      </div>
    </ToastProvider>
  );
}
