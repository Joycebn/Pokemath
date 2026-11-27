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
const restantesNivel=(id,n)=>SEM_LIMITE_TENTATIVAS?cfgF("tentativasFaseDia"):Math.max(0,cfgF("tentativasFaseDia")-tentativasNivel(id,n));
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
function voltarTrilha(){fecharLampada();pararAnimacoes();FS.vista="trilha";render()}

function cartaoFase(f){
  const lib=faseLiberada(f);
  return `<div class="faseCard ${lib?"":"bl"}"><div class="fHead"><span class="ic">${f.icone}</span><span class="fTxt"><b>${f.titulo}</b><small>${f.resumo}</small></span>
  <button class="lin pm-livro" onclick="abrirExplicacao('${f.id}')" aria-label="Ver explicação">📖</button></div>
  <div class="niveis">${NIVEIS.map(n=>{const st=estadoNivel(f,n),rest=restantesNivel(f.id,n);
    return `<button class="nv ${n} ${st}" data-estado="${st}" onclick="abrirNivel('${f.id}','${n}')"><span class="nvi">${ICN[n]}</span><b>${NOME_N[n]}</b><small>${ROT_ESTADO[st]}${st!=="bloqueado"&&rest<=0?" · volte amanhã":""}</small></button>`}).join("")}</div></div>`;
}
/* introdução (Pyri) da tela de fases */
function introTrilha(){return `<button class="lin atalhoTab" id="bt-atalho-tab" onclick="ir('estudar')">🔢 Tabuadas: ir para a aba Tabuada ▶</button><div class="pyriBox"><div class="pyriAv foto"><img src="${IMG(PYRI_ID)}" alt="Pyri"></div><div class="balao">Escolha uma fase! Cada fase tem 3 níveis: 🥉 Bronze, 🥈 Prata e 🥇 Ouro. Em cada nível você tem 2 vidas ❤️❤️. Para ir à próxima fase, termine os 3 níveis. Cada nível pode ser tentado ${cfgF("tentativasFaseDia")} vezes por dia.</div></div>`;}
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
/* ---- desenhos em SVG feitos aqui (sem imagens de terceiros): figuras, relógio, moedas e notas ---- */
function svgFigura(id){
  const aria=id==="cubo"?"cubo":(FIGURAS.find(f=>f.id===id)||{nome:id}).nome;
  if(id==="cubo")return `<svg viewBox="0 0 200 150" role="img" aria-label="cubo"><polygon points="30,60 110,60 110,140 30,140" fill="#ffd23f" stroke="#16224a" stroke-width="4" stroke-linejoin="round"/><polygon points="30,60 70,25 150,25 110,60" fill="#ffe98a" stroke="#16224a" stroke-width="4" stroke-linejoin="round"/><polygon points="110,60 150,25 150,105 110,140" fill="#e0a800" stroke="#16224a" stroke-width="4" stroke-linejoin="round"/></svg>`;
  const v=vertsFig(id,100,78,64),pts=v.map(p=>p.join(",")).join(" ");
  return `<svg viewBox="0 0 200 156" role="img" aria-label="${aria}"><polygon points="${pts}" fill="#ffd23f" stroke="#16224a" stroke-width="5" stroke-linejoin="round"/>${v.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5.5" fill="#e64a8d" stroke="#fff" stroke-width="2"/>`).join("")}</svg>`;
}
function svgRelogio(h,m){
  const ang=(h%12)*30+m*0.5,tk=Array.from({length:60},(_,i)=>{const a=i*6*Math.PI/180,r1=i%5?90:84,r2=96;return `<line x1="${(100+r1*Math.sin(a)).toFixed(1)}" y1="${(100-r1*Math.cos(a)).toFixed(1)}" x2="${(100+r2*Math.sin(a)).toFixed(1)}" y2="${(100-r2*Math.cos(a)).toFixed(1)}" stroke="#16224a" stroke-width="${i%5?1:2.5}"/>`}).join("");
  const nums=Array.from({length:12},(_,i)=>{const n=i+1,a=n*30*Math.PI/180;return `<text x="${(100+68*Math.sin(a)).toFixed(1)}" y="${(100-68*Math.cos(a)+7).toFixed(1)}" text-anchor="middle" font-size="20" font-weight="800" fill="#16224a">${n}</text>`}).join("");
  return `<svg viewBox="0 0 200 200" role="img" aria-label="relógio"><circle cx="100" cy="100" r="98" fill="#fff" stroke="#16224a" stroke-width="5"/>${tk}${nums}<line class="ph" x1="100" y1="100" x2="100" y2="52" transform="rotate(${+ang.toFixed(2)} 100 100)" stroke="#16224a" stroke-width="7" stroke-linecap="round"/><line class="pmin" x1="100" y1="100" x2="100" y2="24" transform="rotate(${m*6} 100 100)" stroke="#d62839" stroke-width="4.5" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#16224a"/></svg>`;
}
const COR_MOEDA=v=>v>=100?["#f2c94c","#b8860b"]:v>=50?["#d5dbe2","#7b8794"]:["#d98a4a","#8a4b17"],COR_NOTA={2:"#aebfd1",5:"#c3a4e6",10:"#f08a8a",20:"#f6d55c",50:"#f2a65a",100:"#7fb5e6"};
function svgDinheiro(itens){
  const moeda=itens.every(i=>i.k==="moeda"),gap=moeda?68:104,W=Math.max(120,itens.length*gap+8),H=moeda?76:64;
  const el=itens.map((it,i)=>{
    if(it.k==="moeda"){const cx=8+i*gap+31,[f,b]=COR_MOEDA(it.v);return `<g class="moedinha"><circle cx="${cx}" cy="38" r="31" fill="${f}" stroke="${b}" stroke-width="4"/><text x="${cx}" y="42" text-anchor="middle" font-size="20" font-weight="800" fill="#4a3000">${it.v}</text><text x="${cx}" y="56" text-anchor="middle" font-size="8.5" font-weight="700" fill="#4a3000">centavos</text></g>`}
    const x=8+i*gap;return `<g class="cedula"><rect x="${x}" y="8" width="94" height="48" rx="6" fill="${COR_NOTA[it.v]||"#cfe9d4"}" stroke="#16224a" stroke-width="3"/><rect x="${x+6}" y="14" width="82" height="36" rx="3" fill="none" stroke="#16224a" stroke-width="1.5" opacity=".35"/><text x="${x+47}" y="38" text-anchor="middle" font-size="19" font-weight="800" fill="#16224a">R$ ${it.v}</text></g>`}).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${moeda?"moedas":"notas"}" class="${moeda?"svgMoedas":"svgNotas"}">${el}</svg>`;
}
function visEstatico(v){
  if(!v)return"";
  if(v.tipo==="figura")return `<div class="visSvg">${svgFigura(v.nome)}</div>`;
  if(v.tipo==="relogio")return `<div class="visSvg relogio">${svgRelogio(v.h,v.m)}</div>`;
  if(v.tipo==="dinheiro")return `<div class="visSvg dinheiro">${svgDinheiro(v.itens)}</div>`;
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
  return `<div class="relGrid"><div class="relCol">${esq}</div><div class="relCol">${dir}</div></div><p class="relDica">${ex.relDica||"Toque numa conta e depois no resultado dela."}</p><button class="grande" ${tudo?"":"disabled"} onclick="verificarLig()">Verificar</button>`;
}
function ligarEsq(i){const s=FS.ses;if(!s||s.estado!=="pergunta")return;const L=s.fila[0].lig;L.sel=L.sel===i?null:i;render()}
function ligarDir(j){
  const s=FS.ses;if(!s||s.estado!=="pergunta")return;const L=s.fila[0].lig;if(L.sel==null)return;
  if(!s.fila[0].muitos)for(const k of Object.keys(L.map))if(L.map[k]===j)delete L.map[k];
  L.map[L.sel]=j;L.sel=null;render();
}
function verificarLig(){
  const s=FS.ses;if(!s||s.estado!=="pergunta")return;const ex=s.fila[0],L=ex.lig;
  if(Object.keys(L.map).length!==ex.pares.length)return;
  responderFase(ex.pares.every((p,i)=>ex.direita[L.map[i]]===p.d)?1:0);
}
/* ordenar: toca nos números na ordem; a fila aparece embaixo; dá para desfazer */
function htmlOrdenar(ex){
  const O=ex.ord||(ex.ord={fila:[]}),n=ex.nums.length,tudo=O.fila.length===n;
  const bt=ex.nums.map((v,i)=>`<button class="ordNum" ${O.fila.includes(i)?"disabled":""} onclick="ordenarNum(${i})">${v}</button>`).join("");
  const fila=O.fila.length?O.fila.map(i=>`<span class="ordPick">${ex.nums[i]}</span>`).join(`<span class="ordSep">›</span>`):`<span class="ordVazio">Sua fila aparece aqui</span>`;
  return `<div class="ordGrade">${bt}</div><div id="ord-fila" class="ordFila" aria-live="polite">${fila}</div><div class="ordAcoes"><button id="ord-desfazer" class="lin" ${O.fila.length?"":"disabled"} onclick="desfazerOrd()">↩ Desfazer</button><button id="ord-ok" class="grande" ${tudo?"":"disabled"} onclick="verificarOrd()">Verificar</button></div>`;
}
function ordenarNum(i){const s=FS.ses;if(!s||s.estado!=="pergunta")return;const O=s.fila[0].ord;if(O.fila.includes(i))return;O.fila.push(i);render()}
function desfazerOrd(){const s=FS.ses;if(!s||s.estado!=="pergunta")return;s.fila[0].ord.fila.pop();render()}
function verificarOrd(){
  const s=FS.ses;if(!s||s.estado!=="pergunta")return;const ex=s.fila[0],O=ex.ord;
  if(O.fila.length!==ex.nums.length)return;
  responderFase(O.fila.every((i,k)=>ex.nums[i]===ex.ordemCerta[k])?1:0);
}
function htmlResposta(ex){
  if(ex.tipo==="ordenar")return htmlOrdenar(ex);
  if(ex.tipo==="escolha")return `<div class="ops">${ex.opcoes.map(o=>`<button class="op" onclick="responderFase(${o})">${o}</button>`).join("")}</div>`;
  if(ex.tipo==="relacionar")return htmlRelacionar(ex);
  return `<input id="resp" type="number" inputmode="numeric" autocomplete="off" aria-label="${ex.tipo==="lacuna"?"Número que falta":"Sua resposta"}" onkeydown="if(event.key==='Enter')responderFase($('#resp').value)"><button class="grande" onclick="responderFase($('#resp').value)">${ex.tipo==="lacuna"?"Completar":"Verificar"}</button>`;
}
function htmlExerc(){
  const s=FS.ses,ex=s.fila[0],pct=Math.round(s.feitas/s.total*100);
  const vidas=`<span class="vidas" aria-label="${s.vidas} vidas">${"❤️".repeat(s.vidas)}${"🖤".repeat(VIDAS_NIVEL-s.vidas)}</span>`;
  const resp=s.estado==="pergunta"?htmlResposta(ex):"";
  const dica=s.estado==="pergunta"?botaoLampada("abrirLampadaFase()"):"";
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
  }else{s.erros++;s.vidas--;bip([220]);s.estado="errado";s.fila.push({...ex,rep:true,lig:{sel:null,map:{}},ord:{fila:[]}})}      // errar tira uma vida
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
