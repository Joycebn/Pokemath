-- =====================================================================
-- Pokemath — TESTE DE ISOLAMENTO E APROVAÇÃO MANUAL (rode DEPOIS dos arquivos 001 a 004)
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

-- 2b) APROVAÇÃO MANUAL — conta nova entra PENDENTE e não vê nada
select pg_temp.ok('cadastro novo entra como PENDENTE', (select count(*)=2 and bool_and(status='pendente') from responsaveis r join ids i on i.id=r.id where i.nome in ('respA','respB')));
set role service_role;
do $$ begin
  begin
    perform pm_criar_crianca(gen_random_uuid(),(select id from ids where nome='respA'),'Teste',6::smallint,11::smallint,'a1','1234','crianca-teste-pend@pokemath.example.com');
    perform pg_temp.ok('responsável PENDENTE não consegue ter criança cadastrada', false);
  exception when others then perform pg_temp.ok('responsável PENDENTE não consegue ter criança cadastrada', sqlerrm='responsavel_nao_aprovado'); end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='respA'),false);
set role authenticated;
select pg_temp.ok('pendente: vê a própria linha com nome, status e data do cadastro', (select count(*)=1 and bool_and(nome='Mae A' and status='pendente' and criado_em is not null) from responsaveis));
select pg_temp.ok('pendente: NÃO vê consentimentos (nem o próprio)', (select count(*)=0 from consentimentos));
select pg_temp.ok('pendente: NÃO vê crianças, progresso nem configurações', (select count(*)=0 from criancas) and (select count(*)=0 from progresso) and (select count(*)=0 from configuracoes));
select pg_temp.ok('pendente: NÃO redefine PIN', not pm_redefinir_pin(gen_random_uuid(),'1234'));
do $$ begin begin perform pm_registrar_consentimento('x','y',true); perform pg_temp.ok('pendente: NÃO registra consentimento novo', false);
  exception when others then perform pg_temp.ok('pendente: NÃO registra consentimento novo', sqlerrm='responsavel_nao_aprovado'); end; end $$;
do $$ begin begin update responsaveis set status='aprovado' where id=(select id from ids where nome='respA'); perform pg_temp.ok('pendente: NÃO se aprova sozinho (UPDATE direto negado)', false);
  exception when insufficient_privilege then perform pg_temp.ok('pendente: NÃO se aprova sozinho (UPDATE direto negado)', true); end; end $$;
reset role;
set role service_role;
do $$ begin begin update responsaveis set status='aprovado' where id=(select id from ids where nome='respA'); perform pg_temp.ok('nem a chave de servidor (service_role) muda o status: só o painel', false);
  exception when others then perform pg_temp.ok('nem a chave de servidor (service_role) muda o status: só o painel', true); end; end $$;
reset role;
select pg_temp.ok('o status continua pendente depois das tentativas', (select count(*)=2 and bool_and(status='pendente') from responsaveis r join ids i on i.id=r.id where i.nome in ('respA','respB')));
-- o administrador aprova pelo painel (aqui: papel do dono do banco, como no SQL Editor)
update responsaveis set status='aprovado' where id in (select id from ids where nome in ('respA','respB'));
select pg_temp.ok('administrador aprova pelo painel (status e data da mudança gravados)', (select count(*)=2 and bool_and(status='aprovado' and status_alterado_em is not null) from responsaveis r join ids i on i.id=r.id where i.nome in ('respA','respB')));

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
-- UPDATE direto em colunas protegidas de "criancas": o banco DEVE negar (42501). Negar = OK.
-- (O erro é capturado de propósito; sem isso o SQL Editor interromperia o script no primeiro erro.)
do $$ begin
  begin
    update criancas set responsavel_id=(select id from ids where nome='respB') where id=(select id from ids where nome='a2');
    perform pg_temp.ok('responsável NÃO transfere criança para outra família (UPDATE direto negado)', false);
  exception when insufficient_privilege then
    perform pg_temp.ok('responsável NÃO transfere criança para outra família (UPDATE direto negado)', true);
  end;
