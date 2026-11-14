/* Trilha de fases, exercícios, recompensas e tentativas por dia. */
const tentativasHoje=()=>S.tentFase&&S.tentFase.dia===hoje()?S.tentFase.n:0;
const tentativasRestantes=()=>Math.max(0,cfgF("tentativasFaseDia")-tentativasHoje());

function fases(){
  if(FS.vista==="explica")return htmlExplica();
  if(FS.vista==="exerc")return htmlExerc();
  if(FS.vista==="fim")return htmlFim();
  return htmlTrilha();
}
function posFases(){if(FS.vista==="explica")mostrarPasso();const i=$("#resp");if(i)i.focus()}
function sairFases(){FS.tok++}
function voltarTrilha(){FS.tok++;FS.vista="trilha";render()}

function estadoFase(f){
  const r=S.fases&&S.fases[f.id];
  if(r&&r.perfeita)return"perf";if(r&&r.ok)return"ok";return faseLiberada(f)?"ab":"bl";
}
function htmlTrilha(){
  const rest=tentativasRestantes();
  let h=`<div class="pyriBox"><div class="pyriAv">🔥</div><div class="balao">Escolha uma fase! Hoje você ainda pode tentar <b>${rest}</b> ${rest===1?"fase":"fases"}.</div></div>`;
  for(const a of Object.keys(ANOS).map(Number)){
    const lib=anoLiberado(a),fs=fasesDoAno(a);
    h+=`<h2>${ANOS[a].nome}${lib?"":" 🔒"}</h2>`;
    if(!fs.length){h+=`<p class="emBreve">${lib?"As fases deste ano chegam nos próximos lotes.":"Libera quando o ano escolar for "+a+"º."}</p>`;continue}
    h+=`<div class="trilha">`+fs.map((f,i)=>{
      const st=estadoFase(f),ic={perf:"🏆",ok:"✅",ab:"▶️",bl:"🔒"}[st];
      return `<button class="no ${st}" style="margin-left:${[0,34,60,34][i%4]}px" onclick="abrirFase('${f.id}')"><span class="ic">${f.icone}</span><span><b>${f.titulo}</b><small>${f.resumo}</small></span><span class="est">${ic}</span></button>`}).join("")
      +(EM_BREVE[a]||[]).map(t=>`<div class="no bl"><span class="ic">🔒</span><span><b>${t}</b><small>Em breve</small></span></div>`).join("")+`</div>`;
  }
  return h;
}
function abrirFase(id){
  const f=FASES.find(x=>x.id===id);
  if(!f||!faseLiberada(f)){toast(f&&!anoLiberado(f.ano)?"Esse ano ainda não está liberado.":"Conclua a fase anterior primeiro!");return}
  FS.fase=f;FS.passo=0;FS.vista="explica";render();
}
function irExercicios(){
  FS.tok++;const f=FS.fase;
  if(tentativasRestantes()<=0){toast("Você já tentou "+cfgF("tentativasFaseDia")+" fases hoje. Volte amanhã! Enquanto isso, treine a tabuada.");FS.vista="trilha";render();return}
  S.tentFase={dia:hoje(),n:tentativasHoje()+1};save();
  FS.ses=novaSessao(f);FS.vista="exerc";render();
}

