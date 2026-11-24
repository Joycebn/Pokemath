-- =====================================================================
-- Pokemath — TESTE DE ISOLAMENTO (rode DEPOIS dos arquivos 001 a 004)
-- Cria 2 famílias fictícias (uma com 2 crianças, outra com 1), tenta "espiar" dados de outros
-- e confere que o banco bloqueia. No fim apaga tudo que criou e mostra uma tabela:
-- a coluna "resultado" deve ser OK em TODAS as linhas.
-- Pode rodar quantas vezes quiser. Não mexe nos seus dados reais.
-- =====================================================================

-- limpeza de sobras de uma execução anterior
delete from tentativas_login where chave like 'i:10.%' or chave = 'i:6.6.6.6' or chave like 'c:Q%' or chave = 'c:ZZZZZZ';
delete from auth.users where email like '%@teste-pokemath.example.com' or email like 'crianca-teste-%@pokemath.example.com';

create temp table resultado(n serial, passou boolean, nome text);
grant all on resultado to public; grant usage, select on sequence resultado_n_seq to public;
create or replace function pg_temp.ok(nome text, cond boolean) returns void language plpgsql as $$
begin insert into resultado(passou, nome) values (coalesce(cond,false), nome); end $$;
grant execute on function pg_temp.ok(text,boolean) to public;
create temp table cods(k text primary key, c text);
grant all on cods to public;
-- ===== preparação (como dono do banco) =====
create temp table ids(nome text primary key, id uuid);
grant all on ids to public;
insert into ids select n, gen_random_uuid() from unnest(array['respA','respB','a1','a2','b1']) n;

-- 1) cadastro SEM consentimento deve falhar
do $$ begin
  begin
    insert into auth.users(id,email,raw_user_meta_data) values (gen_random_uuid(),'x@teste-pokemath.example.com','{"nome":"X"}');
    perform pg_temp.ok('cadastro sem consentimento é recusado', false);
  exception when others then perform pg_temp.ok('cadastro sem consentimento é recusado', sqlerrm='consentimento_obrigatorio'); end;
  begin
    insert into auth.users(id,email,raw_user_meta_data) values (gen_random_uuid(),'y@teste-pokemath.example.com','{"nome":"Y","consentimento_aceito":"false","consentimento_versao":"v1"}');
    perform pg_temp.ok('consentimento_aceito=false é recusado', false);
  exception when others then perform pg_temp.ok('consentimento_aceito=false é recusado', true); end;
end $$;

-- 1b) usuário técnico de criança criado pelo servidor sem app_metadata ainda: passa pelo e-mail técnico, mas NÃO ganha acesso a nada
do $$ declare u uuid := gen_random_uuid(); begin
  insert into auth.users(id,email) values (u,'crianca-'||u||'@pokemath.example.com');
  perform pg_temp.ok('usuário técnico (só e-mail) é aceito, mas não vira responsável', (select count(*)=0 from responsaveis where id=u));
end $$;
-- 2) cadastro COM consentimento
insert into auth.users(id,email,raw_user_meta_data) select id,'a@teste-pokemath.example.com','{"nome":"Mae A","consentimento_aceito":"true","consentimento_versao":"2026-11-v1","consentimento_hash":"abc123"}' from ids where nome='respA';
insert into auth.users(id,email,raw_user_meta_data) select id,'b@teste-pokemath.example.com','{"nome":"Pai B","consentimento_aceito":"true","consentimento_versao":"2026-11-v1","consentimento_hash":"abc123"}' from ids where nome='respB';
select pg_temp.ok('consentimento gravado com versão e data', (select count(*)=1 and bool_and(versao_texto='2026-11-v1' and aceito and aceito_em is not null) from consentimentos c join ids i on i.id=c.responsavel_id where i.nome='respA'));

