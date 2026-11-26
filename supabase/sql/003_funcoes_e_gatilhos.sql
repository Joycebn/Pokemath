-- =====================================================================
-- Pokemath — 003: funções e gatilhos
-- =====================================================================

-- ---------- Cadastro do responsável COM consentimento ----------
-- O app envia, no cadastro (signUp), os dados: nome, consentimento_aceito = true,
-- consentimento_versao (ex.: "2026-11-v1") e consentimento_hash (hash do texto exibido).
-- Sem consentimento, o cadastro é recusado. Usuários de criança (papel = 'crianca') são ignorados aqui.
create or replace function public.pm_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare v text; n text;
begin
  -- Usuários técnicos de criança (criados só pelo servidor) não passam pelo consentimento.
  -- O e-mail técnico é só uma segunda garantia: um usuário assim não enxerga nada sem uma ficha em "criancas".
  if coalesce(new.raw_app_meta_data ->> 'papel', '') = 'crianca'
     or coalesce(new.email, '') like 'crianca-%@pokemath.example.com' then return new; end if;
  v := new.raw_user_meta_data ->> 'consentimento_versao';
  if v is null or length(trim(v)) = 0 or coalesce(new.raw_user_meta_data ->> 'consentimento_aceito', '') <> 'true' then
    raise exception 'consentimento_obrigatorio' using errcode = 'P0001';
  end if;
  n := nullif(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), '');
  insert into public.responsaveis (id, nome, email, status) values (new.id, coalesce(left(n, 80), 'Responsável'), new.email, 'pendente');   -- sempre pendente: aprovação manual
  insert into public.consentimentos (responsavel_id, versao_texto, texto_hash, aceito)
    values (new.id, left(v, 40), left(new.raw_user_meta_data ->> 'consentimento_hash', 128), true);
  return new;
end $$;

drop trigger if exists pm_novo_usuario on auth.users;
create trigger pm_novo_usuario after insert on auth.users
  for each row execute function public.pm_novo_usuario();

-- ---------- Aprovação manual: proteção do status e funções auxiliares ----------
-- O status só muda pelo painel (papel postgres). Se um dia alguém conceder UPDATE por engano, este gatilho ainda recusa.
create or replace function public.pm_proteger_status() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated', 'service_role') then
    raise exception 'status_somente_pelo_painel' using errcode = '42501';
  end if;
  new.status_alterado_em := now();
  return new;
end $$;
drop trigger if exists pm_proteger_status on public.responsaveis;
create trigger pm_proteger_status before update on public.responsaveis
  for each row when (old.status is distinct from new.status) execute function public.pm_proteger_status();

-- "Quem está logado é um responsável aprovado?"  (usada pelas regras de acesso; só diz sim/não sobre o próprio usuário)
create or replace function public.pm_sou_responsavel_aprovado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.responsaveis where id = auth.uid() and status = 'aprovado');
$$;
-- "Quem está logado é uma criança cujo responsável está aprovado?"
create or replace function public.pm_crianca_logada_liberada() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.criancas c join public.responsaveis r on r.id = c.responsavel_id
                  where c.id = auth.uid() and r.status = 'aprovado');
$$;

-- ---------- Nova criança: cria a configuração padrão ----------
create or replace function public.pm_nova_crianca() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.configuracoes (crianca_id, ano_escolar_liberado) values (new.id, new.ano_escolar)
  on conflict (crianca_id) do nothing;
  return new;
end $$;
drop trigger if exists pm_nova_crianca on public.criancas;
create trigger pm_nova_crianca after insert on public.criancas
  for each row execute function public.pm_nova_crianca();

-- ---------- Progresso: preenche o resumo a partir do "estado" ----------
create or replace function public.pm_resumo_progresso() returns trigger
language plpgsql as $$
declare comp text; ent jsonb;
begin
  new.moedas           := public.pm_int(new.estado, 'coins');
  new.ofensiva_atual   := public.pm_int(new.estado, 'streak');
  new.ofensiva_maxima  := greatest(public.pm_int(new.estado, 'maxStreak'), new.ofensiva_atual);
  new.ultimo_dia_estudo := case when (new.estado ->> 'last') ~ '^\d{4}-\d{2}-\d{2}$' then (new.estado ->> 'last')::date end;
  comp := new.estado ->> 'comp';
  new.companheiro_id := nullif(public.pm_int(new.estado, 'comp'), 0);
  ent := case when jsonb_typeof(new.estado -> 'caught') = 'object' and comp is not null then new.estado -> 'caught' -> comp end;
  new.xp_companheiro    := public.pm_int(ent, 'xp');
  new.nivel_companheiro := greatest(public.pm_int(ent, 'nivel'), 1);
  new.pokemon := case when jsonb_typeof(new.estado -> 'caught') = 'object' then new.estado -> 'caught' else '{}'::jsonb end;
  new.pokemon_total := (select count(*) from jsonb_object_keys(new.pokemon));
  new.fases := case when jsonb_typeof(new.estado -> 'fases') = 'object' then new.estado -> 'fases' else '{}'::jsonb end;
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists pm_resumo_progresso on public.progresso;
create trigger pm_resumo_progresso before insert or update on public.progresso
  for each row execute function public.pm_resumo_progresso();

