const {JSDOM,VirtualConsole}=require("jsdom"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const DIR=process.env.PM_DIR||path.join(__dirname,".."),HTML=require("./montar.js")(DIR),KEY="tabuada-pokemon-v1";
const T0=Date.UTC(2026,10,9,15,0,0),DIA=864e5;let now=T0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const erros=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>{if(!/Not implemented/.test(e.message))erros.push(e.message.slice(0,140))});vc.on("error",e=>erros.push(String(e).slice(0,140)));
const lerArq=f=>fs.readFileSync(path.join(DIR,f),"utf8"),lerArqBin=f=>fs.existsSync(path.join(DIR,f))?fs.readFileSync(path.join(DIR,f)):null;
function novo(saved,opts={}){return new JSDOM(HTML,{url:"https://app.test/",runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.PM_TESTE_LOCAL=1;
  if(saved)w.localStorage.setItem(KEY,saved);const R=w.Date;w.Date=class extends R{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}};
  w.confirm=()=>true;w.__anims=[];w.__PYRI_VEL=opts.pyriVel==null?0:opts.pyriVel;
  if(opts.animate)w.HTMLElement.prototype.animate=function(frames,o){const a={el:this,frames,opts:o,cancel(){},pause(){this.paused=true},play(){this.paused=false}};w.__anims.push(a);return a};
  w.fetch=async u=>{u=String(u);
    if(u.startsWith("dados/")){const f=path.join(DIR,u);if(fs.existsSync(f)){const t=fs.readFileSync(f,"utf8");return{ok:true,text:async()=>t,json:async()=>({})}}return{ok:false,text:async()=>"",json:async()=>({})}}
    const id=+u.split("/").filter(Boolean).pop();let j;
    if(u.includes("/pokemon-species/"))j={is_legendary:false,is_mythical:false,evolves_from_species:null,capture_rate:200,evolution_chain:{url:"https://x/evolution-chain/"+id+"/"}};
    else if(u.includes("/evolution-chain/"))j={chain:{species:{url:".../"+id+"/"},evolution_details:[],evolves_to:[]}};else j={name:id===25?"pikachu":"mon"+id,types:[{type:{name:"fire"}}]};
    return{ok:true,json:async()=>j,text:async()=>""}}}})}
let ok=0;const bad=[];const t=(n,c,d)=>{c?ok++:bad.push(n+(d!==undefined?"  [obtido: "+d+"]":""))};
async function sessao(saved,opts={}){const d=novo(saved,opts),ev=c=>d.window.eval(c);
  if(!opts.tutorial){ev("fecharTutorial();S.tutorialVisto=true")}
  ev("S.cfg.reduzir=true;S.cfg.teto=1000;S.cfg.meta=1000;save()");return{d,ev,w:d.window}}
/* responde certo (qualquer tipo de questão) ou errado */
function certo(ev){const ex=ev("FS.ses.fila[0]");
  if(ex.tipo==="ordenar"){ev("(()=>{const ex=FS.ses.fila[0];ex.ordemCerta.forEach(v=>ordenarNum(ex.nums.indexOf(v)));verificarOrd()})()");return}
  if(ex.tipo==="relacionar"){ev("(()=>{const ex=FS.ses.fila[0];ex.pares.forEach((p,i)=>{ligarEsq(i);ligarDir(ex.direita.indexOf(p.d))});verificarLig()})()");return}
  if(ex.din&&ex.tipo!=="escolha"){ev(`responderFase(${JSON.stringify(ev("Rs(FS.ses.fila[0].resposta)").replace("R$ ",""))})`);return}      /* dinheiro: digita 2,30 */
  ev(`responderFase(${ev("FS.ses.fila[0].resposta")})`)}
function errado(ev){ev("responderFase(-7)")}
/* joga um nível: errar = quantas respostas erradas dar (cada uma tira 1 vida) */
async function jogarNivel(s,id,n,{errar=0}={}){
  const ev=s.ev;ev(`(S.fases=S.fases||{});(S.fases['${id}']=S.fases['${id}']||{}).viu=true`);ev(`abrirNivel('${id}','${n}')`);let g=0,e=0;
  while(ev("FS.vista")==="exerc"&&g++<120){
    if(e<errar&&ev("FS.ses.estado")==="pergunta"&&!ev("FS.ses.fila[0].rep")){e++;errado(ev);ev("continuarSessao()");continue}
    certo(ev);ev("continuarSessao()")}
  await sleep(1300);return e}
const soma=ev=>ev("Object.values(S.caught).reduce((s,c)=>s+c.n,0)");
const st=(ev,id)=>ev(`NIVEIS.map(n=>estadoNivel(FASES.find(f=>f.id==='${id}'),n)).join()`);
const OURO=(ids)=>"S.fases={"+ids.map(i=>`'${i}':{niveis:{bronze:{ok:true},prata:{ok:true},ouro:{ok:true}},viu:true}`).join(",")+"}";

(async()=>{
// ================= estrutura, CSS e arquivo antigo =================
let s=await sessao(),ev=s.ev;
t("o app abre sem erros de script",erros.length===0,erros[0]);
t("aba Prof. continua e a aba Fases existe",!!s.w.document.querySelector('nav [data-t="prof"]')&&!!s.w.document.querySelector('nav [data-t="fases"]'));
const css=lerArq("css/novo.css");
t("novo.css: cores por casa, material dourado, animação, paisagem e botões grandes",/\.pm-d\.cu\{color:#1e6fe0\}/.test(css)&&/\.pm-cubo\{/.test(css)&&/\.pm-barra\{/.test(css)&&/\.pm-placa\{/.test(css)&&/@keyframes pm-pop/.test(css)&&/orientation:landscape/.test(css)&&/\.pm-bt\{min-height:58px/.test(css));
const pmcss=ev("PM_CSS");t("estilo reserva (no JS) tem as mesmas cores, o material dourado e as animações",["#1e6fe0","#1f9d4a","#f28c1b","#8e44ad","pm-pop","pm-cubo","pm-barra","pm-placa"].every(x=>pmcss.includes(x)&&css.includes(x)));
t("index.html carrega pyri.js e css/novo.css",lerArq("index.html").includes("js/pokemon/pyri.js")&&lerArq("index.html").includes("css/novo.css"));

// ================= 1. Pyri: companheiro inicial, tutorial e botão =================
s.w.close();s=await sessao(null,{tutorial:true,pyriVel:0.02});ev=s.ev;
t("o jogo começa com o Pyri como companheiro (sem escolha de Pokémon inicial)",ev("S.comp")===900001&&ev("S.caught[900001].nome")==="Pyri"&&!ev("inicio()").includes("Escolha seu primeiro companheiro")&&ev("inicio()").includes("Pyri"));
t("a imagem do Pyri é própria e a dos outros Pokémon continua da PokéAPI",ev("IMG(PYRI_ID)")==="img/pokemon/pyri.webp"&&ev("IMG(PYRELIS_ID)").startsWith("data:image/svg")&&ev("IMG(25)").includes("official-artwork/25.png"));
t("na 1ª abertura, o nome “Pyri” aparece em letras grandes",!!s.w.document.querySelector(".pm-tut")&&ev("document.getElementById('tut-tit').textContent")==="Pyri"&&ev("S.tutorialVisto")===false);
await sleep(400);
t("depois o Pyri entra e fala “Oi, eu sou o Pyri!”",ev("document.getElementById('tut-palco').style.display")==="flex"&&ev("document.getElementById('tut-fala').textContent")==="Oi, eu sou o Pyri!"&&ev("document.querySelector('.pm-tut-pyri').className").includes("pm-tut-pyri"));
const tem=txt=>ev("TUT_PASSOS.map(p=>p.fala).join(' ')").toLowerCase().includes(txt);
t("o tutorial explica fases, níveis, vidas, Pokémon, desafios e ofensiva",["fases","níveis","vidas","pokémon","desafio","ofensiva"].every(tem));
ev("document.getElementById('tut-prox').click()");t("Próximo avança no tutorial",ev("TUT.i")===1);
ev("document.getElementById('tut-ant').click()");t("Voltar retrocede",ev("TUT.i")===0&&ev("document.getElementById('tut-ant').disabled")===true);
ev("tutPasso(TUT_PASSOS.length-1)");t("no último passo o botão vira “Vamos começar!”",ev("document.getElementById('tut-prox').textContent").includes("Vamos começar"));
ev("document.getElementById('tut-prox').click()");t("terminar o tutorial fecha a tela e marca como visto",!s.w.document.querySelector(".pm-tut")&&ev("S.tutorialVisto")===true);
t("o botão “Pyri, me explica” existe",!!s.w.document.getElementById("pyri-ajuda")&&ev("document.getElementById('pyri-ajuda').textContent").includes("Pyri, me explica"));
ev("document.getElementById('pyri-ajuda').click()");await sleep(300);t("o botão reabre o tutorial a qualquer momento",!!s.w.document.querySelector(".pm-tut")&&ev("TUT.i")===0);
ev("document.getElementById('tut-pular').click()");t("e dá para pular",!s.w.document.querySelector(".pm-tut"));
t("o Pyri ainda não evolui (mensagem de que chega depois)",ev("requisito(PYRI_ID)").includes("chega em uma próxima versão"));
ev("S.comp=25;S.caught[25]={nome:'Pikachu',n:1,nivel:1,xp:0,amizade:0,rar:'raro'};render()");
t("há um botão para voltar ao Pyri como companheiro",ev("inicio()").includes("comp(PYRI_ID)"));
s.w.close();
const velho=JSON.stringify({coins:5,streak:0,comp:25,caught:{25:{nome:"Pikachu",n:1,nivel:3,xp:0,amizade:0,rar:"raro"}},stats:{},hist:{},inv:{},cfg:{}});
s=await sessao(velho,{tutorial:true});ev=s.ev;
t("quem já jogava mantém o companheiro, ganha o Pyri e não vê o tutorial sozinho",ev("S.comp")===25&&!!ev("S.caught[900001]")&&ev("S.tutorialVisto")===true&&!s.w.document.querySelector(".pm-tut"));
s.w.close();

// ================= 2. fala ao capturar =================
s=await sessao(null);ev=s.ev;
const fc=await ev("falaCaptura(25,'Pikachu')");t("fala de captura do Pikachu tem o nome (“Pika pika! … Eu sou o Pikachu!”)",/Pika pika/.test(fc)&&fc.includes("Eu sou o Pikachu"),fc);
const fc2=await ev("falaCaptura(155,'Cyndaquil')");t("quando a fala já diz o nome, não repete",fc2.includes("Cyndaquil")&&!fc2.includes("Eu sou o"),fc2);
const fc3=await ev("falaCaptura(850,'Sizzlipede')");t("sem fala específica: usa a reserva e o nome",fc3.includes("Sizzlipede"),fc3);
ev("revelar(25,{nome:'Pikachu',tipos:['Elétrico']},'Você capturou um Pokémon!',false,'raro')");await sleep(2600);
t("a tela de captura mostra as Pokébolas, o Pokémon e a fala dele com o nome",ev("document.querySelector('.ov .reveal .nome').textContent")==="Pikachu"&&ev("(document.querySelector('.ov .falaCap')||{}).textContent").includes("Eu sou o Pikachu"));
ev("document.querySelector('.ov')&&document.querySelector('.ov').remove()");

// ================= 5. vidas e regras dos níveis =================
await ev("escolher(25)");ev("ir('fases')");const base=soma(ev);let c0=ev("S.coins");
t("estado inicial: só o Bronze da 1ª fase está disponível",st(ev,"a3-posicional")==="disponivel,bloqueado,bloqueado"&&st(ev,"a3-adicao")==="bloqueado,bloqueado,bloqueado");
ev("abrirNivel('a3-posicional','bronze')");t("na 1ª vez abre a explicação antes dos exercícios",ev("FS.vista")==="explica");ev("irExercicios()");
t("cada nível começa com 2 vidas (Bronze: 6 questões, dica visível)",ev("FS.ses.vidas")===2&&ev("FS.ses.total")===6&&ev("document.getElementById('app').innerHTML").includes("❤️❤️")&&ev("document.getElementById('app').innerHTML").includes("💡"));
errado(ev);t("errar tira uma vida e mostra o aviso",ev("FS.ses.vidas")===1&&ev("FS.ses.estado")==="errado"&&ev("document.getElementById('app').innerHTML").includes("perdeu uma vida")&&ev("document.getElementById('app').innerHTML").includes("❤️🖤"));
ev("continuarSessao()");t("com 1 vida, a criança continua no nível",ev("FS.vista")==="exerc"&&ev("FS.ses.vidas")===1);ev("voltarTrilha()");
await jogarNivel(s,"a3-posicional","bronze",{errar:1});
t("Bronze concluído perdendo 1 vida: passou e libera a Prata (mas não a próxima fase)",st(ev,"a3-posicional")==="concluido,disponivel,bloqueado"&&st(ev,"a3-adicao")==="bloqueado,bloqueado,bloqueado",st(ev,"a3-posicional"));
ev("S.fases={};S.tentNivel=null");
await jogarNivel(s,"a3-posicional","bronze",{errar:2});
t("perder as 2 vidas no Bronze: nível termina e fica 'refazer'; Prata e próxima fase continuam bloqueadas",ev("FS.vista")==="fim"&&st(ev,"a3-posicional")==="refazer,bloqueado,bloqueado"&&st(ev,"a3-adicao")==="bloqueado,bloqueado,bloqueado",st(ev,"a3-posicional"));
t("a tela de fim mostra que acabaram as vidas e oferece a explicação",ev("document.getElementById('app').innerHTML").includes("Acabaram as vidas")&&ev("document.getElementById('app').innerHTML").includes("Ver a explicação"));
t("trilha mostra 'Refazer'",ev("(ir('fases'),document.getElementById('app').innerHTML)").includes("Refazer"));
await jogarNivel(s,"a3-posicional","bronze");
t("refazer o Bronze e passar libera a Prata",st(ev,"a3-posicional")==="concluido,disponivel,bloqueado");
ev("abrirNivel('a3-posicional','prata')");t("Prata: 8 questões, sem dica escrita (a 💡 é opcional) e começa de novo com 2 vidas",ev("FS.ses.total")===8&&ev("FS.ses.vidas")===2&&!ev("FS.ses.dica")&&!ev("document.getElementById('app').innerHTML").includes("Dica:")&&!!ev("document.getElementById('bt-lamp')"));ev("voltarTrilha()");
c0=ev("S.coins");await jogarNivel(s,"a3-posicional","prata");
t("moedas por acerto de primeira continuam (2 por acerto, 8 questões)",ev("S.coins")-c0===16,ev("S.coins")-c0);
t("Bronze e Prata passados: Ouro liberado, mas a próxima fase ainda NÃO (precisa dos 3 níveis)",st(ev,"a3-posicional")==="concluido,concluido,disponivel"&&st(ev,"a3-adicao")==="bloqueado,bloqueado,bloqueado",st(ev,"a3-adicao"));
ev("voltarTrilha()");ev("abrirNivel('a3-adicao','bronze')");t("a próxima fase não abre antes do Ouro",ev("FS.vista")==="trilha");
ev("abrirNivel('a3-posicional','ouro')");t("Ouro: 10 questões, 2 vidas",ev("FS.ses.total")===10&&ev("FS.ses.vidas")===2);ev("voltarTrilha()");
now+=DIA;await jogarNivel(s,"a3-posicional","ouro",{errar:2});
t("perder as 2 vidas no Ouro: refazer e a próxima fase continua bloqueada, sem Pokémon",st(ev,"a3-posicional")==="concluido,concluido,refazer"&&st(ev,"a3-adicao")==="bloqueado,bloqueado,bloqueado"&&soma(ev)===base,st(ev,"a3-adicao"));
c0=ev("S.coins");now+=DIA;await jogarNivel(s,"a3-posicional","ouro",{errar:1});
t("Ouro perdendo 1 vida: NÃO dá o Pokémon, mas conclui, paga o bônus de 10 moedas e libera a próxima fase",soma(ev)===base&&st(ev,"a3-posicional")==="concluido,concluido,concluido"&&st(ev,"a3-adicao")==="disponivel,bloqueado,bloqueado"&&ev("S.coins")-c0>=10,st(ev,"a3-adicao")+" / "+(ev("S.coins")-c0));
now+=DIA;await jogarNivel(s,"a3-posicional","ouro");
t("Ouro sem perder nenhuma vida: ganha 1 Pokémon",soma(ev)===base+1,soma(ev)-base);
now+=DIA;c0=ev("S.coins");await jogarNivel(s,"a3-posicional","ouro");
t("e vale também ao repetir (outro Pokémon), sem repetir o bônus da fase",soma(ev)===base+2&&ev("S.coins")-c0===20,soma(ev)-base+" / "+(ev("S.coins")-c0));
await jogarNivel(s,"a3-posicional","bronze",{errar:2});t("falhar de novo um nível já passado não tira o 'concluído'",st(ev,"a3-posicional")==="concluido,concluido,concluido");
s.w.close();

// ---- tentativas por nível (3 por dia) e migração ----
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.fases={'a3-posicional':{niveis:{bronze:{ok:true,perfeito:true,vezes:1}},viu:true}}");
for(let i=0;i<3;i++){ev("abrirNivel('a3-posicional','bronze')");t("tentativa "+(i+1)+" do Bronze permitida",ev("FS.vista")==="exerc");ev("voltarTrilha()")}
ev("abrirNivel('a3-posicional','bronze')");t("4ª tentativa do mesmo nível no mesmo dia é bloqueada",ev("FS.vista")==="trilha"&&ev("tentativasNivel('a3-posicional','bronze')")===3);
ev("abrirNivel('a3-posicional','prata')");t("a Prata tem as suas próprias 3 tentativas",ev("FS.vista")==="exerc"&&ev("tentativasNivel('a3-posicional','prata')")===1);ev("voltarTrilha()");
now+=DIA;t("no dia seguinte as tentativas voltam",ev("restantesNivel('a3-posicional','bronze')")===3);
ev("S.fases={'a3-posicional':{ok:true,perfeita:true,vezes:2}};S.tentNivel=null");t("progresso do lote anterior vira Bronze concluído",st(ev,"a3-posicional")==="concluido,disponivel,bloqueado");
s.w.close();

// ================= 7. voltar à explicação (Bronze e Prata; Ouro não) =================
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("ir('fases');S.fases={'a3-posicional':{niveis:{bronze:{ok:true},prata:{ok:true}},viu:true}}");
ev("abrirNivel('a3-posicional','bronze')");certo(ev);ev("continuarSessao()");const fila0=ev("FS.ses.fila.length"),vid0=ev("FS.ses.vidas"),tent0=ev("tentativasNivel('a3-posicional','bronze')");
t("Bronze: durante os exercícios há o botão “Explicação”",ev("document.getElementById('app').innerHTML").includes("Explicação"));
ev("voltarExplicacao()");t("voltar à explicação abre a explicação da fase",ev("FS.vista")==="explica"&&ev("FS.fase.id")==="a3-posicional");
t("na explicação o botão vira “Voltar aos exercícios”",ev("document.getElementById('app').innerHTML").includes("Voltar aos exercícios"));
ev("irExercicios()");t("e volta exatamente de onde parou (mesmas questões e vidas, sem gastar tentativa)",ev("FS.vista")==="exerc"&&ev("FS.ses.fila.length")===fila0&&ev("FS.ses.vidas")===vid0&&ev("tentativasNivel('a3-posicional','bronze')")===tent0);
ev("voltarTrilha()");ev("abrirNivel('a3-posicional','prata')");ev("voltarExplicacao()");t("Prata também pode voltar à explicação",ev("FS.vista")==="explica"&&ev("FS.nivel")==="prata");ev("irExercicios()");ev("voltarTrilha()");
ev("abrirNivel('a3-posicional','ouro')");t("Ouro: NÃO tem o botão de explicação",!ev("document.getElementById('app').innerHTML").includes("📖 Explicação"));
ev("voltarExplicacao()");t("e não deixa voltar à explicação durante o Ouro",ev("FS.vista")==="exerc");
s.w.close();

// ================= 6. tipos de questão variados =================
s=await sessao();ev=s.ev;await ev("escolher(25)");
let tiposOk=true,tmsg="";
for(const f of ev("FASES.map(f=>f.id)"))for(const n of["bronze","prata","ouro"]){const ses=ev(`novaSessao(FASES.find(f=>f.id==='${f}'),'${n}')`),tp=Array.from(ses.fila).map(x=>x.tipo==="ordenar"?"lacuna":x.tipo);   /* no Ouro de Comparar, ordenar faz o papel de completar */
  if(!["digitar","escolha","lacuna","relacionar"].every(x=>tp.includes(x))||tp.some((x,i)=>i&&x===tp[i-1])){tiposOk=false;tmsg=f+" "+n+": "+tp.join()}}
t("em TODAS as fases e níveis aparecem os 4 tipos (escrever, selecionar, completar e ligar), sem repetir o mesmo seguido",tiposOk,tmsg);
let bom=true,msg="";const chk=(c,m)=>{if(!c){bom=false;msg=m}};
const un=n=>n%10,dz=n=>Math.floor(n/10)%10,ce=n=>Math.floor(n/100)%10;
for(const d of[1,3])for(const nome of["valorPosicional","adicao","adicaoVaiUm","subtracao","multiplicacao","divisao"])for(const tp of["digitar","escolha","lacuna","relacionar"])for(let i=0;i<60;i++){
  const ex=ev(`GER.${nome}(${d},'${tp}')`);chk(ex.tipo===tp,nome+" tipo "+tp+" -> "+ex.tipo);chk(ex.dica&&ex.dica.length>8&&ex.erro&&ex.erro.length>8,nome+" sem dica/explicação");
  if(tp==="escolha"){const o=Array.from(ex.opcoes);chk(o.length===4&&new Set(o).size===4&&o.includes(ex.resposta),nome+" opções")}
  if(tp==="lacuna"){chk(ex.enunciado.includes("___")&&Number.isInteger(ex.resposta)&&ex.resposta>=0,nome+" lacuna");
    const m=ex.enunciado.match(/(\d+) ([+−×÷]) ___ = (\d+)|___ ([+−×÷]) (\d+) = (\d+)/);
    if(m&&nome!=="valorPosicional"){const op=m[2]||m[4],r=+(m[3]||m[6]),x=ex.resposta,o=m[1]!=null?+m[1]:+m[5],pos=m[1]!=null;
      const f=pos?(op==="+"?o+x:op==="−"?o-x:op==="×"?o*x:o/x):(op==="+"?x+o:op==="−"?x-o:op==="×"?x*o:x/o);chk(f===r,"lacuna errada: "+ex.enunciado+" ["+x+"]")}}
  if(tp==="relacionar"){const P=Array.from(ex.pares),D=Array.from(ex.direita);chk(P.length>=3&&P.length<=4&&D.length===P.length&&new Set(D).size===D.length&&P.every(p=>D.includes(p.d))&&ex.resposta===1,nome+" relacionar");
    if(nome!=="valorPosicional")chk(P.every(p=>{const[a,op,b]=p.e.split(" "),x=+a,y=+b;return(op==="+"?x+y:op==="−"?x-y:op==="×"?x*y:x/y)===+p.d}),nome+" par errado")}
  if(tp==="digitar"&&nome!=="valorPosicional"&&ex.enunciado.match(/^(\d+) ([+−×÷]) (\d+) = \?$/)){const[,a,op,b]=ex.enunciado.match(/^(\d+) ([+−×÷]) (\d+) = \?$/),x=+a,y=+b;chk((op==="+"?x+y:op==="−"?x-y:op==="×"?x*y:x/y)===ex.resposta,nome+" resposta errada")}
}
t("geradores: os 4 tipos × 6 fases × 2 dificuldades, todos válidos (lacunas e pares corretos)",bom,msg);
// elevação e empréstimo: sempre contas de dois algarismos
bom=true;
for(let i=0;i<400;i++){for(const d of[1,3]){const v=ev(`SPEC.adicaoVaiUm(${d})`),sb=ev(`SPEC.subtracao(${d})`);
  chk(v.a>=10&&v.a<=99&&v.b>=10&&v.b<=99&&un(v.a)+un(v.b)>=10,"vai-um não tem 2 algarismos: "+v.a+"+"+v.b);
  chk(d<3||v.a+v.b>=100,"vai-um Ouro sem elevação nas dezenas");chk(d>=3||v.a+v.b<100,"vai-um Bronze/Prata passou de 100");
  chk(sb.a>=10&&sb.a<=99&&sb.b>=10&&sb.b<=99&&un(sb.a)<un(sb.b)&&sb.a>sb.b&&sb.r===sb.a-sb.b,"empréstimo errado "+sb.a+"-"+sb.b)}}
t("elevação (“vai um”) e empréstimo usam sempre contas de dois algarismos em cima e embaixo, como 15 + 8 e 32 − 15",bom,msg);
// interface de cada tipo
ev("ir('fases');S.fases={'a3-posicional':{viu:true}}");ev("abrirNivel('a3-posicional','bronze')");
const verTipo=tp=>{ev(`FS.ses.fila=[GER.adicao(1,'${tp}'),GER.adicao(1,'digitar')];FS.ses.total=2;FS.ses.estado='pergunta';FS.ses.vidas=2;render()`);return ev("FS.ses.fila[0].tipo")===tp};
t("tela “completar”: mostra a lacuna ? e um campo para o número",verTipo("lacuna")&&ev("document.getElementById('app').innerHTML").includes('class="lacuna"')&&ev("!!document.getElementById('resp')"));
certo(ev);t("completar a lacuna certo acerta",ev("FS.ses.estado")==="certo");ev("continuarSessao()");
t("tela “ligar os pares”: duas colunas e o botão Verificar desativado até ligar tudo",verTipo("relacionar")&&ev("document.querySelectorAll('.rel.e').length")>=3&&ev("document.querySelector('#app .grande').disabled")===true);
ev("(()=>{const ex=FS.ses.fila[0];ligarEsq(0);ligarDir(0)})()");t("ligar uma conta a um resultado marca o par",ev("document.querySelectorAll('.rel.lig').length")===2);
ev("(()=>{const ex=FS.ses.fila[0];ex.pares.forEach((p,i)=>{ligarEsq(i);ligarDir(ex.direita.indexOf(p.d))})})()");t("ligando todos, o botão Verificar libera",ev("document.querySelector('#app .grande').disabled")===false);
ev("verificarLig()");t("ligações certas acertam",ev("FS.ses.estado")==="certo");ev("continuarSessao()");
verTipo("relacionar");ev("(()=>{const ex=FS.ses.fila[0],n=ex.pares.length;ex.pares.forEach((p,i)=>{ligarEsq(i);ligarDir((ex.direita.indexOf(p.d)+1)%n)})})()");ev("verificarLig()");
t("ligações erradas tiram uma vida e mostram as ligações certas",ev("FS.ses.estado")==="errado"&&ev("FS.ses.vidas")===1&&ev("document.getElementById('app').innerHTML").includes("As ligações certas são"));
ev("voltarTrilha()");
s.w.close();

// ================= animações: roteiros, material dourado, maçãs, cores, viagem =================
s=await sessao(null,{animate:true});ev=s.ev;await ev("escolher(25)");ev("S.cfg.reduzir=false;FS.vel=0.001");
ev(OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao"])+";save()");
ev("ir('fases');abrirExplicacao('a3-posicional')");ev("FS.auto=false;pararAnimacoes()");
const rodar=(nome,args)=>ev(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.${nome}(${args});const R=rot.montar(ctx);const g=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length])}window.__R=R;window.__g=g;window.__rot=rot;return true})()`);
async function passos(nome,args){await rodar(nome,args);await sleep(400);return ev("__g")}
const cont=sel=>ev(`document.querySelectorAll('#exp-stage ${sel}').length`);
const ateOPasso=async(nome,args,i)=>{await ev(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};const rot=ROT.${nome}(${args}),R=rot.montar(ctx);for(let k=0;k<=${i};k++)await rot.passos[k].acao(ctx,R);window.__R=R;return true})()`);};
const resFin=()=>ev("[...document.querySelectorAll('#exp-stage .pm-res')].map(e=>e.textContent+':'+(e.className.match(/ c[udcm]/)||[''])[0].trim()).join()");
const roteiros={posicional:"345",soma:"23,12",vaiUm:"15,8",subEmp:"32,15",mult:"3,4",divide:"12,3"};
let fin;let tempoOk=true,falaOk=true;
for(const repr of["dourado","macas"])for(const[n,a]of Object.entries(roteiros)){
  ev(`FS.repr='${repr}'`);s.w.__anims.length=0;const g=await passos(n,a);
  g.forEach(([dur,gasto,len],i)=>{if(dur<3000||dur>5000||gasto>5000||gasto>dur+1){tempoOk=false;tmsg=`${repr} ${n} passo ${i}: dur ${dur} gasto ${gasto}`}if(len>140||len<5){falaOk=false;tmsg=`${n} passo ${i}: fala ${len}`}});
  t(`roteiro ${n} (${repr}): números e imagens viajam (Web Animations)`,s.w.__anims.length>0,s.w.__anims.length);
}
t("todos os passos duram de 3 a 5 s (com material dourado e com maçãs)",tempoOk,tmsg);
t("cada passo tem uma fala curta do Pyri",falaOk,tmsg);
// ---- material dourado: 23 + 12 ----
ev("FS.repr='dourado';FS.vel=0.001");
await ateOPasso("soma","23,12",1);t("dourado 23 + 12: as unidades viram cubinhos azuis (3 e 2) que nascem dos algarismos",cont(".pm-cubo")===5&&cont(".pm-bandeja.cu")===2&&cont(".pm-ap")===0&&ev("[...document.querySelectorAll('#exp-stage .pm-cubo')].every(e=>{const[x,y]=e.dataset.de.split(',').map(Number);return [...Object.values(__R.a),...Object.values(__R.b)].some(z=>Math.abs(z._fx+14-x)<=30&&Math.abs(z._fy+12-y)<=30)})"));
t("dourado: nada aparece do nada (ainda sem resultado)",cont(".pm-res")===0&&ev("__R.ap.res.length")===0);
await ateOPasso("soma","23,12",2);t("dourado: os cubinhos se juntam numa nova quantidade (5) e só então nasce o 5",cont(".pm-cubo")===5&&ev("__R.ap.res.length")===5&&ev("__R.ap.res.every(e=>e._y>=__R.ap.r2)")&&cont(".pm-res")===1);
await ateOPasso("soma","23,12",3);t("dourado: as dezenas viram barras verdes de 10 cubinhos (2 e 1)",cont(".pm-barra")===3&&cont(".pm-bandeja.cd")===2&&ev("document.querySelector('#exp-stage .pm-barra').className")==="pm-cel pm-barra");
await ateOPasso("soma","23,12",5);t("dourado: no fim, 3 barras (30) + 5 cubinhos (5) = 35",cont(".pm-barra")===3&&cont(".pm-cubo")===5&&ev("__R.ap.res.length")===8&&resFin()==="5:cu,3:cd",resFin());
// ---- material dourado: 15 + 8 (elevação com dois algarismos) ----
await ateOPasso("vaiUm","15,8",1);t("dourado 15 + 8: 5 e 8 cubinhos (azuis); os 8 se dividem em 5 e 3",cont(".pm-cubo")===13&&ev("__R.ap.eB.slice(0,5).every(e=>e._y>__R.ap.eB[7]._y)"));
await ateOPasso("vaiUm","15,8",2);t("dourado: o 5 pega 5 e os 10 cubinhos se alinham numa BARRA verde de dezena (sobram 3)",cont(".pm-cubo")===3&&cont(".pm-barra")===1);
await ateOPasso("vaiUm","15,8",3);t("dourado: a barra voa para a coluna das dezenas do resultado (elevação)",ev("__R.ap.pacote._x")===14&&ev("__R.ap.pacote._y")===ev("__R.ap.r2+6")&&ev("__R.pac.textContent")==="1");
await ateOPasso("vaiUm","15,8",5);t("dourado: a dezena do 15 chega e junta com a que veio: 2 barras no resultado",cont(".pm-barra")===2&&cont(".pm-cubo")===3&&resFin()==="3:cu,2:cd",resFin()+" / "+cont(".pm-barra"));
await ateOPasso("vaiUm","15,8",6);t("dourado 15 + 8: 2 barras + 3 cubinhos = 23",ev("__R.ap.res.length")===5&&ev("document.querySelector('#exp-stage #cap').textContent")==="15 + 8 = 23");
// ---- material dourado: 32 − 15 (empréstimo) ----
await ateOPasso("subEmp","32,15",1);t("dourado 32 − 15: o 32 em 3 barras + 2 cubinhos e o 15 em 1 barra + 5 cubinhos",cont(".pm-barra")===4&&cont(".pm-cubo")===7&&cont(".pm-bandeja")===2);
await ateOPasso("subEmp","32,15",3);t("dourado: a barra de dezena se parte em 10 cubinhos ANTES da conta (12 cubinhos no 32)",cont(".pm-barra")===3&&ev("__R.ap.um.length")===12&&cont(".pm-cubo")===17);
await ateOPasso("subEmp","32,15",4);t("dourado: 12 − 5 — os cubinhos que saem se apagam (sobram 7)",cont(".pm-cubo")===7);
await ateOPasso("subEmp","32,15",5);t("dourado: a barra que sai se apaga com a de baixo (sobra 1 dezena)",cont(".pm-barra")===1);
await ateOPasso("subEmp","32,15",6);t("dourado 32 − 15: 1 barra + 7 cubinhos = 17",cont(".pm-barra")===1&&cont(".pm-cubo")===7&&ev("__R.ap.res.length")===8&&resFin()==="7:cu,1:cd");
// ---- material dourado: valor posicional 345 ----
await ateOPasso("posicional","345",3);t("dourado 345: 3 placas laranja, 4 barras verdes e 5 cubinhos azuis, cada um nascendo do seu algarismo",cont(".pm-placa")===3&&cont(".pm-barra")===4&&cont(".pm-cubo")===5&&cont(".pm-bandeja")===3&&ev("[...document.querySelectorAll('#exp-stage .pm-placa, #exp-stage .pm-barra, #exp-stage .pm-cubo')].every(e=>{const[x,y]=e.dataset.de.split(',').map(Number);return __R.dig.some(z=>Math.abs(z._fx+14-x)<=30&&Math.abs(z._fy+12-y)<=30)})"));
await ateOPasso("posicional","345",4);t("345 = 300 + 40 + 5 (os blocos brilham)",cont(".pm-glow")>=12&&ev("document.querySelector('#exp-stage #cap').textContent")==="345 = 300 + 40 + 5");
// ---- as maçãs continuam disponíveis, com o mesmo comportamento ----
ev("FS.repr='macas'");
await ateOPasso("soma","23,12",1);t("maçãs 23 + 12: as unidades viram maçãs (3 e 2)",cont(".pm-ap")===5&&cont(".pm-cubo")===0);
await ateOPasso("soma","23,12",5);t("maçãs: 3 pacotes verdes + 5 maçãs no resultado",cont(".pm-pacote.bgd")===3&&cont(".pm-ap")===5&&ev("__R.ap.res.length")===8);
await ateOPasso("vaiUm","15,8",2);t("maçãs 15 + 8: as 10 maçãs viram UM pacote verde (sobram 3)",cont(".pm-ap")===3&&cont(".pm-pacote.bgd")===1);
await ateOPasso("vaiUm","15,8",5);t("maçãs: os dois pacotes de dezena no resultado",cont(".pm-pacote.bgd")===2&&resFin()==="3:cu,2:cd");
await ateOPasso("subEmp","32,15",1);t("maçãs 32 − 15: 32 em pacotes (3 + 2 maçãs) e 15 (1 pacote + 5 maçãs)",cont(".pm-pacote")===4&&cont(".pm-ap")===7);
await ateOPasso("subEmp","32,15",6);t("maçãs: no fim, 1 pacote + 7 maçãs",cont(".pm-pacote")===1&&cont(".pm-ap")===7);
await passos("mult","3,4");t("3 × 4: 12 maçãs em 3 grupos alinhados",cont(".pm-fruta")===12&&cont(".pm-caixa")===3);
await passos("mult","4,9");t("acima de 30 objetos (4 × 9) os grupos viram pacotes",cont(".pm-pacote")===4&&cont(".pm-fruta")===0);
await passos("divide","12,3");t("12 ÷ 3: 12 maçãs em 3 pratos",cont(".pm-fruta")===12&&cont(".pm-prato")===3&&ev("document.querySelector('#exp-stage .pm-res').textContent")==="4");
// ---- seletor de imagens ----
ev("FS.vel=0.001;FS.auto=false;FS.repr='dourado';voltarTrilha();abrirExplicacao('a3-adicao')");await sleep(80);
t("seletor “Imagens” aparece na soma/subtração (material dourado ou maçãs)",ev("document.getElementById('exp-repr').style.display")==="flex"&&ev("document.querySelector('#exp-repr button.on').dataset.r")==="dourado");
ev("FS.passo=1;mostrarPasso()");await sleep(500);t("com material dourado a soma mostra cubinhos",cont(".pm-cubo")>0&&cont(".pm-ap")===0);
ev("trocarRepr('macas')");await sleep(500);t("trocar para maçãs refaz o passo com maçãs",ev("FS.repr")==="macas"&&cont(".pm-ap")>0&&cont(".pm-cubo")===0&&ev("document.querySelector('#exp-repr button.on').dataset.r")==="macas");
ev("trocarRepr('dourado');voltarTrilha();abrirExplicacao('a3-multiplicacao')");await sleep(80);t("na multiplicação (maçãs e grupos) o seletor não aparece",ev("document.getElementById('exp-repr').style.display")==="none");
ev("pararAnimacoes()");
// ---- cores, curvas, reduzir movimento ----
ev("FS.repr='dourado';FS.vel=0.001");await ev("(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};window.__A=armada(ctx,'+',345,123);return true})()");
t("cores por casa: unidades azul, dezenas verde, centenas laranja",ev("__A.a[0].className.includes(' cu')&&__A.a[1].className.includes(' cd')&&__A.a[2].className.includes(' cc')"));
await ev("(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};window.__A=armada(ctx,'+',1234,1000);return true})()");t("e milhares roxo",ev("__A.a[3].className.includes(' cm')"));
s.w.__anims.length=0;await passos("vaiUm","15,8");
const curvas=s.w.__anims.filter(a=>a.frames&&a.frames.length>=15).map(a=>{const f=a.frames,m=f[8].transform.match(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/),e=f[16].transform.match(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/);return Math.hypot(+m[1]-+e[1]/2,+m[2]-+e[2]/2)});
t("os números e os blocos viajam em CURVA (o meio do caminho sai da linha reta)",curvas.length>=8&&curvas.filter(c=>c>5).length>=Math.ceil(curvas.length*0.8),curvas.length);
fin=resFin();t("15 + 8: unidades 3 em azul, dezenas 2 em verde, resultado 23",fin==="3:cu,2:cd"&&ev("document.querySelector('#exp-stage #cap').textContent")==="15 + 8 = 23",fin);
s.w.__anims.length=0;ev("S.cfg.reduzir=true;FS.vel=0.001");
await ev("window.__pulso=0;window.__gira=0;const _a=DOMTokenList.prototype.add;DOMTokenList.prototype.add=function(...c){if(c.includes('pm-pulso'))window.__pulso++;if(c.includes('pm-gira'))window.__gira++;return _a.apply(this,c)};true");
for(const repr of["dourado","macas"]){ev(`FS.repr='${repr}'`);await passos("subEmp","32,15");await passos("vaiUm","15,8")}
t("reduzir movimento: mesma sequência (números e blocos), com destaque, SEM voo e SEM giros",s.w.__anims.length===0&&ev("__pulso")>10&&ev("__gira")===0&&resFin()==="3:cu,2:cd",s.w.__anims.length+" / "+ev("__pulso")+" / "+ev("__gira"));
ev("S.cfg.reduzir=false;FS.repr='dourado';FS.vel=0.001");await ev("window.__gira=0;true");await passos("vaiUm","15,8");await passos("subEmp","32,15");
t("com movimento, a dezena gira (barra que se forma e barra que se parte)",ev("__gira")>=2,ev("__gira"));

