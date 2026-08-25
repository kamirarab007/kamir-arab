// Kamir Arab — Service Worker
// Versi cache dinaikkan setiap kali app shell (index.html/manifest/icon) diperbarui,
// supaya HP mengambil salinan baru alih-alih memakai cache lama.
const CACHE_NAME = 'kamir-arab-v1.3';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './logo-header.png',
];

// Saat install: simpan app shell ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

// Saat activate: bersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategi: cache-first untuk file lokal (app shell), network passthrough untuk yang lain (mis. Google Fonts)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Hanya tangani request GET dari origin sendiri (file lokal aplikasi)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return; // biarkan browser menangani seperti biasa (mis. font dari Google)
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => cached);
    })
  );
});
