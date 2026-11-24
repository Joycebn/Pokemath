// Testa as Edge Functions (login-crianca e gerenciar-crianca) com um Supabase simulado.  node tests/teste_funcoes.js
const fs=require("fs"),path=require("path"),os=require("os");
let ok=0,bad=0;const t=(n,c)=>{if(c){ok++}else{bad++;console.log("FALHOU:",n)}};
function carregar(nome){const src=fs.readFileSync(path.join(__dirname,"..","supabase","functions",nome,"index.ts"),"utf8");
  const f=path.join(os.tmpdir(),"pmfn_"+nome+".mjs");fs.writeFileSync(f,src);return import("file://"+f)}
const ENV={SUPABASE_URL:"https://x.supabase.co",SUPABASE_ANON_KEY:"sb_publishable_ANON",SUPABASE_SERVICE_ROLE_KEY:"eyJSERVICO",PM_SEGREDO_SENHA:"segredo-longo-de-teste"};
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
  let log;const mg=(o={})=>async(url,opt={})=>{log.push({url,m:opt.method||"GET",b:opt.body});
    if(url.endsWith("/auth/v1/user"))return o.semUsuario?R({},401):R({id:RESP,app_metadata:o.papel?{papel:o.papel}:{}});
    if(url.endsWith("/auth/v1/admin/users"))return o.falhaUsuario?R({},500):R({id:"x"});
    if(url.includes("/auth/v1/admin/users/"))return R({});
    if(url.includes("/rpc/pm_criar_crianca"))return o.erroRpc?new Response(o.erroRpc,{status:400}):R("K7M2QP");
    if(url.includes("/rest/v1/criancas?"))return R(o.achou===false?[]:[{id:"x"}]);
    return R({},404)};
  const NOVA={acao:"criar",apelido:" Ana ",ano_escolar:6,idade:11,avatar:"a3",pin:"1234"};
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer JWT"}),ENV,mg());j=await r.json();
  t("criar criança: devolve o código",r.status===200&&j.ok&&j.codigo==="K7M2QP");
  const cu=JSON.parse(log[1].b);
  t("usuário técnico: papel=crianca, e-mail técnico, e-mail já confirmado",cu.app_metadata.papel==="crianca"&&cu.email.endsWith("@pokemath.example.com")&&cu.email_confirm===true&&cu.password.length===64);
  const cr=JSON.parse(log[2].b);t("responsável vem do TOKEN, não do corpo",cr.p_responsavel===RESP&&cr.p_apelido==="Ana"&&cr.p_id===cu.id);
  r=await G.tratar(req({...NOVA,responsavel_id:"outro"},{authorization:"Bearer JWT"}),ENV,mg());t("campo responsavel_id enviado pelo cliente é ignorado",r.status===200&&JSON.parse(log[log.length-1].b).p_responsavel===RESP);
  log=[];r=await G.tratar(req(NOVA),ENV,mg({semUsuario:true}));t("sem login → 401",r.status===401);
  r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({papel:"crianca"}));t("uma CRIANÇA logada não pode criar/excluir crianças → 403",r.status===403);
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({erroRpc:"limite_de_criancas"}));
  t("limite de crianças: 409 e o usuário técnico é desfeito",r.status===409&&log.some(x=>x.m==="DELETE"&&x.url.includes("/admin/users/")));
  log=[];r=await G.tratar(req(NOVA,{authorization:"Bearer J"}),ENV,mg({erroRpc:"qualquer"}));t("falha no banco: desfaz o usuário técnico",r.status===502&&log.some(x=>x.m==="DELETE"));
  for(const [n,c] of [["PIN curto",{...NOVA,pin:"12"}],["ano 2",{...NOVA,ano_escolar:2}],["idade 30",{...NOVA,idade:30}],["avatar ruim",{...NOVA,avatar:"x"}],["apelido vazio",{...NOVA,apelido:"  "}],["apelido gigante",{...NOVA,apelido:"x".repeat(31)}]]){
    log=[];r=await G.tratar(req(c,{authorization:"Bearer J"}),ENV,mg());t("criar: "+n+" recusado sem criar nada",r.status===400&&!log.some(x=>x.m==="POST"&&x.url.includes("admin")))}
  log=[];r=await G.tratar(req({acao:"excluir",crianca_id:"11111111-1111-1111-1111-111111111111"},{authorization:"Bearer J"}),ENV,mg());
  t("excluir criança do próprio responsável",r.status===200&&log.some(x=>x.m==="DELETE")&&log.find(x=>x.url.includes("/rest/v1/criancas?")).url.includes("responsavel_id=eq."+RESP));
  log=[];r=await G.tratar(req({acao:"excluir",crianca_id:"22222222-2222-2222-2222-222222222222"},{authorization:"Bearer J"}),ENV,mg({achou:false}));
  t("excluir criança de OUTRA família → 404 e nada é apagado",r.status===404&&!log.some(x=>x.m==="DELETE"));
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
