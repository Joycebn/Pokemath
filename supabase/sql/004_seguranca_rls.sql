-- =====================================================================
-- Pokemath — 004: segurança (Row Level Security) e permissões
-- Regras:
--   • Cada criança só lê e grava os PRÓPRIOS dados.
--   • O responsável só enxerga as crianças da PRÓPRIA conta.
--   • O PIN (hash) e o e-mail técnico nunca são visíveis ao app.
--   • A visitante (anon) não acessa nada.
--   • APROVAÇÃO MANUAL: crianças, progresso, configurações e consentimentos só aparecem quando o
--     responsável está 'aprovado' (pendente/bloqueado vê apenas a própria linha em "responsaveis").
--     Isso vale também para a criança: se o responsável for bloqueado, a criança perde o acesso na hora.
-- =====================================================================

alter table public.responsaveis     enable row level security;
alter table public.criancas         enable row level security;
alter table public.progresso        enable row level security;
alter table public.configuracoes    enable row level security;
alter table public.consentimentos   enable row level security;
alter table public.tentativas_login enable row level security;

-- Começa sem nenhuma permissão e libera só o necessário
revoke all on public.responsaveis, public.criancas, public.progresso, public.configuracoes,
              public.consentimentos, public.tentativas_login from anon, authenticated;
revoke all on sequence public.consentimentos_id_seq from anon, authenticated;

-- ---------- responsaveis ----------
grant select on public.responsaveis to authenticated;
grant update (nome) on public.responsaveis to authenticated;
drop policy if exists resp_ver on public.responsaveis;
create policy resp_ver on public.responsaveis for select to authenticated using (id = auth.uid());
drop policy if exists resp_editar on public.responsaveis;
create policy resp_editar on public.responsaveis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------- criancas (sem pin_hash e sem auth_email) ----------
grant select (id, responsavel_id, apelido, ano_escolar, idade, avatar, codigo, ativo, criado_em, ultimo_acesso)
  on public.criancas to authenticated;
grant update (apelido, ano_escolar, idade, avatar, ativo) on public.criancas to authenticated;
drop policy if exists cri_ver on public.criancas;
create policy cri_ver on public.criancas for select to authenticated
  using ((id = auth.uid() and public.pm_crianca_logada_liberada())
         or (responsavel_id = auth.uid() and public.pm_sou_responsavel_aprovado()));
drop policy if exists cri_editar on public.criancas;
create policy cri_editar on public.criancas for update to authenticated
  using (responsavel_id = auth.uid() and public.pm_sou_responsavel_aprovado())
  with check (responsavel_id = auth.uid() and public.pm_sou_responsavel_aprovado());

-- ---------- progresso ----------
grant select on public.progresso to authenticated;
grant insert (crianca_id, estado, versao, dispositivo) on public.progresso to authenticated;
grant update (estado, versao, dispositivo) on public.progresso to authenticated;
drop policy if exists prog_ver on public.progresso;
create policy prog_ver on public.progresso for select to authenticated
  using ((crianca_id = auth.uid() and public.pm_crianca_logada_liberada())
         or (public.pm_sou_responsavel_aprovado()
             and exists (select 1 from public.criancas c where c.id = progresso.crianca_id and c.responsavel_id = auth.uid())));
drop policy if exists prog_criar on public.progresso;
create policy prog_criar on public.progresso for insert to authenticated
  with check (crianca_id = auth.uid() and public.pm_crianca_logada_liberada());
drop policy if exists prog_editar on public.progresso;
create policy prog_editar on public.progresso for update to authenticated
  using (crianca_id = auth.uid() and public.pm_crianca_logada_liberada())
  with check (crianca_id = auth.uid() and public.pm_crianca_logada_liberada());

-- ---------- configuracoes (a criança só LÊ; o responsável lê e altera as das suas crianças) ----------
grant select on public.configuracoes to authenticated;
grant update (tempo_desafio, tempo_fase, questoes_por_fase, ano_escolar_liberado, tentativas_dia, extras)
  on public.configuracoes to authenticated;
drop policy if exists conf_ver on public.configuracoes;
create policy conf_ver on public.configuracoes for select to authenticated
  using ((crianca_id = auth.uid() and public.pm_crianca_logada_liberada())
         or (public.pm_sou_responsavel_aprovado()
             and exists (select 1 from public.criancas c where c.id = configuracoes.crianca_id and c.responsavel_id = auth.uid())));
drop policy if exists conf_editar on public.configuracoes;
create policy conf_editar on public.configuracoes for update to authenticated
  using (public.pm_sou_responsavel_aprovado()
         and exists (select 1 from public.criancas c where c.id = configuracoes.crianca_id and c.responsavel_id = auth.uid()))
  with check (public.pm_sou_responsavel_aprovado()
         and exists (select 1 from public.criancas c where c.id = configuracoes.crianca_id and c.responsavel_id = auth.uid()));

-- ---------- consentimentos (só o responsável vê os seus e acrescenta novos; não altera nem apaga) ----------
grant select on public.consentimentos to authenticated;
grant insert (versao_texto, texto_hash, aceito, responsavel_id) on public.consentimentos to authenticated;
grant usage on sequence public.consentimentos_id_seq to authenticated;
drop policy if exists cons_ver on public.consentimentos;
create policy cons_ver on public.consentimentos for select to authenticated
  using (responsavel_id = auth.uid() and public.pm_sou_responsavel_aprovado());
drop policy if exists cons_criar on public.consentimentos;
create policy cons_criar on public.consentimentos for insert to authenticated
  with check (responsavel_id = auth.uid() and public.pm_sou_responsavel_aprovado());

-- ---------- tentativas_login: sem nenhuma política (só funções do servidor acessam) ----------

-- ---------- Funções: só quem deve pode chamar ----------
revoke all on function public.pm_login_verificar(text, text, text, text) from public, anon, authenticated;
revoke all on function public.pm_criar_crianca(uuid, uuid, text, smallint, smallint, text, text, text) from public, anon, authenticated;
revoke all on function public.pm_registrar_falha(text, int, interval, interval) from public, anon, authenticated;
revoke all on function public.pm_gerar_codigo() from public, anon, authenticated;
revoke all on function public.pm_proteger_status() from public, anon, authenticated;
revoke all on function public.pm_sou_responsavel_aprovado() from public, anon;
revoke all on function public.pm_crianca_logada_liberada() from public, anon;
revoke all on function public.pm_redefinir_pin(uuid, text) from public, anon;
revoke all on function public.pm_salvar_progresso(jsonb, bigint, text) from public, anon;
revoke all on function public.pm_registrar_consentimento(text, text, boolean) from public, anon;
grant execute on function public.pm_sou_responsavel_aprovado() to authenticated;   -- usadas pelas regras de acesso
grant execute on function public.pm_crianca_logada_liberada() to authenticated;
grant execute on function public.pm_login_verificar(text, text, text, text) to service_role;
grant execute on function public.pm_criar_crianca(uuid, uuid, text, smallint, smallint, text, text, text) to service_role;
grant execute on function public.pm_redefinir_pin(uuid, text) to authenticated;
grant execute on function public.pm_salvar_progresso(jsonb, bigint, text) to authenticated;
grant execute on function public.pm_registrar_consentimento(text, text, boolean) to authenticated;
