const CACHE_NAME = 'lab-listrik-v2';

// Daftar semua file yang menyusun aplikasi Anda
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './src/components/ComponentDefs.js',
  './src/HistoryManager.js',
  './src/state/CircuitStore.js',
  './src/engine/SimulationEngine.js',
  './src/UI/UIManager.js'
];

// 1. INSTALASI: Menyimpan file ke memori (Cache)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Membuka cache dan menyimpan file...');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Paksa service worker baru untuk langsung aktif
});

// 2. AKTIVASI: Menghapus memori (Cache) versi lama jika ada pembaruan
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache versi lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ambil alih kontrol halaman seketika
});

// 3. FETCH: Mencegat permintaan internet, berikan file dari Cache jika sedang offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika file ada di cache, berikan. Jika tidak, ambil dari internet.
        return response || fetch(event.request);
      })
  );
});
