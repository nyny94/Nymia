const CACHE='nymia-v3-4';
const ASSETS=['./','./index.html','./style.css','./v3.css','./app.js','./manifest.webmanifest','./hummingbird.svg','./colibri-round.png','./icon-180.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).catch(()=>caches.match('./index.html')))));