-- 3) crianças (como o servidor/service_role faria)
insert into auth.users(id,email,raw_app_meta_data) select id, 'crianca-teste-'||nome||'@pokemath.example.com','{"papel":"crianca"}' from ids where nome in('a1','a2','b1');
select pg_temp.ok('usuário de criança não exige consentimento nem vira responsável', (select count(*)=0 from responsaveis r join ids i on i.id=r.id where i.nome in('a1','a2','b1')));
set role service_role;
insert into cods select 'a1', pm_criar_crianca((select id from ids where nome='a1'),(select id from ids where nome='respA'),'Ana',6::smallint,11::smallint,'a3','1234','crianca-teste-a1@pokemath.example.com');
insert into cods select 'a2', pm_criar_crianca((select id from ids where nome='a2'),(select id from ids where nome='respA'),'Davi',3::smallint,8::smallint,'a5','4321','crianca-teste-a2@pokemath.example.com');
insert into cods select 'b1', pm_criar_crianca((select id from ids where nome='b1'),(select id from ids where nome='respB'),'Bia',6::smallint,11::smallint,'a3','1234','crianca-teste-b1@pokemath.example.com');
reset role;
select pg_temp.ok('código de 6 caracteres sem 0/O/1/I/L', (select c from cods where k='a1') ~ '^[A-HJKMNP-Z2-9]{6}$');
select pg_temp.ok('PIN guardado como hash bcrypt (nunca em texto)', (select bool_and(pin_hash like '$2a$10$%' and pin_hash not like '%1234%' and pin_hash<>'1234') from criancas where id in (select id from ids)));
select pg_temp.ok('duas crianças com o MESMO PIN têm hashes diferentes (sal)', (select count(distinct pin_hash)=3 from criancas where id in (select id from ids)));
select pg_temp.ok('configuração padrão criada para cada criança', (select count(*)=3 from configuracoes where crianca_id in (select id from ids)));

-- ===== função auxiliar: agir como um usuário =====
-- (set_config + role)
-- 4) CRIANÇA a1 ----------------------------------------------------
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='a1'),false);
set role authenticated;
select pg_temp.ok('criança vê só a própria ficha', (select count(*)=1 from criancas));
select pg_temp.ok('criança NÃO vê ficha de outra (mesma família)', (select count(*)=0 from criancas where id=(select id from ids where nome='a2')));
select pg_temp.ok('criança NÃO vê ficha de outra família', (select count(*)=0 from criancas where id=(select id from ids where nome='b1')));
do $$ begin begin perform pin_hash from criancas; perform pg_temp.ok('criança NÃO lê pin_hash', false);
  exception when insufficient_privilege then perform pg_temp.ok('criança NÃO lê pin_hash (permissão negada)', true); end; end $$;
do $$ begin begin perform auth_email from criancas; perform pg_temp.ok('criança NÃO lê auth_email', false);
  exception when insufficient_privilege then perform pg_temp.ok('criança NÃO lê auth_email (permissão negada)', true); end; end $$;
do $$ begin begin select * from criancas; perform pg_temp.ok('select * em criancas é barrado', false);
  exception when insufficient_privilege then perform pg_temp.ok('select * em criancas é barrado (colunas sensíveis)', true); end; end $$;
select pg_temp.ok('criança salva o próprio progresso (v0→1)', (pm_salvar_progresso('{"coins":50,"streak":3,"last":"2026-11-23","comp":25,"caught":{"25":{"xp":40,"nivel":2}},"fases":{"f1":{"b":true}}}'::jsonb,0,'cel1')->>'ok')::boolean);
select pg_temp.ok('criança vê só o próprio progresso', (select count(*)=1 and bool_and(crianca_id=(select id from ids where nome='a1')) from progresso));
select pg_temp.ok('resumo preenchido pelo gatilho (moedas/ofensiva/pokémon)', (select moedas=50 and ofensiva_atual=3 and pokemon_total=1 and nivel_companheiro=2 and xp_companheiro=40 and companheiro_id=25 from progresso));
select pg_temp.ok('segunda gravação com versão 1 → versão 2', (pm_salvar_progresso('{"coins":60}'::jsonb,1,'cel1')->>'versao')::int=2);
select pg_temp.ok('gravação com versão velha dá CONFLITO (não sobrescreve)', (pm_salvar_progresso('{"coins":1}'::jsonb,1,'cel2')->>'erro')='conflito');
select pg_temp.ok('conflito não alterou o dado', (select moedas=60 from progresso));
-- tentativa de gravar no progresso de outra criança
do $$ begin begin insert into progresso(crianca_id,estado) values ((select id from ids where nome='a2'),'{"coins":999}'); perform pg_temp.ok('criança NÃO cria progresso de outra', false);
  exception when others then perform pg_temp.ok('criança NÃO cria progresso de outra (RLS bloqueia)', true); end; end $$;
