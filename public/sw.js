const CACHE_VERSION = 'v2';
const STATIC_CACHE = `voyage-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `voyage-dynamic-${CACHE_VERSION}`;
const FONT_CACHE = `voyage-fonts-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then(names =>
        Promise.all(
          names
            .filter(name => !validCaches.includes(name))
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-HTTP requests (chrome-extension, etc.)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Google Fonts → stale-while-revalidate (font files rarely change)
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // Next.js static chunk assets → cache-first (content-hashed, safe to cache forever)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Next.js image optimization endpoint → network-first
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // API routes → network-first (always try fresh data, cache as fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // HTML navigation → network-first, fall back to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then(r => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Static assets (images, icons, fonts from /public) → cache-first
  const isStaticAsset = /\.(png|jpg|jpeg|svg|webp|avif|gif|ico|woff2?|ttf|otf)$/.test(url.pathname);
  if (isStaticAsset) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ── Caching Strategies ─────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Network error', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise;
}
