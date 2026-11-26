-- =====================================================================
-- Pokemath — 007: permissão de LEITURA da service_role na tabela criancas
-- Rode DEPOIS dos arquivos 001 a 006. Pode rodar quantas vezes quiser (GRANT repetido não dá erro).
--
-- POR QUE EXISTE
--   A função gerenciar-crianca (ações "excluir" e "excluir_conta") confere, antes de apagar, quais crianças
--   pertencem ao responsável logado. Ela faz isso lendo public.criancas com a chave de servidor (service_role).
--   O Supabase respondeu: "permission denied for table criancas (42501)": a service_role nunca recebeu SELECT
--   nessa tabela. Os scripts 001 a 006 não tiram nada da service_role (os REVOKE do 004 são só de anon e
--   authenticated); ela só usava as permissões automáticas do Supabase, que este projeto não tem.
--
-- O QUE ESTE ARQUIVO FAZ (e só isso)
--   • GRANT SELECT em public.criancas para a service_role. Nada em outras tabelas: o resto que a função usa
--     não precisa de permissão direta (veja abaixo).
--   • NÃO mexe em anon, authenticated, políticas RLS (004/005) nem em funções.
--
-- COMO A service_role É USADA
--   A service_role é a chave de SERVIDOR. Ela só existe dentro das Edge Functions (gerenciar-crianca, login-crianca),
--   nos segredos do Supabase. NUNCA vai para o app, para o GitHub ou para o navegador. O app usa só a chave
--   publicável, que entra como anon/authenticated.
--
-- POR QUE O ACESSO DAS FAMÍLIAS CONTINUA RESTRITO
--   O que as famílias (authenticated) e o público (anon) enxergam é decidido pelas permissões e pelas políticas
--   RLS do 004: anon não lê nada de criancas; authenticated lê só colunas liberadas (nunca pin_hash nem
--   auth_email) e só as linhas da própria família. Este arquivo não altera nenhuma dessas regras.
--
-- O QUE NÃO PRECISA DE PERMISSÃO DIRETA (conferido)
--   • RPC pm_criar_crianca e pm_login_verificar: funções SECURITY DEFINER; a service_role só precisa de EXECUTE (já dado no 004).
--   • pm_registrar_autorizacao_estudante: a função chama com o login do próprio responsável (authenticated), não com a chave de servidor.
--   • progresso, configuracoes, consentimentos_estudante: são apagados em cascata quando o usuário técnico da criança é
--     removido pelo Auth (on delete cascade), sem a função ler essas tabelas.
-- =====================================================================

grant select on table public.criancas to service_role;

comment on table public.criancas is
  'Fichas das crianças. Leitura direta pela service_role (só funções do servidor: excluir criança/conta); famílias pela RLS.';

-- ---------------------------------------------------------------------
-- VERIFICAÇÃO (somente leitura). Resultado esperado: a coluna "esperado" igual a "obtido" em TODAS as linhas
-- (coluna "ok" = OK). Se alguma linha mostrar FALHOU, me envie o resultado.
-- ---------------------------------------------------------------------
select o as "conferência", e as esperado, x as obtido, case when e = x then 'OK' else 'FALHOU' end as ok
from (values
  (1, 'service_role lê criancas (SELECT)',                      true,  has_table_privilege('service_role',  'public.criancas', 'SELECT')),
  (2, 'anon NÃO lê criancas (tabela)',                          false, has_table_privilege('anon',          'public.criancas', 'SELECT')),
  (3, 'anon NÃO lê nenhuma coluna de criancas',                 false, has_any_column_privilege('anon',     'public.criancas', 'SELECT')),
  (4, 'authenticated NÃO tem SELECT direto na tabela criancas', false, has_table_privilege('authenticated', 'public.criancas', 'SELECT')),
  (5, 'authenticated NÃO lê pin_hash',                          false, has_column_privilege('authenticated','public.criancas', 'pin_hash',   'SELECT')),
  (6, 'authenticated NÃO lê auth_email',                        false, has_column_privilege('authenticated','public.criancas', 'auth_email', 'SELECT'))
) v(n, o, e, x)
order by n;