update progresso set estado='{"coins":999999}' where crianca_id=(select id from ids where nome='a2');
select pg_temp.ok('criança NÃO altera progresso de outra (0 linhas)', (select count(*)=0 from progresso where crianca_id=(select id from ids where nome='a2')));
select pg_temp.ok('criança lê a própria configuração', (select count(*)=1 from configuracoes));
update configuracoes set questoes_por_fase=1, tentativas_dia=99;
select pg_temp.ok('criança NÃO altera a configuração do controle externo', (select questoes_por_fase<>1 and tentativas_dia<>99 from configuracoes));
select pg_temp.ok('criança NÃO vê consentimentos', (select count(*)=0 from consentimentos));
select pg_temp.ok('criança NÃO vê responsáveis', (select count(*)=0 from responsaveis));
do $$ begin begin perform * from tentativas_login; perform pg_temp.ok('criança NÃO acessa tentativas_login', false);
  exception when insufficient_privilege then perform pg_temp.ok('criança NÃO acessa tentativas_login', true); end; end $$;
do $$ begin begin perform pm_login_verificar('X','a1','1234','1.1.1.1'); perform pg_temp.ok('criança NÃO executa pm_login_verificar', false);
  exception when insufficient_privilege then perform pg_temp.ok('criança NÃO executa pm_login_verificar', true); end; end $$;
do $$ begin begin perform pm_criar_crianca(gen_random_uuid(),(select id from ids where nome='respA'),'Z',3,8::smallint,'a1','1111','z@z'); perform pg_temp.ok('criança NÃO executa pm_criar_crianca', false);
  exception when others then perform pg_temp.ok('criança NÃO executa pm_criar_crianca', true); end; end $$;
reset role;

-- 5) RESPONSÁVEL A --------------------------------------------------
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='respA'),false);
set role authenticated;
select pg_temp.ok('responsável A vê só as 2 crianças dele', (select count(*)=2 from criancas where responsavel_id=(select id from ids where nome='respA')) and (select count(*)=2 from criancas));
select pg_temp.ok('responsável A NÃO vê criança da família B', (select count(*)=0 from criancas where apelido='Bia'));
select pg_temp.ok('responsável A vê progresso da própria criança', (select count(*)=1 from progresso));
do $$ begin begin perform pin_hash from criancas; perform pg_temp.ok('responsável NÃO lê pin_hash', false);
  exception when insufficient_privilege then perform pg_temp.ok('responsável NÃO lê pin_hash', true); end; end $$;
select pg_temp.ok('responsável A vê só o próprio cadastro', (select count(*)=1 from responsaveis));
select pg_temp.ok('responsável A vê só o próprio consentimento', (select count(*)=1 from consentimentos));
update configuracoes set questoes_por_fase=12, tentativas_dia=5 where crianca_id=(select id from ids where nome='a2');
select pg_temp.ok('responsável altera configuração da criança dele (versão sobe)', (select questoes_por_fase=12 and tentativas_dia=5 and versao=2 from configuracoes where crianca_id=(select id from ids where nome='a2')));
update configuracoes set questoes_por_fase=1 where crianca_id=(select id from ids where nome='b1');
select pg_temp.ok('responsável A NÃO altera config de criança da família B', (select count(*)=0 from configuracoes where crianca_id=(select id from ids where nome='b1')));
select pg_temp.ok('responsável redefine PIN da própria criança', pm_redefinir_pin((select id from ids where nome='a2'),'9999'));
select pg_temp.ok('responsável NÃO redefine PIN de criança alheia', not pm_redefinir_pin((select id from ids where nome='b1'),'9999'));
update criancas set responsavel_id=(select id from ids where nome='respB') where id=(select id from ids where nome='a2');
select pg_temp.ok('responsável NÃO transfere criança para outra família', (select responsavel_id=(select id from ids where nome='respA') from criancas where id=(select id from ids where nome='a2')));
reset role;

-- 6) ANÔNIMO --------------------------------------------------------
select set_config('request.jwt.claim.sub','',false);
set role anon;
do $$ declare t text; begin
  foreach t in array array['responsaveis','criancas','progresso','configuracoes','consentimentos','tentativas_login'] loop
    begin execute format('select 1 from public.%I',t); perform pg_temp.ok('anônimo NÃO lê '||t, false);
    exception when insufficient_privilege then perform pg_temp.ok('anônimo NÃO lê '||t, true); end;
  end loop; end $$;
