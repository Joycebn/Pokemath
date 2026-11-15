/* Falas dos Pokémon: lê dados/falas/falas_pokemon_*.txt (corrigidos) e, para quem não tem fala no momento
   (ou não está nos arquivos), usa dados/falas/falas_reserva.txt. Momentos: capturado, companheiro, alimentado,
   evolui, desafio, fome, pokedex. */
const FALAS_MEM={};
let RESERVA_MEM=null;
const FALAS_ARQ=[[1,151,"001_151"],[152,251,"152_251"],[252,386,"252_386"],[387,493,"387_493"],[494,649,"494_649"],[650,721,"650_721"],[722,809,"722_809"],[810,905,"810_905"],[906,1025,"906_1025"]];
const FALAS_FIXAS={capturado:["Que alegria conhecer você!"],companheiro:["Eu gosto de estudar com você!"],alimentado:["Que delícia! Obrigado!"],evolui:["Estou mais forte do que nunca!"],
  desafio:["Vamos lá! Eu acredito em você!"],fome:["Estou com fome! Você tem algo gostoso para mim?"],pokedex:["Olha só, estou na sua Pokédex!"]};
function parsearFalas(txt){
  const m={};let cur=null;
  for(const l of txt.split("\n")){
    const a=l.match(/^(\d+) (.+?) \| (.+?) \| grito:/);if(a){cur=m[+a[1]]={nome:a[2],tipos:a[3],f:{}};continue}
    const b=l.match(/^\s+\[(\w+)\] "(.*)"\s*$/);if(b&&cur)(cur.f[b[1]]=cur.f[b[1]]||[]).push(b[2]);
  }
  return m;
}
function parsearReserva(txt){
  const m={};let mom=null;
  for(const l of txt.split("\n")){const a=l.match(/^\[(\w+)\]\s*$/);if(a){mom=a[1];m[mom]=[];continue}const b=l.match(/^"(.*)"\s*$/);if(b&&mom)m[mom].push(b[1])}
  return m;
}
async function lerTextoFalas(url){try{const r=await fetch(url);if(!r.ok)return"";return await r.text()}catch(_){return""}}
async function falasDe(id){
  const arq=FALAS_ARQ.find(a=>id>=a[0]&&id<=a[1]);if(!arq)return null;
  if(!FALAS_MEM[arq[2]]||!Object.keys(FALAS_MEM[arq[2]]).length)FALAS_MEM[arq[2]]=parsearFalas(await lerTextoFalas(`dados/falas/falas_pokemon_${arq[2]}.txt`));
  return FALAS_MEM[arq[2]][id]||null;
}
async function reservaFalas(){
  if(!RESERVA_MEM||!Object.keys(RESERVA_MEM).length)RESERVA_MEM=parsearReserva(await lerTextoFalas("dados/falas/falas_reserva.txt"));
  return RESERVA_MEM;
}
async function falaPokemon(id,momento,nome){
  const e=await falasDe(id),esp=e&&e.f[momento];
  if(esp&&esp.length)return pick(esp);
  const r=(await reservaFalas())[momento],lista=(r&&r.length)?r:(FALAS_FIXAS[momento]||[]);
  const nm=nome||(e&&e.nome)||(S.caught&&S.caught[id]&&S.caught[id].nome)||"Pokémon";
  return lista.length?pick(lista).replace(/\{nome\}/g,nm):"";
}
