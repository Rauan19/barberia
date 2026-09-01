import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

const SIZES: Record<string, { size: number; padding: number }> = {
  '192': { size: 192, padding: 0 },
  '512': { size: 512, padding: 0 },
  maskable: { size: 512, padding: 96 },
};

/** Icone do PWA gerado no build: tesoura branca sobre o azul da marca. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: key } = await params;
  const config = SIZES[key] ?? SIZES['512'];
  const glyph = config.size - config.padding * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1d4ed8',
        }}
      >
        <svg
          width={glyph * 0.56}
          height={glyph * 0.56}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6" r="3" />
          <path d="M8.12 8.12 12 12" />
          <path d="M20 4 8.12 15.88" />
          <circle cx="6" cy="18" r="3" />
          <path d="M14.8 14.8 20 20" />
        </svg>
      </div>
    ),
    { width: config.size, height: config.size },
  );
}

export function generateStaticParams() {
  return [{ size: '192' }, { size: '512' }, { size: 'maskable' }];
}
