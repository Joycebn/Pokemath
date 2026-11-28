/* Macetes: lista, tela do macete e prática. Estado S.macetes={[id]:{dia}} (criado só quando preciso). */
let MAC=null;
const macAch=id=>MACETES.find(m=>m.id===id);
function macExplica(id,a,b){
  const c=a*b;
  if(id==="tab9")return`${a} × ${b}: 10 × ${b} = ${10*b}, menos ${b} = ${c}.`;
  if(id==="tab5")return`${a} × ${b}: 10 × ${b} = ${10*b}, a metade de ${10*b} é ${c}.`;
  if(id==="tab4")return`${a} × ${b}: o dobro de ${b} é ${2*b}, o dobro de ${2*b} é ${c}.`;
  if(id==="tab2")return`${a} × ${b}: o dobro de ${b} é ${c}.`;
  if(id==="tab3")return`${a} × ${b}: o dobro de ${b} é ${2*b}, mais ${b} = ${c}.`;
  if(id==="tab6")return`${a} × ${b}: 5 × ${b} = ${5*b}, mais ${b} = ${c}.`;
  if(id==="tab7")return`${a} × ${b}: 5 × ${b} = ${5*b} e 2 × ${b} = ${2*b}; ${5*b} + ${2*b} = ${c}.`;
  if(id==="tab8")return`${a} × ${b}: 4 × ${b} = ${4*b}, o dobro de ${4*b} é ${c}.`;
  if(id==="tab10")return`${a} × ${b}: ${b} com um zero no fim fica ${c}.`;
  if(id==="tab11")return b<10?`${a} × ${b}: repita o ${b} e fica ${c}.`:`${a} × ${b}: 100 + 10 = ${c}.`;
  return`${a} × ${b} = ${c}`;
}
function macPerguntas(id){
  const m=macAch(id);if(!m)return[];
  if(id==="medidas-comprimento"){
    const us=m.partes.map(p=>p.u),i=1+Math.floor(Math.random()*(us.length-2));
    const o1=embaralhar(us.filter(u=>u!==us[i+1]).slice(0,3).concat(us[i+1]));
    const resp3=3,o3=embaralhar([2,3,4,5]);
    return[
     {tipo:"ordem",texto:"Toque nas palavras na ordem da frase.",ordem:m.partes.map(p=>p.p),expl:"A frase é: "+m.partes.map(p=>p.p).join(" ")+"."},
     {tipo:"lacuna",texto:`Qual unidade vem logo depois de ${us[i]}?`,opcoes:o1,resp:us[i+1],expl:`Depois de ${us[i]} vem ${us[i+1]}: ${m.partes.map(p=>p.u).join(" → ")}.`},
     {tipo:"escolha",texto:"Quantos passos de km até m? (km → hm → dam → m)",opcoes:o3,resp:resp3,expl:"km → hm (1), hm → dam (2), dam → m (3): são 3 passos."}];
  }
  if(id==="acaso"){
    const P3=["certo","possível","impossível"];
    return[
     {tipo:"escolha",texto:"Uma urna só com bolinhas azuis. Tirar uma bolinha azul é...",opcoes:P3,resp:"certo",expl:"Só tem azul na urna: sempre sai azul. É certo."},
     {tipo:"escolha",texto:"Uma urna só com bolinhas azuis. Tirar uma bolinha vermelha é...",opcoes:P3,resp:"impossível",expl:"Não há nenhuma vermelha na urna. Não tem como sair: é impossível."},
     {tipo:"escolha",texto:"Uma urna com bolinhas azuis e vermelhas. Tirar uma bolinha azul é...",opcoes:P3,resp:"possível",expl:"Há azuis, mas também há vermelhas. Pode sair azul, mas não é a única: é possível."},
     {tipo:"escolha",texto:"A urna tem 6 bolinhas azuis e 2 vermelhas. Qual cor é a mais provável?",opcoes:["azul","vermelha"],resp:"azul",expl:"Quanto mais bolinhas, mais chance: 6 é maior que 2, então azul é a mais provável."}];
  }
  if(m.gerador){const qs=[],vis=new Set();let g=0;
    while(qs.length<4&&g++<80){const ex=GER[m.gerador](1,"escolha"),k=ex.chave||ex.enunciado;if(vis.has(k))continue;vis.add(k);
      const rt=ex.rotulos;      /* dinheiro: as opções aparecem como R$ 2,30 */
      qs.push({tipo:"escolha",texto:ex.enunciado,opcoes:Array.from(ex.opcoes).map(o=>rt?rt[o]:o),resp:rt?rt[ex.resposta]:ex.resposta,expl:ex.erro,visual:ex.visual})}
    return qs}
  const a=m.a,bs=embaralhar([2,3,4,5,6,7,8,9]).slice(0,5);
  return bs.map(b=>({tipo:"conta",a,b,texto:`${a} × ${b}`,opcoes:opcoes(a,b),resp:a*b,expl:macExplica(id,a,b)}));
}
function macResponder(q,ans){
  if(q.tipo==="ordem")return{ok:JSON.stringify(ans)===JSON.stringify(q.ordem),expl:q.expl};
  return{ok:String(ans)===String(q.resp),expl:q.expl};
}
function macConcluir(id){
  S.macetes=S.macetes||{};const h=hoje();
  if(S.macetes[id]&&S.macetes[id].dia===h)return false;
  S.macetes[id]={dia:h};ganharXP(3);save();return true;
}
function macFraseHtml(m){
  return m.partes.map(p=>p.p.split(" ").map(w=>w===w.toUpperCase()&&w.length>1?`<b>${w}</b>`:`<b>${w[0]}</b>${w.slice(1)}`).join(" ")).join(" ");
}
function macetesDaFase(f){const l=[].concat((f&&f.macete)||[]);return MACETES.filter(m=>l.includes(m.id))}
function abrirMacetesFase(id){const f=FASES.find(x=>x.id===id),l=macetesDaFase(f);if(!l.length)return;MAC_VOLTA="fases";if(l.length===1)abrirMacete(l[0].id);else abrirMacetes(l.map(m=>m.id))}
let MAC_VOLTA="estudar";
function corpoMacete(m){
  const frase=m.partes?`<p class="macFrase">${macFraseHtml(m)}</p><p class="macUni">${m.partes.map(p=>`<span>${p.u}</span>`).join(" › ")}</p>`:`<p class="macFrase"><b>${m.resumo}</b></p>`;
  return frase+`<p>${m.explicacao}</p>`;
}
function abrirMacetes(ids){
  fecharFolha();if(!Array.isArray(ids))MAC_VOLTA="estudar";
  const lista=Array.isArray(ids)?MACETES.filter(m=>ids.includes(m.id)):MACETES;
  app.innerHTML=`<h2>💡 Macetes</h2><div class="info"><p>Truques para lembrar mais fácil.</p>${lista.map(m=>`<button class="lin mac" onclick="abrirMacete('${m.id}')"><span>${m.icone}</span> <b>${m.titulo}</b> <small>${m.resumo}</small>${S.macetes&&S.macetes[m.id]?" ✅":""}</button>`).join("")}</div><button class="sec" onclick="ir(MAC_VOLTA)">Voltar</button>`;
}
function abrirMacete(id){
  const m=macAch(id);if(!m)return;fecharFolha();
  app.innerHTML=`<h2>💡 Macete: ${m.titulo}</h2><div class="info"><div class="macPyri"><img src="${IMG(PYRI_ID)}" alt="Pyri"></div>${corpoMacete(m)}<button class="grande" id="mac-praticar" onclick="praticarMacete('${m.id}')">Praticar</button></div><button class="sec" onclick="abrirMacetes()">Todos os macetes</button>`;
}
function praticarMacete(id){MAC={id,qs:macPerguntas(id),i:0,sel:[]};macTela()}
function macTela(){
  const q=MAC.qs[MAC.i],m=macAch(MAC.id);let corpo;
  if(q.tipo==="ordem"){
    MAC.sel=[];
    corpo=`<p>${q.texto}</p><p class="macSeq" id="mac-seq">&nbsp;</p><div class="chips">${embaralhar(q.ordem).map(p=>`<button class="chip" data-p="${p}" onclick="macChip(this)">${p}</button>`).join("")}</div>`;
  }else{
    corpo=`<div class="${q.tipo==="escolha"?"enun":"conta"}">${q.texto}</div>${visEstatico(q.visual)}<div class="ops">${q.opcoes.map(o=>`<button class="op mop" data-v="${o}" onclick="macOp(this)">${o}</button>`).join("")}</div>`;
  }
  app.innerHTML=`<div class="info"><div class="topq"><span>${MAC.i+1} de ${MAC.qs.length}</span><span>${m.icone} ${m.titulo}</span></div><div class="barra"><i style="width:${MAC.i/MAC.qs.length*100}%"></i></div></div><div class="tela">${corpo}<div id="mac-fb"></div></div><button class="sec" onclick="abrirMacete('${m.id}')">Sair</button>`;
}
function macAcertou(q){
  bip([523,659]);
  const ult=MAC.i===MAC.qs.length-1;
  document.getElementById("mac-fb").innerHTML=`<p class="dica">✅ Isso aí! ${q.expl}</p><button class="grande" id="mac-seguinte" onclick="macSeguinte()">${ult?"Concluir":"Continuar"}</button>`;
}
function macErrou(q,reset){
  bip([220]);
  document.getElementById("mac-fb").innerHTML=`<p class="erro macErro">💡 Quase! ${q.expl} Tente de novo.</p>`;
  if(reset){MAC.sel=[];document.querySelectorAll(".chip").forEach(c=>c.disabled=false);const s=document.getElementById("mac-seq");if(s)s.innerHTML="&nbsp;"}
}
function macChip(b){
  const q=MAC.qs[MAC.i];b.disabled=true;MAC.sel.push(b.dataset.p);
  document.getElementById("mac-seq").textContent=MAC.sel.join(" ");
  if(MAC.sel.length===q.ordem.length){const r=macResponder(q,MAC.sel);r.ok?macAcertou(q):macErrou(q,true)}
}
function macOp(b){
  const q=MAC.qs[MAC.i],r=macResponder(q,b.dataset.v);
  if(r.ok){document.querySelectorAll(".mop").forEach(x=>x.disabled=true);macAcertou(q)}else{b.disabled=true;macErrou(q,false)}
}
function macSeguinte(){
  if(MAC.i<MAC.qs.length-1){MAC.i++;macTela();return}
  const novo=macConcluir(MAC.id),m=macAch(MAC.id);
  app.innerHTML=`<div class="info"><h2>🎉 Macete concluído!</h2><div class="macPyri"><img src="${IMG(PYRI_ID)}" alt="Pyri"></div><p>${novo?"Você ganhou um pouco de XP por praticar hoje!":"Praticar de novo ajuda a fixar! (O XP deste macete já foi ganho hoje.)"}</p><button class="grande" onclick="praticarMacete('${m.id}')">Praticar outra vez</button></div><button class="sec" onclick="abrirMacetes()">Todos os macetes</button>`;
}

