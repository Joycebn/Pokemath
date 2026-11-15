const {JSDOM,VirtualConsole}=require("jsdom"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const DIR=process.env.PM_DIR||path.join(__dirname,".."),HTML=require("./montar.js")(DIR),KEY="tabuada-pokemon-v1";
const T0=Date.UTC(2026,10,9,15,0,0),DIA=864e5;let now=T0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const erros=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>{if(!/Not implemented/.test(e.message))erros.push(e.message.slice(0,140))});vc.on("error",e=>erros.push(String(e).slice(0,140)));
const lerArq=f=>fs.readFileSync(path.join(DIR,f),"utf8");
function novo(saved,opts={}){return new JSDOM(HTML,{url:"https://app.test/",runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  if(saved)w.localStorage.setItem(KEY,saved);const R=w.Date;w.Date=class extends R{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}};
  w.confirm=()=>true;w.__anims=[];
  if(opts.animate)w.HTMLElement.prototype.animate=function(frames,o){const a={el:this,frames,opts:o,cancel(){},pause(){this.paused=true},play(){this.paused=false}};w.__anims.push(a);return a};
  w.fetch=async u=>{u=String(u);
    if(u.startsWith("dados/")){const f=path.join(DIR,u);if(fs.existsSync(f)){const t=fs.readFileSync(f,"utf8");return{ok:true,text:async()=>t,json:async()=>({})}}return{ok:false,text:async()=>"",json:async()=>({})}}
    const id=+u.split("/").filter(Boolean).pop();let j;
    if(u.includes("/pokemon-species/"))j={is_legendary:false,is_mythical:false,evolves_from_species:null,capture_rate:200,evolution_chain:{url:"https://x/evolution-chain/"+id+"/"}};
    else if(u.includes("/evolution-chain/"))j={chain:{species:{url:".../"+id+"/"},evolution_details:[],evolves_to:[]}};else j={name:"mon"+id,types:[{type:{name:"fire"}}]};
    return{ok:true,json:async()=>j,text:async()=>""}}}})}
let ok=0;const bad=[];const t=(n,c,d)=>{c?ok++:bad.push(n+(d!==undefined?"  [obtido: "+d+"]":""))};
async function sessao(saved,opts){const d=novo(saved,opts),ev=c=>d.window.eval(c);ev("S.cfg.reduzir=true;S.cfg.teto=1000;S.cfg.meta=1000;save()");return{d,ev,w:d.window}}
async function jogarNivel(s,id,n,{errar=0}={}){
  const ev=s.ev;ev(`(S.fases=S.fases||{});(S.fases['${id}']=S.fases['${id}']||{}).viu=true`);ev(`abrirNivel('${id}','${n}')`);let g=0,e=0;
  while(ev("FS.vista")==="exerc"&&g++<90){const r=ev("FS.ses.fila[0].resposta");
    if(e<errar&&ev("FS.ses.estado")==="pergunta"&&!ev("FS.ses.fila[0].rep")){e++;ev(`responderFase(${r+1})`);ev("continuarSessao()");continue}
    ev(`responderFase(${r})`);ev("continuarSessao()")}
  await sleep(1300);return e}
const soma=ev=>ev("Object.values(S.caught).reduce((s,c)=>s+c.n,0)");
const st=(ev,id)=>ev(`NIVEIS.map(n=>estadoNivel(FASES.find(f=>f.id==='${id}'),n)).join()`);

