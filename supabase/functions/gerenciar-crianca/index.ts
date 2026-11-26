// Pokemath — função "gerenciar-crianca"
// Usada pelo RESPONSÁVEL (logado) para: criar uma criança (gera código + guarda o PIN como hash)
// excluir uma criança (apaga todos os dados dela) e excluir a conta inteira do responsável.
//
// Configuração no painel (Edge Functions → gerenciar-crianca):
//   • "Verify JWT" pode ficar DESLIGADO: esta função confere o login do responsável por conta própria (passo 1 abaixo)
//     e recusa quem não estiver logado. (Com as chaves novas do Supabase, deixar ligado pode dar "Invalid JWT".)
//   • Segredo PM_SEGREDO_SENHA = o MESMO texto usado na função login-crianca.
//   • Só responsável APROVADO cria criança (quem confere é o banco: pm_criar_crianca). Excluir criança e excluir a
//     própria conta continuam permitidos em qualquer status (direito de exclusão).
//   • CONSENTIMENTO POR ESTUDANTE (ao criar): o pedido precisa trazer  consentimento: { versao, hash, perfil, acompanhamento }.
//       - perfil === true é OBRIGATÓRIO (sem ele a criança não é criada);
//       - acompanhamento === true é opcional (se vier, também é gravado).
//     O servidor só aceita um texto que ele conhece: versão E hash do texto têm que bater com o segredo
//       PM_TEXTOS_CONSENTIMENTO   (Edge Functions → Secrets), no formato  versao:hash  (vários separados por vírgula), ex.:
//       2026-11-v3:3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b
//     O hash é o SHA-256 (64 caracteres hexadecimais, minúsculos) do arquivo do texto, exatamente como o app o lê.
//     As autorizações são gravadas pela função do banco pm_registrar_autorizacao_estudante (006), chamada com o login
//     do próprio responsável (não com a chave secreta). Se gravar falhar, a criança é desfeita (nada fica sem autorização).
//     ATENÇÃO: não publique esta versão antes do formulário novo (etapa 3): o formulário antigo não envia o consentimento.

const ORIGENS_PADRAO = ["https://joycebn.github.io", "http://localhost:8080", "http://127.0.0.1:8080"];
const DOMINIO_TECNICO = "pokemath.example.com";   // e-mails técnicos das crianças (nunca recebem mensagens)

