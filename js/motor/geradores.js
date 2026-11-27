/* Geradores de questões. Quatro tipos misturados em todas as fases (principalmente nas somas):
   - escolha  (selecionar): escolher entre alternativas
   - digitar  (escrever a resposta)
   - lacuna   (completar): “23 + ___ = 35”
   - relacionar (ligar pares): ligar cada conta ao seu resultado
   Dificuldade: 1 = Bronze e Prata, 3 = Ouro. A dica só aparece no nível Bronze.
   Elevação (“vai um”) e empréstimo usam SEMPRE contas de dois algarismos em cima e embaixo (como 15 + 8 e 32 − 15). */
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function opcoesNum(c,similares){
  const s=new Set([c]),cand=embaralhar([...(similares||[]),c+1,c-1,c+10,c-10,c+2,c-2,c*2]);
  for(const x of cand){if(s.size>=4)break;if(Number.isInteger(x)&&x>=0&&x!==c)s.add(x)}
  let k=3;while(s.size<4)s.add(c+k++);
  return embaralhar([...s]);
}
const unid=n=>n%10,dez=n=>Math.floor(n/10)%10,cen=n=>Math.floor(n/100)%10;
const TIPOS_Q=["digitar","escolha","lacuna","relacionar"];
const ROTULO_Q={digitar:"✏️ Escrever a resposta",escolha:"👆 Escolher",lacuna:"🧩 Completar",relacionar:"🔗 Ligar os pares"};