end $$;
select pg_temp.ok('a criança continua na família A depois da tentativa', (select responsavel_id=(select id from ids where nome='respA') from criancas where id=(select id from ids where nome='a2')));
do $$ declare c text; begin
  foreach c in array array['pin_hash','codigo','auth_email','id'] loop
    begin
      execute format('update public.criancas set %I = %I where id = %L', c, c, (select id from ids where nome='a2'));
      perform pg_temp.ok('responsável NÃO altera criancas.'||c||' direto (UPDATE negado)', false);
    exception when insufficient_privilege then
      perform pg_temp.ok('responsável NÃO altera criancas.'||c||' direto (UPDATE negado)', true);
    end;
  end loop;
end $$;
-- Alterações PERMITIDAS: colunas liberadas (apelido, ano, idade, avatar, ativo) só nas crianças da própria família...
update criancas set apelido='Davi Maior' where id=(select id from ids where nome='a2');
select pg_temp.ok('responsável altera o apelido da própria criança (coluna liberada)', (select apelido='Davi Maior' from criancas where id=(select id from ids where nome='a2')));
update criancas set apelido='Invasor' where id=(select id from ids where nome='b1');
select pg_temp.ok('responsável NÃO altera apelido de criança de outra família (0 linhas)', (select count(*)=0 from criancas where apelido='Invasor'));
-- ...e o PIN só pela função pm_redefinir_pin (já chamada acima): o hash agora confere com o PIN novo e não com o antigo.
reset role;
select pg_temp.ok('PIN trocado pela função: hash confere com 9999 e não com o PIN antigo 4321', (select extensions.crypt('9999', pin_hash)=pin_hash and extensions.crypt('4321', pin_hash)<>pin_hash from criancas where id=(select id from ids where nome='a2')));
select pg_temp.ok('PIN da criança de outra família não foi tocado (continua 1234)', (select extensions.crypt('1234', pin_hash)=pin_hash from criancas where id=(select id from ids where nome='b1')));
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='respA'),false);
set role authenticated;
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
-- a tabela tentativas_login não é legível nem pelo service_role (só pelas funções): esta conferência roda como administrador
reset role;
select pg_temp.ok('login certo zera o contador do código', (select count(*)=0 from tentativas_login where chave='c:'||(select c from cods where k='b1')));
reset role;

-- 8) APROVAÇÃO MANUAL com crianças já cadastradas: pendente, aprovado, bloqueado (efeito imediato)
-- 8a) família A volta a PENDENTE
reset role;
update responsaveis set status='pendente' where id=(select id from ids where nome='respA');
set role service_role;
select pg_temp.ok('família PENDENTE: criança com código, figura e PIN CORRETOS não entra',
  (pm_login_verificar((select c from cods where k='a1'),'a3','1234','10.2.2.1')->>'erro')='dados_incorretos');
select pg_temp.ok('família PENDENTE: a resposta é IDÊNTICA à de PIN errado (não revela o motivo)',
  pm_login_verificar((select c from cods where k='a1'),'a3','1234','10.2.2.2') = pm_login_verificar((select c from cods where k='a1'),'a3','0000','10.2.2.3'));
select pg_temp.ok('família PENDENTE: nenhuma sessão, id ou e-mail técnico é devolvido',
  not (pm_login_verificar((select c from cods where k='a1'),'a3','1234','10.2.2.4') ?| array['crianca_id','auth_email','apelido']));