/* ---- exercícios ---- */
function visEstatico(v){
  if(!v)return"";
  if(v.tipo==="conta"){const a=String(v.a),b=String(v.b),w=Math.max(a.length,b.length)+1;
    return `<pre class="contaTxt">${a.padStart(w)}\n${maisTxt(v.op)}${b.padStart(w-1)}\n${"—".repeat(w)}</pre>`}
  if(v.tipo==="iguais")return `<div class="iguais">${Array.from({length:v.grupos},()=>`<div class="cx">${v.emoji.repeat(v.cada)}</div>`).join("")}</div>`;
  if(v.tipo==="reparte")return `<div class="iguais"><div class="cx">${v.emoji.repeat(v.total)}</div></div><p class="cap">${v.pratos} pratos</p>`;
  return"";
}
function htmlExerc(){
  const s=FS.ses,ex=s.fila[0],pct=Math.round(s.feitas/s.total*100);
  const resp=s.estado==="pergunta"
    ?(ex.tipo==="escolha"?`<div class="ops">${ex.opcoes.map(o=>`<button class="op" onclick="responderFase(${o})">${o}</button>`).join("")}</div>`
      :`<input id="resp" type="number" inputmode="numeric" autocomplete="off" aria-label="Sua resposta" onkeydown="if(event.key==='Enter')responderFase($('#resp').value)"><button class="grande" onclick="responderFase($('#resp').value)">Verificar</button>`)
    :"";
  const fb=s.estado==="certo"?`<div class="fb ok">${s.msg}<button class="grande" onclick="continuarSessao()">Continuar</button></div>`
    :s.estado==="errado"?`<div class="fb err"><b>Quase!</b> A resposta certa é <b>${ex.resposta}</b>.<br>${ex.erro}<button class="grande" onclick="continuarSessao()">Continuar</button></div>`:"";
  return `<div class="faseTop"><button class="lin" onclick="voltarTrilha()">✕ Sair</button><b>${s.fase.icone} ${s.fase.titulo}</b></div>
  <div class="barra"><i style="width:${pct}%"></i></div>
  <div class="tela q"><div class="enun">${ex.enunciado}</div>${visEstatico(ex.visual)}${resp}${fb}</div>`;
}
function responderFase(v){
  const s=FS.ses;if(!s||s.estado!=="pergunta"||v===""||v==null)return;
  const ex=s.fila[0],certo=Number(v)===ex.resposta;
  if(certo){
    if(!ex.rep){s.acertosPrimeira++;const g=ganhar(S.cfg.moedaAcerto);s.moedas+=g;ganharXP(1);efeito(g>0?"+"+g+" 🪙":"⭐")}
    s.feitas++;conta();bip([660,880]);s.estado="certo";s.msg=`<b>${pick(["Mandou bem!","Isso aí!","Acertou!","Boa, treinadora!"])}</b> `;
  }else{s.erros++;bip([220]);s.estado="errado";s.fila.push({...ex,rep:true})}
  render();
}
function continuarSessao(){
  const s=FS.ses;if(!s)return;s.fila.shift();s.estado="pergunta";
  if(!s.fila.length)concluirSessao();else render();
}
async function concluirSessao(){
  const s=FS.ses,f=s.fase,perfeita=s.erros===0;
  const r=(S.fases=S.fases||{})[f.id]||(S.fases[f.id]={vezes:0}),primeira=!r.ok;
  r.ok=true;r.vezes++;r.perfeita=!!(r.perfeita||perfeita);r.melhor=Math.max(r.melhor||0,Math.round(s.acertosPrimeira/s.total*100));
  s.bonus=0;if(primeira){s.bonus=cfgF("bonusFase");S.coins+=s.bonus}
  s.perfeita=perfeita;save();FS.vista="fim";render();
  if(perfeita)await capturar("Fase sem erros! Você ganhou um Pokémon!");
}
function htmlFim(){
  const s=FS.ses,f=s.fase,prox=fasesDoAno(f.ano).find(x=>x.ordem>f.ordem),rest=tentativasRestantes();
  return `<div class="tela"><div style="font-size:3rem">${s.perfeita?"🏆":"⭐"}</div><div class="nome">${s.perfeita?"Fase perfeita!":"Fase concluída!"}</div>
  <p>${s.perfeita?"Você não errou nenhuma e ganhou um Pokémon!":"Você terminou! Sem erros, você ganha um Pokémon. Tente de novo!"}</p></div>
  <div class="resumoFim"><p>✅ Acertos de primeira: <b>${s.acertosPrimeira} de ${s.total}</b></p><p>❌ Erros: <b>${s.erros}</b></p><p>🪙 Moedas: <b>${s.moedas+s.bonus}</b>${s.bonus?` (inclui ${s.bonus} pela fase nova)`:""}</p><p>Tentativas de hoje que restam: <b>${rest}</b></p></div>
  ${prox?`<button class="grande" onclick="abrirFase('${prox.id}')">Próxima fase ▶</button>`:""}
  ${rest>0?`<button class="sec" onclick="abrirFase('${f.id}')">Tentar esta fase de novo</button>`:""}
  <button class="sec" onclick="voltarTrilha()">Voltar à trilha</button>`;
}
