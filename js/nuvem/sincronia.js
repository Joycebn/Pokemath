/* Pokemath — sincronização com a nuvem. Roda DEPOIS do jogo (js/legado/jogo.js).
   O jogo continua guardando tudo no aparelho (rápido e funciona sem internet). Esta camada só:
   • envia uma cópia para a nuvem quando há internet (fila: o que não foi enviado fica marcado e vai depois);
   • traz e junta o progresso da nuvem (sem perder conquistas) ao abrir e ao voltar a internet;
   • lê a configuração do controle externo (e guarda a última recebida para usar offline). */
(function(){
  if(!window.PM||!window.PM_SESSAO||window.PM_PARAR||typeof S==="undefined")return;
  const id=window.PM_SESSAO.id,KM="pm-meta-"+id,KC="pm-config-"+id;
  let meta=PM.ler(KM)||{versao:0,sujo:false,ultima:null};
  let sobre=(PM.ler(KC)||{}).sobre||{};
  let ocupado=false,timer=null,falhas=0,estado="ok",adocao=null,ultimoSalvar=0,msg="",parado=false;
  const disp=(()=>{let d=PM.ler("pm-disp");if(!d){d=Math.random().toString(36).slice(2,10);PM.gravar("pm-disp",d)}return d})();
  const salvarMeta=()=>PM.gravar(KM,meta);
  const clone=o=>JSON.parse(JSON.stringify(o));

  /* a criança está no meio de uma atividade? então não trocamos o estado por baixo dela */
  function ocioso(){
    if(typeof Q!=="undefined"&&Q)return false;
    if(typeof FS!=="undefined"&&FS&&(FS.vista==="exerc"||FS.vista==="explica"))return false;
    if(document.querySelector(".pm-tut"))return false;
    return Date.now()-ultimoSalvar>4000;
  }
  /* Outra criança entrou NESTE aparelho (em outra aba/janela)? Então esta aba para de sincronizar de vez:
     sem timers, sem novas tentativas, nada é enviado nem lido com a identidade da outra criança. O jogo e o progresso local seguem intactos. */
  const TEXTO_TROCA="Outra criança entrou neste aparelho. Entre de novo para continuar.";
  function conferirTroca(){
    if(parado)return true;
    if(!PM.sessaoTrocada())return false;
    parado=true;clearTimeout(timer);timer=null;adocao=null;estado="trocada";msg="";
    try{
      if(!document.getElementById("pm-trocada")){
        const b=document.createElement("div");b.id="pm-trocada";b.setAttribute("role","alert");
        b.style.cssText="position:fixed;left:0;right:0;top:0;z-index:99999;background:#b3261e;color:#fff;padding:12px 14px;font:700 15px/1.3 system-ui,sans-serif;text-align:center";
        const sp=document.createElement("span");sp.textContent=TEXTO_TROCA;b.appendChild(sp);
        const bt=document.createElement("button");bt.textContent="Entrar de novo";bt.style.cssText="margin-left:10px;padding:6px 12px;font:inherit;border-radius:8px;border:0";
        bt.onclick=()=>location.replace("entrar.html");                 // só vai para a entrada: NÃO apaga a sessão da outra criança
        b.appendChild(bt);document.body.appendChild(b);
      }
    }catch{}
    return true;
  }
  function agendar(ms){if(parado)return;clearTimeout(timer);timer=setTimeout(empurrar,ms)}
  function recuo(){if(parado)return;falhas++;agendar(Math.min(300000,5000*Math.pow(2,Math.min(falhas,6))))}

  /* ---- enviar ---- */
  let conflitos=0;
  async function empurrar(rapido){
    if(conferirTroca())return;
    if(ocupado||!meta.sujo||adocao)return;
    ocupado=true;let res;
    try{res=await enviar(rapido)}finally{ocupado=false}
    if(res==="conflito"&&conflitos<4){conflitos++;try{await puxar(true)}finally{conflitos=0}}   // alguém (outro aparelho) salvou antes: junta e envia de novo
  }
  async function enviar(rapido){
    let token=await PM.tokenCrianca();
    if(!token){if(conferirTroca())return;estado=(PM.sessaoCrianca()||{}).expirada?"expirada":"offline";return recuo()}
    const foto=clone(S),corpo=()=>({p_estado:foto,p_versao:meta.versao,p_dispositivo:disp});
    let r=await PM.rpc("pm_salvar_progresso",corpo(),token,{keepalive:!!rapido&&JSON.stringify(foto).length<60000});
    if(r.status===401){token=await PM.tokenCrianca(true);if(token)r=await PM.rpc("pm_salvar_progresso",corpo(),token)}
    if(r.rede){estado="offline";return recuo()}
    if(r.ok&&r.dados&&r.dados.ok){
      meta.versao=r.dados.versao;meta.ultima=Date.now();if(S._ts===foto._ts)meta.sujo=false;salvarMeta();
      falhas=0;estado=meta.sujo?"pendente":"ok";msg="";
      if(meta.sujo)agendar(1500);
      return"ok";
    }
    if(r.ok&&r.dados&&r.dados.erro==="conflito")return"conflito";
    if(r.ok&&r.dados&&r.dados.erro==="sem_acesso"){estado="suspensa";msg="";return recuo()}     // família pendente/bloqueada: o jogo segue no aparelho e nada sobe
    estado=r.status===401?"expirada":"erro";msg="Erro "+r.status;recuo();
  }

  /* ---- trazer e juntar ---- */
  async function puxar(depoisDeConflito){
    if(conferirTroca())return;
    const token=await PM.tokenCrianca();if(!token){if(conferirTroca())return;estado=(PM.sessaoCrianca()||{}).expirada?"expirada":"offline";return}
    const r=await PM.rest("progresso","select=estado,versao&crianca_id=eq."+id,token);
    if(r.rede){estado="offline";return}
    if(!r.ok||!Array.isArray(r.dados)){estado="erro";msg="Erro "+r.status;return}
    if(!r.dados.length){meta.versao=0;meta.sujo=true;salvarMeta();return await empurrar()}      // primeira vez desta criança: envia o que há aqui
    const nuvem=r.dados[0];
    if(!depoisDeConflito&&!meta.sujo&&nuvem.versao===meta.versao)return;                  // nada mudou
    const novo=PMR.mesclar(S,nuvem.estado);
    meta.versao=nuvem.versao;
    meta.sujo=!PMR.igual(novo,nuvem.estado);                          // se a junção tem algo que a nuvem não tem, precisa enviar
    salvarMeta();
    adotar(novo);
    if(meta.sujo&&!adocao)await empurrar();
  }
  function adotar(novo){
    if(PMR.igual(novo,S)){adocao=null;return}
    if(!ocioso()){adocao=novo;setTimeout(tentarAdotar,2500);return}                          // espera a criança terminar o que está fazendo
    S=novo;try{localStorage.setItem(window.PM_KEY,JSON.stringify(S))}catch{}
    adocao=null;if(typeof render==="function")render();
    if(meta.sujo)agendar(500);
  }
  function tentarAdotar(){
    if(!adocao)return;
    if(!ocioso()){setTimeout(tentarAdotar,2500);return}
    const novo=PMR.mesclar(S,adocao);adocao=null;adotar(novo);
  }

  /* ---- configuração do controle externo ---- */
  async function lerConfig(){
    if(conferirTroca())return;
    const token=await PM.tokenCrianca();if(!token)return;
    const r=await PM.rest("configuracoes","select=*&crianca_id=eq."+id,token);
    if(!r.ok||!Array.isArray(r.dados)||!r.dados[0])return;               // sem internet ou sem linha: continua com a última recebida
    sobre=PMR.configDaLinha(r.dados[0]);
    PM.gravar(KC,{versao:r.dados[0].versao,sobre,quando:Date.now()});
    if(PMR.aplicarConfig(S,sobre)){save();if(ocioso()&&typeof render==="function")render()}
  }

  async function tudo(){if(conferirTroca())return;await lerConfig();await puxar();await empurrar()}

  /* ---- ganchos usados pelo jogo (save) ---- */
  function antes(est){est._ts=Date.now();ultimoSalvar=Date.now();PMR.aplicarConfig(est,sobre)}
  function depois(){meta.sujo=true;if(!parado)estado="pendente";salvarMeta();agendar(3000)}

  /* ---- tela: cartão na aba Prof. ---- */
  const TXT={ok:"Tudo salvo na nuvem ☁️",pendente:"Salvando…",offline:"Sem internet: o progresso está salvo neste aparelho e será enviado quando a conexão voltar.",erro:"Não consegui salvar agora; vou tentar de novo.",expirada:"A sessão acabou. Entre de novo para continuar salvando.",suspensa:"O salvamento na nuvem está suspenso para esta conta. O progresso continua guardado neste aparelho. Fale com o responsável.",trocada:TEXTO_TROCA};
  function cartao(){
    const s=window.PM_SESSAO,q=meta.ultima?new Date(meta.ultima).toLocaleString("pt-BR"):"ainda não";
    return `<h2>Conta e nuvem</h2><div class="info"><p><b>${(s.apelido||"").replace(/</g,"&lt;")}</b> · ${TXT[estado]||""} ${msg?"("+msg+")":""}</p>
    <p>Último envio: ${q}${meta.sujo?" · há alterações para enviar":""}</p>
    <p class="aviso">Os ajustes de tempo, questões, anos liberados e tentativas são definidos pelo responsável e atualizados automaticamente.</p>
    <button class="sec" onclick="Nuvem.sincronizarAgora()">Sincronizar agora</button> <button class="sec" onclick="Nuvem.sair()">Sair desta conta</button></div>`;
  }
  const profOriginal=prof;
  window.prof=function(){const h=profOriginal();return(S.cfg.pin&&typeof profOk!=="undefined"&&!profOk)?h:h+cartao()};

  async function sincronizarAgora(){if(conferirTroca()){if(typeof toast==="function")toast(TEXTO_TROCA);return}try{estado="pendente";if(typeof toast==="function")toast("Sincronizando…");await tudo();if(typeof toast==="function")toast(estado==="ok"?"Tudo salvo na nuvem!":(TXT[estado]||"Pronto."));if(tela==="prof"&&ocioso())render()}catch{}}
  async function sair(){
    if(conferirTroca()){location.replace("entrar.html");return}          // outra criança está conectada: só vai para a entrada, sem desconectá-la
    if(!confirm("Sair desta conta? O progresso fica salvo na nuvem."))return;
    try{await empurrar(true)}catch{}
    if(meta.sujo&&!confirm("Ainda há progresso sem enviar para a nuvem (sem internet?). Se sair agora, ele só será enviado quando você entrar de novo NESTE aparelho. Sair mesmo assim?"))return;
    const t=await PM.tokenCrianca();if(t)PM.auth.sair(t);
    PM.sairCrianca();location.replace("entrar.html");
  }

  window.Nuvem={antes,depois,sincronizarAgora,sair,estado:()=>({estado,meta:{...meta},sobre:{...sobre},adocao:!!adocao}),_tudo:tudo,_puxar:puxar,_empurrar:empurrar,_config:lerConfig};

  addEventListener("online",()=>{if(conferirTroca())return;falhas=0;tudo()});
  document.addEventListener("visibilitychange",()=>{if(conferirTroca())return;if(document.hidden)empurrar(true);else tudo()});
  addEventListener("storage",e=>{if(e.key===null||e.key==="pm-sessao")conferirTroca()});          // outra aba mudou a sessão: para na hora
  let tic=0;setInterval(()=>{if(conferirTroca())return;tic++;if(meta.sujo&&!ocupado)empurrar();if(tic%5===0&&navigator.onLine!==false){lerConfig();puxar()}},60000);
  tudo();
})();
