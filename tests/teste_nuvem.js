// Testa a camada de dados no app inteiro, com um Supabase SIMULADO (login, offline, dois aparelhos, configuração externa).
//   npm install jsdom   &&   node tests/teste_nuvem.js
const {JSDOM,VirtualConsole}=require("jsdom"),fs=require("fs"),path=require("path");
const DIR=process.env.PM_DIR||path.join(__dirname,".."),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const URL_SB="https://cxfwnuyzkyugkbtbrgfl.supabase.co",CHAVE="sb_publishable_uA-tRTTlFWQOGKD8tMghpA_b4c_Tr7G";
const erros=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>{if(!/Not implemented/.test(e.message))erros.push(e.message.slice(0,200))});
let ok=0;const bad=[];const t=(n,c,d)=>{c?ok++:bad.push(n+(d!==undefined?"  [obtido: "+JSON.stringify(d)+"]":""))};

/* ---------- Supabase simulado ---------- */
class Servidor{
  constructor(){this.online=true;this.log=[];this.cri={};this.prog={};this.conf={};this.falhas={};this.tok={};this.refresh={};this.n=0;this.recusarRefresh=false}
  add(id,codigo,avatar,pin,apelido){this.cri[id]={id,codigo,avatar,pin,apelido,ano_escolar:6};this.conf[id]={crianca_id:id,tempo_desafio:60,questoes_por_fase:8,ano_escolar_liberado:3,tentativas_dia:3,extras:{},versao:1}}
  sessao(id){const a="tok-"+id+"-"+(++this.n),r="ref-"+id+"-"+this.n;this.tok[a]=id;this.refresh[r]=id;return{access_token:a,refresh_token:r,expires_at:Math.floor(Date.now()/1000)+3600}}
  quem(h){const a=(h.Authorization||"").replace("Bearer ","");return this.tok[a]||null}
  async fetch(url,o={}){
    const h=o.headers||{},corpo=o.body?JSON.parse(o.body):null;this.log.push({url,metodo:o.method||"GET",h,corpo});
    if(!this.online)throw new TypeError("Failed to fetch");
    const R=(d,s=200)=>({ok:s<300,status:s,json:async()=>d,text:async()=>JSON.stringify(d)});
    const u=url.replace(URL_SB,"");
    if(u.startsWith("/functions/v1/login-crianca")){
      const c=Object.values(this.cri).find(x=>x.codigo===corpo.codigo);
      if(c&&(this.falhas[c.codigo]||0)>=5)return R({erro:"bloqueado",espera_seg:900},429);
      if(!c||c.avatar!==corpo.avatar||c.pin!==corpo.pin){if(c)this.falhas[c.codigo]=(this.falhas[c.codigo]||0)+1;return R({erro:"dados_incorretos"},401)}
      this.falhas[c.codigo]=0;return R({ok:true,sessao:this.sessao(c.id),crianca:{id:c.id,apelido:c.apelido,avatar:c.avatar,ano_escolar:c.ano_escolar}})}
    if(u.startsWith("/auth/v1/token?grant_type=refresh_token")){
      const id=this.refresh[corpo.refresh_token];if(!id||this.recusarRefresh)return R({error:"invalid_grant"},400);return R(this.sessao(id))}
    if(u.startsWith("/auth/v1/logout"))return R({},204);
    const id=this.quem(h);
    if(!id)return R({message:"JWT"},401);
    if(u.startsWith("/rest/v1/progresso")){const f=(u.match(/crianca_id=eq\.([^&]+)/)||[])[1];return R(f===id&&this.prog[id]?[JSON.parse(JSON.stringify(this.prog[id]))]:[])}   // RLS: só o próprio
    if(u.startsWith("/rest/v1/configuracoes")){const f=(u.match(/crianca_id=eq\.([^&]+)/)||[])[1];return R(f===id?[this.conf[id]]:[])}
    if(u.startsWith("/rest/v1/rpc/pm_salvar_progresso")){
      const p=this.prog[id];
      if(!p){this.prog[id]={estado:corpo.p_estado,versao:1};return R({ok:true,versao:1})}
      if(p.versao!==corpo.p_versao)return R({ok:false,erro:"conflito",versao:p.versao});
      p.estado=corpo.p_estado;p.versao++;return R({ok:true,versao:p.versao})}
    return R({},404)}
}
const lerArq=f=>fs.readFileSync(path.join(DIR,f),"utf8");
const pagina=arq=>lerArq(arq).replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+lerArq(f).replace(/<\/script>/g,"<\\/script>")+"</script>");
/* abre uma página (index.html / entrar.html / responsavel.html) num "aparelho": armazenamento persiste entre aberturas */
function abrir(arq,srv,arm,opts={}){
  const d=new JSDOM(pagina(arq),{url:"https://joycebn.github.io/Pokemath/"+arq,runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
    for(const [k,v] of Object.entries(arm))w.localStorage.setItem(k,v);
    w.confirm=()=>true;w.prompt=()=>null;w.__PYRI_VEL=0;
    w.fetch=async(u,o)=>{u=String(u);
      if(!u.startsWith("http")){const f=path.join(DIR,u);if(fs.existsSync(f)){const x=fs.readFileSync(f,"utf8");return{ok:true,text:async()=>x,json:async()=>({})}}return{ok:false,text:async()=>"",json:async()=>({})}}
      if(u.startsWith(URL_SB))return srv.fetch(u,o);
      const id=+u.split("/").filter(Boolean).pop();return{ok:true,json:async()=>({name:"mon"+id,types:[{type:{name:"fire"}}]}),text:async()=>""}};
    const ng=require("crypto").webcrypto;try{Object.defineProperty(w.crypto,"subtle",{value:ng.subtle})}catch{}w.TextEncoder=TextEncoder;
    if(opts.antes)opts.antes(w)}});
  return d}
