/* Retur Marfă – service worker: instalare ca aplicație + cache pentru încărcare rapidă/offline.
   index.html: rețea mai întâi (ca să prindă actualizările), cache dacă nu e net.
   restul (SDK Firebase, SheetJS, clipuri audio, iconițe): cache mai întâi, se completează din rețea. */
const VER='rv-2026-11-06f';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Firestore / Auth / Google APIs: niciodată din cache (sunt streaming / autentificate)
  if(/firestore\.googleapis\.com|identitytoolkit|securetoken|googleapis\.com\/.*(auth|token)/.test(url.href))return;
  const isNav=req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/')||url.pathname.endsWith('/manifest.json');
  if(isNav){ // rețea mai întâi
    e.respondWith(fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(VER).then(c=>c.put(req,cp));}return r;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
    return;}
  // cache mai întâi (clipuri audio, SDK-uri, iconițe), completat din rețea
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok&&(url.origin===location.origin||/gstatic\.com|cdnjs\.cloudflare\.com/.test(url.host))){const cp=r.clone();caches.open(VER).then(c=>c.put(req,cp));}return r;})));
});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting();});
