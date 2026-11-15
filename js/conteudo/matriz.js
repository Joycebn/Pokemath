/* Matriz Matemática do 3º ao 9º ano: organização por ano e lista de fases.
   Cada ano tem suas fases em js/conteudo/anoN.js (que se registram em FASES). */
const AREAS=["Aritmética","Teoria dos Números","Álgebra","Geometria","Grandezas e Medidas","Estatística","Probabilidade","Lógica Matemática"];
const ANOS={};[3,4,5,6,7,8,9].forEach(a=>ANOS[a]={nome:a+"º ano",areas:AREAS});
const FASES=[];                                  // preenchida pelos arquivos anoN.js
const EM_BREVE={3:["Comparar e ordenar números","Tabuadas","Pares e ímpares","Sequências","Figuras geométricas","Medidas de tempo e dinheiro","Tabelas e gráficos","Acaso e probabilidade"]};
const DEF_F={anoEscolar:3,tentativasFaseDia:3,questoesPorFase:8,bonusFase:10};
const cfgF=k=>(S.cfg&&S.cfg[k]!=null)?S.cfg[k]:DEF_F[k];
const fasesDoAno=a=>FASES.filter(f=>f.ano===a).sort((x,y)=>x.ordem-y.ordem);
const anoLiberado=a=>a<=cfgF("anoEscolar");
function faseLiberada(f){
  if(!anoLiberado(f.ano))return false;
  const l=fasesDoAno(f.ano),i=l.findIndex(x=>x.id===f.id);
  return i===0||!!(S.fases&&S.fases[l[i-1].id]&&S.fases[l[i-1].id].ok);
}