/* especificações das contas: a op b = r */
const SPEC={
  adicao(d){
    let a,b;
    if(d>=3){do{a=rnd(111,888);b=rnd(111,888)}while(unid(a)+unid(b)>9||dez(a)+dez(b)>9||cen(a)+cen(b)>9)}
    else{do{a=rnd(11,89);b=rnd(11,89)}while(unid(a)+unid(b)>9||dez(a)+dez(b)>9)}
    const partes=[`unidades: ${unid(a)} + ${unid(b)} = ${unid(a)+unid(b)}`,`dezenas: ${dez(a)} + ${dez(b)} = ${dez(a)+dez(b)}`];
    if(d>=3)partes.push(`centenas: ${cen(a)} + ${cen(b)} = ${cen(a)+cen(b)}`);
    return{a,b,op:"+",r:a+b,visual:{tipo:"conta",op:"+",a,b},dica:"Some coluna por coluna, começando pelas unidades (à direita).",erro:`Some coluna por coluna — ${partes.join("; ")}. Resultado: ${a+b}.`};
  },
  adicaoVaiUm(d){
    let a,b;
    if(d>=3){do{a=rnd(31,89);b=rnd(31,89)}while(unid(a)+unid(b)<10||dez(a)+dez(b)+1<10)}      // Ouro: o “vai um” também passa de 9 nas dezenas
    else{do{a=rnd(11,89);b=rnd(11,89)}while(unid(a)+unid(b)<10||dez(a)+dez(b)+1>9)}
    const u=unid(a)+unid(b),t=dez(a)+dez(b)+1;
    return{a,b,op:"+",r:a+b,visual:{tipo:"conta",op:"+",a,b},dica:"Passou de 9? Escreva a unidade e eleve a dezena (o “vai um”) para a coluna ao lado.",
      erro:`Unidades: ${unid(a)} + ${unid(b)} = ${u}. Escreva ${u%10} e eleve o 1. Dezenas: ${dez(a)} + ${dez(b)} + 1 que veio = ${t}${t>9?". Escreva "+(t%10)+" e eleve o 1 para as centenas":""}. Resultado: ${a+b}.`};
  },
  subtracao(d){
    let a,b;
    if(d>=3){do{a=rnd(60,99);b=rnd(21,89)}while(b>=a||unid(a)>=unid(b)||dez(a)-1<dez(b))}
    else{do{a=rnd(21,99);b=rnd(11,98)}while(b>=a||unid(a)>=unid(b)||dez(a)-1<dez(b))}
    return{a,b,op:"−",r:a-b,visual:{tipo:"conta",op:"-",a,b},dica:"Se o número de cima for menor, pegue 1 dezena emprestada: ela vira 10 unidades e você soma ao número de cima.",
      erro:`Unidades: ${unid(a)} é menor que ${unid(b)}. Pegue 1 dezena emprestada: ${10+unid(a)} − ${unid(b)} = ${10+unid(a)-unid(b)}. Dezenas: ${dez(a)-1} − ${dez(b)} = ${dez(a)-1-dez(b)}. Resultado: ${a-b}.`};
  },
  multiplicacao(d){
    const g=d>=3?rnd(2,9):rnd(2,5),c=d>=3?rnd(2,9):rnd(2,6),r=g*c,par=Array(g).fill(c).join(" + ");
    return{a:g,b:c,op:"×",r,dica:`Multiplicar é somar parcelas iguais: ${g} × ${c} = ${par}.`,erro:`${g} grupos de ${c}: ${par} = ${r}.`,sim:[g+c,r+c,r-c],
      alt:[{enunciado:`Quanto é ${par}?`},{enunciado:`Tenho ${g} caixas com ${c} lápis em cada uma. Quantos lápis são ao todo?`,visual:r<=30?{tipo:"iguais",grupos:g,cada:c,emoji:"✏️"}:undefined}]};
  },
  divisao(d){
    const p=d>=3?rnd(2,9):rnd(2,5),c=d>=3?rnd(2,9):rnd(2,6),t=p*c;
    return{a:t,b:p,op:"÷",r:c,dica:`Pense: ${p} vezes quanto dá ${t}? Repartir é o contrário de multiplicar.`,erro:`${t} ÷ ${p} = ${c}, porque ${p} × ${c} = ${t}.`,sim:[p,c+1,c-1],
      alt:[{enunciado:`Reparti ${t} biscoitos igualmente em ${p} pratos. Quantos biscoitos ficaram em cada prato?`,visual:t<=30?{tipo:"reparte",total:t,pratos:p,emoji:"🍪"}:undefined}]};
  }
};
function paresDe(nome,d,n){const vistos=new Set(),L=[];let g=0;while(L.length<n&&g++<80){const sp=SPEC[nome](d);if(vistos.has(sp.r))continue;vistos.add(sp.r);L.push(sp)}return L}
function montarOp(nome,d,tipo){
  const sp=SPEC[nome](d),{a,b,op,r}=sp;
  if(tipo==="lacuna"){
    const lado=Math.random()<.5?"b":"a",falta=lado==="b"?b:a;
    return{tipo:"lacuna",enunciado:`Complete a conta: ${lado==="b"?`${a} ${op} ___ = ${r}`:`___ ${op} ${b} = ${r}`}`,resposta:falta,dica:sp.dica,fat:[a,b],erro:`A lacuna é ${falta}, porque ${a} ${op} ${b} = ${r}.`};
  }
  if(tipo==="relacionar"){
    const L=paresDe(nome,d,nome==="adicao"||nome==="adicaoVaiUm"?4:3),pares=L.map(x=>({e:`${x.a} ${x.op} ${x.b}`,d:String(x.r)}));
    const respTxt=pares.map(p=>`${p.e} = ${p.d}`).join("; ");
    return{tipo:"relacionar",enunciado:"Ligue cada conta ao seu resultado.",pares,fat:L.flatMap(x=>[x.a,x.b]),direita:embaralhar(pares.map(p=>p.d)),resposta:1,respTxt,chave:respTxt,dica:"Resolva cada conta separada e ligue ao resultado certo.",erro:`As ligações certas são: ${respTxt}.`};
  }
  const alt=sp.alt&&Math.random()<.5?sp.alt[Math.floor(Math.random()*sp.alt.length)]:null;
  const base={enunciado:alt?alt.enunciado:`${a} ${op} ${b} = ?`,resposta:r,fat:[a,b],visual:alt?alt.visual:sp.visual,dica:sp.dica,erro:sp.erro};
  return tipo==="escolha"?{...base,tipo:"escolha",opcoes:opcoesNum(r,sp.sim||[])}:{...base,tipo:"digitar"};
}
const NOMES_CASA=["unidades","dezenas","centenas","unidades de milhar"];
function montarPosicional(d,tipo){
  const len=d>=3?4:3;let n;do{n=rnd(Math.pow(10,len-1),Math.pow(10,len)-1)}while(new Set(String(n)).size<len||String(n).includes("0"));
  const s=String(n),vals=[...s].map((x,i)=>+x*Math.pow(10,len-1-i)),dica="Unidades valem 1, dezenas valem 10, centenas valem 100 e milhares valem 1000. Veja em que casa cada algarismo está.";
  const i=rnd(0,len-1),dig=+s[i],k=len-1-i,r=vals[i];
  if(tipo==="lacuna"){
    const partes=vals.map((v,j)=>j===i?"___":String(v)).join(" + ");
    return{tipo:"lacuna",enunciado:`Complete: ${n} = ${partes}`,resposta:r,dica,erro:`O ${dig} está na casa das ${NOMES_CASA[k]}, então vale ${r}. ${n} = ${vals.join(" + ")}.`};
  }
  if(tipo==="relacionar"){
    const pares=[...s].map((x,j)=>({e:`algarismo ${x}`,d:String(vals[j])})),respTxt=pares.map(p=>`${p.e} vale ${p.d}`).join("; ");
    return{tipo:"relacionar",enunciado:`No número ${n}, ligue cada algarismo ao seu valor.`,pares,direita:embaralhar(pares.map(p=>p.d)),resposta:1,respTxt,chave:n+respTxt,dica,erro:`Cada algarismo vale pela casa onde está: ${respTxt}.`};
  }
  const base={enunciado:`No número ${n}, qual é o valor do algarismo ${dig}?`,resposta:r,dica,erro:`O ${dig} está na casa das ${NOMES_CASA[k]}. ${dig} ${NOMES_CASA[k]} valem ${r}.`};
  if(tipo==="escolha")return{...base,tipo:"escolha",opcoes:opcoesNum(r,[dig,dig*10,dig*100,dig*1000].filter(x=>x!==r))};
  if(Math.random()<.5)return{...base,tipo:"digitar"};
  return{tipo:"digitar",enunciado:`Quanto é ${vals.join(" + ")}?`,resposta:n,dica,erro:`Junte as partes: ${vals.join(" + ")} = ${n}.`};
}
const tipoAleatorio=()=>TIPOS_Q[Math.floor(Math.random()*TIPOS_Q.length)];

