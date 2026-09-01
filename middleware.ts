import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'bb_session';

/**
 * Guarda leve: apenas checa a presenca do cookie para evitar um flash da area
 * logada. A validacao real da assinatura acontece no servidor, em requireSession().
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  if (!hasCookie && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (hasCookie && (pathname === '/login' || pathname === '/cadastro')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/cadastro'],
};
