'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MOBILE_NAV } from '@/components/layout/nav-items';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {MOBILE_NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:bg-accent/60',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'stroke-[2.4]')} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