-- ---------- Configurações: controla a versão ----------
create or replace function public.pm_config_versao() returns trigger
language plpgsql as $$
begin
  new.versao := old.versao + 1;
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists pm_config_versao on public.configuracoes;
create trigger pm_config_versao before update on public.configuracoes
  for each row execute function public.pm_config_versao();

-- ---------- Código da criança (6 caracteres, sem 0/O/1/I/L) ----------
create or replace function public.pm_gerar_codigo() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; r text := ''; b bytea; i int;
begin
  b := gen_random_bytes(6);
  for i in 0..5 loop r := r || substr(alfabeto, (get_byte(b, i) % 31) + 1, 1); end loop;
  return r;
end $$;

-- ---------- Criar criança (SOMENTE o servidor chama; o PIN vira hash aqui) ----------
create or replace function public.pm_criar_crianca(
  p_id uuid, p_responsavel uuid, p_apelido text, p_ano smallint, p_idade smallint,
  p_avatar text, p_pin text, p_auth_email text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare cod text; tent int := 0;
begin
  if p_pin is null or p_pin !~ '^\d{4}$' then raise exception 'pin_invalido'; end if;
  if not exists (select 1 from public.responsaveis where id = p_responsavel and status = 'aprovado') then
    raise exception 'responsavel_nao_aprovado';
  end if;
  if (select count(*) from public.criancas where responsavel_id = p_responsavel) >= 10 then
    raise exception 'limite_de_criancas';
  end if;
  loop
    cod := public.pm_gerar_codigo();
    begin
      insert into public.criancas (id, responsavel_id, apelido, ano_escolar, idade, avatar, codigo, pin_hash, auth_email)
      values (p_id, p_responsavel, trim(p_apelido), p_ano, p_idade, p_avatar, cod, crypt(p_pin, gen_salt('bf', 10)), p_auth_email);
      return cod;
    exception when unique_violation then
      tent := tent + 1; if tent > 5 then raise; end if;
    end;
  end loop;
end $$;

-- ---------- Registro de falha de login (por chave) ----------
create or replace function public.pm_registrar_falha(p_chave text, p_limite int, p_janela interval, p_bloqueio interval) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.tentativas_login (chave, falhas, janela_inicio) values (p_chave, 1, now())
  on conflict (chave) do update set
    falhas = case when tentativas_login.janela_inicio is null or tentativas_login.janela_inicio < now() - p_janela
                  then 1 else tentativas_login.falhas + 1 end,
    janela_inicio = case when tentativas_login.janela_inicio is null or tentativas_login.janela_inicio < now() - p_janela
                         then now() else tentativas_login.janela_inicio end,
    atualizado_em = now();
  update public.tentativas_login set bloqueado_ate = now() + p_bloqueio, falhas = 0, janela_inicio = null
   where chave = p_chave and falhas >= p_limite;
end $$;

-- ---------- LOGIN DA CRIANÇA (SOMENTE o servidor chama) ----------
-- Confere código + avatar + PIN. Limites: 5 erros por código e 30 por origem (IP) a cada 15 minutos;
-- ao passar, o bloqueio dura 15 minutos. A resposta é a MESMA para código inexistente e PIN errado.
create or replace function public.pm_login_verificar(p_codigo text, p_avatar text, p_pin text, p_ip text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  lim_cod constant int := 5;  lim_ip constant int := 30;
  janela constant interval := interval '15 minutes';  bloqueio constant interval := interval '15 minutes';
  k_cod text; k_ip text; espera int; c record; certo boolean := false;
begin
  p_codigo := upper(coalesce(trim(p_codigo), ''));
  p_ip := coalesce(nullif(trim(p_ip), ''), 'desconhecido');
  k_cod := 'c:' || left(p_codigo, 12);  k_ip := 'i:' || left(p_ip, 64);

  -- 1) já está bloqueado?
  select greatest(0, ceil(extract(epoch from (max(bloqueado_ate) - now()))))::int into espera
    from public.tentativas_login where chave in (k_cod, k_ip) and bloqueado_ate > now();
  if coalesce(espera, 0) > 0 then
    return jsonb_build_object('ok', false, 'erro', 'bloqueado', 'espera_seg', espera);
  end if;

  -- 2) confere (sempre gasta o mesmo tempo de hash, exista ou não o código)
  select * into c from public.criancas where codigo = p_codigo and ativo;
  if found then
    if c.avatar = coalesce(p_avatar, '') and p_pin ~ '^\d{4}$' and c.pin_hash = crypt(p_pin, c.pin_hash) then certo := true; end if;
    -- Responsável pendente ou bloqueado: trata como "dados incorretos" (mesma resposta, mesmo registro de falha,
    -- sem revelar o motivo). A conferência vem DEPOIS do hash para o tempo de resposta não denunciar nada.
    if certo and not exists (select 1 from public.responsaveis where id = c.responsavel_id and status = 'aprovado') then
      certo := false;
    end if;
  else
    perform crypt(coalesce(p_pin, ''), gen_salt('bf', 10));
  end if;

  if certo then
    delete from public.tentativas_login where chave = k_cod;
    update public.criancas set ultimo_acesso = now() where id = c.id;
    return jsonb_build_object('ok', true, 'crianca_id', c.id, 'auth_email', c.auth_email,
                              'apelido', c.apelido, 'avatar', c.avatar, 'ano_escolar', c.ano_escolar);
  end if;

  -- 3) registra a falha (por código e por origem) e limpa registros antigos
  perform public.pm_registrar_falha(k_cod, lim_cod, janela, bloqueio);
  perform public.pm_registrar_falha(k_ip, lim_ip, janela, bloqueio);
  delete from public.tentativas_login where atualizado_em < now() - interval '1 day' and (bloqueado_ate is null or bloqueado_ate < now());

  select greatest(0, ceil(extract(epoch from (max(bloqueado_ate) - now()))))::int into espera
    from public.tentativas_login where chave in (k_cod, k_ip) and bloqueado_ate > now();
  if coalesce(espera, 0) > 0 then
    return jsonb_build_object('ok', false, 'erro', 'bloqueado', 'espera_seg', espera);
  end if;
  return jsonb_build_object('ok', false, 'erro', 'dados_incorretos');