(async()=>{
// ================= estrutura, CSS e arquivo antigo =================
let s=await sessao(),ev=s.ev;await ev("escolher(25)");
t("o app abre sem erros de script",erros.length===0,erros[0]);
t("código antigo (tabuada, loja, Cuidar, etc.) não foi alterado",crypto.createHash("md5").update(fs.readFileSync(path.join(DIR,"js/legado/jogo.js"))).digest("hex")==="1f2fcb33d4170ee27921b4335deedaa0");
t("aba Prof. continua e a aba Fases existe",!!s.w.document.querySelector('nav [data-t="prof"]')&&!!s.w.document.querySelector('nav [data-t="fases"]'));
const css=lerArq("css/novo.css");
t("novo.css tem as 4 cores por casa (azul, verde, laranja, roxo)",/\.pm-d\.cu\{color:#1e6fe0\}/.test(css)&&/\.cd\{color:#1f9d4a\}/.test(css)&&/\.cc\{color:#f28c1b\}/.test(css)&&/\.cm\{color:#8e44ad\}/.test(css));
t("novo.css tem a animação, o modo paisagem e botões grandes",/@keyframes pm-pop/.test(css)&&/orientation:landscape/.test(css)&&/\.pm-bt\{min-height:58px/.test(css));
t("index.html carrega css/novo.css antes dos scripts",lerArq("index.html").indexOf("css/novo.css")>0&&lerArq("index.html").indexOf("css/novo.css")<lerArq("index.html").indexOf("<script"));
const pmcss=ev("PM_CSS");t("estilo reserva (no JS) tem as mesmas cores e animações do novo.css",["#1e6fe0","#1f9d4a","#f28c1b","#8e44ad","pm-pop","pm-tremer"].every(x=>pmcss.includes(x)&&css.includes(x)));
ev("ir('fases')");ev("abrirExplicacao('a3-posicional')");await sleep(100);
t("estilos não carregados são detectados e o estilo reserva é injetado",!!s.w.document.getElementById("pm-anim-css")&&ev("(()=>{const p=document.createElement('span');p.className='pm-cel';document.body.append(p);const r=getComputedStyle(p).position;p.remove();return r})()")==="absolute");
ev("pararAnimacoes();FS.vista='trilha';render()");

// ================= trilha: três níveis por fase =================
ev("ir('fases')");const h=ev("document.getElementById('app').innerHTML");
t("trilha mostra 3 níveis (Bronze, Prata, Ouro) em cada uma das 6 fases",(h.match(/class="nv /g)||[]).length===18&&["Bronze","Prata","Ouro"].every(x=>h.includes(x)));
t("estado inicial: Bronze disponível, Prata e Ouro bloqueados; fase seguinte bloqueada",st(ev,"a3-posicional")==="disponivel,bloqueado,bloqueado"&&st(ev,"a3-adicao")==="bloqueado,bloqueado,bloqueado",st(ev,"a3-posicional"));
t("a trilha mostra os rótulos dos estados",["Disponível","Bloqueado"].every(x=>h.includes(x)));
ev("abrirNivel('a3-adicao','bronze')");t("nível bloqueado não abre",ev("FS.vista")==="trilha");
ev("abrirNivel('a3-posicional','prata')");t("Prata não abre antes do Bronze sem erros",ev("FS.vista")==="trilha");

// ================= níveis, desbloqueio e recompensas =================
s.w.close();s=await sessao();ev=s.ev;await ev("escolher(25)");ev("ir('fases')");const base=soma(ev);let c0=ev("S.coins");
ev("abrirNivel('a3-posicional','bronze')");t("na 1ª vez abre a explicação antes dos exercícios",ev("FS.vista")==="explica");
ev("irExercicios()");t("Bronze tem 6 questões, dica visível e conta 1 tentativa",ev("FS.ses.total")===6&&ev("FS.ses.dica")===true&&ev("document.getElementById('app').innerHTML").includes("💡")&&ev("tentativasNivel('a3-posicional','bronze')")===1,[ev("FS.ses.total"),ev("FS.ses.dica"),ev("document.getElementById('app').innerHTML").includes("💡"),ev("tentativasNivel('a3-posicional','bronze')"),ev("FS.vista"),ev("FS.ses.estado"),ev("!!FS.ses.fila[0].dica"),ev("document.getElementById('app').innerHTML").slice(0,160).replace(/\n/g," ")].join(" | "));
ev("voltarTrilha()");
await jogarNivel(s,"a3-posicional","bronze",{errar:2});
t("Bronze concluído com erros fica 'refazer'",st(ev,"a3-posicional")==="refazer,bloqueado,bloqueado",st(ev,"a3-posicional"));
t("com erros: Prata continua bloqueada, mas a próxima fase abre (dá para avançar errando)",st(ev,"a3-adicao")==="disponivel,bloqueado,bloqueado",st(ev,"a3-adicao"));
t("trilha mostra 'Refazer' e sem Pokémon no Bronze",ev("(ir('fases'),document.getElementById('app').innerHTML)").includes("Refazer")&&soma(ev)===base);
await jogarNivel(s,"a3-posicional","bronze");
t("Bronze refeito sem erros: 'concluído' e Prata liberada, ainda sem Pokémon",st(ev,"a3-posicional")==="concluido,disponivel,bloqueado"&&soma(ev)===base,st(ev,"a3-posicional"));
ev("abrirNivel('a3-posicional','prata')");t("Prata: 8 questões e sem dica",ev("FS.ses.total")===8&&ev("FS.ses.dica")===false&&!ev("document.getElementById('app').innerHTML").includes("💡"));ev("voltarTrilha()");
c0=ev("S.coins");await jogarNivel(s,"a3-posicional","prata");
t("moedas por acerto de primeira continuam (2 por acerto, 8 questões, sem bônus de fase)",ev("S.coins")-c0===16,ev("S.coins")-c0);
t("Prata sem erros libera o Ouro, sem Pokémon",st(ev,"a3-posicional")==="concluido,concluido,disponivel"&&soma(ev)===base,st(ev,"a3-posicional"));
ev("abrirNivel('a3-posicional','ouro')");t("Ouro: 10 questões e sem dica",ev("FS.ses.total")===10&&ev("FS.ses.dica")===false);ev("voltarTrilha()");
c0=ev("S.coins");await jogarNivel(s,"a3-posicional","ouro",{errar:1});
t("Ouro com erro: 'refazer', sem Pokémon, mas paga o bônus de 10 moedas da 1ª conclusão",st(ev,"a3-posicional")==="concluido,concluido,refazer"&&soma(ev)===base&&ev("S.coins")-c0>=10,ev("S.coins")-c0);
await jogarNivel(s,"a3-posicional","ouro");
t("Ouro sem nenhum erro: ganha 1 Pokémon",st(ev,"a3-posicional")==="concluido,concluido,concluido"&&soma(ev)===base+1,soma(ev)-base);
now+=DIA;c0=ev("S.coins");await jogarNivel(s,"a3-posicional","ouro");
t("Ouro de novo sem erros: ganha outro Pokémon (vale ao repetir) e não repete o bônus da fase",soma(ev)===base+2&&ev("S.coins")-c0===20,soma(ev)-base+" / "+(ev("S.coins")-c0));
s.w.close();

// ================= tentativas: 3 por dia, para cada nível =================
s=await sessao();ev=s.ev;await ev("escolher(25)");ev("S.fases={'a3-posicional':{niveis:{bronze:{ok:true,perfeito:true,vezes:1}},viu:true}}");
for(let i=0;i<3;i++){ev("abrirNivel('a3-posicional','bronze')");t("tentativa "+(i+1)+" do Bronze permitida",ev("FS.vista")==="exerc");ev("voltarTrilha()")}
ev("abrirNivel('a3-posicional','bronze')");t("4ª tentativa do Bronze no mesmo dia é bloqueada",ev("FS.vista")==="trilha"&&ev("tentativasNivel('a3-posicional','bronze')")===3);
ev("abrirNivel('a3-posicional','prata')");t("mas a Prata tem as suas próprias 3 tentativas",ev("FS.vista")==="exerc"&&ev("tentativasNivel('a3-posicional','prata')")===1);ev("voltarTrilha()");
t("a trilha avisa 'volte amanhã' no nível sem tentativas",ev("(ir('fases'),document.getElementById('app').innerHTML)").includes("volte amanhã"));
now+=DIA;t("no dia seguinte as tentativas voltam",ev("restantesNivel('a3-posicional','bronze')")===3);
ev("S.cfg.tentativasFaseDia=1;S.tentNivel=null");ev("abrirNivel('a3-posicional','bronze')");ev("voltarTrilha()");ev("abrirNivel('a3-posicional','bronze')");t("limite de tentativas é configurável",ev("FS.vista")==="trilha");
ev("S.cfg.tentativasFaseDia=3");
// migração do formato do lote anterior
ev("S.fases={'a3-posicional':{ok:true,perfeita:true,vezes:2}};S.tentNivel=null");t("progresso do lote anterior vira Bronze concluído",st(ev,"a3-posicional")==="concluido,disponivel,bloqueado",st(ev,"a3-posicional"));
ev("S.fases={'a3-posicional':{ok:true,perfeita:false,vezes:1}}");t("e Bronze com erros antigo vira 'refazer'",st(ev,"a3-posicional")==="refazer,bloqueado,bloqueado");
// ================= geradores por nível =================
let bom=true,msg="";const chk=(c,m)=>{if(!c){bom=false;msg=m}};
const un=n=>n%10,dz=n=>Math.floor(n/10)%10,ce=n=>Math.floor(n/100)%10;
for(const d of[1,3])for(const nome of Object.keys(ev("GER")))for(let i=0;i<300;i++){
  const ex=ev(`GER.${nome}(${d})`);chk(Number.isInteger(ex.resposta)&&ex.resposta>=0,nome+" resposta");chk(ex.dica&&ex.dica.length>10,nome+" sem dica");chk(ex.erro&&ex.erro.length>10,nome+" sem erro");
  if(ex.tipo==="escolha"){const o=Array.from(ex.opcoes);chk(o.length===4&&new Set(o).size===4&&o.includes(ex.resposta),nome+" opções")}
  if(ex.visual&&ex.visual.tipo==="conta"){const{a,b}=ex.visual;
    if(nome==="adicao"){chk(a+b===ex.resposta&&un(a)+un(b)<=9&&dz(a)+dz(b)<=9&&(d<3||ce(a)+ce(b)<=9),"adicao "+a+"+"+b);chk(d<3||a>=111,"adicao ouro pequena")}
    if(nome==="adicaoVaiUm"){chk(a+b===ex.resposta&&un(a)+un(b)>=10,"vai-um "+a+"+"+b);chk(d<3||a>=105,"vai-um ouro")}
    if(nome==="subtracao"){chk(a-b===ex.resposta&&b<a&&un(a)<un(b),"subtração com empréstimo "+a+"-"+b);chk(d<3?a<100:a>=201,"subtração faixa")}}
  if(nome==="valorPosicional"&&d>=3&&/valor do algarismo/.test(ex.enunciado)){chk(/\d{4}/.test(ex.enunciado),"posicional ouro 4 dígitos")}
  if(nome==="multiplicacao"||nome==="divisao"){const n=(ex.enunciado.match(/\d+/g)||[]).map(Number);if(nome==="divisao"){const[a,b]=n.length>=2?n.slice(0,2):[0,1];chk(a%b===0&&a/b===ex.resposta,"divisão "+a+"/"+b)}}
}
t("geradores (Bronze/Prata e Ouro): válidos, com dica, subtração com empréstimo e Ouro mais difícil",bom,msg);
const maxOuro=Math.max(...Array.from({length:200},()=>ev("GER.multiplicacao(3).resposta"))),maxBr=Math.max(...Array.from({length:200},()=>ev("GER.multiplicacao(1).resposta")));
t("Ouro tem contas maiores que Bronze/Prata (multiplicação)",maxOuro>maxBr&&maxBr<=30,maxBr+" / "+maxOuro);
s.w.close();

// ================= animações: roteiros, cores, viagem, tempos =================
s=await sessao(null,{animate:true});ev=s.ev;await ev("escolher(25)");ev("S.cfg.reduzir=false;FS.vel=0.001");
ev("S.fases={'a3-posicional':{niveis:{bronze:{ok:true,perfeito:true}}},'a3-adicao':{niveis:{bronze:{ok:true,perfeito:true}}}};save()");
ev("ir('fases');abrirExplicacao('a3-posicional')");ev("FS.auto=false;pararAnimacoes()");
const rodar=(nome,args)=>ev(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:false,gasto:0};const rot=ROT.${nome}(${args});const R=rot.montar(ctx);const g=[];
  for(const p of rot.passos){ctx.gasto=0;await p.acao(ctx,R);g.push([p.dur,ctx.gasto,p.fala.length])}window.__R=R;window.__g=g;window.__rot=rot;return true})()`);
async function passos(nome,args){await rodar(nome,args);await sleep(400);return ev("__g")}
const roteiros={posicional:"345",soma:"23,12",vaiUm:"8,5",subEmp:"32,15",mult:"3,4",divide:"12,3"};
let tempoOk=true,tmsg="",falaOk=true;
for(const[n,a]of Object.entries(roteiros)){
  s.w.__anims.length=0;const g=await passos(n,a);
  g.forEach(([dur,gasto,len],i)=>{if(dur<3000||dur>5000||gasto>5000||gasto>dur+1){tempoOk=false;tmsg=`${n} passo ${i}: dur ${dur} gasto ${gasto}`}if(len>120||len<5){falaOk=false;tmsg=`${n} passo ${i}: fala ${len}`}});
  t(`roteiro ${n}: houve voos em curva (Web Animations)`,s.w.__anims.length>0,s.w.__anims.length);
}
t("todos os passos duram de 3 a 5 s (animação cabe no tempo do passo)",tempoOk,tmsg);
t("cada passo tem uma fala curta do Pyri",falaOk,tmsg);
// curva: ponto do meio fora da reta
s.w.__anims.length=0;await passos("vaiUm","8,5");
const curvas=s.w.__anims.filter(a=>a.frames&&a.frames.length>=15).map(a=>{const f=a.frames,m=f[8].transform.match(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/),e=f[16].transform.match(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/);
  const mx=+m[1],my=+m[2],ex=+e[1],ey=+e[2];return Math.hypot(mx-ex/2,my-ey/2)});
t("os números viajam em CURVA (o meio do caminho sai da linha reta)",curvas.length>=5&&curvas.filter(c=>c>5).length>=Math.ceil(curvas.length*0.8),curvas.map(c=>c.toFixed(0)).join());
t("e crescem/diminuem durante o voo (efeito de viagem)",s.w.__anims.some(a=>/scale\(1\.[1-3]/.test(a.frames[8].transform)));
// cores por casa
await ev("(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};const R=armada(ctx,'+',345,123);window.__A=R;return true})()");
t("cores por casa: unidades azul, dezenas verde, centenas laranja",ev("__A.a[0].className.includes(' cu')&&__A.a[1].className.includes(' cd')&&__A.a[2].className.includes(' cc')&&__A.b[2].className.includes(' cc')"));
await ev("(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};window.__A=armada(ctx,'+',1234,1000);return true})()");
t("e milhares roxo",ev("__A.a[3].className.includes(' cm')&&__A.b[3].className.includes(' cm')"));
// roteiro 23+12
s.w.__anims.length=0;ev("FS.vel=0.001");await passos("soma","23,12");
let fin=ev("(()=>{const r=[...document.querySelectorAll('#exp-stage .pm-res')];return r.map(e=>e.textContent+':'+(e.className.match(/ c[udcm]/)||[''])[0].trim()).join()})()");
t("23 + 12: unidades 5 em azul, dezenas 3 em verde, resultado 35",fin==="5:cu,3:cd"&&ev("document.querySelector('#exp-stage #cap').textContent")==="23 + 12 = 35",fin);
t("os dois números de cada casa voam até o resultado (3 e 2, depois 2 e 1)",s.w.__anims.filter(a=>a.frames.length>=15).length>=4+4);
await passos("vaiUm","8,5");fin=ev("[...document.querySelectorAll('#exp-stage .pm-res')].map(e=>e.textContent+':'+(e.className.match(/ c[udcm]/)||[''])[0].trim()).join()");
t("8 + 5: sobram 3 unidades (azul), o pacote de dezena vai e desce (1 verde), resultado 13",fin==="3:cu,1:cd"&&ev("document.querySelector('#exp-stage #cap').textContent")==="8 + 5 = 13",fin);
// pacote verde durante o vai-um
await ev("(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};const rot=ROT.vaiUm(8,5),R=rot.montar(ctx);for(let i=0;i<=3;i++)await rot.passos[i].acao(ctx,R);window.__R=R;return true})()");
t("8 + 5: o 'pacote de dezena' é verde e está na coluna das dezenas (vai um)",ev("__R.pac.className.includes('bgd')&&__R.pac._x===__R.X(0)+4&&__R.pac.textContent==='1'"));
await passos("subEmp","32,15");fin=ev("[...document.querySelectorAll('#exp-stage .pm-res')].map(e=>e.textContent+':'+(e.className.match(/ c[udcm]/)||[''])[0].trim()).join()");
t("32 − 15: 12 − 5 = 7 (azul), 2 − 1 = 1 (verde), resultado 17 (com empréstimo)",fin==="7:cu,1:cd"&&ev("document.querySelector('#exp-stage #cap').textContent")==="32 − 15 = 17",fin);
await passos("mult","3,4");t("3 × 4: 12 maçãs alinhadas em 3 grupos, contagem 4, 8, 12 e resultado 12",ev("document.querySelectorAll('#exp-stage .pm-fruta').length")===12&&ev("[...document.querySelectorAll('#exp-stage .pm-cel')].filter(e=>e._y>=70&&['4','8','12'].includes(e.textContent)&&!e.className.includes('pm-res')).map(e=>e.textContent).join()")==="4,8,12"&&ev("document.querySelector('#exp-stage .pm-res').textContent")==="12");
await passos("divide","12,3");
t("12 ÷ 3: 12 frutas caem uma a uma em 3 pratos, 4 em cada, resultado 4",ev("document.querySelectorAll('#exp-stage .pm-fruta').length")===12&&ev("(()=>{const f=[...document.querySelectorAll('#exp-stage .pm-fruta')],pr=[...document.querySelectorAll('#exp-stage .pm-prato')];return pr.map(p=>{const l=parseFloat(p.style.left);return f.filter(x=>x._x>=l&&x._x<l+80&&x._y>=130).length}).join()})()")==="4,4,4"&&ev("document.querySelector('#exp-stage .pm-res').textContent")==="4");
// números nunca prontos: antes do voo não há resultado
await ev("(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};const rot=ROT.soma(23,12),R=rot.montar(ctx);for(let i=0;i<=1;i++)await rot.passos[i].acao(ctx,R);window.__R=R;return true})()");
t("o resultado nunca aparece pronto: depois de os números chegarem ainda não há resultado até a soma",ev("document.querySelectorAll('#exp-stage .pm-res').length")===0&&ev("__R.clones[0].length")===2);
t("os operandos começam fora do lugar (fora da conta) e viajam até ele",ev("(()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};const R=ROT.soma(23,12).montar(ctx);return R.a[0]._y<0&&R.a[0]._y!==R.a[0]._fy})()"));

// ================= apoio visual: maçãs, pacotes e bandejas (as imagens não substituem os números) =================
s.w.__anims.length=0;ev("S.cfg.reduzir=false;FS.vel=0.001");
const cont=sel=>ev(`document.querySelectorAll('#exp-stage ${sel}').length`);
const ateOPasso=async(nome,args,i)=>{await ev(`(async()=>{const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};const rot=ROT.${nome}(${args}),R=rot.montar(ctx);for(let k=0;k<=${i};k++)await rot.passos[k].acao(ctx,R);window.__R=R;return true})()`);};
// adição 23 + 12: unidades viram maçãs, dezenas viram pacotes de 10; as quantidades se juntam
await ateOPasso("soma","23,12",1);
t("soma: as unidades viram maçãs (3 e 2) nascendo dos algarismos, em bandejas azuis",cont(".pm-ap")===5&&cont(".pm-bandeja.cu")===2&&ev("[...document.querySelectorAll('#exp-stage .pm-ap')].every(e=>{const[x,y]=e.dataset.de.split(',').map(Number);const d=[...Object.values(__R.a),...Object.values(__R.b)];return d.some(z=>Math.abs(z._fx+14-x)<=30&&Math.abs(z._fy+12-y)<=30)})"));
t("soma: nada aparece do nada (ainda não há resultado nem nova quantidade)",cont(".pm-res")===0&&ev("__R.ap.res.length")===0);
await ateOPasso("soma","23,12",2);
t("soma: as 3 + 2 maçãs se juntam numa nova quantidade (5) na zona do resultado, e só depois nasce o 5",cont(".pm-ap")===5&&ev("__R.ap.res.length")===5&&ev("__R.ap.res.every(e=>e._y>=__R.ap.r2)")&&cont(".pm-res")===1&&cont(".pm-bandeja.cu")===0);
await ateOPasso("soma","23,12",3);
t("soma: as dezenas viram pacotes verdes (2 e 1)",cont(".pm-pacote.bgd")===3&&cont(".pm-bandeja.cd")===2);
await ateOPasso("soma","23,12",5);
t("soma: no fim há 3 pacotes verdes + 5 maçãs azuis (35, acima de 30 em pacotes)",cont(".pm-pacote.bgd")===3&&cont(".pm-ap")===5&&ev("__R.ap.res.length")===8);
// 8 + 5
await ateOPasso("vaiUm","8,5",1);
t("8 + 5: nascem 8 e 5 maçãs; as 5 se dividem em 2 e 3",cont(".pm-ap")===13&&ev("__R.ap.eB.slice(0,2).every(e=>e._y>__R.ap.eB[4]._y)"));
await ateOPasso("vaiUm","8,5",2);
t("8 + 5: as 10 maçãs se transformam em UM pacote verde de dezena (sobram 3 maçãs)",cont(".pm-ap")===3&&cont(".pm-pacote.bgd")===1);
await ateOPasso("vaiUm","8,5",3);
t("8 + 5: o pacote viaja para a casa das dezenas do resultado (vai um)",ev("__R.ap.pacote._x")===14&&ev("__R.ap.pacote._y")===ev("__R.ap.r2+14"));
await ateOPasso("vaiUm","8,5",6);
t("8 + 5: no fim, 1 pacote (dezena) + 3 maçãs (unidades) = 13",cont(".pm-pacote")===1&&cont(".pm-ap")===3&&ev("__R.ap.res.length")===4);
// 32 − 15
await ateOPasso("subEmp","32,15",1);
t("32 − 15: o 32 aparece em pacotes (3 dezenas + 2 maçãs) e o 15 como 1 pacote + 5 maçãs; nada de 32 maçãs soltas",cont(".pm-pacote")===4&&cont(".pm-ap")===7&&cont(".pm-bandeja")===2);
await ateOPasso("subEmp","32,15",3);
t("32 − 15: a dezena se parte em 10 unidades ANTES da conta (12 maçãs no 32)",cont(".pm-pacote")===3&&ev("__R.ap.um.length")===12&&cont(".pm-ap")===17);
await ateOPasso("subEmp","32,15",4);
t("32 − 15: 12 − 5: as 5 maçãs se apagam junto com as 5 que saem (sobram 7)",cont(".pm-ap")===7&&ev("__R.ap.um.length")===7);
await ateOPasso("subEmp","32,15",5);
t("32 − 15: o pacote que sai se apaga com o de baixo (sobra 1 dezena)",cont(".pm-pacote")===1);
await ateOPasso("subEmp","32,15",6);
t("32 − 15: no fim, 1 pacote + 7 maçãs = 17",cont(".pm-pacote")===1&&cont(".pm-ap")===7&&ev("__R.ap.res.length")===8);
// multiplicação e divisão: maçãs e pratos
await passos("mult","3,4");t("3 × 4: 3 grupos de 4 maçãs (imagens) junto com a contagem 4, 8, 12",cont(".pm-fruta")===12&&cont(".pm-caixa")===3);
await passos("mult","4,9");t("acima de 30 objetos (4 × 9 = 36) os grupos viram pacotes",cont(".pm-pacote")===4&&cont(".pm-fruta")===0);
await passos("divide","12,3");t("12 ÷ 3: 12 maçãs e 3 pratos",cont(".pm-fruta")===12&&cont(".pm-prato")===3);
// layout: painel de apoio e escala
await ateOPasso("soma","23,12",0);
t("a cena tem o painel de apoio abaixo da conta e largura mínima de 300",ev("parseFloat(__R.box.style.height)")===5*58+142&&ev("parseFloat(__R.box.style.width)")>=300);
await ev("(()=>{window.innerHeight=480;const ctx={stage:document.getElementById('exp-stage'),instant:true,gasto:0};const R=ROT.soma(23,12).montar(ctx);window.__sc=R.box.style.transform;window.innerHeight=900;return true})()");
t("em tela baixa a cena é reduzida para caber (altura)",/scale\(0\.[0-9]+\)/.test(ev("__sc")),ev("__sc"));
// giros: existem com movimento e somem com 'reduzir movimento'
await ev("window.__gira=0;const _g=DOMTokenList.prototype.add;DOMTokenList.prototype.add=function(...c){if(c.includes('pm-gira'))window.__gira++;return _g.apply(this,c)};true");
await passos("vaiUm","8,5");await passos("subEmp","32,15");
t("a dezena gira (pacote que se forma e dezena que se parte) quando há movimento",ev("__gira")>=2,ev("__gira"));
// reduzir movimento
s.w.__anims.length=0;ev("S.cfg.reduzir=true;FS.vel=0.001");
await ev("window.__pulso=0;const _a=DOMTokenList.prototype.add;DOMTokenList.prototype.add=function(...c){if(c.includes('pm-pulso'))window.__pulso++;return _a.apply(this,c)};true");
await passos("vaiUm","8,5");fin=ev("[...document.querySelectorAll('#exp-stage .pm-res')].map(e=>e.textContent).join()");
const giraAntes=ev("__gira");
await passos("subEmp","32,15");
t("reduzir movimento: mesmo passo a passo (números e imagens), com destaque, SEM voo e SEM giros",s.w.__anims.length===0&&ev("__pulso")>5&&fin==="3,1"&&ev("__gira")===giraAntes&&cont(".pm-pacote")===1&&cont(".pm-ap")===7,s.w.__anims.length+" / "+ev("__pulso")+" / "+(ev("__gira")-giraAntes));
ev("S.cfg.reduzir=false");

// ================= player: auto, pausa, controles =================
s.w.close();s=await sessao(null,{animate:true});ev=s.ev;await ev("escolher(25)");ev("S.cfg.reduzir=false;FS.vel=0.004;S.cfg.teto=1000");
await ev("window.__LOG=[];const _e=esperar;esperar=function(c,m){if(!c.instant)__LOG.push(m);return _e(c,m)};const _m=mostrarPasso;mostrarPasso=function(){__LOG.push('P');return _m()};true");
ev("S.fases={'a3-posicional':{niveis:{bronze:{ok:true,perfeito:true}}},'a3-adicao':{niveis:{bronze:{ok:true,perfeito:true}}}};save()");
ev("FS.auto=false;ir('fases');abrirExplicacao('a3-vai-um')");await sleep(100);
t("botões da explicação: Repetir, Pausar, Anterior e Próximo",["exp-rep","exp-pausa","exp-ant","exp-prox"].every(id=>ev(`!!document.getElementById('${id}')`))&&ev("document.getElementById('exp-prox').textContent")==="Próximo ▶");
t("Anterior começa desativado no 1º passo",ev("document.getElementById('exp-ant').disabled")===true);
ev("__LOG.length=0;FS.log=[];FS.auto=true;FS.vel=0.004;FS.passo=0;mostrarPasso()");await sleep(4500);
const n=ev("roteiroDaFase(FS.fase).passos.length");
t("toca sozinho até o último passo",ev("FS.passo")===n-1&&ev("document.getElementById('exp-prox').textContent").includes("Praticar")&&ev("document.getElementById('exp-prox').classList.contains('pm-destaque')"),ev("FS.passo")+"/"+(n-1));
const grupos=[];let cur=null;for(const v of ev("__LOG")){if(v==="P"){cur=[];grupos.push(cur)}else if(cur)cur.push(v)}
const flog=ev("FS.log.map(x=>x.gasto)");
t("cada passo dura de 3 a 5 s (tempo real do passo, com ações simultâneas contadas uma vez só)",flog.length===n&&flog.every(x=>x>=3000&&x<=5000),flog.join());
t("a pausa de 1 s existe entre todos os passos (e não depois do último)",grupos.length===n&&grupos.slice(0,-1).every(g=>g[g.length-1]===1000)&&grupos[n-1][grupos[n-1].length-1]!==1000);
// pausar
ev("FS.vel=0.05;FS.passo=0;FS.auto=true;mostrarPasso()");await sleep(100);
const p0=ev("FS.passo");ev("pausar()");t("Pausar muda o botão para Continuar",ev("document.getElementById('exp-pausa').textContent").includes("Continuar")&&ev("FS.pausado")===true);
await sleep(1800);t("em pausa, o passo não avança",ev("FS.passo")===p0,p0+"→"+ev("FS.passo"));
t("em pausa, os voos ficam parados",s.w.__anims.length>0&&s.w.__anims.slice(-1)[0].paused===true);
ev("pausar()");await sleep(2500);t("Continuar retoma e a explicação avança",ev("FS.passo")>p0&&ev("document.getElementById('exp-pausa').textContent").includes("Pausar"),p0+"→"+ev("FS.passo"));
ev("FS.auto=false;FS.vel=0.004;FS.passo=2;passoMenos()");await sleep(50);t("Anterior volta um passo",ev("FS.passo")===1);
ev("passoMais()");await sleep(50);t("Próximo vai ao passo seguinte",ev("FS.passo")===2);
const tk=ev("FS.tok");ev("repetirPasso()");t("Repetir recomeça o passo atual",ev("FS.tok")>tk&&ev("FS.passo")===2);
ev("FS.passo=3;mostrarPasso()");await sleep(300);t("pular para o passo 4 reconstrói a cena (pacote verde no lugar)",ev("document.querySelectorAll('#exp-stage .pm-pac').length")===1);
ev("pararAnimacoes()");
// último passo -> exercícios
ev("FS.passo=roteiroDaFase(FS.fase).passos.length-1");ev("passoMais()");t("Praticar leva aos exercícios do nível",ev("FS.vista")==="exerc"&&ev("FS.ses.nivel")==="bronze");
// ================= falas =================
const f1=await ev("falaPokemon(25,'desafio')");t("fala específica do Pokémon (arquivos corrigidos, com acento)",typeof f1==="string"&&f1.length>5);
const f2=await ev("falaPokemon(152,'fome')");t("sem fala de fome: usa a fala de reserva",/barriguinha|fome|petisco/i.test(f2),f2);
const f3=await ev("falaPokemon(850,'capturado','Sizzlipede')");t("Pokémon fora dos arquivos (810–905): reserva com o nome",f3.length>5&&!f3.includes("{nome}"),f3);
const f4=await ev("falaPokemon(152,'alimentado')");t("fala específica com acentos corrigidos",f4.includes("delícia"),f4);
await sleep(300);t("ao começar o nível o companheiro fala (balão com a fala)",ev("(document.getElementById('fala-pk')||{}).textContent").length>5);
// ================= salvar e reabrir =================
ev("S.fases={'a3-posicional':{niveis:{bronze:{ok:true,perfeito:true,vezes:1},prata:{ok:true,perfeito:false,vezes:1}},viu:true}};save()");
const salvo=s.w.localStorage.getItem(KEY);s.w.close();s=await sessao(salvo);ev=s.ev;
t("estado dos níveis sobrevive ao fechar e abrir",st(ev,"a3-posicional")==="concluido,refazer,bloqueado",st(ev,"a3-posicional"));
t("nenhum erro de script durante todos os testes",erros.length===0,erros.join(" | "));
console.log(`\nPASSARAM: ${ok}   FALHARAM: ${bad.length}`);bad.forEach(b=>console.log(" ✗ "+b));process.exit(0);
})().catch(e=>{console.error("ERRO NO TESTE:",e);process.exit(1)});
