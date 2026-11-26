-- =====================================================================
-- Pokemath — ADMIN 01: quem está esperando aprovação
-- Cole no SQL Editor do Supabase e clique Run. Só você (administrador, no painel) consegue rodar isto:
-- o app não tem permissão para mexer em status.
-- =====================================================================
select r.nome,
       r.email,
       to_char(r.criado_em at time zone 'America/Fortaleza', 'DD/MM/YYYY HH24:MI') as cadastrado_em,
       (u.email_confirmed_at is not null) as email_confirmado,   -- só aprove se for TRUE (o e-mail é mesmo da pessoa)
       r.status
  from public.responsaveis r
  join auth.users u on u.id = r.id
 where r.status = 'pendente'
 order by r.criado_em;

-- Para ver TODOS os responsáveis e o status de cada um, troque a linha "where r.status = 'pendente'" por:
--   where true
