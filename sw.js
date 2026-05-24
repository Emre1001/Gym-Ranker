const CACHE_NAME='gym-ranker-v2';
const ASSETS=['./index.html','./icon.png','./manifest.json'];

self.addEventListener('install',e=>{
    e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate',e=>{
    e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
});

self.addEventListener('fetch',e=>{
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});