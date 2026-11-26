-- =====================================================================================
-- Pokemath · 006 · CONSENTIMENTO POR ESTUDANTE  (etapa 1: SOMENTE o banco)
-- Rode no SQL Editor depois do 001–005. PODE rodar mais de uma vez (não dá erro e não apaga nada).
-- Este script NÃO altera os arquivos 001–005, nem as tabelas e políticas que já existem:
-- só acrescenta uma tabela nova, suas regras de acesso e duas funções.
-- Não contém chave nem senha.
--
-- O que guarda: para cada CRIANÇA, duas autorizações distintas do responsável:
--   • 'perfil'         → criar o perfil da criança (obrigatória; não tem "retirada": retirar = excluir a criança)
--   • 'acompanhamento' → acompanhamento pela professora (opcional; pode ser RETIRADA sem excluir o perfil)
-- Cada autorização guarda a versão do texto, a data/hora e o hash (SHA-256) do texto aceito.
-- A de acompanhamento guarda também a data de retirada (retirado_em), se houver.
--
-- Histórico: cada aceite é uma linha NOVA e nunca é reescrita. Retirar apenas preenche retirado_em.
-- Se o responsável autorizar de novo depois de retirar, entra outra linha (a anterior fica no histórico).
-- Vale a autorização cuja linha tem retirado_em vazio (no máximo uma por criança e tipo).
--
-- Os consentimentos que já existem (tabela "consentimentos", do responsável) NÃO são tocados nem
-- convertidos: eles continuam valendo como registro do aceite antigo. Crianças já cadastradas ficam
-- SEM autorização por estudante até a etapa do formulário novo coletá-la (nada é preenchido por conta própria).
--
-- Exclusão: ao excluir a criança (ou a conta), as linhas desta tabela dela são apagadas junto (cascata).
-- =====================================================================================

-- ---------- Tabela ----------
create table if not exists public.consentimentos_estudante (
  id           bigint generated always as identity primary key,
  crianca_id   uuid not null references public.criancas (id) on delete cascade,
  tipo         text not null check (tipo in ('perfil', 'acompanhamento')),
  versao_texto text not null check (char_length(versao_texto) between 1 and 40),
  texto_hash   text not null check (texto_hash ~ '^[0-9a-f]{64}$'),      -- SHA-256 do texto aceito, em hexadecimal minúsculo
  aceito_em    timestamptz not null default now(),
  retirado_em  timestamptz,                                              -- só a autorização de acompanhamento pode ser retirada
  constraint ce_retirada_so_acompanhamento check (retirado_em is null or tipo = 'acompanhamento'),
  constraint ce_retirada_depois_do_aceite  check (retirado_em is null or retirado_em >= aceito_em)
);
comment on table public.consentimentos_estudante is
  'Autorizações do responsável POR CRIANÇA (perfil e acompanhamento pela professora). Histórico: cada aceite é uma linha; retirar só preenche retirado_em.';

-- No máximo UMA autorização "vigente" (sem retirada) por criança e tipo.
create unique index if not exists ce_vigente_idx
  on public.consentimentos_estudante (crianca_id, tipo) where retirado_em is null;
create index if not exists ce_crianca_idx
  on public.consentimentos_estudante (crianca_id, tipo, aceito_em desc);

-- ---------- Proteção contra alteração (segunda camada) ----------
-- O app não tem permissão de escrever direto na tabela (veja abaixo). Mesmo assim, se um papel do app tentar
-- mudar algo além de "retirado_em: vazio → preenchido", o banco recusa. O painel do Supabase (postgres) continua livre.
create or replace function public.pm_proteger_consentimento_estudante() returns trigger
language plpgsql set search_path = public as $$   -- SEM security definer: precisa enxergar QUEM está escrevendo (current_user)
begin
  if current_user in ('anon', 'authenticated', 'service_role') then
    if old.retirado_em is not null
       or new.id is distinct from old.id or new.crianca_id is distinct from old.crianca_id
       or new.tipo is distinct from old.tipo or new.versao_texto is distinct from old.versao_texto
       or new.texto_hash is distinct from old.texto_hash or new.aceito_em is distinct from old.aceito_em then
      raise exception 'consentimento_nao_pode_ser_alterado' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists pm_proteger_consentimento_estudante on public.consentimentos_estudante;
