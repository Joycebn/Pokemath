const V="pokemath-v1",BASE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","css/legado.css","css/novo.css",
"js/conteudo/matriz.js","js/conteudo/ano3.js","js/motor/geradores.js","js/motor/explicacao.js","js/motor/trilha.js","js/legado/jogo.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  if(r.mode==="navigate"){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put("index.html",c));return res}).catch(()=>caches.match("index.html")));return}
  const mesma=new URL(r.url).origin===location.origin;
  if(mesma){ // arquivos do app: rede primeiro (sempre a versão nova), cache se estiver sem internet
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r)));return}
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque")){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>hit)));
});
