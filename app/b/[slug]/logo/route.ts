import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

/** Serve a logo guardada no banco. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    select: { logoData: true, logoMime: true, updatedAt: true },
  });

  if (!user?.logoData || !user.logoMime) {
    return new NextResponse('Sem logo', { status: 404 });
  }

  return new NextResponse(new Uint8Array(user.logoData), {
    headers: {
      'Content-Type': user.logoMime,
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
      ETag: `"${user.updatedAt.getTime()}"`,
    },
  });
}