reset role;
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='a1'),false);
set role authenticated;
select pg_temp.ok('criança de família PENDENTE (sessão antiga): não lê ficha, progresso nem configuração', (select count(*)=0 from criancas) and (select count(*)=0 from progresso) and (select count(*)=0 from configuracoes));
select pg_temp.ok('criança de família PENDENTE: salvar na nuvem devolve sem_acesso', (pm_salvar_progresso('{"coins":1}'::jsonb,2,'cel1')->>'erro')='sem_acesso');
reset role;
select pg_temp.ok('nada foi gravado pela criança de família PENDENTE', (select (estado->>'coins')::int=60 from progresso where crianca_id=(select id from ids where nome='a1')));
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='respA'),false);
set role authenticated;
select pg_temp.ok('responsável voltou a PENDENTE: não vê crianças, progresso, configurações nem consentimentos', (select count(*)=0 from criancas) and (select count(*)=0 from progresso) and (select count(*)=0 from configuracoes) and (select count(*)=0 from consentimentos));
select pg_temp.ok('responsável PENDENTE ainda vê a própria linha (tela "aguardando aprovação")', (select count(*)=1 and bool_and(status='pendente') from responsaveis));
update configuracoes set questoes_por_fase=15;
update criancas set apelido='Invasor2';
reset role;
select pg_temp.ok('responsável PENDENTE não altera configurações nem fichas', (select questoes_por_fase=12 from configuracoes where crianca_id=(select id from ids where nome='a2')) and (select count(*)=0 from criancas where apelido='Invasor2'));
-- 8b) a família B (aprovada) não é afetada
set role service_role;
select pg_temp.ok('família B continua APROVADA: a criança b1 entra normalmente', (pm_login_verificar((select c from cods where k='b1'),'a3','1234','10.2.2.5')->>'ok')::boolean);
reset role;
-- 8c) administrador APROVA a família A (e zera as tentativas erradas, como no SQL admin/02)
update responsaveis set status='aprovado' where id=(select id from ids where nome='respA');
delete from tentativas_login where chave in (select 'c:'||codigo from criancas where responsavel_id=(select id from ids where nome='respA'));
set role service_role;
select pg_temp.ok('depois de APROVADO: a criança entra com código, figura e PIN', (pm_login_verificar((select c from cods where k='a1'),'a3','1234','10.2.2.6')->>'ok')::boolean);
reset role;
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='respA'),false);
set role authenticated;
select pg_temp.ok('depois de APROVADO: o responsável vê as crianças dele de novo (2) e o progresso (1)', (select count(*)=2 from criancas) and (select count(*)=1 from progresso));
select pg_temp.ok('depois de APROVADO: o responsável vê os consentimentos', (select count(*)>=1 from consentimentos));
reset role;
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='a1'),false);
set role authenticated;
select pg_temp.ok('depois de APROVADO: a criança volta a ler e gravar o próprio progresso', (select count(*)=1 from progresso) and (pm_salvar_progresso('{"coins":61}'::jsonb,2,'cel1')->>'ok')::boolean);
reset role;
-- 8d) administrador BLOQUEIA a família A: efeito imediato
update responsaveis set status='bloqueado' where id=(select id from ids where nome='respA');
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='respA'),false);
set role authenticated;
select pg_temp.ok('BLOQUEADO: o responsável perde o acesso na hora (0 crianças, 0 progresso, 0 configurações, 0 consentimentos)', (select count(*)=0 from criancas) and (select count(*)=0 from progresso) and (select count(*)=0 from configuracoes) and (select count(*)=0 from consentimentos));
select pg_temp.ok('BLOQUEADO: ainda vê só a própria linha, com status bloqueado', (select count(*)=1 and bool_and(status='bloqueado') from responsaveis));
select pg_temp.ok('BLOQUEADO: não redefine PIN', not pm_redefinir_pin((select id from ids where nome='a1'),'5555'));
do $$ begin begin update responsaveis set status='aprovado' where id=(select id from ids where nome='respA'); perform pg_temp.ok('BLOQUEADO: não se desbloqueia sozinho', false);
  exception when insufficient_privilege then perform pg_temp.ok('BLOQUEADO: não se desbloqueia sozinho', true); end; end $$;
reset role;
set role service_role;
select pg_temp.ok('BLOQUEADO: as crianças da família não conseguem entrar (resposta genérica)', (pm_login_verificar((select c from cods where k='a1'),'a3','1234','10.2.2.7')->>'erro')='dados_incorretos');
reset role;
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='a1'),false);
set role authenticated;
select pg_temp.ok('BLOQUEADO: a criança com sessão aberta perde o acesso na hora', (select count(*)=0 from progresso) and (select count(*)=0 from criancas) and (pm_salvar_progresso('{"coins":2}'::jsonb,3,'cel1')->>'erro')='sem_acesso');
reset role;
select pg_temp.ok('BLOQUEADO: nada foi apagado (progresso segue guardado)', (select (estado->>'coins')::int=61 from progresso where crianca_id=(select id from ids where nome='a1')));
-- 8e) administrador volta a APROVAR: tudo reaparece como estava
update responsaveis set status='aprovado' where id=(select id from ids where nome='respA');
select set_config('request.jwt.claim.sub',(select id::text from ids where nome='respA'),false);
set role authenticated;
select pg_temp.ok('reaprovado: o responsável vê tudo de novo', (select count(*)=2 from criancas) and (select count(*)=1 from progresso));
reset role;

