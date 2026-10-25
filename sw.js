const CACHE='gym-ranker-v4.0.0';
const ASSETS=[
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon.png',
  './icon-192.png',
  './icon-maskable.png',
  './apple-touch-icon.png',
  './css/app.css',
  './css/features.css',
  './js/app.js',
  './js/back-stack.js',
  './js/core.js',
  './js/data/body-svg.js',
  './js/data/calisthenics.js',
  './js/data/exercises.js',
  './js/data/foods.js',
  './js/data/skills.js',
  './js/data/tips.js',
  './js/game.js',
  './js/health.js',
  './js/i18n/de.js',
  './js/i18n/en.js',
  './js/i18n/tr.js',
  './js/onboarding.js',
  './js/pages/body.js',
  './js/pages/food.js',
  './js/pages/history.js',
  './js/pages/library.js',
  './js/pages/profile.js',
  './js/pages/progress.js',
  './js/pages/settings.js',
  './js/pages/train.js',
  './js/tools.js',
  './js/ui.js'
];

self.addEventListener('install',e=>{
  // reload: never fill the new cache from the browser's HTTP cache
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

// HTML: network first so updates arrive immediately, cache as offline fallback.
// Everything else: cache first (the cache name changes with every release).
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res}).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req)));
});
