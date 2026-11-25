/* Pokemath — área do responsável: cadastro com consentimento, crianças, ajustes do controle externo, novo PIN, dados e exclusão. */
(function(){
  const app=document.getElementById("app"),C=PM_CONFIG,KR="pm-resp";
  const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const V={modo:"entrar",msg:"",ok:"",criancas:[],progresso:{},config:{},ajustando:null,novo:{avatar:"a1"},codigoNovo:null,termos:"",consents:[],ocupado:false,status:null,eu:null,
    passo:1,rasc:null,aut:null,chk:{perfil:false,acomp:false},verDoc:false};   // cadastro de criança em 2 passos: rasc = dados do passo 1 (só na memória), aut = texto das autorizações
  const sessao=()=>PM.ler(KR);

  async function token(){
    const s=sessao();if(!s)return null;
    if(s.expira-Date.now()>120000)return s.access;
    const r=await PM.auth.renovar(s.refresh);
    if(r.ok&&r.dados&&r.dados.access_token){const n={...s,access:r.dados.access_token,refresh:r.dados.refresh_token||s.refresh,expira:(r.dados.expires_at||0)*1000};PM.gravar(KR,n);return n.access}
    if(r.rede)return s.expira>Date.now()?s.access:null;
    PM.apagar(KR);return null;
  }
  const guardar=(d,email)=>PM.gravar(KR,{access:d.access_token,refresh:d.refresh_token,expira:(d.expires_at||0)*1000,email,id:d.user&&d.user.id,nome:d.user&&d.user.user_metadata&&d.user.user_metadata.nome});
  async function sha256(t){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")}
  const dizer=(m,ok)=>{V.msg=ok?"":m;V.ok=ok||"";desenhar()};

  /* ---------- telas ---------- */
  function desenhar(){
    const aviso=(V.msg?`<div class="erro" role="alert">${esc(V.msg)}</div>`:"")+(V.ok?`<div class="bom" role="status">${esc(V.ok)}</div>`:"");
    if(!sessao()){app.innerHTML=telaEntrada(aviso);ligarEntrada();return}
    if(V.status==="aprovado"){app.innerHTML=telaPainel(aviso);ligarPainel();return}
    app.innerHTML=telaEspera(aviso);ligarEspera();                  // pendente, bloqueado ou ainda conferindo: nenhum dado de criança é pedido nem mostrado
  }
  function telaEntrada(aviso){
    const cad=V.modo==="criar";
    return `<div class="caixa"><h1>Área do responsável</h1><p>Aqui você cadastra as crianças, vê como estão estudando e ajusta o jogo.</p>${cad?`<p><b>Todo cadastro novo passa por aprovação.</b> Depois de criar a conta você poderá entrar, mas só usará a área do responsável quando o cadastro for aprovado.</p>`:""}
    <div><button class="${cad?"sec":""}" id="m1">Entrar</button> <button class="${cad?"":"sec"}" id="m2">Criar conta</button></div>${aviso}
    <form id="f" autocomplete="on">
      ${cad?`<label>Seu nome<input name="nome" required maxlength="80" autocomplete="name"></label>`:""}
      <label>E-mail<input name="email" type="email" required autocomplete="email"></label>
      <label>Senha ${cad?"(mínimo 8 caracteres)":""}<input name="senha" type="password" required minlength="${cad?8:1}" autocomplete="${cad?"new-password":"current-password"}"></label>
      ${cad?`<h2>Consentimento</h2><div class="termos" tabindex="0" id="termos">${esc(V.termos||"Carregando…")}</div>
      <label class="chk"><input type="checkbox" name="resp" required> <span>Sou o pai, a mãe ou o responsável legal da criança.</span></label>
      <label class="chk"><input type="checkbox" name="aceito" required> <span>Li e concordo com os termos e o aviso de privacidade (versão ${esc(C.termos.versao)}).</span></label>`:""}
      <button class="grande" ${V.ocupado?"disabled":""}>${cad?"Criar conta":"Entrar"}</button></form>
    <p class="rodape"><a class="link" href="entrar.html" style="color:#cfe3ff">Voltar para a entrada da criança</a></p></div>`;
  }
  function ligarEntrada(){
    document.getElementById("m1").onclick=()=>{V.modo="entrar";V.msg=V.ok="";desenhar()};
    document.getElementById("m2").onclick=async()=>{V.modo="criar";V.msg=V.ok="";if(!V.termos)await carregarTermos();desenhar()};
    document.getElementById("f").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);V.modo==="criar"?cadastrar(f):entrar(f)};
  }
  async function carregarTermos(){try{V.termos=await (await fetch(C.termos.arquivo)).text()}catch{V.termos="Não consegui carregar o texto agora. Verifique a internet e tente de novo."}}

  /* Para onde o link de confirmação do e-mail leva: a ÁREA DO RESPONSÁVEL (responsavel.html), com o endereço completo
     (a raiz joycebn.github.io dá 404). Em teste local usa o responsavel.html da pasta atual. */
  const URL_APP="https://joycebn.github.io/Pokemath/responsavel.html";
  function emailRedirectTo(){
    try{return location.hostname==="joycebn.github.io"?URL_APP:new URL("responsavel.html",location.href).href}catch{return URL_APP}
  }
  async function cadastrar(f){
    if(!V.termos||V.termos.startsWith("Não consegui"))return dizer("Preciso mostrar o texto do consentimento antes. Verifique a internet.");
    V.ocupado=true;dizer("");
    const email=String(f.get("email")).trim(),hash=await sha256(V.termos);
    const r=await PM.auth.cadastrar(email,String(f.get("senha")),{nome:String(f.get("nome")).trim(),consentimento_aceito:true,consentimento_versao:C.termos.versao,consentimento_hash:hash},emailRedirectTo());
    V.ocupado=false;
    if(r.rede)return dizer(PM.motivo(r));
    if(!r.ok){const m=(r.dados&&(r.dados.msg||r.dados.error_description||r.dados.message))||"";
      return dizer(/already|registered/i.test(m)?"Este e-mail já tem conta. Use “Entrar”.":/password/i.test(m)?"A senha precisa ter pelo menos 8 caracteres.":PM.motivo(r))}
    if(r.dados&&r.dados.access_token){guardar(r.dados,email);V.msg=V.ok="";return abrirPainel()}
    V.modo="entrar";dizer("",`Conta criada! Enviamos uma mensagem para ${email}: clique no link dela para confirmar o e-mail e depois entre aqui. Seu cadastro ainda precisa ser aprovado antes do uso.`);
  }
  async function entrar(f){
    V.ocupado=true;const email=String(f.get("email")).trim();
    const r=await PM.auth.entrar(email,String(f.get("senha")));V.ocupado=false;
    if(r.rede)return dizer(PM.motivo(r));
    if(!r.ok&&r.status!==400&&r.status!==422)return dizer(PM.motivo(r));   // 401/403/404/5xx: mostra o código; 400/422 = e-mail ou senha errados
    if(!r.ok||!r.dados||!r.dados.access_token)return dizer(r.dados&&/confirm/i.test(JSON.stringify(r.dados))?"Falta confirmar o e-mail. Procure a mensagem na sua caixa de entrada.":"E-mail ou senha incorretos.");
    guardar(r.dados,email);V.msg=V.ok="";abrirPainel();
  }

  /* ---------- aprovação manual ---------- */
  const dataBR=d=>d?new Date(d).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):"—";
  function telaEspera(aviso){
    const s=sessao()||{},eu=V.eu||{},nome=eu.nome||s.nome||s.email||"";
    if(V.status===null)return `<div class="caixa"><h1>Área do responsável</h1><p>Conferindo o seu cadastro…</p>${aviso}</div>`;
    const bloq=V.status==="bloqueado";
    return `<div class="caixa"><h1>${bloq?"Acesso suspenso":"Aguardando aprovação"}</h1>
    ${bloq?`<p>O acesso desta conta está suspenso. Se você acha que é um engano, fale com a pessoa responsável pelo Pokemath.</p>`
          :`<p>Recebemos o seu cadastro. Ele precisa ser aprovado antes de você usar a área do responsável. Assim que for aprovado, toque em <b>Verificar de novo</b> ou entre outra vez.</p>`}
    <p><b>Nome:</b> ${esc(nome)}<br><b>Cadastro feito em:</b> ${esc(dataBR(eu.criado_em))}<br><b>Situação:</b> ${bloq?"bloqueado":"pendente"}</p>${aviso}
    <button class="grande" id="ver">Verificar de novo</button> <button class="sec" id="sair">Sair</button><br>
    <button class="sec perigo" id="exc-conta" style="margin-top:10px">Excluir minha conta e meus dados</button></div>`;
  }
  function ligarEspera(){
    const v=document.getElementById("ver");if(v)v.onclick=()=>{V.msg=V.ok="";abrirPainel()};
    const s=document.getElementById("sair");if(s)s.onclick=sairConta;
    const e=document.getElementById("exc-conta");if(e)e.onclick=excluirConta;
  }
  async function sairConta(){const t=await token();if(t)PM.auth.sair(t);PM.apagar(KR);limpar();V.status=null;V.eu=null;V.msg=V.ok="";desenhar()}
  const limpar=()=>{V.passo=1;V.rasc=null;V.aut=null;V.chk={perfil:false,acomp:false};V.verDoc=false;V.criancas=[];V.progresso={};V.config={};V.consents=[];V.ajustando=null;V.codigoNovo=null};
  /* lê SÓ a própria linha (nome, status, data). Devolve o status, ou null se a chamada falhou (o motivo fica em V.falha). */
  async function carregarStatus(t){
    const r=await PM.rest("responsaveis","select=nome,status,criado_em",t);
    if(r.rede||!r.ok){V.falha=PM.motivo(r);return null}
    const l=r.ok&&Array.isArray(r.dados)?r.dados[0]:null;
    V.eu=l;V.status=l?l.status:"pendente";                       // sem linha = trata como pendente (nunca libera por engano)
    return V.status;
  }
  /* Confere o status ANTES de cada ação: se foi bloqueado enquanto a tela estava aberta, perde o acesso na hora. */
  async function liberado(){
    const t=await token();if(!t){desenhar();return null}
    const st=await carregarStatus(t);
    if(st===null){dizer(V.falha);return null}
    if(st!=="aprovado"){limpar();desenhar();return null}
    return t;
  }

  function telaPainel(aviso){
    const s=sessao();
    const cards=V.criancas.map(c=>{const p=V.progresso[c.id]||{},a=PM_AVATARES.find(x=>x.k===c.avatar)||PM_AVATARES[0];
      return `<div class="crianca"><div class="av">${PM_avatarHtml(a)}</div><div class="dados"><b>${esc(c.apelido)}</b> · ${c.ano_escolar}º ano · ${c.idade} anos<br>
      Código: <b class="codigo">${esc(c.codigo)}</b><br><small>🪙 ${p.moedas??0} · 🎒 ${p.pokemon_total??0} Pokémon · 🔥 ${p.ofensiva_atual??0} dia(s) · último acesso: ${c.ultimo_acesso?new Date(c.ultimo_acesso).toLocaleDateString("pt-BR"):"nunca"}</small>
      <div class="acoes"><button data-a="ajustes" data-id="${c.id}">⚙ Ajustes</button><button data-a="pin" data-id="${c.id}">🔑 Novo PIN</button><button data-a="dados" data-id="${c.id}">⬇ Dados</button><button class="perigo" data-a="excluir" data-id="${c.id}">Excluir</button></div></div></div>`}).join("");
    const av=PM_AVATARES.map(a=>`<button type="button" aria-pressed="${V.novo.avatar===a.k}" aria-label="${a.nome}" data-av="${a.k}">${PM_avatarHtml(a)}</button>`).join("");
    return `<div class="caixa"><h1>Olá, ${esc(s.nome||s.email||"")}</h1><button class="sec" id="sair">Sair</button> <a class="link" href="entrar.html" style="color:#cfe3ff">Entrada da criança</a></div>${V.passo===2?"":aviso}
    ${V.codigoNovo?`<div class="bom"><b>Criança cadastrada!</b> Anote e guarde:<br>Código: <b class="codigo" style="font-size:1.6rem;letter-spacing:.2em">${esc(V.codigoNovo.codigo)}</b><br>Figura: ${esc((PM_AVATARES.find(x=>x.k===V.codigoNovo.avatar)||{}).nome||"")} · Senha: a que você digitou (não aparece de novo).</div>`:""}
    <h2>Minhas crianças</h2>${cards||"<p>Nenhuma criança ainda. Cadastre abaixo.</p>"}
    ${V.ajustando?telaAjustes():""}
    ${V.passo===2?telaAutorizacoes(aviso):`<div class="caixa"><h2 style="margin-top:0">Cadastrar criança</h2><form id="nc">
      <label>Apelido (use um nome inventado, sem sobrenome)<input name="apelido" required maxlength="30"></label>
      <div class="grade2"><label>Ano escolar<select name="ano">${[3,4,5,6,7,8,9].map(a=>`<option value="${a}" ${a===6?"selected":""}>${a}º ano</option>`).join("")}</select></label>
      <label>Idade<input name="idade" type="number" min="5" max="18" value="11" required></label></div>
      <p>Figura da criança</p><div class="avs">${av}</div>
      <div class="grade2"><label>Senha de 4 números<input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></label>
      <label>Repita a senha<input name="pin2" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></label></div>
      <button class="grande" ${V.ocupado?"disabled":""}>Continuar</button></form></div>`}
    <div class="caixa"><h2 style="margin-top:0">Meus consentimentos</h2>${V.consents.map(c=>`<p>${new Date(c.aceito_em).toLocaleString("pt-BR")} · versão ${esc(c.versao_texto)} · ${c.aceito?"aceito":"revogado"}</p>`).join("")||"<p>—</p>"}
      <button class="sec perigo" id="exc-conta">Excluir minha conta e todos os dados</button></div>`;
  }
  function telaAjustes(){
    const c=V.criancas.find(x=>x.id===V.ajustando),k=V.config[V.ajustando]||{},x=k.extras||{};
    const n=(nome,rot,val,mi,ma)=>`<label>${rot}<input name="${nome}" type="number" min="${mi}" max="${ma}" value="${val??""}"></label>`;
    return `<div class="caixa"><h2 style="margin-top:0">Ajustes de ${esc(c?c.apelido:"")}</h2><p>O aplicativo da criança lê estes valores ao abrir e sempre que tiver internet; sem internet, usa os últimos recebidos.</p>
    <form id="aj"><div class="grade2">${n("tempo_desafio","Tempo do desafio (segundos)",k.tempo_desafio,10,600)}${n("questoes_por_fase","Questões por fase (Prata)",k.questoes_por_fase,4,20)}
    <label>Anos liberados (até)<select name="ano_escolar_liberado">${[3,4,5,6,7,8,9].map(a=>`<option value="${a}" ${k.ano_escolar_liberado===a?"selected":""}>${a}º ano</option>`).join("")}</select></label>
    ${n("tentativas_dia","Tentativas por dia (cada nível)",k.tentativas_dia,1,20)}
    ${n("meta","Meta diária (contas)",x.meta,1,100)}${n("moedaAcerto","Moedas por acerto",x.moedaAcerto,0,100)}${n("bonusMeta","Bônus da meta",x.bonusMeta,0,1000)}${n("bonusDiario","Bônus do desafio diário",x.bonusDiario,0,1000)}${n("teto","Limite de moedas por dia",x.teto,0,1000)}${n("tetoXP","Limite de XP por dia",x.tetoXP,0,1000)}</div>
    <label>Dificuldade<select name="dificuldade">${[["","(não definir)"],["facil","Fácil"],["medio","Médio"],["dificil","Difícil"]].map(([v,t])=>`<option value="${v}" ${x.dificuldade===v?"selected":""}>${t}</option>`).join("")}</select></label>
    <button class="grande">Salvar ajustes</button> <button type="button" class="sec" id="aj-x">Fechar</button></form></div>`;
  }
  function ligarPainel(){
    document.getElementById("sair").onclick=sairConta;
    app.querySelectorAll("[data-av]").forEach(b=>b.onclick=()=>{V.novo.avatar=b.dataset.av;const form=document.getElementById("nc");V.novo.rascunho=Object.fromEntries(new FormData(form));desenhar();restaurarRascunho()});
    app.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>acao(b.dataset.a,b.dataset.id));
    const nc=document.getElementById("nc");if(nc)nc.onsubmit=e=>{e.preventDefault();continuar(new FormData(e.target))};
    ligarAutorizacoes();
    document.getElementById("exc-conta").onclick=excluirConta;
    const aj=document.getElementById("aj");if(aj){aj.onsubmit=e=>{e.preventDefault();salvarAjustes(new FormData(e.target))};document.getElementById("aj-x").onclick=()=>{V.ajustando=null;desenhar()}}
  }
  function restaurarRascunho(){const r=V.novo.rascunho;if(!r)return;const f=document.getElementById("nc");for(const [k,v] of Object.entries(r)){if(f.elements[k]&&k!=="avatar")f.elements[k].value=v}}

  /* ---------- ações ---------- */
  async function abrirPainel(){
    const t=await token();if(!t){desenhar();return}
    const st=await carregarStatus(t);
    if(st===null){dizer(V.falha);return}
    if(st!=="aprovado"){limpar();desenhar();return}          // pendente/bloqueado: não pede nenhum dado de criança
    const [a,p,k,c]=await Promise.all([
      PM.rest("criancas","select=id,apelido,ano_escolar,idade,avatar,codigo,ativo,ultimo_acesso&order=criado_em",t),
      PM.rest("progresso","select=crianca_id,moedas,pokemon_total,ofensiva_atual,atualizado_em",t),
      PM.rest("configuracoes","select=*",t),
      PM.rest("consentimentos","select=versao_texto,aceito,aceito_em&order=aceito_em.desc",t)]);
    if(a.rede||!a.ok)dizer("Não consegui carregar as crianças. "+PM.motivo(a));
    V.criancas=a.ok&&Array.isArray(a.dados)?a.dados:[];
    V.progresso=Object.fromEntries((p.ok&&Array.isArray(p.dados)?p.dados:[]).map(x=>[x.crianca_id,x]));
    V.config=Object.fromEntries((k.ok&&Array.isArray(k.dados)?k.dados:[]).map(x=>[x.crianca_id,x]));
    V.consents=c.ok&&Array.isArray(c.dados)?c.dados:[];
    desenhar();
  }
  /* ---------- cadastrar criança em 2 passos: dados → autorizações por estudante ---------- */
  const TITULO_AUT="AUTORIZAÇÕES PARA ESTE ESTUDANTE";
  /* Lê as duas caixas do MESMO texto usado no hash: depois do título, cada item começa numa linha com "☐" e vai até o próximo "☐".
     Devolve {perfil, acomp} ou null se o formato não for o esperado (título ausente, ou não são exatamente 2 itens). */
  function lerAutorizacoes(texto){
    const linhas=String(texto||"").split(/\r?\n/);let i=-1;
    linhas.forEach((l,k)=>{if(l.trim()===TITULO_AUT)i=k});
    if(i<0)return null;
    const itens=[];
    for(const l of linhas.slice(i+1)){
      const x=l.replace(/^\s+/,"");
      if(x.startsWith("☐"))itens.push(x.slice(1).replace(/^[ \t]+/,""));
      else if(itens.length)itens[itens.length-1]+="\n"+l;
    }
    const lim=itens.map(x=>x.replace(/^\s+|\s+$/g,""));
    if(lim.length!==2||lim.some(x=>x.length<10))return null;
    return{perfil:lim[0],acomp:lim[1]};
  }
  async function carregarAutorizacao(){
    const cfg=C.autorizacao_estudante;V.aut=null;
    if(!cfg||!cfg.versao||!cfg.arquivo){console.error("[Pokemath] js/nuvem/config.js não tem a chave autorizacao_estudante.");return false}
    try{
      const r=await fetch(cfg.arquivo,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);
      const texto=await r.text(),caixas=lerAutorizacoes(texto);
      if(!caixas){console.error("[Pokemath] o texto das autorizações ("+cfg.arquivo+") não tem o formato esperado: título "+TITULO_AUT+" seguido de exatamente 2 itens que começam com ☐.");return false}
      const hash=await sha256(texto);
      console.log("[Pokemath] autorizações · versão",cfg.versao,"· arquivo",cfg.arquivo,"· SHA-256 do texto:",hash);
      V.aut={versao:cfg.versao,texto,hash,caixas};return true;
    }catch(e){console.error("[Pokemath] não consegui carregar o texto das autorizações:",cfg.arquivo,e&&e.message||e);return false}
  }
  function telaAutorizacoes(aviso){
    const a=V.aut,x=V.rasc||{};
    if(!a)return `<div class="caixa"><h2 style="margin-top:0">Autorizações para este estudante</h2><div class="erro" role="alert">Não consegui carregar o texto das autorizações.</div><p>Verifique a internet e tente de novo.</p>${aviso}
      <button type="button" class="sec" id="aut-recarregar">Tentar de novo</button> <button type="button" class="sec" id="aut-volta">Voltar sem criar o perfil</button></div>`;
    return `<div class="caixa"><h2 style="margin-top:0">Autorizações para este estudante</h2>
      <p>Você está cadastrando <b>${esc(x.apelido)}</b>. Leia e marque abaixo. A primeira autorização é obrigatória para criar o perfil; a segunda é opcional.</p>${aviso}
      <form id="aut">
        <label class="chk"><input type="checkbox" name="perfil" ${V.chk.perfil?"checked":""}> <span style="white-space:pre-wrap">${esc(a.caixas.perfil)}</span></label>
        <label class="chk"><input type="checkbox" name="acomp" ${V.chk.acomp?"checked":""}> <span style="white-space:pre-wrap">${esc(a.caixas.acomp)}</span></label>
        <p><button type="button" class="sec" id="aut-doc">${V.verDoc?"Esconder o documento completo":"Ler o documento completo"}</button></p>
        ${V.verDoc?`<div class="termos" tabindex="0" id="aut-texto">${esc(a.texto)}</div>`:""}
        <p id="aut-ajuda" class="aviso" ${V.chk.perfil?"hidden":""}>Para cadastrar, marque a primeira autorização (criar o perfil). A segunda é opcional e não libera o cadastro.</p>
        <button class="grande" id="aut-ok" ${V.chk.perfil&&!V.ocupado?"":"disabled"} aria-disabled="${V.chk.perfil&&!V.ocupado?"false":"true"}">Cadastrar criança</button>
        <button type="button" class="sec" id="aut-volta">Voltar sem criar o perfil</button></form></div>`;
  }
  function ligarAutorizacoes(){
    const volta=document.getElementById("aut-volta");if(volta)volta.onclick=voltarSemCriar;
    const rec=document.getElementById("aut-recarregar");if(rec)rec.onclick=async()=>{await carregarAutorizacao();desenhar()};
    const f=document.getElementById("aut");if(!f)return;
    const ok=document.getElementById("aut-ok");
    /* O botão segue SEMPRE o estado real da caixa 1 (lido da própria caixa). A caixa 2 nunca habilita o botão. */
    const atualizar=()=>{
      V.chk.perfil=f.elements.perfil.checked;V.chk.acomp=f.elements.acomp.checked;
      const hab=V.chk.perfil&&!V.ocupado;ok.disabled=!hab;ok.setAttribute("aria-disabled",hab?"false":"true");
      const aj=document.getElementById("aut-ajuda");if(aj)aj.hidden=V.chk.perfil;
    };
    for(const nome of ["perfil","acomp"])for(const ev of ["change","input","click"])f.elements[nome].addEventListener(ev,atualizar);
    document.getElementById("aut-doc").onclick=()=>{V.verDoc=!V.verDoc;desenhar()};
    f.onsubmit=e=>{e.preventDefault();enviarCriar()};
  }
  function limparCadastro(){V.passo=1;V.rasc=null;V.aut=null;V.chk={perfil:false,acomp:false};V.verDoc=false;V.novo={avatar:"a1"}}
  /* "Voltar sem criar o perfil": descarta tudo (inclusive a senha digitada) e NÃO chama o servidor. */
  function voltarSemCriar(){limparCadastro();V.msg=V.ok="";desenhar()}
  /* Passo 1 → 2: confere os dados e o status do responsável, carrega o texto das autorizações. Nada é criado aqui. */
  async function continuar(f){
    const pin=String(f.get("pin")),pin2=String(f.get("pin2"));
    if(pin!==pin2)return dizer("As duas senhas não são iguais.");
    if(!/^\d{4}$/.test(pin))return dizer("A senha precisa ter 4 números.");
    const t=await liberado();if(!t)return;
    V.rasc={apelido:String(f.get("apelido")).trim(),ano:+f.get("ano"),idade:+f.get("idade"),avatar:V.novo.avatar,pin};V.novo.rascunho=null;
    V.chk={perfil:false,acomp:false};V.verDoc=false;V.msg=V.ok="";
    await carregarAutorizacao();V.passo=2;desenhar();
  }
  const ERRO_GENERICO="Não consegui cadastrar agora. Tente de novo em instantes.";
  const MENSAGEM_DA_FUNCAO=["consentimento_perfil_obrigatorio","falha_ao_registrar_autorizacao","texto_consentimento_nao_configurado"];   // erros em que a mensagem em português vem da função
  async function enviarCriar(){
    const fa=document.getElementById("aut");                               // lê as caixas direto da tela (não de uma cópia que possa ter ficado velha)
    if(fa){V.chk.perfil=fa.elements.perfil.checked;V.chk.acomp=fa.elements.acomp.checked}
    if(!V.chk.perfil||!V.aut||!V.rasc)return dizer("Para cadastrar a criança, marque a autorização para criar o perfil.");
    const t=await liberado();if(!t)return;
    const x=V.rasc;V.ocupado=true;desenhar();
    const r=await PM.funcao("gerenciar-crianca",{acao:"criar",apelido:x.apelido,ano_escolar:x.ano,idade:x.idade,avatar:x.avatar,pin:x.pin,
      consentimento:{versao:V.aut.versao,hash:V.aut.hash,perfil:true,acompanhamento:V.chk.acomp===true}},t);
    V.ocupado=false;
    const d=(r&&r.dados)||{},erro=typeof d.erro==="string"?d.erro:"";
    if(r.ok&&d.ok){V.codigoNovo={codigo:d.codigo,avatar:x.avatar};limparCadastro();V.msg=V.ok="";await abrirPainel();return}
    if(erro==="texto_consentimento_invalido"){await carregarAutorizacao();V.chk={perfil:false,acomp:false};return dizer("O texto das autorizações foi atualizado. Leia de novo e marque as autorizações para continuar.")}
    if(erro==="limite_de_criancas"){limparCadastro();return dizer("Você já cadastrou o máximo de 10 crianças.")}
    if(erro==="aguardando_aprovacao"){limparCadastro();return dizer("Seu cadastro ainda não foi aprovado.")}
    if(erro==="falha_ao_desfazer"&&typeof d.mensagem==="string"){limparCadastro();V.msg=d.mensagem;await abrirPainel();return}
    if(MENSAGEM_DA_FUNCAO.includes(erro)&&typeof d.mensagem==="string")return dizer(d.mensagem);
    return dizer(ERRO_GENERICO);   // rede ou erro desconhecido: o detalhe técnico fica só no console
  }
  async function acao(a,id){
    const c=V.criancas.find(x=>x.id===id);if(!c)return;const t=await liberado();if(!t)return;
    if(a==="ajustes"){V.ajustando=id;return desenhar()}
    if(a==="pin"){
      const n=prompt("Nova senha de 4 números para "+c.apelido+":");if(n===null)return;
      if(!/^\d{4}$/.test(n))return dizer("A senha precisa ter exatamente 4 números.");
      const r=await PM.rpc("pm_redefinir_pin",{p_crianca:id,p_pin:n},t);
      return r.ok&&r.dados===true?dizer("",`Nova senha de ${c.apelido} salva. As tentativas erradas foram zeradas.`):dizer("Não consegui trocar a senha agora.");
    }
    if(a==="dados"){
      const [fi,pr,co]=await Promise.all([PM.rest("criancas","select=id,apelido,ano_escolar,idade,avatar,codigo,ativo,criado_em,ultimo_acesso&id=eq."+id,t),PM.rest("progresso","crianca_id=eq."+id,t),PM.rest("configuracoes","crianca_id=eq."+id,t)]);
      const blob=new Blob([JSON.stringify({exportado_em:new Date().toISOString(),ficha:fi.dados,progresso:pr.dados,configuracoes:co.dados},null,2)],{type:"application/json"});
      const l=document.createElement("a");l.href=URL.createObjectURL(blob);l.download=`pokemath-${c.apelido}.json`;l.click();setTimeout(()=>URL.revokeObjectURL(l.href),2000);return;
    }
    if(a==="excluir"){
      const dig=prompt(`Isto apaga TODOS os dados de ${c.apelido} e não dá para desfazer.\nPara confirmar, digite o apelido: ${c.apelido}`);
      if(dig===null)return;if(dig.trim()!==c.apelido)return dizer("O apelido não confere. Nada foi apagado.");
      const r=await PM.funcao("gerenciar-crianca",{acao:"excluir",crianca_id:id},t);
      if(!r.ok)return dizer("Não consegui excluir agora.");V.ajustando=null;await abrirPainel();dizer("",`${c.apelido} foi excluída.`);
    }
  }
  async function salvarAjustes(f){
    const t=await liberado();if(!t)return;const id=V.ajustando,antigo=(V.config[id]||{}).extras||{};
    const num=k=>{const v=f.get(k);return v===null||v===""?undefined:+v};
    const extras={...antigo};for(const k of ["meta","moedaAcerto","bonusMeta","bonusDiario","teto","tetoXP"]){const v=num(k);if(v===undefined)delete extras[k];else extras[k]=v}
    const d=String(f.get("dificuldade")||"");if(d)extras.dificuldade=d;else delete extras.dificuldade;
    const corpo={tempo_desafio:num("tempo_desafio"),questoes_por_fase:num("questoes_por_fase"),ano_escolar_liberado:num("ano_escolar_liberado"),tentativas_dia:num("tentativas_dia"),extras};
    for(const k of Object.keys(corpo))if(corpo[k]===undefined)delete corpo[k];
    const r=await PM.http("/rest/v1/configuracoes?crianca_id=eq."+id,{metodo:"PATCH",corpo,token:t,cabecalhos:{Prefer:"return=representation"}});
    if(!r.ok||!Array.isArray(r.dados)||!r.dados.length)return dizer("Não consegui salvar. Confira se os números estão dentro dos limites.");
    V.config[id]=r.dados[0];V.ajustando=null;dizer("","Ajustes salvos. A criança recebe quando abrir o app com internet.");
  }
  async function excluirConta(){
    const dig=prompt("Isto apaga a sua conta, TODAS as crianças e o progresso delas. Não dá para desfazer.\nPara confirmar, digite: EXCLUIR");
    if(dig===null)return;if(dig.trim()!=="EXCLUIR")return dizer("Nada foi apagado.");
    const t=await token();if(!t)return desenhar();
    const r=await PM.funcao("gerenciar-crianca",{acao:"excluir_conta"},t);
    if(!r.ok)return dizer("Não consegui excluir agora.");PM.apagar(KR);limpar();V.status=null;V.eu=null;dizer("","Sua conta e os dados foram excluídos.");
  }

  if(sessao()){desenhar();abrirPainel()}else desenhar();
})();
