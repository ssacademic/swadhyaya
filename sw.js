// Offline support: serve from cache instantly, refresh the cache in the background.
// Bump VERSION when you change app files so old caches are cleared.
const VERSION = 'svadhyay-v7';
const SHELL = ['./', 'index.html', 'book.js', 'app.js', 'style.css', 'icon.svg', 'manifest.webmanifest', 'books/books.json', 'books/themes.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
