/* Service worker do PWA da Barbearia.
   Estratégia: cache-first para estáticos, network-first para navegação.
   Requisições que não são GET (Server Actions) passam direto. */

const CACHE = 'barbearia-v1';
const OFFLINE_URL = '/offline';

/* Em desenvolvimento o Next reaproveita as mesmas URLs de chunk a cada recarga,
   entao guardar em cache serviria arquivo velho e quebraria o hot reload.
   O service worker continua registrado (o Chrome so oferece instalar o app
   quando existe um), mas nao guarda nada. */
const IS_DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL])).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nunca cacheia dados de sessão ou respostas de ação.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      }),
    );
    return;
  }

  if (IS_DEV) return;

  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname);

  if (!isStatic) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
