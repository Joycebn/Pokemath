-- =====================================================================
-- Pokemath — ADMIN 02: aprovar um responsável pelo e-mail
-- 1) Troque o e-mail na linha marcada. 2) Cole no SQL Editor e clique Run.
-- Resultado: uma linha com o status "aprovado". Se a coluna "status" vier vazia, o e-mail não foi encontrado.
-- Também zera as tentativas erradas de login das crianças dessa família (caso tenham tentado antes da aprovação).
-- (Alterar a coluna "status" direto no Table Editor também funciona, mas não zera as tentativas.)
-- =====================================================================
with alvo as (
  select lower(trim('COLOQUE-O-EMAIL-AQUI@exemplo.com')) as email          -- ⬅⬅⬅ TROQUE AQUI
),
aprovado as (
  update public.responsaveis r
     set status = 'aprovado'
    from alvo
   where lower(r.email) = alvo.email
  returning r.id, r.nome, r.email, r.status
),
limpeza as (
  delete from public.tentativas_login t
   using public.criancas c, aprovado a
   where c.responsavel_id = a.id and t.chave = 'c:' || c.codigo
  returning 1
)
select alvo.email as email_procurado, a.nome, a.status, (select count(*) from limpeza) as tentativas_zeradas
  from alvo left join aprovado a on true;
