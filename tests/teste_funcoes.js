// Testa as Edge Functions (login-crianca e gerenciar-crianca) com um Supabase simulado.  node tests/teste_funcoes.js
const fs=require("fs"),path=require("path"),os=require("os");
let ok=0,bad=0;const t=(n,c)=>{if(c){ok++}else{bad++;console.log("FALHOU:",n)}};
function carregar(nome){const src=fs.readFileSync(path.join(__dirname,"..","supabase","functions",nome,"index.ts"),"utf8");
  const f=path.join(os.tmpdir(),"pmfn_"+nome+".mjs");fs.writeFileSync(f,src);return import("file://"+f)}
const ENV={SUPABASE_URL:"https://x.supabase.co",SUPABASE_ANON_KEY:"sb_publishable_ANON",SUPABASE_SERVICE_ROLE_KEY:"eyJSERVICO",PM_SEGREDO_SENHA:"segredo-longo-de-teste",
  PM_TEXTOS_CONSENTIMENTO:"2026-11-v3:"+"ab".repeat(32)};   // texto de TESTE (o hash do texto final ainda não existe)
const HASH_OK="ab".repeat(32);
const req=(corpo,cab={},metodo="POST")=>new Request("https://x.supabase.co/functions/v1/f",{method:metodo,headers:{"content-type":"application/json",origin:"https://joycebn.github.io",...cab},body:metodo==="POST"?(typeof corpo==="string"?corpo:JSON.stringify(corpo)):undefined});
const R=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json"}});