create trigger pm_proteger_consentimento_estudante before update on public.consentimentos_estudante
  for each row execute function public.pm_proteger_consentimento_estudante();

-- ---------- Acesso (RLS): mesma lógica das outras tabelas ----------
alter table public.consentimentos_estudante enable row level security;
revoke all on public.consentimentos_estudante from anon, authenticated;
revoke all on sequence public.consentimentos_estudante_id_seq from anon, authenticated;
grant select on public.consentimentos_estudante to authenticated;       -- ESCRITA só pelas duas funções abaixo

-- O responsável APROVADO vê só as autorizações das crianças da própria conta. Criança logada não vê nada aqui.
drop policy if exists ce_ver on public.consentimentos_estudante;
create policy ce_ver on public.consentimentos_estudante for select to authenticated
  using (public.pm_sou_responsavel_aprovado()
         and exists (select 1 from public.criancas c where c.id = crianca_id and c.responsavel_id = auth.uid()));

-- ---------- Funções (única porta de escrita) ----------
-- Registrar uma autorização. Exige: responsável aprovado e criança da própria conta.
-- Se já existe uma vigente do mesmo tipo, não duplica: devolve o id da que existe.
create or replace function public.pm_registrar_autorizacao_estudante(
  p_crianca uuid, p_tipo text, p_versao text, p_hash text) returns bigint
language plpgsql security definer set search_path = public as $$
declare novo bigint;
begin
  if not public.pm_sou_responsavel_aprovado() then raise exception 'responsavel_nao_aprovado'; end if;
  if not exists (select 1 from public.criancas where id = p_crianca and responsavel_id = auth.uid()) then
    raise exception 'crianca_nao_encontrada';
  end if;
  if p_tipo is null or p_tipo not in ('perfil', 'acompanhamento') then raise exception 'tipo_invalido'; end if;
  if p_versao is null or char_length(trim(p_versao)) not between 1 and 40 then raise exception 'versao_invalida'; end if;
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then raise exception 'hash_invalido'; end if;

  insert into public.consentimentos_estudante (crianca_id, tipo, versao_texto, texto_hash)
  values (p_crianca, p_tipo, trim(p_versao), p_hash)
  on conflict (crianca_id, tipo) where retirado_em is null do nothing
  returning id into novo;
  if novo is null then
    select id into novo from public.consentimentos_estudante
     where crianca_id = p_crianca and tipo = p_tipo and retirado_em is null;
  end if;
  return novo;
end $$;

-- Retirar o acompanhamento pela professora (NÃO exclui o perfil nem a criança). Devolve true se retirou agora.
-- Retirar é um direito: vale mesmo se a conta estiver pendente ou bloqueada; exige só ser a criança da própria conta.
create or replace function public.pm_retirar_acompanhamento(p_crianca uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from public.criancas where id = p_crianca and responsavel_id = auth.uid()) then
    raise exception 'crianca_nao_encontrada';
  end if;
  update public.consentimentos_estudante set retirado_em = now()
   where crianca_id = p_crianca and tipo = 'acompanhamento' and retirado_em is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

revoke all on function public.pm_proteger_consentimento_estudante() from public, anon, authenticated;
revoke all on function public.pm_registrar_autorizacao_estudante(uuid, text, text, text) from public, anon;
revoke all on function public.pm_retirar_acompanhamento(uuid) from public, anon;
grant execute on function public.pm_registrar_autorizacao_estudante(uuid, text, text, text) to authenticated;
grant execute on function public.pm_retirar_acompanhamento(uuid) to authenticated;