/* ---------- Lote A do 3º ano: comparar e ordenar, pares e ímpares, sequências (respostas sempre numéricas) ---------- */
const umDe=a=>a[Math.floor(Math.random()*a.length)];
const listaE=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" ou "+a[a.length-1];
/* n números distintos com o mesmo tamanho; no Ouro e às vezes nos outros níveis começam iguais (para comparar casa por casa) */
function numerosParecidos(n,len,d){
  const k=d>=3?rnd(1,2):rnd(0,1),pre=k?String(rnd(1,9))+(k>1?String(rnd(0,9)):""):"";
  const s=new Set();let g=0;
  while(s.size<n&&g++<400){let x=pre;while(x.length<len)x+=String(x.length===0?rnd(1,9):rnd(0,9));s.add(+x)}
  while(s.size<n)s.add(rnd(Math.pow(10,len-1),Math.pow(10,len)-1));
  return embaralhar([...s]);
}
function montarComparar(d,tipo){
  const len=d>=3?4:3,dica="Compare casa por casa, começando pela esquerda (a casa de maior valor). O primeiro algarismo diferente decide qual é o maior.";
  const ordem=o=>[...o].sort((a,b)=>a-b),w=()=>Math.random()<.5?"maior":"menor";
  const expl=(o,q,r)=>`Em ordem do menor para o maior: ${ordem(o).join(" < ")}. O ${q} é ${r}. Compare casa por casa, da esquerda para a direita.`;
  if(tipo==="escolha"){const o=numerosParecidos(4,len,d),q=w(),r=q==="maior"?Math.max(...o):Math.min(...o);
    return{tipo:"escolha",enunciado:`Qual destes números é o ${q}?`,opcoes:o,resposta:r,chave:"e"+ordem(o).join()+q,dica,erro:expl(o,q,r)}}
  if(tipo==="digitar"){const o=numerosParecidos(d>=3?3:rnd(2,3),len,d),q=w(),r=q==="maior"?Math.max(...o):Math.min(...o);
    return{tipo:"digitar",enunciado:`Escreva o ${q} número: ${listaE(o)}.`,resposta:r,dica,erro:expl(o,q,r)}}
  if(tipo==="lacuna"){const o=numerosParecidos(3,len,d),cr=Math.random()<.5,s=ordem(o),f=cr?s:[...s].reverse();
    return{tipo:"lacuna",enunciado:`Os números ${o.join(", ").replace(/, (\d+)$/," e $1")} em ordem ${cr?"crescente (do menor para o maior)":"decrescente (do maior para o menor)"}: ${f[0]}, ___, ${f[2]}.`,resposta:s[1],dica,erro:`Em ordem ${cr?"crescente":"decrescente"}: ${f.join(", ")}. O número do meio é ${s[1]}.`}}
  const L=[];const vis=new Set();let g=0;
  while(L.length<3&&g++<200){const o=numerosParecidos(2,len,d),q=w(),r=q==="maior"?Math.max(...o):Math.min(...o);if(vis.has(r))continue;vis.add(r);L.push({e:`o ${q}: ${o[0]} ou ${o[1]}`,d:String(r)})}
  const respTxt=L.map(p=>`${p.e} = ${p.d}`).join("; ");
  return{tipo:"relacionar",enunciado:"Ligue cada pergunta ao número certo.",pares:L,direita:embaralhar(L.map(p=>p.d)),resposta:1,respTxt,chave:respTxt,dica,erro:`As ligações certas são: ${respTxt}.`};
}
const parDe=n=>n%2===0?"par":"ímpar";
function vizinhoPI(k,dir,n){let m=dir==="depois"?n+1:n-1;while(parDe(m)!==k)m+=dir==="depois"?1:-1;return m}
function montarParImpar(d,tipo){
  const lo=d>=3?100:10,hi=d>=3?999:99,dica="Número par termina em 0, 2, 4, 6 ou 8 e dá para formar duplas sem sobrar. Número ímpar termina em 1, 3, 5, 7 ou 9 e sempre sobra um.";
  const dif=(q,n)=>{const s=new Set();while(s.size<n)s.add(rnd(lo,hi));return[...s]};
  const lado=()=>({k:umDe(["par","ímpar"]),dir:umDe(["depois","antes"])});
  const cena=()=>{const {k,dir}=lado();const n=rnd(lo+3,hi-3);return{k,dir,n,r:vizinhoPI(k,dir,n)}};
  const explViz=c=>`O número ${c.k} logo ${c.dir} de ${c.n} é ${c.r}, porque ${c.r} termina em ${c.r%10} e é ${c.k}.`;
  if(tipo==="escolha"){const k=umDe(["par","ímpar"]);let o;do{const r=rnd(lo,hi),outros=[];while(outros.length<3){const x=rnd(lo,hi);if(parDe(x)!==k&&!outros.includes(x)&&x!==r)outros.push(x)}
      const r2=(()=>{let x=r;if(parDe(x)!==k)x=x===hi?x-1:x+1;return x})();o={r:r2,l:embaralhar([r2,...outros])}}while(new Set(o.l).size<4);
    const outros=o.l.filter(x=>x!==o.r);
    return{tipo:"escolha",enunciado:`Qual destes números é ${k}?`,opcoes:o.l,resposta:o.r,chave:"pi"+[...o.l].sort().join()+k,dica,erro:`${o.r} termina em ${o.r%10}, então é ${k}. Os outros (${outros.join(", ")}) são ${k==="par"?"ímpares":"pares"}.`}}
  if(tipo==="digitar"){
    if(Math.random()<.5){const n=rnd(5,6),L=dif(0,n),k=umDe(["pares","ímpares"]),kk=k==="pares"?"par":"ímpar",r=L.filter(x=>parDe(x)===kk).length;
      return{tipo:"digitar",enunciado:`Quantos números ${k} há aqui? ${L.join(", ")}`,resposta:r,dica,erro:`${k==="pares"?"Pares":"Ímpares"} nessa lista: ${L.filter(x=>parDe(x)===kk).join(", ")||"nenhum"}. São ${r}.`}}
    const c=cena();return{tipo:"digitar",enunciado:`Qual é o número ${c.k} logo ${c.dir} de ${c.n}?`,resposta:c.r,dica,erro:explViz(c)};
  }
  if(tipo==="lacuna"){const c=cena();return{tipo:"lacuna",enunciado:`O número ${c.k} logo ${c.dir} de ${c.n} é ___`,resposta:c.r,dica,erro:explViz(c)}}
  const L=[],vis=new Set();let g=0;while(L.length<3&&g++<200){const c=cena();if(vis.has(c.r))continue;vis.add(c.r);L.push({e:`${c.k} logo ${c.dir} de ${c.n}`,d:String(c.r)})}
  const respTxt=L.map(p=>`${p.e} = ${p.d}`).join("; ");
  return{tipo:"relacionar",enunciado:"Ligue cada pista ao número certo.",pares:L,direita:embaralhar(L.map(p=>p.d)),resposta:1,respTxt,chave:respTxt,dica,erro:`As ligações certas são: ${respTxt}.`};
}
function regraSeq(d){
  const dec=d>=3&&Math.random()<.4,k=umDe(d>=3?[2,3,4,5,6,7,8,9,10,20,25,50]:[2,3,4,5,10]),ini=dec?k*6+rnd(0,40):rnd(1,d>=3?200:30);
  return{k,dec,ini,sq:i=>dec?ini-i*k:ini+i*k};
}
function montarSequencia(d,tipo){
  const dica="Veja de quanto em quanto os números aumentam (ou diminuem) e continue com a mesma regra.";
  const expl=(g,h)=>`A sequência ${g.dec?"diminui":"aumenta"} de ${g.k} em ${g.k}. ${g.sq(h-1)} ${g.dec?"−":"+"} ${g.k} = ${g.sq(h)}.`;
  const com=(g,h,marca)=>[0,1,2,3,4].map(i=>i===h?marca:g.sq(i)).join(", ");
  if(tipo==="digitar"){const g=regraSeq(d);return{tipo:"digitar",enunciado:`Continue a sequência: ${[0,1,2,3].map(g.sq).join(", ")}, ?`,resposta:g.sq(4),dica,erro:expl(g,4)}}
  if(tipo==="escolha"){const g=regraSeq(d),h=rnd(1,3),r=g.sq(h);
    return{tipo:"escolha",enunciado:`Qual número completa a sequência? ${com(g,h,"___")}`,opcoes:opcoesNum(r,[r+g.k,r-g.k,r+2*g.k]),resposta:r,dica,erro:expl(g,h)}}
  if(tipo==="lacuna"){const g=regraSeq(d),h=rnd(1,4);return{tipo:"lacuna",enunciado:`Complete a sequência: ${com(g,h,"___")}`,resposta:g.sq(h),dica,erro:expl(g,h)}}
  const L=[],vis=new Set();let n=0;while(L.length<3&&n++<200){const g=regraSeq(d),r=g.sq(3);if(vis.has(r))continue;vis.add(r);L.push({e:`${[0,1,2].map(g.sq).join(", ")}, ?`,d:String(r)})}
  const respTxt=L.map(p=>`${p.e} = ${p.d}`).join("; ");
  return{tipo:"relacionar",enunciado:"Ligue cada sequência ao próximo número.",pares:L,direita:embaralhar(L.map(p=>p.d)),resposta:1,respTxt,chave:respTxt,dica,erro:`As ligações certas são: ${respTxt}.`};
}
/* ---------- Lote B: figuras, comprimento, tempo e dinheiro ----------
   Cada "família" devolve uma questão-base: q (enunciado), lac (versão com ___), e (texto curto para ligar), r (resposta inteira),
   alt (respostas parecidas), erro (explicação) e, às vezes, visual (desenho em SVG). Só números inteiros, sem vírgula. */