end $$;

-- ---------- O responsável redefine o PIN de uma criança dele ----------
create or replace function public.pm_redefinir_pin(p_crianca uuid, p_pin text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare cod text;
begin
  if auth.uid() is null then raise exception 'nao_autenticado'; end if;
  if p_pin is null or p_pin !~ '^\d{4}$' then raise exception 'pin_invalido'; end if;
  if not public.pm_sou_responsavel_aprovado() then return false; end if;
  select codigo into cod from public.criancas where id = p_crianca and responsavel_id = auth.uid();
  if cod is null then return false; end if;
  update public.criancas set pin_hash = crypt(p_pin, gen_salt('bf', 10)) where id = p_crianca;
  delete from public.tentativas_login where chave = 'c:' || cod;
  return true;
end $$;

-- ---------- Salvar o progresso (a criança só grava o próprio; controle de conflito por versão) ----------
create or replace function public.pm_salvar_progresso(p_estado jsonb, p_versao bigint, p_dispositivo text default null) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare uid uuid := auth.uid(); nv bigint;
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  if not public.pm_crianca_logada_liberada() then
    return jsonb_build_object('ok', false, 'erro', 'sem_acesso');   -- família pendente/bloqueada: nada é gravado na nuvem
  end if;
  insert into public.progresso as p (crianca_id, estado, versao, dispositivo)
  values (uid, p_estado, 1, left(p_dispositivo, 60))
  on conflict (crianca_id) do update
     set estado = excluded.estado, versao = p.versao + 1, dispositivo = excluded.dispositivo
   where p.versao = p_versao
  returning p.versao into nv;
  if nv is null then
    return jsonb_build_object('ok', false, 'erro', 'conflito', 'versao', (select versao from public.progresso where crianca_id = uid));
  end if;
  return jsonb_build_object('ok', true, 'versao', nv);
end $$;

-- ---------- Novo consentimento (ex.: nova versão do texto ou revogação) ----------
create or replace function public.pm_registrar_consentimento(p_versao text, p_hash text default null, p_aceito boolean default true) returns bigint
language plpgsql security invoker set search_path = public as $$
declare novo bigint;
begin
  if not public.pm_sou_responsavel_aprovado() then raise exception 'responsavel_nao_aprovado'; end if;
  insert into public.consentimentos (responsavel_id, versao_texto, texto_hash, aceito)
  values (auth.uid(), left(p_versao, 40), left(p_hash, 128), p_aceito) returning id into novo;
  return novo;
end $$;