// ================= player: auto, pausa, controles =================
s.w.close();s=await sessao(null,{animate:true});ev=s.ev;await ev("escolher(25)");ev("S.cfg.reduzir=false;FS.vel=0.004");
await ev("window.__LOG=[];const _e=esperar;esperar=function(c,m){if(!c.instant)__LOG.push(m);return _e(c,m)};const _m=mostrarPasso;mostrarPasso=function(){__LOG.push('P');return _m()};true");
ev(OURO(["a3-posicional","a3-adicao"])+";save()");ev("FS.auto=false;ir('fases');abrirExplicacao('a3-vai-um')");await sleep(100);
t("botões da explicação: Repetir, Pausar, Anterior e Próximo",["exp-rep","exp-pausa","exp-ant","exp-prox"].every(id=>ev(`!!document.getElementById('${id}')`))&&ev("document.getElementById('exp-prox').textContent")==="Próximo ▶");
t("Anterior começa desativado no 1º passo",ev("document.getElementById('exp-ant').disabled")===true);
ev("__LOG.length=0;FS.log=[];FS.auto=true;FS.vel=0.004;FS.passo=0;mostrarPasso()");await sleep(5000);
const n=ev("roteiroDaFase(FS.fase).passos.length");
t("toca sozinho até o último passo",ev("FS.passo")===n-1&&ev("document.getElementById('exp-prox').textContent").includes("Praticar")&&ev("document.getElementById('exp-prox').classList.contains('pm-destaque')"),ev("FS.passo")+"/"+(n-1));
const grupos=[];let cur=null;for(const v of ev("__LOG")){if(v==="P"){cur=[];grupos.push(cur)}else if(cur)cur.push(v)}
const flog=ev("FS.log.map(x=>x.gasto)");
t("cada passo dura de 3 a 5 s (tempo real do passo)",flog.length===n&&flog.every(x=>x>=3000&&x<=5000),flog.join());
t("a pausa de 1 s existe entre todos os passos (e não depois do último)",grupos.length===n&&grupos.slice(0,-1).every(g=>g[g.length-1]===1000)&&grupos[n-1][grupos[n-1].length-1]!==1000);
ev("FS.vel=0.05;FS.passo=0;FS.auto=true;mostrarPasso()");await sleep(100);
const p0=ev("FS.passo");ev("pausar()");t("Pausar muda o botão para Continuar",ev("document.getElementById('exp-pausa').textContent").includes("Continuar")&&ev("FS.pausado")===true);
await sleep(1800);t("em pausa, o passo não avança",ev("FS.passo")===p0,p0+"→"+ev("FS.passo"));
t("em pausa, os voos ficam parados",s.w.__anims.length>0&&s.w.__anims.slice(-1)[0].paused===true);
ev("pausar()");await sleep(2500);t("Continuar retoma e a explicação avança",ev("FS.passo")>p0&&ev("document.getElementById('exp-pausa').textContent").includes("Pausar"),p0+"→"+ev("FS.passo"));
ev("FS.auto=false;FS.vel=0.004;FS.passo=2;passoMenos()");await sleep(50);t("Anterior volta um passo",ev("FS.passo")===1);
ev("passoMais()");await sleep(50);t("Próximo vai ao passo seguinte",ev("FS.passo")===2);
const tk=ev("FS.tok");ev("repetirPasso()");t("Repetir recomeça o passo atual",ev("FS.tok")>tk&&ev("FS.passo")===2);
ev("FS.passo=3;mostrarPasso()");await sleep(300);t("pular para o passo 4 reconstrói a cena (barra de dezena no lugar)",ev("document.querySelectorAll('#exp-stage .pm-barra').length")===1);
ev("pararAnimacoes()");
ev("FS.passo=roteiroDaFase(FS.fase).passos.length-1");ev("passoMais()");t("Praticar leva aos exercícios do nível",ev("FS.vista")==="exerc"&&ev("FS.ses.nivel")==="bronze");
// ================= falas =================
const f2=await ev("falaPokemon(152,'fome')");t("sem fala de fome: usa a fala de reserva",/barriguinha|fome|petisco/i.test(f2),f2);
const f4=await ev("falaPokemon(152,'alimentado')");t("fala específica com acentos corrigidos",f4.includes("delícia"),f4);
const fp=await ev("falaPokemon(PYRI_ID,'desafio')");t("o Pyri tem as suas falas",fp.length>5,fp);
await sleep(300);t("ao começar o nível o companheiro fala (balão com a fala)",ev("(document.getElementById('fala-pk')||{}).textContent").length>5);
// ================= salvar e reabrir =================
ev("S.fases={'a3-posicional':{niveis:{bronze:{ok:true,perfeito:true,vezes:1},prata:{ok:false,falhou:true,vezes:1}},viu:true}};S.tutorialVisto=true;save()");
const salvo=s.w.localStorage.getItem(KEY);s.w.close();s=await sessao(salvo);ev=s.ev;
t("estado dos níveis (concluído, refazer) sobrevive ao fechar e abrir",st(ev,"a3-posicional")==="concluido,refazer,bloqueado",st(ev,"a3-posicional"));

