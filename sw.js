const V="pokemath-v8",BASE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","css/legado.css","css/novo.css",
"js/conteudo/matriz.js","js/conteudo/ano3.js","js/motor/geradores.js","js/motor/explicacao.js","js/pokemon/falas.js","js/pokemon/pyri.js","js/motor/trilha.js","js/legado/jogo.js",
"js/nuvem/config.js","js/nuvem/regras.js","js/nuvem/cliente.js","js/nuvem/inicio.js","js/nuvem/sincronia.js","js/nuvem/avatares.js","entrar.html","responsavel.html","css/nuvem.css","js/nuvem/entrar.js","js/nuvem/responsavel.js","dados/consentimento_v1.txt","dados/consentimento_teste.txt","dados/consentimento_v3.txt"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.allSettled(BASE.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  if(new URL(r.url).hostname.endsWith("supabase.co"))return;   // dados da nuvem: sempre direto da rede, nunca do cache
  if(r.mode==="navigate"){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r).then(h=>h||caches.match(new URL(r.url).pathname.split("/").pop()||"index.html")).then(h=>h||caches.match("index.html"))));return}
  const mesma=new URL(r.url).origin===location.origin;
  if(mesma){ // arquivos do app: rede primeiro (sempre a versão nova), cache se estiver sem internet
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r)));return}
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque")){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>hit)));
});
