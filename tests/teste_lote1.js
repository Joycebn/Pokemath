const {JSDOM,VirtualConsole}=require("jsdom"),fs=require("fs");
const HTML=require("./montar.js")(require("path").join(__dirname,"..")),KEY="tabuada-pokemon-v1";
const T0=Date.UTC(2026,10,9,15,0,0),DIA=864e5;let now=T0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const erros=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>{if(!/Not implemented/.test(e.message))erros.push(e.message.slice(0,120))});vc.on("error",e=>erros.push(String(e).slice(0,120)));
function novo(saved){return new JSDOM(HTML,{url:"https://app.test/",runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  if(saved)w.localStorage.setItem(KEY,saved);const R=w.Date;w.Date=class extends R{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}};
  w.confirm=()=>true;w.fetch=async u=>{u=String(u);const id=+u.split("/").filter(Boolean).pop();let j;
   if(u.includes("/pokemon-species/"))j={is_legendary:false,is_mythical:false,evolves_from_species:null,capture_rate:200,evolution_chain:{url:"https://x/evolution-chain/"+id+"/"}};
   else if(u.includes("/evolution-chain/"))j={chain:{species:{url:".../"+id+"/"},evolution_details:[],evolves_to:[]}};else j={name:"mon"+id,types:[{type:{name:"fire"}}]};
   return{ok:true,json:async()=>j}}}})}
let ok=0;const bad=[];const t=(n,c,d)=>{c?ok++:bad.push(n+(d!==undefined?"  [obtido: "+d+"]":""))};
async function sessao(saved){const d=novo(saved),ev=c=>d.window.eval(c);ev("S.cfg.reduzir=true;save()");return{d,ev,w:d.window}}
const q=(s,x)=>x.w.document.querySelector(x.sel||s),
 gabarito=ex=>ex.resposta;
async function jogarFase(s,id,{errar=0}={}){ // abre a fase, pula a explicação e responde tudo
  const ev=s.ev;ev(`abrirFase('${id}')`);ev("irExercicios()");let g=0,e=0;
  while(ev("FS.vista")==="exerc"&&g++<60){const r=ev("FS.ses.fila[0].resposta");
    if(e<errar&&ev("FS.ses.estado")==="pergunta"&&!ev("FS.ses.fila[0].rep")){e++;ev(`responderFase(${r+1})`);ev("continuarSessao()");continue}
    ev(`responderFase(${r})`);ev("continuarSessao()")}
  await sleep(1300);return e}
const soma=ev=>ev("Object.values(S.caught).reduce((s,c)=>s+c.n,0)");