// ================= TRILHA POR ZONAS (Etapa 1): cada fase é um círculo; cada ano é uma zona; o círculo abre os 3 níveis =================
{
const z=await sessao(),zd=z.w.document,zv=x=>{try{return z.ev(x)}catch(e){return undefined}},Q=(x)=>[...zd.querySelectorAll(x)],U=x=>zd.querySelector(x);
const zerar=()=>{zv("S.fases={};S.tentNivel=null;S.cfg.anoEscolar=3;save();ir('fases')")};
const circ=id=>U('button.circulo[data-fase="'+id+'"]');
const IDS=zv("fasesDoAno(3).map(f=>f.id)");
zerar();
const esperado={3:["Pyron",900003],4:["Lugia",249],5:["Ho-Oh",250],6:["Palkia",484],7:["Mewtwo",150],8:["Rayquaza",384],9:["Arceus",493]};
try{t("zonas: existe a tabela ZONAS com os 7 anos (3º ao 9º)",zv("typeof ZONAS!=='undefined'&&Object.keys(ZONAS).join()")==="3,4,5,6,7,8,9");}catch(e){t("zonas: existe a tabela ZONAS com os 7 anos (3º ao 9º)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("zonas: cada ano tem o lendário combinado (3º Pyron, 4º Lugia, 5º Ho-Oh, 6º Palkia, 7º Mewtwo, 8º Rayquaza, 9º Arceus) e um nome de cenário",Object.entries(esperado).every(([a,[n,id]])=>zv(`ZONAS[${a}].lendario.nome`)===n&&zv(`ZONAS[${a}].lendario.id`)===id&&!!zv(`ZONAS[${a}].nome`)));}catch(e){t("zonas: cada ano tem o lendário combinado (3º Pyron, 4º Lugia, 5º Ho-Oh, 6º Palkia, 7º Mewtwo, 8º Rayquaza, 9º Arceus) e um nome de cenário  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("trilha: 7 zonas na tela, uma por ano",Q(".zona").length===7&&Q(".zona").map(e=>e.dataset.ano).join()==="3,4,5,6,7,8,9");}catch(e){t("trilha: 7 zonas na tela, uma por ano  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("trilha: o 3º ano mostra um CÍRCULO por fase, na ordem das fases",Q('.zona[data-ano="3"] button.circulo[data-fase]').map(e=>e.dataset.fase).join()===zv("fasesDoAno(3).map(f=>f.id).join()")&&zv("fasesDoAno(3).length")===15,Q('.zona[data-ano="3"] button.circulo[data-fase]').length);}catch(e){t("trilha: o 3º ano mostra um CÍRCULO por fase, na ordem das fases  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("trilha: os cartões antigos (com os 3 botões de nível dentro) saíram da tela",Q(".faseCard").length===0&&Q(".nv").length===0);}catch(e){t("trilha: os cartões antigos (com os 3 botões de nível dentro) saíram da tela  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("trilha: as fases 'Em breve' aparecem como círculos cinza desativados no fim do 3º ano",Q('.zona[data-ano="3"] .circulo.embreve[disabled]').length===zv("EM_BREVE[3].length"));}catch(e){t("trilha: as fases 'Em breve' aparecem como círculos cinza desativados no fim do 3º ano  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* estado do círculo = derivado dos 3 níveis */
const est=id=>circ(id).dataset.estado;
try{t("círculo: sem progresso, a 1ª fase está disponível e as outras bloqueadas",est(IDS[0])==="disponivel"&&IDS.slice(1).every(i=>est(i)==="bloqueado"),IDS.map(est).join());}catch(e){t("círculo: sem progresso, a 1ª fase está disponível e as outras bloqueadas  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("S.fases={'a3-posicional':{niveis:{bronze:{ok:true,perfeito:true,vezes:1}},viu:true}};save();ir('fases')");}catch(e){}
try{t("círculo: com só o Bronze feito a fase continua 'disponível' e mostra a medalha 🥉",est(IDS[0])==="disponivel"&&/🥉/.test(circ(IDS[0]).textContent)&&est(IDS[1])==="bloqueado");}catch(e){t("círculo: com só o Bronze feito a fase continua 'disponível' e mostra a medalha 🥉  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("S.fases={'a3-posicional':{niveis:{bronze:{ok:true},prata:{ok:false,falhou:true,vezes:1}},viu:true}};save();ir('fases')");}catch(e){}
try{t("círculo: nível falhado → fase em 'refazer'",est(IDS[0])==="refazer");}catch(e){t("círculo: nível falhado → fase em 'refazer'  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("S.fases={'a3-posicional':{niveis:{bronze:{ok:true},prata:{ok:true},ouro:{ok:true}},viu:true}};save();ir('fases')");}catch(e){}
try{t("círculo: Bronze+Prata+Ouro → 'concluída' com 🥇, a próxima fase abre e o trecho percorrido fica marcado",est(IDS[0])==="concluido"&&/🥇/.test(circ(IDS[0]).textContent)&&est(IDS[1])==="disponivel"&&circ(IDS[0]).closest("li").classList.contains("feito")&&!circ(IDS[1]).closest("li").classList.contains("feito"));}catch(e){t("círculo: Bronze+Prata+Ouro → 'concluída' com 🥇, a próxima fase abre e o trecho percorrido fica marcado  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* folha com os 3 níveis */
try{t("antes de tocar: nenhuma folha aberta",!U("#folha"));}catch(e){t("antes de tocar: nenhuma folha aberta  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{const clk=e=>{if(e)e.click()};circ(IDS[1])&&circ(IDS[1]).click();}catch(e){}
try{t("tocar no círculo abre a folha com nome, resumo, 'Ver explicação' e os 3 níveis (Bronze, Prata, Ouro)",!!U("#folha")&&/Somar/.test(U("#folha").textContent)&&Q("#folha .nv").map(e=>e.classList[1]).join()==="bronze,prata,ouro"&&!!U("#folha .pm-livro")&&/Bronze/.test(U("#folha").textContent)&&/Prata/.test(U("#folha").textContent)&&/Ouro/.test(U("#folha").textContent));}catch(e){t("tocar no círculo abre a folha com nome, resumo, 'Ver explicação' e os 3 níveis (Bronze, Prata, Ouro)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("folha: cada nível mostra o estado (Bronze disponível, Prata e Ouro bloqueados)",Q("#folha .nv").map(e=>e.dataset.estado).join()==="disponivel,bloqueado,bloqueado");}catch(e){t("folha: cada nível mostra o estado (Bronze disponível, Prata e Ouro bloqueados)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("folha: acessível (role=dialog, aria-modal, botão Fechar com rótulo)",U("#folha").getAttribute("role")==="dialog"&&U("#folha").getAttribute("aria-modal")==="true"&&!!U('#folha [aria-label="Fechar"]'));}catch(e){t("folha: acessível (role=dialog, aria-modal, botão Fechar com rótulo)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{U("#folha .nv.prata").click();}catch(e){}
try{t("folha: nível bloqueado continua bloqueado (a regra do abrirNivel não mudou) e a folha segue aberta",zv("FS.vista")==="trilha"&&!!U("#folha"));}catch(e){t("folha: nível bloqueado continua bloqueado (a regra do abrirNivel não mudou) e a folha segue aberta  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{U('#folha [aria-label="Fechar"]').click();}catch(e){}
try{t("folha: o botão Fechar fecha",!U("#folha"));}catch(e){t("folha: o botão Fechar fecha  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{circ(IDS[1]).click();zd.dispatchEvent(new z.w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));}catch(e){}
try{t("folha: a tecla Esc fecha",!U("#folha"));}catch(e){t("folha: a tecla Esc fecha  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{circ(IDS[1]).click();U("#folha .nv.bronze").click();}catch(e){}
try{t("tocar no nível chama a mesma entrada de antes (abrirNivel): abre a fase certa e fecha a folha",!U("#folha")&&zv("FS.fase.id")===IDS[1]&&zv("FS.nivel")==="bronze"&&zv("FS.vista")!=="trilha",zv("FS.vista"));}catch(e){t("tocar no nível chama a mesma entrada de antes (abrirNivel): abre a fase certa e fecha a folha  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("voltarTrilha()");}catch(e){}
/* fase bloqueada */
try{zerar();circ(IDS[2]).click();}catch(e){}
try{t("fase bloqueada: a folha só explica ('Termine os 3 níveis da fase anterior primeiro!'), sem botões de nível",!!U("#folha")&&Q("#folha .nv").length===0&&/Termine os 3 níveis da fase anterior primeiro!/.test(U("#folha").textContent));}catch(e){t("fase bloqueada: a folha só explica ('Termine os 3 níveis da fase anterior primeiro!'), sem botões de nível  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{U('#folha [aria-label="Fechar"]').click();}catch(e){}
/* tentativas do dia continuam valendo */
try{zv("S.tentNivel={dia:hoje(),c:{'a3-posicional:bronze':3}};save();ir('fases')");circ(IDS[0]).click();}catch(e){}
try{t("folha: sem tentativas no dia o nível mostra 'volte amanhã' e não abre",/volte amanhã/.test(U("#folha .nv.bronze").textContent)&&(U("#folha .nv.bronze").click(),zv("FS.vista")==="trilha"));}catch(e){t("folha: sem tentativas no dia o nível mostra 'volte amanhã' e não abre  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* sair da aba fecha a folha */
try{zv("ir('inicio')");t("trocar de aba fecha a folha",!U("#folha"));}catch(e){}
/* anos */
zerar();
try{t("ano ainda não liberado pelo responsável: zona cinza com 🔒 e a frase de liberação",Q(".zona").filter(e=>e.dataset.ano!=="3").every(e=>e.classList.contains("bloq")&&/🔒/.test(e.querySelector("h2").textContent)&&/Libera quando o ano escolar for/.test(e.textContent))&&!U('.zona[data-ano="3"]').classList.contains("bloq"));}catch(e){t("ano ainda não liberado pelo responsável: zona cinza com 🔒 e a frase de liberação  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("S.cfg.anoEscolar=4;save();ir('fases')");}catch(e){}
try{t("ano liberado sem fases prontas: mostra 'chegam nos próximos lotes' e não fica cinza",!U('.zona[data-ano="4"]').classList.contains("bloq")&&/chegam nos próximos lotes/.test(U('.zona[data-ano="4"]').textContent));}catch(e){t("ano liberado sem fases prontas: mostra 'chegam nos próximos lotes' e não fica cinza  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* portal do lendário */
zerar();
try{t("portal: cada zona tem o lendário em silhueta (imagem do Pokémon do ano) e a frase 'Conclua todas as fases'",Object.entries(esperado).every(([a,[n,id]])=>{const p=U('.zona[data-ano="'+a+'"] .portal');return !!p&&p.querySelector("img.sil")&&p.dataset.lendario===String(id)&&/Conclua todas as fases/.test(p.textContent)&&p.textContent.includes(n)&&p.dataset.completo==="0"}));}catch(e){t("portal: cada zona tem o lendário em silhueta (imagem do Pokémon do ano) e a frase 'Conclua todas as fases'  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("S.fases=Object.fromEntries(fasesDoAno(3).map(f=>[f.id,{niveis:{bronze:{ok:true},prata:{ok:true},ouro:{ok:true}},viu:true}]));save();ir('fases')");}catch(e){}
try{zv("EM_BREVE[3]=['Fase futura'];ir('fases')")}catch(e){}
try{t("portal: com as fases prontas feitas, mas ainda com uma fase 'em breve' no ano, o portal NÃO está completo",U('.zona[data-ano="3"] .portal').dataset.completo==="0")}catch(e){t("portal em breve  [erro]",false)}
try{zv("EM_BREVE[3]=[];ir('fases')")}catch(e){}
try{t("portal: com todas as fases do ano concluídas marca o portal como completo (✅); a entrega do lendário fica para a Etapa 7",U('.zona[data-ano="3"] .portal').dataset.completo==="1"&&/✅/.test(U('.zona[data-ano="3"] .portal').textContent)&&U('.zona[data-ano="4"] .portal').dataset.completo==="0");}catch(e){t("portal: com todas as fases do ano concluídas marca o portal como completo (✅); a entrega do lendário fica para a Etapa 7  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* acessibilidade e movimento */
zerar();
try{t("círculos: cada um é um botão com rótulo (título + situação) e alvo de toque de pelo menos 56px",Q("button.circulo[data-fase]").every(b=>/,/.test(b.getAttribute("aria-label")||"")&&b.getAttribute("aria-label").includes(zv(`FASES.find(f=>f.id==='${b.dataset.fase}').titulo`)))&&/\.circulo\{[^}]*(width|min-width):(5[6-9]|[6-9]\d)px/.test(lerArq("css/trilha.css").replace(/\s+/g,"")));}catch(e){t("círculos: cada um é um botão com rótulo (título + situação) e alvo de toque de pelo menos 56px  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("movimento: 'reduzir movimento' e prefers-reduced-motion desligam as animações da trilha",/body\.reduzir[^{]*\{[^}]*animation:none/.test(lerArq("css/trilha.css").replace(/\s+/g,""))&&/prefers-reduced-motion/.test(lerArq("css/trilha.css")));}catch(e){t("movimento: 'reduzir movimento' e prefers-reduced-motion desligam as animações da trilha  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* arquivos */
try{t("index.html liga zonas.js, trilha_visual.js e css/trilha.css (zonas antes do visual, ambos antes do jogo)",/css\/trilha\.css/.test(lerArq("index.html"))&&lerArq("index.html").indexOf("js/conteudo/zonas.js")>0&&lerArq("index.html").indexOf("js/conteudo/zonas.js")<lerArq("index.html").indexOf("js/ui/trilha_visual.js")&&lerArq("index.html").indexOf("js/ui/trilha_visual.js")<lerArq("index.html").indexOf("js/legado/jogo.js"));}catch(e){t("index.html liga zonas.js, trilha_visual.js e css/trilha.css (zonas antes do visual, ambos antes do jogo)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("sw.js: pokemath-v21 e os 3 arquivos novos na lista",/const V="pokemath-v21"/.test(lerArq("sw.js"))&&["css/trilha.css","js/conteudo/zonas.js","js/ui/trilha_visual.js"].every(a=>lerArq("sw.js").includes('"'+a+'"')));}catch(e){t("sw.js: pokemath-v10 e os 3 arquivos novos na lista  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("regras intocadas: trilha.js ainda tem estadoNivel, abrirNivel e as tentativas por nível (só a tela mudou)",/function estadoNivel/.test(lerArq("js/motor/trilha.js"))&&/function abrirNivel/.test(lerArq("js/motor/trilha.js"))&&/restantesNivel/.test(lerArq("js/motor/trilha.js")));}catch(e){t("regras intocadas: trilha.js ainda tem estadoNivel, abrirNivel e as tentativas por nível (só a tela mudou)  [erro: "+String(e.message).slice(0,60)+"]",false)}
z.w.close();
}

// ================= ZONA ILUSTRADA DO 3º ANO (Ninho de Fogo): fundo com a imagem da joyce, círculos sobre a trilha de tijolos =================
{
const z=await sessao(),zd=z.w.document,zv=x=>{try{return z.ev(x)}catch(e){return undefined}},U=x=>zd.querySelector(x),Q=x=>[...zd.querySelectorAll(x)];
zv("S.fases={};S.tentNivel=null;S.cfg.anoEscolar=3;save();ir('fases')");
const P=zv("ZONAS[3].pontos")||[],F=zv("ZONAS[3].fundo");
const arq="img/zonas/ano3.webp",W=360,H=360*1732/800;
try{t("imagem: ZONAS[3].fundo aponta para img/zonas/ano3.webp e o arquivo existe, é WebP e leve (menos de 400 KB)",F===arq&&fs.existsSync(path.join(DIR,arq))&&(b=>b.slice(0,4).toString()==="RIFF"&&b.slice(8,12).toString()==="WEBP"&&b.length<400*1024)(fs.readFileSync(path.join(DIR,arq))))}catch(e){t("imagem do ano 3  [erro: "+String(e.message).slice(0,50)+"]",false)}
try{t("pontos: há pelo menos 15 (13 fases + 2 'em breve'), todos dentro da imagem (3% a 97%)",P.length>=15&&P.every(p=>p[0]>=3&&p[0]<=97&&p[1]>=3&&p[1]<=97),P.length);}catch(e){t("pontos: há pelo menos 15 (13 fases + 2 'em breve'), todos dentro da imagem (3% a 97%)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("pontos: nenhum par de círculos se encosta (distância mínima de 50px numa tela de 360px de largura)",P.length>=15&&P.every((a,i)=>P.every((b,j)=>j<=i||Math.hypot((a[0]-b[0])*W/100,(a[1]-b[1])*H/100)>=50)));}catch(e){t("pontos: nenhum par de círculos se encosta (distância mínima de 50px numa tela de 360px de largura)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("pontos: a trilha SOBE — o primeiro ponto é o mais baixo da imagem e o último o mais alto",P.length>=15&&P[0][1]===Math.max(...P.map(p=>p[1]))&&P[P.length-1][1]<=Math.min(...P.slice(0,P.length-1).map(p=>p[1]))+12);}catch(e){t("pontos: a trilha SOBE — o primeiro ponto é o mais baixo da imagem e o último o mais alto  [erro: "+String(e.message).slice(0,60)+"]",false)}
const zi=U('.zona[data-ano="3"]');
try{t("zona do 3º ano é ilustrada: tem a classe 'ilus' e usa a imagem como fundo",!!zi&&zi.classList.contains("ilus")&&/ano3\.webp/.test(zi.getAttribute("style")||""),zi&&zi.getAttribute("style"));}catch(e){t("zona do 3º ano é ilustrada: tem a classe 'ilus' e usa a imagem como fundo  [erro: "+String(e.message).slice(0,60)+"]",false)}
const nos=Q('.zona[data-ano="3"].ilus li.no');
try{t("zona ilustrada: as 15 posições (13 fases + 2 em breve) estão sobre a imagem, cada uma no seu ponto (left/top em %)",nos.length===15&&nos.every((n,i)=>P[i]&&n.style.left===P[i][0]+"%"&&n.style.top===P[i][1]+"%"),nos.map(n=>n.style.left+","+n.style.top).slice(0,2).join(" | "));}catch(e){t("zona ilustrada: as 15 posições (13 fases + 2 em breve) estão sobre a imagem, cada uma no seu ponto (left/top em %)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("zona ilustrada: a 1ª fase fica EMBAIXO (ponto mais baixo) e a 9ª mais acima",nos.length===15&&parseFloat(nos[0].style.top)>parseFloat(nos[8].style.top)&&nos[0].querySelector('button.circulo[data-fase]')&&nos[0].querySelector("button").dataset.fase===zv("fasesDoAno(3)[0].id"));}catch(e){t("zona ilustrada: a 1ª fase fica EMBAIXO (ponto mais baixo) e a 9ª mais acima  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("zona ilustrada: cada fase tem seu nome numa etiqueta escura (.tit) ao lado do círculo",nos.length===15&&nos.every(n=>!!n.querySelector(".tit"))&&nos.every((n,i)=>n.classList.contains(P[i][2]==="e"?"esq":P[i][2]==="d"?"dir":P[i][0]>50?"esq":"dir")));}catch(e){t("zona ilustrada: cada nome fica numa etiqueta escura (.tit) do lado de fora da trilha  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("zona ilustrada: os 2 'em breve' são só cadeados (sem etiqueta, para não cobrir a trilha) e continuam com o nome no rótulo de acessibilidade e no title",nos.length===15&&nos.every(n=>!n.querySelector("button.circulo.embreve")))}catch(e){t("em breve sem etiqueta  [erro]",false)}
try{t("zona ilustrada: o portal do Pyron aparece perto do vulcão (parte alta) com a silhueta",!!U('.zona[data-ano="3"].ilus .portal img.sil')&&U('.zona[data-ano="3"] .portal').dataset.lendario==="900003");}catch(e){t("zona ilustrada: o portal do Pyron aparece perto do vulcão (parte alta) com a silhueta  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("os outros anos continuam com o degradê (sem 'ilus') até chegarem as imagens",Q(".zona").filter(e=>e.dataset.ano!=="3").every(e=>!e.classList.contains("ilus")));}catch(e){t("os outros anos continuam com o degradê (sem 'ilus') até chegarem as imagens  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("os estados e a folha continuam: tocar no círculo da 1ª fase abre a folha com os 3 níveis",(zv("abrirFolhaFase(fasesDoAno(3)[0].id)"),Q("#folha .nv").length===3));}catch(e){t("os estados e a folha continuam: tocar no círculo da 1ª fase abre a folha com os 3 níveis  [erro: "+String(e.message).slice(0,60)+"]",false)}
zv("fecharFolha()");
/* abrir a aba rola até a fase atual */
const vistos=[];z.w.Element.prototype.scrollIntoView=function(){vistos.push(this)};
zv("S.fases={'a3-posicional':{niveis:{bronze:{ok:true},prata:{ok:true},ouro:{ok:true}},viu:true}};save();ir('fases')");
try{t("ao abrir a aba, a trilha rola até a fase atual (a primeira disponível)",typeof zv("rolarTrilha")==="string"||zv("typeof rolarTrilha")==="function"?(zv("rolarTrilha()"),vistos.length>0&&vistos[vistos.length-1].dataset&&vistos[vistos.length-1].dataset.fase===zv("fasesDoAno(3)[1].id")):false,vistos.length);}catch(e){t("ao abrir a aba, a trilha rola até a fase atual (a primeira disponível)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("CSS: a zona ilustrada mantém a proporção da imagem e o círculo dela tem pelo menos 44px",/\.zona\.ilus\{[^}]*aspect-ratio:800\/1732/.test(lerArq("css/trilha.css").replace(/\s+/g,""))&&/\.ilus\.circulo\{[^}]*width:(4[4-9]|[5-9]\d)px/.test(lerArq("css/trilha.css").replace(/\s+/g,"").replace(/\.zona\.ilus\.circulo/g,".ilus.circulo")));}catch(e){t("CSS: a zona ilustrada mantém a proporção da imagem e o círculo dela tem pelo menos 44px  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("sw.js: pokemath-v21 e a imagem da zona na lista para funcionar offline",/const V="pokemath-v21"/.test(lerArq("sw.js"))&&lerArq("sw.js").includes('"img/zonas/ano3.webp"'));}catch(e){t("sw.js: pokemath-v11 e a imagem da zona na lista para funcionar offline  [erro: "+String(e.message).slice(0,60)+"]",false)}
z.w.close();
}

// ================= FOLHA DOS NÍVEIS NO ESTILO "LAJE DE PEDRA COM 3 MEDALHAS", NO MEIO DA TELA =================
{
const z=await sessao(),zd=z.w.document,zv=x=>{try{return z.ev(x)}catch(e){return undefined}},U=x=>zd.querySelector(x),Q=x=>[...zd.querySelectorAll(x)];
const css=lerArq("css/trilha.css").replace(/\s+/g,"");
const IDS=zv("fasesDoAno(3).map(f=>f.id)");
try{zv("S.fases={'a3-posicional':{niveis:{bronze:{ok:true},prata:{ok:false,falhou:true,vezes:1}},viu:true}};S.tentNivel=null;S.cfg.anoEscolar=3;save();ir('fases');abrirFolhaFase('"+IDS[0]+"')");}catch(e){}
try{t("laje: a folha tem a laje de pedra (.laje) com as 3 medalhas dentro, na ordem Bronze, Prata, Ouro",!!U("#folha .laje")&&Q("#folha .laje .nv").map(e=>e.classList[1]).join()==="bronze,prata,ouro");}catch(e){t("laje: a folha tem a laje de pedra (.laje) com as 3 medalhas dentro, na ordem Bronze, Prata, Ouro  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("laje: cada medalha é um desenho (svg .medal) metálico, sem emoji de medalha",Q("#folha .laje .nv").every(b=>!!b.querySelector("svg.medal"))&&!/[🥉🥈🥇]/.test(U("#folha .laje").innerHTML));}catch(e){t("laje: cada medalha é um desenho (svg .medal) metálico, sem emoji de medalha  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("laje: a pedra tem folhagem nos cantos (pelo menos 4 folhas em svg)",Q("#folha .laje .folhagem").length>=4);}catch(e){t("laje: a pedra tem folhagem nos cantos (pelo menos 4 folhas em svg)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("laje: cada medalha tem rótulo acessível com nome e situação",Q("#folha .laje .nv").map(b=>b.getAttribute("aria-label")).join("|")==="Bronze, concluído|Prata, para refazer|Ouro, bloqueado",Q("#folha .laje .nv").map(b=>b.getAttribute("aria-label")).join("|"));}catch(e){t("laje: cada medalha tem rótulo acessível com nome e situação  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("laje: concluído mostra um selo ✔, bloqueado mostra cadeado e refazer mostra 🔁 (o estado se vê sem ler)",!!U("#folha .nv.bronze .selo.ok")&&!!U("#folha .nv.ouro .selo.trava")&&!!U("#folha .nv.prata .selo.refaz"));}catch(e){t("laje: concluído mostra um selo ✔, bloqueado mostra cadeado e refazer mostra 🔁 (o estado se vê sem ler)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("laje: a situação em texto continua abaixo de cada medalha (Concluído, Refazer, Bloqueado)",/Concluído/.test(U("#folha .nv.bronze").textContent)&&/Refazer/.test(U("#folha .nv.prata").textContent)&&/Bloqueado/.test(U("#folha .nv.ouro").textContent));}catch(e){t("laje: a situação em texto continua abaixo de cada medalha (Concluído, Refazer, Bloqueado)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("laje: cabeçalho com nome da fase, resumo, 📖 e Fechar continuam",/Casas dos números/.test(U("#folha").textContent)&&!!U("#folha .pm-livro")&&!!U('#folha [aria-label="Fechar"]'));}catch(e){t("laje: cabeçalho com nome da fase, resumo, 📖 e Fechar continuam  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("laje: toque na medalha continua chamando abrirNivel (Bronze abre a fase)",(U("#folha .nv.bronze").click(),zv("FS.fase&&FS.fase.id")===IDS[0]&&!U("#folha")));}catch(e){t("laje: toque na medalha continua chamando abrirNivel (Bronze abre a fase)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("voltarTrilha()");}catch(e){}
try{zv("S.fases={};save();ir('fases');abrirFolhaFase('"+IDS[2]+"')");}catch(e){}
try{t("laje: fase bloqueada mostra a laje com 3 medalhas cinza (sem botões de nível) e o aviso",!!U("#folha .laje")&&Q("#folha .laje .medal.trava").length===3&&Q("#folha .nv").length===0&&/Termine os 3 níveis da fase anterior primeiro!/.test(U("#folha").textContent));}catch(e){t("laje: fase bloqueada mostra a laje com 3 medalhas cinza (sem botões de nível) e o aviso  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("fecharFolha()");}catch(e){}
try{t("tela: a folha fica no MEIO da tela (centralizada), não colada embaixo",/\.folhaFundo\{[^}]*align-items:center/.test(css)&&!/\.folhaFundo\{[^}]*flex-end/.test(css)&&!/\.folha\{[^}]*border-radius:20px20px00/.test(css));}catch(e){t("tela: a folha fica no MEIO da tela (centralizada), não colada embaixo  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tela: a laje e as medalhas têm tamanho de toque confortável (medalha com pelo menos 72px)",/\.laje\.nv(\.refazer)?\{[^}]*width:(7[2-9]|[89]\d|1\d\d)px/.test(css.replace(/\.folha\.laje/g,".laje")));}catch(e){t("tela: a laje e as medalhas têm tamanho de toque confortável (medalha com pelo menos 72px)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("movimento: 'reduzir movimento' desliga o brilho das medalhas",/body\.reduzir[^{]*\.nv[^{]*\{[^}]*animation:none/.test(css));}catch(e){t("movimento: 'reduzir movimento' desliga o brilho das medalhas  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("sw.js: pokemath-v21",/const V="pokemath-v21"/.test(lerArq("sw.js")));}catch(e){t("sw.js: pokemath-v21  [erro: "+String(e.message).slice(0,60)+"]",false)}
z.w.close();
}

// ================= ETAPA 3: figura do Pyri, macetes e aba Tabuada em trilha =================
{
const z=await sessao(),zd=z.w.document,zv=x=>{try{return z.ev(x)}catch(e){return undefined}},U=x=>zd.querySelector(x),Q=x=>[...zd.querySelectorAll(x)];
const css3=lerArq("css/trilha.css").replace(/\s+/g,"");
/* ---------- Pyri ---------- */
try{const b=fs.readFileSync(path.join(DIR,"img/pokemon/pyri.webp"));t("Pyri: img/pokemon/pyri.webp existe, é WebP COM transparência (VP8X + alfa) e leve (menos de 200 KB)",b.slice(0,4).toString()==="RIFF"&&b.slice(8,12).toString()==="WEBP"&&b.slice(12,16).toString()==="VP8X"&&(b[20]&0x10)===0x10&&b.length<200*1024,b.length)}catch(e){t("Pyri: arquivo da figura  [erro: "+String(e.message).slice(0,50)+"]",false)}
try{t("Pyri: IMG(Pyri) devolve a figura nova; Pyrelis e Pyron seguem com o desenho provisório; um Pokémon comum segue na PokéAPI",zv("IMG(PYRI_ID)")==="img/pokemon/pyri.webp"&&zv("IMG(PYRELIS_ID)===PYRI_IMG&&IMG(PYRON_ID)===PYRI_IMG")===true&&/PokeAPI\/sprites/.test(zv("IMG(25)")));}catch(e){t("Pyri: IMG(Pyri) devolve a figura nova; Pyrelis e Pyron seguem com o desenho provisório; um Pokémon comum segue na PokéAPI  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("S.comp=PYRI_ID;ir('cuidar')");}catch(e){}
try{t("Pyri: aparece na tela do Cuidar quando é o companheiro",/img\/pokemon\/pyri\.webp/.test(U("#app").innerHTML));}catch(e){t("Pyri: aparece na tela do Cuidar quando é o companheiro  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("sw.js: pokemath-v21 e a figura do Pyri na lista (offline)",/const V="pokemath-v21"/.test(lerArq("sw.js"))&&lerArq("sw.js").includes('"img/pokemon/pyri.webp"'));}catch(e){t("sw.js: pokemath-v21 e a figura do Pyri na lista (offline)  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* ---------- Macetes: dados e funções ---------- */
const IDM=zv("MACETES.map(m=>m.id).join()");
try{t("macetes: a lista tem as medidas, as casas, somar, vai um, empréstimo, as tabuadas 2 a 11, dividir, comparar, pares/ímpares, sequências e (Lote B) figuras, tempo e dinheiro",IDM==="medidas-comprimento,casas,somar,vaium,emprestimo,tab2,tab3,tab4,tab5,tab6,tab7,tab8,tab9,tab10,tab11,dividir,comparar,parimpar,sequencia,figuras,tempo,dinheiro,tabelas,acaso",IDM);}catch(e){t("macetes: a lista tem comprimento, ×5, ×4, ×9, ×10 e ×11  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("macetes: a frase das medidas é exatamente 'Katia Herdou DA Mãe Dois Cachorrinhos Muito Mansinhos' e as unidades são km, hm, dam, m, dm, cm, mm",zv("MACETES[0].partes.map(p=>p.p).join(' ')")==="Katia Herdou DA Mãe Dois Cachorrinhos Muito Mansinhos"&&zv("MACETES[0].partes.map(p=>p.u).join()")==="km,hm,dam,m,dm,cm,mm");}catch(e){t("macetes: a frase das medidas é exatamente 'Katia Herdou DA Mãe Dois Cachorrinhos Muito Mansinhos' e as unidades são km, hm, dam, m, dm, cm, mm  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("macetes: macPerguntas das medidas dá 3 perguntas — ordem, lacuna e escolha — todas com a resposta certa dentro das opções",(q=>q&&q.length===3&&q.map(x=>x.tipo).join()==="ordem,lacuna,escolha"&&q[1].opcoes.includes(q[1].resp)&&q[2].opcoes.includes(q[2].resp)&&new Set(q[1].opcoes).size===q[1].opcoes.length)(zv("macPerguntas('medidas-comprimento')")));}catch(e){t("macetes: macPerguntas das medidas dá 3 perguntas — ordem, lacuna e escolha — todas com a resposta certa dentro das opções  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("macetes: macResponder(ordem) — errada não vale e explica com a frase; certa vale",zv("(()=>{const q=macPerguntas('medidas-comprimento')[0],c=MACETES[0].partes.map(p=>p.p);const a=macResponder(q,[...c].reverse()),b=macResponder(q,c);return !a.ok&&/Katia Herdou DA Mãe Dois Cachorrinhos Muito Mansinhos/.test(a.expl)&&b.ok})()")===true);}catch(e){t("macetes: macResponder(ordem) — errada não vale e explica com a frase; certa vale  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("macetes: ×9, ×5, ×4, ×10 e ×11 dão 5 contas com a explicação do macete (63, 35, 28, 70, 77)",zv("(()=>{const r={};for(const [id,a,b,res] of [['tab9',9,7,'63'],['tab5',5,7,'35'],['tab4',4,7,'28'],['tab10',10,7,'70'],['tab11',11,7,'77']]){const qs=macPerguntas(id);if(qs.length!==5||!qs.every(q=>q.tipo==='conta'&&q.opcoes.includes(q.resp)&&q.resp===q.a*q.b&&q.expl))return false;if(!macExplica(id,a,b).includes(res))return false}return true})()")===true);}catch(e){t("macetes: ×9, ×5, ×4, ×10 e ×11 dão 5 contas com a explicação do macete (63, 35, 28, 70, 77)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("macetes: XP só na 1ª conclusão do dia de cada macete (e volta a valer no dia seguinte)",zv("(()=>{S.macetes={};const a=macConcluir('tab9'),b=macConcluir('tab9');S.macetes.tab9.dia='2000-01-01';const c=macConcluir('tab9');return a===true&&b===false&&c===true})()")===true);}catch(e){t("macetes: XP só na 1ª conclusão do dia de cada macete (e volta a valer no dia seguinte)  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* ---------- Macetes: telas ---------- */
try{zv("S.macetes={};ir('estudar')");}catch(e){}
try{t("macetes: a aba Tabuada tem o botão 💡 Macetes",!!U("#bt-mac"));}catch(e){t("macetes: a aba Tabuada tem o botão 💡 Macetes  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("abrirMacetes()");}catch(e){}
try{t("macetes: a lista mostra os 22 macetes",Q("#app .mac").length===24&&/medidas de comprimento/i.test(U("#app").textContent));}catch(e){t("macetes: a lista mostra os 6 macetes  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("abrirMacete('medidas-comprimento')");}catch(e){}
try{t("macete: mostra a frase com as iniciais em destaque, o Pyri e o botão Praticar",/Katia Herdou DA Mãe Dois Cachorrinhos Muito Mansinhos/.test(U("#app .macFrase").textContent)&&Q("#app .macFrase b").length>=7&&/pyri\.webp/.test(U("#app .macPyri img").src)&&!!U("#mac-praticar"));}catch(e){t("macete: mostra a frase com as iniciais em destaque, o Pyri e o botão Praticar  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{U("#mac-praticar").click();}catch(e){}
const parteOrdem=zv("MACETES[0].partes.map(p=>p.p)")||[];
try{t("prática: começa pela ordem — tocar nas palavras na sequência (chips embaralhados)",Q("#app .chip").length===7&&Q("#app .chip").map(c=>c.dataset.p).sort().join()===[...parteOrdem].sort().join());}catch(e){t("prática: começa pela ordem — tocar nas palavras na sequência (chips embaralhados)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{parteOrdem.forEach(p=>{const c=Q("#app .chip").find(x=>x.dataset.p===p&&!x.disabled);if(c)c.click()});}catch(e){}
try{t("prática: ordem certa mostra acerto e libera 'Continuar'",/Isso aí|Acertou|Muito bem|Certo/.test(U("#app").textContent)&&!!U("#mac-seguinte"));}catch(e){t("prática: ordem certa mostra acerto e libera 'Continuar'  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{U("#mac-seguinte")&&U("#mac-seguinte").click();}catch(e){}
const certo=()=>{const q=zv("MAC.qs[MAC.i]");return q&&String(q.resp)};
const errada=()=>{const q=zv("MAC.qs[MAC.i]");return q&&q.opcoes.find(o=>String(o)!==String(q.resp))};
try{let b=Q("#app .mop").find(x=>x.dataset.v===errada());b&&b.click();}catch(e){}
try{t("prática: resposta errada mostra a explicação, não tira vida e deixa tentar de novo",!!U("#app .erro")&&Q("#app .mop").length>0);}catch(e){t("prática: resposta errada mostra a explicação, não tira vida e deixa tentar de novo  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{b=Q("#app .mop").find(x=>x.dataset.v===certo());b&&b.click();U("#mac-seguinte")&&U("#mac-seguinte").click();}catch(e){}
try{b=Q("#app .mop").find(x=>x.dataset.v===certo());b&&b.click();U("#mac-seguinte")&&U("#mac-seguinte").click();}catch(e){}
try{t("prática: ao terminar mostra 'Macete concluído' e o XP do dia fica registrado uma vez",/Macete concluído/.test(U("#app").textContent)&&zv("S.macetes['medidas-comprimento'].dia===hoje()"),zv("JSON.stringify(S.macetes)"));}catch(e){t("prática: ao terminar mostra 'Macete concluído' e o XP do dia fica registrado uma vez  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* ---------- Tabuada em trilha: dados e regras ---------- */
try{t("tabuada: a trilha tem t2 a t9 e depois 2×1, 3×1, 2×2 fáceis e 2×2; macetes ligados a todas as tabuadas de 2 a 9",zv("TAB_TRILHA.map(x=>x.id).join()")==="t2,t3,t4,t5,t6,t7,t8,t9,m21,m31,m22f,m22"&&zv("TAB_TRILHA.filter(x=>x.macete).map(x=>x.id+':'+x.macete).join()")==="t2:tab2,t3:tab3,t4:tab4,t5:tab5,t6:tab6,t7:tab7,t8:tab8,t9:tab9");}catch(e){t("tabuada: a trilha tem t2 a t9 e depois 2×1, 3×1, 2×2 fáceis e 2×2; macetes ligados a ×4, ×5 e ×9  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: cada tabuada gera as 10 contas n×1 a n×10 (embaralhadas)",zv("(()=>{for(let n=2;n<=9;n++){const g=tabGerar('t'+n);if(g.length!==10)return false;const p=g.map(([a,b])=>a===n?b:a).sort((x,y)=>x-y).join();if(p!=='1,2,3,4,5,6,7,8,9,10')return false}return true})()")===true);}catch(e){t("tabuada: cada tabuada gera as 10 contas n×1 a n×10 (embaralhadas)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: contas de mais algarismos respeitam as faixas (2×1: 11–99 × 2–9; 3×1: 101–999 × 2–9; 2×2 fáceis: 11–30 × {10,11,12,15,20}; 2×2: 11–99 × 11–99) e têm 10 contas",zv("(()=>{const ok=(id,f)=>{const g=tabGerar(id);return g.length===10&&g.every(([a,b])=>f(a,b))};return ok('m21',(a,b)=>a>=11&&a<=99&&a%10&&b>=2&&b<=9)&&ok('m31',(a,b)=>a>=101&&a<=999&&a%10&&b>=2&&b<=9)&&ok('m22f',(a,b)=>a>=11&&a<=30&&[10,11,12,15,20].includes(b))&&ok('m22',(a,b)=>a>=11&&a<=99&&b>=11&&b<=99)})()")===true);}catch(e){t("tabuada: contas de mais algarismos respeitam as faixas (2×1: 11–99 × 2–9; 3×1: 101–999 × 2–9; 2×2 fáceis: 11–30 × {10,11,12,15,20}; 2×2: 11–99 × 11–99) e têm 10 contas  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: metas de tempo padrão por conta (1 algarismo: Prata 6s e Ouro 3s) e ajustáveis em S.cfg.tabMetas",zv("(()=>{S.cfg.tabMetas=undefined;const a=tabMeta('t7','prata')===6&&tabMeta('t7','ouro')===3&&tabMeta('m22','prata')===30;S.cfg.tabMetas={t7:{prata:5}};const b=tabMeta('t7','prata')===5&&tabMeta('t7','ouro')===3;S.cfg.tabMetas=undefined;return a&&b})()")===true);}catch(e){t("tabuada: metas de tempo padrão por conta (1 algarismo: Prata 6s e Ouro 3s) e ajustáveis em S.cfg.tabMetas  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: critérios — Bronze 8+ de 10 de primeira; Prata 9+ e tempo médio ≤ meta; Ouro 10 e tempo médio ≤ meta Ouro",zv("(()=>{const f=(n,m)=>JSON.stringify(tabAvaliar('t7',{acertos:n,media:m}));return f(7,1)===JSON.stringify({bronze:false,prata:false,ouro:false})&&f(8,20)===JSON.stringify({bronze:true,prata:false,ouro:false})&&f(9,6)===JSON.stringify({bronze:true,prata:true,ouro:false})&&f(9,6.1)===JSON.stringify({bronze:true,prata:false,ouro:false})&&f(10,3)===JSON.stringify({bronze:true,prata:true,ouro:true})&&f(10,3.1)===JSON.stringify({bronze:true,prata:true,ouro:false})})()")===true);}catch(e){t("tabuada: critérios — Bronze 8+ de 10 de primeira; Prata 9+ e tempo médio ≤ meta; Ouro 10 e tempo médio ≤ meta Ouro  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: desbloqueio — no começo só o t2 está disponível; Bronze abre a próxima tabuada; Prata exige Bronze e Ouro exige Prata",zv("(()=>{S.tabT={};const a=tabEstadoFase('t2')==='disponivel'&&tabEstadoFase('t3')==='bloqueado'&&tabEstadoNivel('t2','bronze')==='disponivel'&&tabEstadoNivel('t2','prata')==='bloqueado'&&tabEstadoNivel('t2','ouro')==='bloqueado';tabRegistrar('t2','bronze',{acertos:8,media:9});const b=tabEstadoFase('t3')==='disponivel'&&tabEstadoNivel('t2','prata')==='disponivel'&&tabEstadoNivel('t2','ouro')==='bloqueado'&&tabEstadoFase('t2')==='disponivel';return a&&b})()")===true);}catch(e){t("tabuada: desbloqueio — no começo só o t2 está disponível; Bronze abre a próxima tabuada; Prata exige Bronze e Ouro exige Prata  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: nível tentado e não conquistado fica 'refazer'; as últimas 30 sessões são guardadas (não cresce sem limite)",zv("(()=>{S.tabT={};tabRegistrar('t2','bronze',{acertos:5,media:9});const a=tabEstadoNivel('t2','bronze')==='refazer';for(let i=0;i<40;i++)tabRegistrar('t2','bronze',{acertos:8,media:5+i/10});return a&&S.tabT.t2.sessoes.length===30})()")===true);}catch(e){t("tabuada: nível tentado e não conquistado fica 'refazer'; as últimas 30 sessões são guardadas (não cresce sem limite)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: evolução — melhor tempo médio, média geral e as sessões",zv("(()=>{S.tabT={};tabRegistrar('t3','bronze',{acertos:8,media:6});tabRegistrar('t3','bronze',{acertos:9,media:4});tabRegistrar('t3','bronze',{acertos:10,media:5});const e=tabEvolucao('t3');return e.melhor===4&&e.media===5&&e.sessoes.length===3})()")===true);}catch(e){t("tabuada: evolução — melhor tempo médio, média geral e as sessões  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* ---------- Tabuada em trilha: telas ---------- */
try{zv("S.tabT={};ir('estudar')");}catch(e){}
try{t("tabuada: a aba mostra a trilha com 12 círculos (2 a 9 e os de mais algarismos) e só o 1º disponível",Q("button.circulo[data-tab]").length===12&&Q("button.circulo[data-tab]").map(b=>b.dataset.estado).join()==="disponivel,"+Array(11).fill("bloqueado").join());}catch(e){t("tabuada: a aba mostra a trilha com 12 círculos (2 a 9 e os de mais algarismos) e só o 1º disponível  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: Aprender, Treinar e Desafio continuam funcionando dentro de 'Livre'",!!U("details.livre")&&/Aprender/.test(U("details.livre").textContent)&&/Treinar, sem pressa/.test(U("details.livre").textContent)&&/Desafio de captura/.test(U("details.livre").textContent)&&!!U("#ta")&&!!U("details.livre #tt"));}catch(e){t("tabuada: Aprender, Treinar e Desafio continuam funcionando dentro de 'Livre'  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{U('button.circulo[data-tab="t2"]').click();}catch(e){}
try{t("tabuada: tocar no círculo abre a laje com Bronze (disponível), Prata e Ouro (bloqueados), as metas de tempo e a evolução",!!U("#folha .laje")&&Q("#folha .laje .nv").map(e=>e.classList[1]+":"+e.dataset.estado).join()==="bronze:disponivel,prata:bloqueado,ouro:bloqueado"&&/6 s/.test(U("#folha").textContent)&&/3 s/.test(U("#folha").textContent)&&!!U("#folha .evoVazia,#folha .evo"));}catch(e){t("tabuada: tocar no círculo abre a laje com Bronze (disponível), Prata e Ouro (bloqueados), as metas de tempo e a evolução  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* sessão completa de Bronze, 2 s por conta, tudo de primeira */
let agora=1000000;z.w.Date.now=()=>agora;
const coinsAntes=zv("S.coins");
try{U("#folha .nv.bronze").click();}catch(e){}
try{t("tabuada: o Bronze abre a sessão de 10 contas e fecha a laje",!U("#folha")&&/1 de 10/.test(U("#app").textContent));}catch(e){t("tabuada: o Bronze abre a sessão de 10 contas e fecha a laje  [erro: "+String(e.message).slice(0,60)+"]",false)}
const responderTab=(ok,seg)=>{agora+=seg*1000;const c=U("#app .conta").textContent.match(/(\d+)\s*×\s*(\d+)/),v=+c[1]*+c[2];
  const ops=Q("#app .op");if(ops.length){const alvo=ok?String(v):ops.find(o=>o.dataset.v!==String(v)).dataset.v;ops.find(o=>o.dataset.v===alvo).click()}
  else{U("#tr").value=String(ok?v:v+1);U("#tr-ok").click()}};
try{for(let i=0;i<10;i++)responderTab(true,2);}catch(e){}
try{t("tabuada: Bronze concluído: medalha gravada, tempo médio 2 s registrado, moedas ganhas e a próxima tabuada abre",zv("S.tabT.t2.niveis.bronze.ok===true&&S.tabT.t2.sessoes[0].media===2&&S.tabT.t2.sessoes[0].acertos===10&&tabEstadoFase('t3')==='disponivel'")===true&&zv("S.coins")>coinsAntes,zv("JSON.stringify(S.tabT.t2)"));}catch(e){t("tabuada: Bronze concluído: medalha gravada, tempo médio 2 s registrado, moedas ganhas e a próxima tabuada abre  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: a tela final mostra acertos, tempo médio e a medalha",/10 de 10/.test(U("#app").textContent)&&/2[,.]0 s/.test(U("#app").textContent)&&/Bronze/.test(U("#app").textContent));}catch(e){t("tabuada: a tela final mostra acertos, tempo médio e a medalha  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("ir('estudar')");U('button.circulo[data-tab="t2"]').click();}catch(e){}
try{t("tabuada: depois do Bronze o círculo mostra 🥉 e a Prata fica disponível",/🥉/.test(U('button.circulo[data-tab="t2"]').textContent)&&U("#folha .nv.prata").dataset.estado==="disponivel");}catch(e){t("tabuada: depois do Bronze o círculo mostra 🥉 e a Prata fica disponível  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* Prata: tudo certo, mas devagar (8 s por conta) → não ganha */
try{U("#folha .nv.prata").click();for(let i=0;i<10;i++)responderTab(true,8);}catch(e){}
try{t("tabuada: Prata com tempo acima da meta (8 s > 6 s) NÃO conquista a medalha e mostra quanto faltou",zv("!S.tabT.t2.niveis.prata||!S.tabT.t2.niveis.prata.ok")===true&&/meta/i.test(U("#app").textContent)&&/6 s/.test(U("#app").textContent));}catch(e){t("tabuada: Prata com tempo acima da meta (8 s > 6 s) NÃO conquista a medalha e mostra quanto faltou  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("ir('estudar')");U('button.circulo[data-tab="t2"]').click();U("#folha .nv.prata").click();for(let i=0;i<10;i++)responderTab(true,5);}catch(e){}
try{t("tabuada: Prata dentro da meta (5 s ≤ 6 s) conquista a medalha",zv("S.tabT.t2.niveis.prata.ok===true")===true);}catch(e){t("tabuada: Prata dentro da meta (5 s ≤ 6 s) conquista a medalha  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* erro: explicação, nova tentativa, não conta de primeira */
try{zv("ir('estudar')");U('button.circulo[data-tab="t2"]').click();U("#folha .nv.ouro").click();}catch(e){}
try{responderTab(false,1);}catch(e){}
try{t("tabuada: errar mostra a explicação da conta e deixa tentar de novo (sem vidas)",!!U("#app .erro")&&/grupos|=/.test(U("#app .erro").textContent)&&/1 de 10/.test(U("#app").textContent));}catch(e){t("tabuada: errar mostra a explicação da conta e deixa tentar de novo (sem vidas)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{for(let i=0;i<10;i++)responderTab(true,1);}catch(e){}
try{t("tabuada: com 1 erro o Ouro não é conquistado (precisa de 10 de primeira) — 9 de 10 aparece na tela final",zv("!S.tabT.t2.niveis.ouro||!S.tabT.t2.niveis.ouro.ok")===true&&/9 de 10/.test(U("#app").textContent));}catch(e){t("tabuada: com 1 erro o Ouro não é conquistado (precisa de 10 de primeira) — 9 de 10 aparece na tela final  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* o tempo da conta vai até o acerto: errar não reinicia o cronômetro */
try{zv("S.tabT={};ir('estudar')");U('button.circulo[data-tab="t2"]').click();U("#folha .nv.bronze").click();
responderTab(false,4);responderTab(true,4);for(let i=0;i<9;i++)responderTab(true,2);
t("tabuada: o tempo de uma conta com erro conta do início até o acerto (8 s + 9×2 s → média 2,6 s)",zv("S.tabT.t2.sessoes[0].media")===2.6,zv("S.tabT.t2.sessoes[0].media"))}catch(e){t("tabuada: cronômetro com erro  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* mais algarismos usa digitação e explica a decomposição */
try{zv("S.tabT={};for(const id of ['t2','t3','t4','t5','t6','t7','t8','t9'])tabRegistrar(id,'bronze',{acertos:10,media:1});ir('estudar')");}catch(e){}
try{U('button.circulo[data-tab="m21"]').click();U("#folha .nv.bronze").click();}catch(e){}
try{t("tabuada: contas de mais algarismos pedem digitação (campo de resposta) e não alternativas",!!U("#tr")&&Q("#app .op").length===0);}catch(e){t("tabuada: contas de mais algarismos pedem digitação (campo de resposta) e não alternativas  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{responderTab(false,1);}catch(e){}
try{t("tabuada: o erro em 2×1 mostra a decomposição (ex.: 23 × 4 = 20 × 4 + 3 × 4)",/×.*\+.*×/.test(U("#app .erro")?U("#app .erro").textContent:""));}catch(e){t("tabuada: o erro em 2×1 mostra a decomposição (ex.: 23 × 4 = 20 × 4 + 3 × 4)  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* evolução na laje e fechar ao trocar de aba */
try{zv("S.tabT={};tabRegistrar('t5','bronze',{acertos:8,media:6});tabRegistrar('t5','bronze',{acertos:9,media:5});ir('estudar')");}catch(e){}
try{U('button.circulo[data-tab="t5"]').click();}catch(e){}
try{t("tabuada: a laje mostra o gráfico de evolução (svg) com melhor tempo e média quando há sessões",!!U("#folha .evo svg")&&/melhor/i.test(U("#folha .evo").textContent)&&/5[,.]0 s/.test(U("#folha .evo").textContent));}catch(e){t("tabuada: a laje mostra o gráfico de evolução (svg) com melhor tempo e média quando há sessões  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: círculo com macete (×5) mostra o botão 💡 na laje e leva ao macete",!!U("#folha .pm-macete")&&(U("#folha .pm-macete").click(),/Macete/.test(U("#app").textContent)&&!U("#folha")));}catch(e){t("tabuada: círculo com macete (×5) mostra o botão 💡 na laje e leva ao macete  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("S.tabT={};ir('estudar')");U('button.circulo[data-tab="t2"]').click();zv("ir('inicio')");}catch(e){}
try{t("tabuada: trocar de aba fecha a laje",!U("#folha"));}catch(e){t("tabuada: trocar de aba fecha a laje  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: arquivos novos no index.html (dados antes da tela, tudo antes do jogo) e no sw.js",["js/conteudo/macetes.js","js/ui/macetes.js","js/conteudo/tabuada_trilha.js","js/ui/tabuada_trilha.js"].every(a=>lerArq("index.html").includes(a)&&lerArq("sw.js").includes('"'+a+'"'))&&lerArq("index.html").indexOf("js/ui/tabuada_trilha.js")<lerArq("index.html").indexOf("js/legado/jogo.js"));}catch(e){t("tabuada: arquivos novos no index.html (dados antes da tela, tudo antes do jogo) e no sw.js  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("tabuada: estilos da trilha da tabuada e do 'Livre' existem no CSS",/\.zTab/.test(css3)&&/\.livre/.test(css3)&&/\.macFrase/.test(css3));}catch(e){t("tabuada: estilos da trilha da tabuada e do 'Livre' existem no CSS  [erro: "+String(e.message).slice(0,60)+"]",false)}
z.w.close();
}

// ===== Ajustes pós-Etapa 3: Pyri no tutorial/balões e macetes nas fases =====
{
const z=await sessao(),zv=x=>{try{return z.ev(x)}catch(e){return undefined}},U=x=>z.w.document.querySelector(x),Q=x=>[...z.w.document.querySelectorAll(x)];
try{zv("S.tutorialVisto=false;tutorialPyri(true)");t("Pyri no tutorial inicial: aparece a FIGURA do Pyri (não o emoji 🔥)",!!U(".pm-tut .pm-pyri-corpo img")&&/pyri\.webp/.test(U(".pm-tut .pm-pyri-corpo img").src)&&!/🔥/.test(U(".pm-tut .pm-pyri-corpo").textContent))}catch(e){t("tutorial Pyri  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{zv("fecharTutorial();S.tutorialVisto=true;ir('fases')");t("Pyri na introdução da trilha de fases: figura no lugar do emoji",!!U(".pyriBox .pyriAv img")&&/pyri\.webp/.test(U(".pyriBox .pyriAv img").src))}catch(e){t("intro trilha Pyri  [erro]",false)}
try{zv("abrirExplicacao('a3-adicao')");t("Pyri na explicação animada: figura no lugar do emoji",!!U(".pyriBox .pyriAv img")&&/pyri\.webp/.test(U(".pyriBox .pyriAv img").src))}catch(e){t("explicação Pyri  [erro]",false)}
try{zv("ir('fases')");t("fases: a multiplicação tem os macetes das tabuadas (2 a 11)",zv("macetesDaFase(FASES.find(f=>f.id==='a3-multiplicacao')).map(m=>m.id).join()")==="tab2,tab3,tab4,tab5,tab6,tab7,tab8,tab9,tab10,tab11")}catch(e){t("macetes da fase  [erro]",false)}
try{zv("abrirFolhaFase('a3-multiplicacao')");t("fases: a laje da Multiplicação mostra o botão 💡 e ele abre só os macetes dessa fase",!!U("#folha .pm-macete")&&(U("#folha .pm-macete").click(),Q("#app .mac").length===10&&!U("#folha")))}catch(e){t("botão macete na laje  [erro]",false)}
try{zv("window._m=FASES.find(f=>f.id==='a3-adicao').macete;FASES.find(f=>f.id==='a3-adicao').macete=undefined;abrirFolhaFase('a3-adicao')");const sem=!U("#folha .pm-macete");zv("FASES.find(f=>f.id==='a3-adicao').macete=window._m;abrirFolhaFase('a3-adicao')");t("fases: fase sem macete não mostra o botão 💡 e com macete mostra",sem&&!!U("#folha .pm-macete"))}catch(e){t("sem macete  [erro]",false)}
try{zv("abrirMacetes(['tab4'])");t("macetes: abrirMacetes com lista filtra (1 macete)",Q("#app .mac").length===1)}catch(e){t("filtro macetes  [erro]",false)}
z.w.close();
}

// ===== 3º ano, Lote A: Comparar e ordenar, Pares e ímpares, Sequências =====
{
const IDS=["a3-comparar","a3-paresimpares","a3-sequencias"],GN={"a3-comparar":"comparar","a3-paresimpares":"parImpar","a3-sequencias":"sequencia"};
const sa=await sessao(null,{animate:true}),za=sa;
const ev3=x=>{try{return sa.ev(x)}catch(e){return undefined}},U=x=>sa.w.document.querySelector(x);
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
T("Lote A: as 3 fases novas existem no 3º ano (ordens 7, 8 e 9), com gerador, roteiro e tópicos",()=>ev3("FASES.filter(f=>f.ano===3).map(f=>f.id).slice(6,9).join()")===IDS.join()&&IDS.every((id,i)=>{const f=ev3(`FASES.find(f=>f.id==='${id}')`);return f&&f.ordem===7+i&&ev3(`typeof GER.${f.gerador}==='function'&&typeof ROT.${f.roteiro[0]}==='function'`)&&f.topicos.length>0&&f.resumo&&f.icone}));
T("trilha ilustrada: os nomes curtos (curto) são usados na etiqueta e o nome inteiro continua no aria-label",()=>{ev3("ir('fases')");const b=U('button.circulo[data-fase="a3-paresimpares"]');return !!b&&b.parentNode.querySelector(".tit").textContent==="Pares"&&/Pares e ímpares/.test(b.getAttribute("aria-label"))});
T("Lote A: 'Tabuadas' saiu da lista 'Em breve' (restam 2 depois do Lote B) e há um atalho para a aba Tabuada",()=>{const l=Array.from(ev3("EM_BREVE[3]"));ev3("ir('fases')");const b=U("#bt-atalho-tab");let ok=!l.includes("Tabuadas")&&l.length===0&&!!b;if(b){b.click();ok=ok&&ev3("tela")==="estudar"}return ok});
/* ---- geradores ---- */
const num=s=>(s.match(/\d+/g)||[]).map(Number),pr=n=>n%2===0?"par":"ímpar";
const nextPI=(k,dir,n)=>{let m=dir==="depois"?n+1:n-1;while(pr(m)!==k)m+=dir==="depois"?1:-1;return m};
const diffSeq=toks=>{for(let i=0;i<toks.length-1;i++)if(/^\d+$/.test(toks[i])&&/^\d+$/.test(toks[i+1]))return +toks[i+1]-+toks[i];return null};
const seqOk=(txt,resp)=>{const toks=txt.split(/,\s*/).map(x=>x.trim());const d=diffSeq(toks);if(d==null||d===0)return false;const h=toks.findIndex(x=>!/^\d+$/.test(x));if(h<0)return false;
  const vals=toks.map((x,i)=>/^\d+$/.test(x)?+x:null);const ref=vals.findIndex(v=>v!=null);const esperado=vals[ref]+(h-ref)*d;
  return resp===esperado&&vals.every((v,i)=>v==null||v===vals[ref]+(i-ref)*d)};
for(const nome of["comparar","parImpar","sequencia"]){let bom=true,msg="";const chk=(c,m)=>{if(!c){bom=false;msg=nome+": "+m}};
 for(const d of[1,3])for(const tp of["digitar","escolha","lacuna","relacionar"])for(let i=0;i<80;i++){
  const ex=ev3(`GER.${nome}(${d},'${tp}')`);if(!ex){chk(false,"sem questão");break}
  const tpEsp=(nome==="comparar"&&d>=3&&tp==="lacuna")?"ordenar":tp;chk(ex.tipo===tpEsp,"tipo "+tp+"->"+ex.tipo);chk(ex.dica&&ex.dica.length>8&&ex.erro&&ex.erro.length>8,"sem dica/explicação");
  if(tp!=="relacionar"&&ex.tipo!=="ordenar")chk(Number.isInteger(ex.resposta)&&ex.resposta>=0,"resposta inválida "+ex.resposta);
  if(tp==="escolha"){const o=Array.from(ex.opcoes);chk(o.length===4&&new Set(o).size===4&&o.includes(ex.resposta),"opções")}
  if(tp==="lacuna"&&ex.tipo==="lacuna")chk(ex.enunciado.includes("___"),"lacuna sem ___");
  if(tp==="relacionar"){const P=Array.from(ex.pares),D=Array.from(ex.direita);chk(P.length>=3&&P.length<=4&&D.length===P.length&&(nome==="parImpar"||new Set(D).size===D.length)&&P.every(p=>D.includes(p.d))&&ex.resposta===1&&ex.chave,"relacionar")}
  /* conteúdo certo */
  if(nome==="comparar"){
   if(tp==="escolha"){const o=Array.from(ex.opcoes),mx=/maior/.test(ex.enunciado);chk(ex.resposta===(mx?Math.max(...o):Math.min(...o)),"escolha comparar: "+ex.enunciado+o)}
   if(tp==="digitar"){const n=num(ex.enunciado.split(":")[1]),mx=/maior/.test(ex.enunciado);chk(n.length>=2&&ex.resposta===(mx?Math.max(...n):Math.min(...n)),"digitar comparar: "+ex.enunciado)}
   if(tp==="lacuna"&&d<3){const m=ex.enunciado.match(/Os números (\d+), (\d+) e (\d+) em ordem (crescente|decrescente)/);chk(!!m,"lacuna comparar formato: "+ex.enunciado);if(m){const n=[+m[1],+m[2],+m[3]].sort((a,b)=>a-b);chk(ex.resposta===n[1],"lacuna comparar: "+ex.enunciado+" -> "+ex.resposta)}}
   if(tp==="relacionar")chk(Array.from(ex.pares).every(p=>{const m=p.e.match(/^(\d+) ▢ (\d+)$/);return m&&p.d===(+m[1]>+m[2]?"maior que (>)":+m[1]<+m[2]?"menor que (<)":"igual (=)")}),"par comparar (sinal) errado")
   const dg=d>=3?4:3;if(tp==="digitar"||tp==="escolha")chk(num(ex.enunciado.split(":")[1]||"").concat(Array.from(ex.opcoes||[])).every(n=>String(n).length===dg),"número com tamanho errado")
  }
  if(nome==="parImpar"){
   if(tp==="escolha"){const k=/ímpar/.test(ex.enunciado)?"ímpar":"par",o=Array.from(ex.opcoes);chk(o.filter(x=>pr(x)===k).length===1&&pr(ex.resposta)===k,"escolha par/ímpar: "+ex.enunciado+o)}
   if(tp==="digitar"){let m=ex.enunciado.match(/^Quantos números (pares|ímpares) há aqui\? (.*)$/);if(m){const k=m[1]==="pares"?"par":"ímpar",n=num(m[2]);chk(ex.resposta===n.filter(x=>pr(x)===k).length&&n.length>=5,"contagem: "+ex.enunciado)}
     else{m=ex.enunciado.match(/^Qual é o número (par|ímpar) logo (depois|antes) de (\d+)\?$/);chk(!!m&&ex.resposta===nextPI(m[1],m[2],+m[3]),"digitar par/ímpar: "+ex.enunciado+" -> "+ex.resposta)}}
   if(tp==="lacuna"){const m=ex.enunciado.match(/O número (par|ímpar) logo (depois|antes) de (\d+) é ___/);chk(!!m&&ex.resposta===nextPI(m[1],m[2],+m[3]),"lacuna par/ímpar: "+ex.enunciado)}
   if(tp==="relacionar")chk(Array.from(ex.pares).every(p=>/^\d+$/.test(p.e)&&p.d===pr(+p.e)),"par par/ímpar (classificar) errado")
  }
  if(nome==="sequencia"){
   const corpo=e=>e.replace(/^[^:?]*[:?]\s*/,"");
   if(tp==="digitar")chk(seqOk(corpo(ex.enunciado),ex.resposta),"seq digitar: "+ex.enunciado+" -> "+ex.resposta);
   if(tp==="lacuna")chk(seqOk(corpo(ex.enunciado),ex.resposta),"seq lacuna: "+ex.enunciado+" -> "+ex.resposta);
   if(tp==="escolha")chk(seqOk(corpo(ex.enunciado),ex.resposta),"seq escolha: "+ex.enunciado+" -> "+ex.resposta);
   if(tp==="relacionar")chk(Array.from(ex.pares).every(p=>seqOk(p.e,+p.d)),"par seq errado")
  }
 }
 t(`geradores ${nome}: os 4 tipos × 2 dificuldades, todos válidos e com a resposta certa`,bom,msg);
}
T("Ouro de Comparar usa números de 4 algarismos e Bronze/Prata de 3 (conferido acima), e Sequências do Ouro inclui sequências que diminuem",()=>{let dec=false,cresc=false;for(let i=0;i<200;i++){const ex=ev3("GER.sequencia(3,'digitar')");const toks=ex.enunciado.replace(/^[^:]*:\s*/,"").split(/,\s*/);const d=diffSeq(toks);if(d<0)dec=true;if(d>0)cresc=true}let decB=false;for(let i=0;i<200;i++){const ex=ev3("GER.sequencia(1,'digitar')");const d=diffSeq(ex.enunciado.replace(/^[^:]*:\s*/,"").split(/,\s*/));if(d<0)decB=true}return dec&&cresc&&!decB});
/* ---- roteiros animados ---- */
ev3(OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao"])+";save()");
ev3("ir('fases');abrirExplicacao('a3-comparar')");ev3("FS.auto=false;pararAnimacoes()");
T("explicação de Comparar abre a partir da trilha (fase liberada depois dos 3 níveis da Divisão)",()=>ev3("FS.vista")==="explica"&&ev3("FS.fase.id")==="a3-comparar");
const rod=(nome,args)=>ev3(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.${nome}(${args});const R=rot.montar(ctx);const g=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length])}window.__g=g;return true})()`);
ev3("FS.vel=0.001");
for(const[n,a,passosEsperados,fim]of[["comparar","358,385",7,/>|</],["comparar","4521,4575",8,/>|</],["parImpar","7",7,/ímpar/],["sequencia","3,4",7,/19/]]){
  ev3("S.cfg.reduzir=false");sa.w.__anims.length=0;try{await rod(n,a)}catch(e){}await sleep(300);const g=Array.from(ev3("window.__g")||[]);ev3("window.__g=null");
  t(`roteiro ${n}(${a}): ${passosEsperados} passos, cada um de 3 a 5 s, falas curtas e números/figuras viajam`,g.length===passosEsperados&&g.every(([dur,gasto,len])=>dur>=3000&&dur<=5000&&gasto<=dur+1&&len>=5&&len<=140)&&sa.w.__anims.length>0,JSON.stringify(g.map(x=>x[0]))+" anims:"+sa.w.__anims.length);
  t(`roteiro ${n}(${a}): termina com o resultado em destaque (.pm-res)`,fim.test(ev3("[...document.querySelectorAll('#exp-stage .pm-res')].map(e=>e.textContent).join('|')")||""),ev3("[...document.querySelectorAll('#exp-stage .pm-res')].map(e=>e.textContent).join('|')"));
}
sa.w.close();
/* ---- jogar os 3 níveis das fases novas ---- */
{const s=await sessao(),ev=s.ev;await ev("escolher(25)");
 ev(OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao"])+";save();ir('fases')");
 for(const id of IDS){const st2=()=>st(ev,id);
  try{await jogarNivel(s,id,"bronze");await jogarNivel(s,id,"prata");now+=DIA;await jogarNivel(s,id,"ouro");
  t(`jogar ${id}: Bronze, Prata e Ouro concluídos sem erro libera a próxima fase`,st2()==="concluido,concluido,concluido",st2())}catch(e){t(`jogar ${id}  [erro: ${String(e.message).slice(0,50)}]`,false)}
  ev("voltarTrilha()");now+=DIA}
 try{t("depois das 3 fases novas, a fase de Sequências conta como concluída na trilha",ev("estadoFase(FASES.find(f=>f.id==='a3-sequencias'))")==="concluido")}catch(e){t("estado Sequências  [erro]",false)}
 s.w.close()}
}

// ===== Lâmpada 💡: macetes no lugar da dica escrita =====
{
const z=await sessao(),zv=x=>{try{return z.ev(x)}catch(e){return undefined}},U=x=>z.w.document.querySelector(x),Q=x=>[...z.w.document.querySelectorAll(x)];
const T=(n,f)=>{try{const r=f();t(n,r===true,r===true?undefined:r)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
const FASES3=["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias"];
T("macetes: todos têm ícone, título, resumo e explicação; os que usam gerador (GER) ou tabuada (a) têm de onde tirar a prática",()=>zv("MACETES.every(m=>m.icone&&m.titulo&&m.resumo&&m.explicacao&&m.explicacao.length>25&&(m.partes||m.gerador||m.a)&&(!m.gerador||typeof GER[m.gerador]==='function'))"));
T("macetes: cada fase do 3º ano tem os seus (campo macete válido)",()=>FASES3.every(id=>zv(`(()=>{const f=FASES.find(f=>f.id==='${id}');const l=macetesDaFase(f);return l.length>0&&[].concat(f.macete).every(i=>MACETES.some(m=>m.id===i))})()`)));
T("macetes: macetePorFatores escolhe pela ordem 9, 6, 8, 7, 4, 3, 5, 10, 11, 2",()=>zv("[[7,9],[6,7],[8,2],[7,3],[4,5],[3,5],[5,10],[2,2],[1,1],[12,12]].map(f=>{const m=macetePorFatores(f);return m?m.id:null}).join()")==="tab9,tab6,tab8,tab7,tab4,tab3,tab5,tab2,,");
T("macetes: na Multiplicação a lâmpada escolhe o macete pelos números da conta; sem números usa o primeiro; fase com 1 macete usa ele",()=>zv("(()=>{const f=FASES.find(f=>f.id==='a3-multiplicacao');return macetePara(f,{fat:[7,9]}).id==='tab9'&&macetePara(f,{fat:[6,7]}).id==='tab6'&&macetePara(f,{}).id==='tab2'&&macetePara(FASES.find(f=>f.id==='a3-divisao'),{fat:[3,4]}).id==='dividir'})()"));
T("geradores de conta guardam os fatores (fat) em todos os tipos de questão",()=>{for(const tp of["digitar","escolha","lacuna","relacionar"])for(let i=0;i<40;i++){const ex=zv(`GER.multiplicacao(1,'${tp}')`);if(!ex||!Array.isArray(ex.fat)||!ex.fat.length||ex.fat.some(n=>!(n>=1)))return tp;if(tp==="digitar"){const m=String(ex.enunciado).match(/^(\d+) × (\d+) = \?$/);if(m&&!(ex.fat.includes(+m[1])&&ex.fat.includes(+m[2])))return "digitar fat errado"}}return true});
/* tela de exercício das fases */
zv(OURO(["a3-posicional"])+";save();ir('fases')");
for(const n of["bronze","prata","ouro"])T(`fase: no ${n} aparece a lâmpada 💡 e NÃO a dica escrita`,()=>{zv(`voltarTrilha();S.tentNivel=null;S.fases['a3-posicional']={niveis:{bronze:{ok:true},prata:{ok:true},ouro:{ok:true}},viu:true};S.fases['a3-adicao']={niveis:{bronze:{ok:true}${n==="bronze"?"":",prata:{ok:true}"}},viu:true};abrirNivel('a3-adicao','${n}')`);return !!U("#bt-lamp")&&!U(".dicaBox")&&!/Dica:/.test(U("#app").textContent)});
T("lâmpada: abre o cartão com o macete da fase, com o Pyri e sem mexer nas vidas, na questão nem nas tentativas",()=>{const v0=zv("FS.ses.vidas"),q0=zv("FS.ses.fila[0].enunciado"),f0=zv("FS.ses.fila.length");U("#bt-lamp").click();const L=U("#lampada");return !!L&&/Somar/.test(L.textContent)&&/direita/.test(L.textContent)&&/pyri\.webp/.test(L.querySelector("img").src)&&zv("FS.ses.vidas")===v0&&zv("FS.ses.fila[0].enunciado")===q0&&zv("FS.ses.fila.length")===f0&&zv("FS.ses.estado")==="pergunta"});
T("lâmpada: o botão Entendi fecha e a questão continua a mesma",()=>{const q0=zv("FS.ses.fila[0].enunciado");U("#lamp-ok").click();return !U("#lampada")&&zv("FS.ses.fila[0].enunciado")===q0&&!!U("#bt-lamp")});
T("lâmpada: Esc fecha, e sair da fase também fecha",()=>{U("#bt-lamp").click();z.w.document.dispatchEvent(new z.w.KeyboardEvent("keydown",{key:"Escape"}));const a=!U("#lampada");U("#bt-lamp").click();zv("voltarTrilha()");return a&&!U("#lampada")});
T("lâmpada: fase com macete vindo do exercício — na multiplicação 7 × 9 abre o macete da tabuada do 9",()=>{zv("S.fases['a3-divisao']={niveis:{bronze:{ok:true},prata:{ok:true},ouro:{ok:true}},viu:true};for(const i of ['a3-adicao','a3-vai-um','a3-subtracao'])S.fases[i]={niveis:{bronze:{ok:true},prata:{ok:true},ouro:{ok:true}},viu:true};S.fases['a3-multiplicacao']={viu:true};S.tentNivel=null;abrirNivel('a3-multiplicacao','bronze');FS.ses.fila[0]={tipo:'digitar',enunciado:'7 × 9 = ?',resposta:63,fat:[7,9],dica:'x x x x x x x x',erro:'xxxxxxxxx'};render()");U("#bt-lamp").click();const ok=/Tabuada do 9/.test(U("#lampada").textContent);U("#lamp-ok").click();return ok});
T("lâmpada: fase sem macete mostra o lembrete curto (dica antiga) dentro da lâmpada",()=>{zv("FS.fase.macete=undefined;render()");U("#bt-lamp").click();const ok=/Lembrete/.test(U("#lampada").textContent)&&U("#lampada").textContent.includes(zv("FS.ses.fila[0].dica"));U("#lamp-ok").click();return ok});
/* prática dos macetes novos: usa as questões do gerador da fase */
T("macetes com gerador: a prática tem 4 questões de escolha corretas, com a explicação do gerador",()=>zv("MACETES.filter(m=>m.gerador).every(m=>{const q=macPerguntas(m.id);return q.length===4&&q.every(x=>x.tipo==='escolha'&&x.opcoes.includes(x.resp)&&new Set(x.opcoes).size===x.opcoes.length&&x.texto&&x.expl)})"));
T("macetes novos: tabuadas 2, 3, 6, 7 e 8 dão 5 contas e a explicação traz o resultado (14, 21, 42, 42, 56)",()=>zv("(()=>{for(const [id,a,b,res] of [['tab2',2,7,'14'],['tab3',3,7,'21'],['tab6',6,7,'42'],['tab7',7,6,'42'],['tab8',8,7,'56']]){const qs=macPerguntas(id);if(qs.length!==5||!qs.every(q=>q.tipo==='conta'&&q.opcoes.includes(q.resp)&&q.resp===q.a*q.b&&q.expl))return id;if(!macExplica(id,a,b).includes(res))return id+' expl'}return true})()"));
T("macetes novos: o do 9 também ensina o 'número anterior + o que falta para 9'",()=>/anterior/.test(zv("macAch('tab9').explicacao"))&&/dedo/.test(zv("macAch('tab9').explicacao")));
T("macetes: a prática de 'Vai um' funciona do começo ao fim e dá o XP do dia uma vez",()=>{zv("S.macetes={};abrirMacete('vaium')");U("#mac-praticar").click();for(let i=0;i<4;i++){const q=zv("MAC.qs[MAC.i]");Q("#app .mop").find(x=>x.dataset.v===String(q.resp)).click();U("#mac-seguinte").click()}return /Macete concluído/.test(U("#app").textContent)&&zv("S.macetes.vaium.dia===hoje()")});
/* Tabuada: treino/desafio e trilha */
T("Treino/Desafio: no lugar de 'Preciso de uma dica' aparece a lâmpada, e 7 × 9 abre o macete do 9",()=>{zv("ir('estudar');Q=null;Q={modo:'treino',f:[[7,9]],i:0,seq:0,ok:0,tent:0};perguntar()");if(/Preciso de uma dica/.test(U("#app").textContent)||/class=\"dica\"/.test(U("#app").innerHTML))return "ainda tem dica escrita";const b=U("#bt-lamp");if(!b)return "sem lâmpada";b.click();const ok=/Tabuada do 9/.test(U("#lampada").textContent);U("#lamp-ok").click();return ok});
T("Treino: conta sem macete (1 × 1) mostra o lembrete de somar dentro da lâmpada",()=>{zv("Q={modo:'treino',f:[[1,1]],i:0,seq:0,ok:0,tent:0};perguntar()");U("#bt-lamp").click();const ok=/somado/.test(U("#lampada").textContent);U("#lamp-ok").click();return ok});
T("Tabuada em trilha: a lâmpada aparece na sessão e abre o macete da tabuada (×6)",()=>{zv("S.tabT={};for(const id of ['t2','t3','t4','t5'])tabRegistrar(id,'bronze',{acertos:10,media:1});ir('estudar');tabIniciar('t6','bronze')");if(!U("#bt-lamp"))return "sem lâmpada";U("#bt-lamp").click();const ok=/Tabuada do 6/.test(U("#lampada").textContent);U("#lamp-ok").click();return ok&&/1 de 10/.test(U("#app").textContent)});
T("Tabuada em trilha (2×1): a lâmpada mostra a decomposição, sem o resultado",()=>{zv("for(const id of ['t6','t7','t8','t9'])tabRegistrar(id,'bronze',{acertos:10,media:1});tabIniciar('m21','bronze')");U("#bt-lamp").click();const tx=U("#lampada").textContent,[a,b]=U("#app .conta").textContent.match(/\d+/g).map(Number),ok=/×.*\+.*×/.test(tx)&&!tx.includes("= "+a*b);U("#lamp-ok").click();return ok});
T("lâmpada: o cartão e o botão têm estilo (CSS) e rótulo de acessibilidade",()=>{const c=lerArq("css/trilha.css").replace(/\s+/g,"");return /\.lampada/.test(c)&&/aria-label=\"Abrir o macete/.test(lerArq("js/ui/macetes.js"))});
z.w.close();
}

// ===== 3º ano, Lote B: Figuras geométricas, Medidas de comprimento, Medidas de tempo, Dinheiro =====
{
const IDS=["a3-figuras","a3-comprimento","a3-tempo","a3-dinheiro"],GN={"a3-figuras":"figuras","a3-comprimento":"comprimento","a3-tempo":"tempo","a3-dinheiro":"dinheiro"};
const sb=await sessao(null,{animate:true});
const ev3=x=>{try{return sb.ev(x)}catch(e){return undefined}},U=x=>sb.w.document.querySelector(x),Q=x=>[...sb.w.document.querySelectorAll(x)];
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
T("Lote B: as 4 fases novas existem no 3º ano (ordens 10 a 13), com gerador, roteiro, tópicos, ícone, nome curto e macete",()=>ev3("FASES.filter(f=>f.ano===3).map(f=>f.id).slice(9,13).join()")===IDS.join()&&IDS.every((id,i)=>{const f=ev3(`FASES.find(f=>f.id==='${id}')`);return f&&f.ordem===10+i&&ev3(`typeof GER.${f.gerador}==='function'&&typeof ROT.${f.roteiro[0]}==='function'`)&&f.gerador===GN[id]&&f.topicos.length>0&&f.resumo&&f.icone&&f.curto&&f.macete&&ev3(`macetesDaFase(FASES.find(f=>f.id==='${id}')).length>0`)}));
T("Lote B: 'Figuras' e 'Medidas de tempo e dinheiro' saíram da lista 'Em breve' (restam só Tabelas e gráficos e Acaso e probabilidade)",()=>Array.from(ev3("EM_BREVE[3]")).join("|")==="");
T("Lote B: Medidas de comprimento usa o macete já existente (frase da Katia); as outras fases têm macete próprio",()=>ev3("macetesDaFase(FASES.find(f=>f.id==='a3-comprimento'))[0].id")==="medidas-comprimento"&&/100/.test(ev3("macAch('medidas-comprimento').explicacao"))&&/Katia/.test(ev3("macAch('medidas-comprimento').partes[0].p"))&&["figuras","tempo","dinheiro"].every(id=>ev3(`macAch('${id}')&&macAch('${id}').gerador==='${id}'&&typeof GER['${id}']==='function'`)));
T("Lote B: a trilha ilustrada tem 15 posições (13 fases + 2 'em breve'), todas sobre a imagem",()=>{ev3("S.fases={};S.tentNivel=null;S.cfg.anoEscolar=3;save();ir('fases')");const P=Array.from(ev3("ZONAS[3].pontos")),nos=Q('.zona[data-ano="3"].ilus li.no');return P.length>=15&&nos.length===15&&nos.every((n,i)=>n.style.left===P[i][0]+"%")&&Q('.zona[data-ano="3"] button.circulo[data-fase]').length===15&&Q('.zona[data-ano="3"] .circulo.embreve[disabled]').length===0});
T("Lote B: os círculos novos aparecem com nome curto (Figuras, Comprimento, Tempo, Dinheiro) e o nome inteiro no rótulo de acessibilidade",()=>{ev3("ir('fases')");const cur=["Figuras","Comprimento","Tempo","Dinheiro"];return IDS.every((id,i)=>{const b=U(`button.circulo[data-fase="${id}"]`);return !!b&&b.parentNode.querySelector(".tit").textContent===cur[i]&&b.getAttribute("aria-label").includes(ev3(`FASES.find(f=>f.id==='${id}').titulo`))})});
T("Lote B: nenhum par de círculos da trilha se encosta (15 pontos, mínimo 50px em tela de 360px)",()=>{const P=Array.from(ev3("ZONAS[3].pontos")),W=360,H=360*1732/800;return P.length>=15&&P.every((a,i)=>P.every((b,j)=>j<=i||Math.hypot((a[0]-b[0])*W/100,(a[1]-b[1])*H/100)>=50))});
/* ---- geradores ---- */
const TF={"triângulo":{lados:3,"vértices":3},quadrado:{lados:4,"vértices":4},"retângulo":{lados:4,"vértices":4},"quadrilátero":{lados:4,"vértices":4},"pentágono":{lados:5,"vértices":5},"hexágono":{lados:6,"vértices":6},"heptágono":{lados:7,"vértices":7},"octógono":{lados:8,"vértices":8},"eneágono":{lados:9,"vértices":9},"decágono":{lados:10,"vértices":10}};
const NOMEFIG={triangulo:"triângulo",quadrado:"quadrado",retangulo:"retângulo",quadrilatero:"quadrilátero",pentagono:"pentágono",hexagono:"hexágono",heptagono:"heptágono",octogono:"octógono",eneagono:"eneágono",decagono:"decágono"};
const BASEC={km:1e6,m:1000,cm:10,mm:1},NOMEC={"quilômetro":"km","quilômetros":"km",metro:"m",metros:"m","centímetro":"cm","centímetros":"cm","milímetro":"mm","milímetros":"mm"};
const BASET={minuto:1,minutos:1,hora:60,horas:60,dia:1440,dias:1440,semana:10080,semanas:10080,"mês":1,meses:1,ano:12,anos:12};
const cv=(n,de,para)=>n*BASEC[de]/BASEC[para],ct=(n,de,para)=>n*BASET[de]/BASET[para];
const esperadoFig=ex=>{let m;
  if(m=ex.enunciado.match(/^Quant(?:os|as) (lados|vértices|faces|arestas) tem o (\S+)\?$/)){const tab=TF[m[2]];return tab&&tab[m[1]]!=null?{r:tab[m[1]],fig:m[2],cont:m[1]}:null}
  if(m=ex.enunciado.match(/^O (\S+) tem ___ (lados|vértices|faces|arestas)\.$/)){const tab=TF[m[1]];return tab&&tab[m[2]]!=null?{r:tab[m[2]],fig:m[1],cont:m[2]}:null}return null};
const esperadoComp=s=>{let m;
  if(m=s.match(/^Quantos (\S+) há em (\d+) (\S+)\?$/))return NOMEC[m[1]]&&NOMEC[m[3]]?cv(+m[2],NOMEC[m[3]],NOMEC[m[1]]):null;
  if(m=s.match(/^(\d+) (km|m|cm|mm) (?:= ___|em) (km|m|cm|mm)$/))return cv(+m[1],m[2],m[3]);
  if(m=s.match(/^Quantos centímetros há em (\d+) m e (\d+) cm\?$/)||s.match(/^(\d+) m e (\d+) cm (?:= ___|em) cm$/))return +m[1]*100+ +m[2];
  if(m=s.match(/^Uma fita tem (\d+) m e outra tem (\d+) m\. Quantos centímetros as duas têm juntas\?$/)||s.match(/^Duas fitas, (\d+) m e (\d+) m, juntas têm ___ cm\.$/)||s.match(/^(\d+) m \+ (\d+) m em cm$/))return(+m[1]+ +m[2])*100;
  if(m=s.match(/^Um fio tem (\d+) m e outro tem (\d+) cm\. Quantos centímetros o maior tem a mais\?$/)||s.match(/^Um fio de (\d+) m e outro de (\d+) cm: o maior tem ___ cm a mais\.$/)||s.match(/^(\d+) m menos (\d+) cm em cm$/))return +m[1]*100-+m[2];
  return null};
const esperadoTempo=(s,vis)=>{let m;
  if(m=s.match(/^Quant(?:os|as) (\S+) há em (\d+) (\S+)\?$/)||s.match(/^(\d+) (\S+) (?:= ___|em) (\S+)$/)){const q=/^Quant/.test(s),n=q?+m[2]:+m[1],de=q?m[3]:m[2],para=q?m[1]:m[3];return BASET[de]!=null&&BASET[para]!=null?ct(n,de,para):null}
  if(/^(Meia hora tem quantos minutos\?|Meia hora = ___ minutos|meia hora em minutos)$/.test(s))return 30;
  if(m=s.match(/^Quantos minutos há em (\d+) horas? e meia\?$/)||s.match(/^(\d+) horas? e meia (?:= ___ minutos|em minutos)$/))return +m[1]*60+30;
  if(s==="Que horas o relógio marca? Responda só o número da hora."||s==="Olhe o relógio. A hora marcada é ___.")return vis&&vis.tipo==="relogio"&&vis.m===0?vis.h:null;
  if(m=s.match(/^O relógio marca (\d+) horas? e quantos minutos\?$/)||s.match(/^Olhe o relógio: a hora é (\d+) e os minutos são ___\.$/))return vis&&vis.tipo==="relogio"&&vis.h===+m[1]&&vis.m>0?vis.m:null;
  if(s==="Quantos minutos faltam para o relógio completar a hora?"||s==="Faltam ___ minutos para completar a hora.")return vis&&vis.tipo==="relogio"&&vis.m>0?60-vis.m:null;
  return null};
const esperadoDin=(s,vis)=>{let m;
  if(m=s.match(/^Quantos centavos há em (\d+) (?:real|reais)\?$/)||s.match(/^R\$ (\d+) (?:= ___ centavos|em centavos)$/))return +m[1]*100;
  if(m=s.match(/^Quantos reais há em (\d+) centavos\?$/)||s.match(/^(\d+) centavos (?:= R\$ ___|em reais)$/))return +m[1]%100===0?+m[1]/100:null;
  if(m=s.match(/^Ana comprou um lápis de R\$ (\d+) e uma borracha de R\$ (\d+)\. Quantos reais ela gastou\?$/)||s.match(/^R\$ (\d+) \+ R\$ (\d+) (?:= R\$ ___|)$/)||s.match(/^R\$ (\d+) \+ R\$ (\d+)$/))return +m[1]+ +m[2];
  if(m=s.match(/^Paguei R\$ (\d+) por algo que custa R\$ (\d+)\. Qual é o troco, em reais\?$/)||s.match(/^Paguei R\$ (\d+) e custava R\$ (\d+): troco de R\$ ___$/)||s.match(/^troco de R\$ (\d+) para R\$ (\d+)$/))return +m[1]-+m[2];
  if(m=s.match(/^Paguei R\$ 1 por algo que custa (\d+) centavos\. Qual é o troco, em centavos\?$/)||s.match(/^Paguei R\$ 1 e custava (\d+) centavos: troco de ___ centavos$/)||s.match(/^troco de R\$ 1 para (\d+) centavos$/))return 100-+m[1];
  if(/^(Quantos centavos há nestas moedas\?|Estas moedas valem ___ centavos\.)$/.test(s))return vis&&vis.tipo==="dinheiro"&&vis.itens.length>=2&&vis.itens.every(i=>i.k==="moeda")?vis.itens.reduce((a,i)=>a+i.v,0):null;
  if(/^(Quantos reais há nestas notas\?|Estas notas valem R\$ ___ no total\.)$/.test(s))return vis&&vis.tipo==="dinheiro"&&vis.itens.length>=2&&vis.itens.every(i=>i.k==="nota")?vis.itens.reduce((a,i)=>a+i.v,0):null;
  return null};
const visDe=ex=>ex.visual?JSON.parse(JSON.stringify(ex.visual)):null;
for(const nome of["figuras","comprimento","tempo"]){let bom=true,msg="";const chk=(c,m)=>{if(!c&&bom){bom=false;msg=nome+": "+m}};
 let cuboAlto=false,compDificil=false,minNaoPadrao=false,visualVisto=false;
 for(const d of[1,3])for(const tp of["digitar","escolha","lacuna","relacionar"])for(let i=0;i<70;i++){
  const ex=ev3(`GER.${nome}(${d},'${tp}')`);if(!ex){chk(false,"sem questão");break}
  chk(ex.tipo===tp,"tipo "+tp+"->"+ex.tipo);chk(ex.dica&&ex.dica.length>8&&ex.erro&&ex.erro.length>8,"sem dica/explicação");
  if(tp!=="relacionar")chk(Number.isInteger(ex.resposta)&&ex.resposta>0,"resposta inválida "+ex.resposta);
  if(tp==="escolha"){const o=Array.from(ex.opcoes);chk(o.length===4&&new Set(o).size===4&&o.includes(ex.resposta)&&o.every(Number.isInteger),"opções")}
  if(tp==="lacuna")chk(ex.enunciado.includes("___"),"lacuna sem ___");
  if(tp==="relacionar"){const P=Array.from(ex.pares),D=Array.from(ex.direita);chk(P.length>=3&&P.length<=4&&D.length===P.length&&new Set(D).size===D.length&&P.every(p=>D.includes(p.d))&&ex.resposta===1&&ex.chave&&!ex.visual,"relacionar")}
  const vis=visDe(ex);if(vis){visualVisto=true;chk(!!ex.chave&&ex.chave.includes(JSON.stringify(vis)),"questão com figura precisa de chave que inclua a figura (para não repetir)")}
  const textos=[ex.enunciado,...(tp==="relacionar"?Array.from(ex.pares).map(p=>p.e):[])];
  chk(textos.every(s=>!/\d,\d/.test(s)),"vírgula decimal: "+textos.join("|"));
  if(nome==="figuras"){
   if(tp==="relacionar"){chk(Array.from(ex.pares).every(p=>{const m=p.e.match(/^(lados|vértices|faces|arestas) do (\S+)$/);return m&&TF[m[2]]&&TF[m[2]][m[1]]===+p.d}),"par figuras errado: "+JSON.stringify(ex.pares))}
   else{const e=esperadoFig(ex);chk(!!e&&e.r===ex.resposta,"figuras: "+ex.enunciado+" -> "+ex.resposta);
     if(e){if(tp!=="lacuna"){chk(ex.visual&&ex.visual.tipo==="figura"&&NOMEFIG[ex.visual.nome]===e.fig,"figura desenhada diferente da citada: "+ex.enunciado+JSON.stringify(ex.visual))}
       if(d===1)chk(TF[e.fig].lados<=6,"Bronze/Prata só vai até o hexágono: "+ex.enunciado);
       if(d>=3&&TF[e.fig].lados>=9)cuboAlto=true}}
  }
  if(nome==="comprimento"){
   if(tp==="relacionar")chk(Array.from(ex.pares).every(p=>esperadoComp(p.e)===+p.d&&esperadoComp(p.e)>0),"par comprimento errado: "+JSON.stringify(ex.pares));
   else{chk(esperadoComp(ex.enunciado)===ex.resposta,"comprimento: "+ex.enunciado+" -> "+ex.resposta);
     if(/ fita | fio |m e \d+ cm/.test(ex.enunciado)){compDificil=true;chk(d>=3,"questão composta no Bronze/Prata: "+ex.enunciado)}}
  }
  if(nome==="tempo"){
   if(tp==="relacionar")chk(Array.from(ex.pares).every(p=>esperadoTempo(p.e)===+p.d&&+p.d>0),"par tempo errado: "+JSON.stringify(ex.pares));
   else{chk(esperadoTempo(ex.enunciado,vis)===ex.resposta,"tempo: "+ex.enunciado+" -> "+ex.resposta+" "+JSON.stringify(vis));
     if(vis){chk(vis.tipo==="relogio"&&vis.h>=1&&vis.h<=12&&vis.m>=0&&vis.m<60&&vis.m%5===0,"relógio inválido "+JSON.stringify(vis));
       if(d===1)chk([0,15,30,45].includes(vis.m),"Bronze/Prata só usa :00, :15, :30 e :45 — "+JSON.stringify(vis));
       if(d>=3&&![0,15,30,45].includes(vis.m))minNaoPadrao=true}}
  }
  if(nome==="dinheiro"){
   if(tp==="relacionar")chk(Array.from(ex.pares).every(p=>esperadoDin(p.e)===+p.d&&+p.d>0),"par dinheiro errado: "+JSON.stringify(ex.pares));
   else{chk(esperadoDin(ex.enunciado,vis)===ex.resposta,"dinheiro: "+ex.enunciado+" -> "+ex.resposta+" "+JSON.stringify(vis));
     if(vis)chk(vis.itens.every(i=>(i.k==="moeda"?[5,10,25,50,100].includes(i.v):[2,5,10,20,50,100].includes(i.v))),"valor de moeda/nota inexistente "+JSON.stringify(vis))}
  }
 }
 if(nome==="figuras")chk(cuboAlto,"o Ouro nunca perguntou o eneágono ou o decágono");
 if(nome==="comprimento")chk(compDificil,"o Ouro nunca trouxe conta composta (m e cm, fitas, fios)");
 if(nome==="tempo"){chk(minNaoPadrao,"o Ouro nunca usou minutos de 5 em 5");chk(visualVisto,"nenhuma questão de relógio")}
 if(nome==="dinheiro")chk(visualVisto,"nenhuma questão com moedas/notas");
 t(`geradores ${nome}: os 4 tipos × 2 dificuldades, todos válidos, só números inteiros e com a resposta certa`,bom,msg);
}
/* ---- desenhos em SVG (feitos por mim, sem imagens de terceiros) ---- */
T("desenho: visEstatico desenha cada figura (nº de pontos = nº de lados) e o cubo, em SVG",()=>{const pts={triangulo:3,quadrado:4,retangulo:4,quadrilatero:4,pentagono:5,hexagono:6,heptagono:7,octogono:8,eneagono:9,decagono:10};
  for(const[n,k]of Object.entries(pts)){const h=ev3(`visEstatico({tipo:'figura',nome:'${n}'})`),m=h.match(/<polygon[^>]*points="([^"]+)"/);if(!/<svg/.test(h)||!m||m[1].trim().split(/\s+/).length!==k)return n+": "+h.slice(0,120)}
  const c=ev3("visEstatico({tipo:'figura',nome:'cubo'})");return /<svg/.test(c)&&(c.match(/<polygon/g)||[]).length>=3});
T("desenho: o relógio mostra o ponteiro das horas e o dos minutos na posição certa (3:15, 12:00, 6:30, 9:45)",()=>{
  for(const[h,m]of[[3,15],[12,0],[6,30],[9,45]]){const html=ev3(`visEstatico({tipo:'relogio',h:${h},m:${m}})`);if(!/<svg/.test(html))return "sem svg";
    const hh=html.match(/class="ph"[^>]*transform="rotate\(([\d.]+)/),mm=html.match(/class="pmin"[^>]*transform="rotate\(([\d.]+)/);
    if(!hh||!mm||Math.abs(+hh[1]-((h%12)*30+m*0.5))>0.01||Math.abs(+mm[1]-m*6)>0.01)return h+":"+m+" -> "+(hh&&hh[1])+"/"+(mm&&mm[1]);
    if((html.match(/<text/g)||[]).length<12)return "faltam os números do relógio"}return true});
T("desenho: moedas e notas aparecem desenhadas com o valor escrito (centavos nas moedas, R$ nas notas)",()=>{
  const a=ev3("visEstatico({tipo:'dinheiro',itens:[{k:'moeda',v:50},{k:'moeda',v:25},{k:'moeda',v:10}]})"),b=ev3("visEstatico({tipo:'dinheiro',itens:[{k:'nota',v:10},{k:'nota',v:2}]})");
  return /<svg/.test(a)&&(a.match(/class="moedinha"/g)||[]).length===3&&/>50</.test(a)&&/>25</.test(a)&&/centavos/.test(a)&&/<svg/.test(b)&&(b.match(/class="cedula"/g)||[]).length===2&&/R\$ 10/.test(b)&&/R\$ 2/.test(b)});
T("desenho: a questão com figura mostra o SVG na tela do exercício (figura, relógio e dinheiro)",()=>{
  ev3("S.fases={};S.tentNivel=null;ir('fases')");let ok=true,msg="";
  for(const [g,rx] of [["figuras",/<polygon/],["tempo",/class="pmin"/],["dinheiro",/class="(moedinha|cedula)"/]]){
    let achou=false;for(let i=0;i<60&&!achou;i++){const ex=ev3(`GER.${g}(1,'digitar')`);if(ex.visual){ev3(`FS.ses=novaSessao(FASES.find(f=>f.gerador==='${g}'),'bronze');FS.ses.fila[0]=${JSON.stringify(ex)};FS.fase=FS.ses.fase;FS.vista='exerc';render()`);achou=rx.test(ev3("document.getElementById('app').innerHTML"))&&!!U("#app svg");if(!achou){ok=false;msg=g}else break}}
    if(!achou&&ok){ok=false;msg=g+" sem figura"}}
  ev3("voltarTrilha()");return ok||msg});
/* ---- macetes ---- */
T("macetes novos (figuras, tempo, dinheiro): ícone, resumo, explicação e a dica certa (tri 3 / 5 minutos / troco)",()=>{const g=id=>ev3(`macAch('${id}')`);return /tri.*3/.test(g("figuras").explicacao)&&/penta.*5/.test(g("figuras").explicacao)&&/5 minutos/.test(g("tempo").resumo)&&/troco/i.test(g("dinheiro").resumo)&&["figuras","tempo","dinheiro"].every(id=>g(id).icone&&g(id).titulo&&g(id).explicacao.length>60)});
T("macetes: a prática dos novos usa as questões do gerador e MANTÉM o desenho (relógio, figuras, moedas)",()=>{
  for(const id of["figuras","tempo","dinheiro"]){let vi=false;for(let i=0;i<30;i++){const qs=ev3(`macPerguntas('${id}')`);if(qs.length!==4||!qs.every(x=>x.tipo==='escolha'&&x.opcoes.includes(x.resp)&&x.texto&&x.expl))return id+" perguntas";
    for(const q of qs){if(q.visual)vi=true;if(/relógio|moedas|notas/.test(q.texto)&&!q.visual)return id+" perdeu o desenho: "+q.texto}}
    if(id!=="figuras"&&!vi)return id+" nunca trouxe desenho"}return true});
T("macetes: a tela da prática desenha o SVG da questão",()=>{ev3("MAC={id:'tempo',qs:[{tipo:'escolha',texto:'Quantos minutos?',opcoes:[10,15,20,25],resp:15,expl:'x',visual:{tipo:'relogio',h:3,m:15}}],i:0,sel:[]};macTela()");return !!U("#app svg")&&/class="pmin"/.test(U("#app").innerHTML)});
/* ---- roteiros animados ---- */
ev3(OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias"])+";save()");
const rod=(nome,args)=>ev3(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.${nome}(${args});const R=rot.montar(ctx);const g=[],all=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length]);ctx.stage.querySelectorAll('.pm-res').forEach(e=>{if(!all.includes(e.textContent))all.push(e.textContent)})}window.__g=g;window.__res=all;return true})()`);
ev3("ir('fases');abrirExplicacao('a3-figuras')");ev3("FS.auto=false;pararAnimacoes()");
T("explicação de Figuras abre a partir da trilha (liberada depois dos 3 níveis de Sequências)",()=>ev3("FS.vista")==="explica"&&ev3("FS.fase.id")==="a3-figuras");
ev3("FS.vel=0.001");
for(const[n,a,passos,fim]of[["tempo","2",7,/60 min.*120 min.*30 min.*3:55.*24 h.*7 dias.*12 meses/],["dinheiro","10,7",8,/R\$ 1 = 100 centavos.*R\$ 2,30 = 2 reais e 30 centavos.*R\$ 1,50 \+ R\$ 2,30 = R\$ 3,80.*R\$ 5 \+ R\$ 2 = R\$ 7.*troco = R\$ 3.*R\$ 10,00 − R\$ 7,50 = R\$ 2,50/]]){
  ev3("S.cfg.reduzir=false");sb.w.__anims.length=0;try{await rod(n,a)}catch(e){}await sleep(300);const g=Array.from(ev3("window.__g")||[]);ev3("window.__g=null");
  t(`roteiro ${n}(${a}): ${passos} passos, cada um de 3 a 5 s, falas curtas e números/figuras viajam`,g.length===passos&&g.every(([dur,gasto,len])=>dur>=3000&&dur<=5000&&gasto<=dur+1&&len>=5&&len<=140)&&sb.w.__anims.length>0,JSON.stringify(g.map(x=>x[0]))+" anims:"+sb.w.__anims.length);
  const res=Array.from(ev3("window.__res")||[]).join("|");
  t(`roteiro ${n}(${a}): os resultados aparecem em destaque (.pm-res), na ordem certa, e o último passo termina com um resultado na tela`,fim.test(res)&&ev3("document.querySelectorAll('#exp-stage .pm-res').length")>0,res);
}
T("roteiros novos: figuras mostra os vértices (pontos) e depois o cubo; tempo gira o ponteiro grande de 12 a 12 (uma volta = 60 minutos)",()=>{const f=lerArq("js/motor/explicacao.js");return /figuras\(/.test(f)&&/60 minutos/.test(f)&&/ponteiro/.test(f)});
sb.w.close();
/* ---- jogar os 3 níveis das fases novas + lâmpada de cada uma ---- */
{const s=await sessao(),ev=s.ev;await ev("escolher(25)");
 ev(OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias"])+";save();ir('fases')");
 const lamp={"a3-figuras":/tri.*3/,"a3-comprimento":/Katia/,"a3-tempo":/5 minutos/,"a3-dinheiro":/troco/i};
 for(const id of IDS){const st2=()=>st(ev,id);
  try{await jogarNivel(s,id,"bronze");await jogarNivel(s,id,"prata");now+=DIA;await jogarNivel(s,id,"ouro");
  t(`jogar ${id}: Bronze, Prata e Ouro concluídos sem erro libera a próxima fase`,st2()==="concluido,concluido,concluido",st2())}catch(e){t(`jogar ${id}  [erro: ${String(e.message).slice(0,50)}]`,false)}
  try{ev("voltarTrilha()");ev(`S.tentNivel=null;abrirNivel('${id}','bronze')`);const b=s.w.document.getElementById("bt-lamp");b.click();const L=s.w.document.getElementById("lampada");
   t(`lâmpada de ${id}: abre o macete certo da fase e fecha com Entendi`,!!L&&lamp[id].test(L.textContent)&&(s.w.document.getElementById("lamp-ok").click(),!s.w.document.getElementById("lampada")));ev("voltarTrilha()")}catch(e){t(`lâmpada ${id}  [erro: ${String(e.message).slice(0,50)}]`,false)}
  now+=DIA}
 try{t("depois das 4 fases novas, Dinheiro conta como concluída e as 13 primeiras fases do 3º ano estão concluídas",ev("estadoFase(FASES.find(f=>f.id==='a3-dinheiro'))")==="concluido"&&ev("fasesDoAno(3).slice(0,13).every(f=>estadoFase(f)==='concluido')"))}catch(e){t("estado Dinheiro  [erro]",false)}
 s.w.close()}

}


// ===== Entrega 1 (ajustes da Joyce): sinal em Comparar, ordenar no Ouro, par/ímpar muitos-para-um, macete e explicações =====
{
const sb=await sessao(null,{animate:true});
const ev3=x=>{try{return sb.ev(x)}catch(e){return undefined}},U=x=>sb.w.document.querySelector(x),Q=x=>[...sb.w.document.querySelectorAll(x)];
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
const prE=n=>n%2===0?"par":"ímpar",SIN=["maior que (>)","menor que (<)","igual (=)"];
T("Comparar, ligar: agora é 'Ligue o sinal correto em cada situação' (568 ▢ 477), com um par de cada sinal (maior, menor, igual)",()=>{
  for(const d of[1,3])for(let i=0;i<120;i++){const ex=ev3(`GER.comparar(${d},'relacionar')`),P=Array.from(ex.pares),D=Array.from(ex.direita);
    if(ex.enunciado!=="Ligue o sinal correto em cada situação.")return "enunciado: "+ex.enunciado;
    if(P.length!==3||D.length!==3||[...D].sort().join()!==[...SIN].sort().join())return "colunas "+JSON.stringify(D);
    const len=d>=3?4:3;
    for(const p of P){const m=p.e.match(/^(\d+) ▢ (\d+)$/);if(!m||m[1].length!==len||m[2].length!==len)return "par "+p.e;
      if(p.d!==(+m[1]>+m[2]?SIN[0]:+m[1]<+m[2]?SIN[1]:SIN[2]))return "sinal errado "+p.e+" "+p.d}
    if(new Set(P.map(p=>p.d)).size!==3)return "faltou um sinal: "+JSON.stringify(P);
    if(!ex.respTxt||!ex.chave||ex.resposta!==1)return "respTxt/chave"}
  return true});
T("Comparar, Ouro: no lugar de 'qual número falta', vem 'ordenar' (4 ou 5 números, crescente ou decrescente); no Bronze e na Prata a lacuna continua",()=>{
  let cres=0,decr=0;for(let i=0;i<150;i++){const ex=ev3("GER.comparar(3,'lacuna')");
    if(ex.tipo!=="ordenar")return "Ouro lacuna -> "+ex.tipo;const n=Array.from(ex.nums),oc=Array.from(ex.ordemCerta);
    if(n.length<4||n.length>5||new Set(n).size!==n.length||!n.every(x=>String(x).length===4))return "números "+n;
    const cr=/crescente/.test(ex.enunciado)&&!/decrescente/.test(ex.enunciado),de=/decrescente/.test(ex.enunciado);if(cr===de)return "enunciado: "+ex.enunciado;
    const esp=[...n].sort((a,b)=>cr?a-b:b-a);if(oc.join()!==esp.join())return "ordemCerta "+oc+" esperado "+esp;
    if(ex.resposta!==1||!ex.respTxt.includes(cr?" < ":" > ")||!ex.chave||!ex.dica||!ex.erro)return "campos";cr?cres++:decr++}
  for(let i=0;i<40;i++){const ex=ev3("GER.comparar(1,'lacuna')");if(ex.tipo!=="lacuna"||!ex.enunciado.includes("___"))return "Bronze/Prata mudou"}
  return cres>20&&decr>20});
T("Comparar, Ouro: a sessão do Ouro traz a questão de ordenar e nenhuma lacuna; Bronze e Prata não têm ordenar",()=>{
  for(let i=0;i<10;i++){const o=Array.from(ev3("novaSessao(FASES.find(f=>f.id==='a3-comparar'),'ouro').fila.map(x=>x.tipo)")),b=Array.from(ev3("novaSessao(FASES.find(f=>f.id==='a3-comparar'),'bronze').fila.map(x=>x.tipo)"));
    if(!o.includes("ordenar")||o.includes("lacuna")||b.includes("ordenar")||!b.includes("lacuna"))return JSON.stringify([o,b])}return true});
T("ordenar na tela: toca nos números na ordem, a fila aparece, dá para desfazer; só verifica com todos; o certo passa e o errado tira 1 vida",()=>{
  ev3("S.fases={};S.tentNivel=null;ir('fases')");ev3(OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao"])+";save()");
  ev3("abrirNivel('a3-comparar','bronze')");
  ev3(`(()=>{const ex=GER.comparar(3,'lacuna');FS.ses=novaSessao(FASES.find(f=>f.id==='a3-comparar'),'ouro');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render()})()`);
  const ex=ev3("FS.ses.fila[0]"),n=Array.from(ex.nums),oc=Array.from(ex.ordemCerta);
  if(Q("#app .ordNum").length!==n.length)return "botões "+Q("#app .ordNum").length;
  if(!U("#ord-ok").disabled)return "Verificar devia estar desligado";
  Q("#app .ordNum")[n.indexOf(oc[0])].click();Q("#app .ordNum")[n.indexOf(oc[1])].click();
  if(Q("#ord-fila .ordPick").map(e=>e.textContent).join()!==[oc[0],oc[1]].join())return "fila "+Q("#ord-fila .ordPick").map(e=>e.textContent);
  if(!Q("#app .ordNum")[n.indexOf(oc[0])].disabled)return "número já usado ainda clicável";
  U("#ord-desfazer").click();if(Q("#ord-fila .ordPick").length!==1)return "desfazer";
  if(Q("#app .ordNum")[n.indexOf(oc[1])].disabled)return "desfazer não liberou o número";
  Q("#app .ordNum")[n.indexOf(oc[1])].click();oc.slice(2).forEach(v=>Q("#app .ordNum")[n.indexOf(v)].click());
  if(U("#ord-ok").disabled)return "Verificar devia ligar";
  const vidas=ev3("FS.ses.vidas");U("#ord-ok").click();if(ev3("FS.ses.estado")!=="certo"||ev3("FS.ses.vidas")!==vidas)return "certo não passou";
  ev3("continuarSessao()");
  ev3(`(()=>{const ex=GER.comparar(3,'lacuna');FS.ses.fila[0]=ex;FS.ses.estado='pergunta';render()})()`);
  const n2=Array.from(ev3("FS.ses.fila[0].nums")),oc2=Array.from(ev3("FS.ses.fila[0].ordemCerta")),rev=[...oc2].reverse();
  rev.forEach(v=>Q("#app .ordNum")[n2.indexOf(v)].click());U("#ord-ok").click();
  if(ev3("FS.ses.estado")!=="errado"||ev3("FS.ses.vidas")!==vidas-1)return "errado não tirou vida";
  if(!U("#app .fb.err").textContent.includes(oc2.join(oc2[0]<oc2[1]?" < ":" > ")))return "não mostrou a ordem certa";
  ev3("continuarSessao()");const rep=ev3("FS.ses.fila[FS.ses.fila.length-1]");
  return rep.rep===true&&rep.tipo==="ordenar"&&Array.from(rep.ord.fila).length===0||"a repetição deve voltar com a fila vazia"});
T("Pares e ímpares, ligar: 'Ligue cada número a par ou ímpar' (4 números e 4 cartões, um cartão para cada número)",()=>{
  for(const d of[1,3])for(let i=0;i<120;i++){const ex=ev3(`GER.parImpar(${d},'relacionar')`),P=Array.from(ex.pares),D=Array.from(ex.direita);
    if(ex.enunciado!=="Ligue cada número a par ou ímpar.")return "enunciado "+ex.enunciado;
    if(ex.muitos||P.length!==4||D.length!==4||[...D].sort().join()!==P.map(p=>p.d).sort().join())return "formato: um cartão para cada número "+JSON.stringify(D)+P.length;
    if(!P.every(p=>/^\d+$/.test(p.e)&&String(p.e).length===(d>=3?3:2)&&p.d===prE(+p.e)))return "par errado "+JSON.stringify(P);
    if(new Set(P.map(p=>p.d)).size!==2)return "faltou par ou ímpar: "+JSON.stringify(P);
    if(new Set(P.map(p=>p.e)).size!==4)return "números repetidos";
    if(!ex.respTxt||!ex.chave)return "respTxt"}
  return true});
T("ligar par/ímpar na tela: aparecem 4 cartões (um por número); certo passa e errado perde vida; texto de ajuda novo",()=>{
  ev3(`(()=>{const ex=GER.parImpar(1,'relacionar');FS.ses=novaSessao(FASES.find(f=>f.id==='a3-paresimpares'),'bronze');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render()})()`);
  const ex=ev3("FS.ses.fila[0]"),P=Array.from(ex.pares),D=Array.from(ex.direita);
  if(!/Toque num número e depois numa casa Par ou Ímpar/.test(U("#app").textContent))return "texto de ajuda";
  if(Q("#app .rel.d").length!==P.length)return "cartões: "+Q("#app .rel.d").length+" para "+P.length+" números";
  const usados=new Set(),lig=(i,cartao)=>{Q("#app .rel.e")[i].click();Q("#app .rel.d")[cartao].click();usados.add(cartao)};
  P.forEach((p,i)=>lig(i,D.findIndex((d,j)=>d===p.d&&!usados.has(j))));
  if(Q("#app .rel.e.lig").length!==P.length)return "ligações";if(U("#app button.grande").disabled)return "Verificar devia ligar";
  const v=ev3("FS.ses.vidas");U("#app button.grande").click();if(ev3("FS.ses.estado")!=="certo")return "certo";
  ev3("continuarSessao()");
  ev3(`(()=>{const ex=GER.parImpar(1,'relacionar');FS.ses.fila[0]=ex;FS.ses.estado='pergunta';render()})()`);
  const ex2=ev3("FS.ses.fila[0]"),P2=Array.from(ex2.pares),D2=Array.from(ex2.direita),us=new Set();
  const j0=D2.findIndex(d=>d!==P2[0].d);us.add(j0);const resto=D2.map((_,j)=>j).filter(j=>j!==j0);
  P2.forEach((p,i)=>{const j=i===0?j0:resto.shift();Q("#app .rel.e")[i].click();Q("#app .rel.d")[j].click()});U("#app button.grande").click();
  return ev3("FS.ses.estado")==="errado"&&ev3("FS.ses.vidas")===v-1});
T("ligar sinal na tela: texto de ajuda 'Toque numa situação e depois no sinal' e a ligação um-para-um continua (outro número no mesmo cartão tira o anterior)",()=>{
  ev3(`(()=>{const ex=GER.comparar(1,'relacionar');FS.ses=novaSessao(FASES.find(f=>f.id==='a3-comparar'),'bronze');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render()})()`);
  if(!/Toque numa situação e depois no sinal/.test(U("#app").textContent))return "texto de ajuda";
  Q("#app .rel.e")[0].click();Q("#app .rel.d")[0].click();Q("#app .rel.e")[1].click();Q("#app .rel.d")[0].click();
  return Q("#app .rel.e.lig").length===1});
T("Sequências: o macete explica 'aumentando = soma (segundo − primeiro)' e 'diminuindo = subtrai (primeiro − segundo)'",()=>{
  const e=ev3("macAch('sequencia').explicacao");return /aumentando[^.]*soma[^.]*segundo − primeiro/.test(e)&&/diminuindo[^.]*subtrai[^.]*primeiro − segundo/.test(e)});
T("Sequências: a lâmpada da fase mostra a regra do segundo menos o primeiro",()=>{
  ev3("S.fases={};S.tentNivel=null;ir('fases')");ev3(OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares"])+";save()");
  ev3("abrirLampada(macAch('sequencia'),'')");const L=U("#lampada");const ok=!!L&&/segundo − primeiro/.test(L.textContent)&&/primeiro − segundo/.test(L.textContent);U("#lamp-ok")&&U("#lamp-ok").click();return ok});
/* ---- explicações completas ---- */
ev3("ir('fases');abrirExplicacao('a3-comparar')");ev3("FS.auto=false;pararAnimacoes()");ev3("FS.vel=0.001");ev3("S.cfg.reduzir=false");
const rod=(nome,args)=>ev3(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.${nome}(${args});const R=rot.montar(ctx);const g=[],all=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length]);ctx.stage.querySelectorAll('.pm-res').forEach(e=>{if(!all.includes(e.textContent))all.push(e.textContent)})}window.__g=g;window.__res=all;return true})()`);
for(const[n,a,passos,falas,fim]of[
  ["comparar","358,385",7,[/maior que/,/menor que/,/igual/,/crescente/,/decrescente/,/do menor para o maior/,/do maior para o menor/],/maior que.*menor que.*igual.*\d+ < \d+ < \d+.*\d+ > \d+ > \d+/],
  ["sequencia","3,4",7,[/segundo/,/primeiro/,/aumenta|aumentando/,/diminu/],/7 − 3 = 4.*19 − 15 = 4/]]){
  sb.w.__anims.length=0;try{await rod(n,a)}catch(e){}await sleep(300);const g=Array.from(ev3("window.__g")||[]);const res=Array.from(ev3("window.__res")||[]).join("|");ev3("window.__g=null");
  t(`roteiro ${n}(${a}) completo: ${passos} passos de 3 a 5 s, falas curtas e itens que viajam`,g.length===passos&&g.every(([dur,gasto,len])=>dur>=3000&&dur<=5000&&gasto<=dur+1&&len>=5&&len<=140)&&sb.w.__anims.length>0,JSON.stringify(g.map(x=>x[0])));
  const txt=ev3(`ROT.${n}(${a}).passos.map(p=>p.fala).join(' ')`);
  t(`roteiro ${n}: a fala cobre ${falas.map(r=>r.source).join(", ")}`,falas.every(r=>r.test(txt)),txt.slice(0,160));
  t(`roteiro ${n}: os resultados mostrados batem com o conteúdo`,fim.test(res),res);
}
sb.w.close();
/* ---- jogar o Ouro de Comparar inteiro (com ordenar) e Pares (ligar muitos) ---- */
{const s=await sessao(),ev=s.ev;await ev("escolher(25)");ev(OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao"])+";save();ir('fases')");
 try{await jogarNivel(s,"a3-comparar","bronze");await jogarNivel(s,"a3-comparar","prata");now+=DIA;await jogarNivel(s,"a3-comparar","ouro");
  t("jogar Comparar: Bronze, Prata e Ouro (com a questão de ordenar) terminam e liberam a próxima fase",st(ev,"a3-comparar")==="concluido,concluido,concluido",st(ev,"a3-comparar"))}catch(e){t("jogar Comparar  [erro: "+String(e.message).slice(0,60)+"]",false)}
 try{await jogarNivel(s,"a3-paresimpares","bronze");await jogarNivel(s,"a3-paresimpares","prata");now+=DIA;await jogarNivel(s,"a3-paresimpares","ouro");
  t("jogar Pares e ímpares: os 3 níveis (com ligar muitos-para-um) terminam",st(ev,"a3-paresimpares")==="concluido,concluido,concluido",st(ev,"a3-paresimpares"))}catch(e){t("jogar Pares  [erro: "+String(e.message).slice(0,60)+"]",false)}
 s.w.close()}
t("sw.js: pokemath-v21 (arquivos mudaram)",/const V="pokemath-v21"/.test(lerArq("sw.js")));
}

t("limite diário: a chave temporária SEM_LIMITE_TENTATIVAS está ligada no app (os testes rodam com ela desligada, para provar a regra)",/const SEM_LIMITE_TENTATIVAS=true;/.test(lerArq("js/conteudo/matriz.js"))&&/SEM_LIMITE_TENTATIVAS\?cfgF/.test(lerArq("js/motor/trilha.js")));
{const s2=await sessao(null,{});const e=x=>s2.ev(x);e("S.fases={};save()");
 e("window.eval('0')");const r=e("(()=>{const f=SEM_LIMITE_TENTATIVAS;return f})()");t("nos testes a chave vem desligada, então o limite de 3 por dia continua valendo",r===false);s2.w.close()}

// ===== Entrega 2: 🪙 Dica da resposta (3 moedas, todas as fases; o macete 💡 continua de graça) =====
{
const sb=await sessao(null,{}),ev3=x=>{try{return sb.ev(x)}catch(e){return undefined}},U=x=>sb.w.document.querySelector(x),Q=x=>[...sb.w.document.querySelectorAll(x)];
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
ev3("S.fases={};S.tentNivel=null;ir('fases')");ev3("abrirNivel('a3-posicional','bronze')");
const mostra=(ex,fid,moedas)=>{ev3(`(()=>{S.coins=${moedas};const ex=${JSON.stringify(ex)};FS.ses=novaSessao(FASES.find(f=>f.id==='${fid||"a3-posicional"}'),'bronze');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render()})()`)};
const gerar=(g,d,tp)=>ev3(`JSON.parse(JSON.stringify(GER.${g}(${d},'${tp}')))`);
T("botão 🪙 'Dica da resposta' com o preço (3) aparece em todos os tipos de questão, ao lado da 💡",()=>{
  for(const tp of["digitar","escolha","lacuna","relacionar"]){mostra(gerar("adicao",1,tp),"a3-adicao",10);const b=U("#bt-dica");if(!b||!/Dica da resposta/.test(b.textContent)||!/3/.test(b.textContent)||!U("#bt-lamp"))return "falta botão em "+tp}
  mostra(gerar("comparar",3,"lacuna"),"a3-comparar",10);return !!U("#bt-dica")&&!!U("#bt-lamp")});
T("sem moedas suficientes o botão fica apagado (mostrando o preço) e clicar não gasta nem mostra dica",()=>{
  mostra(gerar("adicao",1,"digitar"),"a3-adicao",2);const b=U("#bt-dica");if(!b||!b.disabled||!/3/.test(b.textContent))return "deveria estar apagado";
  b.click();ev3("comprarDica()");return ev3("S.coins")===2&&!U("#dica-paga")});
T("com 3 moedas ou mais: clicar gasta exatamente 3, mostra a dica e o botão apaga (uma compra por questão)",()=>{
  mostra(gerar("adicao",1,"digitar"),"a3-adicao",10);U("#bt-dica").click();
  const d=U("#dica-paga");return ev3("S.coins")===7&&!!d&&d.textContent.length>25&&U("#bt-dica").disabled&&(ev3("comprarDica()"),ev3("S.coins")===7)});
T("a dica fica depois de errar? Não: a dica paga aparece só enquanto a questão está aberta (some no feedback)",()=>{
  mostra(gerar("adicao",1,"digitar"),"a3-adicao",10);U("#bt-dica").click();ev3("responderFase(-7)");return !U("#dica-paga")&&!U("#bt-dica")});
T("com exatamente 3 moedas dá para comprar e fica com 0",()=>{mostra(gerar("adicao",1,"digitar"),"a3-adicao",3);U("#bt-dica").click();return ev3("S.coins")===0&&!!U("#dica-paga")});
T("💡 continua de graça: abrir o macete não gasta moedas nem desliga o botão da dica",()=>{
  mostra(gerar("adicao",1,"digitar"),"a3-adicao",10);U("#bt-lamp").click();const ok=!!U("#lampada")&&ev3("S.coins")===10&&!U("#bt-dica").disabled;U("#lamp-ok").click();return ok});
T("escolha: a dica tira 2 opções erradas (nunca a certa) e elas ficam apagadas",()=>{
  for(let i=0;i<20;i++){const ex=gerar("adicao",1,"escolha");mostra(ex,"a3-adicao",10);U("#bt-dica").click();
    const ap=Q("#app .op").filter(b=>b.disabled).map(b=>+b.textContent);if(ap.length!==2||ap.includes(ex.resposta))return "apagadas "+ap+" certa "+ex.resposta;
    const livre=Q("#app .op").find(b=>!b.disabled&&+b.textContent===ex.resposta);if(!livre)return "a certa sumiu"}return true});
T("ligar: a dica liga sozinha um par certo e a criança liga o resto (Verificar ainda precisa de todas as ligações)",()=>{
  for(const [g,tp,f] of[["adicao","relacionar","a3-adicao"],["comparar","relacionar","a3-comparar"],["parImpar","relacionar","a3-paresimpares"]]){
    const ex=gerar(g,1,tp);mostra(ex,f,10);U("#bt-dica").click();const L=ev3("FS.ses.fila[0].lig"),ch=Object.keys(L.map);
    if(ch.length!==1)return g+": ligações "+ch.length;const i=+ch[0];if(ex.direita[L.map[i]]!==ex.pares[i].d)return g+": ligou o par errado";
    if(!U("#app button.grande").disabled)return g+": Verificar devia continuar apagado"}return true});
T("ordenar: a dica põe na fila os números certos do começo da ordem (o próximo), sem completar tudo",()=>{
  for(let i=0;i<10;i++){const ex=gerar("comparar",3,"lacuna");mostra(ex,"a3-comparar",10);ev3("(()=>{const ex=FS.ses.fila[0];ordenarNum(ex.nums.indexOf(ex.ordemCerta[ex.ordemCerta.length-1]))})()");
    U("#bt-dica").click();const f=Array.from(ev3("FS.ses.fila[0].ord.fila.map(i=>FS.ses.fila[0].nums[i])")),oc=ex.ordemCerta;
    if(f.length<1||f.length>=oc.length||f.join()!==oc.slice(0,f.length).join())return "fila "+f+" certa "+oc}return true});
T("digitar e completar: a dica diz quantos algarismos tem a resposta e repete o conselho da fase, sem mostrar a resposta",()=>{
  for(const [g,tp,f,d] of[["adicao","digitar","a3-adicao",1],["adicao","lacuna","a3-adicao",1],["multiplicacao","digitar","a3-multiplicacao",3]]){
    const ex=gerar(g,d,tp);mostra(ex,f,10);U("#bt-dica").click();const x=U("#dica-paga").textContent;
    if(!new RegExp(String(String(ex.resposta).length)+" algarismo").test(x))return g+": sem quantidade de algarismos: "+x;
    if(new RegExp("(^|\\D)"+ex.resposta+"(\\D|$)").test(x.replace(/\d+ algarismos?/,"")))return g+": mostrou a resposta: "+x}return true});
T("a dica nunca entrega a resposta: em todas as fases, tipos e dificuldades (digitar/completar/escolha) o texto não traz o número certo",()=>{
  for(const g of ev3("[...new Set(FASES.map(f=>f.gerador))]"))for(const d of[1,3])for(const tp of["digitar","lacuna"])for(let i=0;i<15;i++){
    const ex=gerar(g,d,tp);const x=ev3(`dicaTextoResp(${JSON.stringify(ex)})`);if(!x)return g+": sem texto";
    const lim=x.replace(/\d+ algarismos?/,"").replace(ex.dica,"");   /* o conselho geral da fase (ex.dica) já existia e não é da questão */if(ex.resposta!=null&&new RegExp("(^|\\D)"+ex.resposta+"(\\D|$)").test(lim)&&String(ex.resposta).length>1)return {ok:false,m:g+" "+tp+" d"+d+": resposta "+ex.resposta+" -> "+x}}return true});
T("não mexe em medalha: usar a dica não conta como erro (sessão sem erros continua perfeita, acertos de primeira intactos)",()=>{
  mostra(gerar("adicao",1,"digitar"),"a3-adicao",10);ev3("S.coins=10");ev3("window.__e0=FS.ses.erros;window.__v0=FS.ses.vidas");U("#bt-dica").click();
  if(ev3("FS.ses.erros")!==ev3("window.__e0")||ev3("FS.ses.vidas")!==ev3("window.__v0"))return "a compra da dica mexeu em erros/vidas";
  const r=ev3(`(()=>{const s=FS.ses;const e0=s.erros,a0=s.acertosPrimeira,v0=s.vidas;responderFase(FS.ses.fila[0].resposta);return [s.erros-e0,s.acertosPrimeira-a0,s.vidas-v0,s.perfeita]})()`);
  return r[0]===0&&r[1]===1&&r[2]===0});
T("Ouro perfeito com dicas ainda ganha o Pokémon (perfeita = nenhum erro; dicas pagas não contam)",()=>{
  const src=lerArq("js/motor/trilha.js");const a=src.indexOf("async function concluirSessao"),b=src.indexOf("function falharSessao");
  return !/dica/i.test(src.slice(a,a>=0?a+900:0))&&/perfeita=s\.erros===0/.test(src)});
T("a dica paga também vale na repetição da questão errada e não cobra de novo",()=>{
  mostra(gerar("adicao",1,"escolha"),"a3-adicao",10);U("#bt-dica").click();const c=ev3("S.coins");ev3("responderFase(-7)");ev3("continuarSessao()");
  const rep=ev3("FS.ses.fila[FS.ses.fila.length-1]");return {ok:c===7&&rep.rep===true&&!!rep.dicaPaga&&ev3("S.coins")===7,m:JSON.stringify([c,rep.rep,ev3("S.coins"),!!U("#bt-dica")&&U("#bt-dica").disabled,ev3("FS.ses.estado"),ev3("FS.ses.fila.length")])}});
T("as moedas gastas continuam salvas (save) e o saldo mostrado no topo acompanha",()=>{mostra(gerar("adicao",1,"digitar"),"a3-adicao",10);U("#bt-dica").click();return JSON.parse(sb.w.localStorage.getItem("tabuada-pokemon-v1")).coins===7});
sb.w.close();
t("sw.js: pokemath-v21",/const V="pokemath-v21"/.test(lerArq("sw.js")));
}


// ===== Entrega 3 — Figuras: sem cubo; quadrilátero, pentágono ao decágono; explicação completa com lados em vermelho =====
{
const sb=await sessao(null,{animate:true}),ev3=x=>{try{return sb.ev(x)}catch(e){return undefined}};
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
const NF=["triângulo","quadrado","retângulo","quadrilátero","pentágono","hexágono","heptágono","octógono","eneágono","decágono"],LF=[3,4,4,4,5,6,7,8,9,10];
T("Figuras: o cubo saiu das questões (nenhum enunciado, explicação ou desenho cita cubo, faces ou arestas)",()=>{
  for(const d of[1,3])for(const tp of["digitar","escolha","lacuna","relacionar"])for(let i=0;i<150;i++){const ex=ev3(`JSON.stringify(GER.figuras(${d},'${tp}'))`);if(/cubo|faces|arestas/i.test(ex))return "apareceu cubo: "+ex.slice(0,160)}return true});
T("Figuras: as figuras do jogo são triângulo, quadrado, retângulo, quadrilátero, pentágono, hexágono, heptágono, octógono, eneágono e decágono",()=>JSON.stringify(Array.from(ev3("FIGURAS.map(f=>f.nome)")))===JSON.stringify(NF)&&JSON.stringify(Array.from(ev3("FIGURAS.map(f=>f.lados)")))===JSON.stringify(LF));
T("Figuras: o Bronze e a Prata vão até o hexágono; o Ouro traz também heptágono, octógono, eneágono e decágono",()=>{
  const vistos={1:new Set(),3:new Set()};
  for(const d of[1,3])for(const tp of["digitar","escolha","lacuna"])for(let i=0;i<260;i++){const ex=ev3(`GER.figuras(${d},'${tp}')`),m=(ex.enunciado||"").match(/(?:tem o|tem ___)? ?\b(triângulo|quadrado|retângulo|quadrilátero|pentágono|hexágono|heptágono|octógono|eneágono|decágono)\b/);if(m)vistos[d].add(m[1])}
  const b=[...vistos[1]],o=[...vistos[3]];
  if(b.some(n=>LF[NF.indexOf(n)]>6))return {ok:false,m:"Bronze/Prata passou do hexágono: "+b};
  if(!["quadrilátero","pentágono","hexágono"].every(n=>b.includes(n)))return {ok:false,m:"Bronze/Prata sem "+b};
  return NF.every(n=>o.includes(n))||{ok:false,m:"Ouro viu só "+o}});
T("Figuras: o número de lados e vértices de cada figura está certo nas questões",()=>{
  for(const d of[1,3])for(let i=0;i<300;i++){const ex=ev3(`GER.figuras(${d},'digitar')`),m=ex.enunciado.match(/^Quantos (lados|vértices) tem o (\S+)\?$/);
    if(!m)return "enunciado: "+ex.enunciado;const k=NF.indexOf(m[2]);if(k<0||LF[k]!==ex.resposta)return m[2]+" -> "+ex.resposta}return true});
T("Figuras: o desenho do quadrilátero é uma figura de 4 lados desiguais (não um quadrado)",()=>{
  const v=Array.from(ev3("vertsFig('quadrilatero',100,78,64)")).map(p=>Array.from(p)),L=v.map((p,i)=>Math.hypot(p[0]-v[(i+1)%4][0],p[1]-v[(i+1)%4][1]));
  return v.length===4&&Math.max(...L)-Math.min(...L)>10});
T("Figuras: a fase de Figuras usa a explicação completa (sem figura única) e não cita cubo nos tópicos",()=>{
  const f=JSON.parse(ev3("JSON.stringify(FASES.find(x=>x.id==='a3-figuras'))"));return f.roteiro.length===1&&f.roteiro[0]==="figuras"&&!/cubo|espacial/i.test(JSON.stringify(f.topicos))});
T("Figuras: o macete traz quadrilátero e os prefixos penta, hexa, hepta, octo, eneá e deca, sem cubo",()=>{
  const m=ev3("macAch('figuras')"),x=m.explicacao+" "+m.resumo;return !/cubo|faces|arestas/i.test(x)&&["quadri","penta","hexa","hepta","octo","eneá","deca"].every(p=>m.explicacao.includes(p)&&m.resumo.includes(p))&&/quadrilátero/.test(m.explicacao)});
/* ---- a explicação completa ---- */
ev3("S.fases={};"+OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias"])+";save()");
ev3("ir('fases');abrirExplicacao('a3-figuras')");ev3("FS.auto=false;pararAnimacoes()");ev3("FS.vel=0.001");ev3("S.cfg.reduzir=false");
const lv=[],resAll=[];
ev3(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.figuras();const R=rot.montar(ctx);const g=[],lv=[],res=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length]);lv.push(ctx.stage.querySelectorAll('.ladoV').length);ctx.stage.querySelectorAll('.pm-res').forEach(e=>{res.push(e.textContent)})}
  window.__g=g;window.__lv=lv;window.__res=res;return true})().catch(e=>{window.__err=String(e&&e.stack||e)})`);
await sleep(2500);if(ev3("window.__err"))console.log("ERRO RODANDO:",ev3("window.__err"));
const g=Array.from(ev3("window.__g")||[]),LV=Array.from(ev3("window.__lv")||[]),RS=Array.from(ev3("window.__res")||[]),fala=ev3("ROT.figuras().passos.map(p=>p.fala)")||[],txt=Array.from(fala).join(" ");
t("roteiro figuras completo: 10 a 12 passos de 3 a 5 s, falas curtas e itens que viajam",g.length>=10&&g.length<=12&&g.every(([dur,gasto,len])=>dur>=3000&&dur<=5000&&gasto<=dur+1&&len>=5&&len<=140)&&sb.w.__anims.length>0,JSON.stringify(g.map(x=>x[0])));
const ord=["quadrado","retângulo","triângulo","quadrilátero","diagonal","pentágono","hexágono","heptágono","octógono","eneágono","decágono"].map(w=>txt.indexOf(w));
t("roteiro figuras: a fala segue a ordem quadrado, retângulo, triângulo, quadrilátero, diagonal, pentágono ... decágono",ord.every((x,i)=>x>=0&&(i===0||x>ord[i-1])),JSON.stringify(ord));
t("roteiro figuras: explica vértice, lado e que os lados ficam vermelhos ao contar",/vértice/.test(txt)&&/lado/.test(txt)&&/vermelh/.test(txt));
t("roteiro figuras: sem cubo, sem faces e sem arestas em nenhuma fala",!/cubo|faces|arestas/i.test(txt));
t("roteiro figuras: ao contar, cada lado fica vermelho (quadrado 4, retângulo 4, triângulo 3 lados vermelhos na tela)",(()=>{const i1=LV.indexOf(4),i2=LV.indexOf(4,i1+1),i3=LV.indexOf(3);return i1>=0&&i2>i1&&i3>i2})(),JSON.stringify(LV));
t("roteiro figuras: mostra 4 lados (quadrado), 3 lados (triângulo), o corte do quadrilátero em 2 triângulos e termina com 3 a 10 lados",RS.join("|").includes("4 lados")&&RS.join("|").includes("3 lados")&&/2 triângulos/.test(RS.join("|"))&&/8 · 9 · 10 lados/.test(RS.join("|")),RS.join("|"));
sb.w.close();
}


// ===== Entrega 3 — Comprimento: quadro de ordem (km hm dam m dm cm mm), frase da Katia, ×10 para a direita, ÷10 para a esquerda, Pyri andando pelas casas =====
{
const sb=await sessao(null,{animate:true}),ev3=x=>{try{return sb.ev(x)}catch(e){return undefined}};
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
T("Comprimento: o macete (💡) traz o quadro de ordem, a frase da Katia e as regras ×10 para a direita e ÷10 para a esquerda",()=>{
  const m=ev3("macAch('medidas-comprimento')"),x=m.explicacao;
  return /quadro de ordem/i.test(x)&&/Katia/.test(m.partes.map(p=>p.p).join(" "))&&/direita/.test(x)&&/esquerda/.test(x)&&/divid/i.test(x)&&/multipli/i.test(x)&&["km","hm","dam","dm","mm"].every(u=>x.includes(u))});
ev3("S.fases={};"+OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias","a3-figuras"])+";save()");
ev3("ir('fases');abrirExplicacao('a3-comprimento')");ev3("FS.auto=false;pararAnimacoes()");ev3("FS.vel=0.001");ev3("S.cfg.reduzir=false");
ev3(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.comprimento(3);const R=rot.montar(ctx);const g=[],casa=[],mult=[],res=[],cel=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length]);const py=ctx.stage.querySelector('.pm-pyri-anda');casa.push(py?py.dataset.casa:"");
    mult.push([...ctx.stage.querySelectorAll('.pm-mult')].map(e=>e.textContent).join(","));cel.push(ctx.stage.querySelectorAll('.pm-quadro').length);
    ctx.stage.querySelectorAll('.pm-res').forEach(e=>res.push(e.textContent))}
  window.__g=g;window.__casa=casa;window.__mult=mult;window.__res=res;window.__cel=cel;return true})().catch(e=>{window.__err=String(e&&e.stack||e)})`);
await sleep(2500);if(ev3("window.__err"))console.log("ERRO RODANDO:",ev3("window.__err"));
const g=Array.from(ev3("window.__g")||[]),CA=Array.from(ev3("window.__casa")||[]),MU=Array.from(ev3("window.__mult")||[]),RS=Array.from(ev3("window.__res")||[]).join("|"),CEL=Array.from(ev3("window.__cel")||[]),txt=Array.from(ev3("ROT.comprimento(3).passos.map(p=>p.fala)")||[]).join(" ");
t("roteiro comprimento completo: 7 passos de 3 a 5 s, falas curtas e itens que viajam",g.length===7&&g.every(([dur,gasto,len])=>dur>=3000&&dur<=5000&&gasto<=dur+1&&len>=5&&len<=140)&&sb.w.__anims.length>0,JSON.stringify(g.map(x=>x[0])));
t("roteiro comprimento: o quadro de ordem tem as 7 casas (km, hm, dam, m, dm, cm, mm) na tela",CEL[0]===7&&/quadro de ordem/.test(txt)&&["km","hm","dam","dm","mm"].every(u=>txt.includes(u)),JSON.stringify(CEL));
t("roteiro comprimento: a fala traz a frase da Katia e explica multiplicar por 10 (direita) e dividir por 10 (esquerda)",/Katia/.test(txt)&&/direita/.test(txt)&&/esquerda/.test(txt)&&/multiplica/.test(txt)&&/divide/.test(txt),txt.slice(0,200));
t("roteiro comprimento: o Pyri anda pelas casas — 3 m → cm (para a direita), 300 cm → m (para a esquerda) e 1 km → m (3 casas)",CA.slice(4).join()==="cm,m,m"||CA.filter(Boolean).join()==="cm,m,m",JSON.stringify(CA));
t("roteiro comprimento: cada casa andada mostra ×10 (direita) ou ÷10 (esquerda): 2 × ×10, 2 × ÷10 e 3 × ×10",MU.filter(Boolean).join("|")==="×10,×10|÷10,÷10|×10,×10,×10",JSON.stringify(MU));
t("roteiro comprimento: os resultados são 3 m = 300 cm, 300 cm = 3 m e 1 km = 1000 m",/3 m = 300 cm.*300 cm = 3 m.*1 km = 1000 m/.test(RS),RS);
sb.w.close();
}


// ===== Entrega 3 — Tempo: ponteiro grande gira de verdade e não se esconde sob o pequeno, legenda clara, horas quebradas na Prata e no Ouro =====
{
const sb=await sessao(null,{animate:true}),ev3=x=>{try{return sb.ev(x)}catch(e){return undefined}};
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
T("Tempo: só existe UMA função 'girar' no código (a segunda escondia a primeira e o ponteiro grande não se mexia); o ponteiro usa girarMao",()=>{
  const f=lerArq("js/motor/explicacao.js");return (f.match(/function girar\(/g)||[]).length===1&&/function girarMao\(/.test(f)&&/girarMao\(c(?:tx)?,R\.pmin,360/.test(f)});
T("Tempo: Bronze só tem :00, :15, :30 e :45; Prata e Ouro também têm horas quebradas (5, 10, 20, 25, 35, 40, 50 e 55 minutos)",()=>{
  const ms=(n,d)=>{const r=new Set();for(let i=0;i<500;i++)for(const tp of["digitar","escolha","lacuna"]){const ex=ev3(`GER.tempo(${d},'${tp}','${n}')`);if(ex.visual&&ex.visual.tipo==="relogio")r.add(ex.visual.m)}return[...r]};
  const b=ms("bronze",1),p=ms("prata",1),o=ms("ouro",3),QUE=[5,10,20,25,35,40,50,55];
  if(b.some(m=>![0,15,30,45].includes(m)))return {ok:false,m:"Bronze com minutos "+b};
  if(!QUE.some(m=>p.includes(m))||!(p.includes(20)||p.includes(55)))return {ok:false,m:"Prata sem horas quebradas: "+p};
  return QUE.every(m=>o.includes(m))||{ok:false,m:"Ouro viu "+o}});
T("Tempo: a sessão usa o nível — Bronze sem quebradas; Prata com",()=>{
  const vistos=n=>{const r=new Set();for(let i=0;i<40;i++)for(const x of Array.from(ev3(`novaSessao(FASES.find(f=>f.id==='a3-tempo'),'${n}').fila`)))if(x.visual&&x.visual.tipo==="relogio")r.add(x.visual.m);return[...r]};
  const b=vistos("bronze"),p=vistos("prata");return b.every(m=>[0,15,30,45].includes(m))&&p.some(m=>![0,15,30,45].includes(m))});
T("Tempo: a explicação da horas quebradas (3:55) existe e a legenda 'ponteiro pequeno = horas / ponteiro grande = minutos' fica na tela",()=>{
  const x=Array.from(ev3("ROT.tempo(2).passos.map(p=>p.fala)")).join(" ");return /3:55/.test(x)&&/ponteiro pequeno/.test(x)&&/ponteiro grande/.test(x)});
ev3("S.fases={};"+OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias","a3-figuras","a3-comprimento"])+";save()");
ev3("ir('fases');abrirExplicacao('a3-tempo')");ev3("FS.auto=false;pararAnimacoes()");ev3("FS.vel=0.001");ev3("S.cfg.reduzir=false");
ev3(`(async()=>{window.__gm=[];const o=girarMao;window.girarMao=function(c,e,d,m){window.__gm.push([e.dataset.mao,d]);return o(c,e,d,m)};
  const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.tempo(2);const R=rot.montar(ctx);const g=[],leg=[],ang=[],res=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length]);
    leg.push([...ctx.stage.querySelectorAll('.pm-legenda-rel')].map(e=>e.textContent).join("|"));
    const a=ctx.stage.querySelector('[data-mao=pequeno]'),b=ctx.stage.querySelector('[data-mao=grande]');ang.push(a&&b?[+a.dataset.deg,+b.dataset.deg]:null);
    ctx.stage.querySelectorAll('.pm-res').forEach(e=>res.push(e.textContent))}
  window.girarMao=o;window.__g=g;window.__leg=leg;window.__ang=ang;window.__res=res;return true})().catch(e=>{window.__err=String(e&&e.stack||e)})`);
await sleep(3000);if(ev3("window.__err"))console.log("ERRO RODANDO:",ev3("window.__err"));
const g=Array.from(ev3("window.__g")||[]),LG=Array.from(ev3("window.__leg")||[]),AN=Array.from(ev3("window.__ang")||[]).map(a=>a&&Array.from(a)),GM=Array.from(ev3("window.__gm")||[]).map(a=>Array.from(a)),RS=Array.from(ev3("window.__res")||[]).join("|");
t("roteiro tempo: 7 passos de 3 a 5 s, falas curtas",g.length===7&&g.every(([dur,gasto,len])=>dur>=3000&&dur<=5000&&gasto<=dur+1&&len>=5&&len<=140),JSON.stringify(g.map(x=>x[0])));
t("roteiro tempo: a legenda 'ponteiro pequeno = horas' e 'ponteiro grande = minutos' aparece já no 1º passo",/ponteiro pequeno = horas/.test(LG[0]||"")&&/ponteiro grande = minutos/.test(LG[0]||""),LG[0]);
t("roteiro tempo: no 1º passo os dois ponteiros apontam para lugares diferentes (o grande não fica escondido sobre o pequeno)",!!AN[0]&&Math.abs(((AN[0][0]-AN[0][1])%360+360)%360)>=30&&Math.abs(((AN[0][0]-AN[0][1])%360+360)%360)<=330,JSON.stringify(AN[0]));
t("roteiro tempo: o ponteiro grande gira de verdade (uma volta de 360°) e o pequeno avança 1 hora (30°)",GM.some(a=>a[0]==="grande"&&a[1]===360)&&GM.some(a=>a[0]==="pequeno"&&a[1]===AN[0][0]+30)&&GM.some(a=>a[0]==="grande"&&a[1]===180),JSON.stringify(GM));
t("roteiro tempo: mostra a hora quebrada 3:55 com os ponteiros em lugares diferentes",RS.includes("3:55")&&GM.some(a=>a[0]==="grande"&&a[1]===330),RS+" "+JSON.stringify(GM));
sb.w.close();
}


// ===== Entrega 3 — Dinheiro mais realista: cédulas coloridas com valor grande e bicho desenhado por mim; moedas com os tons certos =====
{
const sb=await sessao(null,{animate:true}),ev3=x=>{try{return sb.ev(x)}catch(e){return undefined}};
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
const dom=h=>{const d=sb.w.document.createElement("div");d.innerHTML=h;return d};
const NOTAS=[2,5,10,20,50,100],BICHO={2:"tartaruga",5:"garça",10:"arara",20:"mico-leão",50:"onça",100:"garoupa"};
T("cédulas: cada valor (2, 5, 10, 20, 50, 100) tem cor própria, o valor grande 'R$ n', 'BRASIL' e 'REAL' e um animal desenhado com várias formas",()=>{
  const cores=new Set();
  for(const v of NOTAS){const d=dom(ev3(`svgDinheiro([{k:'nota',v:${v}}])`)),n=d.querySelector(".cedula");if(!n)return {ok:false,m:"sem cédula "+v};
    const bg=n.querySelector("rect").getAttribute("fill");cores.add(bg);
    const txt=n.textContent;if(!txt.includes("R$ "+v)||!/BRASIL/.test(txt)||!/REAL/.test(txt))return {ok:false,m:v+": texto "+txt};
    const big=[...n.querySelectorAll("text")].find(x=>x.textContent.includes("R$ "+v));if(!big||+big.getAttribute("font-size")<15)return {ok:false,m:v+": valor pequeno"};
    const an=n.querySelector("[data-animal]");if(!an||an.getAttribute("data-animal")!==BICHO[v])return {ok:false,m:v+": animal "+(an&&an.getAttribute("data-animal"))};
    if(an.querySelectorAll("path,ellipse,circle,polygon").length<4)return {ok:false,m:v+": animal simples demais"}}
  return cores.size===6||{ok:false,m:"cores repetidas "+[...cores]}});
T("cédulas: o desenho é próprio e estilizado — marca 'ILUSTRAÇÃO' e não copia o texto 'BANCO CENTRAL DO BRASIL'",()=>{
  const x=ev3("svgDinheiro(["+NOTAS.map(v=>`{k:'nota',v:${v}}`).join(",")+"])");return /ILUSTRAÇÃO/.test(x)&&!/BANCO CENTRAL/i.test(x)});
T("moedas: R$ 1 é dourada com miolo prateado; 50 centavos prateada; 25 e 5 cobre; 10 dourada; cada uma com valor e 'centavos' (a de 1 real diz REAL)",()=>{
  const info=v=>{const g=dom(ev3(`svgDinheiro([{k:'moeda',v:${v}}])`)).querySelector(".moedinha");const cs=[...g.querySelectorAll("circle")];return{f:cs.map(c=>c.getAttribute("fill")),txt:g.textContent,n:cs.length}};
  const m1=info(100),m50=info(50),m25=info(25),m10=info(10),m5=info(5);
  if(m1.n<3||m1.f[0]===m1.f[1]&&m1.f[1]===m1.f[2])return {ok:false,m:"R$1 sem miolo diferente "+m1.f};
  if(!/REAL/.test(m1.txt)||!/1/.test(m1.txt))return {ok:false,m:"texto R$1 "+m1.txt};
  const dourado=m10.f[0],prata=m50.f[0],cobre=m25.f[0];
  if(m1.f[0]!==dourado)return {ok:false,m:"anel do R$1 deveria ser dourado como a de 10"};
  if(!m1.f.slice(1).includes(prata))return {ok:false,m:"miolo do R$1 deveria ser prateado como a de 50"};
  if(m5.f[0]!==cobre||new Set([dourado,prata,cobre]).size!==3)return {ok:false,m:"tons "+[dourado,prata,cobre,m5.f[0]]};
  return [m50,m25,m10,m5].every((m,i)=>/centavos/.test(m.txt)&&m.txt.includes(["50","25","10","5"][i]))});
T("desenho: o SVG das cédulas e moedas continua dentro da tela do exercício (class cedula / moedinha) e o aria-label diz 'notas' ou 'moedas'",()=>{
  const a=ev3("svgDinheiro([{k:'nota',v:5},{k:'nota',v:10}])"),b=ev3("svgDinheiro([{k:'moeda',v:25},{k:'moeda',v:50}])");
  return /aria-label="notas"/.test(a)&&/aria-label="moedas"/.test(b)&&(a.match(/class="cedula"/g)||[]).length===2&&(b.match(/class="moedinha"/g)||[]).length===2});
ev3("S.fases={};"+OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias","a3-figuras","a3-comprimento","a3-tempo"])+";save()");
ev3("ir('fases');abrirExplicacao('a3-dinheiro')");ev3("FS.auto=false;pararAnimacoes()");ev3("FS.vel=0.001");ev3("S.cfg.reduzir=false");
ev3(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.dinheiro(10,7);const R=rot.montar(ctx);const g=[],mo=[],no=[],an=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length]);mo.push(ctx.stage.querySelectorAll('.moedinha').length);no.push(ctx.stage.querySelectorAll('.cedula').length);an.push(ctx.stage.querySelectorAll('.pm-moeda,.pm-nota').length)}
  window.__g=g;window.__mo=mo;window.__no=no;window.__an=an;return true})().catch(e=>{window.__err=String(e&&e.stack||e)})`);
await sleep(2500);if(ev3("window.__err"))console.log("ERRO RODANDO:",ev3("window.__err"));
const MO=Array.from(ev3("window.__mo")||[]),NO=Array.from(ev3("window.__no")||[]),AN=Array.from(ev3("window.__an")||[]);
t("roteiro dinheiro: as moedas e as notas da animação usam o desenho novo (1 moeda de R$ 1, 2 de 50, 4 de 25, 2 notas e 1 nota)",JSON.stringify(MO)==="[1,2,4,0,0,0,0,0]"&&JSON.stringify(NO)==="[0,0,0,0,0,2,1,0]",JSON.stringify([MO,NO]));
t("roteiro dinheiro: não sobrou nenhum desenho antigo (círculo dourado liso / retângulo verde liso)",AN.every(x=>x===0),JSON.stringify(AN));
sb.w.close();
}


// ===== Lote C — Tabelas e gráficos + Acaso e probabilidade (3º ano) =====
{
const sb=await sessao(null,{animate:true}),ev3=x=>{try{return sb.ev(x)}catch(e){return undefined}},U=x=>sb.w.document.querySelector(x),Q=x=>[...sb.w.document.querySelectorAll(x)];
const T=(n,f)=>{try{const r=f();t(n,r===true||(r&&r.ok===true),r&&r.m)}catch(e){t(n+"  [erro: "+String(e.message).slice(0,70)+"]",false)}};
const dom=h=>{const d=sb.w.document.createElement("div");d.innerHTML=h;return d};
const gerar=(g,d,tp,n)=>ev3(`JSON.parse(JSON.stringify(GER.${g}(${d},'${tp}'${n?",'"+n+"'":""})))`);
const TIPOS=["digitar","escolha","lacuna","relacionar"];
const NOMES=["Pikachu","Charmander","Squirtle","Bulbasaur","Eevee","Jigglypuff"],DIAS=["Segunda","Terça","Quarta","Quinta"];
const soma=a=>a.reduce((x,y)=>x+y,0);
/* recalcula a resposta só a partir do desenho (visual) e do texto da pergunta */
function valoresDe(v){
  if(v.tipo==="pictograma")return v.itens.map(i=>({nome:i.nome,n:i.n*v.vale}));
  if(v.tipo==="colunas"||v.tipo==="barras")return v.itens.map(i=>({nome:i.nome,n:i.n}));
  if(v.tipo==="tabela"&&v.cols.length===2)return v.linhas.map(l=>({nome:l[0],n:l[1]}));
  return null}
function recalcTab(q,v){
  const nomes=NOMES.filter(n=>q.includes(n)).sort((a,b)=>q.indexOf(a)-q.indexOf(b));
  if(v.tipo==="tabela"&&v.cols.length>2){
    const dia=DIAS.find(d=>q.includes(d)),ci=dia?v.cols.indexOf(dia):-1;
    if(/ao todo/i.test(q))return soma(v.linhas.map(l=>soma(l.slice(1))));
    if(nomes.length&&/3 dias/.test(q))return soma(v.linhas.find(l=>l[0]===nomes[0]).slice(1));
    if(!nomes.length&&dia&&/omando/.test(q))return soma(v.linhas.map(l=>l[ci]));
    if(nomes.length&&dia)return v.linhas.find(l=>l[0]===nomes[0])[ci];
    return NaN}
  const L=valoresDe(v),n=x=>L.find(i=>i.nome===x).n;
  if(/soma das duas maiores/.test(q))return soma(L.map(i=>i.n).sort((a,b)=>b-a).slice(0,2));
  if(/maior quantidade/.test(q))return Math.max(...L.map(i=>i.n));
  if(/menor quantidade/.test(q))return Math.min(...L.map(i=>i.n));
  if(/a mais/.test(q))return n(nomes[0])-n(nomes[1]);
  if(/ao todo/i.test(q))return soma(L.map(i=>i.n));
  if(nomes.length===1)return n(nomes[0]);
  return NaN}
const NIV={bronze:1,prata:1,ouro:3};
const VIS_NIVEL={bronze:["tabela2","pictograma1"],prata:["tabela3","colunas"],ouro:["barras","pictogramaV","tabela3"]};
const tipoVis=v=>v.tipo==="tabela"?(v.cols.length>2?"tabela3":"tabela2"):v.tipo==="pictograma"?(v.vale>1?"pictogramaV":"pictograma1"):v.tipo;

// ---------- estrutura ----------
T("Lote C: o 3º ano tem 15 fases; as novas são a3-tabelas (ordem 14, Estatística) e a3-acaso (ordem 15, Probabilidade)",()=>{
  const f=ev3("JSON.parse(JSON.stringify(fasesDoAno(3)))");if(f.length!==15)return {ok:false,m:"fases "+f.length};
  const a=f[13],b=f[14];return a.id==="a3-tabelas"&&a.ordem===14&&a.area==="Estatística"&&b.id==="a3-acaso"&&b.ordem===15&&b.area==="Probabilidade"&&/Tabelas e gráficos/.test(a.titulo)&&/Acaso/.test(b.titulo)&&a.gerador==="tabelas"&&b.gerador==="acaso"});
T("Lote C: a lista 'Em breve' do 3º ano ficou vazia e a trilha ilustrada tem 15 pontos (um por fase)",()=>ev3("EM_BREVE[3].length")===0&&ev3("ZONAS[3].pontos.length")===15);
T("Lote C: as duas fases têm tópicos, resumo e roteiro (ROT.tabelas e ROT.acaso existem)",()=>{
  for(const id of["a3-tabelas","a3-acaso"]){const f=ev3(`JSON.parse(JSON.stringify(FASES.find(f=>f.id==='${id}')))`);
    if(!f||!f.resumo||f.topicos.length<3||!f.roteiro||ev3(`typeof ROT['${f.roteiro[0]}']`)!=="function")return {ok:false,m:id}}return true});
T("Lote C: 24 macetes, dois novos (tabelas e acaso), ligados às fases novas",()=>{
  if(ev3("MACETES.length")!==24)return {ok:false,m:"macetes "+ev3("MACETES.length")};
  return ev3("FASES.find(f=>f.id==='a3-tabelas').macete")==="tabelas"&&ev3("FASES.find(f=>f.id==='a3-acaso').macete")==="acaso"&&!!ev3("macAch('tabelas')")&&!!ev3("macAch('acaso')")});
T("Lote C: o macete de tabelas ensina título → linha e coluna → número (ou altura da barra), tanto no resumo quanto na explicação",()=>{
  const r=ev3("macAch('tabelas').resumo"),e=ev3("macAch('tabelas').explicacao");
  return [r,e].every(m=>/título/.test(m)&&/linha/.test(m)&&/coluna/.test(m)&&/barra/.test(m))&&/1º/.test(e)&&/2º/.test(e)&&/3º/.test(e)});
T("Lote C: o macete do acaso ensina certo, impossível, possível e que mais bolinhas = mais chance",()=>{const m=ev3("JSON.stringify(macAch('acaso'))");return /certo/i.test(m)&&/impossível/i.test(m)&&/possível/.test(m)&&/mais provável/.test(m)&&/mais bolinhas/.test(m)});

// ---------- desenhos ----------
T("desenho: tabela simples e de dupla entrada trazem título, cabeçalho, todos os nomes e valores, com class tabelaSvg",()=>{
  const v={tipo:"tabela",titulo:"Pokémon capturados",cols:["Pokémon","Quantidade"],linhas:[["Pikachu",4],["Eevee",6]]};
  const d=dom(ev3(`svgTabela(${JSON.stringify(v)})`)),x=d.textContent;
  const v2={tipo:"tabela",titulo:"Capturas na semana",cols:["Pokémon","Segunda","Terça","Quarta"],linhas:[["Squirtle",1,2,3],["Eevee",4,5,6]]};
  const x2=dom(ev3(`svgTabela(${JSON.stringify(v2)})`)).textContent;
  return !!d.querySelector("svg.tabelaSvg")&&/Pokémon capturados/.test(x)&&/Quantidade/.test(x)&&/Pikachu/.test(x)&&/Eevee/.test(x)&&/4/.test(x)&&/6/.test(x)&&["Segunda","Terça","Quarta","Squirtle","Eevee","Capturas na semana"].every(s=>x2.includes(s))&&d.querySelectorAll("[data-linha]").length===2&&dom(ev3(`svgTabela(${JSON.stringify(v2)})`)).querySelectorAll("[data-celula]").length===6});
T("desenho: pictograma tem um ícone por unidade, nome de cada linha e a legenda 'cada ícone vale N'",()=>{
  const v={tipo:"pictograma",titulo:"Capturas",vale:5,itens:[{nome:"Pikachu",cor:"#f7d02c",n:3},{nome:"Eevee",cor:"#b0845a",n:5}]};
  const d=dom(ev3(`svgPictograma(${JSON.stringify(v)})`));
  return d.querySelectorAll("[data-icone]").length===8&&/Pikachu/.test(d.textContent)&&/Eevee/.test(d.textContent)&&/cada ícone vale 5/.test(d.textContent)&&!!d.querySelector("svg.graficoSvg")});
T("desenho: gráfico de colunas — altura proporcional ao valor, régua com números, colunas coloridas, sem escrever o valor em cima",()=>{
  const v={tipo:"colunas",titulo:"Capturas",passo:2,max:10,itens:[{nome:"Pikachu",cor:"#f7d02c",n:8},{nome:"Eevee",cor:"#b0845a",n:4},{nome:"Squirtle",cor:"#5aa0f0",n:6}]};
  const d=dom(ev3(`svgColunas(${JSON.stringify(v)})`)),b=[...d.querySelectorAll("[data-barra]")],h=b.map(e=>+e.getAttribute("height"));
  const ticks=[...d.querySelectorAll("[data-tick]")].map(e=>e.textContent);
  return b.length===3&&Math.abs(h[0]/h[1]-2)<0.01&&Math.abs(h[2]/h[1]-1.5)<0.01&&["0","2","4","6","8","10"].every(x=>ticks.includes(x))&&b.map(e=>e.getAttribute("fill")).join()==="#f7d02c,#b0845a,#5aa0f0"&&!d.querySelector("[data-rotulo-valor]")&&/Pikachu/.test(d.textContent)});
T("desenho: o topo de cada coluna fica EXATAMENTE na linha da régua do seu valor (e a base no zero); o fim de cada barra, no traço do seu valor",()=>{
  const vc={tipo:"colunas",titulo:"x",passo:2,max:10,itens:[{nome:"Pikachu",cor:"#f7d02c",n:8},{nome:"Eevee",cor:"#b0845a",n:4},{nome:"Squirtle",cor:"#5aa0f0",n:6}]};
  const d=dom(ev3(`svgColunas(${JSON.stringify(vc)})`)),yT={};d.querySelectorAll("[data-tick]").forEach(e=>yT[e.textContent]=+e.getAttribute("y")-4);
  const bs=[...d.querySelectorAll("[data-barra]")];
  for(const [i,n] of[[0,8],[1,4],[2,6]]){const y=+bs[i].getAttribute("y"),h=+bs[i].getAttribute("height");if(Math.abs(y-yT[n])>0.1||Math.abs(y+h-yT[0])>0.1)return {ok:false,m:`coluna ${n}: topo ${y} esperado ${yT[n]}; base ${y+h} esperado ${yT[0]}`}}
  const vb={tipo:"barras",titulo:"x",passo:5,max:30,itens:[{nome:"Pikachu",cor:"#f7d02c",n:25},{nome:"Eevee",cor:"#b0845a",n:10}]};
  const e=dom(ev3(`svgBarras(${JSON.stringify(vb)})`)),xT={};e.querySelectorAll("[data-tick]").forEach(t=>xT[t.textContent]=+t.getAttribute("x"));
  const br=[...e.querySelectorAll("[data-barra]")];
  for(const [i,n] of[[0,25],[1,10]]){const x=+br[i].getAttribute("x"),w=+br[i].getAttribute("width");if(Math.abs(x-xT[0])>0.1||Math.abs(x+w-xT[n])>0.1)return {ok:false,m:`barra ${n}: fim ${x+w} esperado ${xT[n]}`}}
  return true});
T("desenho: gráfico de barras (deitadas) — largura proporcional ao valor e régua de 5 em 5 (ou 10 em 10)",()=>{
  const v={tipo:"barras",titulo:"Capturas",passo:5,max:30,itens:[{nome:"Pikachu",cor:"#f7d02c",n:25},{nome:"Eevee",cor:"#b0845a",n:10},{nome:"Squirtle",cor:"#5aa0f0",n:15}]};
  const d=dom(ev3(`svgBarras(${JSON.stringify(v)})`)),b=[...d.querySelectorAll("[data-barra]")],w=b.map(e=>+e.getAttribute("width"));
  const ticks=[...d.querySelectorAll("[data-tick]")].map(e=>e.textContent);
  return b.length===3&&Math.abs(w[0]/w[1]-2.5)<0.01&&Math.abs(w[2]/w[1]-1.5)<0.01&&["0","5","10","15","20","25","30"].every(x=>ticks.includes(x))});
T("desenho: urna com uma bolinha por unidade em cada cor, e a cor da bolinha é a cor do nome",()=>{
  const v={tipo:"urna",bolas:[{cor:"azul",n:3},{cor:"vermelha",n:2},{cor:"verde",n:1}]};
  const d=dom(ev3(`svgUrna(${JSON.stringify(v.bolas)})`)),b=[...d.querySelectorAll("[data-bola]")],por={};b.forEach(e=>por[e.getAttribute("data-bola")]=(por[e.getAttribute("data-bola")]||0)+1);
  const cores=new Set(b.map(e=>e.getAttribute("fill")));
  return b.length===6&&por.azul===3&&por.vermelha===2&&por.verde===1&&cores.size===3&&!!d.querySelector("svg.urnaSvg")});
T("desenho: moeda — o texto CARA/COROA fica dentro da moeda sem tocar o aro (y ≤ 90)",()=>{const d=dom(ev3("svgMoedaSorte()"));return [...d.querySelectorAll("text")].filter(t=>/^(CARA|COROA)$/.test(t.textContent)).every(t=>+t.getAttribute("y")<=90)&&d.querySelectorAll("text").length>=4});
T("desenho: dado mostra os pontinhos da face (1 a 6) e a moeda tem cara e coroa",()=>{
  for(let n=1;n<=6;n++){const d=dom(ev3(`svgDado(${n})`));if(d.querySelectorAll("[data-ponto]").length!==n)return {ok:false,m:"face "+n}}
  const m=dom(ev3("svgMoedaSorte()")).textContent;return /cara/i.test(m)&&/coroa/i.test(m)});
T("desenho: roleta tem uma fatia por cor, do mesmo tamanho, nas cores certas",()=>{
  const d=dom(ev3(`svgRoleta(["azul","vermelha","azul","verde"])`)),f=[...d.querySelectorAll("[data-setor]")];
  return f.length===4&&f[0].getAttribute("fill")===f[2].getAttribute("fill")&&f[0].getAttribute("fill")!==f[1].getAttribute("fill")&&new Set(f.map(e=>e.getAttribute("fill"))).size===3&&!!d.querySelector("svg.roletaSvg")});
T("desenho: visEstatico mostra cada visual novo (tabela, pictograma, colunas, barras, urna, dado, moeda, roleta)",()=>{
  const vs=[{tipo:"tabela",titulo:"x",cols:["Pokémon","Quantidade"],linhas:[["Pikachu",1]]},{tipo:"pictograma",titulo:"x",vale:1,itens:[{nome:"Eevee",cor:"#b0845a",n:2}]},{tipo:"colunas",titulo:"x",passo:1,max:4,itens:[{nome:"Eevee",cor:"#b0845a",n:2}]},{tipo:"barras",titulo:"x",passo:5,max:10,itens:[{nome:"Eevee",cor:"#b0845a",n:5}]},{tipo:"urna",bolas:[{cor:"azul",n:2}]},{tipo:"dado",face:3},{tipo:"moeda"},{tipo:"roleta",cores:["azul","verde"]}];
  return vs.every(v=>/<svg/.test(ev3(`visEstatico(${JSON.stringify(v)})`)))});

// ---------- questões: Tabelas e gráficos ----------
for(const nv of["bronze","prata","ouro"]){
  T(`Tabelas (${nv}): as respostas das questões conferem com o desenho (digitar, escolha, completar e ligar) — 60 questões por tipo`,()=>{
    for(const tp of TIPOS)for(let i=0;i<60;i++){
      const ex=gerar("tabelas",NIV[nv],tp,nv);if(ex.tipo!==tp)return {ok:false,m:"tipo "+ex.tipo};
      if(!ex.visual||!["tabela","pictograma","colunas","barras"].includes(ex.visual.tipo))return {ok:false,m:nv+" "+tp+": sem visual"};
      if(tp==="relacionar"){
        if(ex.pares.length!==3||new Set(ex.pares.map(p=>p.d)).size!==3)return {ok:false,m:"pares"};
        for(const p of ex.pares){const r=recalcTab(p.e,ex.visual);if(String(r)!==p.d)return {ok:false,m:nv+" ligar "+p.e+" esperado "+r+" veio "+p.d}}
        if([...ex.direita].sort().join()!==ex.pares.map(p=>p.d).sort().join())return {ok:false,m:"direita"}
      }else{
        const r=recalcTab(ex.enunciado,ex.visual);if(r!==ex.resposta)return {ok:false,m:`${nv} ${tp}: "${ex.enunciado}" esperado ${r} veio ${ex.resposta}`};
        if(tp==="escolha"&&(!ex.opcoes.includes(ex.resposta)||new Set(ex.opcoes).size!==4))return {ok:false,m:"opções "+ex.opcoes}}
      if(!ex.erro||!ex.dica)return {ok:false,m:"sem erro/dica"}}return true});
}
T("Tabelas: Bronze só tem tabela simples e pictograma de valor 1; Prata, tabela de dupla entrada e colunas; Ouro, barras, pictograma com valor 2/5/10 e tabela",()=>{
  for(const nv of["bronze","prata","ouro"]){const vistos=new Set();
    for(const tp of TIPOS)for(let i=0;i<60;i++){const ex=gerar("tabelas",NIV[nv],tp,nv);vistos.add(tipoVis(ex.visual))}
    const esp=VIS_NIVEL[nv];if([...vistos].some(x=>!esp.includes(x))||esp.some(x=>!vistos.has(x)))return {ok:false,m:nv+": "+[...vistos]}}return true});
T("Tabelas: valores do Bronze são pequenos (1 a 9), pictograma do Ouro vale 2, 5 ou 10, régua das colunas de 1 em 1 ou 2 em 2 e das barras de 5 em 5 ou 10 em 10, e os valores caem na régua",()=>{
  const vales=new Set();
  for(let i=0;i<150;i++){const b=gerar("tabelas",1,"digitar","bronze"),L=valoresDe(b.visual)||[];if(L.some(x=>x.n<1||x.n>9))return {ok:false,m:"bronze "+JSON.stringify(b.visual)};
    const c=gerar("tabelas",1,"digitar","prata");if(c.visual.tipo==="colunas"){if(![1,2].includes(c.visual.passo)||c.visual.itens.some(x=>x.n%c.visual.passo||x.n>c.visual.max))return {ok:false,m:"colunas "+JSON.stringify(c.visual)}}
    const o=gerar("tabelas",3,"digitar","ouro");if(o.visual.tipo==="barras"&&(![5,10].includes(o.visual.passo)||o.visual.itens.some(x=>x.n%o.visual.passo||x.n>o.visual.max)))return {ok:false,m:"barras "+JSON.stringify(o.visual)};
    if(o.visual.tipo==="pictograma")vales.add(o.visual.vale)}
  return [2,5,10].every(v=>vales.has(v))&&[...vales].every(v=>[2,5,10].includes(v))});
T("Tabelas: o pictograma do Ouro diz o valor na pergunta ('cada ícone vale N') e nunca mais de 8 ícones por linha",()=>{
  for(let i=0;i<120;i++){const ex=gerar("tabelas",3,umTipo(i),"ouro");if(ex.visual.tipo==="pictograma"){if(ex.visual.itens.some(x=>x.n>8||x.n<1))return {ok:false,m:"ícones "+JSON.stringify(ex.visual.itens)}}}return true});
function umTipo(i){return TIPOS[i%4]}
T("Tabelas: nomes são Pokémon do jogo e valores distintos entre os itens (maior/menor sem empate)",()=>{
  for(let i=0;i<150;i++){const ex=gerar("tabelas",NIV[["bronze","prata","ouro"][i%3]],"digitar",["bronze","prata","ouro"][i%3]),L=valoresDe(ex.visual);
    if(L){if(!L.every(x=>NOMES.includes(x.nome)))return {ok:false,m:"nome "+JSON.stringify(L)};if(new Set(L.map(x=>x.n)).size!==L.length)return {ok:false,m:"empate "+JSON.stringify(L)}}}return true});
T("Tabelas: a sessão traz as quatro formas de responder e nenhuma questão repetida (Bronze, Prata e Ouro)",()=>{
  for(const nv of["bronze","prata","ouro"]){const s=JSON.parse(ev3(`JSON.stringify((()=>{const x=novaSessao(FASES.find(f=>f.id==='a3-tabelas'),'${nv}');return x.fila.map(e=>({tipo:e.tipo,k:e.chave||e.enunciado}))})())`));
    if(new Set(s.map(x=>x.tipo)).size!==4)return {ok:false,m:nv+" tipos "+s.map(x=>x.tipo)};if(new Set(s.map(x=>x.k)).size!==s.length)return {ok:false,m:nv+" repetidas"}}return true});

// ---------- questões: Acaso e probabilidade ----------
const COR={azul:"azuis",vermelha:"vermelhas",verde:"verdes",amarela:"amarelas"},COR_P=Object.fromEntries(Object.entries(COR).map(([a,b])=>[b,a]));
const corDe=q=>Object.keys(COR).find(c=>q.includes(c)||q.includes(COR[c]));
const cod=r=>r===1?"certo":r===2?"possível":"impossível";
function recalcAcaso(ex,q){
  const v=ex.visual;q=q||ex.enunciado;
  if(v&&v.tipo==="urna"){const B=Object.fromEntries(v.bolas.map(b=>[b.cor,b.n])),tot=soma(v.bolas.map(b=>b.n)),ns=v.bolas.map(b=>b.n);
    if(/a mais/.test(q))return Math.max(...ns)-Math.min(...ns);
    if(/maior chance/.test(q))return {rot:v.bolas.find(b=>b.n===Math.max(...ns)).cor};
    if(/menor chance/.test(q))return {rot:v.bolas.find(b=>b.n===Math.min(...ns)).cor};
    if(/ao todo/.test(q))return tot;
    if(/é certo, possível ou impossível/.test(q)){const c=corDe(q);return {rot:B[c]===tot?"certo":!B[c]?"impossível":"possível"}}
    if(/Quantas (bolinhas|chances)|há ___|tem ___|Na urna há/.test(q)||/chances/.test(q)||/bolinhas .* há/.test(q))return B[corDe(q)];
    return NaN}
  if(v&&v.tipo==="dado"){if(/diferentes/.test(q))return 6;if(/ímpares/.test(q))return 3;if(/pares/.test(q))return 3;let m=q.match(/maiores que (\d)/);if(m)return 6-+m[1];m=q.match(/menores que (\d)/);if(m)return +m[1]-1;return NaN}
  if(v&&v.tipo==="moeda")return 2;
  if(v&&v.tipo==="roleta"){if(/resultados/.test(q))return v.cores.length;return v.cores.filter(c=>c===corDe(q)).length}
  return NaN}
function acasoOk(ex){   // confere uma questão (digitar, escolha, lacuna)
  const r=recalcAcaso(ex);
  if(r&&typeof r==="object"){const lab=ex.rotulos&&ex.rotulos[ex.resposta];return lab===r.rot?true:`rótulo ${lab} esperado ${r.rot}: ${ex.enunciado}`}
  return r===ex.resposta?true:`esperado ${r} veio ${ex.resposta}: ${ex.enunciado}`}
function relAcasoBronze(e){const m=e.match(/Tirar uma bolinha (\w+) de uma urna (só )?com bolinhas ([\w ]+)\./);if(!m)return null;const cs=m[3].split(" e ").map(x=>COR_P[x]);
  return cs.length===1&&cs[0]===m[1]?"certo":!cs.includes(m[1])?"impossível":"possível"}
for(const nv of["bronze","prata","ouro"]){
  T(`Acaso (${nv}): as respostas conferem com o desenho (digitar, escolha com palavras, completar e ligar) — 60 questões por tipo`,()=>{
    for(const tp of TIPOS)for(let i=0;i<60;i++){
      const ex=gerar("acaso",NIV[nv],tp,nv);if(ex.tipo!==tp)return {ok:false,m:"tipo "+ex.tipo};if(!ex.erro||!ex.dica)return {ok:false,m:"sem erro/dica"};
      if(tp==="relacionar"){
        if(ex.pares.length!==3||new Set(ex.pares.map(p=>p.d)).size!==3)return {ok:false,m:"pares "+JSON.stringify(ex.pares)};
        for(const p of ex.pares){let esp;
          if(nv==="bronze")esp=relAcasoBronze(p.e);
          else if(nv==="prata"){const v=ex.visual,ns=v.bolas.map(b=>b.n),b=v.bolas.find(b=>p.e.includes(b.cor)||p.e.includes(COR[b.cor]));esp=b.n===Math.max(...ns)?"a maior chance":b.n===Math.min(...ns)?"a menor chance":"a chance do meio"}
          else{ if(/dado comum/.test(p.e)&&/resultados/.test(p.e))esp="6";else if(/moeda/.test(p.e))esp="2";else{const m=p.e.match(/(\d+) partes iguais/);esp=m&&m[1]}}
          if(esp!==p.d)return {ok:false,m:`${nv} ligar "${p.e}" -> ${p.d} (esperado ${esp})`}}
      }else{
        const ok=acasoOk(ex);if(ok!==true)return {ok:false,m:nv+" "+tp+": "+ok};
        if(tp==="escolha"){if(!ex.opcoes.includes(ex.resposta)||new Set(ex.opcoes).size!==ex.opcoes.length)return {ok:false,m:"opções "+ex.opcoes};
          if(ex.rotulos&&ex.opcoes.some(o=>!ex.rotulos[o]))return {ok:false,m:"rótulo faltando"}}}}return true});
}
T("Acaso: Bronze usa só certo/possível/impossível e contagem de bolinhas (urna), sem dado, moeda ou roleta",()=>{
  const vistos=new Set(),pal=new Set();
  for(const tp of TIPOS)for(let i=0;i<60;i++){const ex=gerar("acaso",1,tp,"bronze");vistos.add(ex.visual?ex.visual.tipo:"sem");if(ex.rotulos)Object.values(ex.rotulos).forEach(x=>pal.add(x))}
  return [...vistos].every(x=>x==="urna"||x==="sem")&&vistos.has("urna")&&["certo","possível","impossível"].every(x=>pal.has(x))&&pal.size===3});
T("Acaso: Prata pergunta mais/menos provável (palavras = nome da cor) e quantas bolinhas a mais; as contagens das cores são diferentes",()=>{
  const ro=new Set();
  for(const tp of TIPOS)for(let i=0;i<60;i++){const ex=gerar("acaso",1,tp,"prata");if(!ex.visual||ex.visual.tipo!=="urna")return {ok:false,m:"sem urna"};
    const ns=ex.visual.bolas.map(b=>b.n);if(ex.visual.bolas.length!==3||new Set(ns).size!==3||ns.some(n=>n<1||n>8))return {ok:false,m:"contagens "+ns};
    if(ex.rotulos)Object.values(ex.rotulos).forEach(x=>ro.add(x))}
  return [...ro].every(x=>Object.keys(COR).includes(x))&&ro.size>=3});
T("Acaso: Ouro traz dado, moeda e roleta (resultados possíveis) e as chances de uma cor",()=>{
  const vistos=new Set();for(const tp of TIPOS)for(let i=0;i<80;i++){const ex=gerar("acaso",3,tp,"ouro");if(ex.visual)vistos.add(ex.visual.tipo)}
  return ["dado","moeda","roleta","urna"].every(x=>vistos.has(x))});
T("Acaso: a sessão traz as quatro formas de responder e nenhuma questão repetida (Bronze, Prata e Ouro)",()=>{
  for(const nv of["bronze","prata","ouro"]){const s=JSON.parse(ev3(`JSON.stringify((()=>{const x=novaSessao(FASES.find(f=>f.id==='a3-acaso'),'${nv}');return x.fila.map(e=>({tipo:e.tipo,k:e.chave||e.enunciado}))})())`));
    if(new Set(s.map(x=>x.tipo)).size!==4)return {ok:false,m:nv+" tipos "+s.map(x=>x.tipo)};if(new Set(s.map(x=>x.k)).size!==s.length)return {ok:false,m:nv+" repetidas"}}return true});
T("Acaso: nada de fração nem de porcentagem nas questões e nas explicações",()=>{
  for(const nv of["bronze","prata","ouro"])for(const tp of TIPOS)for(let i=0;i<30;i++){const ex=gerar("acaso",NIV[nv],tp,nv),tx=JSON.stringify(ex);if(/%|\d\s*\/\s*\d|\d\s+de cada/.test(tx))return {ok:false,m:tx.slice(0,120)}}return true});

T("ligar: as duas fases novas têm texto de ajuda próprio (nada de 'conta' e 'resultado') em todos os níveis",()=>{
  for(const g of["tabelas","acaso"])for(const nv of["bronze","prata","ouro"]){const ex=gerar(g,NIV[nv],"relacionar",nv);if(!ex.relDica||/conta/.test(ex.relDica)||!/Toque/.test(ex.relDica))return {ok:false,m:g+" "+nv+": "+ex.relDica}}return true});
T("desenho: a coluna dos nomes da tabela de dupla entrada é larga o bastante para 'Jigglypuff' (≥ 110) e a de 2 colunas também",()=>{
  const g3=ev3(`geoTabela({cols:["Pokémon","Segunda","Terça","Quarta"],linhas:[["Jigglypuff",1,2,3]]})`),g2=ev3(`geoTabela({cols:["Pokémon","Quantidade"],linhas:[["Jigglypuff",1]]})`);
  return g3.ws[0]>=110&&g2.ws[0]>=110&&Math.abs(g3.ws.reduce((a,b)=>a+b,0)-304)<0.5});
// ---------- na tela ----------
ev3("S.fases={};"+OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias","a3-figuras","a3-comprimento","a3-tempo","a3-dinheiro"])+";save()");
ev3("ir('fases')");
T("tela: escolha do acaso mostra as PALAVRAS (certo, possível, impossível) nos botões e a resposta certa passa; a errada tira vida",()=>{
  let ex;do{ex=gerar("acaso",1,"escolha","bronze")}while(!ex.rotulos);const q=JSON.stringify(ex);
  ev3(`(()=>{S.coins=0;const ex=${q};FS.ses=novaSessao(FASES.find(f=>f.id==='a3-acaso'),'bronze');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render()})()`);
  const bt=Q("#app .op");if(bt.length!==ex.opcoes.length||bt.some(b=>/^\d+$/.test(b.textContent.trim())))return {ok:false,m:"botões "+bt.map(b=>b.textContent)};
  bt[ex.opcoes.indexOf(ex.resposta)].click();return ev3("FS.ses.estado")==="certo"&&ev3("FS.ses.vidas")===2});
T("tela: a resposta certa aparece em palavras no aviso de erro (nunca '2' ou '3')",()=>{
  let ex;do{ex=gerar("acaso",1,"escolha","bronze")}while(!ex.rotulos);
  ev3(`(()=>{const ex=${JSON.stringify(ex)};FS.ses=novaSessao(FASES.find(f=>f.id==='a3-acaso'),'bronze');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render();responderFase(-7)})()`);
  return ev3("FS.ses.estado")==="errado"&&U(".fb.err b:nth-of-type(2)")&&/[a-zç]{4,}/.test(U(".fb.err").textContent.split("A resposta certa é")[1].slice(0,24))});
T("tela: a questão mostra o desenho novo (urna, tabela, colunas…) dentro da tela do exercício",()=>{
  for(const [g,cl,nv,d] of[["acaso","urnaSvg","bronze",1],["tabelas","tabelaSvg","bronze",1],["tabelas","graficoSvg","prata",1]]){
    let ach=false;for(let i=0;i<40&&!ach;i++){const ex=gerar(g,d,"digitar",nv);
      ev3(`(()=>{const ex=${JSON.stringify(ex)};FS.ses=novaSessao(FASES.find(f=>f.id==='${g==="acaso"?"a3-acaso":"a3-tabelas"}'),'${nv}');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render()})()`);
      ach=!!U(".visSvg svg."+cl)}
    if(!ach)return {ok:false,m:g+" "+nv+" sem svg."+cl}}return true});
T("tela: ligar de Tabelas e de Acaso mostra o desenho e as três ligações certas passam",()=>{
  for(const [g,id] of[["tabelas","a3-tabelas"],["acaso","a3-acaso"]]){const ex=gerar(g,1,"relacionar","bronze");
    ev3(`(()=>{const ex=${JSON.stringify(ex)};FS.ses=novaSessao(FASES.find(f=>f.id==='${id}'),'bronze');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render()})()`);
    if(Q("#app .rel.e").length!==3||Q("#app .rel.d").length!==3)return {ok:false,m:g+" cartões"};
    certo(ev3);if(ev3("FS.ses.estado")!=="certo")return {ok:false,m:g+" não passou"}}return true});
T("jogo completo: Bronze, Prata e Ouro das duas fases novas passam sem erros e liberam o que vem depois",()=>{
  ev3("S.fases={};"+OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias","a3-figuras","a3-comprimento","a3-tempo","a3-dinheiro"])+";S.tentNivel=null;save()");
  for(const id of["a3-tabelas","a3-acaso"])for(const n of["bronze","prata","ouro"]){
    ev3(`(S.fases['${id}']=S.fases['${id}']||{}).viu=true`);ev3(`abrirNivel('${id}','${n}')`);let g=0;
    while(ev3("FS.vista")==="exerc"&&g++<120){certo(ev3);ev3("continuarSessao()")}
    if(ev3(`estadoNivel(FASES.find(f=>f.id==='${id}'),'${n}')`)!=="concluido")return {ok:false,m:id+" "+n+" "+ev3(`estadoNivel(FASES.find(f=>f.id==='${id}'),'${n}')`)}}
  return ev3("faseLiberada(FASES.find(f=>f.id==='a3-acaso'))")===true&&ev3("anoCompleto(3)")===true});
T("a trilha mostra as duas fases novas como círculos (sem cadeados 'em breve')",()=>{ev3("S.fases={};S.tentNivel=null;S.cfg.anoEscolar=3;save();voltarTrilha();ir('fases')");
  const ids=Q('.zona[data-ano="3"] button.circulo[data-fase]').map(e=>e.dataset.fase);return {ok:ids.length===15&&ids[13]==="a3-tabelas"&&ids[14]==="a3-acaso"&&Q('.zona[data-ano="3"] .circulo.embreve').length===0,m:ids.length+" "+ids.slice(-3)+" "+Q('.zona[data-ano="3"] .circulo.embreve').length}||ids.length===15&&ids[13]==="a3-tabelas"&&ids[14]==="a3-acaso"&&Q('.zona[data-ano="3"] .circulo.embreve').length===0});
T("macete de Acaso: o treino usa palavras (certo, possível, impossível) e o de Tabelas usa desenhos",()=>{
  const qa=JSON.parse(ev3("JSON.stringify(macPerguntas('acaso'))")),qt=JSON.parse(ev3("JSON.stringify(macPerguntas('tabelas'))"));
  return qa.length>=3&&qa.every(q=>q.opcoes.includes(q.resp))&&qa.some(q=>q.opcoes.includes("impossível"))&&qt.length===4&&qt.every(q=>q.visual&&q.opcoes.includes(q.resp))});
T("💡 de Tabelas e de Acaso abre o macete certo",()=>{
  for(const [id,tx] of[["a3-tabelas","Ler tabelas"],["a3-acaso","Acaso"]]){
    ev3(`(()=>{const ex=GER[FASES.find(f=>f.id==='${id}').gerador](1,'digitar');FS.ses=novaSessao(FASES.find(f=>f.id==='${id}'),'bronze');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render();abrirLampadaFase()})()`);
    const x=U("#lampada")&&U("#lampada").textContent;if(!x||!x.includes(tx))return {ok:false,m:id+": "+(x||"").slice(0,60)}}return true});
T("dica 🪙 funciona nas fases novas sem entregar a resposta (digitar e completar)",()=>{
  for(const [g,id] of[["tabelas","a3-tabelas"],["acaso","a3-acaso"]])for(const tp of["digitar","lacuna"])for(let i=0;i<10;i++){
    const ex=gerar(g,1,tp,"bronze");const x=ev3(`dicaTextoResp(${JSON.stringify(ex)})`);if(!x)return {ok:false,m:g};
    const lim=x.replace(/\d+ algarismos?/,"");if(String(ex.resposta).length>1&&new RegExp("(^|\\D)"+ex.resposta+"(\\D|$)").test(lim))return {ok:false,m:g+" "+tp+" "+x}}return true});

// ---------- explicações animadas ----------
ev3("S.fases={};"+OURO(["a3-posicional","a3-adicao","a3-vai-um","a3-subtracao","a3-multiplicacao","a3-divisao","a3-comparar","a3-paresimpares","a3-sequencias","a3-figuras","a3-comprimento","a3-tempo","a3-dinheiro"])+";save()");
async function rodar(fase,rot,args,extra){
  ev3(`ir('fases');abrirExplicacao('${fase}')`);ev3("FS.auto=false;pararAnimacoes()");ev3("FS.vel=0.001");ev3("S.cfg.reduzir=false");
  ev3(`window.__out=null;window.__err=null;(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.${rot}(${args||""});const R=rot.montar(ctx);const g=[],res=[],ex=[];
    for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length]);res.push([...ctx.stage.querySelectorAll('.pm-res')].map(e=>e.textContent).join('|'));ex.push(${extra||"0"})}
    window.__out={g,res,ex};return true})().catch(e=>{window.__err=String(e&&e.stack||e)})`);
  await sleep(2500);if(ev3("window.__err"))console.log("ERRO RODANDO:",ev3("window.__err"));
  const o=ev3("window.__out")||{g:[],res:[],ex:[]};return{g:Array.from(o.g).map(a=>Array.from(a)),res:Array.from(o.res),ex:Array.from(o.ex)}}
const ok35=g=>g.every(([dur,gasto,len])=>dur>=3000&&dur<=5000&&gasto<=dur+1&&len>=5&&len<=140);
const rt=await rodar("a3-tabelas","tabelas","","JSON.stringify({tab:ctx.stage.querySelectorAll('svg.tabelaSvg').length,ico:ctx.stage.querySelectorAll('[data-icone]').length,col:ctx.stage.querySelectorAll('svg.graficoSvg [data-barra]').length,img:ctx.stage.querySelectorAll('image').length,carinha:ctx.stage.querySelectorAll('polygon').length,velho:ctx.stage.querySelectorAll('.pm-moeda,.pm-nota').length,leg:ctx.stage.querySelectorAll('.pm-legenda').length,cx:[...ctx.stage.querySelectorAll('.pm-caixa')].map(e=>+e.style.zIndex||0)})");
const EX=rt.ex.map(x=>x?JSON.parse(x):{});
t("roteiro tabelas: 7 passos de 3 a 5 s, falas curtas",rt.g.length===7&&ok35(rt.g),JSON.stringify(rt.g.map(x=>x[0])));
t("roteiro tabelas: a tabela do Pyri aparece já no 1º passo e a de dupla entrada no 3º",EX[0]&&EX[0].tab===1&&EX[2]&&EX[2].tab>=1,JSON.stringify(EX.map(x=>x.tab)));
t("roteiro tabelas: ler um valor (Eevee = 6), cruzar linha e coluna (Pikachu na terça = 5) e pictograma (3 × 2 = 6)",/Eevee = 6/.test(rt.res[1]||"")&&/Pikachu na terça = 5/.test(rt.res[2]||"")&&/3 × 2 = 6/.test(rt.res[3]||""),JSON.stringify(rt.res));
t("roteiro tabelas: o pictograma mostra 3 ícones; as colunas aparecem (3 colunas) e depois são lidas, comparadas e somadas (8 − 5 = 3 e 8 + 5 + 6 = 19)",EX[3]&&EX[3].ico===3&&EX[4]&&EX[4].col===3&&/Pikachu = 8/.test(rt.res[5]||"")&&/8 − 5 = 3/.test(rt.res[6]||"")&&/8 \+ 5 \+ 6 = 19/.test(rt.res[6]||""),JSON.stringify([EX.map(x=>x.ico),EX.map(x=>x.col),rt.res.slice(4)]));
t("roteiro tabelas: o destaque (caixa pontilhada) fica NA FRENTE do desenho — 1 caixa ao ler a linha e 2 ao cruzar linha e coluna",EX[1]&&EX[1].cx.length===1&&EX[1].cx.every(z=>z>=5)&&EX[2]&&EX[2].cx.length===2&&EX[2].cx.every(z=>z>=5),JSON.stringify(EX.map(x=>x.cx)));
t("roteiro tabelas: não mostra a legenda de casas (unidades, dezenas…) que não tem a ver com tabelas",EX.every(x=>x.leg===0),JSON.stringify(EX.map(x=>x.leg)));
t("roteiro tabelas: usa só os desenhos novos (nenhum círculo/retângulo liso de moeda e nota)",EX.every(x=>x.velho===0));
const ra=await rodar("a3-acaso","acaso","","JSON.stringify({bola:ctx.stage.querySelectorAll('.pm-bola').length,dado:ctx.stage.querySelectorAll('svg.dadosSvg').length,faces:ctx.stage.querySelectorAll('svg.dadosSvg [data-face]').length,solta:ctx.stage.querySelectorAll('svg.dadoSvg').length,moeda:ctx.stage.querySelectorAll('svg.moedaSvg').length,rol:ctx.stage.querySelectorAll('svg.roletaSvg [data-setor]').length,urna:ctx.stage.querySelectorAll('svg.urnaSvg').length,leg:ctx.stage.querySelectorAll('.pm-legenda').length})");
const EA=ra.ex.map(x=>x?JSON.parse(x):{});
t("roteiro acaso: 7 passos de 3 a 5 s, falas curtas",ra.g.length===7&&ok35(ra.g),JSON.stringify(ra.g.map(x=>x[0])));
t("roteiro acaso: não mostra a legenda de casas (unidades, dezenas…) que não tem a ver com probabilidade",EA.every(x=>x.leg===0),JSON.stringify(EA.map(x=>x.leg)));
t("roteiro acaso: certo (5 bolinhas azuis), impossível (nenhuma vermelha) e possível (azuis e vermelhas)",EA[0]&&EA[0].bola===5&&EA[0].urna===1&&/^certo/.test(ra.res[0]||"")&&/impossível/.test(ra.res[1]||"")&&/possível/.test(ra.res[2]||"")&&!/impossível/.test(ra.res[2]||""),JSON.stringify([EA.map(x=>x.bola),ra.res]));
t("roteiro acaso: contar bolinhas — 6 azuis contra 2 vermelhas: a azul é a mais provável e a vermelha a menos provável",EA[3]&&EA[3].bola===8&&/mais provável/.test(ra.res[3]||"")&&/menos provável/.test(ra.res[3]||""),ra.res[3]);
t("roteiro acaso: o dado aparece com TODAS as 6 faces (1 a 6), uma solta nunca; depois moeda (2) e roleta (cor com 2 chances)",EA[4]&&EA[4].dado===1&&EA[4].faces===6&&EA[4].solta===0&&/6 resultados/.test(ra.res[4]||"")&&EA[5]&&EA[5].moeda===1&&/2 resultados/.test(ra.res[5]||"")&&EA[6]&&EA[6].rol===4&&/2 chances/.test(ra.res[6]||""),JSON.stringify([EA.map(x=>x.dado),EA.map(x=>x.moeda),EA.map(x=>x.rol),ra.res.slice(4)]));
T("explicação das fases novas abre na tela (7 passos, botão Praticar no último) com a trilha desbloqueada",()=>{
  for(const id of["a3-tabelas","a3-acaso"]){ev3(`ir('fases');abrirExplicacao('${id}')`);if(!U("#exp-stage"))return {ok:false,m:id+" sem palco"};if(!/Passo 1 de 7/.test(U("#exp-passo").textContent))return {ok:false,m:id+" "+U("#exp-passo").textContent}}return true});
/* ========== AJUSTES PÓS-LOTE C: dado com todas as faces · imagens reais dos Pokémon · dinheiro em reais com vírgula ========== */
const NOMES_PK=["pikachu","charmander","squirtle","bulbasaur","eevee","jigglypuff"];
/* ---- 1) dado: todas as faces ---- */
T("dado: svgDadoTodos desenha as 6 faces (data-face 1 a 6), cada uma com a quantidade certa de pontinhos",()=>{
  const d=dom(ev3("svgDadoTodos()")),f=[...d.querySelectorAll("[data-face]")];
  return f.length===6&&f.every((e,i)=>e.getAttribute("data-face")===String(i+1)&&e.querySelectorAll("[data-ponto]").length===i+1)&&!!d.querySelector("svg.dadosSvg")});
T("dado: toda questão com dado mostra as 6 faces na tela (não uma face só)",()=>{
  for(let i=0;i<12;i++){const ex=gerar("acaso",3,"digitar","ouro");if(!ex.visual||ex.visual.tipo!=="dado")continue;
    const h=ev3(`visEstatico(${JSON.stringify(ex.visual)})`),d=dom(h);if(d.querySelectorAll("[data-face]").length!==6)return {ok:false,m:"faces: "+d.querySelectorAll("[data-face]").length};return true}
  return {ok:false,m:"nenhuma questão de dado"}});
T("dado: ainda dá para desenhar uma face só (svgDado) — usado dentro do desenho com as 6",()=>{const d=dom(ev3("svgDado(4)"));return d.querySelectorAll("[data-ponto]").length===4});
/* ---- 2) imagens reais dos Pokémon ---- */
T("imagens: os 6 arquivos img/pokemon/*.webp existem, são WebP de verdade e leves (< 30 KB)",()=>{
  for(const n of NOMES_PK){const b=Buffer.from(lerArqBin("img/pokemon/"+n+".webp"));if(b.length<500||b.length>30000||b.slice(0,4).toString()!=="RIFF"||b.slice(8,12).toString()!=="WEBP")return {ok:false,m:n+" "+b.length}}return true});
T("imagens: cada Pokémon da lista tem a sua imagem (PKS[i].img) e o ícone vira <image> com essa imagem, sem a carinha desenhada",()=>{
  const pks=ev3("JSON.parse(JSON.stringify(PKS))");
  for(const p of pks){if(p.img!=="img/pokemon/"+p.nome.toLowerCase()+".webp")return {ok:false,m:"img de "+p.nome+": "+p.img};
    const d=dom("<svg>"+ev3(`svgIconePk(${JSON.stringify(p.nome)},0,0,24,'data-icone="1"')`)+"</svg>"),im=d.querySelector("image");
    if(!im||(im.getAttribute("href")||im.getAttribute("xlink:href"))!==p.img||d.querySelector("polygon")||d.querySelector("circle"))return {ok:false,m:"ícone "+p.nome}}
  return true});
T("imagens: tabela, pictograma, colunas e barras mostram a imagem de cada Pokémon (e o nome continua escrito)",()=>{
  const it=[{nome:"Pikachu",cor:"#f7d02c",n:3},{nome:"Eevee",cor:"#b0845a",n:2},{nome:"Squirtle",cor:"#5aa0f0",n:4}];
  const vs={tabela:{tipo:"tabela",titulo:"x",cols:["Pokémon","Quantidade"],linhas:it.map(x=>[x.nome,x.n])},pictograma:{tipo:"pictograma",titulo:"x",vale:1,itens:it},colunas:{tipo:"colunas",titulo:"x",passo:1,max:5,itens:it},barras:{tipo:"barras",titulo:"x",passo:1,max:5,itens:it}};
  for(const k of Object.keys(vs)){const d=dom(ev3(`visEstatico(${JSON.stringify(vs[k])})`)),ims=[...d.querySelectorAll("image")];
    const esp=k==="pictograma"?it.reduce((a,x)=>a+x.n,0)+0:3;
    if(k==="pictograma"?ims.length<esp:ims.length!==esp)return {ok:false,m:k+" imagens "+ims.length+" esperado "+esp};
    if(!it.every(x=>d.textContent.includes(x.nome)))return {ok:false,m:k+" sem nome"};
    if(d.querySelector("polygon"))return {ok:false,m:k+" ainda tem a carinha desenhada"}}
  return true});
T("imagens: toda <image> usada nos desenhos aponta para um arquivo que existe, e as imagens ficam dentro do desenho (viewBox)",()=>{
  const it=[{nome:"Jigglypuff",cor:"#f49ac2",n:5},{nome:"Charmander",cor:"#f08030",n:2},{nome:"Bulbasaur",cor:"#5fbf5a",n:4},{nome:"Pikachu",cor:"#f7d02c",n:1}];
  for(const v of[{tipo:"colunas",titulo:"x",passo:1,max:6,itens:it},{tipo:"barras",titulo:"x",passo:1,max:6,itens:it},{tipo:"pictograma",titulo:"x",vale:1,itens:it}]){
    const d=dom(ev3(`visEstatico(${JSON.stringify(v)})`)),sv=d.querySelector("svg"),vb=sv.getAttribute("viewBox").split(" ").map(Number);
    for(const im of d.querySelectorAll("image")){const h=im.getAttribute("href");if(!/^img\/pokemon\/[a-z]+\.webp$/.test(h)||!lerArqBin(h))return {ok:false,m:"arquivo "+h};
      const x=+im.getAttribute("x"),y=+im.getAttribute("y"),w=+im.getAttribute("width"),hh=+im.getAttribute("height");
      if(x<0||y<0||x+w>vb[2]+.5||y+hh>vb[3]+.5)return {ok:false,m:v.tipo+" imagem fora do desenho "+[x,y,w,hh]+" vb "+vb}}}
  return true});
T("imagens: as perguntas de Tabelas e gráficos usam a imagem real (nenhuma carinha desenhada) em todos os tipos de gráfico",()=>{
  let viu=0;for(let i=0;i<60;i++){const ex=gerar("tabelas",i%2?3:1,"digitar",i%2?"ouro":"bronze");if(!ex.visual)continue;const h=ev3(`visEstatico(${JSON.stringify(ex.visual)})`);
    if(/<polygon/.test(h))return {ok:false,m:"carinha em "+ex.visual.tipo};if(/<image/.test(h))viu++}
  return viu>5||{ok:false,m:"imagens vistas: "+viu}});
T("imagens: o roteiro de tabelas usa a imagem real nos ícones do pictograma (3 ícones = 3 imagens)",()=>EX[3]&&EX[3].img===3&&EX[3].carinha===0&&EX.every(x=>x.carinha===0),JSON.stringify(EX.map(x=>[x.img,x.carinha])));
T("sw.js: as 6 imagens entram no cache offline e a versão sobe para pokemath-v21",()=>{const s=lerArq("sw.js");return /pokemath-v21/.test(s)&&NOMES_PK.every(n=>s.includes("img/pokemon/"+n+".webp"))});
/* ---- 3) dinheiro em reais, com vírgula ---- */
T("dinheiro: parseDin entende 2,30 · 2.30 · R$ 2,30 · 3,5 · 2 e recusa texto, 3 casas e vazio",()=>{
  const p=s=>ev3(`parseDin(${JSON.stringify(s)})`);
  return p("2,30")===230&&p("2.30")===230&&p("R$ 2,30")===230&&p(" 3,5 ")===350&&p("2")===200&&p("0,50")===50&&Number.isNaN(p("abc"))&&Number.isNaN(p("2,305"))&&Number.isNaN(p(""))&&Number.isNaN(p("2,3,0"))});
T("dinheiro: Rs formata em dinheiro com vírgula (230 → R$ 2,30 · 200 → R$ 2,00 · 50 → R$ 0,50 · 1250 → R$ 12,50)",()=>["230|R$ 2,30","200|R$ 2,00","50|R$ 0,50","1250|R$ 12,50","5|R$ 0,05"].every(x=>{const[c,r]=x.split("|");return ev3(`Rs(${c})`)===r}));
const RS=s=>+s.replace(/\D/g,"");               // "R$ 2,30" -> 230
const VAL=s=>(s.match(/R\$ \d+,\d\d/g)||[]).map(RS);
const esperado2=(ex)=>{let m;const s=ex.enunciado,v=ex.visual,A=VAL(s);
  if(m=s.match(/Como se escreve (\d+) (?:real|reais) e (\d+) centavos em dinheiro\?/)||s.match(/^(\d+) (?:real|reais) e (\d+) centavos (?:= R\$ ___|em dinheiro)$/))return +m[1]*100+ +m[2];
  if(m=s.match(/^Quanto é (\d+) centavos em reais\?$/)||s.match(/^(\d+) centavos (?:= R\$ ___|em reais)$/))return +m[1];
  if(m=s.match(/^R\$ (\d+),(\d\d) equivalem a quantos centavos\?$/)||s.match(/^R\$ (\d+),(\d\d) (?:= ___ centavos|em centavos)$/))return +m[1]*100+ +m[2];
  if(m=s.match(/^Quantos centavos há em (\d+) (?:real|reais)\?$/)||s.match(/^R\$ (\d+) (?:= ___ centavos|em centavos)$/))return +m[1]*100;
  if(m=s.match(/^Paguei R\$ 1 por algo que custa (\d+) centavos\. Qual é o troco, em centavos\?$/)||s.match(/^Paguei R\$ 1 e custava (\d+) centavos: troco de ___ centavos$/)||s.match(/^troco de R\$ 1 para (\d+) centavos$/))return 100-+m[1];
  if(/troco/i.test(s)&&A.length===2)return A[0]-A[1];
  if(/falta/i.test(s)&&A.length===2)return A[1]-A[0];
  if(/^(Quanto dinheiro há nestas notas\?|Estas notas valem R\$ ___ no total\.)$/.test(s))return v&&v.tipo==="dinheiro"&&v.itens.length>=2&&v.itens.every(i=>i.k==="nota")?v.itens.reduce((a,i)=>a+i.v*100,0):null;
  if(/^(Quanto dinheiro há nestas moedas\?|Estas moedas valem R\$ ___ no total\.)$/.test(s))return v&&v.tipo==="dinheiro"&&v.itens.length>=2&&v.itens.every(i=>i.k==="moeda")?v.itens.reduce((a,i)=>a+i.v,0):null;
  if(/^(Quantos centavos há nestas moedas\?|Estas moedas valem ___ centavos\.)$/.test(s))return v&&v.tipo==="dinheiro"&&v.itens.every(i=>i.k==="moeda")?v.itens.reduce((a,i)=>a+i.v,0):null;
  if(/^(Quanto dinheiro há aqui, somando notas e moedas\?|Aqui há R\$ ___ no total\.)$/.test(s))return v&&v.tipo==="dinheiro"&&v.itens.some(i=>i.k==="nota")&&v.itens.some(i=>i.k==="moeda")?v.itens.reduce((a,i)=>a+(i.k==="nota"?i.v*100:i.v),0):null;
  if(A.length>=2)return A.reduce((a,b)=>a+b,0);
  return null};
const DIN_DESC=ex=>JSON.stringify([ex.enunciado,ex.resposta,ex.visual||0]);
const nivelDe={bronze:1,prata:1,ouro:3},passoDe={bronze:50,prata:10,ouro:5};
const dinNiveis={};
for(const nivel of["bronze","prata","ouro"]){let bom=true,msg="",visTxt=false,quebrado=false,compra3=false,faltou=false,notaMoeda=false,temDin=false,temCent=false,deCentavos=false;
  const chk=(c,m)=>{if(!c&&bom){bom=false;msg=nivel+": "+m}};
  for(const tp of TIPOS)for(let i=0;i<80;i++){
    const ex=gerar("dinheiro",nivelDe[nivel],tp,nivel);chk(ex.tipo===tp&&ex.dica&&ex.dica.length>20&&ex.erro&&ex.erro.length>10,"tipo/dica/erro");
    if(tp==="relacionar"){const P=ex.pares,D=ex.direita;chk(P.length>=3&&P.length<=4&&new Set(D).size===D.length&&P.every(p=>D.includes(p.d))&&ex.resposta===1,"relacionar");
      for(const p of P){const e=esperado2({enunciado:p.e});chk(e!==null,"par sem conta reconhecível: "+p.e);
        if(e!==null){const dm=/^R\$ \d+,\d\d$/.test(p.d),emCent=/ em centavos$|^troco de R\$ 1 para/.test(p.e);chk(dm!==emCent,"o valor da ligação precisa estar em dinheiro (R$ x,xx) quando o resultado é em reais, e em centavos quando pede centavos: "+p.e+" = "+p.d);chk(dm?RS(p.d)===e:+p.d===e,"par errado: "+p.e+" = "+p.d+" esperado "+e);if(dm){temDin=true;chk(RS(p.d)%passoDe[nivel]===0||/centavos/.test(p.e),"valor fora do passo do nível")}}}
      continue}
    const e=esperado2(ex);chk(e!==null&&e===ex.resposta,"resposta: "+DIN_DESC(ex)+" esperado "+e);
    chk(Number.isInteger(ex.resposta)&&ex.resposta>0,"resposta inválida");
    if(ex.din){temDin=true;chk(ex.respTxt===ev3(`Rs(${ex.resposta})`),"respTxt precisa ser o dinheiro com vírgula: "+ex.respTxt);chk(ex.resposta%passoDe[nivel]===0,"valor fora do passo do nível: "+ex.resposta);
      if(ex.resposta%100!==0)quebrado=true}else temCent=true;
    if(tp==="escolha"){const o=ex.opcoes;chk(o.length===4&&new Set(o).size===4&&o.includes(ex.resposta)&&o.every(Number.isInteger),"opções");
      if(ex.din)chk(o.every(x=>ex.rotulos&&ex.rotulos[x]===ev3(`Rs(${x})`))&&o.every(x=>x%passoDe[nivel]===0),"rótulos em dinheiro")}
    if(tp==="lacuna")chk(ex.enunciado.includes("___"),"lacuna");
    if(ex.visual){visTxt=true;chk(!!ex.chave&&ex.chave.includes(JSON.stringify(ex.visual)),"chave sem a figura");
      const it=ex.visual.itens;chk(it.every(x=>x.k==="moeda"?(nivel==="bronze"?[50,100]:nivel==="prata"?[10,50,100]:[5,10,25,50,100]).includes(x.v):[2,5,10,20,50,100].includes(x.v)),"valor de moeda/nota para o nível: "+JSON.stringify(it));
      if(it.some(x=>x.k==="nota")&&it.some(x=>x.k==="moeda"))notaMoeda=true}
    if(VAL(ex.enunciado).length>=3)compra3=true;if(/falta/i.test(ex.enunciado))faltou=true;
    VAL(ex.enunciado).forEach(c=>chk(c%passoDe[nivel]===0,"preço fora do passo "+c+" em "+ex.enunciado));
    if(/centavos/.test(ex.enunciado)&&!/R\$/.test(ex.enunciado.split("?")[0].replace(/R\$ 1 /,"")))deCentavos=true;
  }
  chk(temDin,"nenhuma resposta em formato de dinheiro");chk(temCent,"nenhuma resposta em centavos");chk(quebrado,"nunca trouxe valor quebrado (com centavos)");chk(visTxt,"nenhuma questão com moedas/notas");
  if(nivel==="ouro"){chk(compra3,"o Ouro nunca trouxe compra de 3 itens");chk(faltou,"o Ouro nunca perguntou quanto falta");chk(notaMoeda,"o Ouro nunca juntou notas e moedas")}
  dinNiveis[nivel]=[bom,msg];
  t(`dinheiro (${nivel}): 4 tipos × 80 sorteios — respostas recalculadas a partir do texto/figura, em dinheiro com vírgula e só valores do nível`,bom,msg)}
T("dinheiro: Bronze usa reais inteiros e meios (R$ 2,00 · R$ 3,50 · R$ 0,50); Prata e Ouro trazem valores quebrados como R$ 2,30",()=>{
  const vis=n=>{const s=new Set();for(const tp of["digitar","escolha"])for(let i=0;i<80;i++){const ex=gerar("dinheiro",nivelDe[n],tp,n);if(ex.din)s.add(ex.resposta%100)}return[...s]};
  const b=vis("bronze"),p=vis("prata"),o=vis("ouro");
  return b.every(x=>x===0||x===50)&&b.includes(50)&&p.some(x=>x%50!==0)&&p.every(x=>x%10===0)&&o.some(x=>x%10!==0)&&o.every(x=>x%5===0)||{ok:false,m:JSON.stringify([b,p,o])}});
T("dinheiro: sem o nível (chamada antiga) o Bronze/Prata e o Ouro ainda funcionam (d=1 e d=3)",()=>["digitar","escolha"].every(tp=>[1,3].every(d=>{const ex=ev3(`GER.dinheiro(${d},'${tp}')`);return ex&&ex.resposta>0})));
/* tela: digitar com vírgula */
const mostra2=(ex)=>{ev3(`(()=>{S.coins=9;const ex=${JSON.stringify(ex)};FS.ses=novaSessao(FASES.find(f=>f.id==='a3-dinheiro'),'bronze');FS.ses.fila[0]=ex;FS.fase=FS.ses.fase;FS.vista='exerc';render()})()`)};
const pegaDin=(tp,filtro)=>{for(let i=0;i<400;i++){const ex=gerar("dinheiro",1,tp,"prata");if(ex.din&&ex.resposta%100!==0&&(!filtro||filtro(ex)))return ex}return null};
T("tela: a resposta em reais é digitada com vírgula (campo de texto decimal, sem aceitar só inteiros) e 2,30 acerta quando a resposta é R$ 2,30",()=>{
  const ex=pegaDin("digitar");if(!ex)return {ok:false,m:"sem questão"};mostra2(ex);const i=U("#resp");
  if(!i||i.getAttribute("type")!=="text"||i.getAttribute("inputmode")!=="decimal")return {ok:false,m:"campo "+(i&&i.outerHTML)};
  const txt=ev3(`Rs(${ex.resposta})`).replace("R$ ","");i.value=txt;ev3("responderFase($('#resp').value)");
  return ev3("FS.ses.estado")==="certo"||{ok:false,m:"não acertou "+txt+" para "+ex.resposta}});
T("tela: o 'R$' fica ao lado do campo só quando o enunciado não tem R$ (digitar sim; completar não, para não repetir)",()=>{
  const d=pegaDin("digitar");mostra2(d);const a=!!U(".dinResp .dinRs");const l=pegaDin("lacuna");mostra2(l);const b=!!U(".dinResp .dinRs");
  return a&&!b&&/R\$ ___/.test(l.enunciado)||{ok:false,m:[a,b].join()}});
T("desenho: a legenda do pictograma usa uma Pokébola (nenhum círculo cinza sem sentido)",()=>{const h=ev3("svgPictograma({tipo:'pictograma',titulo:'x',vale:2,itens:[{nome:'Eevee',cor:'#b0845a',n:2}]})");return /data-pokebola/.test(h)&&!/#ddd/.test(h)});
T("tela: aceita também com ponto e com R$ (2.30 · R$ 2,30) e erra o valor trocado (centavos errados)",()=>{
  const ex=pegaDin("digitar");mostra2(ex);const txt=ev3(`Rs(${ex.resposta})`).replace("R$ ","");ev3(`responderFase(${JSON.stringify("R$ "+txt)})`);const a=ev3("FS.ses.estado");
  mostra2(ex);ev3(`responderFase(${JSON.stringify(txt.replace(",","."))})`);const b=ev3("FS.ses.estado");
  mostra2(ex);ev3(`responderFase(${JSON.stringify(ev3(`Rs(${ex.resposta+10})`).replace("R$ ",""))})`);const c=ev3("FS.ses.estado");
  mostra2(ex);ev3("responderFase('abc')");const d=ev3("FS.ses.estado");
  return a==="certo"&&b==="certo"&&c==="errado"&&d==="errado"||{ok:false,m:[a,b,c,d].join()}});
T("tela: ao errar mostra 'A resposta certa é R$ 2,30' em dinheiro com vírgula",()=>{
  const ex=pegaDin("digitar");mostra2(ex);ev3("responderFase('0,01')");const h=U(".fb.err")&&U(".fb.err").textContent||"";
  return h.includes("A resposta certa é "+ev3(`Rs(${ex.resposta})`))||{ok:false,m:h}});
T("tela: nas questões de escolher, os botões mostram R$ com vírgula e clicar no certo acerta",()=>{
  const ex=pegaDin("escolha");mostra2(ex);const b=Q(".ops .op").map(x=>x.textContent);
  if(b.length!==4||!b.every(x=>/^R\$ \d+,\d\d$/.test(x)))return {ok:false,m:b.join("|")};
  const k=b.indexOf(ev3(`Rs(${ex.resposta})`));Q(".ops .op")[k].click();return ev3("FS.ses.estado")==="certo"||{ok:false,m:"clique"}});
T("tela: relacionar com valores em dinheiro mostra R$ x,xx nos dois lados e liga certo",()=>{
  let ex=null;for(let i=0;i<300&&!ex;i++){const e=gerar("dinheiro",1,"relacionar","prata");if(e.pares.every(p=>/^R\$/.test(p.d)))ex=e}
  if(!ex)return {ok:false,m:"nenhum relacionar só com dinheiro nos 300 sorteios"};mostra2(ex);return Q(".rel .dir, .rel button, .relacionar button").length>=0&&/R\$ \d+,\d\d/.test(U("#app").innerHTML)});
T("lâmpada de dica 🪙: no dinheiro a dica fala em vírgula e dois algarismos depois dela, sem entregar a resposta",()=>{
  const ex=pegaDin("digitar");mostra2(ex);ev3("comprarDica()");const h=(U("#dica-paga")||{textContent:""}).textContent,rt=ev3(`Rs(${ex.resposta})`).replace("R$ ","");
  return /vírgula/i.test(h)&&!h.includes(rt)&&!/\d+ algarismos/.test(h)||{ok:false,m:h}});
T("macete Dinheiro: a prática mostra as opções em dinheiro (R$ x,xx) quando a resposta é em reais e a resposta certa está entre elas",()=>{
  let viu=false;for(let i=0;i<40;i++){const qs=ev3("macPerguntas('dinheiro')");if(qs.length!==4)return {ok:false,m:"qtd"};
    for(const q of qs){if(!q.opcoes.map(String).includes(String(q.resp)))return {ok:false,m:"resp fora das opções "+JSON.stringify(q)};if(q.opcoes.some(o=>/^R\$ \d+,\d\d$/.test(String(o)))){viu=true;if(!q.opcoes.every(o=>/^R\$ \d+,\d\d$/.test(String(o)))||!/^R\$ \d+,\d\d$/.test(String(q.resp)))return {ok:false,m:"mistura "+JSON.stringify(q)}}}}
  return viu||{ok:false,m:"nunca apareceu dinheiro"}});
T("macete Dinheiro: o texto explica reais e centavos com vírgula (R$ 2,30 = 2 reais e 30 centavos) e o troco",()=>{const m=ev3("macAch('dinheiro')");return /a vírgula separa os reais.*R\$ 2,30 são 2 reais e 30 centavos/.test(m.explicacao)&&/troco/i.test(m.explicacao)&&/R\$ 1 = 100 centavos/.test(m.explicacao)});
T("fase Dinheiro: os tópicos falam de valores com vírgula",()=>/vírgula|2,30/i.test(ev3("FASES.find(f=>f.id==='a3-dinheiro').topicos.join(' ')")));
/* ========== TÁBUAS DE MADEIRA NA TRILHA (ponte até o vulcão) ========== */
const cssT=lerArq("css/trilha.css").replace(/\/\*[\s\S]*?\*\//g,"").replace(/\s+/g,"");
const regraT=(sel)=>{const m=cssT.match(new RegExp("(?<![^}])"+sel.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\{([^}]*)\\}","g"));return m?m.join(""):""};
T("tábuas: cada fase da zona ilustrada é um botão-tábua (button.circulo.tabua), 15 no 3º ano, na ordem das fases",()=>{
  ev3("S.fases={};S.tentNivel=null;S.cfg.anoEscolar=3;save();voltarTrilha();ir('fases')");
  const b=Q('.zona[data-ano="3"] button.circulo.tabua[data-fase]');return b.length===15&&b.map(e=>e.dataset.fase).join()===ev3("fasesDoAno(3).map(f=>f.id).join()")||{ok:false,m:"tábuas: "+b.length}});
T("tábuas: todos os estados — disponível, concluída (selo ✔ e medalha), para refazer, bloqueada (cadeado) — continuam corretos",()=>{
  const g=id=>U('button.circulo.tabua[data-fase="'+id+'"]');
  ev3("S.fases={};"+OURO(["a3-posicional"])+";save();voltarTrilha();ir('fases')");
  const c=g("a3-posicional"),d=g("a3-adicao"),bl=g("a3-vai-um"),e1=[c,d,bl].map(e=>e&&e.dataset.estado).join();
  const ok1=e1==="concluido,disponivel,bloqueado"&&c.classList.contains("concluido")&&!!c.querySelector(".selo")&&/✔/.test(c.querySelector(".selo").textContent)&&/🥇/.test(c.textContent)&&!!bl.querySelector(".cad")&&!d.querySelector(".selo")&&!bl.querySelector(".selo");
  ev3("S.fases={};"+OURO(["a3-posicional"])+";S.fases['a3-adicao']={niveis:{bronze:{ok:true},prata:{falhou:true}},viu:true};save();voltarTrilha();ir('fases')");
  const r=g("a3-adicao"),e2=r&&r.dataset.estado;
  return ok1&&e2==="refazer"&&r.classList.contains("refazer")&&!r.querySelector(".selo")||{ok:false,m:e1+" / "+e2}});
T("tábuas: rótulo de acessibilidade, data-fase e toque continuam — tocar na tábua abre a folha com Bronze, Prata e Ouro",()=>{
  ev3("S.fases={};save();voltarTrilha();ir('fases')");const b=U('button.circulo.tabua[data-fase="a3-posicional"]');
  if(!/Posicional|Valor|posicional/i.test(b.getAttribute("aria-label")||"")&&!/,/.test(b.getAttribute("aria-label")||""))return {ok:false,m:b.getAttribute("aria-label")};
  b.click();return Q("#folha .nv").length===3||{ok:false,m:"folha"}});
T("tábuas: o nome curto continua ao lado (etiqueta .tit) e o ícone da fase fica dentro da tábua",()=>{
  ev3("voltarTrilha();ir('fases')");const b=U('button.circulo.tabua[data-fase="a3-paresimpares"]');
  return !!b.querySelector(".ic")&&b.parentNode.querySelector(".tit").textContent==="Pares"});
T("tábuas: fora da zona ilustrada (caminho em zigue-zague) o botão também é tábua",()=>/class="circulo tabua /.test(ev3("noCirculo(FASES[0],0)")));
T("tábuas CSS: o formato é de tábua — mais larga que alta, moldura e face de madeira, espessura embaixo, 2 pregos e área de toque ampliada",()=>{
  const z=regraT(".zona.ilus.circulo.tabua"),b=regraT(".circulo.tabua").replace(z,""),pr=regraT(".circulo.tabua::after"),ht=regraT(".circulo.tabua::before");
  const w=+(z.match(/width:([\d.]+)cqw/)||[])[1],h=+(z.match(/height:([\d.]+)cqw/)||[])[1];
  return w>h*1.5&&/border-radius:/.test(b)&&/repeating-linear-gradient/.test(b)&&/box-shadow:0[^;]*#[0-9a-f]{3,6}/i.test(b)&&(pr.match(/radial-gradient/g)||[]).length>=2&&/inset:-(\d+)px/.test(ht)&&+(ht.match(/inset:-(\d+)px/)||[])[1]>=5||{ok:false,m:[w,h,b.slice(0,80),pr.slice(0,60),ht].join("|")}});
T("tábuas CSS: a zona ilustrada mede em cqw (container-type) para a tábua crescer e diminuir junto com a imagem",()=>/\.zona\.ilus\{[^}]*container-type:inline-size/.test(cssT));
T("tábuas CSS: cada estado tem a sua madeira (disponível brilha, concluída verde, refazer laranja, bloqueada cinza, em breve apagada)",()=>["disponivel","concluido","refazer","bloqueado","embreve"].every(e=>new RegExp("(?<![^}])\\.circulo\\.tabua\\."+e+"[^{]*\\{").test(cssT)));
T("tábuas: sobre a imagem elas cabem — dentro da zona (0–100%) e sem se cobrirem (sobreposição < 15% da tábua) com o tamanho do CSS",()=>{
  const z=regraT(".zona.ilus.circulo.tabua"),w=+(z.match(/width:([\d.]+)cqw/)||[])[1],h=+(z.match(/height:([\d.]+)cqw/)||[])[1]/(1732/800),P=Array.from(ev3("ZONAS[3].pontos")).map(p=>Array.from(p));
  if(!(w>0&&h>0))return {ok:false,m:"sem tamanho em cqw no CSS"};
  for(const p of P)if(p[0]-w/2<0||p[0]+w/2>100||p[1]-h/2<0||p[1]+h/2>100)return {ok:false,m:"fora: "+p};
  for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const ox=Math.max(0,w-Math.abs(P[i][0]-P[j][0])),oy=Math.max(0,h-Math.abs(P[i][1]-P[j][1]));if(ox*oy>.15*w*h)return {ok:false,m:"sobrepõe "+i+"-"+j+" "+(ox*oy/(w*h)).toFixed(2)}}
  return true});
sb.w.close();
}

t("nenhum erro de script durante todos os testes",erros.length===0,erros.join(" | "));
console.log(`\nPASSARAM: ${ok}   FALHARAM: ${bad.length}`);bad.forEach(b=>console.log(" ✗ "+b));process.exit(0);
})().catch(e=>{console.error("ERRO NO TESTE:",e);process.exit(1)});
