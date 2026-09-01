import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Sparkles,
  Wallet,
  BarChart3,
  Target,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/cortes', label: 'Cortes', icon: Scissors },
  { href: '/dashboard/servicos', label: 'Serviços', icon: Sparkles },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/dashboard/metas', label: 'Metas', icon: Target },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
];

const MOBILE_HREFS = [
  '/dashboard',
  '/dashboard/agenda',
  '/dashboard/clientes',
  '/dashboard/financeiro',
];

/** Itens que aparecem na barra inferior do celular. */
export const MOBILE_NAV = NAV_ITEMS.filter((item) => MOBILE_HREFS.includes(item.href));
