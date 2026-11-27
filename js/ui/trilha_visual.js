/* Visual da trilha de fases: cada ANO é uma zona; cada FASE é um círculo (tijolo) no caminho; tocar no círculo abre a folha com os
   3 níveis (Bronze, Prata e Ouro). Aqui só se DESENHA: as regras (vidas, tentativas, liberação) continuam em trilha.js e matriz.js.
   Nada novo é gravado: o estado do círculo é calculado a partir dos 3 níveis. */
const MEDALHA={bronze:"🥉",prata:"🥈",ouro:"🥇"};
const ROT_CIRC={bloqueado:"bloqueada",disponivel:"disponível",concluido:"concluída",refazer:"para refazer"};

/* situação da fase inteira, a partir dos 3 níveis */
function estadoFase(f){
  const e=NIVEIS.map(n=>estadoNivel(f,n));
  if(e[0]==="bloqueado")return"bloqueado";
  if(e[2]==="concluido")return"concluido";
  if(e.includes("refazer"))return"refazer";
  return"disponivel";
}
/* melhor medalha já conquistada na fase (ou "") */
function medalhaFase(f){let m="";NIVEIS.forEach(n=>{if(estadoNivel(f,n)==="concluido")m=MEDALHA[n]});return m}
/* o ano está completo quando todas as fases existentes têm o Ouro e não há fase "em breve" pendente */
function anoCompleto(a){const fs=fasesDoAno(a);return fs.length>0&&!(EM_BREVE[a]||[]).length&&fs.every(f=>estadoFase(f)==="concluido")}

/* pos = [x%,y%] quando a zona é ilustrada (círculo sobre a imagem); sem pos, vai no caminho em zigue-zague */
const classePos=(i,pos)=>pos?(pos[0]>50?"esq":"dir"):`l${i%4}`;
const estiloPos=pos=>pos?` style="left:${pos[0]}%;top:${pos[1]}%"`:"";
function noCirculo(f,i,pos){
  const st=estadoFase(f),m=medalhaFase(f);
  return `<li class="no ${classePos(i,pos)} ${st==="concluido"?"feito":""}"${estiloPos(pos)}><button class="circulo ${st}" data-fase="${f.id}" data-estado="${st}" aria-label="${f.titulo}, ${ROT_CIRC[st]}" onclick="abrirFolhaFase('${f.id}')"><span class="ic">${f.icone}</span>${st==="bloqueado"?`<span class="cad">🔒</span>`:""}${m?`<span class="medalha">${m}</span>`:""}</button><span class="tit">${f.titulo}</span></li>`;
}
function noEmBreve(t,i,pos){
  /* na zona ilustrada os "em breve" são só cadeados (o nome fica no rótulo e no title) para não cobrir a trilha da imagem */
  return `<li class="no ${classePos(i,pos)}"${estiloPos(pos)}><button class="circulo embreve" disabled title="${t} (em breve)" aria-label="${t}, em breve"><span class="ic">🔒</span></button>${pos?"":`<span class="tit">${t} <small>(em breve)</small></span>`}</li>`;
}
function portalZona(a){
  const z=ZONAS[a],ok=anoCompleto(a);
  return `<div class="portal" data-lendario="${z.lendario.id}" data-completo="${ok?1:0}"><img class="sil ${ok?"":"escura"}" src="${IMG(z.lendario.id)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
  <span>${ok?`✅ Zona concluída! Em breve <b>${z.lendario.nome}</b> será seu.`:`Conclua todas as fases do ano para receber <b>${z.lendario.nome}</b>.`}</span></div>`;
}
function htmlZona(a){
  const z=ZONAS[a],lib=anoLiberado(a),fs=fasesDoAno(a),brev=EM_BREVE[a]||[];
  const ilus=!!(z.fundo&&z.pontos&&fs.length&&z.pontos.length>=fs.length+brev.length);   // faltou ponto para alguma fase → volta ao degradê (nunca esconde fase)
  let h=`<section class="zona z${a} ${ilus?"ilus":""} ${lib?"":"bloq"}" data-ano="${a}" style="--z1:${z.cor1};--z2:${z.cor2}${ilus?`;background-image:url(${z.fundo})`:""}"><h2>${z.emoji} ${ANOS[a].nome} · ${z.nome}${lib?"":" 🔒"}</h2>`;
  if(!fs.length)h+=`<p class="emBreve">${lib?"As fases deste ano chegam nos próximos lotes.":"Libera quando o ano escolar for "+a+"º."}</p>`;
  else{
    if(!lib)h+=`<p class="emBreve">Libera quando o ano escolar for ${a}º.</p>`;
    h+=ilus?`<ol class="caminho caminhoI">`+fs.map((f,i)=>noCirculo(f,i,z.pontos[i])).join("")+brev.map((t,i)=>noEmBreve(t,fs.length+i,z.pontos[fs.length+i])).join("")+`</ol>`
           :`<ol class="caminho">`+fs.map((f,i)=>noCirculo(f,i)).join("")+brev.map((t,i)=>noEmBreve(t,fs.length+i)).join("")+`</ol>`;
  }
  return h+portalZona(a)+`</section>`;
}
function htmlTrilhaZonas(){
  return introTrilha()+Object.keys(ANOS).map(Number).map(htmlZona).join("");
}