const salvar=(d,arm)=>{const w=d.window;for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);arm[k]=w.localStorage.getItem(k)}};
const clicar=(w,sel)=>{const e=w.document.querySelector(sel);e.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));return e};
function digitar(w,{codigo,avatar,pin}){
  const c=w.document.getElementById("cod");c.value=codigo;c.dispatchEvent(new w.Event("input",{bubbles:true}));
  clicar(w,`[data-av="${avatar}"]`);for(const n of pin)clicar(w,`[data-n="${n}"]`)}

(async()=>{
  const ID_A="aaaaaaaa-0000-0000-0000-00000000000a",ID_B="bbbbbbbb-0000-0000-0000-00000000000b";
  const srv=new Servidor();srv.add(ID_A,"ANA234","a3","7391","Ana");srv.add(ID_B,"BIA567","a5","2468","Bia");
  const arm={};   // armazenamento do celular da Ana

  /* ===== 1) sem conta: o jogo não abre e o progresso antigo não é tocado ===== */
  const legado=JSON.stringify({coins:77,streak:2,last:null,caught:{25:{nome:"Pikachu",n:1,nivel:3,xp:5,amizade:2,rar:"raro"}},comp:25,tutorialVisto:true,cfg:{}});
  arm["tabuada-pokemon-v1"]=legado;
  let d=abrir("index.html",srv,arm);await sleep(200);
  t("sem criança conectada, o jogo NÃO inicia (vai para a entrada)",d.window.PM_PARAR===true&&d.window.document.getElementById("app").innerHTML==="");
  salvar(d,arm);t("o progresso antigo do aparelho não foi alterado",arm["tabuada-pokemon-v1"]===legado);
  t("não criou cópia de ninguém",!Object.keys(arm).some(k=>k.startsWith("pokemath-estado-")&&k!=="pokemath-estado-"));

  /* ===== 2) entrada da criança ===== */
  d=abrir("entrar.html",srv,arm);await sleep(100);const w=d.window;
  t("tela de entrada mostra 12 figuras e o teclado",w.document.querySelectorAll("[data-av]").length===12&&w.document.querySelectorAll("[data-n]").length>=12);
  t("oferece trazer o progresso que já existe no aparelho",!!w.document.getElementById("legado"));
  digitar(w,{codigo:"ana234",avatar:"a3",pin:"1111"});await sleep(80);
  t("PIN errado: mensagem gentil e sem sessão",/não conferem/.test(w.document.getElementById("app").textContent)&&!w.localStorage.getItem("pm-sessao"));
  t("o código aparece em maiúsculas",w.document.getElementById("cod").value==="ANA234");
  for(let i=0;i<4;i++){digitar(w,{codigo:"ANA234",avatar:"a3",pin:"1111"});await sleep(60)}
  digitar(w,{codigo:"ANA234",avatar:"a3",pin:"7391"});await sleep(80);
  t("depois de 5 erros, até o PIN certo mostra o bloqueio (15 min)",/15 minuto/.test(w.document.getElementById("app").textContent)&&!w.localStorage.getItem("pm-sessao"));
  srv.falhas.ANA234=0;srv.online=false;digitar(w,{codigo:"ANA234",avatar:"a3",pin:"7391"});await sleep(80);
  t("sem internet na primeira entrada: avisa",/Sem internet/.test(w.document.getElementById("app").textContent));
  srv.online=true;digitar(w,{codigo:"ANA234",avatar:"a3",pin:"7391"});await sleep(400);
  let ses=JSON.parse(w.localStorage.getItem("pm-sessao")||"null");
  t("entrada correta guarda a sessão da criança",ses&&ses.id===ID_A&&ses.apelido==="Ana"&&ses.access.startsWith("tok-"));
  salvar(d,arm);
  t("o PIN não é guardado em lugar nenhum do aparelho",!Object.values(arm).some(v=>v.includes("7391")));
  const loc=JSON.parse(arm["pokemath-estado-"+ID_A]);
  t("o progresso antigo foi trazido para a conta (moedas, Pokémon, nível)",loc.coins===77&&loc.caught[25].nivel===3&&loc._ts>0);
  t("o progresso antigo continua guardado como cópia",arm["tabuada-pokemon-v1"]===legado);
  t("marcado para enviar à nuvem",JSON.parse(arm["pm-meta-"+ID_A]).sujo===true);

  /* ===== 3) o jogo com a conta ===== */
  srv.log.length=0;d=abrir("index.html",srv,arm);await sleep(500);let W=d.window,ev=c=>W.eval(c);
  t("o jogo abre com a cópia da Ana (não a de outra pessoa)",W.PM_KEY==="pokemath-estado-"+ID_A&&ev("S.coins")===77&&!!ev("S.caught[25]"));
  t("o jogo continua igual: Pyri e níveis presentes",!!ev("S.caught[900001]")&&ev("NIVEIS.join()")==="bronze,prata,ouro"&&ev("cfgF('questoesPorFase')")===8);
  t("nenhum erro de script ao abrir",erros.length===0,erros[0]);
  await sleep(300);
  t("o progresso foi enviado à nuvem (versão 1)",srv.prog[ID_A]&&srv.prog[ID_A].versao===1&&srv.prog[ID_A].estado.coins===77);
  t("a nuvem recebeu o estado completo do jogo",!!srv.prog[ID_A].estado.caught[900001]&&srv.prog[ID_A].estado.tutorialVisto===true);
  t("só a chave publicável foi usada, em todas as chamadas",srv.log.every(x=>x.h.apikey===CHAVE)&&!JSON.stringify(srv.log).includes("service_role")&&!JSON.stringify(srv.log).includes("sb_secret"));
  t("leitura sempre filtrada pela própria criança",srv.log.filter(x=>x.url.includes("/rest/v1/progresso")).every(x=>x.url.includes("crianca_id=eq."+ID_A)));
  t("o PIN nunca vai para a nuvem junto do jogo",!JSON.stringify(srv.prog).includes("7391"));
  ev("ir('prof')");t("aba Prof. mostra o cartão da conta e não oferece apagar tudo",/Conta e nuvem/.test(W.document.getElementById("app").textContent)&&!/Apagar progresso/.test(W.document.getElementById("app").textContent));
  ev("ir('inicio')");

  /* jogar de verdade (fase 1, Bronze) dentro do modo nuvem */
  ev("S.cfg.reduzir=true;save()");ev("(S.fases=S.fases||{});(S.fases['a3-posicional']=S.fases['a3-posicional']||{}).viu=true");ev("ir('fases')");ev("abrirNivel('a3-posicional','bronze')");
  let g=0;while(ev("FS.vista")==="exerc"&&g++<60){const ex=ev("FS.ses.fila[0]");
    if(ex.tipo==="relacionar"){ev("(()=>{const ex=FS.ses.fila[0];ex.pares.forEach((p,i)=>{ligarEsq(i);ligarDir(ex.direita.indexOf(p.d))});verificarLig()})()")}else ev(`responderFase(${ev("FS.ses.fila[0].resposta")})`);ev("continuarSessao()")}
  await sleep(1400);
  t("jogar um nível funciona igual (Bronze concluído)",ev("estadoNivel(FASES.find(f=>f.id==='a3-posicional'),'bronze')")==="concluido");
  t("a jogada ficou marcada para enviar",W.Nuvem.estado().meta.sujo===true);
  await W.Nuvem._empurrar();await sleep(50);
  t("enviado: a nuvem já tem o Bronze concluído",srv.prog[ID_A].estado.fases["a3-posicional"].niveis.bronze.ok===true&&srv.prog[ID_A].versao===2);
  const coinsAntes=ev("S.coins");

  /* ===== 4) sem internet: joga, fecha, reabre, volta a conexão ===== */
  srv.online=false;ev("S.coins+=40;save()");await W.Nuvem._empurrar();
  t("offline: aviso de pendente e nada se perde",W.Nuvem.estado().estado==="offline"&&W.Nuvem.estado().meta.sujo===true&&srv.prog[ID_A].estado.coins===coinsAntes);
  salvar(d,arm);d.window.close();
  d=abrir("index.html",srv,arm);await sleep(400);W=d.window;ev=c=>W.eval(c);
  t("reabrir SEM internet: o progresso está lá",ev("S.coins")===coinsAntes+40&&W.PM_PARAR!==true);
  t("e continua marcado para enviar",W.Nuvem.estado().meta.sujo===true);
  srv.online=true;W.dispatchEvent(new W.Event("online"));await sleep(500);
  t("volta a internet: envia sozinho o que ficou pendente",srv.prog[ID_A].estado.coins===coinsAntes+40&&W.Nuvem.estado().meta.sujo===false,srv.prog[ID_A].estado.coins);

  /* ===== 5) configuração do controle externo ===== */
  Object.assign(srv.conf[ID_A],{tempo_desafio:45,questoes_por_fase:10,ano_escolar_liberado:4,tentativas_dia:2,versao:5,extras:{meta:5,dificuldade:"facil",moedaAcerto:3,hack:99,teto:99999}});
  await W.Nuvem._config();
  t("configuração aplicada ao abrir/ao ficar online",ev("S.cfg.tempo")===45&&ev("cfgF('questoesPorFase')")===10&&ev("cfgF('anoEscolar')")===4&&ev("cfgF('tentativasFaseDia')")===2&&ev("S.cfg.meta")===5&&ev("S.cfg.dificuldade")==="facil"&&ev("S.cfg.moedaAcerto")===3);
  t("só campos conhecidos e dentro dos limites entram",ev("S.cfg.hack")===undefined&&ev("S.cfg.teto")===1000);
  ev("setc('tempo',999)");t("a criança não consegue mudar o que o responsável definiu",ev("S.cfg.tempo")===45);
  await W.Nuvem._empurrar();salvar(d,arm);
  t("a última configuração fica guardada no aparelho",JSON.parse(arm["pm-config-"+ID_A]).sobre.tempo===45);
  d.window.close();srv.online=false;
  const armOff={...arm};const st=JSON.parse(armOff["pokemath-estado-"+ID_A]);st.cfg.tempo=60;st.cfg.questoesPorFase=8;armOff["pokemath-estado-"+ID_A]=JSON.stringify(st);   // simula cópia antiga
  d=abrir("index.html",srv,armOff);await sleep(300);W=d.window;ev=c=>W.eval(c);
  t("OFFLINE: usa a última configuração recebida (antes mesmo de a tela aparecer)",ev("S.cfg.tempo")===45&&ev("cfgF('questoesPorFase')")===10&&ev("cfgF('tentativasFaseDia')")===2);
  d.window.close();srv.online=true;

  /* ===== 6) dois aparelhos da mesma criança ===== */
  const armB={};for(const k of ["pm-sessao","pm-meta-"+ID_A,"pm-config-"+ID_A])armB[k]=arm[k];   // celular 2 entra com a mesma conta
  d=abrir("index.html",srv,arm);await sleep(500);W=d.window;ev=c=>W.eval(c);       // aparelho 1
  const d2=abrir("entrar.html",srv,armB);await sleep(100);digitar(d2.window,{codigo:"ANA234",avatar:"a3",pin:"7391"});await sleep(400);salvar(d2,armB);
  const dB=abrir("index.html",srv,armB);await sleep(600);const W2=dB.window,ev2=c=>W2.eval(c);
  t("aparelho 2 recebe o progresso da nuvem",ev2("S.coins")===coinsAntes+40&&!!ev2("S.caught[25]"),ev2("S.coins"));
  /* o aparelho 2 captura o Pokémon 4 e mexe nas moedas */
  ev2("S.caught[4]={nome:'Charmander',n:1,nivel:2,xp:3,amizade:1,rar:'raro'};S.coins=1000;save()");await W2.Nuvem._empurrar();
  t("aparelho 2 enviou (nuvem tem o Pokémon 4)",!!srv.prog[ID_A].estado.caught[4]);
  /* o aparelho 1 (desatualizado) ganha o Pokémon 7 e envia → conflito → junta */
  ev("S.caught[7]={nome:'Squirtle',n:1,nivel:1,xp:0,amizade:0,rar:'raro'};S.coins+=5;save()");
  await W.Nuvem._empurrar();
  t("conflito de versão detectado e resolvido sem perder nada: nuvem tem 25, 4 e 7",[25,4,7].every(i=>!!srv.prog[ID_A].estado.caught[i])||W.Nuvem.estado().adocao,Object.keys(srv.prog[ID_A].estado.caught));
  await sleep(7500);
  const final=srv.prog[ID_A].estado;
  t("depois de esperar a criança terminar a ação: nuvem e aparelho 1 têm os 3 Pokémon",[25,4,7].every(i=>!!final.caught[i])&&[25,4,7].every(i=>!!ev(`S.caught[${i}]`)),Object.keys(final.caught));
  t("o Bronze concluído continua (nada regrediu)",final.fases["a3-posicional"].niveis.bronze.ok===true);
  t("nada ficou pendente",W.Nuvem.estado().meta.sujo===false);
  d.window.close();dB.window.close();

  /* ===== 7) isolamento entre crianças (lado do app) ===== */
  const armC={};d=abrir("entrar.html",srv,armC);await sleep(100);digitar(d.window,{codigo:"BIA567",avatar:"a5",pin:"2468"});await sleep(400);salvar(d,armC);
  const sesB=JSON.parse(armC["pm-sessao"]);
  t("outra criança entra com o próprio código",sesB.id===ID_B&&!armC["pokemath-estado-"+ID_A]);
  const dd=abrir("index.html",srv,armC);await sleep(500);
  t("a Bia começa do zero: não vê nada da Ana",dd.window.eval("S.coins")===0&&!dd.window.eval("S.caught[25]")&&dd.window.eval("window.PM_KEY")==="pokemath-estado-"+ID_B);
  const r1=await srv.fetch(URL_SB+"/rest/v1/progresso?select=*&crianca_id=eq."+ID_A,{headers:{apikey:CHAVE,Authorization:"Bearer "+sesB.access}});
  t("(servidor simulado) token da Bia não lê o progresso da Ana",(await r1.json()).length===0);
  dd.window.close();

  /* ===== 8) sessão vencida e sessão revogada ===== */
  const armE={...arm};const s0=JSON.parse(armE["pm-sessao"]);s0.expira=Date.now()-1000;armE["pm-sessao"]=JSON.stringify(s0);
  srv.log.length=0;d=abrir("index.html",srv,armE);await sleep(300);W=d.window;ev=c=>W.eval(c);
  ev("S.coins+=1;save()");await W.Nuvem._empurrar();
  t("token vencido é renovado sozinho e o envio funciona",srv.log.some(x=>x.url.includes("grant_type=refresh_token"))&&W.Nuvem.estado().meta.sujo===false);
  salvar(d,armE);d.window.close();
  const armF={...armE};srv.recusarRefresh=true;const s1=JSON.parse(armF["pm-sessao"]);s1.expira=Date.now()-1000;armF["pm-sessao"]=JSON.stringify(s1);
  d=abrir("index.html",srv,armF);await sleep(400);W=d.window;ev=c=>W.eval(c);
  ev("S.coins+=1;save()");await W.Nuvem._empurrar();
  t("sessão recusada pelo servidor: o jogo continua e avisa para entrar de novo",W.Nuvem.estado().estado==="expirada"&&W.PM_PARAR!==true);
  salvar(d,armF);d.window.close();
  d=abrir("index.html",srv,armF);await sleep(150);
  t("na próxima abertura vai para a entrada (sem apagar o progresso local)",d.window.PM_PARAR===true&&!!armF["pokemath-estado-"+ID_A]);
  d.window.close();srv.recusarRefresh=false;

  /* ===== 9) sair da conta ===== */
  d=abrir("index.html",srv,arm);await sleep(400);W=d.window;
  await W.Nuvem.sair();await sleep(50);salvar(d,arm);
  t("sair apaga a sessão mas mantém a cópia local",!W.localStorage.getItem("pm-sessao")&&!!W.localStorage.getItem("pokemath-estado-"+ID_A));
  d.window.close();

  /* ===== 10) área do responsável: cadastro com consentimento ===== */
  const cap=[];srv.fetchOrig=srv.fetch.bind(srv);
  srv.fetch=async(u,o)=>{if(u.includes("/auth/v1/signup")){cap.push(JSON.parse(o.body));return{ok:true,status:200,json:async()=>({id:"x",email:"m@x.com"}),text:async()=>"{}"}}return srv.fetchOrig(u,o)};
  d=abrir("responsavel.html",srv,{});await sleep(100);W=d.window;
  clicar(W,"#m2");await sleep(150);
  t("cadastro mostra o texto do consentimento e pede as duas confirmações",/TERMOS DE USO/.test(W.document.getElementById("termos").textContent)&&!!W.document.querySelector('[name="aceito"]')&&!!W.document.querySelector('[name="resp"]'));
  const f=W.document.getElementById("f");f.elements.nome.value="Mãe da Ana";f.elements.email.value="m@x.com";f.elements.senha.value="senha-forte-1";f.elements.aceito.checked=true;f.elements.resp.checked=true;
  f.dispatchEvent(new W.Event("submit",{cancelable:true,bubbles:true}));await sleep(300);
  const c0=cap[0];
  t("o cadastro envia aceite, versão do texto e hash do texto",c0&&c0.data.consentimento_aceito===true&&c0.data.consentimento_versao==="2026-11-v1"&&/^[0-9a-f]{64}$/.test(c0.data.consentimento_hash)&&c0.data.nome==="Mãe da Ana");
  t("o e-mail e a senha vão ao serviço de contas, e a chave é só a publicável",c0.email==="m@x.com"&&srv.log.filter(x=>x.url.includes("signup")).every(x=>x.h.apikey===CHAVE));
  t("com confirmação por e-mail, avisa para confirmar",/confirmar|mensagem/i.test(W.document.getElementById("app").textContent));
  d.window.close();

  t("nenhum erro de script em todo o teste",erros.length===0,erros.slice(0,3));
  console.log(`\nPASSARAM: ${ok}   FALHARAM: ${bad.length}`);if(bad.length)console.log(bad.map(x=>" ✗ "+x).join("\n"));process.exit(bad.length?1:0);
})().catch(e=>{console.error("ERRO NO TESTE:",e);process.exit(2)});
