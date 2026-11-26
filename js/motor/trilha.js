/* Trilha de fases com três níveis (Bronze, Prata e Ouro), vidas, exercícios variados, recompensas e tentativas por nível.
   Regras:
   - Cada nível começa com 2 vidas; cada erro tira uma. Perdeu as 2: o nível termina e deve ser refeito (não libera nada).
   - Passou de um nível (ficou com pelo menos 1 vida): libera o seguinte. A PRÓXIMA FASE só abre com os 3 níveis concluídos.
   - O Pokémon só vem ao concluir o OURO sem perder nenhuma vida (vale também ao repetir). Moedas e XP: por acerto de primeira.
   - Bronze e Prata permitem voltar à explicação durante os exercícios; o Ouro não. */
const NIVEIS=["bronze","prata","ouro"],NOME_N={bronze:"Bronze",prata:"Prata",ouro:"Ouro"},ICN={bronze:"🥉",prata:"🥈",ouro:"🥇"};
const ROT_ESTADO={bloqueado:"🔒 Bloqueado",disponivel:"▶ Disponível",concluido:"✅ Concluído",refazer:"🔁 Refazer"};

/* resultado salvo de um nível: {ok (passou),perfeito (sem perder vida),falhou,vezes,melhor}. Lê também o formato dos lotes anteriores. */
function infoNivel(f,n){
  const r=S.fases&&S.fases[f.id];if(!r)return null;
  if(r.niveis&&r.niveis[n])return r.niveis[n];
  if(n==="bronze"&&r.ok&&!r.niveis)return{ok:true,perfeito:!!r.perfeita,vezes:r.vezes||1};
  return null;
}
/* bloqueado | disponivel | concluido (passou) | refazer (perdeu as 2 vidas e ainda não passou) */
function estadoNivel(f,n){
  const i=NIVEIS.indexOf(n),inf=infoNivel(f,n);let aberto;
  if(i===0)aberto=faseLiberada(f);else{const ant=infoNivel(f,NIVEIS[i-1]);aberto=!!(ant&&ant.ok)}
  if(!aberto)return"bloqueado";
  if(inf&&inf.ok)return"concluido";
  if(inf&&inf.falhou)return"refazer";
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
function registroFase(f){
  const r=(S.fases=S.fases||{})[f.id]||(S.fases[f.id]={});
  if(!r.niveis){r.niveis={};if(r.ok)r.niveis.bronze={ok:true,perfeito:!!r.perfeita,vezes:r.vezes||1}}      // migra o formato antigo
  return r;
}

function fases(){
  if(typeof fecharFolha==="function")fecharFolha();             // a folha dos níveis nunca fica aberta por cima de outra tela
  if(FS.vista==="explica")return htmlExplica();
  if(FS.vista==="exerc")return htmlExerc();
  if(FS.vista==="fim")return htmlFim();
  return htmlTrilha();
}
function posFases(){
  if(FS.vista==="trilha"&&typeof rolarTrilha==="function")rolarTrilha();
  if(FS.vista==="explica")mostrarPasso();
  if(FS.vista==="exerc"){const i=$("#resp");if(i)i.focus();carregarFalaSessao()}
}
function sairFases(){pararAnimacoes();if(typeof fecharFolha==="function")fecharFolha()}
function voltarTrilha(){pararAnimacoes();FS.vista="trilha";render()}

function cartaoFase(f){
  const lib=faseLiberada(f);
  return `<div class="faseCard ${lib?"":"bl"}"><div class="fHead"><span class="ic">${f.icone}</span><span class="fTxt"><b>${f.titulo}</b><small>${f.resumo}</small></span>
  <button class="lin pm-livro" onclick="abrirExplicacao('${f.id}')" aria-label="Ver explicação">📖</button></div>
  <div class="niveis">${NIVEIS.map(n=>{const st=estadoNivel(f,n),rest=restantesNivel(f.id,n);
    return `<button class="nv ${n} ${st}" data-estado="${st}" onclick="abrirNivel('${f.id}','${n}')"><span class="nvi">${ICN[n]}</span><b>${NOME_N[n]}</b><small>${ROT_ESTADO[st]}${st!=="bloqueado"&&rest<=0?" · volte amanhã":""}</small></button>`}).join("")}</div></div>`;
}
/* introdução (Pyri) da tela de fases */
function introTrilha(){return `<div class="pyriBox"><div class="pyriAv">🔥</div><div class="balao">Escolha uma fase! Cada fase tem 3 níveis: 🥉 Bronze, 🥈 Prata e 🥇 Ouro. Em cada nível você tem 2 vidas ❤️❤️. Para ir à próxima fase, termine os 3 níveis. Cada nível pode ser tentado ${cfgF("tentativasFaseDia")} vezes por dia.</div></div>`;}
/* a tela das fases é a trilha por zonas (js/ui/trilha_visual.js); a lista antiga fica só como reserva se esse arquivo não carregar */
function htmlTrilha(){return typeof htmlTrilhaZonas==="function"?htmlTrilhaZonas():htmlTrilhaLista()}
function htmlTrilhaLista(){
  let h=introTrilha();
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
  if(st==="bloqueado"){toast(n==="bronze"?(anoLiberado(f.ano)?"Termine os 3 níveis da fase anterior primeiro!":"Esse ano ainda não está liberado."):"Passe do nível anterior para liberar este!");return}
  if(restantesNivel(id,n)<=0){toast("Você já tentou este nível "+cfgF("tentativasFaseDia")+" vezes hoje. Volte amanhã!");return}
  pararAnimacoes();FS.fase=f;FS.nivel=n;FS.rot=null;FS.passo=0;
  const viu=S.fases&&S.fases[id]&&S.fases[id].viu;
  if(!viu){FS.vista="explica";render()}else iniciarNivel();
}
function abrirExplicacao(id){
  const f=FASES.find(x=>x.id===id);if(!f)return;
  if(!faseLiberada(f)){toast("Termine os 3 níveis da fase anterior primeiro!");return}
  pararAnimacoes();FS.fase=f;FS.nivel=NIVEIS.find(n=>{const s=estadoNivel(f,n);return s==="disponivel"||s==="refazer"})||"bronze";FS.rot=null;FS.passo=0;FS.vista="explica";render();
}
function iniciarNivel(){
  const f=FS.fase,n=FS.nivel;
  if(restantesNivel(f.id,n)<=0){toast("Você já tentou este nível "+cfgF("tentativasFaseDia")+" vezes hoje. Volte amanhã!");FS.vista="trilha";render();return}
  gastarTentativa(f.id,n);FS.ses=novaSessao(f,n);FS.vista="exerc";render();
}
const sessaoRetomavel=()=>{const s=FS.ses;return !!(s&&s.emAndamento&&s.fase===FS.fase&&s.nivel===FS.nivel)};
function irExercicios(){
  pararAnimacoes();const f=FS.fase;
  if(f){const r=(S.fases=S.fases||{})[f.id]||(S.fases[f.id]={});r.viu=true;save()}
  if(sessaoRetomavel()){FS.vista="exerc";render();return}                 // voltou da explicação: continua de onde parou, sem gastar tentativa
  if(estadoNivel(f,FS.nivel)==="bloqueado")FS.nivel="bronze";
  iniciarNivel();
}
/* Bronze e Prata: dá para voltar à explicação durante os exercícios. No Ouro, não. */
function voltarExplicacao(){
  const s=FS.ses;if(!s||!s.emAndamento||s.nivel==="ouro")return;
  pararAnimacoes();FS.fase=s.fase;FS.nivel=s.nivel;FS.rot=null;FS.passo=0;FS.vista="explica";render();
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
function htmlRelacionar(ex){
  const L=ex.lig||(ex.lig={sel:null,map:{}}),n=ex.pares.length,tudo=Object.keys(L.map).length===n;
  const esq=ex.pares.map((p,i)=>`<button class="rel e ${L.sel===i?"sel":""} ${L.map[i]!=null?"lig c"+i:""}" onclick="ligarEsq(${i})">${p.e}</button>`).join("");
  const dir=ex.direita.map((d,j)=>{const dono=Object.keys(L.map).find(i=>L.map[i]===j);return `<button class="rel d ${dono!=null?"lig c"+dono:""}" onclick="ligarDir(${j})">${d}</button>`}).join("");
  return `<div class="relGrid"><div class="relCol">${esq}</div><div class="relCol">${dir}</div></div><p class="relDica">Toque numa conta e depois no resultado dela.</p><button class="grande" ${tudo?"":"disabled"} onclick="verificarLig()">Verificar</button>`;
}
function ligarEsq(i){const s=FS.ses;if(!s||s.estado!=="pergunta")return;const L=s.fila[0].lig;L.sel=L.sel===i?null:i;render()}
function ligarDir(j){
  const s=FS.ses;if(!s||s.estado!=="pergunta")return;const L=s.fila[0].lig;if(L.sel==null)return;
  for(const k of Object.keys(L.map))if(L.map[k]===j)delete L.map[k];
  L.map[L.sel]=j;L.sel=null;render();
}
function verificarLig(){
  const s=FS.ses;if(!s||s.estado!=="pergunta")return;const ex=s.fila[0],L=ex.lig;
  if(Object.keys(L.map).length!==ex.pares.length)return;
  responderFase(ex.pares.every((p,i)=>ex.direita[L.map[i]]===p.d)?1:0);
}
function htmlResposta(ex){
  if(ex.tipo==="escolha")return `<div class="ops">${ex.opcoes.map(o=>`<button class="op" onclick="responderFase(${o})">${o}</button>`).join("")}</div>`;
  if(ex.tipo==="relacionar")return htmlRelacionar(ex);
  return `<input id="resp" type="number" inputmode="numeric" autocomplete="off" aria-label="${ex.tipo==="lacuna"?"Número que falta":"Sua resposta"}" onkeydown="if(event.key==='Enter')responderFase($('#resp').value)"><button class="grande" onclick="responderFase($('#resp').value)">${ex.tipo==="lacuna"?"Completar":"Verificar"}</button>`;
}
function htmlExerc(){
  const s=FS.ses,ex=s.fila[0],pct=Math.round(s.feitas/s.total*100);
  const vidas=`<span class="vidas" aria-label="${s.vidas} vidas">${"❤️".repeat(s.vidas)}${"🖤".repeat(VIDAS_NIVEL-s.vidas)}</span>`;
  const resp=s.estado==="pergunta"?htmlResposta(ex):"";
  const dica=(s.dica&&ex.dica&&s.estado==="pergunta")?`<div class="dicaBox">💡 <b>Dica:</b> ${ex.dica}</div>`:"";
  const certa=ex.respTxt||ex.resposta;
  const fb=s.estado==="certo"?`<div class="fb ok">${s.msg}<button class="grande" onclick="continuarSessao()">Continuar</button></div>`
    :s.estado==="errado"?`<div class="fb err"><b>Você perdeu uma vida.</b> ${s.vidas>0?`Ainda tem ${s.vidas} ${s.vidas===1?"vida":"vidas"}!`:"Acabaram as vidas."}<br>A resposta certa é <b>${certa}</b>.<br>${ex.erro}<button class="grande" onclick="continuarSessao()">Continuar</button></div>`:"";
  const enun=ex.tipo==="lacuna"?ex.enunciado.replace("___",`<span class="lacuna">?</span>`):ex.enunciado;
  return `<div class="faseTop"><button class="lin" onclick="voltarTrilha()">✕ Sair</button><b>${s.fase.icone} ${s.fase.titulo} · ${ICN[s.nivel]} ${NOME_N[s.nivel]}</b>${vidas}</div>
  ${s.nivel!=="ouro"?`<button class="lin pm-expl" onclick="voltarExplicacao()">📖 Explicação</button>`:""}
  <div class="barra"><i style="width:${pct}%"></i></div>
  <div class="pkFala" style="display:${s.fala?"flex":"none"}"><img src="${IMG(S.comp)}" alt=""><div class="balao" id="fala-pk">${s.fala||""}</div></div>
  <div class="tela q"><div class="tipoQ">${ROTULO_Q[ex.tipo]}</div><div class="enun">${enun}</div>${visEstatico(ex.visual)}${dica}${resp}${fb}</div>`;
}
function responderFase(v){
  const s=FS.ses;if(!s||s.estado!=="pergunta"||v===""||v==null)return;
  const ex=s.fila[0],certo=Number(v)===ex.resposta;
  if(certo){
    if(!ex.rep){s.acertosPrimeira++;const g=ganhar(S.cfg.moedaAcerto);s.moedas+=g;ganharXP(1);efeito(g>0?"+"+g+" 🪙":"⭐")}
    s.feitas++;conta();bip([660,880]);s.estado="certo";s.msg=`<b>${pick(["Mandou bem!","Isso aí!","Acertou!","Boa, treinadora!"])}</b> `;
  }else{s.erros++;s.vidas--;bip([220]);s.estado="errado";s.fila.push({...ex,rep:true,lig:{sel:null,map:{}}})}      // errar tira uma vida
  render();
}
function continuarSessao(){
  const s=FS.ses;if(!s)return;s.fila.shift();s.estado="pergunta";
  if(s.vidas<=0){falharSessao();return}
  if(!s.fila.length)concluirSessao();else render();
}
/* perdeu as 2 vidas: o nível termina, fica “refazer” e não libera o seguinte nem a próxima fase */
function falharSessao(){
  const s=FS.ses,f=s.fase,n=s.nivel,r=registroFase(f);s.emAndamento=false;s.falhou=true;s.perfeita=false;s.bonus=0;
  const ant=r.niveis[n]||{vezes:0};r.niveis[n]={...ant,ok:!!ant.ok,falhou:!ant.ok,vezes:(ant.vezes||0)+1};
  r.ok=!!(r.niveis.bronze&&r.niveis.bronze.ok);save();FS.vista="fim";render();
}
/* terminou com pelo menos 1 vida: passou (libera o próximo nível). Pokémon só no Ouro sem perder nenhuma vida. */
async function concluirSessao(){
  const s=FS.ses,f=s.fase,n=s.nivel,perfeita=s.erros===0,r=registroFase(f);s.emAndamento=false;s.falhou=false;
  const ant=r.niveis[n]||{vezes:0},primeiraConclusaoDaFase=(n==="ouro"&&!ant.ok);
  r.niveis[n]={ok:true,perfeito:!!(ant.perfeito||perfeita),falhou:false,vezes:(ant.vezes||0)+1,melhor:Math.max(ant.melhor||0,Math.round(s.acertosPrimeira/s.total*100))};
  r.ok=!!(r.niveis.bronze&&r.niveis.bronze.ok);r.vezes=(r.vezes||0)+1;
  s.bonus=0;if(primeiraConclusaoDaFase){s.bonus=cfgF("bonusFase");S.coins+=s.bonus}
  s.perfeita=perfeita;save();FS.vista="fim";render();
  if(n==="ouro"&&perfeita)await capturar("Ouro sem perder nenhuma vida! Você ganhou um Pokémon!");
}
function htmlFim(){
  const s=FS.ses,f=s.fase,n=s.nivel,i=NIVEIS.indexOf(n),prox=fasesDoAno(f.ano).find(x=>x.ordem>f.ordem);
  const proxN=NIVEIS[i+1],rest=restantesNivel(f.id,n);
  const podeProxN=!s.falhou&&proxN&&estadoNivel(f,proxN)!=="bloqueado"&&restantesNivel(f.id,proxN)>0;
  const podeProxFase=!s.falhou&&prox&&faseLiberada(prox)&&restantesNivel(prox.id,"bronze")>0;
  let icone,titulo,msg;
  if(s.falhou){icone="💔";titulo=`${ICN[n]} Acabaram as vidas`;msg=`Você perdeu as 2 vidas. Este nível fica para <b>refazer</b>. Isso não libera o próximo nível nem a próxima fase. ${n==="ouro"?"":"Se quiser, revise a explicação antes de tentar de novo."}`}
  else if(s.perfeita){icone="🏆";titulo=`${ICN[n]} Nível ${NOME_N[n]} perfeito!`;msg=n==="ouro"?"Você não perdeu nenhuma vida e ganhou um Pokémon!":"Você não perdeu nenhuma vida! O próximo nível foi liberado."}
  else{icone="⭐";titulo=`${ICN[n]} Nível ${NOME_N[n]} concluído!`;msg=n==="ouro"?"Você concluiu a fase! Para ganhar o Pokémon, é preciso terminar o Ouro sem perder nenhuma vida. Quer tentar de novo?":"Você perdeu uma vida, mas passou! O próximo nível foi liberado."}
  return `<div class="tela"><div style="font-size:3rem">${icone}</div><div class="nome">${titulo}</div><p>${msg}</p></div>
  <div class="resumoFim"><p>❤️ Vidas que sobraram: <b>${s.vidas} de ${VIDAS_NIVEL}</b></p><p>✅ Acertos de primeira: <b>${s.acertosPrimeira} de ${s.total}</b></p><p>🪙 Moedas: <b>${s.moedas+s.bonus}</b>${s.bonus?` (inclui ${s.bonus} pela fase concluída)`:""}</p><p>Tentativas que restam hoje neste nível: <b>${rest}</b></p></div>
  ${podeProxN?`<button class="grande" onclick="abrirNivel('${f.id}','${proxN}')">Próximo nível: ${ICN[proxN]} ${NOME_N[proxN]} ▶</button>`:""}
  ${podeProxFase?`<button class="grande" onclick="abrirNivel('${prox.id}','bronze')">Próxima fase ▶</button>`:""}
  ${rest>0?`<button class="sec" onclick="abrirNivel('${f.id}','${n}')">${s.falhou?"Refazer este nível":"Tentar este nível de novo"}</button>`:""}
  ${s.falhou&&n!=="ouro"?`<button class="sec" onclick="abrirExplicacao('${f.id}')">📖 Ver a explicação</button>`:""}
  <button class="sec" onclick="voltarTrilha()">Voltar à trilha</button>`;
}