const plu=(n,um,varios)=>n===1?um:varios;
function opcoesPos(c,alt){
  const s=new Set([c]);
  for(const x of embaralhar([...(alt||[]),c+1,c-1,c+2,c-2,c+10,c*2,c*10])){if(s.size>=4)break;if(Number.isInteger(x)&&x>=1&&x!==c)s.add(x)}
  let k=3;while(s.size<4)s.add(c+k++);return embaralhar([...s]);
}
function montarFam(fams,d,tipo,dica,tituloRel){
  const novo=()=>umDe(fams)(d),vis=it=>it.visual?JSON.stringify(it.visual):"";
  if(tipo==="relacionar"){
    const L=[],rs=new Set(),es=new Set();let g=0;
    while(L.length<3&&g++<400){const it=novo();if(!it.e||rs.has(it.r)||es.has(it.e))continue;rs.add(it.r);es.add(it.e);L.push({e:it.e,d:String(it.r)})}
    const respTxt=L.map(p=>`${p.e} = ${p.d}`).join("; ");
    return{tipo:"relacionar",enunciado:tituloRel,pares:L,direita:embaralhar(L.map(p=>p.d)),resposta:1,respTxt,chave:respTxt,dica,erro:`As ligações certas são: ${respTxt}.`};
  }
  const it=novo(),base={tipo,resposta:it.r,dica,erro:it.erro};if(it.visual)base.visual=it.visual;
  if(tipo==="digitar")return{...base,enunciado:it.q,chave:it.q+vis(it)};
  if(tipo==="escolha")return{...base,enunciado:it.q,opcoes:opcoesPos(it.r,it.alt),chave:"e"+it.q+vis(it)};
  return{...base,enunciado:it.lac,chave:"l"+it.lac+vis(it)};
}
/* geometria: vértices de cada figura plana (compartilhado com o desenho e com a animação) */
const FIGURAS=[
 {id:"triangulo",nome:"triângulo",lados:3,pref:"tri"},{id:"quadrado",nome:"quadrado",lados:4,pref:"quadri"},{id:"retangulo",nome:"retângulo",lados:4,pref:"quadri"},
 {id:"pentagono",nome:"pentágono",lados:5,pref:"penta"},{id:"hexagono",nome:"hexágono",lados:6,pref:"hexa"}];
