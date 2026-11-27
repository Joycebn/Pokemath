// Testa a camada de dados no app inteiro, com um Supabase SIMULADO (login, offline, dois aparelhos, configuração externa).
//   npm install jsdom   &&   node tests/teste_nuvem.js
const {JSDOM,VirtualConsole}=require("jsdom"),fs=require("fs"),path=require("path");
const DIR=process.env.PM_DIR||path.join(__dirname,".."),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const URL_SB="https://cxfwnuyzkyugkbtbrgfl.supabase.co",CHAVE="sb_publishable_uA-tRTTlFWQOGKD8tMghpA_b4c_Tr7G";
const erros=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>{if(!/Not implemented/.test(e.message))erros.push(e.message.slice(0,200))});
let ok=0;const bad=[];const t=(n,c,d)=>{c?ok++:bad.push(n+(d!==undefined?"  [obtido: "+JSON.stringify(d)+"]":""))};

/* ---------- Supabase simulado ---------- */
const H3="e053d23ad238368f1cf450d7e1bffca5b28ef3c0f455be41fbe4bc61c078f2a9";
class Servidor{
  constructor(){this.online=true;this.log=[];this.cri={};this.prog={};this.conf={};this.falhas={};this.tok={};this.refresh={};this.n=0;this.recusarRefresh=false;this.resp={};this.rtok={}}
  addResp(id,email,senha,nome,status,cons){this.resp[id]={id,email,senha,nome,status,criado_em:"2026-11-23T20:00:00Z",cons:cons||[{versao_texto:"2026-11-v3",texto_hash:H3,aceito:true,aceito_em:"2026-11-24T09:00:00Z"}]};this.consPost=this.consPost||[]}
  liberada(id){const r=this.cri[id]&&this.cri[id].resp;return !r||this.resp[r].status==="aprovado"}   // criança de família pendente/bloqueada não é liberada
  add(id,codigo,avatar,pin,apelido){this.cri[id]={id,codigo,avatar,pin,apelido,ano_escolar:6,idade:11};this.conf[id]={crianca_id:id,tempo_desafio:60,questoes_por_fase:8,ano_escolar_liberado:3,tentativas_dia:3,extras:{},versao:1}}
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
      if(!c||c.avatar!==corpo.avatar||c.pin!==corpo.pin||!this.liberada(c.id)){if(c)this.falhas[c.codigo]=(this.falhas[c.codigo]||0)+1;return R({erro:"dados_incorretos"},401)}
      this.falhas[c.codigo]=0;return R({ok:true,sessao:this.sessao(c.id),crianca:{id:c.id,apelido:c.apelido,avatar:c.avatar,ano_escolar:c.ano_escolar}})}
    if(u.startsWith("/auth/v1/token?grant_type=password")){
      const r=Object.values(this.resp).find(x=>x.email===corpo.email&&x.senha===corpo.password);if(!r)return R({error:"invalid_grant"},400);
      const a="rtok-"+r.id+"-"+(++this.n);this.rtok[a]=r.id;
      return R({access_token:a,refresh_token:"rref-"+r.id,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:r.id,user_metadata:{nome:r.nome}}})}
    if(u.startsWith("/auth/v1/token?grant_type=refresh_token")){
      const id=this.refresh[corpo.refresh_token];if(!id||this.recusarRefresh)return R({error:"invalid_grant"},400);return R(this.sessao(id))}
    if(u.startsWith("/auth/v1/logout"))return R({},204);
    const rid=this.rtok[(h.Authorization||"").replace("Bearer ","")];
    if(rid){   // ---- chamadas do RESPONSÁVEL (o servidor simulado aplica a mesma regra do banco: só aprovado vê/gera dados)
      const r=this.resp[rid],ap=r.status==="aprovado",minhas=Object.values(this.cri).filter(c=>c.resp===rid);
      if(u.startsWith("/rest/v1/responsaveis"))return R([{id:r.id,nome:r.nome,email:r.email,status:r.status,criado_em:r.criado_em}]);
      if(u.startsWith("/rest/v1/criancas"))return R(ap?minhas.map(c=>({id:c.id,apelido:c.apelido,ano_escolar:c.ano_escolar,idade:c.idade||11,avatar:c.avatar,codigo:c.codigo,ativo:true,ultimo_acesso:null})):[]);
      if(u.startsWith("/rest/v1/progresso"))return R(ap?minhas.filter(c=>this.prog[c.id]).map(c=>({crianca_id:c.id,moedas:9,pokemon_total:1,ofensiva_atual:2})):[]);
      if(u.startsWith("/rest/v1/configuracoes"))return R(ap?minhas.map(c=>this.conf[c.id]):[]);
      if(u.startsWith("/rest/v1/consentimentos_estudante")){if(this.falhaCE)return R({message:"erro"},500);return R(ap?[{tipo:"perfil",versao_texto:"2026-11-v3",texto_hash:"e053d23ad238368f1cf450d7e1bffca5b28ef3c0f455be41fbe4bc61c078f2a9",aceito_em:"2026-11-24T10:00:00Z",retirado_em:null}]:[])}
      if(u.startsWith("/rest/v1/rpc/pm_redefinir_pin")){this.pinLog=this.pinLog||[];this.pinLog.push(corpo);const c=this.cri[corpo.p_crianca];return R(!!(ap&&c&&c.resp===rid&&/^\d{4}$/.test(corpo.p_pin)))}
      if(u.startsWith("/rest/v1/consentimentos")){
        if((o.method||"GET")==="POST"){this.consPost=this.consPost||[];this.consPost.push(corpo);if(!ap||!corpo||corpo.responsavel_id!==rid||corpo.aceito!==true)return R({message:"new row violates row-level security policy"},403);
          r.cons.push({versao_texto:corpo.versao_texto,texto_hash:corpo.texto_hash,aceito:corpo.aceito,aceito_em:"2026-11-26T12:00:00Z"});return R(null,201)}
        if(this.falhaCons)return R({message:"erro"},500);
        return R(ap?r.cons.slice().sort((a,b)=>a.aceito_em<b.aceito_em?1:-1).map(x=>({...x})):[])}
      if(u.startsWith("/functions/v1/gerenciar-crianca")){this.fnLog=this.fnLog||[];this.fnLog.push(corpo);
        if(this.fnRede)throw new TypeError("Failed to fetch");
        if(!ap)return R({erro:"aguardando_aprovacao"},403);
        if(this.fnResp){const x=this.fnResp(corpo);return R(x[0],x[1])}
        if(corpo&&corpo.acao==="editar"){const c=this.cri[corpo.crianca_id];if(!c||c.resp!==rid)return R({erro:"nao_encontrada",mensagem:"Essa criança não está na sua conta."},404);c.apelido=corpo.apelido;c.ano_escolar=corpo.ano_escolar;c.idade=corpo.idade;return R({ok:true,crianca:{id:c.id,apelido:c.apelido,ano_escolar:c.ano_escolar,idade:c.idade}})}
        return R({ok:true,codigo:"K7M2QP"})}
      return R({},404)}
    const id=this.quem(h);
    if(!id)return R({message:"JWT"},401);
    if(u.startsWith("/rest/v1/progresso")){const f=(u.match(/crianca_id=eq\.([^&]+)/)||[])[1];return R(f===id&&this.prog[id]&&this.liberada(id)?[JSON.parse(JSON.stringify(this.prog[id]))]:[])}   // RLS: só o próprio
    if(u.startsWith("/rest/v1/configuracoes")){const f=(u.match(/crianca_id=eq\.([^&]+)/)||[])[1];return R(f===id&&this.liberada(id)?[this.conf[id]]:[])}
    if(u.startsWith("/rest/v1/rpc/pm_salvar_progresso")){
      if(!this.liberada(id))return R({ok:false,erro:"sem_acesso"});
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

  const lerJ=v=>{try{return JSON.parse(v)||{}}catch{return{}}};   // leitura tolerante: se a chave local estiver errada, o teste falha de forma limpa em vez de quebrar a suíte
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
  srv.online=true;{const cx=w.document.getElementById("legado");cx.checked=true;cx.dispatchEvent(new w.Event("change",{bubbles:true}))}digitar(w,{codigo:"ANA234",avatar:"a3",pin:"7391"});await sleep(400);
  let ses=JSON.parse(w.localStorage.getItem("pm-sessao")||"null");
  t("entrada correta guarda a sessão da criança",ses&&ses.id===ID_A&&ses.apelido==="Ana"&&ses.access.startsWith("tok-"));
  salvar(d,arm);
  t("o PIN não é guardado em lugar nenhum do aparelho",!Object.values(arm).some(v=>v.includes("7391")));
  const loc=lerJ(arm["pokemath-estado-"+ID_A]);
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
  t("o Bronze concluído continua (nada regrediu)",!!(final.fases&&final.fases["a3-posicional"]&&final.fases["a3-posicional"].niveis.bronze.ok===true));
  t("nada ficou pendente",W.Nuvem.estado().meta.sujo===false);
  d.window.close();dB.window.close();

  /* ===== 7) isolamento entre crianças (lado do app) ===== */
  const armC={};d=abrir("entrar.html",srv,armC);await sleep(100);digitar(d.window,{codigo:"BIA567",avatar:"a5",pin:"2468"});await sleep(400);salvar(d,armC);
  const sesB=JSON.parse(armC["pm-sessao"]);
  t("outra criança entra com o próprio código",sesB.id===ID_B&&!armC["pokemath-estado-"+ID_A]);
  const dd=abrir("index.html",srv,armC);await sleep(500);
  t("a Bia começa do zero: não vê nada da Ana",dd.window.eval("S.coins")===0&&!dd.window.eval("S.caught[25]"));
  t("a chave local do jogo inclui o id da criança (a chave local do jogo não inclui o id da criança = falha)",String(dd.window.PM_KEY)==="pokemath-estado-"+ID_B,"PM_KEY="+dd.window.PM_KEY);
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
  t("o cadastro envia aceite, versão do texto e hash do texto",c0&&c0.data.consentimento_aceito===true&&c0.data.consentimento_versao==="2026-11-v3"&&c0.data.consentimento_hash===H3&&/^[0-9a-f]{64}$/.test(c0.data.consentimento_hash)&&c0.data.nome==="Mãe da Ana");
  t("o e-mail e a senha vão ao serviço de contas, e a chave é só a publicável",c0.email==="m@x.com"&&srv.log.filter(x=>x.url.includes("signup")).every(x=>x.h.apikey===CHAVE));
  t("com confirmação por e-mail, avisa para confirmar",/confirmar|mensagem/i.test(W.document.getElementById("app").textContent));
  d.window.close();

  /* ===== 11) APROVAÇÃO MANUAL do responsável ===== */
  srv.fetch=srv.fetchOrig;                                   // volta ao servidor completo
  srv.addResp("RESP1","mae@x.com","senha-forte-1","Mãe da Ana","pendente");srv.cri[ID_A].resp="RESP1";
  const entrarResp=async(d,email,senha)=>{const w=d.window;const f=w.document.getElementById("f");f.elements.email.value=email;f.elements.senha.value=senha;f.dispatchEvent(new w.Event("submit",{cancelable:true,bubbles:true}));await sleep(350)};
  const txt=w=>w.document.getElementById("app").textContent;
  srv.log.length=0;let armR={};d=abrir("responsavel.html",srv,armR);await sleep(100);W=d.window;
  await entrarResp(d,"mae@x.com","senha-forte-1");
  t("responsável PENDENTE entra e vê só 'aguardando aprovação', com nome e data do cadastro",/Aguardando aprovação/.test(txt(W))&&/Mãe da Ana/.test(txt(W))&&/23\/11\/2026|23\/11\/26/.test(txt(W)),txt(W).slice(0,200));
  t("PENDENTE: nenhuma criança, formulário, ajuste ou consentimento aparece",!/Minhas crianças|Cadastrar criança|Ajustes|Meus consentimentos|ANA234/.test(txt(W))&&!W.document.getElementById("nc"));
  t("PENDENTE: o app nem PEDE dados de crianças, progresso, configurações ou consentimentos",!srv.log.some(x=>/\/rest\/v1\/(criancas|progresso|configuracoes|consentimentos)/.test(x.url)),srv.log.map(x=>x.url.replace(URL_SB,"")).filter(u=>/rest/.test(u)));
  t("PENDENTE: pode sair e pode excluir a própria conta (direito de exclusão)",!!W.document.getElementById("sair")&&!!W.document.getElementById("exc-conta"));
  /* a criança dessa família não consegue entrar enquanto pendente */
  const dK=abrir("entrar.html",srv,{});await sleep(100);digitar(dK.window,{codigo:"ANA234",avatar:"a3",pin:"7391"});await sleep(300);
  t("criança de responsável PENDENTE: código, figura e PIN certos NÃO entram (mensagem genérica)",/não conferem/.test(dK.window.document.getElementById("app").textContent)&&!dK.window.localStorage.getItem("pm-sessao"));
  dK.window.close();
  /* aprovação pelo administrador */
  srv.resp.RESP1.status="aprovado";srv.falhas.ANA234=0;
  clicar(W,"#ver");await sleep(300);
  t("depois de APROVADO: 'Verificar de novo' libera a área e mostra as crianças",/Minhas crianças/.test(txt(W))&&/ANA234/.test(txt(W))&&!!W.document.getElementById("nc"),txt(W).slice(0,160));
  const dK2=abrir("entrar.html",srv,{});await sleep(100);digitar(dK2.window,{codigo:"ANA234",avatar:"a3",pin:"7391"});await sleep(400);
  t("depois de APROVADO: a criança consegue entrar",!!dK2.window.localStorage.getItem("pm-sessao"));dK2.window.close();
  /* bloqueio com a tela aberta: a próxima ação já cai na tela de bloqueio, sem chamar o servidor */
  srv.resp.RESP1.status="bloqueado";srv.log.length=0;
  const nc=W.document.getElementById("nc");nc.elements.apelido.value="Nova";nc.elements.pin.value="1111";nc.elements.pin2.value="1111";
  nc.dispatchEvent(new W.Event("submit",{cancelable:true,bubbles:true}));await sleep(300);
  t("BLOQUEADO com a tela aberta: a ação é recusada e a tela vira 'Acesso suspenso'",/Acesso suspenso/.test(txt(W))&&!/Minhas crianças|ANA234/.test(txt(W)));
  t("BLOQUEADO: nenhuma criança foi cadastrada (a função de criar nem foi chamada)",!srv.log.some(x=>x.url.includes("gerenciar-crianca")));
  d.window.close();
  /* a mesma regra ao reabrir a página já bloqueado */
  const arm2={};srv.log.length=0;d=abrir("responsavel.html",srv,arm2);await sleep(100);await entrarResp(d,"mae@x.com","senha-forte-1");
  t("BLOQUEADO ao entrar: só a tela de acesso suspenso, sem dados",/Acesso suspenso/.test(txt(d.window))&&!srv.log.some(x=>/\/rest\/v1\/(criancas|progresso|configuracoes|consentimentos)/.test(x.url)));
  d.window.close();
  /* criança já logada num aparelho, família bloqueada: o jogo segue no aparelho, nada sobe, e volta a sincronizar ao aprovar */
  srv.resp.RESP1.status="aprovado";const armK=JSON.parse(JSON.stringify(arm));
  d=abrir("index.html",srv,armK);await sleep(600);W=d.window;ev=c=>W.eval(c);
  await W.Nuvem._tudo();const versaoAntes=srv.prog[ID_A].versao;
  srv.resp.RESP1.status="bloqueado";ev("S.coins=4321;save()");await W.Nuvem._empurrar();
  t("família BLOQUEADA: o jogo continua no aparelho e avisa que o salvamento na nuvem está suspenso",ev("S.coins")===4321&&W.Nuvem.estado().estado==="suspensa"&&W.PM_PARAR!==true);
  t("família BLOQUEADA: nada novo é gravado na nuvem",srv.prog[ID_A].versao===versaoAntes&&srv.prog[ID_A].estado.coins!==4321);
  t("família BLOQUEADA: o que é da criança segue guardado no aparelho",JSON.parse(W.localStorage.getItem("pokemath-estado-"+ID_A)).coins===4321);
  srv.resp.RESP1.status="aprovado";await W.Nuvem._empurrar();await sleep(300);
  t("reaprovada: o progresso guardado no aparelho sobe para a nuvem sem perder nada",srv.prog[ID_A].estado.coins===4321&&[25,4,7].every(i=>!!srv.prog[ID_A].estado.caught[i]),srv.prog[ID_A].estado.coins);
  d.window.close();

  /* ===== 13) CADASTRAR CRIANÇA em 2 passos: autorizações por estudante ===== */
  const TXT=lerArq("dados/consentimento_v3.txt"),TIT="AUTORIZAÇÕES PARA ESTE ESTUDANTE";
  const ITENS=TXT.split(TIT).pop().split("☐").slice(1).map(x=>x.trim());          // extração independente da do app
  const HASHT=require("crypto").createHash("sha256").update(TXT).digest("hex");
  t("o texto final (v3): começa pelos termos da versão 2026-11-v3, UTF-8 sem BOM, em LF, título e dois ☐, sem asteriscos nem colchetes pendentes, hash esperado",TXT.startsWith("TERMOS DE USO E AVISO DE PRIVACIDADE DO POKEMATH — versão 2026-11-v3")&&TXT.charCodeAt(0)!==0xFEFF&&TXT.includes("\n"+TIT+"\n")&&ITENS.length===2&&!TXT.includes("*")&&!TXT.includes("\r")&&!/\[|\]/.test(TXT)&&!/TEXTO DE TESTE/.test(TXT)&&HASHT==="e053d23ad238368f1cf450d7e1bffca5b28ef3c0f455be41fbe4bc61c078f2a9",HASHT);
  t("config.js: chave autorizacao_estudante (v3 final) e a chave termos agora também é a v3 (mesmo arquivo da criança)",/autorizacao_estudante:\{versao:"2026-11-v3",arquivo:"dados\/consentimento_v3\.txt"\}/.test(lerArq("js/nuvem/config.js"))&&/termos:\{versao:"2026-11-v3",arquivo:"dados\/consentimento_v3\.txt"\}/.test(lerArq("js/nuvem/config.js")));
  t("sw.js: lista o texto v3, cache pokemath-v17 e cada arquivo falha sozinho",/dados\/consentimento_v3\.txt/.test(lerArq("sw.js"))&&/const V="pokemath-v17"/.test(lerArq("sw.js"))&&/Promise\.allSettled\(BASE\.map/.test(lerArq("sw.js"))&&!/addAll/.test(lerArq("sw.js")));
  srv.resp.RESP1.status="aprovado";srv.fnResp=null;srv.fnRede=false;srv.online=true;srv.fnLog=[];
  const aberturaResp=async(antes)=>{const logs=[];const dd=abrir("responsavel.html",srv,{},{antes:w=>{w.console.log=(...a)=>logs.push(a.join(" "));w.console.error=()=>{};w.console.warn=()=>{};if(antes)antes(w)}});await sleep(100);await entrarResp(dd,"mae@x.com","senha-forte-1");return{dd,w:dd.window,logs}};
  const passo1=(w,pin="1234",pin2=pin)=>{const nc=w.document.getElementById("nc");nc.elements.apelido.value="Teste";nc.elements.pin.value=pin;nc.elements.pin2.value=pin2;nc.dispatchEvent(new w.Event("submit",{cancelable:true,bubbles:true}))};
  const marcar=(w,nome,v)=>{const c=w.document.querySelector('#aut [name='+nome+']');c.checked=v;c.dispatchEvent(new w.Event("change",{bubbles:true}))};
  const enviar=async(w)=>{w.document.getElementById("aut").dispatchEvent(new w.Event("submit",{cancelable:true,bubbles:true}));await sleep(400)};
  const erroTela=w=>{const e=w.document.querySelector(".erro");return e?e.textContent:""};
  let A=await aberturaResp();W=A.w;
  t("passo 1: o botão agora é 'Continuar' e as autorizações ainda não aparecem",/Continuar/.test(W.document.querySelector("#nc button.grande").textContent)&&!W.document.getElementById("aut"));
  passo1(W);await sleep(400);
  t("passo 2: aparece 'Autorizações para este estudante' com DUAS caixas, as duas DESMARCADAS",/Autorizações para este estudante/.test(txt(W))&&W.document.querySelectorAll("#aut input[type=checkbox]").length===2&&[...W.document.querySelectorAll("#aut input[type=checkbox]")].every(c=>!c.checked));
  const spans=[...W.document.querySelectorAll("#aut .chk span")].map(x=>x.textContent);
  t("o texto das caixas é EXATAMENTE o dos itens ☐ do arquivo (com as quebras de linha)",spans[0]===ITENS[0]&&spans[1]===ITENS[1]&&ITENS[0].length>100&&ITENS[1].length>100,JSON.stringify(spans).slice(0,200));
  t("nenhum texto das autorizações está no código do app",!/TEXTO DE TESTE|Declaro que sou mãe/.test(lerArq("js/nuvem/responsavel.js")+lerArq("js/nuvem/config.js")));
  t("o hash do texto exato é registrado no console",A.logs.some(l=>l.includes(HASHT)&&l.includes("2026-11-v3")),A.logs.join("|").slice(0,200));
  t("'Cadastrar criança' começa DESABILITADO; só habilita com a caixa 1; a caixa 2 sozinha não habilita",W.document.getElementById("aut-ok").disabled===true&&(marcar(W,"acomp",true),W.document.getElementById("aut-ok").disabled===true)&&(marcar(W,"perfil",true),W.document.getElementById("aut-ok").disabled===false)&&(marcar(W,"perfil",false),W.document.getElementById("aut-ok").disabled===true));
  clicar(W,"#aut-doc");await sleep(50);
  t("'Ler o documento completo' mostra o texto INTEIRO, idêntico ao arquivo",W.document.getElementById("aut-texto")&&W.document.getElementById("aut-texto").textContent===TXT);
  t("o documento aberto e as caixas marcadas sobrevivem ao redesenho",W.document.querySelector('#aut [name=acomp]').checked===true);
  t("até aqui nada foi enviado ao servidor para criar criança",srv.fnLog.length===0);
  /* voltar sem criar */
  const nCh=srv.log.length;clicar(W,"#aut-volta");await sleep(100);
  t("'Voltar sem criar o perfil': volta ao passo 1, não chama o servidor e não guarda a senha",!W.document.getElementById("aut")&&!!W.document.getElementById("nc")&&W.document.getElementById("nc").elements.pin.value===""&&W.document.getElementById("nc").elements.pin2.value===""&&W.document.getElementById("nc").elements.apelido.value===""&&srv.fnLog.length===0&&srv.log.length===nCh);
  t("a senha digitada não ficou em lugar nenhum da página nem no armazenamento",!W.document.body.innerHTML.includes("1234")&&![...Array(W.localStorage.length).keys()].some(i=>(W.localStorage.getItem(W.localStorage.key(i))||"").includes('"pin":"1234"')));
  /* só caixa 1 */
  passo1(W);await sleep(400);marcar(W,"perfil",true);await enviar(W);
  let envio=srv.fnLog[srv.fnLog.length-1]||{};
  t("só a caixa 1: pedido com versão, hash correto, perfil:true e acompanhamento:false",envio.acao==="criar"&&envio.apelido==="Teste"&&envio.pin==="1234"&&JSON.stringify(envio.consentimento)===JSON.stringify({versao:"2026-11-v3",hash:HASHT,perfil:true,acompanhamento:false}),JSON.stringify(envio.consentimento));
  t("criada: mostra o código novo e volta ao passo 1 limpo",/K7M2QP/.test(txt(W))&&!!W.document.getElementById("nc")&&!W.document.getElementById("aut")&&W.document.getElementById("nc").elements.pin.value==="");
  /* as duas caixas */
  passo1(W);await sleep(400);marcar(W,"perfil",true);marcar(W,"acomp",true);await enviar(W);
  envio=srv.fnLog[srv.fnLog.length-1];
  t("caixas 1 e 2: acompanhamento:true no pedido",envio.consentimento.perfil===true&&envio.consentimento.acompanhamento===true&&envio.consentimento.hash===HASHT);
  /* erros da função */
  const PROIBIDO=/erro 5\d\d|erro 4\d\d|\{|\}|"erro"|eyJ|sb_|undefined|null|Failed to fetch|JWT|SQL/i;
  const casos=[
    ["falha ao registrar",[{erro:"falha_ao_registrar_autorizacao",mensagem:"Não foi possível registrar as autorizações, por isso a criança NÃO foi cadastrada. Tente de novo."},502],/NÃO foi cadastrada/],
    ["perfil obrigatório (servidor)",[{erro:"consentimento_perfil_obrigatorio",mensagem:"Para cadastrar a criança, é preciso marcar a autorização para criar o perfil dela."},400],/autorização para criar o perfil/],
    ["texto não configurado",[{erro:"texto_consentimento_nao_configurado",mensagem:"O texto de consentimento ainda não está configurado no servidor. Fale com a pessoa responsável pelo Pokemath."},500],/Fale com a pessoa responsável/],
    ["erro desconhecido",[{erro:"qualquer_coisa_tecnica",detalhe:"stack SQL eyJxxx"},500],/Não consegui cadastrar agora\. Tente de novo em instantes\./],
    ["resposta sem corpo",[null,502],/Não consegui cadastrar agora\. Tente de novo em instantes\./]];
  for(const [nome,resp,re] of casos){
    passo1(W);await sleep(400);marcar(W,"perfil",true);srv.fnResp=()=>resp;await enviar(W);const e=erroTela(W);
    t("erro da função ("+nome+"): mensagem em português, sem código/JSON/chave, e o formulário segue no passo 2",re.test(e)&&!PROIBIDO.test(e)&&!!W.document.getElementById("aut"),e);
    clicar(W,"#aut-volta");await sleep(50)}
  passo1(W);await sleep(400);marcar(W,"perfil",true);srv.fnResp=null;srv.fnRede=true;await enviar(W);
  t("falha de rede ao criar: 'Não consegui cadastrar agora. Tente de novo em instantes.' sem texto técnico",/Não consegui cadastrar agora\. Tente de novo em instantes\./.test(erroTela(W))&&!PROIBIDO.test(erroTela(W)));srv.fnRede=false;
  clicar(W,"#aut-volta");await sleep(50);
  passo1(W);await sleep(400);marcar(W,"perfil",true);marcar(W,"acomp",true);srv.fnResp=()=>[{erro:"texto_consentimento_invalido",mensagem:"O texto mudou. Recarregue a página."},400];await enviar(W);
  t("texto não confere: recarrega o documento, desmarca as caixas e pede para ler de novo",/foi atualizado\. Leia de novo/.test(erroTela(W))&&!!W.document.getElementById("aut")&&[...W.document.querySelectorAll("#aut input[type=checkbox]")].every(c=>!c.checked)&&W.document.getElementById("aut-ok").disabled===true);
  clicar(W,"#aut-volta");await sleep(50);
  passo1(W);await sleep(400);marcar(W,"perfil",true);srv.fnResp=()=>[{erro:"limite_de_criancas"},409];await enviar(W);
  t("limite de 10 crianças: mensagem em português e volta ao passo 1",/máximo de 10 crianças/.test(erroTela(W))&&!!W.document.getElementById("nc"));
  passo1(W);await sleep(400);marcar(W,"perfil",true);srv.fnResp=()=>[{erro:"falha_ao_desfazer",mensagem:"Não foi possível registrar as autorizações e o cadastro da criança não pôde ser desfeito. Não use esse cadastro: fale com a pessoa responsável pelo Pokemath para removê-lo."},500];await enviar(W);
  t("falha ao desfazer: mostra o aviso da função e atualiza a lista",/não pôde ser desfeito/.test(erroTela(W))&&!PROIBIDO.test(erroTela(W))&&!!W.document.getElementById("nc"));
  srv.fnResp=null;A.dd.window.close();
  /* texto fora do formato esperado bloqueia o formulário */
  const variantes=[["sem o título",TXT.replace(TIT,"OUTRO TÍTULO")],["só um ☐",TXT.replace(/☐ Autorização opcional[\s\S]*$/,"")],["três ☐",TXT+"\n☐ Mais uma autorização que não deveria existir.\n"],["sem itens",TXT.split("☐")[0]],["arquivo ausente (404)",null]];
  for(const [nome,conteudo] of variantes){
    const antes=w=>{const f0=w.fetch;w.fetch=async(u,o)=>String(u).includes("consentimento_v3")?(conteudo===null?{ok:false,status:404,text:async()=>""}:{ok:true,text:async()=>conteudo}):f0(u,o)};
    srv.fnLog=[];const B=await aberturaResp(antes);passo1(B.w);await sleep(400);
    t("texto sem o formato esperado ("+nome+"): bloqueia — sem caixas, sem 'Cadastrar criança', com 'Voltar'",/Não consegui carregar o texto das autorizações/.test(B.w.document.getElementById("app").textContent)&&!B.w.document.querySelector("#aut input[type=checkbox]")&&!B.w.document.getElementById("aut-ok")&&!!B.w.document.getElementById("aut-volta")&&srv.fnLog.length===0);
    B.dd.window.close()}
  /* o cadastro do RESPONSÁVEL continua como antes (texto e versão da chave termos) */
  const dC=abrir("responsavel.html",srv,{});await sleep(100);clicar(dC.window,"#m2");await sleep(300);
  t("cadastro do responsável: mostra o texto v3 INTEIRO (idêntico ao arquivo da criança) com as 2 caixas do cadastro",dC.window.document.getElementById("termos").textContent===TXT&&!!dC.window.document.querySelector('[name="aceito"]')&&!!dC.window.document.querySelector('[name="resp"]'));dC.window.close();

  /* ===== 14) TROCA DE CRIANÇA NO MESMO APARELHO (aba da A aberta, B entra) ===== */
  class Mem{constructor(i={}){this.m=new Map(Object.entries(i))}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}get length(){return this.m.size}key(i){return [...this.m.keys()][i]??null}clear(){this.m.clear()}}
  const aba=(arq,sv,ST,antes)=>abrir(arq,sv,{}, {antes:w=>{Object.defineProperty(w,"localStorage",{value:ST,configurable:true});if(antes)antes(w)}});   // abas do MESMO navegador compartilham o armazenamento
  const moedasNuvem=(sv,id)=>sv.prog[id]?sv.prog[id].estado.coins:null;
  const novoSrv=()=>{const sv=new Servidor();sv.addResp("R1","r@x.com","pw12345678","Resp","aprovado");sv.add(ID_A,"ANA234","a3","7391","Ana");sv.add(ID_B,"BIA567","a5","2468","Bia");sv.cri[ID_A].resp="R1";sv.cri[ID_B].resp="R1";return sv};
  const entrarC=async(sv,ST,cod,av,pin,marcarLegado)=>{const dd=aba("entrar.html",sv,ST);await sleep(120);if(marcarLegado){const c=dd.window.document.getElementById("legado");c.checked=true;c.dispatchEvent(new dd.window.Event("change",{bubbles:true}))}digitar(dd.window,{codigo:cod,avatar:av,pin});await sleep(500);return dd};
  let SV=novoSrv(),ST=new Mem();
  await entrarC(SV,ST,"ANA234","a3","7391");
  const abaA=aba("index.html",SV,ST);await sleep(700);
  abaA.window.eval("S.coins=53;save()");await abaA.window.Nuvem._empurrar();
  t("A jogou: a nuvem de A tem as moedas dela",moedasNuvem(SV,ID_A)===53);
  await entrarC(SV,ST,"BIA567","a5","2468");                       // B entra no mesmo navegador, sem fechar a aba da A
  abaA.window.dispatchEvent(new abaA.window.StorageEvent("storage",{key:"pm-sessao"}));await sleep(100);   // o navegador avisa as outras abas
  t("a aba da A percebe NA HORA que outra criança entrou (para de sincronizar e avisa)",abaA.window.Nuvem.estado().estado==="trocada"&&/Outra criança entrou neste aparelho\. Entre de novo para continuar\./.test((abaA.window.document.getElementById("pm-trocada")||{textContent:""}).textContent),abaA.window.Nuvem.estado().estado);
  SV.log.length=0;
  abaA.window.document.dispatchEvent(new abaA.window.Event("visibilitychange"));await sleep(800);
  abaA.window.eval("S.coins=60;save()");await abaA.window.Nuvem._tudo();await abaA.window.Nuvem._empurrar();await abaA.window.Nuvem.sincronizarAgora();await sleep(300);
  const envB=SV.log.filter(x=>/pm_salvar_progresso|\/rest\/v1\/(progresso|configuracoes)/.test(x.url)&&SV.tok[(x.h.Authorization||"").replace("Bearer ","")]===ID_B);
  t("a aba da A NÃO faz nenhuma chamada com o token de B (nem envio, nem leitura)",envB.length===0,envB.length);
  t("a linha de B na nuvem NÃO recebe o progresso de A",moedasNuvem(SV,ID_B)!==53&&moedasNuvem(SV,ID_B)!==60,moedasNuvem(SV,ID_B));
  t("a aba da A parou de vez: nenhuma chamada ao servidor depois do aviso",SV.log.filter(x=>x.url.includes("/rest/v1/")||x.url.includes("/auth/v1/")).length===0,SV.log.length);
  t("o progresso local de A segue intacto no aparelho (inclusive o que jogou depois do aviso)",lerJ(ST.getItem("pokemath-estado-"+ID_A)).coins===60&&moedasNuvem(SV,ID_A)===53);
  const abaB=aba("index.html",SV,ST);await sleep(1200);
  t("B abre o jogo com 0 moedas e sem adoção de progresso de outra criança",abaB.window.eval("S.coins")===0&&abaB.window.Nuvem.estado().adocao===false);
  t("a linha de B (se existir) começa com zero",moedasNuvem(SV,ID_B)===null||moedasNuvem(SV,ID_B)===0,moedasNuvem(SV,ID_B));
  abaA.window.eval("Nuvem.sair()");await sleep(300);
  t("'Sair desta conta' na aba parada da A NÃO desconecta a B",JSON.parse(ST.getItem("pm-sessao")||"null")&&JSON.parse(ST.getItem("pm-sessao")).id===ID_B);
  /* mesma troca, sem o aviso de armazenamento (aba em segundo plano): a primeira ação já detecta */
  SV=novoSrv();ST=new Mem();await entrarC(SV,ST,"ANA234","a3","7391");
  const abaA2=aba("index.html",SV,ST);await sleep(700);abaA2.window.eval("S.coins=53;save()");await abaA2.window.Nuvem._empurrar();
  await entrarC(SV,ST,"BIA567","a5","2468");SV.log.length=0;
  abaA2.window.document.dispatchEvent(new abaA2.window.Event("visibilitychange"));await sleep(900);
  t("sem o aviso do navegador: ao voltar para a aba, a da A também não envia nada com o token de B",moedasNuvem(SV,ID_B)===null&&abaA2.window.Nuvem.estado().estado==="trocada",moedasNuvem(SV,ID_B));
  t("sessão da própria criança continua funcionando normalmente (sem falso alarme)",await (async()=>{const sv2=novoSrv(),S2=new Mem();await entrarC(sv2,S2,"ANA234","a3","7391");const a3=aba("index.html",sv2,S2);await sleep(700);a3.window.eval("S.coins=9;save()");await a3.window.Nuvem._empurrar();return moedasNuvem(sv2,ID_A)===9&&a3.window.Nuvem.estado().estado!=="trocada"})());

  /* --- 14b) trava direta de token (cliente.js) --- */
  {const sv=novoSrv(),S3=new Mem();await entrarC(sv,S3,"ANA234","a3","7391");
   const a=aba("index.html",sv,S3);await sleep(700);
   const antes=await a.window.PM.tokenCrianca();
   t("sessão do aparelho é da própria criança da página: PM.tokenCrianca() devolve token",typeof antes==="string"&&antes.length>0);
   await entrarC(sv,S3,"BIA567","a5","2468");                     // pm-sessao agora é da B; a página continua sendo da A
   t("a página é da A e a sessão do aparelho é da B (preparo do teste)",a.window.PM_SESSAO.id===ID_A&&JSON.parse(S3.getItem("pm-sessao")).id===ID_B);
   t("PM.tokenCrianca() devolve null quando a sessão do aparelho é de OUTRA criança",(await a.window.PM.tokenCrianca())===null,String(await a.window.PM.tokenCrianca()).slice(0,6));
   t("PM.tokenCrianca(true) (renovar) também devolve null",(await a.window.PM.tokenCrianca(true))===null);}
  /* --- 14c) parada no meio do jogo --- */
  {const sv=novoSrv(),S4=new Mem();await entrarC(sv,S4,"ANA234","a3","7391");
   const a=aba("index.html",sv,S4);await sleep(700);
   a.window.eval("S.coins=20;save()");await a.window.Nuvem._empurrar();
   a.window.eval("S.coins=31;save()");                              // A está jogando (progresso ainda não enviado)
   await entrarC(sv,S4,"BIA567","a5","2468");                       // B entra no mesmo navegador
   sv.log.length=0;
   a.window.dispatchEvent(new a.window.StorageEvent("storage",{key:"pm-sessao"}));await sleep(100);
   a.window.eval("S.coins=45;save()");await a.window.Nuvem._tudo();await a.window.Nuvem._empurrar();await sleep(300);
   const comB=sv.log.filter(x=>sv.tok[(x.h.Authorization||"").replace("Bearer ","")]===ID_B);
   t("meio do jogo: a aba da A mostra o aviso 'Outra criança entrou neste aparelho'",/Outra criança entrou neste aparelho/.test((a.window.document.getElementById("pm-trocada")||{textContent:""}).textContent),a.window.Nuvem.estado().estado);
   t("meio do jogo: a aba da A não envia nada com o token da B",comB.length===0,comB.length);
   t("meio do jogo: a nuvem da B não recebeu moedas da A e a da A não recebeu o que veio depois",moedasNuvem(sv,ID_B)===null&&moedasNuvem(sv,ID_A)===20,moedasNuvem(sv,ID_B)+"/"+moedasNuvem(sv,ID_A));
   t("meio do jogo: o progresso local da A segue guardado no aparelho",lerJ(S4.getItem("pokemath-estado-"+ID_A)).coins===45);}
  {const sv=novoSrv(),S5=new Mem();await entrarC(sv,S5,"ANA234","a3","7391");
   const a=aba("index.html",sv,S5);await sleep(700);
   a.window.eval("S.coins=20;save()");await a.window.Nuvem._empurrar();
   S5.removeItem("pm-sessao");sv.log.length=0;                       // a chave da sessão some no meio do jogo
   a.window.dispatchEvent(new a.window.StorageEvent("storage",{key:"pm-sessao"}));await sleep(100);
   a.window.eval("S.coins=45;save()");await a.window.Nuvem._tudo();await a.window.Nuvem._empurrar();await sleep(300);
   const autenticadas=sv.log.filter(x=>sv.tok[(x.h.Authorization||"").replace("Bearer ","")]);
   t("sessão removida no meio do jogo: a aba não envia nada autenticado",autenticadas.length===0&&moedasNuvem(sv,ID_A)===20,autenticadas.length+"/"+moedasNuvem(sv,ID_A));
   t("sessão removida: o progresso local segue guardado",lerJ(S5.getItem("pokemath-estado-"+ID_A)).coins===45);}

  /* ===== 15) progresso antigo do aparelho: nunca marcado sozinho ===== */
  SV=novoSrv();ST=new Mem({"tabuada-pokemon-v1":JSON.stringify({coins:53,streak:1,last:null,caught:{},comp:25,tutorialVisto:true,cfg:{}})});
  for(const [cod,av,pin,id] of [["ANA234","a3","7391",ID_A],["BIA567","a5","2468",ID_B]]){
    const e=aba("entrar.html",SV,ST);await sleep(120);const cx=e.window.document.getElementById("legado");
    t("a caixa 'Trazer o progresso que já está salvo neste aparelho' existe e NÃO vem marcada ("+cod+")",!!cx&&cx.checked===false);
    digitar(e.window,{codigo:cod,avatar:av,pin});await sleep(500);const jj=aba("index.html",SV,ST);await sleep(800);
    t("criança nova ("+cod+") começa com zero na nuvem, sem importar nada sem pedir",moedasNuvem(SV,id)===null||moedasNuvem(SV,id)===0,moedasNuvem(SV,id))}
  SV=novoSrv();ST=new Mem({"tabuada-pokemon-v1":JSON.stringify({coins:53,streak:1,last:null,caught:{},comp:25,tutorialVisto:true,cfg:{}})});
  {const e=aba("entrar.html",SV,ST);await sleep(120);const cx=e.window.document.getElementById("legado");cx.checked=true;cx.dispatchEvent(new e.window.Event("change",{bubbles:true}));
   clicar(e.window,'[data-av="a3"]');t("a escolha de trazer o progresso antigo sobrevive ao redesenho da tela (figura/teclado)",e.window.document.getElementById("legado").checked===true);
   digitar(e.window,{codigo:"ANA234",avatar:"a3",pin:"7391"});await sleep(500);const jj=aba("index.html",SV,ST);await sleep(800);
   t("se a criança MARCAR a caixa, o progresso antigo é trazido (escolha explícita)",moedasNuvem(SV,ID_A)===53,moedasNuvem(SV,ID_A))}

  /* ===== 16) botão 'Cadastrar criança' só com a caixa 1 ===== */
  srv.resp.RESP1.status="aprovado";srv.fnResp=null;srv.fnRede=false;srv.online=true;srv.fnLog=[];
  {const A16=await aberturaResp();const w16=A16.w;passo1(w16);await sleep(400);
   const okb=()=>w16.document.getElementById("aut-ok"),cx16=n=>w16.document.querySelector('#aut [name='+n+']'),ajuda=()=>w16.document.getElementById("aut-ajuda")||{hidden:null,textContent:""};
   cx16("acomp").click();
   t("SÓ a caixa 2 (clique real): o botão 'Cadastrar criança' continua desabilitado",okb().disabled===true);
   t("SÓ a caixa 2: o botão também avisa que está desabilitado (aria-disabled) para leitores de tela",okb().getAttribute("aria-disabled")==="true");
   t("enquanto a caixa 1 não está marcada, aparece a explicação ao lado do botão",!!ajuda()&&!ajuda().hidden&&/primeira autorização/.test(ajuda().textContent));
   w16.document.querySelector("#aut .chk span").click();
   t("caixa 1 marcada (clicando no texto): o botão habilita e a explicação some",okb().disabled===false&&ajuda().hidden===true);
   cx16("perfil").click();
   t("caixa 1 desmarcada com a caixa 2 ainda marcada: volta a desabilitar",okb().disabled===true&&cx16("acomp").checked===true&&!ajuda().hidden);
   const n0=srv.fnLog.length;w16.document.getElementById("aut").dispatchEvent(new w16.Event("submit",{cancelable:true,bubbles:true}));await sleep(300);
   t("envio forçado (Enter/submit) só com a caixa 2: nada é enviado ao servidor",srv.fnLog.length===n0);
   cx16("perfil").checked=true;cx16("perfil").dispatchEvent(new w16.Event("input",{bubbles:true}));
   t("o botão segue o estado REAL da caixa 1, mesmo que o navegador avise só por 'input'",okb().disabled===false);
   cx16("perfil").checked=false;cx16("perfil").dispatchEvent(new w16.Event("input",{bubbles:true}));
   t("e desabilita de novo pelo mesmo caminho",okb().disabled===true);
   t("o botão desabilitado tem aparência própria e clara (css/nuvem.css)",/#aut-ok:disabled/.test(lerArq("css/nuvem.css")));
   A16.dd.window.close()}

  /* ===== 17) PIN com olho, Novo PIN, edição de apelido/ano/idade e cópia dos dados ===== */
  srv.resp.RESP1.status="aprovado";srv.fnResp=null;srv.fnRede=false;srv.online=true;srv.fnLog=[];srv.pinLog=[];srv.falhaCE=false;
  try{const cap={logs:[],blobs:[],prompts:0};
   const A17=await aberturaResp(w=>{const reg=(...a)=>cap.logs.push(a.map(x=>{try{return typeof x==="string"?x:JSON.stringify(x)}catch{return String(x)}}).join(" "));w.console.log=reg;w.console.warn=reg;w.console.error=reg;
     w.prompt=()=>{cap.prompts++;return null};w.Blob=function(partes){this.partes=partes};w.URL.createObjectURL=b=>{cap.blobs.push(b);return"blob:teste"};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){}});
   const w17=A17.w,d17=w17.document,q=s=>d17.querySelector(s),sp=ms=>sleep(ms);
   const tipo=id=>{const e=d17.getElementById(id);return e?e.type:null};
   const olho=id=>q('[data-olho="'+id+'"]');
   /* --- olho no cadastro --- */
   t("cadastro: os dois campos de PIN nascem como password (ocultos) e cada um tem seu olho desligado",tipo("cad-pin")==="password"&&tipo("cad-pin2")==="password"&&!!olho("cad-pin")&&!!olho("cad-pin2")&&olho("cad-pin").getAttribute("aria-pressed")==="false"&&olho("cad-pin2").getAttribute("aria-pressed")==="false");
   d17.getElementById("cad-pin").value="5731";olho("cad-pin").click();
   t("cadastro: tocar no olho mostra o número (type=text), muda só esse campo e não mexe no valor",tipo("cad-pin")==="text"&&tipo("cad-pin2")==="password"&&d17.getElementById("cad-pin").value==="5731"&&olho("cad-pin").getAttribute("aria-pressed")==="true");
   olho("cad-pin").click();
   t("cadastro: tocar de novo no olho volta a ocultar",tipo("cad-pin")==="password"&&olho("cad-pin").getAttribute("aria-pressed")==="false");
   olho("cad-pin").click();q("[data-av]").click();await sp(50);
   t("cadastro: ao redesenhar a tela (trocar a figura) o PIN volta a ficar oculto",tipo("cad-pin")==="password"&&tipo("cad-pin2")==="password");
   /* --- Novo PIN: painel no lugar do prompt() --- */
   const idA=srv.resp.RESP1&&Object.values(srv.cri).find(c=>c.resp==="RESP1").id;
   q('[data-a="pin"][data-id="'+idA+'"]').click();await sp(300);
   t("Novo PIN: abre um painel com campo e olho (não usa o prompt() do navegador)",!!d17.getElementById("np")&&cap.prompts===0&&!!olho("np-pin"));
   t("Novo PIN: o campo nasce como password e o olho desligado",tipo("np-pin")==="password"&&olho("np-pin").getAttribute("aria-pressed")==="false");
   olho("np-pin").click();d17.getElementById("np-pin").value="4821";
   t("Novo PIN: o olho mostra o número digitado e só altera o tipo do campo",tipo("np-pin")==="text"&&d17.getElementById("np-pin").value==="4821");
   d17.getElementById("np-pin").value="12a4";d17.getElementById("np").dispatchEvent(new w17.Event("submit",{cancelable:true,bubbles:true}));await sp(300);
   t("Novo PIN: valor que não são 4 números → mensagem em português e nada é enviado",/A senha precisa ter exatamente 4 números/.test(erroTela(w17))&&srv.pinLog.length===0);
   t("Novo PIN: depois de uma mensagem, o painel redesenhado volta a ocultar e o campo vem vazio",tipo("np-pin")==="password"&&d17.getElementById("np-pin").value==="");
   d17.getElementById("np-pin").value="4821";d17.getElementById("np").dispatchEvent(new w17.Event("submit",{cancelable:true,bubbles:true}));await sp(400);
   t("Novo PIN: chama a mesma RPC de sempre (pm_redefinir_pin) com a criança certa e confirma em português",srv.pinLog.length===1&&srv.pinLog[0].p_crianca===idA&&srv.pinLog[0].p_pin==="4821"&&/Nova senha de Ana salva\. As tentativas erradas foram zeradas/.test(d17.body.textContent)&&!d17.getElementById("np"));
   const guardado=[...Object.keys(w17.localStorage).map(k=>k+"="+w17.localStorage.getItem(k)),...Object.keys(w17.sessionStorage).map(k=>k+"="+w17.sessionStorage.getItem(k))].join("\n");
   t("PIN digitado nunca fica no localStorage nem no sessionStorage",!/4821|5731/.test(guardado),guardado.length);
   t("PIN digitado nunca aparece no console (log, aviso ou erro)",!cap.logs.some(l=>/4821|5731/.test(l)),cap.logs.filter(l=>/4821|5731/.test(l))[0]);
   t("PIN digitado não fica na tela depois de salvar (nenhum campo guarda o valor)",![...d17.querySelectorAll("input")].some(i=>/4821|5731/.test(i.value))&&!/4821|5731/.test(d17.body.innerHTML.replace(/<script[\s\S]*?<\/script>/g,"")));
   /* --- Editar apelido, ano e idade --- */
   const cardTxt=()=>d17.querySelector(".crianca .dados").textContent;
   q('[data-a="editar"][data-id="'+idA+'"]').click();await sp(300);
   const ed=()=>d17.getElementById("ed");
   t("Editar: abre o painel já preenchido com apelido, ano e idade atuais",!!ed()&&ed().elements.apelido.value==="Ana"&&ed().elements.ano.value==="6"&&ed().elements.idade.value==="11");
   t("Editar: mostra o aviso dos anos liberados e o aviso de que a criança vê o novo apelido ao entrar de novo",/anos liberados não mudam ao trocar o ano escolar; ajuste em ⚙ Ajustes/.test(d17.getElementById("ed-avisos").textContent)&&/A criança vê o novo apelido na próxima vez que entrar/.test(d17.getElementById("ed-avisos").textContent));
   const envia=async(ap,an,id_)=>{ed().elements.apelido.value=ap;ed().elements.ano.value=an;ed().elements.idade.value=id_;srv.fnLog=[];ed().dispatchEvent(new w17.Event("submit",{cancelable:true,bubbles:true}));await sp(400)};
   await envia("   ","7","12");t("Editar: apelido vazio → mensagem em português e nada enviado",/O apelido precisa ter de 1 a 30 caracteres/.test(erroTela(w17))&&srv.fnLog.length===0);
   q('[data-a="editar"][data-id="'+idA+'"]').click();await sp(200);
   await envia("a".repeat(31),"7","12");t("Editar: apelido com 31 caracteres → mensagem e nada enviado",srv.fnLog.length===0&&/apelido/i.test(erroTela(w17))||d17.getElementById("ed").elements.apelido.value.length<=30);
   q('[data-a="editar"][data-id="'+idA+'"]').click();await sp(200);
   await envia("Aninha","7","4");t("Editar: idade 4 → 'A idade precisa ser de 5 a 18 anos' e nada enviado",/A idade precisa ser de 5 a 18 anos/.test(erroTela(w17))&&srv.fnLog.length===0);
   q('[data-a="editar"][data-id="'+idA+'"]').click();await sp(200);
   await envia("Aninha","","12");t("Editar: ano fora do 3º ao 9º → mensagem e nada enviado",/O ano escolar precisa ser do 3º ao 9º ano/.test(erroTela(w17))&&srv.fnLog.length===0);
   q('[data-a="editar"][data-id="'+idA+'"]').click();await sp(200);
   const nPatch0=srv.log.filter(x=>x.metodo==="PATCH").length;const lib0=JSON.stringify(srv.conf[idA]);
   await envia("  Aninha  ","7","12");const ev=srv.fnLog[srv.fnLog.length-1]||{};
   t("Editar: envia SÓ acao, crianca_id, apelido (sem espaços), ano_escolar e idade — nada de PIN, avatar, código ou responsável",JSON.stringify(Object.keys(ev).sort())===JSON.stringify(["acao","ano_escolar","apelido","crianca_id","idade"])&&ev.acao==="editar"&&ev.crianca_id===idA&&ev.apelido==="Aninha"&&ev.ano_escolar===7&&ev.idade===12,JSON.stringify(ev));
   t("Editar: confirma em português, fecha o painel e o cartão mostra os dados novos",/Dados de Aninha salvos\. A criança vê o novo apelido na próxima vez que entrar/.test(d17.body.textContent)&&!d17.getElementById("ed")&&/Aninha/.test(cardTxt())&&/7º ano/.test(cardTxt())&&/12 anos/.test(cardTxt()));
   t("Editar: não mexe nos anos liberados (nenhum PATCH em configuracoes)",srv.log.filter(x=>x.metodo==="PATCH").length===nPatch0&&JSON.stringify(srv.conf[idA])===lib0,lib0);
   const casos=[[{erro:"nao_encontrada",mensagem:"Essa criança não está na sua conta."},404,/Essa criança não está na sua conta/],[{erro:"falha_ao_consultar",mensagem:"Não consegui consultar a criança agora. Tente de novo."},502,/Não consegui consultar a criança agora/],[{erro:"falha_ao_salvar",mensagem:"Não consegui salvar agora. Tente de novo."},502,/Não consegui salvar agora/],[{erro:"duplicada",mensagem:"Há mais de um cadastro com esse identificador. Nada foi alterado."},409,/Há mais de um cadastro/],[{erro:"qualquer_coisa_tecnica_do_servidor"},500,/Não consegui salvar agora\. Tente de novo em instantes\./]];
   for(const [corpoR,st,rx] of casos){q('[data-a="editar"][data-id="'+idA+'"]').click();await sp(200);srv.fnResp=()=>[corpoR,st];await envia("Aninha","7","12");t("Editar: resposta '"+corpoR.erro+"' ("+st+") → mensagem em português na tela",rx.test(erroTela(w17))&&!/qualquer_coisa_tecnica/.test(d17.body.textContent),erroTela(w17))}
   q('[data-a="editar"][data-id="'+idA+'"]').click();await sp(200);srv.fnResp=null;srv.fnRede=true;await envia("Aninha","7","12");srv.fnRede=false;
   t("Editar: sem internet → mensagem em português (sem erro técnico)",/Não consegui salvar agora\. Tente de novo em instantes/.test(erroTela(w17)));
   srv.fnResp=null;
   /* --- cópia dos dados do responsável --- */
   cap.blobs.length=0;srv.log.length=0;
   q('[data-a="dados"][data-id="'+idA+'"]').click();await sp(500);
   const exp=cap.blobs[0]?JSON.parse(cap.blobs[0].partes.join("")):null;
   t("Dados: o arquivo inclui os dados do responsável (nome, e-mail, status) e o histórico de autorizações do responsável e do estudante",!!exp&&exp.responsavel&&exp.responsavel.nome==="Mãe da Ana"&&exp.responsavel.email==="mae@x.com"&&exp.responsavel.status==="aprovado"&&Array.isArray(exp.autorizacoes_do_responsavel)&&exp.autorizacoes_do_responsavel.length>=1&&Array.isArray(exp.autorizacoes_do_estudante)&&exp.autorizacoes_do_estudante[0].tipo==="perfil"&&exp.autorizacoes_do_estudante[0].texto_hash.length===64,JSON.stringify(exp).slice(0,200));
   t("Dados: o arquivo continua com ficha, progresso e configurações da criança",!!exp&&Array.isArray(exp.ficha)&&exp.ficha[0].codigo&&Array.isArray(exp.progresso)&&Array.isArray(exp.configuracoes));
   const txtExp=cap.blobs[0]?cap.blobs[0].partes.join(""):"";
   t("Dados: o arquivo NUNCA contém pin_hash, auth_email, tokens, Bearer nem segredos",!/pin_hash|auth_email|access_token|refresh_token|Bearer|rtok-|service_role|secret/i.test(txtExp),txtExp.slice(0,120));
   const pedidos=srv.log.filter(x=>/\/rest\/v1\/(criancas|responsaveis|consentimentos)/.test(x.url)).map(x=>x.url).join("\n");
   t("Dados: as leituras listam as colunas uma a uma (nenhum select=* nas tabelas de pessoas nem coluna secreta)",/responsaveis\?select=id,nome,email,status,criado_em/.test(pedidos)&&/consentimentos_estudante\?select=tipo,versao_texto,texto_hash,aceito_em,retirado_em/.test(pedidos)&&!/select=\*|pin_hash|auth_email/.test(pedidos),pedidos.slice(0,200));
   {const lidas=srv.log.filter(x=>x.metodo==="GET"&&/\/rest\/v1\//.test(x.url)).map(x=>x.url.replace(URL_SB,"")).filter(u=>!/responsaveis\?select=nome,status,criado_em$/.test(u)&&!/consentimentos\?select=versao_texto,texto_hash,aceito,aceito_em&order=aceito_em\.desc&limit=1$/.test(u));   // (a conferência de status e de aceite que vem antes de toda ação já usa colunas explícitas)
    const tab=u=>(u.match(/\/rest\/v1\/([a-z_]+)/)||[])[1],sel=u=>((u.match(/[?&]select=([^&]+)/)||[])[1]||"");
    t("Dados: são exatamente 6 leituras (ficha, progresso, configurações, responsável, autorizações do responsável e do estudante)",JSON.stringify(lidas.map(tab).sort())===JSON.stringify(["configuracoes","consentimentos","consentimentos_estudante","criancas","progresso","responsaveis"]),lidas.map(tab).join(","));
    t("Dados: TODAS as leituras usam select com colunas explícitas (nenhuma sem select, nenhuma com *)",lidas.length===6&&lidas.every(u=>sel(u)!==""&&!sel(u).includes("*")),lidas.filter(u=>sel(u)===""||sel(u).includes("*")).join(" | "));
    t("Dados: nenhuma leitura lista pin_hash, auth_email, dispositivo, token nem segredo",!lidas.some(u=>/pin_hash|auth_email|dispositivo|token|secret|segredo|senha|apikey/i.test(decodeURIComponent(u))),lidas.filter(u=>/pin_hash|auth_email|dispositivo|token|secret/i.test(u))[0]);
    const colunas=n=>sel(lidas.find(u=>tab(u)===n)||"").split(",").sort().join(",");
    t("Dados: progresso lê só colunas de progresso do jogo",colunas("progresso")==="ano_x".replace("ano_x","atualizado_em,companheiro_id,criado_em,crianca_id,estado,fases,moedas,nivel_companheiro,ofensiva_atual,ofensiva_maxima,pokemon,pokemon_total,ultimo_dia_estudo,versao,xp_companheiro"),colunas("progresso"));
    t("Dados: configurações lê só colunas de configuração",colunas("configuracoes")==="ano_escolar_liberado,atualizado_em,crianca_id,extras,questoes_por_fase,tempo_desafio,tempo_fase,tentativas_dia,versao",colunas("configuracoes"))}
   cap.blobs.length=0;srv.falhaCE=true;q('[data-a="dados"][data-id="'+idA+'"]').click();await sp(500);srv.falhaCE=false;
   t("Dados: se uma leitura falhar, avisa em português e NÃO baixa um arquivo incompleto",cap.blobs.length===0&&/Não consegui montar a cópia dos dados agora/.test(erroTela(w17)));
   /* --- a tela de ENTRADA da criança não ganha olho --- */
   const E17=abrir("entrar.html",srv,{},{});await sleep(300);
   t("entrada da criança: nenhum olho, nenhum campo de PIN comum (só o teclado de sempre)",!E17.window.document.querySelector("[data-olho],.olho")&&!E17.window.document.querySelector("input[type=password],input[name=pin]"));
   t("entrada da criança: entrar.js não tem nada de olho nem de campoPin",!/olho|campoPin|data-olho/.test(lerArq("js/nuvem/entrar.js")));
   E17.window.close();A17.dd.window.close()}catch(e){t("seção 17 abortou: a tela nova não tem o que o teste precisa ("+String(e.message).slice(0,80)+")",false)}


  /* ===== 18) TERMO DA CONTA = v3 INTEIRO; quem aceitou o v1 precisa aceitar o v3 ===== */
  try{
   const crypto_=require("crypto"),sha=x=>crypto_.createHash("sha256").update(x,"utf8").digest("hex");
   t("(18) o hash conhecido do v3 é o SHA-256 do arquivo dados/consentimento_v3.txt",sha(TXT)===H3,sha(TXT));
   const V1=[{versao_texto:"2026-11-v1",texto_hash:"h-antigo-v1",aceito:true,aceito_em:"2026-11-20T10:00:00Z"}];
   const novo18=(cons,status)=>{const sv=new Servidor();sv.addResp("R1","r@x.com","pw12345678","Resp",status||"aprovado",cons);sv.add(ID_A,"ANA234","a3","7391","Ana");sv.cri[ID_A].resp="R1";return sv};
   const abre18=async(sv,antes)=>{const dd=abrir("responsavel.html",sv,{},{antes:w=>{w.console.log=()=>{};w.console.error=()=>{};w.console.warn=()=>{};if(antes)antes(w)}});await sleep(100);await entrarResp(dd,"r@x.com","pw12345678");await sleep(150);return dd};
   const lidas18=sv=>sv.log.filter(x=>x.metodo==="GET"&&/\/rest\/v1\//.test(x.url)).map(x=>(x.url.replace(URL_SB,"").match(/\/rest\/v1\/([a-z_]+)/)||[])[1]);
   const marca=(w,v)=>{const c=w.document.getElementById("ac-chk");c.checked=v;c.dispatchEvent(new w.Event("change",{bubbles:true}))};
   /* --- A) conta antiga (último aceite = v1) --- */
   const sA=novo18(JSON.parse(JSON.stringify(V1))),dA=await abre18(sA),wA=dA.window,docA=wA.document;
   const histAntes=JSON.stringify(sA.resp.R1.cons);
   t("conta com aceite v1: aparece a tela de aceite com o texto v3 INTEIRO, idêntico ao arquivo",!!docA.getElementById("ac-ok")&&docA.getElementById("termos")&&docA.getElementById("termos").textContent===TXT);
   t("conta com aceite v1: a caixa 'Li e concordo' nasce DESMARCADA e 'Aceitar e continuar' nasce DESABILITADO",!!docA.getElementById("ac-chk")&&docA.getElementById("ac-chk").checked===false&&docA.getElementById("ac-ok").disabled===true&&/Aceitar e continuar/.test(docA.getElementById("ac-ok").textContent)&&/Li e concordo/.test(docA.getElementById("app").textContent));
   const tabs=lidas18(sA);
   t("conta com aceite v1: ANTES de aceitar nenhum dado de criança, progresso ou configuração foi lido",!tabs.some(x=>["criancas","progresso","configuracoes","consentimentos_estudante"].includes(x)),tabs.join(","));
   t("conta com aceite v1: o painel e os dados das crianças não aparecem",!/Minhas crianças|Cadastrar criança|ANA234|Ajustes/.test(docA.getElementById("app").textContent)&&!docA.getElementById("nc"));
   t("conta com aceite v1: 'Sair' e 'Excluir minha conta e meus dados' estão disponíveis sem aceitar",!!docA.getElementById("sair")&&!!docA.getElementById("exc-conta"));
   docA.getElementById("ac-ok").dispatchEvent(new wA.MouseEvent("click",{bubbles:true}));await sleep(150);
   t("'Aceitar e continuar' sem a caixa marcada não faz nada (nenhum envio, continua na tela de aceite)",sA.consPost.length===0&&!!docA.getElementById("ac-ok"));
   marca(wA,true);
   t("com a caixa marcada o botão é habilitado",docA.getElementById("ac-ok").disabled===false);
   marca(wA,false);
   t("desmarcando a caixa o botão volta a ficar desabilitado",docA.getElementById("ac-ok").disabled===true);
   marca(wA,true);docA.getElementById("ac-ok").click();await sleep(500);
   t("ao aceitar: grava UM registro novo com versão 2026-11-v3, hash do texto carregado, aceito=true e o id do responsável",sA.consPost.length===1&&sA.consPost[0].versao_texto==="2026-11-v3"&&sA.consPost[0].texto_hash===H3&&sA.consPost[0].aceito===true&&sA.consPost[0].responsavel_id==="R1"&&Object.keys(sA.consPost[0]).sort().join()==="aceito,responsavel_id,texto_hash,versao_texto",JSON.stringify(sA.consPost));
   t("ao aceitar: o registro antigo (v1) continua igual e o histórico só ganhou uma linha",sA.resp.R1.cons.length===2&&JSON.stringify(sA.resp.R1.cons[0])===JSON.stringify(JSON.parse(histAntes)[0])&&sA.resp.R1.cons[1].versao_texto==="2026-11-v3");
   t("ao aceitar: nenhum PATCH/DELETE em consentimentos (histórico não é alterado nem apagado)",!sA.log.some(x=>/consentimentos/.test(x.url)&&["PATCH","DELETE","PUT"].includes(x.metodo)));
   t("depois de aceitar: a conta lê normalmente e mostra o painel com a criança",lidas18(sA).includes("criancas")&&/Minhas crianças|ANA234/.test(docA.getElementById("app").textContent)&&!docA.getElementById("ac-ok"));
   dA.window.close();
   /* --- B) conta com aceite v3: entra direto --- */
   const sB=novo18(),dB=await abre18(sB);
   t("conta que já aceitou o v3: entra direto no painel, sem tela de aceite e sem gravar nada",!dB.window.document.getElementById("ac-ok")&&sB.consPost.length===0&&lidas18(sB).includes("criancas"));dB.window.close();
   /* --- C) última linha decide: v3 recusado (aceito=false) não vale --- */
   const sC=novo18([{versao_texto:"2026-11-v1",texto_hash:"x",aceito:true,aceito_em:"2026-11-20T10:00:00Z"},{versao_texto:"2026-11-v3",texto_hash:H3,aceito:false,aceito_em:"2026-11-25T10:00:00Z"}]),dC2=await abre18(sC);
   t("último registro com aceito=false (mesmo sendo v3) NÃO vale: pede o aceite e não lê crianças",!!dC2.window.document.getElementById("ac-ok")&&!lidas18(sC).includes("criancas"));dC2.window.close();
   /* --- D) falha ao gravar o aceite --- */
   const sD=novo18(JSON.parse(JSON.stringify(V1))),dD=await abre18(sD),wD=dD.window;sD.resp.R1.status="aprovado";
   const fo=sD.fetch.bind(sD);sD.fetch=async(u,o)=>{if((o&&o.method)==="POST"&&String(u).includes("/rest/v1/consentimentos"))return{ok:false,status:403,json:async()=>({message:"new row violates row-level security policy for table \"consentimentos\""}),text:async()=>""};return fo(u,o)};
   marca(wD,true);wD.document.getElementById("ac-ok").click();await sleep(400);
   t("falha ao gravar o aceite: continua na tela de aceite, avisa em português sem texto técnico e não lê crianças",!!wD.document.getElementById("ac-ok")&&/Não consegui registrar o seu aceite/.test(wD.document.querySelector(".erro")?wD.document.querySelector(".erro").textContent:"")&&!/row-level|policy|consentimentos|403/.test(wD.document.getElementById("app").textContent)&&!lidas18(sD).includes("criancas"));dD.window.close();
   /* --- E) falha ao LER o aceite: bloqueia (nunca libera por engano) --- */
   const sE=novo18();sE.falhaCons=true;const dE=await abre18(sE);
   t("falha ao conferir o aceite: não mostra o painel nem lê crianças",!lidas18(sE).includes("criancas")&&!/Minhas crianças|ANA234/.test(dE.window.document.getElementById("app").textContent)&&!!dE.window.document.querySelector(".erro"));dE.window.close();
   /* --- F) texto não carrega: botão não habilita e nada é gravado --- */
   const sF=novo18(JSON.parse(JSON.stringify(V1))),dF=await abre18(sF,w=>{const f=w.fetch;w.fetch=(u,o)=>String(u).includes("consentimento_v3")?Promise.reject(new Error("sem rede")):f(u,o)}),wF=dF.window;
   if(wF.document.getElementById("ac-chk"))marca(wF,true);if(wF.document.getElementById("ac-ok"))wF.document.getElementById("ac-ok").click();await sleep(300);
   t("texto v3 não carregou: botão continua desabilitado, nada é gravado, crianças não são lidas",(!wF.document.getElementById("ac-ok")||wF.document.getElementById("ac-ok").disabled===true)&&sF.consPost.length===0&&!lidas18(sF).includes("criancas")&&/Não consegui carregar o texto/.test(wF.document.getElementById("app").textContent));dF.window.close();
   /* --- G) cadastro pendente com v1 não vê a tela de aceite nem grava --- */
   const sG=novo18(JSON.parse(JSON.stringify(V1)),"pendente"),dG=await abre18(sG);
   t("conta PENDENTE (aceite v1): continua só em 'Aguardando aprovação' — sem tela de aceite, sem gravar",/Aguardando aprovação/.test(dG.window.document.getElementById("app").textContent)&&!dG.window.document.getElementById("ac-ok")&&sG.consPost.length===0);dG.window.close();
   /* --- H) Sair e Excluir funcionam SEM aceitar --- */
   const sH=novo18(JSON.parse(JSON.stringify(V1))),dH=await abre18(sH,w=>{w.prompt=()=>"EXCLUIR"}),wH=dH.window;
   wH.document.getElementById("exc-conta").click();await sleep(400);
   t("Excluir conta sem ter aceitado: envia excluir_conta e apaga a sessão",(sH.fnLog||[]).some(x=>x.acao==="excluir_conta")&&!wH.localStorage.getItem("pm-resp")&&!wH.document.getElementById("ac-ok"),JSON.stringify(sH.fnLog));dH.window.close();
   const sI=novo18(JSON.parse(JSON.stringify(V1))),dI=await abre18(sI);dI.window.document.getElementById("sair").click();await sleep(300);
   t("Sair sem ter aceitado: volta à entrada, sem gravar aceite e sem ler crianças",!!dI.window.document.getElementById("f")&&sI.consPost.length===0&&!lidas18(sI).includes("criancas")&&!dI.window.document.getElementById("ac-ok"));dI.window.close();
   /* --- J) a conferência de aceite também vale antes de cada ação (aceite v3 exigido de novo no meio da sessão) --- */
   const sJ=novo18(),dJ=await abre18(sJ),wJ=dJ.window;sJ.resp.R1.cons=JSON.parse(JSON.stringify(V1));sJ.log.length=0;
   const ver=wJ.document.querySelector('[data-a="ajustes"],[data-a="dados"],[data-a="editar"]');if(ver)ver.click();await sleep(400);
   t("termo trocado no meio da sessão: a próxima ação volta para a tela de aceite e não lê dados da criança",!!wJ.document.getElementById("ac-ok")&&!lidas18(sJ).some(x=>["progresso","configuracoes","consentimentos_estudante"].includes(x)),lidas18(sJ).join(","));dJ.window.close();
   t("(18) responsavel.js: grava o aceite SÓ com POST em consentimentos (sem PATCH/DELETE) e usa a versão da config",/consentimentos/.test(lerArq("js/nuvem/responsavel.js"))&&!/PATCH|DELETE/.test((lerArq("js/nuvem/responsavel.js").match(/[^\n]*(aceite|Aceite)[^\n]*/g)||[]).join("\n")));
  }catch(e){t("seção 18 abortou: "+String(e.message).slice(0,120),false)}

  t("nenhum erro de script em todo o teste",erros.length===0,erros.slice(0,3));
  console.log(`\nPASSARAM: ${ok}   FALHARAM: ${bad.length}`);if(bad.length)console.log(bad.map(x=>" ✗ "+x).join("\n"));process.exit(bad.length?1:0);
})().catch(e=>{console.error("ERRO NO TESTE:",e);process.exit(2)});
