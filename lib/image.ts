/**
 * Redimensionamento de imagem no navegador.
 *
 * A logo aparece em no maximo 88 pixels na tela, entao nao faz sentido guardar
 * a foto original de 8 MB no banco. Reduzimos antes de enviar: o barbeiro joga
 * qualquer arquivo e nunca esbarra em limite.
 */

const MAX_SIDE = 512;
const OUTPUT_QUALITY = 0.92;

export type ResizeResult = {
  file: File;
  previewUrl: string;
  originalBytes: number;
  finalBytes: number;
  /** Falso quando o arquivo foi enviado como veio (SVG ou formato que o navegador nao decodifica). */
  resized: boolean;
};

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não consegui abrir essa imagem.'));
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, OUTPUT_QUALITY),
  );
}

/** Escolhe o melhor formato que o navegador consegue gerar. */
async function encode(canvas: HTMLCanvasElement) {
  const webp = await toBlob(canvas, 'image/webp');
  if (webp && webp.type === 'image/webp') return webp;

  const png = await toBlob(canvas, 'image/png');
  if (png) return png;

  throw new Error('Não consegui converter essa imagem.');
}

/**
 * Reduz a imagem para caber em MAX_SIDE, mantendo a proporcao.
 * SVG passa direto, ja que e vetorial e minusculo.
 */
export async function prepareLogo(input: File): Promise<ResizeResult> {
  if (input.type === 'image/svg+xml') {
    return {
      file: input,
      previewUrl: URL.createObjectURL(input),
      originalBytes: input.size,
      finalBytes: input.size,
      resized: false,
    };
  }

  const sourceUrl = URL.createObjectURL(input);

  try {
    const image = await loadImage(sourceUrl);
    const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não consegui processar essa imagem.');

    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);

    const blob = await encode(canvas);
    const extension = blob.type === 'image/webp' ? 'webp' : 'png';
    const file = new File([blob], `logo.${extension}`, { type: blob.type });

    return {
      file,
      previewUrl: URL.createObjectURL(blob),
      originalBytes: input.size,
      finalBytes: file.size,
      resized: true,
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
