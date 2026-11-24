/* Pokemath — cliente mínimo do Supabase (usa fetch; sem biblioteca externa).
   Usa SOMENTE a chave publicável. Nenhuma chave secreta existe neste app. */
(function(){
  const C=window.PM_CONFIG;
  const ler=(k)=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
  const gravar=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const apagar=(k)=>{try{localStorage.removeItem(k)}catch{}};

  /* Chamada HTTP. Nunca lança erro: devolve {ok,status,dados,rede}. rede=true quando não há internet. */
  async function http(caminho,o={}){
    const h={apikey:C.chave,"Content-Type":"application/json",...(o.cabecalhos||{})};
    if(o.token)h.Authorization="Bearer "+o.token;
    try{
      const r=await fetch(C.url+caminho,{method:o.metodo||"GET",headers:h,body:o.corpo!==undefined?JSON.stringify(o.corpo):undefined,keepalive:!!o.keepalive});
      let d=null;try{d=await r.json()}catch{}
      return{ok:r.ok,status:r.status,dados:d,rede:false};
    }catch(e){return{ok:false,status:0,dados:null,rede:true}}
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
  window.PM={config:C,http,rest,rpc,funcao,auth,ler,gravar,apagar,sessaoCrianca,guardarCrianca,sairCrianca,tokenCrianca};
})();
