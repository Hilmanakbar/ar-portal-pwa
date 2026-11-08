// ============================================================
// AR Portal PWA — Service Worker
// Cache-first strategy for app shell, network fallback for data
// ============================================================

const CACHE_NAME = 'ar-portal-v1';

// App shell files to pre-cache on install
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/storage.js',
  '/js/app.js',
  '/admin/index.html',
  '/admin/upload.html',
  '/admin/portals.html',
  '/user/index.html',
  '/user/portal-view.html',
  '/manifest.json',
];

// CDN resources to cache on first use
const CDN_PATTERNS = [
  'cdn.jsdelivr.net/npm/three',
];

// ── INSTALL ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        // If some files fail (e.g. during local dev), continue anyway
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests that are not CDN (e.g. analytics)
  if (url.origin !== self.location.origin) {
    // Allow CDN (Three.js)
    const isCDN = CDN_PATTERNS.some(p => request.url.includes(p));
    if (!isCDN) return;
  }

  // Determine strategy
  if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request));
  } else if (isHTMLPage(url)) {
    // Network-first for HTML pages (get updates)
    event.respondWith(networkFirst(request));
  } else {
    // Cache-first with network fallback for everything else
    event.respondWith(cacheFirst(request));
  }
});

// ── STRATEGIES ────────────────────────────────────────────

/**
 * Cache-first: serve from cache; fetch and cache on miss
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return offline fallback for HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      return offlineFallback();
    }
    throw err;
  }
}

/**
 * Network-first: try network; fall back to cache on failure
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return offlineFallback();
  }
}

/**
 * Simple offline fallback page
 */
function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Offline — AR Portal</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #0f0f1a;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
      padding: 24px;
    }
    h1 { font-size: 1.5rem; margin-bottom: 12px; }
    p  { color: #94a3b8; margin-bottom: 24px; }
    a  {
      display: inline-block;
      padding: 10px 24px;
      background: #6366f1;
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div style="font-size:4rem; margin-bottom:16px;">📡</div>
  <h1>Tidak Ada Koneksi</h1>
  <p>AR Portal memerlukan koneksi internet untuk pertama kali.<br>
     Setelah dimuat, app bekerja offline.</p>
  <a href="/">🔄 Coba Lagi</a>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

// ── HELPERS ───────────────────────────────────────────────
function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')  ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.json') ||
    url.hostname.includes('cdn.jsdelivr.net')
  );
}

function isHTMLPage(url) {
  return (
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    !url.pathname.includes('.')
  );
}
