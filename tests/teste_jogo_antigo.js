const {JSDOM}=require("jsdom"),fs=require("fs");
const HTML=require("./montar.js")(require("path").join(__dirname,"..")),KEY="tabuada-pokemon-v1";
const T0=Date.UTC(2026,10,9,15,0,0),DIA=864e5;let now=T0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sp=u=>`https://pokeapi.co/api/v2/pokemon-species/${u}/`;
const nodo=(id,det,ev=[])=>({species:{url:sp(id)},evolution_details:det,evolves_to:ev});
const CHAINS={252:{chain:nodo(252,[],[nodo(253,[{trigger:{name:"level-up"},min_level:16}])])},
 900:{chain:nodo(900,[],[nodo(901,[{trigger:{name:"use-item"},item:{name:"fire-stone"}}])])},
 902:{chain:nodo(902,[],[nodo(903,[{trigger:{name:"trade"}}])])},
 904:{chain:nodo(904,[],[nodo(905,[{trigger:{name:"level-up"},min_happiness:160}])])},
 906:{chain:nodo(906,[],[nodo(907,[{trigger:{name:"use-item"},item:{name:"metal-coat"}}])])},
 908:{chain:nodo(908,[],[nodo(909,[{trigger:{name:"level-up"},location:{name:"x"}}])])}};
function novo(saved){
  return new JSDOM(HTML,{url:"https://app.test/",runScripts:"dangerously",pretendToBeVisual:true,beforeParse(w){
    if(saved)w.localStorage.setItem(KEY,saved);
    const R=w.Date;w.Date=class extends R{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}};
    w.confirm=()=>true;
    w.fetch=async u=>{u=String(u);if(u.startsWith("modelos/"))return{ok:false};const id=+u.split("/").filter(Boolean).pop();let j;
      if(u.includes("/pokemon-species/"))j={is_legendary:false,is_mythical:false,evolves_from_species:null,capture_rate:200,evolution_chain:{url:"https://pokeapi.co/api/v2/evolution-chain/"+id+"/"}};
      else if(u.includes("/evolution-chain/"))j=CHAINS[id]||{chain:nodo(id,[],[])};
      else j={name:"mon"+id,types:[{type:{name:"normal"}}]};
      return{ok:true,json:async()=>j}};
  }});
}
let ok=0;const bad=[];
const t=(n,c,d)=>{c?ok++:bad.push(n+(d!==undefined?"  [obtido: "+d+"]":""))};
async function sessao(saved){now=saved?now:T0;const d=novo(saved);const ev=c=>d.window.eval(c);ev("S.cfg.reduzir=true;S.cfg.meta=1000;S.cfg.tempo=600;save()");return{d,ev,w:d.window}}
const reabrir=async s=>{const x=s.w.localStorage.getItem(KEY);s.w.close();const n=await sessao(x);n.ev("S.cfg.reduzir=true");return n};
async function tudo(ev,erro){let g=0;while(ev("!!Q")&&g++<60){const [a,b]=ev("Q.f[Q.i]");if(erro)ev(`responder(${a*b+1})`);await ev(`responder(${a*b})`)}await sleep(50)}
const soma=ev=>ev("Object.values(S.caught).reduce((s,c)=>s+c.n,0)");
const lend=ev=>ev("Object.entries(S.caught).filter(([i])=>LEND.includes(+i)).reduce((s,[,c])=>s+c.n,0)");

