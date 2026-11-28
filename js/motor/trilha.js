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
/* Cédulas e moedas: desenhos PRÓPRIOS e estilizados (não são cópias das cédulas do Banco Central), marcados com "ILUSTRAÇÃO". */
const OURO_M="#e3b53d",PRATA_M="#d5dbe2",COBRE_M="#c9783f";
const COR_NOTA={2:"#8fb4e3",5:"#b48cd9",10:"#ef7d78",20:"#f3d34c",50:"#d9955a",100:"#6fb0c9"};
/* o bicho de cada cédula, feito de formas simples; (cx,cy) é o centro do medalhão */
function bichoNota(v,cx,cy){
  const e=(rx,ry,x,y,f,extra)=>`<ellipse cx="${(cx+x).toFixed(1)}" cy="${(cy+y).toFixed(1)}" rx="${rx}" ry="${ry}" fill="${f}" stroke="#16224a" stroke-width="1.2"${extra||""}/>`,
        c=(r,x,y,f)=>`<circle cx="${(cx+x).toFixed(1)}" cy="${(cy+y).toFixed(1)}" r="${r}" fill="${f}" stroke="#16224a" stroke-width="1.2"/>`;
  const A={
    2:`${e(11,7,0,3,"#5aa05a")}${e(5,3.5,-2,2,"#3f7f3f")}${c(3.6,11,0,"#7bbf6a")}${e(2.6,1.8,-8,10,"#7bbf6a")}${e(2.6,1.8,6,10,"#7bbf6a")}`,
    5:`${e(8,5,-1,5,"#fff")}<path d="M5 4 C9 -2 6 -8 3 -10" fill="none" stroke="#16224a" stroke-width="3" transform="translate(${cx} ${cy})"/>${c(3,3,-11,"#fff")}<path d="M5 -11 L11 -10 L5 -9 Z" fill="#f2a900" stroke="#16224a" stroke-width="1" transform="translate(${cx} ${cy})"/>`,
    10:`${c(7.5,0,-2,"#d62839")}${e(4.5,9,-6,6,"#2f6fdb")}<path d="M3 -3 L11 0 L3 2 Z" fill="#f2c94c" stroke="#16224a" stroke-width="1.1" transform="translate(${cx} ${cy})"/>${c(1.5,2,-5,"#fff")}`,
    20:`${c(11,0,0,"#e8891b")}${c(7.5,0,1,"#f5b94f")}${c(2.4,-9,-8,"#e8891b")}${c(2.4,9,-8,"#e8891b")}${c(1.2,-3,0,"#16224a")}${c(1.2,3,0,"#16224a")}`,
    50:`${c(10,0,1,"#f0b848")}${c(3.2,-8,-8,"#f0b848")}${c(3.2,8,-8,"#f0b848")}${c(1.7,-4,-2,"#5a3b00")}${c(1.7,4,-2,"#5a3b00")}${c(1.4,0,5,"#5a3b00")}${c(1.1,-6,4,"#5a3b00")}${c(1.1,6,4,"#5a3b00")}`,
    100:`${e(12,6.5,-1,1,"#3d8fb0")}<path d="M10 1 L18 -6 L18 8 Z" fill="#2a6f8d" stroke="#16224a" stroke-width="1.2" transform="translate(${cx} ${cy})"/>${c(1.6,-7,-1,"#fff")}${e(4,2,-1,5,"#8ccbe0")}`
  };
  return `<g data-animal="${{2:"tartaruga",5:"garça",10:"arara",20:"mico-leão",50:"onça",100:"garoupa"}[v]||"bicho"}">${A[v]||c(8,0,0,"#cfe9d4")}</g>`;
}
function svgCedula(v,x,y){
  const w=112,h=52,cor=COR_NOTA[v]||"#cfe9d4",fs=String(v).length>=3?15.5:String(v).length===2?18:21;
  return `<g class="cedula"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${cor}" stroke="#16224a" stroke-width="3"/><rect x="${x+4}" y="${y+4}" width="${w-8}" height="${h-8}" rx="3" fill="none" stroke="#16224a" stroke-width="1.2" opacity=".4"/>`+
        `<text x="${x+8}" y="${y+14}" font-size="6.5" font-weight="800" fill="#16224a" letter-spacing="1">BRASIL</text>`+
    `<text x="${x+8}" y="${y+35}" font-size="${fs}" font-weight="800" fill="#16224a">R$ ${v}</text>`+
    `<text x="${x+8}" y="${y+45}" font-size="6.5" font-weight="800" fill="#16224a" letter-spacing="1">REAL</text>`+
    `<circle cx="${x+86}" cy="${y+24}" r="16" fill="#fff" fill-opacity=".55" stroke="#16224a" stroke-width="1.5"/>${bichoNota(v,x+86,y+24)}`+
    `<text x="${x+w-6}" y="${y+h-6}" text-anchor="end" font-size="4.6" font-weight="700" fill="#16224a" opacity=".6">ILUSTRAÇÃO</text></g>`;
}
function svgMoeda(v,cx){
  const bi=v>=100,f=bi?OURO_M:v>=50?(v===50?PRATA_M:COBRE_M):(v===10?OURO_M:COBRE_M),b=bi?"#9b7416":v===50?"#7b8794":v===10?"#9b7416":"#8a4b17";
  const miolo=bi?`<circle cx="${cx}" cy="38" r="21" fill="${PRATA_M}" stroke="#7b8794" stroke-width="2"/>`:"";
  const dig=bi?`<text x="${cx}" y="41" text-anchor="middle" font-size="22" font-weight="800" fill="#4a3000">1</text><text x="${cx}" y="53" text-anchor="middle" font-size="8.5" font-weight="800" fill="#4a3000">REAL</text>`:
    `<text x="${cx}" y="42" text-anchor="middle" font-size="20" font-weight="800" fill="#4a3000">${v}</text><text x="${cx}" y="56" text-anchor="middle" font-size="8.5" font-weight="700" fill="#4a3000">centavos</text>`;
  return `<g class="moedinha" data-v="${v}"><circle cx="${cx}" cy="38" r="31" fill="${f}" stroke="${b}" stroke-width="4"/><circle cx="${cx}" cy="38" r="28" fill="none" stroke="${b}" stroke-width="1" stroke-dasharray="2 2.2" opacity=".7"/>${miolo}${dig}</g>`;
}
/* ---- Lote C: tabelas, gráficos, urna, dado, moeda e roleta — desenhos próprios em SVG ---- */
const CORB={azul:"#3b82f6",vermelha:"#ef4444",verde:"#22b05a",amarela:"#f5c518"};
const TINTA="#16224a";
/* imagem oficial do Pokémon (arquivo em img/pokemon/); aceita o nome ("Pikachu") ou a cor do bichinho; t = tamanho */
function imgPk(q){const p=PKS.find(x=>x.nome===q||x.cor===q);return p?p.img:null}
function svgIconePk(q,x,y,t,attr){
  const im=imgPk(q);
  return im?`<g ${attr||""}><image href="${im}" x="${x}" y="${y}" width="${t}" height="${t}" preserveAspectRatio="xMidYMid meet"/></g>`
    :`<g ${attr||""}><circle cx="${x+t/2}" cy="${y+t/2}" r="${t/2-1}" fill="${/^#/.test(q)?q:"#ddd"}" stroke="${TINTA}" stroke-width="1.4"/></g>`;
}
const svgIconeSolo=q=>`<svg viewBox="0 0 26 26" role="img" aria-label="ícone" class="iconeSvg">${svgIconePk(q,1,1,24)}</svg>`;
function geoTabela(v){
  const W=320,n=v.cols.length,c0=n===2?150:112,cw=(W-16-c0)/(n-1),tH=26,hH=28,rH=28,xs=[8,8+c0],ws=[c0];
  for(let j=2;j<n;j++)xs.push(xs[j-1]+cw);for(let j=1;j<n;j++)ws.push(cw);
  return{W,H:tH+hH+v.linhas.length*rH+8,xs,ws,tH,hH,rH,y:i=>tH+hH+i*rH};
}
function svgTabela(v){
  const g=geoTabela(v),n=v.cols.length;
  const cab=v.cols.map((c,j)=>`<rect x="${g.xs[j].toFixed(1)}" y="${g.tH}" width="${g.ws[j].toFixed(1)}" height="${g.hH}" fill="${TINTA}" stroke="#fff" stroke-width="1"/><text x="${(g.xs[j]+g.ws[j]/2).toFixed(1)}" y="${g.tH+19}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#fff">${c}</text>`).join("");
  const lin=v.linhas.map((l,i)=>{const y=g.y(i),pk=PKS.find(p=>p.nome===l[0]),bg=i%2?"#fff":"#fff6d6";
    return `<g data-linha="${i}"><rect x="8" y="${y}" width="${g.W-16}" height="${g.rH}" fill="${bg}" stroke="${TINTA}" stroke-width="1.5"/>`+
      (pk?svgIconePk(pk.nome,12,y+1,26):"")+`<text x="${pk?42:14}" y="${y+19}" font-size="13.5" font-weight="700" fill="${TINTA}">${l[0]}</text>`+
      l.slice(1).map((x,j)=>`<line x1="${g.xs[j+1].toFixed(1)}" y1="${y}" x2="${g.xs[j+1].toFixed(1)}" y2="${y+g.rH}" stroke="${TINTA}" stroke-width="1.5"/><text data-celula="${i},${j}" x="${(g.xs[j+1]+g.ws[j+1]/2).toFixed(1)}" y="${y+20}" text-anchor="middle" font-size="16" font-weight="800" fill="${TINTA}">${x}</text>`).join("")+`</g>`}).join("");
  return `<svg viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="tabela: ${v.titulo}" class="tabelaSvg"><text x="${g.W/2}" y="18" text-anchor="middle" font-size="14" font-weight="800" fill="${TINTA}">${v.titulo}</text>${cab}${lin}</svg>`;
}
function svgPictograma(v){
  const n=v.itens.length,H=34+n*30+30,lin=v.itens.map((it,i)=>{const y=34+i*30;
    return `<g data-linha="${i}"><text x="8" y="${y+20}" font-size="13" font-weight="700" fill="${TINTA}">${it.nome}</text>`+
      Array.from({length:it.n},(_,k)=>svgIconePk(it.nome,100+k*26,y+1,26,'data-icone="1"')).join("")+`<line x1="8" y1="${y+29}" x2="312" y2="${y+29}" stroke="#cfd6ee" stroke-width="1"/></g>`}).join("");
  return `<svg viewBox="0 0 320 ${H}" role="img" aria-label="pictograma: ${v.titulo}" class="graficoSvg pictoSvg"><text x="160" y="20" text-anchor="middle" font-size="14" font-weight="800" fill="${TINTA}">${v.titulo}</text>${lin}`+
    `<g data-pokebola="1"><circle cx="109" cy="${H-18}" r="9" fill="#fff" stroke="${TINTA}" stroke-width="1.6"/><path d="M100 ${H-18} A9 9 0 0 1 118 ${H-18} Z" fill="#ef4444" stroke="${TINTA}" stroke-width="1.6"/><circle cx="109" cy="${H-18}" r="3" fill="#fff" stroke="${TINTA}" stroke-width="1.4"/></g><text x="124" y="${H-12}" font-size="12.5" font-weight="800" fill="${TINTA}">= cada ícone vale ${v.vale}</text></svg>`;
}
function geoColunas(v){
  const n=v.itens.length,left=44,right=312,top=34,base=166,scale=(base-top)/v.max,slot=(right-left)/n,bw=Math.min(54,slot*.6);
  return{W:320,H:240,left,right,top,base,scale,slot,bw,x:i=>left+slot*i+(slot-bw)/2,y:q=>base-q*scale};
}
function svgColunas(v){
  const g=geoColunas(v),ticks=[];for(let t=0;t<=v.max;t+=v.passo)ticks.push(t);
  const grade=ticks.map(t=>`<line x1="${g.left}" y1="${g.y(t).toFixed(1)}" x2="${g.right}" y2="${g.y(t).toFixed(1)}" stroke="${t?"#cfd6ee":TINTA}" stroke-width="${t?1:2}"/><text data-tick="1" x="${g.left-6}" y="${(g.y(t)+4).toFixed(1)}" text-anchor="end" font-size="11" font-weight="700" fill="${TINTA}">${t}</text>`).join("");
  const bar=v.itens.map((it,i)=>`<rect data-barra="${i}" x="${g.x(i).toFixed(1)}" y="${g.y(it.n).toFixed(2)}" width="${g.bw.toFixed(1)}" height="${(it.n*g.scale).toFixed(2)}" fill="${it.cor}" stroke="${TINTA}" stroke-width="2" rx="2" style="transform-box:fill-box;transform-origin:bottom"/><text x="${(g.x(i)+g.bw/2).toFixed(1)}" y="${g.base+42}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${TINTA}">${it.nome}</text>${svgIconePk(it.nome,+(g.x(i)+g.bw/2-13).toFixed(1),g.base+4,26)}`).join("");
  return `<svg viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="gráfico de colunas: ${v.titulo}" class="graficoSvg colunasSvg"><text x="${g.W/2}" y="18" text-anchor="middle" font-size="14" font-weight="800" fill="${TINTA}">${v.titulo}</text>${grade}${bar}</svg>`;
}
function geoBarras(v){
  const n=v.itens.length,left=112,right=308,top=30,rowH=34,scale=(right-left)/v.max;
  return{W:320,H:top+n*rowH+32,left,right,top,rowH,scale,base:top+n*rowH,x:q=>left+q*scale,y:i=>top+i*rowH+6};
}
function svgBarras(v){
  const g=geoBarras(v),ticks=[];for(let t=0;t<=v.max;t+=v.passo)ticks.push(t);
  const grade=ticks.map(t=>`<line x1="${g.x(t).toFixed(1)}" y1="${g.top}" x2="${g.x(t).toFixed(1)}" y2="${g.base}" stroke="${t?"#cfd6ee":TINTA}" stroke-width="${t?1:2}"/><text data-tick="1" x="${g.x(t).toFixed(1)}" y="${g.base+15}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${TINTA}">${t}</text>`).join("");
  const bar=v.itens.map((it,i)=>`<rect data-barra="${i}" x="${g.left}" y="${g.y(i)}" width="${(it.n*g.scale).toFixed(2)}" height="22" fill="${it.cor}" stroke="${TINTA}" stroke-width="2" rx="2" style="transform-box:fill-box;transform-origin:left"/><text x="106" y="${g.y(i)+16}" text-anchor="end" font-size="12" font-weight="700" fill="${TINTA}">${it.nome}</text>${svgIconePk(it.nome,4,g.y(i)-2,26)}`).join("");
  return `<svg viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="gráfico de barras: ${v.titulo}" class="graficoSvg barrasSvg"><text x="${g.W/2}" y="18" text-anchor="middle" font-size="14" font-weight="800" fill="${TINTA}">${v.titulo}</text>${grade}${bar}</svg>`;
}
/* urna: as bolinhas ficam em fileiras de até 6, de baixo para cima */
function geoUrna(n){return Array.from({length:n},(_,i)=>{const row=Math.floor(i/6),cnt=Math.min(6,n-row*6);return{x:110+(i%6-(cnt-1)/2)*24,y:146-row*23}})}
function svgUrna(bolas){
  const lista=[];bolas.forEach(b=>{for(let k=0;k<b.n;k++)lista.push(b.cor)});const pos=geoUrna(lista.length);
  const bs=lista.map((c,i)=>`<circle data-bola="${c}" cx="${pos[i].x}" cy="${pos[i].y}" r="10.5" fill="${CORB[c]}" stroke="${TINTA}" stroke-width="1.6"/><circle cx="${pos[i].x-3.5}" cy="${pos[i].y-3.5}" r="2.6" fill="#fff" opacity=".6"/>`).join("");
  return `<svg viewBox="0 0 220 176" role="img" aria-label="urna com bolinhas" class="urnaSvg"><path d="M32 40 L188 40 L204 150 Q205 166 190 166 L30 166 Q15 166 16 150 Z" fill="#e8f1ff" stroke="${TINTA}" stroke-width="4" stroke-linejoin="round"/><rect x="24" y="28" width="172" height="14" rx="6" fill="#ffd23f" stroke="${TINTA}" stroke-width="3.5"/>${bs}</svg>`;
}
const PTS_DADO={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
/* uma face do dado (caixa de 120 × 120), com os pontinhos; attr/transform opcionais */
function faceDado(n,attr){
  const pts=(PTS_DADO[n]||[4]).map(i=>`<circle data-ponto="${i}" cx="${35+(i%3)*25}" cy="${35+Math.floor(i/3)*25}" r="8" fill="${TINTA}"/>`).join("");
  return `<g ${attr||""}><rect x="10" y="10" width="100" height="100" rx="18" fill="#fff" stroke="${TINTA}" stroke-width="5"/>${pts}</g>`;
}
function svgDado(n){return `<svg viewBox="0 0 120 120" role="img" aria-label="dado" class="dadoSvg">${faceDado(n)}</svg>`}
/* o dado aberto: as 6 faces (1 a 6), 3 em cima e 3 embaixo */
function svgDadoTodos(){
  const f=[1,2,3,4,5,6].map((n,i)=>faceDado(n,`data-face="${n}" transform="translate(${(i%3)*100},${Math.floor(i/3)*100}) scale(.8)"`)).join("");
  return `<svg viewBox="0 0 300 200" role="img" aria-label="as 6 faces do dado: 1, 2, 3, 4, 5 e 6" class="dadosSvg">${f}</svg>`;
}
function svgMoedaSorte(){
  return `<svg viewBox="0 0 260 126" role="img" aria-label="moeda com cara e coroa" class="moedaSvg">`+
    `<circle cx="65" cy="56" r="46" fill="${OURO_M}" stroke="#9b7416" stroke-width="5"/><circle cx="65" cy="56" r="39" fill="none" stroke="#9b7416" stroke-width="1.5" stroke-dasharray="3 3"/>`+
    `<circle cx="65" cy="48" r="17" fill="#f6d77a" stroke="#9b7416" stroke-width="2.5"/><circle cx="59" cy="45" r="2.4" fill="#4a3000"/><circle cx="71" cy="45" r="2.4" fill="#4a3000"/><path d="M57 54 Q65 62 73 54" fill="none" stroke="#4a3000" stroke-width="2.4" stroke-linecap="round"/>`+
    `<text x="65" y="86" text-anchor="middle" font-size="12" font-weight="800" fill="#4a3000">CARA</text>`+
    `<circle cx="195" cy="56" r="46" fill="${PRATA_M}" stroke="#7b8794" stroke-width="5"/><circle cx="195" cy="56" r="39" fill="none" stroke="#7b8794" stroke-width="1.5" stroke-dasharray="3 3"/>`+
    `<polygon points="177,62 180,38 188,50 195,34 202,50 210,38 213,62" fill="#f6d77a" stroke="#7b6a2a" stroke-width="2.5" stroke-linejoin="round"/><rect x="177" y="62" width="36" height="7" rx="2" fill="#f6d77a" stroke="#7b6a2a" stroke-width="2.5"/>`+
    `<text x="195" y="86" text-anchor="middle" font-size="12" font-weight="800" fill="#33404d">COROA</text>`+
    `<text x="65" y="120" text-anchor="middle" font-size="11" font-weight="700" fill="${TINTA}">cara</text><text x="195" y="120" text-anchor="middle" font-size="11" font-weight="700" fill="${TINTA}">coroa</text></svg>`;
}
function svgRoleta(cores){
  const n=cores.length,cx=100,cy=108,r=82,pt=k=>{const a=(-90+k*360/n)*Math.PI/180;return[cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  const set=cores.map((c,i)=>{const [x1,y1]=pt(i),[x2,y2]=pt(i+1);return `<path data-setor="${i}" d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${360/n>180?1:0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${CORB[c]||"#ccc"}" stroke="#fff" stroke-width="3"/>`}).join("");
  return `<svg viewBox="0 0 200 200" role="img" aria-label="roleta com ${n} partes iguais" class="roletaSvg">${set}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${TINTA}" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="8" fill="${TINTA}"/><polygon points="92,2 108,2 100,22" fill="${TINTA}"/></svg>`;
}
function svgDinheiro(itens){
  const moeda=itens.every(i=>i.k==="moeda"),gap=moeda?68:120,W=moeda?itens.length*gap+8:Math.max(128,itens.length*gap+8),H=moeda?76:64;
  const el=itens.map((it,i)=>it.k==="moeda"?svgMoeda(it.v,8+i*gap+31):svgCedula(it.v,8+i*gap,6)).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${moeda?"moedas":"notas"}" class="${moeda?"svgMoedas":"svgNotas"}">${el}</svg>`;
}
function visEstatico(v){
  if(!v)return"";
  if(v.tipo==="figura")return `<div class="visSvg">${svgFigura(v.nome)}</div>`;
  if(v.tipo==="relogio")return `<div class="visSvg relogio">${svgRelogio(v.h,v.m)}</div>`;
  if(v.tipo==="dinheiro")return `<div class="visSvg dinheiro">${svgDinheiro(v.itens)}</div>`;
  if(v.tipo==="tabela")return `<div class="visSvg graf">${svgTabela(v)}</div>`;
  if(v.tipo==="pictograma")return `<div class="visSvg graf">${svgPictograma(v)}</div>`;
  if(v.tipo==="colunas")return `<div class="visSvg graf">${svgColunas(v)}</div>`;
  if(v.tipo==="barras")return `<div class="visSvg graf">${svgBarras(v)}</div>`;
  if(v.tipo==="urna")return `<div class="visSvg urna">${svgUrna(v.bolas)}</div>`;
  if(v.tipo==="dado")return `<div class="visSvg dado">${svgDadoTodos()}</div>`;
  if(v.tipo==="moeda")return `<div class="visSvg moeda">${svgMoedaSorte()}</div>`;
  if(v.tipo==="roleta")return `<div class="visSvg roleta">${svgRoleta(v.cores)}</div>`;
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
  for(const k of Object.keys(L.map))if(L.map[k]===j)delete L.map[k];
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
/* ---- 🪙 Dica da resposta: custa PRECO_DICA moedas, uma compra por questão; não conta como erro (medalha e Pokémon não mudam) ---- */
const PRECO_DICA=3;
function dicaTextoResp(ex){
  const base=ex.dica||"Pense com calma, passo a passo.";
  const n=ex.resposta!=null?String(ex.resposta).length:0;
  const ini=ex.tipo==="escolha"?"Tirei 2 opções que não são a resposta. ":ex.tipo==="relacionar"?"Já liguei um par certo para você. ":ex.tipo==="ordenar"?"Já coloquei o próximo número da ordem certa na fila. ":ex.din?"Escreva em reais, com vírgula e dois algarismos depois dela (reais, vírgula, centavos). ":`A resposta tem ${n} ${n===1?"algarismo":"algarismos"}. `;
  return ini+base;
}
function aplicarDicaResp(ex){
  if(ex.tipo==="escolha"){const erradas=ex.opcoes.filter(o=>o!==ex.resposta);ex.elim=embaralhar(erradas).slice(0,2)}
  else if(ex.tipo==="relacionar"){
    const L=ex.lig||(ex.lig={sel:null,map:{}}),certo=i=>L.map[i]!=null&&ex.direita[L.map[i]]===ex.pares[i].d;
    const i=ex.pares.findIndex((_,k)=>!certo(k));if(i>=0){
      const dono=j=>Object.keys(L.map).find(k=>L.map[k]===j),j=ex.direita.findIndex((d,jj)=>d===ex.pares[i].d&&(dono(jj)==null||!certo(+dono(jj))));
      if(j>=0){const o=dono(j);if(o!=null)delete L.map[o];L.map[i]=j;L.sel=null}}}
  else if(ex.tipo==="ordenar"){
    const O=ex.ord||(ex.ord={fila:[]});let k=0;while(k<O.fila.length&&ex.nums[O.fila[k]]===ex.ordemCerta[k])k++;
    O.fila=O.fila.slice(0,k);if(k<ex.nums.length-1)O.fila.push(ex.nums.findIndex((v,i)=>v===ex.ordemCerta[k]&&!O.fila.includes(i)))}
}
function comprarDica(){
  const s=FS.ses;if(!s||s.estado!=="pergunta")return;const ex=s.fila[0];
  if(ex.dicaPaga||S.coins<PRECO_DICA)return;
  S.coins-=PRECO_DICA;aplicarDicaResp(ex);ex.dicaPaga=dicaTextoResp(ex);save();bip([880,1100]);render();
}
function htmlDicaMoeda(ex){
  const pode=!ex.dicaPaga&&S.coins>=PRECO_DICA;
  return `<div class="dicaLinha"><button id="bt-dica" class="dicaMoeda" ${pode?"":"disabled"} onclick="comprarDica()" aria-label="Dica da resposta, custa ${PRECO_DICA} moedas">🪙 Dica da resposta · ${PRECO_DICA}</button></div>${ex.dicaPaga?`<div id="dica-paga" class="dicaPaga">🪙 <b>Dica:</b> ${ex.dicaPaga}</div>`:""}`;
}
function htmlResposta(ex){
  if(ex.tipo==="ordenar")return htmlOrdenar(ex);
  if(ex.tipo==="escolha")return `<div class="ops">${ex.opcoes.map(o=>`<button class="op" ${(ex.elim||[]).includes(o)?"disabled":""} onclick="responderFase(${o})">${(ex.rotulos&&ex.rotulos[o])||o}</button>`).join("")}</div>`;
  if(ex.tipo==="relacionar")return htmlRelacionar(ex);
  if(ex.din)return `<div class="dinResp">${ex.tipo==="lacuna"?"":`<span class="dinRs">R$</span>`}<input id="resp" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" aria-label="${ex.tipo==="lacuna"?"Valor que falta, em reais, com vírgula":"Sua resposta, em reais, com vírgula"}" onkeydown="if(event.key==='Enter')responderFase($('#resp').value)"></div><button class="grande" onclick="responderFase($('#resp').value)">${ex.tipo==="lacuna"?"Completar":"Verificar"}</button>`;
  return `<input id="resp" type="number" inputmode="numeric" autocomplete="off" aria-label="${ex.tipo==="lacuna"?"Número que falta":"Sua resposta"}" onkeydown="if(event.key==='Enter')responderFase($('#resp').value)"><button class="grande" onclick="responderFase($('#resp').value)">${ex.tipo==="lacuna"?"Completar":"Verificar"}</button>`;
}
function htmlExerc(){
  const s=FS.ses,ex=s.fila[0],pct=Math.round(s.feitas/s.total*100);
  const vidas=`<span class="vidas" aria-label="${s.vidas} vidas">${"❤️".repeat(s.vidas)}${"🖤".repeat(VIDAS_NIVEL-s.vidas)}</span>`;
  const resp=s.estado==="pergunta"?htmlDicaMoeda(ex)+htmlResposta(ex):"";
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
  const ex=s.fila[0],certo=(ex.din&&ex.tipo!=="escolha"?parseDin(v):Number(v))===ex.resposta;      /* dinheiro digitado: 2,30 → 230 centavos */
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