const CUBO={faces:6,"vértices":8,arestas:12};
function vertsFig(id,cx,cy,r){
  if(id==="retangulo")return[[cx-r*1.05,cy-r*.62],[cx+r*1.05,cy-r*.62],[cx+r*1.05,cy+r*.62],[cx-r*1.05,cy+r*.62]];
  const f=FIGURAS.find(x=>x.id===id),n=f?f.lados:4,rot=id==="quadrado"?45:0;
  return Array.from({length:n},(_,i)=>{const a=(rot+i*360/n)*Math.PI/180;return[+(cx+r*Math.sin(a)).toFixed(1),+(cy-r*Math.cos(a)).toFixed(1)]});
}
function famFiguras(d){
  const cubo=Math.random()<.28;
  if(cubo){const c=umDe(d>=3?["faces","vértices","arestas"]:["faces"]),r=CUBO[c],pl=c==="faces"?"Quantas":"Quantos";
    const ex={faces:"O cubo é como um dado: tem 6 faces (6 quadrados).","vértices":"O cubo tem 8 vértices (cantinhos): 4 em cima e 4 embaixo.",arestas:"O cubo tem 12 arestas (as bordas): 4 em cima, 4 embaixo e 4 nas laterais."}[c];
    return{q:`${pl} ${c} tem o cubo?`,lac:`O cubo tem ___ ${c}.`,e:`${c} do cubo`,r,alt:[6,8,12,4],erro:ex,visual:{tipo:"figura",nome:"cubo"}}}
  const f=umDe(FIGURAS),c=umDe(["lados","vértices"]),r=f.lados;
  const ex={triangulo:"“tri” quer dizer 3: o triângulo tem 3 lados e 3 vértices.",quadrado:"O quadrado tem 4 lados iguais e 4 vértices (cantinhos).",retangulo:"O retângulo tem 4 lados e 4 vértices (4 cantos retos).",
    pentagono:"“penta” quer dizer 5: o pentágono tem 5 lados e 5 vértices.",hexagono:"“hexa” quer dizer 6: o hexágono tem 6 lados e 6 vértices."}[f.id];
  return{q:`Quantos ${c} tem o ${f.nome}?`,lac:`O ${f.nome} tem ___ ${c}.`,e:`${c} do ${f.nome}`,r,alt:[3,4,5,6,7],erro:ex,visual:{tipo:"figura",nome:f.id}};
}
function montarFiguras(d,tipo){
  return montarFam([famFiguras],d,tipo,"Conte os lados (os traços) e os vértices (os cantinhos). O começo do nome ajuda: tri = 3, quadri = 4, penta = 5 e hexa = 6.","Ligue cada pergunta ao número certo.");
}
/* conversão entre unidades vizinhas: pares = [[maior, menor, quantas do menor cabem no maior]] */
function famConv(d,pares,nome,qt,ab,kmax){
  const [a,b,f]=umDe(pares),sobe=Math.random()<.5,k=rnd(1,kmax(a,b,d)),de=sobe?b:a,para=sobe?a:b,n=sobe?k*f:k,r=sobe?k:k*f;
  const erro=sobe?`${f} ${nome(de,f)} formam 1 ${nome(para,1)}. Então ${n} ÷ ${f} = ${r} ${nome(para,r)}.`:`1 ${nome(de,1)} tem ${f} ${nome(para,f)}. Então ${n} × ${f} = ${r} ${nome(para,r)}.`;
  return{q:`${qt(para)} ${nome(para,2)} há em ${n} ${nome(de,n)}?`,lac:`${n} ${ab(de,n)} = ___ ${ab(para,2)}`,e:`${n} ${ab(de,n)} em ${ab(para,2)}`,r,alt:[r*10,r+f,r+f*2,r>=10?r/10:r+1],erro};
}
const UNC={km:["quilômetro","quilômetros"],m:["metro","metros"],cm:["centímetro","centímetros"],mm:["milímetro","milímetros"]};
const PARES_C=[["m","cm",100],["cm","mm",10],["km","m",1000]],KMAX_C={"m":[9,30],"cm":[9,50],"km":[5,12]};
function famCompConv(d){return famConv(d,PARES_C,(u,n)=>UNC[u][n===1?0:1],()=>"Quantos",u=>u,(a,b,dd)=>KMAX_C[a][dd>=3?1:0])}
function famCompComposta(d){const a=rnd(1,9),b=rnd(1,99);
  return{q:`Quantos centímetros há em ${a} m e ${b} cm?`,lac:`${a} m e ${b} cm = ___ cm`,e:`${a} m e ${b} cm em cm`,r:a*100+b,alt:[a*100,a*10+b,a*100+b*10,a+b],erro:`${a} m = ${a*100} cm. Então ${a*100} + ${b} = ${a*100+b} cm.`}}
