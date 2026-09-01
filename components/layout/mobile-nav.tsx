'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LogOut, Scissors } from 'lucide-react';

import { MOBILE_NAV, NAV_ITEMS } from '@/components/layout/nav-items';
import { logoutAction } from '@/app/actions/auth';
import { cn } from '@/lib/utils';

export function MobileTopbar({
  barbershop,
  hasLogo,
  slug,
}: {
  barbershop?: string | null;
  hasLogo?: boolean;
  slug: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2 font-semibold">
          {hasLogo ? (
            <Image
              src={`/b/${slug}/logo`}
              alt=""
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 rounded-md object-cover"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Scissors className="h-4 w-4" />
            </span>
          )}
          <span className="truncate">{barbershop || 'Barbearia'}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 h-full w-64 border-l border-border bg-card p-4 animate-fade-in">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
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
            <form action={logoutAction} className="mt-4 border-t border-border pt-4">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
