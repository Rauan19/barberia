/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // A logo ja chega reduzida pelo navegador; a folga cobre envios fora do fluxo.
    serverActions: { bodySizeLimit: '8mb' },
  },
};

export default nextConfig;