function famCompFitas(d){const a=rnd(1,9),b=rnd(1,9);
  return{q:`Uma fita tem ${a} m e outra tem ${b} m. Quantos centímetros as duas têm juntas?`,lac:`Duas fitas, ${a} m e ${b} m, juntas têm ___ cm.`,e:`${a} m + ${b} m em cm`,r:(a+b)*100,alt:[a+b,(a+b)*10,(a+b)*1000],erro:`${a} m + ${b} m = ${a+b} m. Como 1 m = 100 cm, ${a+b} × 100 = ${(a+b)*100} cm.`}}
function famCompFio(d){const a=rnd(2,9),b=rnd(1,a*100-1);
  return{q:`Um fio tem ${a} m e outro tem ${b} cm. Quantos centímetros o maior tem a mais?`,lac:`Um fio de ${a} m e outro de ${b} cm: o maior tem ___ cm a mais.`,e:`${a} m menos ${b} cm em cm`,r:a*100-b,alt:[a*100+b,b,a*100],erro:`${a} m = ${a*100} cm. A diferença é ${a*100} − ${b} = ${a*100-b} cm.`}}
function montarComprimento(d,tipo){
  const fams=d>=3?[famCompConv,famCompConv,famCompComposta,famCompFitas,famCompFio]:[famCompConv];
  return montarFam(fams,d,tipo,"Lembre: 1 m = 100 cm, 1 cm = 10 mm e 1 km = 1000 m. Para ir para a unidade menor, multiplique; para a maior, divida.","Ligue cada medida ao valor certo.");
}
/* tempo */
const UNT={hora:["hora","horas"],minuto:["minuto","minutos"],dia:["dia","dias"],semana:["semana","semanas"],"mês":["mês","meses"],ano:["ano","anos"]};
const PARES_T=[["hora","minuto",60],["dia","hora",24],["semana","dia",7],["ano","mês",12]],KMAX_T={hora:[3,6],dia:[2,5],semana:[4,10],ano:[3,10]};
function famTempoConv(d){return famConv(d,PARES_T,(u,n)=>UNT[u][n===1?0:1],u=>u==="hora"||u==="semana"?"Quantas":"Quantos",(u,n)=>UNT[u][n===1?0:1],(a,b,dd)=>KMAX_T[a][dd>=3?1:0])}
function famTempoMeia(){return{q:"Meia hora tem quantos minutos?",lac:"Meia hora = ___ minutos",e:"meia hora em minutos",r:30,alt:[15,60,20,45],erro:"Meia hora é a metade de 60 minutos: 60 ÷ 2 = 30 minutos."}}
function famTempoHoraMeia(){const n=rnd(1,4);
  return{q:`Quantos minutos há em ${n} ${plu(n,"hora","horas")} e meia?`,lac:`${n} ${plu(n,"hora","horas")} e meia = ___ minutos`,e:`${n} ${plu(n,"hora","horas")} e meia em minutos`,r:n*60+30,alt:[n*60,n*60+60,n*30,n*60+15],erro:`${n} ${plu(n,"hora","horas")} = ${n*60} minutos e a meia hora = 30 minutos. ${n*60} + 30 = ${n*60+30} minutos.`}}
