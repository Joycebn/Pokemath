/* Pokemath — cliente mínimo do Supabase (usa fetch; sem biblioteca externa).
   Usa SOMENTE a chave publicável. Nenhuma chave secreta existe neste app. */
(function(){
  const C=window.PM_CONFIG||{url:"",chave:""};
  if(!window.PM_CONFIG)console.error("[Pokemath] PM_CONFIG não existe: o arquivo js/nuvem/config.js não foi carregado (confira se ele está no GitHub, na pasta js/nuvem/, e se a página tem <script src=\"js/nuvem/config.js\">).");
  const ler=(k)=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
  const gravar=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const apagar=(k)=>{try{localStorage.removeItem(k)}catch{}};

  /* Chamada HTTP. Nunca lança erro: devolve {ok,status,dados,rede,url,erro}.
     rede=true quando a requisição NÃO chegou ao servidor (sem internet, CORS, URL errada); erro = texto do navegador.
     Toda chamada escreve no console o endereço exato (sem a chave). */
  async function http(caminho,o={}){
    const alvo=(C.url||"")+caminho;
    console.log("[Pokemath] chamando:",o.metodo||"GET",alvo);
    if(!C.url)return{ok:false,status:0,dados:null,rede:true,url:alvo,erro:"PM_CONFIG.url vazio"};
    const h={apikey:C.chave,"Content-Type":"application/json",...(o.cabecalhos||{})};
    if(o.token)h.Authorization="Bearer "+o.token;
    try{
      const r=await fetch(alvo,{method:o.metodo||"GET",headers:h,body:o.corpo!==undefined?JSON.stringify(o.corpo):undefined,keepalive:!!o.keepalive});
      let d=null;try{d=await r.json()}catch{}
      if(!r.ok)console.warn("[Pokemath] o servidor respondeu erro",r.status,"em",alvo,d);
      return{ok:r.ok,status:r.status,dados:d,rede:false,url:alvo};
    }catch(e){console.error("[Pokemath] a requisição NÃO chegou ao servidor:",alvo,e&&e.message||e);return{ok:false,status:0,dados:null,rede:true,url:alvo,erro:String(e&&e.message||e)}}
  }
  const rest=(tabela,consulta,token)=>http("/rest/v1/"+tabela+(consulta?"?"+consulta:""),{token});
  const rpc=(nome,args,token,o={})=>http("/rest/v1/rpc/"+nome,{metodo:"POST",corpo:args||{},token,...o});
  const funcao=(nome,corpo,token)=>http("/functions/v1/"+nome,{metodo:"POST",corpo,token});

  const auth={
    cadastrar:(email,senha,meta,voltar)=>http("/auth/v1/signup"+(voltar?"?redirect_to="+encodeURIComponent(voltar):""),{metodo:"POST",corpo:{email,password:senha,data:meta}}),   // voltar = emailRedirectTo (para onde o link do e-mail leva)
    entrar:(email,senha)=>http("/auth/v1/token?grant_type=password",{metodo:"POST",corpo:{email,password:senha}}),
    renovar:(refresh)=>http("/auth/v1/token?grant_type=refresh_token",{metodo:"POST",corpo:{refresh_token:refresh}}),
    sair:(token)=>http("/auth/v1/logout",{metodo:"POST",token})
  };

  /* ---- sessão da criança (neste aparelho) ---- */
  const CH_CRIANCA="pm-sessao";
  const sessaoCrianca=()=>ler(CH_CRIANCA);
  const guardarCrianca=s=>gravar(CH_CRIANCA,s);
  const sairCrianca=()=>apagar(CH_CRIANCA);
  /* devolve um token válido (renova se faltam < 2 min). null = sem internet ou sessão perdida. */
  async function tokenCrianca(forcar){
    const s=sessaoCrianca();if(!s||!s.access)return null;
    if(!forcar&&s.expira&&s.expira-Date.now()>120000)return s.access;
    if(!s.refresh)return null;
    const r=await auth.renovar(s.refresh);
    if(r.ok&&r.dados&&r.dados.access_token){
      const n={...s,access:r.dados.access_token,refresh:r.dados.refresh_token||s.refresh,expira:(r.dados.expires_at?r.dados.expires_at*1000:Date.now()+3e6)};
      guardarCrianca(n);return n.access;
    }
    if(r.rede||r.status>=500)return (s.expira&&s.expira>Date.now())?s.access:null;   // sem internet: usa o token se ainda vale
    guardarCrianca({...s,expirada:true});return null;                                  // o servidor recusou: precisa entrar de novo
  }
  /* Texto para mostrar ao usuário quando uma chamada falhou (r = resultado de http). */
  const motivo=r=>{
    if(!r)return "";
    if(r.rede)return "Não consegui falar com o servidor. Verifique a URL do Supabase.";
    const d=r.dados||{},m=d.msg||d.message||d.error_description||d.erro||(typeof d.error==="string"?d.error:"")||"";
    return "O servidor respondeu com erro "+r.status+(m?": "+m:"")+".";
  };
  window.PM={config:C,motivo,http,rest,rpc,funcao,auth,ler,gravar,apagar,sessaoCrianca,guardarCrianca,sairCrianca,tokenCrianca};
})();