export function cors(req, env) {
  const lista = (env.PM_ORIGENS ? env.PM_ORIGENS.split(",") : ORIGENS_PADRAO).map((s) => s.trim());
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": lista.includes(o) ? o : lista[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
export const json = (corpo, status, cab) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cab, "Content-Type": "application/json" } });
export function cabecalhosChave(chave) {
  const h = { apikey: chave, "Content-Type": "application/json" };
  if (chave.startsWith("eyJ")) h.Authorization = "Bearer " + chave;
  return h;
}
export async function senhaTecnica(segredo, id) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(id));
  return Array.from(new Uint8Array(s)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Lê o segredo PM_TEXTOS_CONSENTIMENTO ("versao:hash,versao:hash") e devolve um mapa { versao: hash }.
export function textosValidos(env) {
  const mapa = {};
  for (const par of String(env.PM_TEXTOS_CONSENTIMENTO ?? "").split(",")) {
    const i = par.indexOf(":");
    if (i < 1) continue;
    const v = par.slice(0, i).trim(), h = par.slice(i + 1).trim().toLowerCase();
    if (v.length >= 1 && v.length <= 40 && /^[0-9a-f]{64}$/.test(h)) mapa[v] = h;
  }
  return mapa;
}
const erroPt = (erro, mensagem, status, cab) => json({ erro, mensagem }, status, cab);

export async function tratar(req, env, f = fetch) {
  const cab = cors(req, env);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cab });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405, cab);
  if (!env.PM_SEGREDO_SENHA || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ erro: "servidor_mal_configurado" }, 500, cab);

  // quem está chamando? (o token do responsável é conferido pelo próprio Supabase)
  const auth = req.headers.get("authorization") || "";
  const u = await f(env.SUPABASE_URL + "/auth/v1/user", { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: auth } });
  if (!u.ok) return json({ erro: "nao_autenticado" }, 401, cab);
  const user = await u.json();
  if (!user?.id || user.app_metadata?.papel === "crianca") return json({ erro: "nao_permitido" }, 403, cab);

  let b;
  try { b = await req.json(); } catch { return json({ erro: "pedido_invalido" }, 400, cab); }
  const chave = env.PM_CHAVE_SECRETA || env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = cabecalhosChave(chave);

  if (b?.acao === "criar") {
    const apelido = String(b.apelido ?? "").trim();
    const ano = Number(b.ano_escolar), idade = Number(b.idade), avatar = String(b.avatar ?? ""), pin = String(b.pin ?? "");
    if (apelido.length < 1 || apelido.length > 30) return json({ erro: "apelido_invalido" }, 400, cab);
    if (!Number.isInteger(ano) || ano < 3 || ano > 9) return json({ erro: "ano_invalido" }, 400, cab);
    if (!Number.isInteger(idade) || idade < 5 || idade > 18) return json({ erro: "idade_invalida" }, 400, cab);
    if (!/^a([1-9]|1[0-2])$/.test(avatar)) return json({ erro: "avatar_invalido" }, 400, cab);
    if (!/^\d{4}$/.test(pin)) return json({ erro: "pin_invalido" }, 400, cab);

    // ---- consentimento por estudante: conferido ANTES de criar qualquer coisa ----
    const cs = b.consentimento && typeof b.consentimento === "object" ? b.consentimento : {};
    if (cs.perfil !== true)
      return erroPt("consentimento_perfil_obrigatorio", "Para cadastrar a criança, é preciso marcar a autorização para criar o perfil dela.", 400, cab);
    const esperados = textosValidos(env);
    if (Object.keys(esperados).length === 0)
      return erroPt("texto_consentimento_nao_configurado", "O texto de consentimento ainda não está configurado no servidor. Fale com a pessoa responsável pelo Pokemath.", 500, cab);
    const versao = String(cs.versao ?? "").trim(), hash = String(cs.hash ?? "").trim().toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(esperados, versao) || esperados[versao] !== hash)
      return erroPt("texto_consentimento_invalido", "O texto de consentimento mudou ou não confere. Recarregue a página, leia o texto de novo e tente outra vez.", 400, cab);
    const tipos = cs.acompanhamento === true ? ["perfil", "acompanhamento"] : ["perfil"];

    const id = crypto.randomUUID();
    const email = "crianca-" + id + "@" + DOMINIO_TECNICO;
    const c = await f(env.SUPABASE_URL + "/auth/v1/admin/users", {
      method: "POST", headers: admin,
      body: JSON.stringify({ id, email, password: await senhaTecnica(env.PM_SEGREDO_SENHA, id), email_confirm: true, app_metadata: { papel: "crianca" } }),
    });
    if (!c.ok) return json({ erro: "falha_ao_criar_usuario" }, 502, cab);

    const rr = await f(env.SUPABASE_URL + "/rest/v1/rpc/pm_criar_crianca", {
      method: "POST", headers: admin,
      body: JSON.stringify({ p_id: id, p_responsavel: user.id, p_apelido: apelido, p_ano: ano, p_idade: idade, p_avatar: avatar, p_pin: pin, p_auth_email: email }),
    });
    if (!rr.ok) {
      await f(env.SUPABASE_URL + "/auth/v1/admin/users/" + id, { method: "DELETE", headers: admin });   // desfaz o usuário técnico
      const e = await rr.text();
      if (/responsavel_nao_aprovado/.test(e)) return json({ erro: "aguardando_aprovacao" }, 403, cab);   // cadastro ainda não aprovado
      return json({ erro: /limite_de_criancas/.test(e) ? "limite_de_criancas" : "falha_ao_criar" }, /limite_de_criancas/.test(e) ? 409 : 502, cab);
    }
    const codigo = await rr.json();

    // ---- grava as autorizações com o login do RESPONSÁVEL (a função do banco usa auth.uid()); falhou = desfaz a criança ----
    let falhou = false;
    for (const tipo of tipos) {
      try {
        const g = await f(env.SUPABASE_URL + "/rest/v1/rpc/pm_registrar_autorizacao_estudante", {
          method: "POST", headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({ p_crianca: id, p_tipo: tipo, p_versao: versao, p_hash: hash }),
        });
        if (!g.ok) { falhou = true; break; }
      } catch { falhou = true; break; }
    }
    if (falhou) {
      let desfeito = false;
      try { desfeito = (await f(env.SUPABASE_URL + "/auth/v1/admin/users/" + id, { method: "DELETE", headers: admin })).ok; } catch { /* segue */ }
      return desfeito
        ? erroPt("falha_ao_registrar_autorizacao", "Não foi possível registrar as autorizações, por isso a criança NÃO foi cadastrada. Tente de novo.", 502, cab)
        : erroPt("falha_ao_desfazer", "Não foi possível registrar as autorizações e o cadastro da criança não pôde ser desfeito. Não use esse cadastro: fale com a pessoa responsável pelo Pokemath para removê-lo.", 500, cab);
    }
    return json({ ok: true, crianca_id: id, codigo }, 200, cab);
  }

  if (b?.acao === "excluir") {
    const id = String(b.crianca_id ?? "");
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ erro: "pedido_invalido" }, 400, cab);
    // só exclui criança DESTE responsável. A consulta distingue três casos (antes, qualquer falha virava "não encontrada"):
    //   falha ao consultar → 502 | lista vazia → 404 | mais de uma linha → 409. (Mesmos cabeçalhos das outras chamadas + Accept.)
    let q, corpo = "", lista = null, falhaConsulta = false;
    try {
      q = await f(env.SUPABASE_URL + "/rest/v1/criancas?select=id&id=eq." + id + "&responsavel_id=eq." + user.id,
        { headers: { ...admin, Accept: "application/json" } });
      corpo = await q.text();
      if (q.status === 200) { try { lista = JSON.parse(corpo); } catch { lista = null; } }
    } catch (e) { falhaConsulta = true; corpo = "excecao: " + String(e?.message ?? e); }
    if (falhaConsulta || !q || q.status !== 200 || !Array.isArray(lista)) {
      // registra só identificadores, status e o corpo do erro do banco (nunca token, chave ou segredo)
      console.error("gerenciar-crianca", JSON.stringify({ acao: "excluir", crianca_id: id, responsavel: user.id, status_consulta: q ? q.status : null, tamanho_lista: Array.isArray(lista) ? lista.length : null, corpo_erro: corpo.slice(0, 500) }));
      return erroPt("falha_ao_consultar", "Não consegui consultar a criança agora. Tente de novo.", 502, cab);
    }
    console.log("gerenciar-crianca", JSON.stringify({ acao: "excluir", crianca_id: id, responsavel: user.id, status_consulta: q.status, tamanho_lista: lista.length }));
    if (lista.length === 0) return erroPt("nao_encontrada", "Essa criança não está na sua conta.", 404, cab);
    if (lista.length > 1) return erroPt("duplicada", "Há mais de um cadastro com esse identificador. Nada foi excluído; fale com a pessoa responsável pelo Pokemath.", 409, cab);
    const d = await f(env.SUPABASE_URL + "/auth/v1/admin/users/" + id, { method: "DELETE", headers: admin });   // apaga em cascata ficha, progresso e configuração
    if (!d.ok) return json({ erro: "falha_ao_excluir" }, 502, cab);
    return json({ ok: true }, 200, cab);
  }

  // ---- editar: apelido, ano escolar e idade de uma criança DESTA responsável ----
  // Mesma checagem de posse e mesmas respostas do "excluir" (502 / 404 / 409). Só estes três campos podem ser alterados;
  // não há checagem de aprovação (como no excluir). Os anos liberados (configuracoes) NÃO mudam ao trocar o ano.
  if (b?.acao === "editar") {
    const id = String(b.crianca_id ?? "");
    if (!/^[0-9a-f-]{36}$/.test(id)) return erroPt("pedido_invalido", "Pedido inválido.", 400, cab);
    const apelido = typeof b.apelido === "string" ? b.apelido.trim() : "";
    const ano = Number(b.ano_escolar), idade = Number(b.idade);
    if (apelido.length < 1 || apelido.length > 30) return erroPt("apelido_invalido", "O apelido precisa ter de 1 a 30 caracteres.", 400, cab);
    if (b.ano_escolar === null || b.ano_escolar === "" || !Number.isInteger(ano) || ano < 3 || ano > 9) return erroPt("ano_invalido", "O ano escolar precisa ser do 3º ao 9º ano.", 400, cab);
    if (b.idade === null || b.idade === "" || !Number.isInteger(idade) || idade < 5 || idade > 18) return erroPt("idade_invalida", "A idade precisa ser de 5 a 18 anos.", 400, cab);

    let q, corpo = "", lista = null, falhaConsulta = false;
    try {
      q = await f(env.SUPABASE_URL + "/rest/v1/criancas?select=id&id=eq." + id + "&responsavel_id=eq." + user.id,
        { headers: { ...admin, Accept: "application/json" } });
      corpo = await q.text();
      if (q.status === 200) { try { lista = JSON.parse(corpo); } catch { lista = null; } }
    } catch (e) { falhaConsulta = true; corpo = "excecao: " + String(e?.message ?? e); }
    if (falhaConsulta || !q || q.status !== 200 || !Array.isArray(lista)) {
      console.error("gerenciar-crianca", JSON.stringify({ acao: "editar", crianca_id: id, responsavel: user.id, status_consulta: q ? q.status : null, tamanho_lista: Array.isArray(lista) ? lista.length : null, corpo_erro: corpo.slice(0, 500) }));
      return erroPt("falha_ao_consultar", "Não consegui consultar a criança agora. Tente de novo.", 502, cab);
    }
    console.log("gerenciar-crianca", JSON.stringify({ acao: "editar", crianca_id: id, responsavel: user.id, status_consulta: q.status, tamanho_lista: lista.length }));
    if (lista.length === 0) return erroPt("nao_encontrada", "Essa criança não está na sua conta.", 404, cab);
    if (lista.length > 1) return erroPt("duplicada", "Há mais de um cadastro com esse identificador. Nada foi alterado; fale com a pessoa responsável pelo Pokemath.", 409, cab);

    // atualização filtrada por id E responsavel_id; só os três campos; devolve só as colunas pedidas (nunca pin_hash)
    let p, lp = null, codigo = null, falhaPatch = false;
    try {
      p = await f(env.SUPABASE_URL + "/rest/v1/criancas?id=eq." + id + "&responsavel_id=eq." + user.id + "&select=id,apelido,ano_escolar,idade",
        { method: "PATCH", headers: { ...admin, Accept: "application/json", Prefer: "return=representation" }, body: JSON.stringify({ apelido, ano_escolar: ano, idade }) });
      const txt = await p.text();
      let obj = null; try { obj = JSON.parse(txt); } catch { obj = null; }
      if (p.status === 200 && Array.isArray(obj)) lp = obj;
      else if (obj && typeof obj === "object" && typeof obj.code === "string") codigo = obj.code.slice(0, 20);   // só o código do erro: o texto do banco pode trazer a linha inteira
    } catch { falhaPatch = true; }
    if (falhaPatch || !p || !lp) {
      console.error("gerenciar-crianca", JSON.stringify({ acao: "editar", crianca_id: id, responsavel: user.id, status_patch: p ? p.status : null, codigo_erro: codigo }));
      return erroPt("falha_ao_salvar", "Não consegui salvar agora. Tente de novo.", 502, cab);
    }
    console.log("gerenciar-crianca", JSON.stringify({ acao: "editar", crianca_id: id, responsavel: user.id, status_patch: p.status, linhas_alteradas: lp.length }));
    if (lp.length === 0) return erroPt("nao_encontrada", "Essa criança não está na sua conta.", 404, cab);
    if (lp.length > 1) return erroPt("duplicada", "Mais de um cadastro foi alterado. Fale com a pessoa responsável pelo Pokemath.", 409, cab);
    return json({ ok: true, crianca: { id, apelido: lp[0].apelido ?? apelido, ano_escolar: lp[0].ano_escolar ?? ano, idade: lp[0].idade ?? idade } }, 200, cab);
  }

  if (b?.acao === "excluir_conta") {
    // apaga TODAS as crianças do responsável e depois a conta dele (direito de exclusão)
    const q = await f(env.SUPABASE_URL + "/rest/v1/criancas?select=id&responsavel_id=eq." + user.id, { headers: admin });
    const lista = q.ok ? await q.json() : null;
    if (!Array.isArray(lista)) return json({ erro: "falha_ao_excluir" }, 502, cab);
    for (const c of lista) {
      const d = await f(env.SUPABASE_URL + "/auth/v1/admin/users/" + c.id, { method: "DELETE", headers: admin });
      if (!d.ok) return json({ erro: "falha_ao_excluir" }, 502, cab);
    }
    const d = await f(env.SUPABASE_URL + "/auth/v1/admin/users/" + user.id, { method: "DELETE", headers: admin });
    if (!d.ok) return json({ erro: "falha_ao_excluir" }, 502, cab);
    return json({ ok: true, criancas_apagadas: lista.length }, 200, cab);
  }

  return json({ erro: "acao_desconhecida" }, 400, cab);
}

if (typeof Deno !== "undefined" && Deno.serve) {
  Deno.serve((req) => tratar(req, Deno.env.toObject()));
}