/* ---------- Lâmpada 💡: o macete aparece só se a criança tocar (no lugar da dica escrita) ---------- */
const ORDEM_TAB=[9,6,8,7,4,3,5,10,11,2];
function macetePorFatores(fat){const l=fat||[];for(const n of ORDEM_TAB)if(l.includes(n)&&macAch("tab"+n))return macAch("tab"+n);return null}
function macetePara(f,ex){
  const l=macetesDaFase(f);if(l.length<=1)return l[0]||null;
  const t=macetePorFatores(ex&&ex.fat);return t&&l.includes(t)?t:l[0];
}
const botaoLampada=(fn,solto)=>`<button class="lampada ${solto?"lampadaIn":""}" id="bt-lamp" aria-label="Abrir o macete (dica)" onclick="${fn}">💡</button>`;
function fecharLampada(){const e=document.getElementById("lampada");if(e)e.remove()}
function abrirLampada(m,lembrete){
  fecharLampada();
  const d=document.createElement("div");d.id="lampada";d.className="folhaFundo";
  d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-label",m?"Macete: "+m.titulo:"Lembrete");
  d.innerHTML=`<div class="folha lamp"><div class="folhaTopo fHead"><span class="ic">💡</span><span class="fTxt"><b>${m?"Macete: "+m.titulo:"Lembrete"}</b></span><button class="lin fecha" aria-label="Fechar" onclick="fecharLampada()">✕</button></div>
  <div class="lampCorpo"><div class="macPyri"><img src="${IMG(PYRI_ID)}" alt="Pyri"></div>${m?corpoMacete(m):`<p class="macFrase"><b>Lembrete</b></p><p>${lembrete||"Pense com calma, passo a passo."}</p>`}<button class="grande" id="lamp-ok" onclick="fecharLampada()">Entendi</button></div></div>`;
  d.addEventListener("click",e=>{if(e.target===d)fecharLampada()});
  document.body.appendChild(d);const b=d.querySelector("#lamp-ok");if(b)b.focus();
}
function abrirLampadaFase(){const s=FS.ses;if(!s||!s.fila[0])return;const ex=s.fila[0];abrirLampada(macetePara(s.fase,ex),ex.dica)}
function abrirLampadaTab(a,b){abrirLampada(macetePorFatores([a,b]),dicaTexto(a,b))}