do $$ begin begin perform pm_login_verificar('X','a1','1234','1.1.1.1'); perform pg_temp.ok('anônimo NÃO executa login direto', false);
  exception when insufficient_privilege then perform pg_temp.ok('anônimo NÃO executa login direto (só o servidor)', true); end; end $$;
reset role;

-- 7) LOGIN com limite de tentativas ---------------------------------
set role service_role;
select pg_temp.ok('login correto devolve ok + dados da criança', (pm_login_verificar((select c from cods where k='a1'),'a3','1234','10.0.0.1')->>'ok')::boolean);
select pg_temp.ok('PIN antigo da a2 não vale após redefinição', (pm_login_verificar((select c from cods where k='a2'),'a5','4321','10.0.0.2')->>'erro')='dados_incorretos');
select pg_temp.ok('PIN novo da a2 vale', (pm_login_verificar((select c from cods where k='a2'),'a5','9999','10.0.0.2')->>'ok')::boolean);
select pg_temp.ok('avatar errado = falha', (pm_login_verificar((select c from cods where k='a1'),'a4','1234','10.0.0.3')->>'erro')='dados_incorretos');
select pg_temp.ok('código inexistente = MESMA resposta que PIN errado', pm_login_verificar('ZZZZZZ','a3','1234','10.0.0.4') = pm_login_verificar((select c from cods where k='a1'),'a3','0000','10.0.0.5') );
-- 5 erros no código da b1 → bloqueia
select pm_login_verificar((select c from cods where k='b1'),'a3',p,'10.9.9.'||p) from unnest(array['0001','0002','0003','0004']) p;
select pg_temp.ok('5ª tentativa errada bloqueia o código', (pm_login_verificar((select c from cods where k='b1'),'a3','0005','10.9.9.9')->>'erro')='bloqueado');
select pg_temp.ok('bloqueado: até o PIN CERTO é recusado', (pm_login_verificar((select c from cods where k='b1'),'a3','1234','10.9.9.9')->>'erro')='bloqueado');
select pg_temp.ok('bloqueio informa tempo de espera (≤ 900 s)', (pm_login_verificar((select c from cods where k='b1'),'a3','1234','10.9.9.9')->>'espera_seg')::int between 1 and 900);
select pg_temp.ok('bloqueio de um código não afeta outro (a1 ainda entra)', (pm_login_verificar((select c from cods where k='a1'),'a3','1234','10.0.0.1')->>'ok')::boolean);
-- limite por IP: 30 erros do mesmo IP em códigos inexistentes
select pm_login_verificar('Q'||lpad(g::text,5,'2'),'a1','0000','6.6.6.6') from generate_series(1,29) g;
select pg_temp.ok('30º erro do mesmo IP bloqueia o IP', (pm_login_verificar('QQQQQQ','a1','0000','6.6.6.6')->>'erro')='bloqueado');
select pg_temp.ok('IP bloqueado não consegue nem com dados certos', (pm_login_verificar((select c from cods where k='a1'),'a3','1234','6.6.6.6')->>'erro')='bloqueado');
-- expiração do bloqueio
reset role;
update tentativas_login set bloqueado_ate = now() - interval '1 second';
set role service_role;
select pg_temp.ok('após o prazo o bloqueio expira e o login volta', (pm_login_verificar((select c from cods where k='b1'),'a3','1234','10.9.9.9')->>'ok')::boolean);
select pg_temp.ok('login certo zera o contador do código', (select count(*)=0 from tentativas_login where chave='c:'||(select c from cods where k='b1')));
reset role;

-- limpeza e resultado
reset role;
delete from tentativas_login where chave like 'i:10.%' or chave = 'i:6.6.6.6' or chave like 'c:Q%' or chave = 'c:ZZZZZZ' or chave in (select 'c:'||c from cods);
delete from auth.users where email like '%@teste-pokemath.example.com' or email like 'crianca-teste-%@pokemath.example.com';
select n as "#", case when passou then 'OK' else 'FALHOU' end as resultado, nome as "o que foi conferido"
from resultado order by n;