(async()=>{
  /* ============ login-crianca ============ */
  const L=await carregar("login-crianca");
  let chamadas;const mk=(verif)=>async(url,o)=>{chamadas.push({url,o});
    if(url.includes("/rpc/pm_login_verificar"))return R(verif(JSON.parse(o.body)));
    if(url.includes("grant_type=password"))return R({access_token:"AT",refresh_token:"RT",expires_at:123});
    return R({},404)};
  const BOM={ok:true,crianca_id:"11111111-1111-1111-1111-111111111111",auth_email:"c@pokemath.example.com",apelido:"Ana",avatar:"a3",ano_escolar:6};
  chamadas=[];let r=await L.tratar(req({codigo:"abc234",avatar:"a3",pin:"1234"},{"x-forwarded-for":"9.9.9.9, 10.0.0.1"}),ENV,mk(()=>BOM));
  let j=await r.json();
  t("login correto: 200 + sessão",r.status===200&&j.ok&&j.sessao.access_token==="AT"&&j.crianca.apelido==="Ana");
  const rpc=JSON.parse(chamadas[0].o.body);
  t("código vai em maiúsculas e o IP é o primeiro do x-forwarded-for",rpc.p_codigo==="ABC234"&&rpc.p_ip==="9.9.9.9");
  t("chave secreta usada só no servidor (cabeçalho), nunca na resposta",chamadas[0].o.headers.Authorization==="Bearer eyJSERVICO"&&!JSON.stringify(j).includes("eyJSERVICO")&&!JSON.stringify(j).includes("segredo-longo"));
  t("senha técnica NÃO é o PIN",!chamadas[1].o.body.includes('"1234"')&&JSON.parse(chamadas[1].o.body).password.length===64);
  const s1=await L.senhaTecnica("segredo","id-1"),s2=await L.senhaTecnica("segredo","id-1"),s3=await L.senhaTecnica("segredo","id-2"),s4=await L.senhaTecnica("outro","id-1");
  t("senha técnica é estável por criança e depende do segredo",s1===s2&&s1!==s3&&s1!==s4);
  chamadas=[];r=await L.tratar(req({codigo:"ABC234",avatar:"a3",pin:"0000"}),ENV,mk(()=>({ok:false,erro:"dados_incorretos"})));
  t("PIN errado: 401 sem dizer o motivo",r.status===401&&(await r.json()).erro==="dados_incorretos"&&chamadas.length===1);
  r=await L.tratar(req({codigo:"ABC234",avatar:"a3",pin:"0000"}),ENV,mk(()=>({ok:false,erro:"bloqueado",espera_seg:600})));
  j=await r.json();t("bloqueado: 429 com tempo de espera",r.status===429&&j.erro==="bloqueado"&&j.espera_seg===600);
  for(const [n,c] of [["código curto",{codigo:"AB",avatar:"a3",pin:"1234"}],["avatar inválido",{codigo:"ABC234",avatar:"a99",pin:"1234"}],["pin com letra",{codigo:"ABC234",avatar:"a3",pin:"12a4"}],["pin de 5 dígitos",{codigo:"ABC234",avatar:"a3",pin:"12345"}],["vazio",{}]]){
    chamadas=[];r=await L.tratar(req(c),ENV,mk(()=>BOM));t("entrada inválida ("+n+") nem chega ao banco",r.status===401&&chamadas.length===0)}
  r=await L.tratar(req("isso não é json"),ENV,mk(()=>BOM));t("corpo que não é JSON → 400",r.status===400);
  r=await L.tratar(req(null,{},"GET"),ENV,mk(()=>BOM));t("GET recusado (405)",r.status===405);
  r=await L.tratar(req({codigo:"ABC234",avatar:"a3",pin:"1234"}),{...ENV,PM_SEGREDO_SENHA:undefined},mk(()=>BOM));t("sem segredo configurado → 500 claro",r.status===500);
  r=await L.tratar(req(null,{},"OPTIONS"),ENV,mk(()=>BOM));t("preflight CORS ok para o site do app",r.status===204&&r.headers.get("access-control-allow-origin")==="https://joycebn.github.io");
  r=await L.tratar(req({codigo:"ABC234",avatar:"a3",pin:"1234"},{origin:"https://site-malvado.com"}),ENV,mk(()=>BOM));
  t("origem desconhecida não recebe permissão CORS",r.headers.get("access-control-allow-origin")==="https://joycebn.github.io");
  r=await L.tratar(req({codigo:"ABC234",avatar:"a3",pin:"1234"}),ENV,async(u)=>u.includes("grant_type")?R({},400):R(BOM));t("falha ao abrir sessão → 502 (sem vazar detalhes)",r.status===502);
  const cab=L.cabecalhosChave("sb_secret_abc");t("chave nova (sb_secret_) vai só em apikey, sem Bearer",cab.apikey==="sb_secret_abc"&&!cab.Authorization);

  /* ============ gerenciar-crianca ============ */
  const G=await carregar("gerenciar-crianca");
  const RESP="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  let log;const mg=(o={})=>async(url,opt={})=>{log.push({url,m:opt.method||"GET",b:opt.body,h:opt.headers});
    if(url.endsWith("/auth/v1/user"))return o.semUsuario?R({},401):R({id:RESP,app_metadata:o.papel?{papel:o.papel}:{}});
    if(url.endsWith("/auth/v1/admin/users"))return o.falhaUsuario?R({},500):R({id:"x"});
    if(url.includes("/auth/v1/admin/users/"))return opt.method==="DELETE"&&o.falhaDesfazer?R({},500):R({});
    if(url.includes("/rpc/pm_criar_crianca"))return o.erroRpc?new Response(o.erroRpc,{status:400}):R("K7M2QP");
    if(url.includes("/rpc/pm_registrar_autorizacao_estudante")){const tp=JSON.parse(opt.body).p_tipo;return(o.falhaRegistro===true||o.falhaRegistro===tp)?new Response("erro interno do banco",{status:400}):R(7)}
    if(url.includes("/rest/v1/criancas?")&&opt.method==="PATCH"){if(o.patchRede)throw new Error("rede caiu");
      if(o.patchStatus)return new Response(o.patchCorpo??"{\"code\":\"23514\",\"message\":\"new row violates check\",\"details\":\"Failing row contains (pin_hash=$2a$10$SEGREDODOHASH, auth_email=crianca-x@pokemath.example.com)\"}",{status:o.patchStatus});
      if(o.patchTexto!==undefined)return new Response(o.patchTexto,{status:200});
      const corpoP=JSON.parse(opt.body);return R(o.patchLinhas===0?[]:o.patchLinhas===2?[{id:"x",...corpoP},{id:"y",...corpoP}]:[{id:"x",...corpoP}])}
    if(url.includes("/rest/v1/criancas?")){if(o.consultaStatus)return new Response(o.consultaCorpo??"{\"message\":\"erro do banco\"}",{status:o.consultaStatus});if(o.consultaTexto!==undefined)return new Response(o.consultaTexto,{status:200});if(o.consultaRede)throw new Error("rede caiu");return R(o.dois?[{id:"x"},{id:"y"}]:o.achou===false?[]:[{id:"x"}])}
    return R({},404)};
  const CONS={versao:"2026-11-v3",hash:HASH_OK,perfil:true,acompanhamento:false};
  const NOVA={acao:"criar",apelido:" Ana ",ano_escolar:6,idade:11,avatar:"a3",pin:"1234",consentimento:CONS};
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer JWT"}),ENV,mg());j=await r.json();
  t("criar criança: devolve o código",r.status===200&&j.ok&&j.codigo==="K7M2QP");
  const cu=JSON.parse(log[1].b);
  t("usuário técnico: papel=crianca, e-mail técnico, e-mail já confirmado",cu.app_metadata.papel==="crianca"&&cu.email.endsWith("@pokemath.example.com")&&cu.email_confirm===true&&cu.password.length===64);
  const cr=JSON.parse(log[2].b);t("responsável vem do TOKEN, não do corpo",cr.p_responsavel===RESP&&cr.p_apelido==="Ana"&&cr.p_id===cu.id);
  r=await G.tratar(req({...NOVA,responsavel_id:"outro"},{authorization:"Bearer JWT"}),ENV,mg());t("campo responsavel_id enviado pelo cliente é ignorado",r.status===200&&JSON.parse(log.find(x=>x.url.includes("pm_criar_crianca")).b).p_responsavel===RESP);
  log=[];r=await G.tratar(req(NOVA),ENV,mg({semUsuario:true}));t("sem login → 401",r.status===401);
  r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({papel:"crianca"}));t("uma CRIANÇA logada não pode criar/excluir crianças → 403",r.status===403);
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({erroRpc:"limite_de_criancas"}));
  t("limite de crianças: 409 e o usuário técnico é desfeito",r.status===409&&log.some(x=>x.m==="DELETE"&&x.url.includes("/admin/users/")));
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({erroRpc:"responsavel_nao_aprovado"}));j=await r.json();
  t("responsável NÃO aprovado: 403 aguardando_aprovacao e o usuário técnico é desfeito",r.status===403&&j.erro==="aguardando_aprovacao"&&log.some(x=>x.m==="DELETE"&&x.url.includes("/admin/users/")));
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({erroRpc:"qualquer"}));t("falha no banco: desfaz o usuário técnico",r.status===502&&log.some(x=>x.m==="DELETE"));
  /* ---- consentimento por estudante (etapa 2) ---- */
  const nada=()=>!log.some(x=>x.m==="POST"&&(x.url.includes("/admin/users")||x.url.includes("pm_criar_crianca")||x.url.includes("pm_registrar_autorizacao")));
  const registros=()=>log.filter(x=>x.url.includes("pm_registrar_autorizacao_estudante")).map(x=>JSON.parse(x.b));
  for(const [n,c] of [["sem o bloco de consentimento",(()=>{const x={...NOVA};delete x.consentimento;return x})()],["perfil não marcado",{...NOVA,consentimento:{...CONS,perfil:false}}],["perfil como texto 'true'",{...NOVA,consentimento:{...CONS,perfil:"true"}}],["só o acompanhamento marcado",{...NOVA,consentimento:{...CONS,perfil:false,acompanhamento:true}}]]){
    log=[];r=await G.tratar(req(c,{authorization:"Bearer J"}),ENV,mg());j=await r.json();
    t("SEM a caixa 1 ("+n+"): 400 em português e NADA é criado",r.status===400&&j.erro==="consentimento_perfil_obrigatorio"&&/autorização para criar o perfil/.test(j.mensagem)&&nada())}
  for(const [n,c] of [["versão desconhecida",{...CONS,versao:"2026-11-v9"}],["hash errado",{...CONS,hash:"cd".repeat(32)}],["hash vazio",{...CONS,hash:""}],["versão certa com hash de outra versão",{...CONS,hash:"ef".repeat(32)}],["versão '__proto__'",{...CONS,versao:"__proto__"}]]){
    log=[];r=await G.tratar(req({...NOVA,consentimento:c},{authorization:"Bearer J"}),ENV,mg());j=await r.json();
    t("texto inválido ("+n+"): 400 em português e nada é criado",r.status===400&&j.erro==="texto_consentimento_invalido"&&/Recarregue a página/.test(j.mensagem)&&nada())}
  log=[];r=await G.tratar(req({...NOVA,consentimento:{...CONS,hash:HASH_OK.toUpperCase()}},{authorization:"Bearer J"}),ENV,mg());
  t("hash em maiúsculas é aceito (comparação ignora caixa)",r.status===200);
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),{...ENV,PM_TEXTOS_CONSENTIMENTO:undefined},mg());j=await r.json();
  t("texto de consentimento não configurado no servidor: 500 claro e nada é criado",r.status===500&&j.erro==="texto_consentimento_nao_configurado"&&/pessoa responsável/.test(j.mensagem)&&nada());
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),{...ENV,PM_TEXTOS_CONSENTIMENTO:"lixo,sem-dois-pontos,v:curto"},mg());
  t("segredo mal formado = como não configurado",r.status===500&&nada());
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),{...ENV,PM_TEXTOS_CONSENTIMENTO:"2026-11-v2:"+"cd".repeat(32)+" , 2026-11-v3:"+HASH_OK},mg());
  t("vários textos no segredo: aceita qualquer um dos listados",r.status===200);
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer JWT-DO-RESP"}),ENV,mg());j=await r.json();
  const rg=registros(),gc=log.find(x=>x.url.includes("pm_registrar_autorizacao_estudante")),idCri=JSON.parse(log.find(x=>x.url.includes("pm_criar_crianca")).b).p_id;
  t("SÓ caixa 1: cria a criança e registra SÓ o perfil (versão, hash e criança certos)",r.status===200&&j.ok&&j.codigo==="K7M2QP"&&rg.length===1&&rg[0].p_tipo==="perfil"&&rg[0].p_versao==="2026-11-v3"&&rg[0].p_hash===HASH_OK&&rg[0].p_crianca===idCri);
  t("o registro usa o login do RESPONSÁVEL e a chave pública, nunca a chave secreta",gc&&gc.url.endsWith("/rest/v1/rpc/pm_registrar_autorizacao_estudante"));
  log=[];await G.tratar(req(NOVA,{authorization:"Bearer JWT-DO-RESP"}),ENV,(u,o={})=>{log.push({url:u,m:o.method||"GET",b:o.body,h:o.headers});return mg()(u,o)});
  const hh=log.find(x=>x.url.includes("pm_registrar_autorizacao_estudante")).h;
  t("cabeçalhos do registro: Bearer do responsável + apikey pública",hh.Authorization==="Bearer JWT-DO-RESP"&&hh.apikey==="sb_publishable_ANON"&&!JSON.stringify(hh).includes("eyJSERVICO"));
  log=[];r=await G.tratar(req({...NOVA,consentimento:{...CONS,acompanhamento:true}},{authorization:"Bearer J"}),ENV,mg());j=await r.json();
  t("caixas 1 e 2: registra perfil E acompanhamento, com a mesma versão e hash",r.status===200&&j.ok&&registros().map(x=>x.p_tipo).join()==="perfil,acompanhamento"&&registros().every(x=>x.p_versao==="2026-11-v3"&&x.p_hash===HASH_OK));
  log=[];r=await G.tratar(req({...NOVA,consentimento:{...CONS,acompanhamento:"sim"}},{authorization:"Bearer J"}),ENV,mg());
  t("acompanhamento só vale se for exatamente true",r.status===200&&registros().length===1);
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({falhaRegistro:true}));j=await r.json();
  t("falha ao registrar o perfil: criança DESFEITA, erro em português, sucesso não é devolvido",r.status===502&&j.erro==="falha_ao_registrar_autorizacao"&&/NÃO foi cadastrada/.test(j.mensagem)&&!j.ok&&log.some(x=>x.m==="DELETE"&&x.url.endsWith("/admin/users/"+idCri2(log))));
  function idCri2(l){return JSON.parse(l.find(x=>x.url.includes("pm_criar_crianca")).b).p_id}
  log=[];r=await G.tratar(req({...NOVA,consentimento:{...CONS,acompanhamento:true}},{authorization:"Bearer J"}),ENV,mg({falhaRegistro:"acompanhamento"}));j=await r.json();
  t("perfil gravou mas o acompanhamento falhou: a criança inteira é desfeita",r.status===502&&j.erro==="falha_ao_registrar_autorizacao"&&log.some(x=>x.m==="DELETE"&&x.url.endsWith("/admin/users/"+idCri2(log))));
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({falhaRegistro:true,falhaDesfazer:true}));j=await r.json();
  t("falha no registro E no desfazer: erro claro (500) pedindo para não usar o cadastro",r.status===500&&j.erro==="falha_ao_desfazer"&&/fale com a pessoa responsável/.test(j.mensagem));
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,async(u,o={})=>{if(u.includes("pm_registrar_autorizacao"))throw new Error("rede caiu");return mg()(u,o)});j=await r.json();
  t("queda de rede ao registrar também desfaz a criança",r.status===502&&j.erro==="falha_ao_registrar_autorizacao");
  t("nenhuma mensagem de erro novo vaza chave, senha ou texto técnico",!/eyJ|sb_|segredo|password|JWT|SQL|erro interno do banco/i.test(JSON.stringify(j)));
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({erroRpc:"responsavel_nao_aprovado"}));j=await r.json();
  t("pendente/bloqueado (fluxo anterior): continua 403 aguardando_aprovacao, sem registrar autorização, usuário técnico desfeito",r.status===403&&j.erro==="aguardando_aprovacao"&&registros().length===0&&log.some(x=>x.m==="DELETE"));
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({erroRpc:"limite_de_criancas"}));
  t("limite de 10 crianças: continua 409 e sem registrar autorização",r.status===409&&registros().length===0);
  for(const [n,c] of [["PIN curto",{...NOVA,pin:"12"}],["ano 2",{...NOVA,ano_escolar:2}],["idade 30",{...NOVA,idade:30}],["avatar ruim",{...NOVA,avatar:"x"}],["apelido vazio",{...NOVA,apelido:"  "}],["apelido gigante",{...NOVA,apelido:"x".repeat(31)}]]){
    log=[];r=await G.tratar(req(c,{authorization:"Bearer J"}),ENV,mg());t("criar: "+n+" recusado sem criar nada",r.status===400&&!log.some(x=>x.m==="POST"&&x.url.includes("admin")))}
  log=[];r=await G.tratar(req({acao:"excluir",crianca_id:"11111111-1111-1111-1111-111111111111"},{authorization:"Bearer J"}),ENV,mg());
  t("excluir criança do próprio responsável",r.status===200&&log.some(x=>x.m==="DELETE")&&log.find(x=>x.url.includes("/rest/v1/criancas?")).url.includes("responsavel_id=eq."+RESP));
  log=[];r=await G.tratar(req({acao:"excluir",crianca_id:"22222222-2222-2222-2222-222222222222"},{authorization:"Bearer J"}),ENV,mg({achou:false}));
  t("excluir criança de OUTRA família → 404 e nada é apagado",r.status===404&&!log.some(x=>x.m==="DELETE"));
  /* excluir: a consulta distingue falha / vazio / duplicado e explica o motivo */
  {const ID1="11111111-1111-1111-1111-111111111111",ex=async(o)=>{log=[];try{return await G.tratar(req({acao:"excluir",crianca_id:ID1},{authorization:"Bearer J"}),ENV,mg(o))}catch(e){return{status:0,json:async()=>({erro:"EXCECAO NA FUNCAO: "+String(e.message).slice(0,60)})}}};   // exceção não derruba a suíte: vira falha com mensagem
   let rr=await ex({consultaStatus:500}),jj=await rr.json();
   t("excluir (a): consulta com HTTP 500 → falha_ao_consultar, 502, mensagem em português, nada apagado",rr.status===502&&jj.erro==="falha_ao_consultar"&&/Não consegui consultar a criança agora\. Tente de novo\./.test(jj.mensagem)&&!log.some(x=>x.m==="DELETE"),JSON.stringify(jj)+" "+rr.status);
   rr=await ex({consultaStatus:401});jj=await rr.json();t("excluir: consulta com HTTP 401 também é falha_ao_consultar (não vira 'não encontrada')",rr.status===502&&jj.erro==="falha_ao_consultar");
   rr=await ex({consultaTexto:"isto não é uma lista"});jj=await rr.json();t("excluir: resposta 200 que não é JSON → falha_ao_consultar",rr.status===502&&jj.erro==="falha_ao_consultar"&&!log.some(x=>x.m==="DELETE"));
   rr=await ex({consultaTexto:'{"a":1}'});jj=await rr.json();t("excluir: resposta 200 que não é uma lista → falha_ao_consultar",rr.status===502&&jj.erro==="falha_ao_consultar");
   rr=await ex({consultaRede:true});jj=await rr.json();t("excluir: consulta que lança erro de rede → falha_ao_consultar (502)",rr.status===502&&jj.erro==="falha_ao_consultar"&&!log.some(x=>x.m==="DELETE"));
   rr=await ex({achou:false});jj=await rr.json();
   t("excluir (b): lista vazia → nao_encontrada, 404, 'Essa criança não está na sua conta.', nada apagado",rr.status===404&&jj.erro==="nao_encontrada"&&jj.mensagem==="Essa criança não está na sua conta."&&!log.some(x=>x.m==="DELETE"),JSON.stringify(jj)+" "+rr.status);
   rr=await ex({dois:true});jj=await rr.json();
   t("excluir (c): lista com dois itens → duplicada, 409, mensagem clara, nada apagado",rr.status===409&&jj.erro==="duplicada"&&/mais de um cadastro/.test(jj.mensagem)&&!log.some(x=>x.m==="DELETE"),JSON.stringify(jj)+" "+rr.status);
   rr=await ex({});jj=await rr.json();
   t("excluir (d): criança do responsável correto é excluída normalmente (200, ok, DELETE na criança certa)",rr.status===200&&jj.ok===true&&log.filter(x=>x.m==="DELETE").length===1&&log.find(x=>x.m==="DELETE").url.endsWith("/auth/v1/admin/users/"+ID1),JSON.stringify(jj));
   const cq=log.find(x=>x.url.includes("/rest/v1/criancas?"));
   t("excluir: a consulta exige a posse (responsavel_id do login) e envia Accept: application/json com os cabeçalhos de chave de sempre",cq.url.includes("responsavel_id=eq."+RESP)&&cq.url.includes("id=eq."+ID1)&&cq.h.Accept==="application/json"&&!!cq.h.apikey);
   /* o log da função: ação, status, tamanho da lista, erro do banco — e nunca token/chave */
   const logs=[];const oL=console.log,oE=console.error;console.log=(...x)=>logs.push(x.join(" "));console.error=(...x)=>logs.push(x.join(" "));
   try{await ex({consultaStatus:500});await ex({dois:true});await ex({})}finally{console.log=oL;console.error=oE}
   const tl=logs.join("\n");
   t("excluir: o log registra ação, status da consulta, tamanho da lista, ids e o corpo do erro",/"acao":"excluir"/.test(tl)&&/"status_consulta":500/.test(tl)&&/"tamanho_lista":2/.test(tl)&&/erro do banco/.test(tl)&&tl.includes(ID1)&&tl.includes(RESP));
   t("excluir: o log nunca contém token, chave ou segredo",!/Bearer|JWT|eyJ|service|secret|SEGREDO|apikey/i.test(tl)&&!tl.includes(ENV.PM_SEGREDO_SENHA)&&!tl.includes(ENV.SUPABASE_SERVICE_ROLE_KEY||"@@"));}
  /* editar: apelido, ano e idade — mesma posse e mesmas respostas do excluir */
  {const ID2="22222222-2222-2222-2222-222222222222",DADOS={acao:"editar",crianca_id:ID2,apelido:"  Bia  ",ano_escolar:7,idade:12};
   const ed=async(o,extra={})=>{log=[];try{return await G.tratar(req({...DADOS,...extra},{authorization:"Bearer J"}),ENV,mg(o))}catch(e){return{status:0,json:async()=>({erro:"EXCECAO NA FUNCAO: "+String(e.message).slice(0,60)})}}};
   const toques=()=>log.filter(x=>x.url.includes("/rest/v1/criancas")).length;
   let rr=await ed({}),jj=await rr.json();const pat=log.find(x=>x.m==="PATCH");
   t("editar (dono): 200, ok e a criança com os três campos novos (apelido sem espaços)",rr.status===200&&jj.ok===true&&jj.crianca&&jj.crianca.apelido==="Bia"&&jj.crianca.ano_escolar===7&&jj.crianca.idade===12,JSON.stringify(jj)+" "+rr.status);
   t("editar: o PATCH envia SÓ apelido, ano_escolar e idade (nada de pin_hash, codigo, responsavel_id, auth_email, ativo, avatar)",!!pat&&JSON.stringify(Object.keys(JSON.parse(pat.b)).sort())===JSON.stringify(["ano_escolar","apelido","idade"])&&JSON.parse(pat.b).apelido==="Bia");
   t("editar: o PATCH é filtrado por id E por responsavel_id e pede de volta só id, apelido, ano_escolar e idade",!!pat&&pat.url.includes("id=eq."+ID2)&&pat.url.includes("responsavel_id=eq."+RESP)&&/select=id,apelido,ano_escolar,idade/.test(pat.url)&&!/pin_hash|auth_email/.test(pat.url));
   t("editar: mesmos cabeçalhos de chave do excluir (apikey + Authorization de servidor) + Accept e Prefer",!!pat&&!!pat.h.apikey&&pat.h.Authorization==="Bearer eyJSERVICO"&&pat.h.Accept==="application/json"&&/return=representation/.test(pat.h.Prefer||""));
   rr=await ed({achou:false});jj=await rr.json();
   t("editar (outro responsável / criança inexistente): 404 nao_encontrada, 'Essa criança não está na sua conta.', sem PATCH",rr.status===404&&jj.erro==="nao_encontrada"&&jj.mensagem==="Essa criança não está na sua conta."&&!log.some(x=>x.m==="PATCH"),JSON.stringify(jj)+" "+rr.status);
   rr=await ed({consultaStatus:500});jj=await rr.json();
   t("editar: consulta com HTTP 500 → 502 falha_ao_consultar, mensagem em português, sem PATCH",rr.status===502&&jj.erro==="falha_ao_consultar"&&/Não consegui consultar a criança agora/.test(jj.mensagem)&&!log.some(x=>x.m==="PATCH"),JSON.stringify(jj)+" "+rr.status);
   rr=await ed({consultaRede:true});jj=await rr.json();t("editar: erro de rede na consulta → 502 falha_ao_consultar",rr.status===502&&jj.erro==="falha_ao_consultar"&&!log.some(x=>x.m==="PATCH"));
   rr=await ed({dois:true});jj=await rr.json();
   t("editar: duas linhas na consulta → 409 duplicada, sem PATCH",rr.status===409&&jj.erro==="duplicada"&&!log.some(x=>x.m==="PATCH"),JSON.stringify(jj)+" "+rr.status);
   const fora=[["apelido vazio",{apelido:"   "},"apelido_invalido"],["apelido com 31 caracteres",{apelido:"a".repeat(31)},"apelido_invalido"],["apelido que não é texto",{apelido:{x:1}},"apelido_invalido"],["ano 2",{ano_escolar:2},"ano_invalido"],["ano 10",{ano_escolar:10},"ano_invalido"],["ano 6.5",{ano_escolar:6.5},"ano_invalido"],["idade 4",{idade:4},"idade_invalida"],["idade 19",{idade:19},"idade_invalida"],["idade texto",{idade:"abc"},"idade_invalida"],["crianca_id malformado",{crianca_id:"../../x"},"pedido_invalido"]];
   for(const [nome,extra,erro] of fora){rr=await ed({},extra);jj=await rr.json();t("editar: "+nome+" → 400 "+erro+" sem tocar o banco",rr.status===400&&jj.erro===erro&&toques()===0&&!log.some(x=>x.m==="PATCH"),JSON.stringify(jj)+" "+rr.status+" toques="+toques())}
   rr=await ed({},{apelido:"a".repeat(30),ano_escolar:3,idade:5});t("editar: limites aceitos (apelido 30, ano 3, idade 5) → 200",rr.status===200);
   rr=await ed({},{ano_escolar:9,idade:18});t("editar: limites aceitos (ano 9, idade 18) → 200",rr.status===200);
   rr=await ed({},{apelido:" ",mensagemTexto:1});jj=await rr.json();t("editar: erros de validação trazem mensagem em português",/apelido/i.test(jj.mensagem||""),JSON.stringify(jj));
   rr=await ed({patchLinhas:0});jj=await rr.json();
   t("editar: PATCH que muda 0 linhas → 404 nao_encontrada",rr.status===404&&jj.erro==="nao_encontrada",JSON.stringify(jj)+" "+rr.status);
   rr=await ed({patchLinhas:2});jj=await rr.json();t("editar: PATCH que muda 2 linhas → 409 duplicada",rr.status===409&&jj.erro==="duplicada",JSON.stringify(jj)+" "+rr.status);
   rr=await ed({patchStatus:400});jj=await rr.json();
   t("editar: banco recusa a gravação → 502 falha_ao_salvar, mensagem em português, sem vazar a linha do banco",rr.status===502&&jj.erro==="falha_ao_salvar"&&/Não consegui salvar/.test(jj.mensagem)&&!JSON.stringify(jj).includes("SEGREDODOHASH"),JSON.stringify(jj)+" "+rr.status);
   rr=await ed({patchTexto:"isto não é uma lista"});jj=await rr.json();t("editar: resposta 200 do PATCH que não é lista → 502 falha_ao_salvar",rr.status===502&&jj.erro==="falha_ao_salvar");
   rr=await ed({patchRede:true});jj=await rr.json();t("editar: erro de rede no PATCH → 502 falha_ao_salvar",rr.status===502&&jj.erro==="falha_ao_salvar");
   rr=await G.tratar(req(DADOS,{}),ENV,mg({semUsuario:true}));t("editar: sem login → 401",rr.status===401);
   rr=await G.tratar(req(DADOS,{authorization:"Bearer J"}),ENV,mg({papel:"crianca"}));t("editar: login de criança → 403",rr.status===403);
   const logs=[];const oL=console.log,oE=console.error;console.log=(...x)=>logs.push(x.join(" "));console.error=(...x)=>logs.push(x.join(" "));
   try{await ed({});await ed({achou:false});await ed({dois:true});await ed({consultaStatus:500});await ed({patchStatus:400});await ed({patchLinhas:0})}finally{console.log=oL;console.error=oE}
   const tl=logs.join("\n");
   t("editar: o log registra ação, ids, status da consulta, tamanho da lista e status do PATCH",/"acao":"editar"/.test(tl)&&tl.includes(ID2)&&tl.includes(RESP)&&/"status_consulta":200/.test(tl)&&/"tamanho_lista":1/.test(tl)&&/"status_patch":400/.test(tl),tl.slice(0,300));
   t("editar: o log nunca contém token, chave, segredo, hash de PIN, e-mail técnico nem a linha do banco",!/Bearer|JWT|eyJ|service|secret|SEGREDO|apikey|SEGREDODOHASH|pin_hash|auth_email|pokemath\.example/i.test(tl)&&!tl.includes(ENV.SUPABASE_SERVICE_ROLE_KEY),tl.slice(0,300));}
  r=await G.tratar(req({acao:"excluir",crianca_id:"../../x"},{authorization:"Bearer J"}),ENV,mg());t("excluir com id malformado → 400",r.status===400);
  /* excluir a conta inteira */
  log=[];const mc=async(url,opt={})=>{log.push({url,m:opt.method||"GET"});
    if(url.endsWith("/auth/v1/user"))return R({id:RESP,app_metadata:{}});
    if(url.includes("/rest/v1/criancas?select=id&responsavel_id=eq."))return R([{id:"c1"},{id:"c2"}]);
    return R({})};
  r=await G.tratar(req({acao:"excluir_conta"},{authorization:"Bearer J"}),ENV,mc);j=await r.json();
  const dels=log.filter(x=>x.m==="DELETE").map(x=>x.url.split("/").pop());
  t("excluir conta: apaga cada criança e por último o responsável",r.status===200&&j.criancas_apagadas===2&&dels.join()==="c1,c2,"+RESP);
  log=[];r=await G.tratar(req({acao:"excluir_conta"},{authorization:"Bearer J"}),ENV,async(u,o)=>u.includes("admin/users/c1")?R({},500):mc(u,o));
  t("falha ao apagar uma criança: para e não apaga a conta do responsável",r.status===502&&!log.some(x=>x.m==="DELETE"&&x.url.endsWith(RESP)));
  r=await G.tratar(req({acao:"fazer-coisa"},{authorization:"Bearer J"}),ENV,mg());t("ação desconhecida → 400",r.status===400);

  console.log(`\nPASSARAM: ${ok}   FALHARAM: ${bad}`);process.exit(bad?1:0);
})();