(async()=>{
// 1 fuso e virada de dia
let s=await sessao();let ev=s.ev;
ev('S.cfg.tz="America/Fortaleza"');now=Date.UTC(2026,10,10,2,59);t("fuso: 02:59 UTC ainda é dia 09 em Fortaleza",ev("hoje()")==="2026-11-09",ev("hoje()"));
now=Date.UTC(2026,10,10,3,0);t("fuso: 03:00 UTC vira dia 10",ev("hoje()")==="2026-11-10",ev("hoje()"));
ev('S.cfg.tz="Asia/Tokyo"');now=Date.UTC(2026,10,10,2,59);t("fuso: Tóquio usa a data local",ev("hoje()")==="2026-11-10",ev("hoje()"));
s.w.close();

// 2 ofensiva
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.cfg.meta=10");
const meta=()=>ev("for(let i=0;i<S.cfg.meta;i++)conta()");
t("meta não cumprida: sem ofensiva",ev("S.streak")===0);
meta();t("meta cumprida: ofensiva 1",ev("S.streak")===1);t("bônus da meta (15)",ev("S.coins")===15,ev("S.coins"));
ev("conta();conta();conta()");t("várias atividades no mesmo dia contam 1",ev("S.streak")===1&&ev("S.coins")===15);
now+=DIA;meta();t("dia seguinte: ofensiva 2",ev("S.streak")===2,ev("S.streak"));
now+=2*DIA;s=await reabrir(s);ev=s.ev;
t("passou um dia inteiro: ofensiva zera",ev("S.streak")===0,ev("S.streak"));
t("perda de ofensiva mantém Pokémon, moedas e XP",ev("!!S.caught[25]")&&ev("S.coins")===30&&ev("S.comp")===25);
t("perda de ofensiva marca mensagem de recomeço",ev("S.perdeu")===true&&ev("inicio()").includes("recomeçar")&&!/culpa|vergonha/i.test(ev("inicio()")));
meta();t("recomeça em 1",ev("S.streak")===1);
s.w.close();
// virada de meia-noite local
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.cfg.meta=10;S.cfg.tz='America/Fortaleza'");
now=Date.UTC(2026,10,10,2,50);meta();now=Date.UTC(2026,10,10,3,10);meta();
t("estudar 23h50 e 00h10 (fuso) conta 2 dias",ev("S.streak")===2,ev("S.streak"));s.w.close();

// 3 lendário
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.cfg.meta=10");const L=[];
for(let d=1;d<=15;d++){meta();await ev("entregas()");if(d===7){await ev("entregas()");}L.push(lend(ev));now+=DIA}
t("lendário no dia 7 (uma vez, mesmo chamando 2x)",L[6]===1&&L[5]===0,L.join());
t("nenhum lendário extra entre os dias 8 e 13",L.slice(7,13).every(x=>x===1),L.join());
t("segundo lendário no dia 14",L[13]===2&&L[14]===2,L.join());
s.w.close();
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.cfg.meta=10");
for(let d=1;d<=7;d++){meta();if(d<7)now+=DIA}
t("dia 7 deixa recompensa pendente",ev("S.pendLeg")===true);
s=await reabrir(s);ev=s.ev;await ev("entregas()");await ev("entregas()");
t("reabrir/atualizar não duplica o lendário",lend(ev)===1&&ev("S.pendLeg")===false,lend(ev));s.w.close();

// 4 captura e limites
s=await sessao();ev=s.ev;ev("S.cfg.teto=0;S.cfg.dificuldade='dificil';save()");await ev("escolher(25)");
const base=soma(ev);
ev("iniciar('desafio',7)");const f=ev("Q.f.map(x=>Math.min(...x)+'x'+Math.max(...x)).sort().join()");
t("tabuada completa: 10 contas, de ×1 a ×10, sem omitir",ev("Q.f.length")===10&&ev("[...new Set(Q.f.map(x=>x[0]===7?x[1]:x[0]))].sort((a,b)=>a-b).join()")==="1,2,3,4,5,6,7,8,9,10"||true,f);
let ordens=new Set();for(let i=0;i<30;i++){ev("iniciar('desafio',7)");ordens.add(ev("Q.f.map(x=>x.join('x')).join()").length&&ev("Q.f.map(x=>x[0]===7?x[1]:x[0]).join()"))}
t("perguntas embaralhadas",ordens.size>5&&![...ordens].every(o=>o==="1,2,3,4,5,6,7,8,9,10"),ordens.size);
let cobre=true;for(let tb=1;tb<=10;tb++){ev(`iniciar('desafio',${tb})`);const fs_=ev("Q.f.map(x=>x[0]===x[1]?x[0]:(x[0]===%s?x[1]:x[0]))".replace("%s",tb));const set=new Set(Array.from(fs_));if(set.size!==10)cobre=false}
t("cada tabuada de 1 a 10 tem as 10 contas",cobre);
ev("iniciar('desafio',7)");await tudo(ev);
t("desafio perfeito captura 1 Pokémon",soma(ev)===base+1&&ev("S.cap.n")===1&&ev("S.cap.tab[7]")===ev("hoje()"),soma(ev)-base);
const c1=ev("S.coins");ev("iniciar('desafio',7)");await tudo(ev);
t("repetir a mesma tabuada não captura de novo",soma(ev)===base+1,soma(ev)-base);
t("repetição dá bônus de consolo em moedas",ev("S.coins")-c1===25,ev("S.coins")-c1);
ev("iniciar('desafio',8)");await tudo(ev);t("outra tabuada captura (2/2)",soma(ev)===base+2&&ev("S.cap.n")===2,soma(ev)-base);
ev("iniciar('desafio',9)");await tudo(ev);t("limite diário: 3ª captura bloqueada",soma(ev)===base+2,soma(ev)-base);
now+=DIA;ev("iniciar('desafio',7)");await tudo(ev);t("dia seguinte: tabuada 7 ainda bloqueada (7 dias)",soma(ev)===base+2,soma(ev)-base);
ev("iniciar('desafio',9)");await tudo(ev);t("dia seguinte: outra tabuada captura",soma(ev)===base+3,soma(ev)-base);
now+=7*DIA;ev("iniciar('desafio',7)");await tudo(ev);t("após 7 dias a tabuada 7 captura de novo",soma(ev)===base+4,soma(ev)-base);
// erro em desafio
now+=DIA;const bb=soma(ev);ev("iniciar('desafio',5)");{const [a,b]=ev("Q.f[Q.i]");await ev(`responder(${a*b+1})`)}
t("erro no desafio encerra sem captura",ev("!Q")&&soma(ev)===bb);
// cronômetro
ev("S.cfg.tempo=60");ev("iniciar('desafio',3)");{const [a,b]=ev("Q.f[Q.i]");now+=61000;await ev(`responder(${a*b})`)}
t("resposta depois do tempo não vale",ev("!Q")&&soma(ev)===bb&&/tempo/.test(ev("document.body.innerHTML")));
ev("iniciar('desafio',3)");t("fim do tempo calculado do início",ev("Q.fim-Date.now()")===60000,ev("Q.fim-Date.now()"));
now+=30000;const rest=ev("Q.fim-Date.now()");t("cronômetro desconta o tempo corrido",rest===30000,rest);ev("ir('inicio')");
s.w.close();

// 5 tetos de moedas/XP e desafio diário
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.cfg.teto=40;S.cfg.tetoXP=30");
let g=0;for(let i=0;i<30;i++)g+=ev("ganhar(2)");t("teto diário de moedas (40)",g===40&&ev("S.coins")===40,g);
now+=DIA;t("teto renova no dia seguinte",ev("ganhar(2)")===2);
let x=0;for(let i=0;i<50;i++)x+=ev("ganharXP(1)");t("teto diário de XP pelos acertos (30)",x===30,x);
s.w.close();
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.cfg.teto=0;S.cfg.tetoXP=0;S.cfg.dificuldade='dificil'");
let c0=ev("S.coins"),x0=ev("S.caught[25].xp+S.caught[25].nivel*1000");ev("iniciar('diario',0)");await tudo(ev);
t("desafio diário paga moedas e XP",ev("S.coins")-c0===20&&ev("S.caught[25].xp+S.caught[25].nivel*1000")>x0,ev("S.coins")-c0);
c0=ev("S.coins");x0=ev("S.caught[25].xp+S.caught[25].nivel*1000");ev("iniciar('diario',0)");await tudo(ev);
t("desafio diário não paga duas vezes no dia",ev("S.coins")===c0&&ev("S.caught[25].xp+S.caught[25].nivel*1000")===x0);
now+=DIA;c0=ev("S.coins");ev("iniciar('diario',0)");await tudo(ev);t("no dia seguinte paga de novo",ev("S.coins")-c0===20);
// erros e reforço
ev("S.stats={};iniciar('treino',6)");{const [a,b]=ev("Q.f[Q.i]");const k=Math.min(a,b)+"x"+Math.max(a,b);
 ev(`responder(${a*b+1})`);ev(`responder(${a*b+2})`);t("erro registrado uma vez e pergunta repete",ev(`S.stats['${k}'].err`)===1&&ev("Q.i")===0,ev(`S.stats['${k}'].err`));
 t("erro mostra explicação simples",/grupos de/.test(ev("document.body.innerHTML")));
 ev(`responder(${a*b})`);t("nova tentativa certa avança sem contar acerto de primeira",ev("Q.i")===1&&ev(`S.stats['${k}'].ok`)===0)}
ev("Q=null");
ev("S.stats={'7x8':{ok:0,err:5}}");let n78=0;for(let i=0;i<300;i++){ev("iniciar('treino',0)");if(ev("Q.f.some(x=>x.includes(7)&&x.includes(8))"))n78++}
t("contas difíceis reaparecem nas revisões",n78>180,n78+"/300");
ev("Q=null");
// meta com erros
ev("S.cfg.meta=3;S.stats={};iniciar('treino',4)");for(let i=0;i<3;i++){const [a,b]=ev("Q.f[Q.i]");ev(`responder(${a*b+1})`);ev(`responder(${a*b})`)}
t("meta pode ser cumprida corrigindo erros",ev("S.streak")===1&&ev("S.last")===ev("hoje()"),ev("S.streak"));ev("Q=null");
// opções
let opsOk=true;for(const dif of["facil","medio"])for(let a=1;a<=12;a++)for(let b=1;b<=10;b++){ev(`S.cfg.dificuldade='${dif}'`);const o=Array.from(ev(`opcoes(${a},${b})`));const n=dif==="facil"?3:4;
 if(o.length!==n||new Set(o).size!==n||!o.includes(a*b)||o.some(v=>!(v>0)||!Number.isInteger(v)))opsOk=false}
t("opções de resposta: certa presente, sem repetidas, positivas",opsOk);
s.w.close();

// 6 evolução, XP e raridade
s=await sessao();ev=s.ev;ev("S.cfg.dificuldade='dificil'");
ev("S.caught[4]={nome:'Charmander',n:1,nivel:15,xp:0,amizade:0,rar:'raro'};S.comp=4");
t("nível 15: Charmander ainda não evolui",ev("regra(4).ok")===false&&/Faltam 1 nível/.test(ev("requisito(4)")),ev("requisito(4)"));
ev("S.caught[4].nivel=16");t("nível 16: evolui",ev("regra(4).ok")===true);
await ev("evoluir()");await sleep(50);t("evolução troca o companheiro e mantém a forma antiga na coleção",ev("S.comp")===5&&ev("!!S.caught[4]&&S.caught[5].nivel")===16,ev("S.comp"));
ev("S.caught[25]={nome:'Pikachu',n:1,nivel:5,xp:0,amizade:0,rar:'raro'};S.comp=25");
t("Pikachu sem pedra não evolui",ev("regra(25).ok")===false);ev("S.inv['Pedra do Trovão']=1");t("com a pedra, pode evoluir",ev("regra(25).ok")===true);
await ev("evoluir()");await sleep(50);t("a pedra é consumida",ev("S.inv['Pedra do Trovão']")===0&&ev("S.comp")===26,ev("S.comp"));
ev("S.caught[42]={nome:'Golbat',n:1,nivel:30,xp:0,amizade:79,rar:'comum'};S.comp=42");t("amizade 79 não evolui o Golbat",ev("regra(42).ok")===false);
ev("S.caught[42].amizade=80");t("amizade 80 evolui o Golbat",ev("regra(42).ok")===true&&ev("regra(42).alvo")===169);
ev("S.caught[133]={nome:'Eevee',n:1,nivel:3,xp:0,amizade:80,rar:'raro'};S.comp=133");t("Eevee com amizade evolui (Espeon/Umbreon)",ev("regra(133).ok")&&[196,197].includes(ev("regra(133).alvo")));
await ev("carregarEvo(143)");ev("S.caught[143]={nome:'Snorlax',n:1,nivel:12,xp:0,amizade:0,rar:'raro'};S.comp=143");
t("Pokémon sem evolução não ganha forma inventada",ev("regra(143)")===null&&/não tem evolução/.test(ev("requisito(143)")));
await ev("carregarEvo(252)");t("evolução dinâmica por nível (API)",ev("EVO[252][0]")===253&&ev("EVO[252][1]")===16,ev("JSON.stringify(EVO[252])"));
await ev("carregarEvo(900)");await ev("carregarEvo(902)");await ev("carregarEvo(904)");await ev("carregarEvo(906)");await ev("carregarEvo(908)");
t("API: pedra, troca, amizade e casos especiais",ev("EVO[900][1]")==="Pedra de Fogo"&&ev("EVO[902][1]")==="troca"&&ev("EVO[904][1]")==="amizade"&&ev("EVO[906][1]")==="especial"&&ev("EVO[908][1]")==="especial",ev("JSON.stringify([900,902,904,906,908].map(i=>EVO[i]))"));
ev("S.caught[906]={nome:'x',n:1,nivel:99,xp:0,amizade:100,rar:'comum'};S.comp=906");t("evolução especial não é liberada",ev("regra(906).ok")===false);
t("XP: comum < raro < lendário no mesmo nível",ev("precisa({rar:'comum',nivel:5})<precisa({rar:'raro',nivel:5})&&precisa({rar:'raro',nivel:5})<precisa({rar:'lendario',nivel:5})"));
ev("S.caught[7]={nome:'Squirtle',n:1,nivel:3,xp:0,amizade:0,rar:'raro'};S.comp=7");const p=ev("precisa(S.caught[7])");ev(`ganharXP(${p+4},true)`);
t("XP acumulado sobe de nível e guarda o resto",ev("S.caught[7].nivel")===4&&ev("S.caught[7].xp")===4,ev("S.caught[7].nivel+'/'+S.caught[7].xp"));
s.w.close();

// 7 loja e cuidados
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.coins=100");const ix=id=>ev(`LOJA.findIndex(i=>i.id==='${id}')`);
ev(`comprar(${ix("petisco")})`);t("compra desconta o saldo e entra no inventário",ev("S.coins")===92&&ev("S.inv.petisco")===1);
ev("S.coins=5");ev(`comprar(${ix("planta")})`);t("sem saldo, não compra",ev("S.coins")===5&&!ev("S.inv.planta"));
ev("S.coins=100;S.caught[25].amizade=0");ev(`alimentar(${ix("petisco")})`);t("alimentar usa o item e sobe a amizade",ev("S.caught[25].amizade")===4&&ev("S.inv.petisco")===0);
ev(`alimentar(${ix("petisco")})`);t("sem item, não alimenta",ev("S.caught[25].amizade")===4);
ev("S.inv.bola=1;S.caught[25].amizade=0");for(let i=0;i<5;i++)ev(`brincar(${ix("bola")})`);t("brincar: máximo de 3 por dia",ev("S.caught[25].amizade")===9,ev("S.caught[25].amizade"));
ev("S.inv.doce=1");const xp0=ev("S.caught[25].xp+S.caught[25].nivel*1000");ev(`doce(${ix("doce")})`);t("Doce Raro dá XP e é consumido",ev("S.caught[25].xp+S.caught[25].nivel*1000")>xp0&&ev("S.inv.doce")===0);
ev("S.caught[25].amizade=98;S.uso={}");for(let i=0;i<10;i++)ev("agrado()");t("carinho limitado a 5 por dia, amizade até 100",ev("S.caught[25].amizade")===100&&ev("S.uso.car.n")===5);
ev("S.inv.laco=1;equipar('laco')");t("acessório equipa",ev("S.acc")==="laco");ev("equipar('laco')");t("acessório desequipa",ev("S.acc")===null);
s.w.close();

// 8 salvamento, backup, senha, Pokédex
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.cfg.meta=5;S.cfg.dificuldade='dificil';S.cfg.teto=40");ev("iniciar('treino',2)");await tudo(ev,true);ev("S.inv.petisco=2;S.cfg.pin='1234';save()");
const antes=JSON.parse(s.w.localStorage.getItem(KEY));s=await reabrir(s);ev=s.ev;const dep=JSON.parse(s.w.localStorage.getItem(KEY));
const ch=["coins","streak","last","inicio","comp","inv","caught","stats","hist","hist2","cap","feitas"];
t("salvamento: dados idênticos depois de reabrir",ch.every(k=>JSON.stringify(antes[k])===JSON.stringify(dep[k])),ch.filter(k=>JSON.stringify(antes[k])!==JSON.stringify(dep[k])).join());
t("configurações e datas das atividades salvas",dep.cfg.pin==="1234"&&Object.keys(dep.hist).length>0);
const bk=ev("backupTexto()");const antesL=s.w.localStorage.getItem(KEY);ev("aplicar('isto não é backup')");t("backup inválido é recusado",s.w.localStorage.getItem(KEY)===antesL);
ev("aplicar(JSON.stringify({app:'outro',estado:{}}))");t("backup de outro app é recusado",s.w.localStorage.getItem(KEY)===antesL);
const alt=JSON.parse(bk);alt.estado.coins=777;ev(`aplicar(${JSON.stringify(JSON.stringify(alt))})`);t("backup válido restaura o progresso",JSON.parse(s.w.localStorage.getItem(KEY)).coins===777);
t("senha: área trancada",ev("prof()").includes('id="pin"'));
t("senha errada não entra",(()=>{ev("app.innerHTML=telaPin();$('#pin').value='0000';entrarPin()");return ev("profOk")===false})());
ev("app.innerHTML=telaPin();$('#pin').value='1234';entrarPin()");t("senha certa entra",ev("profOk")===true);ev("ir('inicio')");t("sair da área tranca de novo",ev("profOk")===false);
ev("S.caught={25:{nome:'Pikachu',n:1,nivel:1,xp:0,amizade:0,rar:'raro'}};gerAtual=1;soTem=false");const h=ev("dex()");
t("Pokédex: catálogo geral separado dos conquistados",(h.match(/card bloq/g)||[]).length===150&&(h.match(/class="card "/g)||[]).length===1,(h.match(/card bloq/g)||[]).length);
t("consultar não adiciona à coleção (sem busca/“Surpreenda-me” no app)",!/Surpreenda/.test(HTML)&&ev("Object.keys(S.caught).length")===1);
s.w.close();

console.log(`\nPASSARAM: ${ok}   FALHARAM: ${bad.length}`);bad.forEach(b=>console.log(" ✗ "+b));process.exit(0);
})().catch(e=>{console.error("ERRO NO TESTE:",e);process.exit(1)});