-- 10) permissões diretas em criancas (007): a chave de servidor LÊ; anon e authenticated NÃO leem a tabela diretamente
select pg_temp.ok('service_role TEM SELECT em criancas (excluir criança/conta precisa; rode o 007 se falhar)', has_table_privilege('service_role','public.criancas','SELECT'));
select pg_temp.ok('anon NÃO tem SELECT em criancas (nem em coluna)', not has_table_privilege('anon','public.criancas','SELECT') and not has_any_column_privilege('anon','public.criancas','SELECT'));
select pg_temp.ok('authenticated NÃO tem SELECT direto na tabela criancas (só colunas liberadas, filtradas pela RLS)', not has_table_privilege('authenticated','public.criancas','SELECT'));
select pg_temp.ok('authenticated NÃO lê pin_hash nem auth_email', not has_column_privilege('authenticated','public.criancas','pin_hash','SELECT') and not has_column_privilege('authenticated','public.criancas','auth_email','SELECT'));

-- 11) edição pela função gerenciar-crianca (008): a chave de servidor altera SÓ apelido, ano_escolar e idade
select pg_temp.ok('service_role TEM UPDATE em apelido, ano_escolar e idade de criancas (rode o 008 se falhar)', has_column_privilege('service_role','public.criancas','apelido','UPDATE') and has_column_privilege('service_role','public.criancas','ano_escolar','UPDATE') and has_column_privilege('service_role','public.criancas','idade','UPDATE'));
select pg_temp.ok('service_role NÃO altera pin_hash, codigo, responsavel_id, auth_email, avatar nem ativo', not (has_column_privilege('service_role','public.criancas','pin_hash','UPDATE') or has_column_privilege('service_role','public.criancas','codigo','UPDATE') or has_column_privilege('service_role','public.criancas','responsavel_id','UPDATE') or has_column_privilege('service_role','public.criancas','auth_email','UPDATE') or has_column_privilege('service_role','public.criancas','avatar','UPDATE') or has_column_privilege('service_role','public.criancas','ativo','UPDATE')));
select pg_temp.ok('anon continua sem UPDATE em criancas; authenticated continua só com apelido, ano_escolar, idade, avatar e ativo (nada novo)', not has_any_column_privilege('anon','public.criancas','UPDATE') and (select string_agg(a.attname, ',' order by a.attname) from pg_attribute a where a.attrelid='public.criancas'::regclass and a.attnum>0 and not a.attisdropped and has_column_privilege('authenticated','public.criancas',a.attnum,'UPDATE')) = 'ano_escolar,apelido,ativo,avatar,idade');
reset role; set role service_role;
do $$ declare alvo uuid; n int; begin
  select id into alvo from public.criancas order by id limit 1;
  update public.criancas set apelido = apelido, ano_escolar = ano_escolar, idade = idade where id = alvo;
  get diagnostics n = row_count;
  perform pg_temp.ok('service_role consegue editar apelido, ano e idade (UPDATE de verdade)', n = 1);
  begin update public.criancas set pin_hash = pin_hash where id = alvo; perform pg_temp.ok('service_role NÃO consegue alterar pin_hash (UPDATE de verdade)', false);
  exception when insufficient_privilege then perform pg_temp.ok('service_role NÃO consegue alterar pin_hash (permissão negada)', true); end;
  begin update public.criancas set responsavel_id = responsavel_id where id = alvo; perform pg_temp.ok('service_role NÃO consegue trocar o responsável de uma criança', false);
  exception when insufficient_privilege then perform pg_temp.ok('service_role NÃO consegue trocar o responsável de uma criança (permissão negada)', true); end;
end $$;
reset role;

-- limpeza e resultado
reset role;
delete from tentativas_login where chave like 'i:10.%' or chave = 'i:6.6.6.6' or chave like 'c:Q%' or chave = 'c:ZZZZZZ' or chave in (select 'c:'||c from cods);
delete from auth.users where email like '%@teste-pokemath.example.com' or email like 'crianca-teste-%@pokemath.example.com';
select n as "#", case when passou then 'OK' else 'FALHOU' end as resultado, nome as "o que foi conferido"
from resultado order by n;
