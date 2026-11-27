/* Aba Tabuada em trilha: círculos, laje com medalhas por acerto e tempo, e sessão de 10 contas. Estado da sessão: TT. */
let TT=null;
const fmtMed=x=>(Math.round(x*10)/10).toFixed(1).replace(".",",")+" s";
const fmtMeta=x=>(Number.isInteger(x)?String(x):String(x).replace(".",","))+" s";
function tabMedalhaMax(id){return tabOk(id,"ouro")?"🥇":tabOk(id,"prata")?"🥈":tabOk(id,"bronze")?"🥉":""}
function htmlTabTrilha(){
  const nos=TAB_TRILHA.map(it=>{const st=tabEstadoFase(it.id),med=tabMedalhaMax(it.id);
    return `<li class="zTabNo"><button class="circulo ${st}" data-tab="${it.id}" data-estado="${st}" aria-label="${it.titulo}, ${ROT_ACESSO[st]||st}" onclick="abrirFolhaTab('${it.id}')"><span class="ic">${it.rot}</span>${st==="bloqueado"?`<span class="cad">🔒</span>`:med?`<span class="cad">${med}</span>`:""}</button><small class="tit">${it.titulo}</small></li>`}).join("");
  return `<h2>Trilha da Tabuada</h2><div class="info zTab"><button class="lin" id="bt-mac" onclick="abrirMacetes()">💡 Macetes</button><p>Conquiste 🥉 acertando, 🥈 e 🥇 acertando rápido!</p><ol class="zTabCam">${nos}</ol></div>`;
}
function htmlEvolucao(id){
  const e=tabEvolucao(id);if(!e.sessoes.length)return`<p class="evoVazia">Faça uma sessão para ver sua evolução aqui.</p>`;
  const s=e.sessoes.slice(-10),mx=Math.max(...s.map(x=>x.media),1),W=240,H=70,n=s.length;
  const pts=s.map((x,i)=>`${n===1?W/2:8+i*(W-16)/(n-1)},${H-6-(x.media/mx)*(H-14)}`).join(" ");
  return`<div class="evo"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tempo médio das últimas sessões"><polyline points="${pts}" fill="none" stroke="#ffb703" stroke-width="3"/>${pts.split(" ").map(p=>`<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="3.5" fill="#fff"/>`).join("")}</svg><small>Melhor tempo médio: <b>${fmtMed(e.melhor)}</b> · Média geral: <b>${fmtMed(e.media)}</b> · ${e.sessoes.length} sessões</small></div>`;
}
function abrirFolhaTab(id){
  const it=tabItem(id);if(!it)return;fecharFolha();
  const lib=tabEstadoFase(id)!=="bloqueado";
  const leg={bronze:"8 de 10",prata:`9 de 10 · ≤ ${fmtMeta(tabMeta(id,"prata"))}`,ouro:`10 de 10 · ≤ ${fmtMeta(tabMeta(id,"ouro"))}`};
  const medalhas=NIVEIS.map(n=>{const st=tabEstadoNivel(id,n);
    return `<button class="nv ${n} ${st}" data-estado="${st}" ${st==="bloqueado"?"disabled":""} aria-label="${NOME_N[n]}, ${ROT_ACESSO[st]}" onclick="tabIniciar('${id}','${n}')">${medalhaSvg(n,st==="bloqueado")}${SELO[st]}<span class="leg"><b>${NOME_N[n]}</b><small>${leg[n]}</small></span></button>`}).join("");
  const d=document.createElement("div");d.id="folha";d.className="folhaFundo";
  d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-label",it.titulo);
  d.innerHTML=`<div class="folha"><div class="folhaTopo fHead"><span class="ic">${it.rot}</span><span class="fTxt"><b>${it.titulo}</b><small>Meta: ${fmtMeta(tabMeta(id,"prata"))} 🥈 · ${fmtMeta(tabMeta(id,"ouro"))} 🥇 por conta</small></span>${it.macete?`<button class="lin pm-macete" aria-label="Ver macete" onclick="abrirMacete('${it.macete}')">💡</button>`:""}<button class="lin fecha" aria-label="Fechar" onclick="fecharFolha()">✕</button></div>
  ${laje(medalhas)}${lib?"":`<p class="aviso folhaAviso">Conquiste o 🥉 da tabuada anterior primeiro!</p>`}${htmlEvolucao(id)}</div>`;
  d.addEventListener("click",e=>{if(e.target===d)fecharFolha()});
  document.body.appendChild(d);
  const b=d.querySelector(".nv:not(.bloqueado)")||d.querySelector(".fecha");if(b)b.focus();
}
function tabIniciar(id,n){
  if(tabEstadoNivel(id,n)==="bloqueado")return;
  fecharFolha();const it=tabItem(id);
  TT={id,n,it,qs:tabGerar(it),i:0,tempos:[],acertos:0,tent:0,t0:0};tabPerguntar();
}
function tabPerguntar(){
  const [a,b]=TT.qs[TT.i],escolher=TT.it.digitos===1&&S.cfg.dificuldade!=="dificil";TT.tent=0;
  app.innerHTML=`<div class="info"><div class="topq"><span>${TT.i+1} de ${TT.qs.length}</span><span>${ICN[TT.n]} ${TT.it.titulo}</span></div><div class="barra"><i style="width:${TT.i/TT.qs.length*100}%"></i></div></div>
  <div class="tela"><div class="conta">${a} × ${b}</div>
  ${escolher?`<div class="ops">${opcoes(a,b).map(o=>`<button class="op" data-v="${o}" onclick="tabResponder(${o},this)">${o}</button>`).join("")}</div>`
   :`<input id="tr" type="number" inputmode="numeric" autocomplete="off" aria-label="Sua resposta"><button class="grande" id="tr-ok" onclick="tabResponder()">Responder</button>`}
  ${botaoLampada("abrirLampadaTT()",true)}<div id="fb"></div></div><button class="sec" onclick="ir('estudar')">Sair</button>`;
  const r=document.getElementById("tr");if(r){r.focus();r.onkeydown=e=>{if(e.key==="Enter")tabResponder()}}
  TT.t0=Date.now();
}
function tabResponder(v,btn){
  if(!TT)return;
  const [a,b]=TT.qs[TT.i];
  if(v===undefined){const r=document.getElementById("tr");if(!r||r.value==="")return;v=parseInt(r.value,10)}
  const ok=v===a*b;
  if(TT.tent===0&&TT.it.digitos===1)reg(a,b,ok);
  if(ok){
    TT.tempos.push((Date.now()-TT.t0)/1000);if(TT.tent===0)TT.acertos++;
    conta();bip([523,659]);
    if(TT.i<TT.qs.length-1){TT.i++;tabPerguntar()}else tabFim();
  }else{
    TT.tent++;bip([220]);
    if(btn)btn.disabled=true;
    const r=document.getElementById("tr");if(r){r.value="";r.focus()}
    const ex=TT.it.digitos===1?`${a} × ${b} = ${a} somado ${b} vezes: ${Array(b).fill(a).join(" + ")}`:tabDecompor(a,b);
    document.getElementById("fb").innerHTML=`<p class="erro tabErro">💡 Quase! Pense assim: ${ex}. Tente de novo.</p>`;
  }
}
function tabFim(){
  const T=TT,media=Math.round(T.tempos.reduce((x,y)=>x+y,0)/T.tempos.length*10)/10;
  const antes=tabOk(T.id,T.n),r=tabRegistrar(T.id,T.n,{acertos:T.acertos,media});
  let premio=0;
  if(r.novo){premio=ganhar({bronze:5,prata:8,ouro:12}[T.n]);ganharXP({bronze:4,prata:6,ouro:10}[T.n]);toast(`${ICN[T.n]} Medalha conquistada!`)}
  save();
  const motivos=[];
  if(!r.ok){
    if(T.acertos<TAB_MIN[T.n])motivos.push(`Para ${NOME_N[T.n]} são precisos ${TAB_MIN[T.n]} de 10 de primeira (você fez ${T.acertos}).`);
    if(T.n!=="bronze"&&media>tabMeta(T.id,T.n))motivos.push(`A meta de tempo da ${NOME_N[T.n]} é ${fmtMeta(tabMeta(T.id,T.n))} por conta (média); a sua foi ${fmtMed(media)}.`);
  }
  const prox=NIVEIS[NIVEIS.indexOf(T.n)+1],podeProx=r.ok&&prox&&tabEstadoNivel(T.id,prox)!=="bloqueado";
  app.innerHTML=`<div class="info tabFim"><h2>${r.ok?`${ICN[T.n]} ${NOME_N[T.n]} conquistado!`:"⭐ Quase lá!"}</h2>
  <p><b>${T.acertos} de 10</b> de primeira</p><p>Tempo médio: <b>${fmtMed(media)}</b> por conta</p>
  ${r.ok?`<p>Medalha ${NOME_N[T.n]} ${antes?"mantida":"na conta"}${premio?` · +${premio} moedas`:""}</p>`:""}
  ${motivos.map(m=>`<p class="dica">${m}</p>`).join("")}
  ${htmlEvolucao(T.id)}
  ${podeProx?`<button class="grande" onclick="tabIniciar('${T.id}','${prox}')">Próximo nível: ${ICN[prox]} ${NOME_N[prox]} ▶</button>`:""}
  <button class="${podeProx?"sec":"grande"}" onclick="tabIniciar('${T.id}','${T.n}')">Tentar de novo</button>
  <button class="sec" onclick="ir('estudar')">Voltar à trilha</button></div>`;
}

function abrirLampadaTT(){
  if(!TT)return;const [a,b]=TT.qs[TT.i],it=TT.it;
  let m=it.macete?macAch(it.macete):null;if(!m&&it.digitos===1)m=macetePorFatores([a,b]);
  abrirLampada(m,it.digitos===1?`${a} × ${b} = ${a} somado ${b} vezes`:tabDecompor(a,b));
}
