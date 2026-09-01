'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scissors, LogOut } from 'lucide-react';

import { NAV_ITEMS } from '@/components/layout/nav-items';
import { logoutAction } from '@/app/actions/auth';
import { cn, initials } from '@/lib/utils';

export function Sidebar({
  name,
  barbershop,
  hasLogo,
  slug,
}: {
  name: string;
  barbershop?: string | null;
  hasLogo?: boolean;
  slug: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card lg:flex">
      <div className="flex items-center gap-2 px-5 py-5 text-base font-semibold">
        {hasLogo ? (
          <Image
            src={`/b/${slug}/logo`}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-4 w-4" />
          </span>
        )}
        <span className="truncate">{barbershop || 'Barbearia'}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            {initials(name)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sair"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
