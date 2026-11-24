// Regras de mesclagem entre aparelhos e da configuração externa.  node tests/teste_regras.js
const R=require("../js/nuvem/regras.js");let ok=0;const bad=[];const t=(n,c,d)=>{c?ok++:bad.push(n+(d!==undefined?" "+JSON.stringify(d):""))};
const P=(o)=>({nome:"x",n:1,nivel:1,xp:0,amizade:0,rar:"raro",...o});
const A={_ts:100,coins:50,comp:25,caught:{25:P({nivel:3,xp:10,amizade:4,n:2}),4:P({nivel:1})},fases:{f1:{viu:true,niveis:{bronze:{ok:true,perfeito:true,vezes:2}}}},stats:{"3x4":{ok:5,err:1}},hist:{"2026-11-20":5},hist2:{"2026-11-20":{ok:4,err:1}},
  tentNivel:{dia:"2026-11-23",c:{"f1|bronze":2}},feitas:{dia:"2026-11-23",n:6},coinsHoje:{dia:"2026-11-23",n:20},cap:{dia:"2026-11-23",n:1,tab:{3:"2026-11-23"}},uso:{a:{dia:"2026-11-23",n:1}},streak:3,last:"2026-11-22",inicio:"2026-11-20",tutorialVisto:false,inv:{pocao:1},cfg:{tempo:60}};
const B={_ts:200,coins:30,comp:7,caught:{25:P({nivel:2,xp:90,amizade:9,n:1}),7:P({nivel:5})},fases:{f1:{viu:true,niveis:{bronze:{ok:false,falhou:true,vezes:1},prata:{ok:true,vezes:1}}},f2:{viu:true}},stats:{"3x4":{ok:3,err:4},"5x5":{ok:1,err:0}},hist:{"2026-11-20":2,"2026-11-21":9},hist2:{"2026-11-21":{ok:1,err:1}},
  tentNivel:{dia:"2026-11-23",c:{"f1|bronze":1,"f1|prata":1}},feitas:{dia:"2026-11-23",n:3},coinsHoje:{dia:"2026-11-23",n:35},cap:{dia:"2026-11-23",n:2,tab:{4:"2026-11-23"}},uso:{a:{dia:"2026-11-22",n:5},b:{dia:"2026-11-23",n:1}},streak:1,last:"2026-11-23",inicio:"2026-11-23",tutorialVisto:true,inv:{},cfg:{tempo:90}};
