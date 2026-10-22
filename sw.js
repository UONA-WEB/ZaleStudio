// ZaleStudio by ZALESYA — service worker
// Al cambiar archivos, sube el número de versión para forzar la actualización.
const CACHE = 'zalestudio-pruebas-v52';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const SB_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@';

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
  // Cuenta y pagos (/api/) y Supabase: siempre por internet, nunca de la caché
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;
  if (url.origin !== location.origin && !e.request.url.startsWith(SB_CDN)) return;
  // La página: primero internet (para ver siempre la última versión); sin conexión, la guardada
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // Resto (plantillas, iconos, librería de cuentas…): primero lo guardado; si no está, se descarga y se guarda
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  })));
});
