/* Trilha de fases com três níveis (Bronze, Prata e Ouro), exercícios, recompensas e tentativas por nível. */
const NIVEIS=["bronze","prata","ouro"],NOME_N={bronze:"Bronze",prata:"Prata",ouro:"Ouro"},ICN={bronze:"🥉",prata:"🥈",ouro:"🥇"};
const ROT_ESTADO={bloqueado:"🔒 Bloqueado",disponivel:"▶ Disponível",concluido:"✅ Concluído",refazer:"🔁 Refazer"};

/* resultado salvo de um nível: {ok,perfeito,vezes,melhor}. Lê também o formato do lote anterior (fase única = Bronze). */
function infoNivel(f,n){
  const r=S.fases&&S.fases[f.id];if(!r)return null;
  if(r.niveis&&r.niveis[n])return r.niveis[n];
  if(n==="bronze"&&r.ok&&!r.niveis)return{ok:true,perfeito:!!r.perfeita,vezes:r.vezes||1};
  return null;
}
/* bloqueado | disponivel | concluido (sem erros) | refazer (concluído com erros) */
function estadoNivel(f,n){
  const i=NIVEIS.indexOf(n),inf=infoNivel(f,n);let aberto;
  if(i===0)aberto=faseLiberada(f);else{const ant=infoNivel(f,NIVEIS[i-1]);aberto=!!(ant&&ant.ok&&ant.perfeito)}
  if(!aberto)return"bloqueado";
  if(inf&&inf.ok)return inf.perfeito?"concluido":"refazer";
  return"disponivel";
}
/* tentativas: no máximo cfgF("tentativasFaseDia") por dia PARA CADA NÍVEL de cada fase */
const chaveT=(id,n)=>id+":"+n;
const tentativasNivel=(id,n)=>S.tentNivel&&S.tentNivel.dia===hoje()?(S.tentNivel.c[chaveT(id,n)]||0):0;
const restantesNivel=(id,n)=>Math.max(0,cfgF("tentativasFaseDia")-tentativasNivel(id,n));
function gastarTentativa(id,n){
  const h=hoje();if(!S.tentNivel||S.tentNivel.dia!==h)S.tentNivel={dia:h,c:{}};
  S.tentNivel.c[chaveT(id,n)]=(S.tentNivel.c[chaveT(id,n)]||0)+1;save();
}

function fases(){
  if(FS.vista==="explica")return htmlExplica();
  if(FS.vista==="exerc")return htmlExerc();
  if(FS.vista==="fim")return htmlFim();
  return htmlTrilha();
}
function posFases(){
  if(FS.vista==="explica")mostrarPasso();
  if(FS.vista==="exerc"){const i=$("#resp");if(i)i.focus();carregarFalaSessao()}
}
function sairFases(){pararAnimacoes()}
function voltarTrilha(){pararAnimacoes();FS.vista="trilha";render()}