function famRelogioHora(){const h=rnd(1,12);
  return{q:"Que horas o relógio marca? Responda só o número da hora.",lac:"Olhe o relógio. A hora marcada é ___.",r:h,alt:[h+1,h-1,h+2,h-2],visual:{tipo:"relogio",h,m:0},erro:`O ponteiro pequeno aponta para o ${h} e o grande para o 12: são ${h} ${plu(h,"hora","horas")}.`}}
function famRelogioMin(d){const h=rnd(1,12),m=umDe(d>=3?[5,10,15,20,25,30,35,40,45,50,55]:[15,30,45]);
  return{q:`O relógio marca ${h} ${plu(h,"hora","horas")} e quantos minutos?`,lac:`Olhe o relógio: a hora é ${h} e os minutos são ___.`,r:m,alt:[m+5,m-5,m+10,m/5],visual:{tipo:"relogio",h,m},erro:`O ponteiro grande está no ${m/5}. Cada número vale 5 minutos: ${m/5} × 5 = ${m} minutos.`}}
function famRelogioFalta(){const h=rnd(1,12),m=umDe([5,10,15,20,25,30,35,40,45,50,55]);
  return{q:"Quantos minutos faltam para o relógio completar a hora?",lac:"Faltam ___ minutos para completar a hora.",r:60-m,alt:[m,60-m+5,60-m-5,30],visual:{tipo:"relogio",h,m},erro:`Já passaram ${m} minutos. Faltam 60 − ${m} = ${60-m} minutos.`}}
function montarTempo(d,tipo){
  const fams=d>=3?[famTempoConv,famTempoConv,famTempoMeia,famTempoHoraMeia,famRelogioHora,famRelogioMin,famRelogioMin,famRelogioFalta]:[famTempoConv,famTempoConv,famTempoMeia,famRelogioHora,famRelogioMin,famRelogioMin];
  return montarFam(fams,d,tipo,"Lembre: 1 hora = 60 minutos, 1 dia = 24 horas, 1 semana = 7 dias e 1 ano = 12 meses. No relógio, cada número do ponteiro grande vale 5 minutos.","Ligue cada tempo ao valor certo.");
}
/* dinheiro (só números inteiros: reais inteiros ou centavos) */
function famDinConvR(d){const n=rnd(1,d>=3?40:9),r=n*100;
  return{q:`Quantos centavos há em ${n} ${plu(n,"real","reais")}?`,lac:`R$ ${n} = ___ centavos`,e:`R$ ${n} em centavos`,r,alt:[n,r*10,r+10,r+100],erro:`R$ 1 = 100 centavos. ${n} × 100 = ${r} centavos.`}}
function famDinConvC(d){const n=rnd(1,d>=3?40:9);
  return{q:`Quantos reais há em ${n*100} centavos?`,lac:`${n*100} centavos = R$ ___`,e:`${n*100} centavos em reais`,r:n,alt:[n*10,n+1,n*100,n-1],erro:`100 centavos formam R$ 1. ${n*100} ÷ 100 = ${n}.`}}
function famDinSoma(d){const a=rnd(d>=3?10:2,d>=3?49:9),b=rnd(d>=3?10:2,d>=3?49:9);
  return{q:`Ana comprou um lápis de R$ ${a} e uma borracha de R$ ${b}. Quantos reais ela gastou?`,lac:`R$ ${a} + R$ ${b} = R$ ___`,e:`R$ ${a} + R$ ${b}`,r:a+b,alt:[a+b+10,a+b-10,Math.abs(a-b),a+b+1],erro:`Some os valores: ${a} + ${b} = ${a+b}. Ela gastou R$ ${a+b}.`}}
function famDinTroco(d){const p=umDe(d>=3?[20,50,100]:[10,20]),c=p===10?rnd(1,9):p===20?rnd(11,19):rnd(Math.floor(p/4),p-1);
  return{q:`Paguei R$ ${p} por algo que custa R$ ${c}. Qual é o troco, em reais?`,lac:`Paguei R$ ${p} e custava R$ ${c}: troco de R$ ___`,e:`troco de R$ ${p} para R$ ${c}`,r:p-c,alt:[c,p+c,p-c+10,p-c-1],erro:`Conte do preço até o valor pago: ${c} + ${p-c} = ${p}. Ou subtraia: ${p} − ${c} = ${p-c}. O troco é R$ ${p-c}.`}}
