// Offline support: serve from cache instantly, refresh the cache in the background.
// Bump VERSION when you change app files so old caches are cleared.
const VERSION = 'svadhyay-v22';
// book texts live in their own cache, so an app update doesn't wipe books already saved for offline reading
const BOOKS = 'svadhyay-books';
const SHELL = ['./', 'index.html', 'book.js', 'app.js', 'style.css', 'icon.svg', 'icon-192.png', 'manifest.webmanifest', 'books/books.json', 'books/themes.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== BOOKS).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isBook = /\/books\/[^/]+\.md$/.test(new URL(e.request.url).pathname);
  e.respondWith(caches.open(isBook ? BOOKS : VERSION).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: e.request.mode === 'navigate' });
    const net = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; })
      .catch(() => hit || (e.request.mode === 'navigate' ? cache.match('index.html') : Response.error()));
    return hit || net;
  }));
});
