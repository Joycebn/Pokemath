// Pokemath — função "gerenciar-crianca"
// Usada pelo RESPONSÁVEL (logado) para: criar uma criança (gera código + guarda o PIN como hash)
// excluir uma criança (apaga todos os dados dela) e excluir a conta inteira do responsável.
//
// Configuração no painel (Edge Functions → gerenciar-crianca):
//   • "Verify JWT" pode ficar DESLIGADO: esta função confere o login do responsável por conta própria (passo 1 abaixo)
//     e recusa quem não estiver logado. (Com as chaves novas do Supabase, deixar ligado pode dar "Invalid JWT".)
//   • Segredo PM_SEGREDO_SENHA = o MESMO texto usado na função login-crianca.

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
      return json({ erro: /limite_de_criancas/.test(e) ? "limite_de_criancas" : "falha_ao_criar" }, /limite_de_criancas/.test(e) ? 409 : 502, cab);
    }
    const codigo = await rr.json();
    return json({ ok: true, crianca_id: id, codigo }, 200, cab);
  }

  if (b?.acao === "excluir") {
    const id = String(b.crianca_id ?? "");
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ erro: "pedido_invalido" }, 400, cab);
    // só exclui criança DESTE responsável
    const q = await f(env.SUPABASE_URL + "/rest/v1/criancas?select=id&id=eq." + id + "&responsavel_id=eq." + user.id, { headers: admin });
    const lista = q.ok ? await q.json() : [];
    if (!Array.isArray(lista) || lista.length !== 1) return json({ erro: "nao_encontrada" }, 404, cab);
    const d = await f(env.SUPABASE_URL + "/auth/v1/admin/users/" + id, { method: "DELETE", headers: admin });   // apaga em cascata ficha, progresso e configuração
    if (!d.ok) return json({ erro: "falha_ao_excluir" }, 502, cab);
    return json({ ok: true }, 200, cab);
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