function famDinTrocoC(d){const c=umDe(d>=3?[5,15,20,35,40,55,60,65,85,95]:[10,20,30,40,60,70,80,90]);
  return{q:`Paguei R$ 1 por algo que custa ${c} centavos. Qual é o troco, em centavos?`,lac:`Paguei R$ 1 e custava ${c} centavos: troco de ___ centavos`,e:`troco de R$ 1 para ${c} centavos`,r:100-c,alt:[c,100+c,100-c+10,100-c-10],erro:`R$ 1 = 100 centavos. Então 100 − ${c} = ${100-c} centavos de troco.`}}
function famDinMoedas(d){const vs=d>=3?[5,10,25,50,100]:[10,50,100],n=rnd(2,d>=3?4:3),it=Array.from({length:n},()=>({k:"moeda",v:umDe(vs)})).sort((a,b)=>b.v-a.v),r=it.reduce((a,x)=>a+x.v,0);
  return{q:"Quantos centavos há nestas moedas?",lac:"Estas moedas valem ___ centavos.",r,alt:[r+10,r-10,r+5,r+50],visual:{tipo:"dinheiro",itens:it},erro:`Some os valores das moedas: ${it.map(x=>x.v).join(" + ")} = ${r} centavos.`}}
function famDinNotas(d){const vs=d>=3?[5,10,20,50,100]:[2,5,10],n=rnd(2,d>=3?4:3),it=Array.from({length:n},()=>({k:"nota",v:umDe(vs)})).sort((a,b)=>b.v-a.v),r=it.reduce((a,x)=>a+x.v,0);
  return{q:"Quantos reais há nestas notas?",lac:"Estas notas valem R$ ___ no total.",r,alt:[r+10,r-10,r+5,r+2],visual:{tipo:"dinheiro",itens:it},erro:`Some os valores das notas: ${it.map(x=>x.v).join(" + ")} = ${r} reais.`}}
function montarDinheiro(d,tipo){
  return montarFam([famDinConvR,famDinConvC,famDinSoma,famDinTroco,famDinTrocoC,famDinMoedas,famDinNotas],d,tipo,"R$ 1 = 100 centavos. Para o troco, conte do preço até o valor pago (ou subtraia). Para somar valores, some reais com reais e centavos com centavos.","Ligue cada situação ao valor certo.");
}
const GER={
  valorPosicional:(d,tipo)=>montarPosicional(d,tipo||tipoAleatorio()),
  adicao:(d,tipo)=>montarOp("adicao",d,tipo||tipoAleatorio()),
  adicaoVaiUm:(d,tipo)=>montarOp("adicaoVaiUm",d,tipo||tipoAleatorio()),
  subtracao:(d,tipo)=>montarOp("subtracao",d,tipo||tipoAleatorio()),
  multiplicacao:(d,tipo)=>montarOp("multiplicacao",d,tipo||tipoAleatorio()),
  divisao:(d,tipo)=>montarOp("divisao",d,tipo||tipoAleatorio()),
  comparar:(d,tipo)=>montarComparar(d,tipo||tipoAleatorio()),
  parImpar:(d,tipo)=>montarParImpar(d,tipo||tipoAleatorio()),
  sequencia:(d,tipo)=>montarSequencia(d,tipo||tipoAleatorio()),
  figuras:(d,tipo)=>montarFiguras(d,tipo||tipoAleatorio()),
  comprimento:(d,tipo)=>montarComprimento(d,tipo||tipoAleatorio()),
  tempo:(d,tipo)=>montarTempo(d,tipo||tipoAleatorio()),
  dinheiro:(d,tipo)=>montarDinheiro(d,tipo||tipoAleatorio())
};
/* os tipos se alternam (sem repetir o mesmo seguido) e todos aparecem em cada nível */
function sequenciaTipos(n){let seq=[];while(seq.length<n){const b=embaralhar(TIPOS_Q);if(seq.length&&b[0]===seq[seq.length-1])b.push(b.shift());seq=seq.concat(b)}return seq.slice(0,n)}
/* Bronze = questões-base menos 2; Prata = base; Ouro = base mais 2. Cada nível começa com 2 vidas. */
const QTD_NIVEL={bronze:-2,prata:0,ouro:2},VIDAS_NIVEL=2;
function novaSessao(fase,nivel){
  nivel=nivel||"bronze";const n=Math.max(4,cfgF("questoesPorFase")+QTD_NIVEL[nivel]),dif=nivel==="ouro"?3:1,tipos=sequenciaTipos(n),fila=[],vistos=new Set();
  for(const tp of tipos){let ex,g=0;do{ex=GER[fase.gerador](dif,tp)}while(vistos.has(ex.chave||ex.enunciado)&&g++<60);vistos.add(ex.chave||ex.enunciado);fila.push(ex)}
  return{fase,nivel,dica:nivel==="bronze",fila,total:fila.length,feitas:0,erros:0,vidas:VIDAS_NIVEL,acertosPrimeira:0,moedas:0,estado:"pergunta",msg:"",fala:"",emAndamento:true};
}
