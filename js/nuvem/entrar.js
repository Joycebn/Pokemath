/* Pokemath — entrada da criança: código (6 letras/números) + figura + senha de 4 números. Sem e-mail. */
(function(){
  const app=document.getElementById("app");
  const E={codigo:"",avatar:"",pin:"",msg:"",ocupado:false};
  try{E.codigo=localStorage.getItem("pm-ultimo-codigo")||""}catch{}
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const temLegado=()=>{try{return !!JSON.parse(localStorage.getItem("tabuada-pokemon-v1"))}catch{return false}};

  function tela(){
    const pontos=[0,1,2,3].map(i=>`<i class="${i<E.pin.length?"on":""}"></i>`).join("");
    const avs=PM_AVATARES.map(a=>`<button type="button" aria-pressed="${E.avatar===a.k}" aria-label="${a.nome}" data-av="${a.k}">${PM_avatarHtml(a)}</button>`).join("");
    const teclas=[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" data-n="${n}">${n}</button>`).join("")+`<button type="button" class="apagar" data-n="x" aria-label="Apagar">⌫</button><button type="button" data-n="0">0</button><button type="button" class="apagar" data-n="c" aria-label="Limpar">✕</button>`;
    app.innerHTML=`<div class="caixa"><h1>Pokemath 🔥</h1><p>Entre com o seu código, a sua figura e a sua senha.</p>
      <label for="cod">1. Seu código (6 letras e números)</label>
      <input id="cod" class="cod" maxlength="6" autocomplete="off" autocapitalize="characters" inputmode="text" value="${esc(E.codigo)}" placeholder="______">
      <p>2. Escolha a sua figura</p><div class="avs">${avs}</div>
      <p>3. Digite a sua senha de 4 números</p><div class="pontos" aria-live="polite" aria-label="${E.pin.length} de 4 números">${pontos}</div><div class="teclado">${teclas}</div>
      ${E.msg?`<div class="${E.msg.startsWith("✔")?"bom":"erro"}" role="alert">${esc(E.msg)}</div>`:""}
      ${temLegado()?`<label class="chk"><input type="checkbox" id="legado" checked> <span>Trazer o progresso que já está salvo neste aparelho</span></label>`:""}
      <button class="grande" id="ok" ${E.ocupado?"disabled":""}>${E.ocupado?"Entrando…":"Entrar"}</button></div>
      <p class="rodape">Esqueceu o código ou a senha? Peça ao seu responsável.<br><a class="link" href="responsavel.html" style="color:#cfe3ff">Sou responsável</a></p>`;
    const c=document.getElementById("cod");
    c.oninput=()=>{E.codigo=c.value.toUpperCase().replace(/[^A-Z0-9]/g,"");c.value=E.codigo};
    app.querySelectorAll("[data-av]").forEach(b=>b.onclick=()=>{E.avatar=b.dataset.av;tela()});
    app.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>{const n=b.dataset.n;
      if(n==="x")E.pin=E.pin.slice(0,-1);else if(n==="c")E.pin="";else if(E.pin.length<4)E.pin+=n;
      tela();if(E.pin.length===4&&E.codigo.length===6&&E.avatar)entrar()});
    document.getElementById("ok").onclick=entrar;
  }

  async function entrar(){
    if(E.ocupado)return;
    if(E.codigo.length!==6)return aviso("Falta o código: são 6 letras e números.");
    if(!E.avatar)return aviso("Escolha a sua figura.");
    if(E.pin.length!==4)return aviso("A senha tem 4 números.");
    E.ocupado=true;E.msg="";tela();
    const importar=!!(document.getElementById("legado")&&document.getElementById("legado").checked);
    const r=await PM.funcao("login-crianca",{codigo:E.codigo,avatar:E.avatar,pin:E.pin});
    E.ocupado=false;E.pin="";
    if(r.rede)return aviso("Sem internet. Para entrar neste aparelho pela primeira vez é preciso estar conectado.");
    if(r.status===429)return aviso("Muitas tentativas. Espere "+Math.max(1,Math.ceil(((r.dados&&r.dados.espera_seg)||900)/60))+" minuto(s) e tente de novo.");
    if(!r.ok||!r.dados||!r.dados.ok)return aviso(r.status===401?"Código, figura ou senha não conferem. Confira com o seu responsável.":"Não consegui entrar agora. Tente de novo daqui a pouco.");
    const {sessao,crianca}=r.dados;
    PM.guardarCrianca({id:crianca.id,apelido:crianca.apelido,avatar:crianca.avatar,ano:crianca.ano_escolar,access:sessao.access_token,refresh:sessao.refresh_token,expira:(sessao.expires_at||0)*1000});
    try{localStorage.setItem("pm-ultimo-codigo",E.codigo)}catch{}
    await prepararLocal(crianca.id,sessao.access_token,importar);
    location.replace("index.html");
  }
  function aviso(m){E.msg=m;E.ocupado=false;tela()}

  /* Deixa pronta a cópia local DESTA criança: junta o que já havia aqui, o progresso antigo (se pediu) e o da nuvem. */
  async function prepararLocal(id,token,importar){
    const chave="pokemath-estado-"+id;
    let est=PM.ler(chave);
    if(importar&&!PM.ler("pm-legado-"+id)){
      const leg=PM.ler("tabuada-pokemon-v1");
      if(leg&&typeof leg==="object"){leg._ts=leg._ts||0;est=est?PMR.mesclar(est,leg):leg;PM.gravar("pm-legado-"+id,1)}
    }
    const r=await PM.rest("progresso","select=estado,versao&crianca_id=eq."+id,token);
    const nuvem=r.ok&&Array.isArray(r.dados)&&r.dados[0]?r.dados[0]:null;
    let meta;
    if(nuvem){est=est?PMR.mesclar(est,nuvem.estado):nuvem.estado;meta={versao:nuvem.versao,sujo:!PMR.igual(est,nuvem.estado)}}
    else{meta={versao:0,sujo:!!est};if(est&&!est._ts)est._ts=Date.now()}
    if(est)PM.gravar(chave,est);
    PM.gravar("pm-meta-"+id,{...meta,ultima:null});
  }
  tela();
})();
