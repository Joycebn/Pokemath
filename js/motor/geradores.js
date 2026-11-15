/* Geradores de questões. Cada um recebe a dificuldade (1 = Bronze e Prata, 3 = Ouro) e devolve:
   {tipo,enunciado,resposta,opcoes?,visual?,dica,erro}  — a dica só aparece no nível Bronze. */
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function opcoesNum(c,similares){
  const s=new Set([c]),cand=embaralhar([...(similares||[]),c+1,c-1,c+10,c-10,c+2,c-2,c*2]);
  for(const x of cand){if(s.size>=4)break;if(Number.isInteger(x)&&x>=0&&x!==c)s.add(x)}
  let k=3;while(s.size<4)s.add(c+k++);
  return embaralhar([...s]);
}
const unid=n=>n%10,dez=n=>Math.floor(n/10)%10,cen=n=>Math.floor(n/100)%10;
const GER={
  valorPosicional(d){
    const ouro=d>=3,nomes=["unidades","dezenas","centenas","unidades de milhar"];
    if(Math.random()<.6){
      const len=ouro?4:3;let n;do{n=rnd(Math.pow(10,len-1),Math.pow(10,len)-1)}while(new Set(String(n)).size<len||String(n).includes("0"));
      const s=String(n),i=rnd(0,len-1),dig=+s[i],k=len-1-i,pot=Math.pow(10,k),r=dig*pot;
      return{tipo:"escolha",enunciado:`No número ${n}, qual é o valor do algarismo ${dig}?`,resposta:r,
        opcoes:opcoesNum(r,[dig,dig*10,dig*100,dig*1000].filter(x=>x!==r)),
        dica:"Unidades valem 1, dezenas valem 10, centenas valem 100 e milhares valem 1000. Veja em que casa o algarismo está.",
        erro:`O ${dig} está na casa das ${nomes[k]}. ${dig} ${nomes[k]} valem ${r}.`};
    }
    const m=ouro?rnd(1,9):0,c=rnd(1,9),dd=rnd(1,9),u=rnd(1,9),r=m*1000+c*100+dd*10+u;
    const partes=(m?[m*1000]:[]).concat([c*100,dd*10,u]).join(" + ");
    return{tipo:"digitar",enunciado:`Quanto é ${partes}?`,resposta:r,dica:"Junte as partes: cada uma já mostra o valor da sua casa.",
      erro:`Junte as partes: ${partes} = ${r}.`};
  },
  adicao(d){
    let a,b;
    if(d>=3){do{a=rnd(111,888);b=rnd(111,888)}while(unid(a)+unid(b)>9||dez(a)+dez(b)>9||cen(a)+cen(b)>9)}
    else{do{a=rnd(11,89);b=rnd(11,89)}while(unid(a)+unid(b)>9||dez(a)+dez(b)>9)}
    const partes=[`unidades: ${unid(a)} + ${unid(b)} = ${unid(a)+unid(b)}`,`dezenas: ${dez(a)} + ${dez(b)} = ${dez(a)+dez(b)}`];
    if(d>=3)partes.push(`centenas: ${cen(a)} + ${cen(b)} = ${cen(a)+cen(b)}`);
    return{tipo:"digitar",enunciado:`${a} + ${b} = ?`,resposta:a+b,visual:{tipo:"conta",op:"+",a,b},
      dica:"Some coluna por coluna, começando pelas unidades (à direita).",erro:`Some coluna por coluna — ${partes.join("; ")}. Resultado: ${a+b}.`};
  },
  adicaoVaiUm(d){
    let a,b;
    if(d>=3){do{a=rnd(105,899);b=rnd(105,899)}while(unid(a)+unid(b)<10||a+b>=1000)}
    else{do{a=rnd(11,89);b=rnd(11,89)}while(unid(a)+unid(b)<10||dez(a)+dez(b)+1>9)}
    const u=unid(a)+unid(b);
    return{tipo:"digitar",enunciado:`${a} + ${b} = ?`,resposta:a+b,visual:{tipo:"conta",op:"+",a,b},
      dica:"Passou de 9? Escreva a unidade e mande a dezena (o “vai um”) para a coluna ao lado.",
      erro:`Unidades: ${unid(a)} + ${unid(b)} = ${u}. Escreva ${u%10} e o 1 vai para a coluna ao lado. Continue somando as outras colunas (com o 1 que veio). Resultado: ${a+b}.`};
  },
  subtracao(d){
    let a,b;
    if(d>=3){do{a=rnd(201,999);b=rnd(102,998)}while(b>=a||unid(a)>=unid(b))}
    else{do{a=rnd(21,99);b=rnd(11,98)}while(b>=a||unid(a)>=unid(b)||Math.floor(a/10)-1<Math.floor(b/10))}
    const erro=d>=3?`Subtraia coluna por coluna e, quando o de cima for menor, pegue 1 dezena emprestada (ela vira 10 unidades). ${a} − ${b} = ${a-b}.`
      :`Unidades: ${unid(a)} é menor que ${unid(b)}. Pegue 1 dezena emprestada: ${10+unid(a)} − ${unid(b)} = ${10+unid(a)-unid(b)}. Dezenas: ${Math.floor(a/10)-1} − ${Math.floor(b/10)} = ${Math.floor(a/10)-1-Math.floor(b/10)}. Resultado: ${a-b}.`;
    return{tipo:"digitar",enunciado:`${a} − ${b} = ?`,resposta:a-b,visual:{tipo:"conta",op:"-",a,b},
      dica:"Se o número de cima for menor, pegue 1 dezena emprestada: ela vira 10 unidades e você soma ao número de cima.",erro};
  },
  multiplicacao(d){
    const g=d>=3?rnd(2,9):rnd(2,5),c=d>=3?rnd(2,9):rnd(2,6),r=g*c,par=Array(g).fill(c).join(" + ");
    const dica=`Multiplicar é somar parcelas iguais: ${g} × ${c} = ${par}.`,erro=`${g} grupos de ${c}: ${par} = ${r}.`;
    if(Math.random()<.5)return{tipo:"escolha",enunciado:`Quanto é ${par}?`,resposta:r,opcoes:opcoesNum(r,[g+c,r+c,r-c]),dica,erro:`São ${g} parcelas iguais a ${c}. Isso é ${g} × ${c} = ${r}.`};
    return{tipo:"digitar",enunciado:`Tenho ${g} caixas com ${c} lápis em cada uma. Quantos lápis são ao todo?`,resposta:r,
      visual:r<=30?{tipo:"iguais",grupos:g,cada:c,emoji:"✏️"}:undefined,dica,erro};
  },
  divisao(d){
    const p=d>=3?rnd(2,9):rnd(2,5),c=d>=3?rnd(2,9):rnd(2,6),t=p*c,dica=`Pense: ${p} vezes quanto dá ${t}? Repartir é o contrário de multiplicar.`,erro=`${t} ÷ ${p} = ${c}, porque ${p} × ${c} = ${t}.`;
    if(Math.random()<.5)return{tipo:"digitar",enunciado:`Reparti ${t} biscoitos igualmente em ${p} pratos. Quantos biscoitos ficaram em cada prato?`,resposta:c,
      visual:t<=30?{tipo:"reparte",total:t,pratos:p,emoji:"🍪"}:undefined,dica,erro};
    return{tipo:"escolha",enunciado:`Quanto é ${t} ÷ ${p}?`,resposta:c,opcoes:opcoesNum(c,[p,c+1,c-1]),dica,erro};
  }
};
/* Bronze = questões-base menos 2; Prata = base; Ouro = base mais 2 e perguntas mais difíceis. */
const QTD_NIVEL={bronze:-2,prata:0,ouro:2};
function novaSessao(fase,nivel){
  nivel=nivel||"bronze";const n=Math.max(3,cfgF("questoesPorFase")+QTD_NIVEL[nivel]),dif=nivel==="ouro"?3:1,fila=[],vistos=new Set();let g=0;
  while(fila.length<n&&g++<400){const ex=GER[fase.gerador](dif);if(vistos.has(ex.enunciado))continue;vistos.add(ex.enunciado);fila.push(ex)}
  return{fase,nivel,dica:nivel==="bronze",fila,total:fila.length,feitas:0,erros:0,acertosPrimeira:0,moedas:0,estado:"pergunta",msg:"",fala:""};
}
