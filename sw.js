// S'kam : réseau d'abord pour les fichiers de l'app (les mises à jour arrivent tout de suite),
// cache en secours hors ligne. Ressources externes (polices, spécimens) : cache d'abord.
const CACHE='skam-v6';
const FILES=['./','./index.html','./styles.css','./app.js','./store.js','./specimens.js','./procedure.js','./calcul.js','./reference.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const sameOrigin=new URL(req.url).origin===self.location.origin;
  const store=res=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;};
  if(sameOrigin){
    event.respondWith(fetch(req,{cache:'no-cache'}).then(store).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||(req.mode==='navigate'?caches.match('./index.html'):undefined))));
  }else{
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(store)));
  }
});