(async()=>{
let s=await sessao(),ev=s.ev;await ev("escolher(25)");
// ---- carga e navegação
t("o app abre sem erros de script",erros.length===0,erros[0]);
t("aba Fases e aba Tabuada existem",s.w.document.querySelector('nav [data-t="fases"]')&&s.w.document.querySelector('nav [data-t="estudar"]').textContent==="Tabuada");
ev("ir('fases')");let h=ev("document.body.innerHTML");
t("trilha mostra as 6 fases do 3º ano e os ano 4 a 9 trancados",["Casas dos números","Somar","Somar com","Subtrair","Multiplicar","Dividir"].every(x=>h.includes(x))&&h.includes("Libera quando o ano escolar for 9º"));
t("só a 1ª fase está aberta no início",ev("FASES.filter(f=>f.ano===3).map(f=>estadoFase(f)).join()")==="ab,bl,bl,bl,bl,bl",ev("FASES.filter(f=>f.ano===3).map(f=>estadoFase(f)).join()"));
ev("abrirFase('a3-adicao')");t("fase trancada não abre",ev("FS.vista")==="trilha");
// ---- geradores
let bom=true,msg="";
const chk=(c,m)=>{if(!c){bom=false;msg=m}};
for(const nome of Object.keys(ev("GER"))){for(let i=0;i<400;i++){
  const ex=ev(`GER.${nome}()`);chk(Number.isInteger(ex.resposta)&&ex.resposta>=0,nome+" resposta inválida");chk(ex.erro&&ex.erro.length>10,nome+" sem explicação");
  if(ex.tipo==="escolha"){const o=Array.from(ex.opcoes);chk(o.length===4&&new Set(o).size===4&&o.includes(ex.resposta),nome+" opções ruins "+o)}
  if(ex.visual&&ex.visual.tipo==="conta"){const{a,b,op}=ex.visual;const u=a%10,v=b%10,d1=Math.floor(a/10),d2=Math.floor(b/10);
    if(nome==="adicao"){chk(u+v<=9&&d1+d2<=9&&a+b===ex.resposta,"adicao com vai-um/errada "+a+"+"+b)}
    if(nome==="adicaoVaiUm"){chk(u+v>=10&&d1+d2+1<=9&&a+b===ex.resposta,"vai-um errado "+a+"+"+b)}
    if(nome==="subtracao"){chk(u>=v&&d1>=d2&&a>b&&a-b===ex.resposta,"subtracao errada "+a+"-"+b)}}
  if(nome==="divisao"){const m=ex.enunciado.match(/(\d+) biscoitos igualmente em (\d+)|(\d+) ÷ (\d+)/);const a=+(m[1]||m[3]),b=+(m[2]||m[4]);chk(a%b===0&&a/b===ex.resposta,"divisão errada "+a+"/"+b)}
  if(nome==="multiplicacao"&&/ \+ /.test(ex.enunciado)){const n=ex.enunciado.match(/\d+/g).map(Number);chk(n.reduce((x,y)=>x+y)===ex.resposta,"soma de parcelas errada")}
  if(nome==="multiplicacao"&&ex.visual){chk(ex.visual.grupos*ex.visual.cada===ex.resposta,"grupos errados")}
  if(nome==="valorPosicional"&&/valor do algarismo/.test(ex.enunciado)){const[n,d]=ex.enunciado.match(/\d+/g).map(Number),i=String(n).indexOf(String(d));chk(ex.resposta===d*Math.pow(10,String(n).length-1-i),"valor posicional errado "+n+" "+d)}
}}
t("geradores: 2.400 questões válidas (resposta, opções, regras de cada fase)",bom,msg);
// ---- visuais finais
const stage=()=>{ev("document.body.insertAdjacentHTML('beforeend','<div id=\"tst\"></div>')");};
async function vis(code){ev(`(()=>{let e=document.getElementById('tst');if(!e){e=document.createElement('div');e.id='tst';document.body.append(e)}window.__r=${code}})()`);await sleep(60)}
const tx=sel=>ev(`[...document.querySelectorAll('#tst ${sel}')].map(e=>e.textContent).join('|')`);
await vis("visConta(document.getElementById('tst'),{op:'+',a:23,b:12})");
t("23 + 12: resultado 3 e 5 caem na linha do resultado",tx(".res")==="5|3"&&tx("#cap")==="23 + 12 = 35",tx(".res")+" / "+tx("#cap"));
await vis("visConta(document.getElementById('tst'),{op:'+',a:47,b:36})");
t("47 + 36: 'vai um' aparece na casa das dezenas e o resultado é 83",tx(".carry")==="1"&&tx(".res")==="3|8"&&tx("#cap")==="47 + 36 = 83",tx(".carry")+" / "+tx(".res"));
await vis("visConta(document.getElementById('tst'),{op:'+',a:47,b:36,colunas:1})");
t("só as unidades (passo 1): mostra 7 + 6 = 13 e o 3",tx(".res")==="3"&&/escreve 3/.test(tx("#cap")),tx("#cap"));
await vis("visConta(document.getElementById('tst'),{op:'-',a:58,b:23})");
t("58 − 23 = 35",tx(".res")==="5|3"&&tx("#cap")==="58 − 23 = 35",tx(".res"));
await vis("visConta(document.getElementById('tst'),{op:'+',a:95,b:8})");t("95 + 8 = 103 (resultado com uma casa a mais)",tx("#cap")==="95 + 8 = 103"&&tx(".res")==="3|0|1",tx(".res"));
await vis("visGrupos(document.getElementById('tst'),{partes:[2,3],emoji:'🍎'})");
t("2 maçãs + 3 maçãs = 5 (as frutas viajam para a linha de baixo)",ev("document.querySelectorAll('#tst .fr').length")===5&&tx("#cap")==="2 + 3 = 5"&&/translate/.test(ev("document.querySelector('#tst .fr').style.transform")));
await vis("visTirar(document.getElementById('tst'),{total:5,tirar:2})");t("5 − 2 = 3 (duas frutas ficam apagadas)",ev("document.querySelectorAll('#tst .fr.sai').length")===2&&tx("#cap")==="5 − 2 = 3");
await vis("visIguais(document.getElementById('tst'),{grupos:3,cada:4,emoji:'🍎',somar:true})");t("3 grupos de 4: 4 + 4 + 4 = 12",tx("#cap")==="4 + 4 + 4 = 12");
await vis("visReparte(document.getElementById('tst'),{total:12,pratos:3})");t("12 biscoitos em 3 pratos: 12 ÷ 3 = 4 (todos distribuídos)",tx("#cap")==="12 ÷ 3 = 4"&&ev("document.querySelectorAll('#tst .fr').length")===12);
await vis("visDecomp(document.getElementById('tst'),{n:345})");t("345 = 300 + 40 + 5",tx("#cap")==="345 = 300 + 40 + 5");
ev("document.getElementById('tst').remove()");
// ---- player da explicação
ev("abrirFase('a3-posicional')");
t("abrir a fase mostra o Pyri falando o 1º passo",ev("FS.vista")==="explica"&&ev("$('#exp-fala').textContent").includes("Oi! Eu sou o Pyri"));
ev("passoMais()");t("próximo passo: texto e termos (unidades, dezenas, centenas)",ev("FS.passo")===1&&ev("$('#exp-termos').textContent").includes("dezenas"));
const tok=ev("FS.tok");ev("passoMais()");t("trocar de passo cancela a animação anterior",ev("FS.tok")>tok);
ev("passoMais()");t("último passo troca o botão para 'Vamos praticar!'",ev("$('#exp-prox').textContent").includes("Vamos praticar"));
ev("passoMenos()");t("voltar um passo funciona",ev("FS.passo")===2);
ev("irExercicios()");t("vai para os exercícios e conta 1 tentativa",ev("FS.vista")==="exerc"&&ev("tentativasHoje()")===1&&ev("FS.ses.total")===8);
t("a tela do exercício mostra pergunta e barra de progresso",ev("document.body.innerHTML").includes("enun")&&ev("document.body.innerHTML").includes("barra"));
// ---- exercícios: erro, nova tentativa e fim
ev("S.cfg.moedaAcerto=2;S.cfg.teto=40;S.coinsHoje={dia:null,n:0};save()");
const r0=ev("FS.ses.fila[0].resposta");ev(`responderFase(${r0+7})`);
t("resposta errada mostra a explicação e conta o erro",ev("FS.ses.estado")==="errado"&&ev("FS.ses.erros")===1&&ev("document.body.innerHTML").includes("A resposta certa é"));
ev("continuarSessao()");t("a questão errada volta no fim da fila",ev("FS.ses.fila.length")===8&&ev("FS.ses.fila[7].rep")===true);
ev("voltarTrilha()");
// ---- fase completa com erros: conclui, destrava, mas sem Pokémon
s.w.close();s=await sessao();ev=s.ev;await ev("escolher(25)");const base=soma(ev);const c0=ev("S.coins");
await jogarFase(s,"a3-posicional",{errar:2});
t("fase com erros: concluída, mas não 'perfeita' e sem Pokémon",ev("S.fases['a3-posicional'].ok")===true&&ev("S.fases['a3-posicional'].perfeita")===false&&soma(ev)===base,soma(ev)-base);
t("fase nova paga o bônus (10) mais as moedas dos acertos de primeira",ev("S.coins")-c0>=10+2*6,ev("S.coins")-c0);
t("a fase seguinte (Somar) foi destravada",ev("estadoFase(FASES.find(f=>f.id==='a3-adicao'))")==="ab");
t("a meta diária contou as respostas (ofensiva)",ev("S.feitas.n")>=8&&ev("S.hist[hoje()]")>=8,ev("S.feitas.n"));
// ---- fase perfeita: ganha Pokémon (também ao repetir)
const b2=soma(ev);await jogarFase(s,"a3-posicional");
t("repetir sem errar: fase vira 'perfeita' e ganha 1 Pokémon",ev("S.fases['a3-posicional'].perfeita")===true&&soma(ev)===b2+1,soma(ev)-b2);
t("repetir não paga o bônus de fase nova de novo",ev("S.fases['a3-posicional'].vezes")===2);
// ---- tentativas por dia
t("já foram usadas 2 tentativas hoje",ev("tentativasHoje()")===2);
await jogarFase(s,"a3-adicao");t("3ª tentativa funciona",ev("tentativasHoje()")===3&&soma(ev)===b2+2);
const b3=soma(ev);ev("abrirFase('a3-vai-um')");ev("irExercicios()");
t("4ª tentativa no mesmo dia é bloqueada com mensagem",ev("FS.vista")==="trilha"&&ev("tentativasHoje()")===3&&soma(ev)===b3);
now+=DIA;t("no dia seguinte as tentativas voltam",ev("tentativasRestantes()")===3);
await jogarFase(s,"a3-vai-um");t("e a fase seguinte pode ser jogada",ev("S.fases['a3-vai-um'].ok")===true);
// ---- liberação por ano e configuração
ev("FASES.push({id:'t4',ano:4,ordem:1,titulo:'x',icone:'x',resumo:'x',area:'x',gerador:'adicao',explicacao:[{fala:'x'}]})");
t("fase do 4º ano fica trancada com ano escolar 3",ev("faseLiberada(FASES.find(f=>f.id==='t4'))")===false);
ev("S.cfg.anoEscolar=4");t("e abre quando o ano escolar liberado é 4",ev("faseLiberada(FASES.find(f=>f.id==='t4'))")===true);
ev("FASES.pop();S.cfg.anoEscolar=3");
ev("S.cfg.questoesPorFase=5;S.cfg.tentativasFaseDia=1;S.tentFase=null");ev("abrirFase('a3-subtracao')");
t("questões por fase e tentativas por dia são configuráveis",ev("irExercicios(),FS.ses.total")===5&&ev("tentativasRestantes()")===0);
ev("ir('prof')");t("área do professor tem os novos ajustes",["Ano escolar liberado","Tentativas de fase por dia","Questões por fase"].every(x=>ev("document.body.innerHTML").includes(x)));
// ---- salvar e reabrir
const salvo=s.w.localStorage.getItem(KEY);s.w.close();s=await sessao(salvo);ev=s.ev;
t("progresso das fases e tentativas sobrevive ao fechar e abrir",ev("S.fases['a3-posicional'].perfeita")===true&&ev("!!S.fases['a3-vai-um']")&&ev("S.tentFase.n")>=1);
t("nenhum erro de script durante todos os testes",erros.length===0,erros.join(" | "));
console.log(`\nPASSARAM: ${ok}   FALHARAM: ${bad.length}`);bad.forEach(b=>console.log(" ✗ "+b));process.exit(0);
})().catch(e=>{console.error("ERRO NO TESTE:",e);process.exit(1)});