const M=R.mesclar(A,B),M2=R.mesclar(B,A);
t("união dos Pokémon dos dois aparelhos",[25,4,7].every(i=>M.caught[i]));
t("o Pokémon repetido fica com o maior nível (e o XP desse nível)",M.caught[25].nivel===3&&M.caught[25].xp===10&&M.caught[25].amizade===9&&M.caught[25].n===2);
t("nível concluído nunca é desfeito (ok vence falhou)",M.fases.f1.niveis.bronze.ok===true&&M.fases.f1.niveis.bronze.perfeito===true&&!M.fases.f1.niveis.bronze.falhou&&M.fases.f1.niveis.bronze.vezes===2);
t("níveis e fases de cada lado são mantidos",M.fases.f1.niveis.prata.ok===true&&!!M.fases.f2);
t("estatísticas e histórico: o maior de cada",M.stats["3x4"].ok===5&&M.stats["3x4"].err===4&&M.stats["5x5"].ok===1&&M.hist["2026-11-20"]===5&&M.hist["2026-11-21"]===9&&M.hist2["2026-11-20"].ok===4&&M.hist2["2026-11-21"].ok===1);
t("contadores do dia: maior valor (não dá para burlar o limite trocando de aparelho)",M.tentNivel.c["f1|bronze"]===2&&M.tentNivel.c["f1|prata"]===1&&M.feitas.n===6&&M.coinsHoje.n===35&&M.cap.n===2&&M.cap.tab[3]&&M.cap.tab[4]);
t("uso por item: mesmo dia = maior; dia mais novo vence",M.uso.a.n===1&&M.uso.a.dia==="2026-11-23"&&M.uso.b.n===1);
t("contador de outro dia: vale o dia mais novo",R.mesclar({_ts:1,tentNivel:{dia:"2026-11-22",c:{x:3}},caught:{},fases:{}},{_ts:2,tentNivel:{dia:"2026-11-23",c:{y:1}},caught:{},fases:{}}).tentNivel.c.x===undefined);
t("valores soltos vêm do lado mais recente (moedas, inventário, ajustes, companheiro)",M.coins===30&&M.cfg.tempo===90&&M.comp===7&&JSON.stringify(M.inv)==="{}");
t("ofensiva: vale a do lado com estudo mais recente, inteira",M.streak===1&&M.last==="2026-11-23"&&M.inicio==="2026-11-23");
t("tutorial visto em qualquer lado vale",M.tutorialVisto===true);
t("_ts fica com o maior",M._ts===200);
t("a ordem dos argumentos não muda o conjunto de conquistas",JSON.stringify(Object.keys(M2.caught).sort())===JSON.stringify(Object.keys(M.caught).sort())&&M2.caught[25].nivel===3&&M2.fases.f1.niveis.bronze.ok===true&&M2.coins===30);
t("não altera os originais",A.caught[7]===undefined&&B.caught[4]===undefined&&A.coins===50);
t("idempotente: juntar de novo não muda nada",R.igual(R.mesclar(M,B),M)&&R.igual(R.mesclar(M,M),M)&&R.igual(R.mesclar(M,A),M));
t("comparação ignora a ordem das chaves",R.igual({a:1,b:{c:2,d:3}},{b:{d:3,c:2},a:1})&&!R.igual({a:1},{a:2}));
t("companheiro inexistente é corrigido",(()=>{const x=R.mesclar({_ts:2,comp:99,caught:{25:P()},fases:{}},{_ts:1,caught:{},fases:{}});return x.comp===25})());
t("nuvem vazia/inválida: mantém o local; local inválido: usa a nuvem",R.mesclar(A,null).coins===50&&R.mesclar(null,B).coins===30);
t("formato antigo de fase (ok/vezes na própria fase) é mantido",R.mesclar({_ts:1,fases:{a:{ok:true,vezes:3,perfeita:true}},caught:{}},{_ts:2,fases:{a:{vezes:1}},caught:{}}).fases.a.ok===true);
/* configuração externa */
const c=R.configDaLinha({tempo_desafio:45,questoes_por_fase:10,ano_escolar_liberado:5,tentativas_dia:2,extras:{meta:5,teto:99999,dificuldade:"dificil",hack:1,max:11,moedaAcerto:"3"}});
t("linha da tabela vira ajustes do app",c.tempo===45&&c.questoesPorFase===10&&c.anoEscolar===5&&c.tentativasFaseDia===2&&c.meta===5);
t("extras: limita valores, ignora desconhecidos e tipos errados",c.teto===1000&&c.dificuldade==="dificil"&&c.hack===undefined);
t("tabuadas até: só 10 ou 12",c.max===undefined&&R.configDaLinha({extras:{max:12}}).max===12&&R.configDaLinha({extras:{max:10}}).max===10);
t("texto no lugar de número é ignorado",c.moedaAcerto===undefined);
const est={cfg:{tempo:60,x:1}};t("aplicar muda só o necessário e avisa",R.aplicarConfig(est,{tempo:45})===true&&est.cfg.tempo===45&&est.cfg.x===1&&R.aplicarConfig(est,{tempo:45})===false);
t("linha vazia não mexe em nada",Object.keys(R.configDaLinha(null)).length===0&&R.aplicarConfig({cfg:{}},{})===false);
console.log(`PASSARAM: ${ok}   FALHARAM: ${bad.length}`);if(bad.length)console.log(bad.map(x=>" ✗ "+x).join("\n"));process.exit(bad.length?1:0);
