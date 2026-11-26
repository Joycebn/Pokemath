-- =====================================================================
-- Pokemath — ADMIN 03: bloquear (ou voltar a "pendente") um responsável pelo e-mail
-- 1) Troque o e-mail e, se quiser, o status ('bloqueado' ou 'pendente'). 2) Cole no SQL Editor e clique Run.
-- Efeito IMEDIATO: o responsável e as crianças dele deixam de ver/gravar qualquer dado (as regras de acesso
-- consultam o status a cada pedido), as crianças não conseguem mais entrar e as sessões abertas são encerradas.
-- Nada é apagado: ao aprovar de novo (ADMIN 02), tudo volta como estava.
-- =====================================================================
with alvo as (
  select lower(trim('COLOQUE-O-EMAIL-AQUI@exemplo.com')) as email,          -- ⬅⬅⬅ TROQUE AQUI
         'bloqueado'::text as novo_status                                    -- ⬅ ou 'pendente'
),
mudou as (
  update public.responsaveis r
     set status = alvo.novo_status
    from alvo
   where lower(r.email) = alvo.email
  returning r.id, r.nome, r.status
),
sessoes as (
  delete from auth.sessions s
   where s.user_id in (select id from mudou)
      or s.user_id in (select c.id from public.criancas c where c.responsavel_id in (select id from mudou))
  returning 1
)
select alvo.email as email_procurado, m.nome, m.status, (select count(*) from sessoes) as sessoes_encerradas
  from alvo left join mudou m on true;
