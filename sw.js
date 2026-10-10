// ZaleStudio by ZALESYA — service worker
// Al cambiar archivos, sube el número de versión para forzar la actualización.
const CACHE = 'zalestudio-v17';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // La página: primero internet (para ver siempre la última versión); sin conexión, la guardada
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // Resto (plantillas, iconos…): primero lo guardado; si no está, se descarga y se guarda para usarlo sin conexión
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok && url.origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  })));
});
