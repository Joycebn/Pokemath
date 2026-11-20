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
    return{tipo:"lacuna",enunciado:`Complete a conta: ${lado==="b"?`${a} ${op} ___ = ${r}`:`___ ${op} ${b} = ${r}`}`,resposta:falta,dica:sp.dica,erro:`A lacuna é ${falta}, porque ${a} ${op} ${b} = ${r}.`};
  }
  if(tipo==="relacionar"){
    const L=paresDe(nome,d,nome==="adicao"||nome==="adicaoVaiUm"?4:3),pares=L.map(x=>({e:`${x.a} ${x.op} ${x.b}`,d:String(x.r)}));
    const respTxt=pares.map(p=>`${p.e} = ${p.d}`).join("; ");
    return{tipo:"relacionar",enunciado:"Ligue cada conta ao seu resultado.",pares,direita:embaralhar(pares.map(p=>p.d)),resposta:1,respTxt,chave:respTxt,dica:"Resolva cada conta separada e ligue ao resultado certo.",erro:`As ligações certas são: ${respTxt}.`};
  }
  const alt=sp.alt&&Math.random()<.5?sp.alt[Math.floor(Math.random()*sp.alt.length)]:null;
  const base={enunciado:alt?alt.enunciado:`${a} ${op} ${b} = ?`,resposta:r,visual:alt?alt.visual:sp.visual,dica:sp.dica,erro:sp.erro};
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
const GER={
  valorPosicional:(d,tipo)=>montarPosicional(d,tipo||tipoAleatorio()),
  adicao:(d,tipo)=>montarOp("adicao",d,tipo||tipoAleatorio()),
  adicaoVaiUm:(d,tipo)=>montarOp("adicaoVaiUm",d,tipo||tipoAleatorio()),
  subtracao:(d,tipo)=>montarOp("subtracao",d,tipo||tipoAleatorio()),
  multiplicacao:(d,tipo)=>montarOp("multiplicacao",d,tipo||tipoAleatorio()),
  divisao:(d,tipo)=>montarOp("divisao",d,tipo||tipoAleatorio())
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
