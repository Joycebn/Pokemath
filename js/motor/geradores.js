/* Geradores de questões. Cada um devolve: {tipo,enunciado,resposta,opcoes?,visual?,erro} */
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function opcoesNum(c,similares){
  const s=new Set([c]),cand=embaralhar([...(similares||[]),c+1,c-1,c+10,c-10,c+2,c-2,c*2]);
  for(const x of cand){if(s.size>=4)break;if(Number.isInteger(x)&&x>=0&&x!==c)s.add(x)}
  let k=3;while(s.size<4)s.add(c+k++);
  return embaralhar([...s]);
}
const GER={
  valorPosicional(){
    if(Math.random()<.6){
      let n;do{n=rnd(100,999)}while(new Set(String(n)).size<3||String(n).includes("0"));
      const s=String(n),i=rnd(0,2),dig=+s[i],pot=[100,10,1][i],casa=["centenas","dezenas","unidades"][i],r=dig*pot;
      return{tipo:"escolha",enunciado:`No número ${n}, qual é o valor do algarismo ${dig}?`,resposta:r,
        opcoes:opcoesNum(r,[dig,dig*10,dig*100].filter(x=>x!==r)),
        erro:`O ${dig} está na casa das ${casa}. ${dig} ${casa} valem ${r}.`};
    }
    const c=rnd(1,9),d=rnd(1,9),u=rnd(1,9),r=c*100+d*10+u;
    return{tipo:"digitar",enunciado:`Quanto é ${c*100} + ${d*10} + ${u}?`,resposta:r,
      erro:`Junte as centenas, as dezenas e as unidades: ${c*100} + ${d*10} + ${u} = ${r}.`};
  },
  adicao(){
    let a,b;do{a=rnd(11,89);b=rnd(11,89)}while(a%10+b%10>9||Math.floor(a/10)+Math.floor(b/10)>9);
    const u=a%10+b%10,d=Math.floor(a/10)+Math.floor(b/10);
    return{tipo:"digitar",enunciado:`${a} + ${b} = ?`,resposta:a+b,visual:{tipo:"conta",op:"+",a,b},
      erro:`Some as unidades: ${a%10} + ${b%10} = ${u}. Depois as dezenas: ${Math.floor(a/10)} + ${Math.floor(b/10)} = ${d}. Resultado: ${a+b}.`};
  },
  adicaoVaiUm(){
    let a,b;do{a=rnd(11,89);b=rnd(11,89)}while(a%10+b%10<10||Math.floor(a/10)+Math.floor(b/10)+1>9);
    const u=a%10+b%10,da=Math.floor(a/10),db=Math.floor(b/10);
    return{tipo:"digitar",enunciado:`${a} + ${b} = ?`,resposta:a+b,visual:{tipo:"conta",op:"+",a,b},
      erro:`Unidades: ${a%10} + ${b%10} = ${u}. Escreva ${u%10} e o 1 vai para as dezenas. Dezenas: ${da} + ${db} + 1 = ${da+db+1}. Resultado: ${a+b}.`};
  },
  subtracao(){
    let a,b;do{a=rnd(21,99);b=rnd(11,98)}while(b>=a||a%10<b%10||Math.floor(a/10)<Math.floor(b/10));
    return{tipo:"digitar",enunciado:`${a} − ${b} = ?`,resposta:a-b,visual:{tipo:"conta",op:"-",a,b},
      erro:`Subtraia as unidades: ${a%10} − ${b%10} = ${a%10-b%10}. Depois as dezenas: ${Math.floor(a/10)} − ${Math.floor(b/10)} = ${Math.floor(a/10)-Math.floor(b/10)}. Resultado: ${a-b}.`};
  },
  multiplicacao(){
    const g=rnd(2,5),c=rnd(2,6),r=g*c;
    if(Math.random()<.5)return{tipo:"escolha",enunciado:`Quanto é ${Array(g).fill(c).join(" + ")}?`,resposta:r,opcoes:opcoesNum(r,[g+c,r+c,r-c]),
      erro:`São ${g} parcelas iguais a ${c}. Isso é ${g} × ${c} = ${r}.`};
    return{tipo:"digitar",enunciado:`Tenho ${g} caixas com ${c} lápis em cada uma. Quantos lápis são ao todo?`,resposta:r,visual:{tipo:"iguais",grupos:g,cada:c,emoji:"✏️",somar:false},
      erro:`${g} grupos de ${c}: ${Array(g).fill(c).join(" + ")} = ${r}.`};
  },
  divisao(){
    const p=rnd(2,5),c=rnd(2,6),t=p*c;
    if(Math.random()<.5)return{tipo:"digitar",enunciado:`Reparti ${t} biscoitos igualmente em ${p} pratos. Quantos biscoitos ficaram em cada prato?`,resposta:c,visual:{tipo:"reparte",total:t,pratos:p,emoji:"🍪"},
      erro:`${t} ÷ ${p} = ${c}, porque ${p} × ${c} = ${t}.`};
    return{tipo:"escolha",enunciado:`Quanto é ${t} ÷ ${p}?`,resposta:c,opcoes:opcoesNum(c,[p,c+1,c-1]),erro:`${t} ÷ ${p} = ${c}, porque ${p} × ${c} = ${t}.`};
  }
};
function novaSessao(fase){
  const n=cfgF("questoesPorFase"),fila=[],vistos=new Set();let g=0;
  while(fila.length<n&&g++<300){const ex=GER[fase.gerador]();if(vistos.has(ex.enunciado))continue;vistos.add(ex.enunciado);fila.push(ex)}
  return{fase,fila,total:fila.length,feitas:0,erros:0,acertosPrimeira:0,moedas:0,estado:"pergunta",msg:""};
}
