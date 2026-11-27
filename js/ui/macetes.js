/* Macetes: lista, tela do macete e prática. Estado S.macetes={[id]:{dia}} (criado só quando preciso). */
let MAC=null;
const macAch=id=>MACETES.find(m=>m.id===id);
function macExplica(id,a,b){
  const c=a*b;
  if(id==="tab9")return`${a} × ${b}: 10 × ${b} = ${10*b}, menos ${b} = ${c}.`;
  if(id==="tab5")return`${a} × ${b}: 10 × ${b} = ${10*b}, a metade de ${10*b} é ${c}.`;
  if(id==="tab4")return`${a} × ${b}: o dobro de ${b} é ${2*b}, o dobro de ${2*b} é ${c}.`;
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
function abrirMacetes(){
  fecharFolha();
  app.innerHTML=`<h2>💡 Macetes</h2><div class="info"><p>Truques para lembrar mais fácil.</p>${MACETES.map(m=>`<button class="lin mac" onclick="abrirMacete('${m.id}')"><span>${m.icone}</span> <b>${m.titulo}</b> <small>${m.resumo}</small>${S.macetes&&S.macetes[m.id]?" ✅":""}</button>`).join("")}</div><button class="sec" onclick="ir('estudar')">Voltar</button>`;
}
function abrirMacete(id){
  const m=macAch(id);if(!m)return;fecharFolha();
  const corpo=m.partes?`<p class="macFrase">${macFraseHtml(m)}</p><p class="macUni">${m.partes.map(p=>`<span>${p.u}</span>`).join(" › ")}</p>`:`<p class="macFrase"><b>${m.resumo}</b></p>`;
  app.innerHTML=`<h2>💡 Macete: ${m.titulo}</h2><div class="info"><div class="macPyri"><img src="${IMG(PYRI_ID)}" alt="Pyri"></div>${corpo}<p>${m.explicacao}</p><button class="grande" id="mac-praticar" onclick="praticarMacete('${m.id}')">Praticar</button></div><button class="sec" onclick="abrirMacetes()">Todos os macetes</button>`;
}
function praticarMacete(id){MAC={id,qs:macPerguntas(id),i:0,sel:[]};macTela()}
function macTela(){
  const q=MAC.qs[MAC.i],m=macAch(MAC.id);let corpo;
  if(q.tipo==="ordem"){
    MAC.sel=[];
    corpo=`<p>${q.texto}</p><p class="macSeq" id="mac-seq">&nbsp;</p><div class="chips">${embaralhar(q.ordem).map(p=>`<button class="chip" data-p="${p}" onclick="macChip(this)">${p}</button>`).join("")}</div>`;
  }else{
    corpo=`<div class="conta">${q.texto}</div><div class="ops">${q.opcoes.map(o=>`<button class="op mop" data-v="${o}" onclick="macOp(this)">${o}</button>`).join("")}</div>`;
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
