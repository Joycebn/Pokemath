const {JSDOM,VirtualConsole}=require("jsdom"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const DIR=process.env.PM_DIR||path.join(__dirname,".."),HTML=require("./montar.js")(DIR),KEY="tabuada-pokemon-v1";
const T0=Date.UTC(2026,10,9,15,0,0),DIA=864e5;let now=T0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const erros=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>{if(!/Not implemented/.test(e.message))erros.push(e.message.slice(0,140))});vc.on("error",e=>erros.push(String(e).slice(0,140)));
const lerArq=f=>fs.readFileSync(path.join(DIR,f),"utf8");
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
  if(ex.tipo==="relacionar"){ev("(()=>{const ex=FS.ses.fila[0];ex.pares.forEach((p,i)=>{ligarEsq(i);ligarDir(ex.direita.indexOf(p.d))});verificarLig()})()");return}
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
t("a imagem do Pyri é própria e a dos outros Pokémon continua da PokéAPI",ev("IMG(PYRI_ID)").startsWith("data:image/svg")&&ev("IMG(25)").includes("official-artwork/25.png"));
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
ev("abrirNivel('a3-posicional','prata')");t("Prata: 8 questões, sem dica e começa de novo com 2 vidas",ev("FS.ses.total")===8&&ev("FS.ses.vidas")===2&&!ev("FS.ses.dica")&&!ev("document.getElementById('app').innerHTML").includes("💡"));ev("voltarTrilha()");
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
for(const f of ev("FASES.map(f=>f.id)"))for(const n of["bronze","prata","ouro"]){const ses=ev(`novaSessao(FASES.find(f=>f.id==='${f}'),'${n}')`),tp=Array.from(ses.fila).map(x=>x.tipo);
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
try{t("trilha: o 3º ano mostra um CÍRCULO por fase, na ordem das fases",Q('.zona[data-ano="3"] button.circulo[data-fase]').map(e=>e.dataset.fase).join()===IDS.join()&&IDS.length===6,Q('.zona[data-ano="3"] button.circulo[data-fase]').length);}catch(e){t("trilha: o 3º ano mostra um CÍRCULO por fase, na ordem das fases  [erro: "+String(e.message).slice(0,60)+"]",false)}
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
try{t("portal: com as 6 fases prontas feitas, mas ainda com fases 'em breve' no 3º ano, o portal NÃO está completo",U('.zona[data-ano="3"] .portal').dataset.completo==="0")}catch(e){t("portal em breve  [erro]",false)}
try{zv("EM_BREVE[3]=[];ir('fases')")}catch(e){}
try{t("portal: com todas as fases do ano concluídas marca o portal como completo (✅); a entrega do lendário fica para a Etapa 7",U('.zona[data-ano="3"] .portal').dataset.completo==="1"&&/✅/.test(U('.zona[data-ano="3"] .portal').textContent)&&U('.zona[data-ano="4"] .portal').dataset.completo==="0");}catch(e){t("portal: com todas as fases do ano concluídas marca o portal como completo (✅); a entrega do lendário fica para a Etapa 7  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* acessibilidade e movimento */
zerar();
try{t("círculos: cada um é um botão com rótulo (título + situação) e alvo de toque de pelo menos 56px",Q("button.circulo[data-fase]").every(b=>/,/.test(b.getAttribute("aria-label")||"")&&b.getAttribute("aria-label").includes(zv(`FASES.find(f=>f.id==='${b.dataset.fase}').titulo`)))&&/\.circulo\{[^}]*(width|min-width):(5[6-9]|[6-9]\d)px/.test(lerArq("css/trilha.css").replace(/\s+/g,"")));}catch(e){t("círculos: cada um é um botão com rótulo (título + situação) e alvo de toque de pelo menos 56px  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("movimento: 'reduzir movimento' e prefers-reduced-motion desligam as animações da trilha",/body\.reduzir[^{]*\{[^}]*animation:none/.test(lerArq("css/trilha.css").replace(/\s+/g,""))&&/prefers-reduced-motion/.test(lerArq("css/trilha.css")));}catch(e){t("movimento: 'reduzir movimento' e prefers-reduced-motion desligam as animações da trilha  [erro: "+String(e.message).slice(0,60)+"]",false)}
/* arquivos */
try{t("index.html liga zonas.js, trilha_visual.js e css/trilha.css (zonas antes do visual, ambos antes do jogo)",/css\/trilha\.css/.test(lerArq("index.html"))&&lerArq("index.html").indexOf("js/conteudo/zonas.js")>0&&lerArq("index.html").indexOf("js/conteudo/zonas.js")<lerArq("index.html").indexOf("js/ui/trilha_visual.js")&&lerArq("index.html").indexOf("js/ui/trilha_visual.js")<lerArq("index.html").indexOf("js/legado/jogo.js"));}catch(e){t("index.html liga zonas.js, trilha_visual.js e css/trilha.css (zonas antes do visual, ambos antes do jogo)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("sw.js: pokemath-v12 e os 3 arquivos novos na lista",/const V="pokemath-v12"/.test(lerArq("sw.js"))&&["css/trilha.css","js/conteudo/zonas.js","js/ui/trilha_visual.js"].every(a=>lerArq("sw.js").includes('"'+a+'"')));}catch(e){t("sw.js: pokemath-v10 e os 3 arquivos novos na lista  [erro: "+String(e.message).slice(0,60)+"]",false)}
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
try{t("pontos: há pelo menos 14 (6 fases + 8 'em breve'), todos dentro da imagem (3% a 97%)",P.length>=14&&P.every(p=>p[0]>=3&&p[0]<=97&&p[1]>=3&&p[1]<=97),P.length);}catch(e){t("pontos: há pelo menos 14 (6 fases + 8 'em breve'), todos dentro da imagem (3% a 97%)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("pontos: nenhum par de círculos se encosta (distância mínima de 50px numa tela de 360px de largura)",P.length>=14&&P.every((a,i)=>P.every((b,j)=>j<=i||Math.hypot((a[0]-b[0])*W/100,(a[1]-b[1])*H/100)>=50)));}catch(e){t("pontos: nenhum par de círculos se encosta (distância mínima de 50px numa tela de 360px de largura)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("pontos: a trilha SOBE — o primeiro ponto é o mais baixo da imagem e o último o mais alto",P.length>=14&&P[0][1]===Math.max(...P.map(p=>p[1]))&&P[13][1]<=Math.min(...P.slice(0,13).map(p=>p[1]))+12);}catch(e){t("pontos: a trilha SOBE — o primeiro ponto é o mais baixo da imagem e o último o mais alto  [erro: "+String(e.message).slice(0,60)+"]",false)}
const zi=U('.zona[data-ano="3"]');
try{t("zona do 3º ano é ilustrada: tem a classe 'ilus' e usa a imagem como fundo",!!zi&&zi.classList.contains("ilus")&&/ano3\.webp/.test(zi.getAttribute("style")||""),zi&&zi.getAttribute("style"));}catch(e){t("zona do 3º ano é ilustrada: tem a classe 'ilus' e usa a imagem como fundo  [erro: "+String(e.message).slice(0,60)+"]",false)}
const nos=Q('.zona[data-ano="3"].ilus li.no');
try{t("zona ilustrada: as 14 posições (6 fases + 8 em breve) estão sobre a imagem, cada uma no seu ponto (left/top em %)",nos.length===14&&nos.every((n,i)=>P[i]&&n.style.left===P[i][0]+"%"&&n.style.top===P[i][1]+"%"),nos.map(n=>n.style.left+","+n.style.top).slice(0,2).join(" | "));}catch(e){t("zona ilustrada: as 14 posições (6 fases + 8 em breve) estão sobre a imagem, cada uma no seu ponto (left/top em %)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("zona ilustrada: a 1ª fase fica EMBAIXO (ponto mais baixo) e a 6ª mais acima",nos.length===14&&parseFloat(nos[0].style.top)>parseFloat(nos[5].style.top)&&nos[0].querySelector('button.circulo[data-fase]')&&nos[0].querySelector("button").dataset.fase===zv("fasesDoAno(3)[0].id"));}catch(e){t("zona ilustrada: a 1ª fase fica EMBAIXO (ponto mais baixo) e a 6ª mais acima  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("zona ilustrada: cada fase tem seu nome numa etiqueta escura (.tit) ao lado do círculo",nos.length===14&&nos.slice(0,6).every(n=>!!n.querySelector(".tit"))&&nos.every((n,i)=>n.classList.contains(P[i][0]>50?"esq":"dir")));}catch(e){t("zona ilustrada: cada nome fica numa etiqueta escura (.tit) do lado de fora da trilha  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("zona ilustrada: os 8 'em breve' são só cadeados (sem etiqueta, para não cobrir a trilha) e continuam com o nome no rótulo de acessibilidade e no title",nos.length===14&&nos.slice(6).every(n=>!n.querySelector(".tit")&&!!n.querySelector("button.circulo.embreve[disabled]")&&/em breve/.test(n.querySelector("button").getAttribute("aria-label"))&&!!n.querySelector("button").getAttribute("title")))}catch(e){t("em breve sem etiqueta  [erro]",false)}
try{t("zona ilustrada: o portal do Pyron aparece perto do vulcão (parte alta) com a silhueta",!!U('.zona[data-ano="3"].ilus .portal img.sil')&&U('.zona[data-ano="3"] .portal').dataset.lendario==="900003");}catch(e){t("zona ilustrada: o portal do Pyron aparece perto do vulcão (parte alta) com a silhueta  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("os outros anos continuam com o degradê (sem 'ilus') até chegarem as imagens",Q(".zona").filter(e=>e.dataset.ano!=="3").every(e=>!e.classList.contains("ilus")));}catch(e){t("os outros anos continuam com o degradê (sem 'ilus') até chegarem as imagens  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("os estados e a folha continuam: tocar no círculo da 1ª fase abre a folha com os 3 níveis",(zv("abrirFolhaFase(fasesDoAno(3)[0].id)"),Q("#folha .nv").length===3));}catch(e){t("os estados e a folha continuam: tocar no círculo da 1ª fase abre a folha com os 3 níveis  [erro: "+String(e.message).slice(0,60)+"]",false)}
zv("fecharFolha()");
/* abrir a aba rola até a fase atual */
const vistos=[];z.w.Element.prototype.scrollIntoView=function(){vistos.push(this)};
zv("S.fases={'a3-posicional':{niveis:{bronze:{ok:true},prata:{ok:true},ouro:{ok:true}},viu:true}};save();ir('fases')");
try{t("ao abrir a aba, a trilha rola até a fase atual (a primeira disponível)",typeof zv("rolarTrilha")==="string"||zv("typeof rolarTrilha")==="function"?(zv("rolarTrilha()"),vistos.length>0&&vistos[vistos.length-1].dataset&&vistos[vistos.length-1].dataset.fase===zv("fasesDoAno(3)[1].id")):false,vistos.length);}catch(e){t("ao abrir a aba, a trilha rola até a fase atual (a primeira disponível)  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("CSS: a zona ilustrada mantém a proporção da imagem e o círculo dela tem pelo menos 44px",/\.zona\.ilus\{[^}]*aspect-ratio:800\/1732/.test(lerArq("css/trilha.css").replace(/\s+/g,""))&&/\.ilus\.circulo\{[^}]*width:(4[4-9]|[5-9]\d)px/.test(lerArq("css/trilha.css").replace(/\s+/g,"").replace(/\.zona\.ilus\.circulo/g,".ilus.circulo")));}catch(e){t("CSS: a zona ilustrada mantém a proporção da imagem e o círculo dela tem pelo menos 44px  [erro: "+String(e.message).slice(0,60)+"]",false)}
try{t("sw.js: pokemath-v12 e a imagem da zona na lista para funcionar offline",/const V="pokemath-v12"/.test(lerArq("sw.js"))&&lerArq("sw.js").includes('"img/zonas/ano3.webp"'));}catch(e){t("sw.js: pokemath-v11 e a imagem da zona na lista para funcionar offline  [erro: "+String(e.message).slice(0,60)+"]",false)}
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
try{t("sw.js: pokemath-v12",/const V="pokemath-v12"/.test(lerArq("sw.js")));}catch(e){t("sw.js: pokemath-v12  [erro: "+String(e.message).slice(0,60)+"]",false)}
z.w.close();
}
t("nenhum erro de script durante todos os testes",erros.length===0,erros.join(" | "));
console.log(`\nPASSARAM: ${ok}   FALHARAM: ${bad.length}`);bad.forEach(b=>console.log(" ✗ "+b));process.exit(0);
})().catch(e=>{console.error("ERRO NO TESTE:",e);process.exit(1)});