function cartaoFase(f){
  const lib=faseLiberada(f);
  return `<div class="faseCard ${lib?"":"bl"}"><div class="fHead"><span class="ic">${f.icone}</span><span class="fTxt"><b>${f.titulo}</b><small>${f.resumo}</small></span>
  <button class="lin pm-livro" onclick="abrirExplicacao('${f.id}')" aria-label="Ver explicação">📖</button></div>
  <div class="niveis">${NIVEIS.map(n=>{const st=estadoNivel(f,n),rest=restantesNivel(f.id,n);
    return `<button class="nv ${n} ${st}" data-estado="${st}" onclick="abrirNivel('${f.id}','${n}')"><span class="nvi">${ICN[n]}</span><b>${NOME_N[n]}</b><small>${ROT_ESTADO[st]}${st!=="bloqueado"&&rest<=0?" · volte amanhã":""}</small></button>`}).join("")}</div></div>`;
}
function htmlTrilha(){
  let h=`<div class="pyriBox"><div class="pyriAv">🔥</div><div class="balao">Escolha uma fase! Cada fase tem 3 níveis: 🥉 Bronze, 🥈 Prata e 🥇 Ouro. Para passar de nível, termine sem nenhum erro. Você pode tentar cada nível ${cfgF("tentativasFaseDia")} vezes por dia.</div></div>`;
  for(const a of Object.keys(ANOS).map(Number)){
    const lib=anoLiberado(a),fs=fasesDoAno(a);
    h+=`<h2>${ANOS[a].nome}${lib?"":" 🔒"}</h2>`;
    if(!fs.length){h+=`<p class="emBreve">${lib?"As fases deste ano chegam nos próximos lotes.":"Libera quando o ano escolar for "+a+"º."}</p>`;continue}
    h+=`<div class="trilha">`+fs.map(cartaoFase).join("")+(EM_BREVE[a]||[]).map(t=>`<div class="faseCard bl"><div class="fHead"><span class="ic">🔒</span><span class="fTxt"><b>${t}</b><small>Em breve</small></span></div></div>`).join("")+`</div>`;
  }
  return h;
}
function abrirNivel(id,n){
  const f=FASES.find(x=>x.id===id);if(!f)return;const st=estadoNivel(f,n);
  if(st==="bloqueado"){toast(n==="bronze"?(anoLiberado(f.ano)?"Termine o nível Bronze da fase anterior primeiro!":"Esse ano ainda não está liberado."):"Conclua o nível anterior sem nenhum erro para liberar este!");return}
  if(restantesNivel(id,n)<=0){toast("Você já tentou este nível "+cfgF("tentativasFaseDia")+" vezes hoje. Volte amanhã!");return}
  pararAnimacoes();FS.fase=f;FS.nivel=n;FS.rot=null;FS.passo=0;
  const viu=S.fases&&S.fases[id]&&S.fases[id].viu;
  if(!viu){FS.vista="explica";render()}else iniciarNivel();
}
function abrirExplicacao(id){
  const f=FASES.find(x=>x.id===id);if(!f)return;
  if(!faseLiberada(f)){toast("Termine o nível Bronze da fase anterior primeiro!");return}
  pararAnimacoes();FS.fase=f;FS.nivel=NIVEIS.find(n=>{const s=estadoNivel(f,n);return s==="disponivel"||s==="refazer"})||"bronze";FS.rot=null;FS.passo=0;FS.vista="explica";render();
}
function iniciarNivel(){
  const f=FS.fase,n=FS.nivel;
  if(restantesNivel(f.id,n)<=0){toast("Você já tentou este nível "+cfgF("tentativasFaseDia")+" vezes hoje. Volte amanhã!");FS.vista="trilha";render();return}
  gastarTentativa(f.id,n);FS.ses=novaSessao(f,n);FS.vista="exerc";render();
}
function irExercicios(){
  pararAnimacoes();const f=FS.fase;
  if(f){const r=(S.fases=S.fases||{})[f.id]||(S.fases[f.id]={});r.viu=true;save()}
  if(estadoNivel(f,FS.nivel)==="bloqueado"){FS.nivel="bronze"}
  iniciarNivel();
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
function carregarFalaSessao(){
  const s=FS.ses;if(!s||s.fala||s.falaPedida)return;s.falaPedida=true;
  falaPokemon(S.comp,"desafio").then(t=>{s.fala=t;const e=$("#fala-pk");if(e&&t){e.textContent=t;e.parentElement.style.display="flex"}});
}
function htmlExerc(){
  const s=FS.ses,ex=s.fila[0],pct=Math.round(s.feitas/s.total*100);
  const resp=s.estado==="pergunta"
    ?(ex.tipo==="escolha"?`<div class="ops">${ex.opcoes.map(o=>`<button class="op" onclick="responderFase(${o})">${o}</button>`).join("")}</div>`
      :`<input id="resp" type="number" inputmode="numeric" autocomplete="off" aria-label="Sua resposta" onkeydown="if(event.key==='Enter')responderFase($('#resp').value)"><button class="grande" onclick="responderFase($('#resp').value)">Verificar</button>`)
    :"";
  const dica=(s.dica&&ex.dica&&s.estado==="pergunta")?`<div class="dicaBox">💡 <b>Dica:</b> ${ex.dica}</div>`:"";
  const fb=s.estado==="certo"?`<div class="fb ok">${s.msg}<button class="grande" onclick="continuarSessao()">Continuar</button></div>`
    :s.estado==="errado"?`<div class="fb err"><b>Quase!</b> A resposta certa é <b>${ex.resposta}</b>.<br>${ex.erro}<button class="grande" onclick="continuarSessao()">Continuar</button></div>`:"";
  return `<div class="faseTop"><button class="lin" onclick="voltarTrilha()">✕ Sair</button><b>${s.fase.icone} ${s.fase.titulo} · ${ICN[s.nivel]} ${NOME_N[s.nivel]}</b></div>
  <div class="barra"><i style="width:${pct}%"></i></div>
  <div class="pkFala" style="display:${s.fala?"flex":"none"}"><img src="${IMG(S.comp)}" alt=""><div class="balao" id="fala-pk">${s.fala||""}</div></div>
  <div class="tela q"><div class="enun">${ex.enunciado}</div>${visEstatico(ex.visual)}${dica}${resp}${fb}</div>`;
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
/* Regras: nível concluído com erros = “refazer”; sem erros = “concluído” e libera o próximo nível.
   Moedas e XP por acerto de primeira em todos os níveis. Bônus de 10 moedas na primeira vez que a fase é concluída (nível Ouro).
   O Pokémon só vem ao concluir o OURO sem nenhum erro (também ao repetir). */
async function concluirSessao(){
  const s=FS.ses,f=s.fase,n=s.nivel,perfeita=s.erros===0;
  const r=(S.fases=S.fases||{})[f.id]||(S.fases[f.id]={});r.niveis=r.niveis||{};
  if(!r.niveis.bronze&&r.ok)r.niveis.bronze={ok:true,perfeito:!!r.perfeita,vezes:r.vezes||1};      // migra o formato antigo
  const ant=r.niveis[n]||{vezes:0},primeiraConclusaoDaFase=(n==="ouro"&&!ant.ok);
  r.niveis[n]={ok:true,perfeito:!!(ant.perfeito||perfeita),vezes:(ant.vezes||0)+1,melhor:Math.max(ant.melhor||0,Math.round(s.acertosPrimeira/s.total*100))};
  r.ok=!!(r.niveis.bronze&&r.niveis.bronze.ok);r.vezes=(r.vezes||0)+1;
  s.bonus=0;if(primeiraConclusaoDaFase){s.bonus=cfgF("bonusFase");S.coins+=s.bonus}
  s.perfeita=perfeita;save();FS.vista="fim";render();
  if(n==="ouro"&&perfeita)await capturar("Ouro sem nenhum erro! Você ganhou um Pokémon!");
}
function htmlFim(){
  const s=FS.ses,f=s.fase,n=s.nivel,i=NIVEIS.indexOf(n),prox=fasesDoAno(f.ano).find(x=>x.ordem>f.ordem);
  const proxN=NIVEIS[i+1],podeProxN=proxN&&s.perfeita&&estadoNivel(f,proxN)!=="bloqueado"&&restantesNivel(f.id,proxN)>0;
  const rest=restantesNivel(f.id,n),proxFaseOk=prox&&faseLiberada(prox)&&restantesNivel(prox.id,"bronze")>0;
  const titulo=s.perfeita?`${ICN[n]} Nível ${NOME_N[n]} perfeito!`:`${ICN[n]} Nível ${NOME_N[n]} concluído com erros`;
  const msg=s.perfeita?(n==="ouro"?"Ouro sem nenhum erro: você ganhou um Pokémon!":`Sem nenhum erro! O próximo nível foi liberado.`)
    :`Este nível fica marcado como <b>refazer</b>. Volte quando quiser! Para liberar o próximo nível, termine sem nenhum erro.`;
  return `<div class="tela"><div style="font-size:3rem">${s.perfeita?"🏆":"🔁"}</div><div class="nome">${titulo}</div><p>${msg}</p></div>
  <div class="resumoFim"><p>✅ Acertos de primeira: <b>${s.acertosPrimeira} de ${s.total}</b></p><p>❌ Erros: <b>${s.erros}</b></p><p>🪙 Moedas: <b>${s.moedas+s.bonus}</b>${s.bonus?` (inclui ${s.bonus} pela fase concluída)`:""}</p><p>Tentativas que restam hoje neste nível: <b>${rest}</b></p></div>
  ${podeProxN?`<button class="grande" onclick="abrirNivel('${f.id}','${proxN}')">Próximo nível: ${ICN[proxN]} ${NOME_N[proxN]} ▶</button>`:""}
  ${rest>0?`<button class="sec" onclick="abrirNivel('${f.id}','${n}')">Refazer este nível</button>`:""}
  ${proxFaseOk?`<button class="sec" onclick="abrirNivel('${prox.id}','bronze')">Próxima fase ▶</button>`:""}
  <button class="sec" onclick="voltarTrilha()">Voltar à trilha</button>`;
}
