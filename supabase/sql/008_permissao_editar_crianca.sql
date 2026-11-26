-- =====================================================================
-- Pokemath — 008: permissão de EDIÇÃO da service_role em três colunas de public.criancas
-- Rode DEPOIS dos arquivos 001 a 007. Pode rodar quantas vezes quiser (GRANT repetido não dá erro).
--
-- POR QUE EXISTE
--   A função gerenciar-crianca ganhou a ação "editar": o responsável corrige o apelido, o ano escolar e a idade de uma
--   criança dele. A função confere que a criança é do responsável logado e faz a atualização com a chave de servidor
--   (service_role). Sem este GRANT o banco responde "permission denied" e a edição devolve "falha_ao_salvar".
--
-- O QUE ESTE ARQUIVO FAZ (e só isso)
--   • GRANT UPDATE só nas colunas (apelido, ano_escolar, idade) de public.criancas para a service_role.
--   • NÃO libera pin_hash, codigo, responsavel_id, auth_email, avatar, ativo, id nem criado_em: a service_role continua
--     sem poder alterá-los por esta via. (A leitura de criancas veio do 007.)
--   • NÃO mexe em anon, authenticated, nas políticas RLS (004/005) nem em funções.
--
-- COMO A service_role É USADA
--   Só pelas funções do servidor (Edge Functions), com a chave guardada nos segredos do Supabase. NUNCA no app, no GitHub
--   ou no navegador. O acesso das famílias continua decidido pela RLS do 004: cada responsável só enxerga e altera as
--   crianças da própria conta. A regra de posse da edição é conferida pela função (id + responsavel_id) antes e na hora da gravação.
--
-- O QUE NÃO MUDA AO EDITAR
--   Os "anos liberados" (configuracoes.ano_escolar_liberado) e o progresso não são tocados: mudar o ano da ficha não altera
--   o que a criança já tem liberado.
-- =====================================================================

grant update (apelido, ano_escolar, idade) on table public.criancas to service_role;

-- ---------------------------------------------------------------------
-- VERIFICAÇÃO (somente leitura). Resultado esperado: "ok" = OK em TODAS as linhas. Se alguma mostrar FALHOU, me envie a tabela.
-- ---------------------------------------------------------------------
select o as "conferência", e as esperado, x as obtido, case when e = x then 'OK' else 'FALHOU' end as ok
from (values
  (1,  'service_role altera apelido',                        true,  has_column_privilege('service_role',  'public.criancas', 'apelido',        'UPDATE')),
  (2,  'service_role altera ano_escolar',                    true,  has_column_privilege('service_role',  'public.criancas', 'ano_escolar',    'UPDATE')),
  (3,  'service_role altera idade',                          true,  has_column_privilege('service_role',  'public.criancas', 'idade',          'UPDATE')),
  (4,  'service_role NÃO altera pin_hash',                   false, has_column_privilege('service_role',  'public.criancas', 'pin_hash',       'UPDATE')),
  (5,  'service_role NÃO altera codigo',                     false, has_column_privilege('service_role',  'public.criancas', 'codigo',         'UPDATE')),
  (6,  'service_role NÃO altera responsavel_id',             false, has_column_privilege('service_role',  'public.criancas', 'responsavel_id', 'UPDATE')),
  (7,  'service_role NÃO altera auth_email',                 false, has_column_privilege('service_role',  'public.criancas', 'auth_email',     'UPDATE')),
  (8,  'service_role NÃO altera avatar nem ativo',           false, has_column_privilege('service_role',  'public.criancas', 'avatar',         'UPDATE') or has_column_privilege('service_role', 'public.criancas', 'ativo', 'UPDATE')),
  (9,  'anon NÃO altera nada em criancas',                   false, has_any_column_privilege('anon',      'public.criancas', 'UPDATE')),
  (10, 'authenticated NÃO altera pin_hash nem auth_email',   false, has_column_privilege('authenticated', 'public.criancas', 'pin_hash',       'UPDATE') or has_column_privilege('authenticated', 'public.criancas', 'auth_email', 'UPDATE'))
) v(n, o, e, x)
order by n;
