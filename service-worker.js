const CACHE = 'nymia-v3-14';
const ASSETS = ['./', './index.html', './style.css', './v3.css', './app.js', './manifest.webmanifest', './hummingbird.svg', './colibri-round.png', './icon-180.png', './icon-512.png'];

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));

self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));

// Réseau d'abord pour les fichiers de l'application (HTML/JS/CSS) : garantit que les mises à
// jour du code sont bien reçues, avec le cache comme secours si hors connexion.
// Cache d'abord pour les autres ressources statiques (icônes, images) qui changent rarement.
const APP_FILE_NAMES = ['index.html', 'app.js', 'style.css', 'v3.css'];

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const fileName = url.pathname.split('/').pop() || 'index.html';
  const isAppFile = event.request.mode === 'navigate' || APP_FILE_NAMES.includes(fileName);

  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
