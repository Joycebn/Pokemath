// Pokemath — função "login-crianca"
// A criança entra com CÓDIGO + FIGURA (avatar) + PIN de 4 números, sem e-mail.
// Quem confere e limita as tentativas erradas é o banco (função pm_login_verificar):
//   5 erros por código e 30 por origem (IP) a cada 15 min → bloqueio de 15 min.
// Esta função NÃO pode ser chamada com a chave secreta de fora: a chave secreta (service_role) fica
// guardada só aqui, no servidor, e nunca vai para o app.
//
// Configuração no painel (Edge Functions → login-crianca):
//   • "Verify JWT" DESLIGADO (a criança ainda não tem sessão quando chama).
//   • Segredo PM_SEGREDO_SENHA = um texto longo e aleatório (veja o passo a passo).
//   • SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente.

const ORIGENS_PADRAO = ["https://joycebn.github.io", "http://localhost:8080", "http://127.0.0.1:8080"];

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

// Cabeçalhos para falar com o Supabase usando uma chave (JWT antigo ou chave secreta nova sb_secret_...)
export function cabecalhosChave(chave) {
  const h = { apikey: chave, "Content-Type": "application/json" };
  if (chave.startsWith("eyJ")) h.Authorization = "Bearer " + chave;
  return h;
}

// Senha técnica da criança = HMAC(segredo do servidor, id). Nunca é guardada nem mostrada: é recalculada.
export async function senhaTecnica(segredo, id) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(id));
  return Array.from(new Uint8Array(s)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function tratar(req, env, f = fetch) {
  const cab = cors(req, env);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cab });
  if (req.method !== "POST") return json({ erro: "metodo" }, 405, cab);

  let b;
  try { b = await req.json(); } catch { return json({ erro: "pedido_invalido" }, 400, cab); }
  const codigo = String(b?.codigo ?? "").trim().toUpperCase();
  const avatar = String(b?.avatar ?? "");
  const pin = String(b?.pin ?? "");
  if (!/^[A-Z0-9]{6}$/.test(codigo) || !/^a([1-9]|1[0-2])$/.test(avatar) || !/^\d{4}$/.test(pin)) {
    return json({ erro: "dados_incorretos" }, 401, cab);          // mesma resposta de "errado": não revela o que faltou
  }
  if (!env.PM_SEGREDO_SENHA || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ erro: "servidor_mal_configurado" }, 500, cab);

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "desconhecido";
  const chaveSecreta = env.PM_CHAVE_SECRETA || env.SUPABASE_SERVICE_ROLE_KEY;

  // 1) o banco confere código + figura + PIN e aplica o limite de tentativas
  const v = await f(env.SUPABASE_URL + "/rest/v1/rpc/pm_login_verificar", {
    method: "POST", headers: cabecalhosChave(chaveSecreta),
    body: JSON.stringify({ p_codigo: codigo, p_avatar: avatar, p_pin: pin, p_ip: ip }),
  });
  if (!v.ok) return json({ erro: "indisponivel" }, 502, cab);
  const r = await v.json();
  if (!r.ok) {
    if (r.erro === "bloqueado") return json({ erro: "bloqueado", espera_seg: r.espera_seg }, 429, cab);
    return json({ erro: "dados_incorretos" }, 401, cab);
  }

  // 2) abre a sessão da criança (usuário técnico; a senha é derivada do segredo do servidor)
  const senha = await senhaTecnica(env.PM_SEGREDO_SENHA, r.crianca_id);
  const t = await f(env.SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: env.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: r.auth_email, password: senha }),
  });
  if (!t.ok) return json({ erro: "sessao" }, 502, cab);
  const s = await t.json();
  return json({
    ok: true,
    sessao: { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at },
    crianca: { id: r.crianca_id, apelido: r.apelido, avatar: r.avatar, ano_escolar: r.ano_escolar },
  }, 200, cab);
}

if (typeof Deno !== "undefined" && Deno.serve) {
  Deno.serve((req) => tratar(req, Deno.env.toObject()));
}