/* ---------- folha com os 3 níveis: laje de pedra com 3 medalhas, no meio da tela ---------- */
const COR_MEDALHA={bronze:["#f3b88f","#b3683b","#74391b"],prata:["#ffffff","#c5c9cf","#868c96"],ouro:["#fff1a6","#f3c431","#b07808"]};
function medalhaSvg(n,trava){
  const [c1,c2,c3]=COR_MEDALHA[n],g="g-"+n+(trava?"-t":"");
  return `<svg class="medal ${n} ${trava?"trava":""}" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient></defs>
  <circle cx="50" cy="50" r="47" fill="url(#${g})" stroke="${c3}" stroke-width="2"/><circle cx="50" cy="50" r="38" fill="none" stroke="${c1}" stroke-opacity=".85" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="${c3}" stroke-opacity=".35" stroke-width="1" transform="translate(1.5 1.5)"/>
  <path d="M37 24 L50 40 L63 24 L63 38 L50 54 L37 38Z" fill="${c2}" stroke="${c3}" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="55" r="13" fill="none" stroke="${c3}" stroke-width="4"/><circle cx="50" cy="55" r="13" fill="none" stroke="${c1}" stroke-opacity=".6" stroke-width="1.5" transform="translate(-1 -1)"/>
  <path d="M41 67 L34 83 L45 78 L50 85 L55 78 L66 83 L59 67Z" fill="${c2}" stroke="${c3}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
const FOLHA_SVG=`<svg class="folhagem %C" viewBox="0 0 40 40" aria-hidden="true"><path d="M3 37C3 15 17 4 37 3C37 25 24 37 3 37Z" fill="#58b552"/><path d="M5 35L31 9" stroke="#2f7d32" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M13 27L13 17M21 20L29 20" stroke="#2f7d32" stroke-width="1.5" fill="none"/></svg>`;
const laje=miolo=>`<div class="laje">${["a","b","c","d","e","f"].map(c=>FOLHA_SVG.replace("%C","f"+c)).join("")}${miolo}</div>`;
const SELO={concluido:`<span class="selo ok" aria-hidden="true">✔</span>`,bloqueado:`<span class="selo trava" aria-hidden="true">🔒</span>`,refazer:`<span class="selo refaz" aria-hidden="true">🔁</span>`,disponivel:""};
const ROT_ACESSO={bloqueado:"bloqueado",disponivel:"disponível",concluido:"concluído",refazer:"para refazer"};
function fecharFolha(){const e=document.getElementById("folha");if(e)e.remove()}
function abrirFolhaFase(id){
  const f=FASES.find(x=>x.id===id);if(!f)return;
  fecharFolha();
  const lib=faseLiberada(f);
  const medalhas=lib?NIVEIS.map(n=>{const st=estadoNivel(f,n),rest=restantesNivel(f.id,n);
    return `<button class="nv ${n} ${st}" data-estado="${st}" aria-label="${NOME_N[n]}, ${ROT_ACESSO[st]}" onclick="abrirNivel('${f.id}','${n}')">${medalhaSvg(n)}${SELO[st]}<span class="leg"><b>${NOME_N[n]}</b><small>${ROT_ESTADO[st]}${st!=="bloqueado"&&rest<=0?" · volte amanhã":""}</small></span></button>`}).join("")
    :NIVEIS.map(n=>`<div class="nvTrava" aria-hidden="true">${medalhaSvg(n,true)}</div>`).join("");
  const d=document.createElement("div");d.id="folha";d.className="folhaFundo";
  d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-label",f.titulo);
  d.innerHTML=`<div class="folha"><div class="folhaTopo fHead"><span class="ic">${f.icone}</span><span class="fTxt"><b>${f.titulo}</b><small>${f.resumo}</small></span>${f.macete?`<button class="lin pm-macete" aria-label="Ver macete" onclick="abrirMacete('${f.macete}')">💡</button>`:""}${lib?`<button class="lin pm-livro" onclick="abrirExplicacao('${f.id}')" aria-label="Ver explicação">📖</button>`:""}<button class="lin fecha" aria-label="Fechar" onclick="fecharFolha()">✕</button></div>
    ${laje(medalhas)}
    ${lib?"":`<p class="aviso folhaAviso">${anoLiberado(f.ano)?"Termine os 3 níveis da fase anterior primeiro!":"Esse ano ainda não está liberado."}</p>`}</div>`;
  d.addEventListener("click",e=>{if(e.target===d)fecharFolha()});
  document.body.appendChild(d);
  const b=d.querySelector(".nv:not(.bloqueado)")||d.querySelector(".fecha");if(b)b.focus();
}
document.addEventListener("keydown",e=>{if(e.key==="Escape")fecharFolha()});

/* ao abrir a aba, leva a trilha até a fase em que a criança está (a primeira disponível ou para refazer) */
function rolarTrilha(){
  const c=document.querySelector("button.circulo.disponivel,button.circulo.refazer");
  if(c&&c.scrollIntoView)c.scrollIntoView({block:"center"});
}
