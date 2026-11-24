-- =====================================================================
-- Pokemath — 002: tabelas
-- =====================================================================

-- Responsáveis (pais/professores). Cada um é um usuário do Supabase Auth (e-mail + senha).
create table if not exists public.responsaveis (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text not null check (char_length(nome) between 1 and 80),
  email       text,
  criado_em   timestamptz not null default now()
);

-- Crianças. Cada criança também é um usuário do Auth, mas SEM e-mail real: o login é feito
-- pela função de servidor "login-crianca" (código + avatar + PIN de 4 números).
-- O PIN é guardado apenas como hash (bcrypt) — nunca em texto puro.
create table if not exists public.criancas (
  id             uuid primary key references auth.users (id) on delete cascade,
  responsavel_id uuid not null references public.responsaveis (id) on delete cascade,
  apelido        text not null check (char_length(apelido) between 1 and 30),
  ano_escolar    smallint not null check (ano_escolar between 3 and 9),
  idade          smallint not null check (idade between 5 and 18),
  avatar         text not null check (avatar ~ '^a([1-9]|1[0-2])$'),            -- a1 … a12
  codigo         text not null unique check (codigo ~ '^[A-HJKMNP-Z2-9]{6}$'),  -- código de 6 caracteres
  pin_hash       text not null,                                                  -- bcrypt do PIN
  auth_email     text not null unique,                                           -- e-mail técnico (não é real)
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  ultimo_acesso  timestamptz
);
create index if not exists criancas_responsavel_idx on public.criancas (responsavel_id);

-- Progresso: 1 linha por criança. "estado" é a cópia completa do progresso do app (a mesma que fica no
-- aparelho). As demais colunas são um RESUMO preenchido automaticamente por gatilho (para relatórios).
create table if not exists public.progresso (
  crianca_id        uuid primary key references public.criancas (id) on delete cascade,
  estado            jsonb not null default '{}'::jsonb
                    check (jsonb_typeof(estado) = 'object' and pg_column_size(estado) < 1500000),
  versao            bigint not null default 1,          -- controle de conflito entre aparelhos
  dispositivo       text,
  -- resumo (gatilho)
  moedas            integer not null default 0,
  xp_companheiro    integer not null default 0,
  nivel_companheiro integer not null default 1,
  companheiro_id    integer,
  pokemon_total     integer not null default 0,
  ofensiva_atual    integer not null default 0,
  ofensiva_maxima   integer not null default 0,
  ultimo_dia_estudo date,
  fases             jsonb not null default '{}'::jsonb, -- níveis de cada fase (passou/refazer, vidas, tentativas)
  pokemon           jsonb not null default '{}'::jsonb, -- Pokémon conquistados (com nível e XP)
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

-- Configurações do controle externo (uma linha por criança).
create table if not exists public.configuracoes (
  crianca_id           uuid primary key references public.criancas (id) on delete cascade,
  tempo_desafio        smallint not null default 60 check (tempo_desafio between 10 and 600),     -- segundos do desafio da tabuada
  tempo_fase           smallint check (tempo_fase is null or tempo_fase between 10 and 3600),     -- reservado: limite por fase (NULL = sem limite)
  questoes_por_fase    smallint not null default 8 check (questoes_por_fase between 4 and 20),    -- questões da Prata (Bronze −2, Ouro +2)
  ano_escolar_liberado smallint not null default 3 check (ano_escolar_liberado between 3 and 9),  -- anos liberados (até este ano)
  tentativas_dia       smallint not null default 3 check (tentativas_dia between 1 and 20),       -- tentativas por dia, para cada nível
  extras               jsonb not null default '{}'::jsonb check (jsonb_typeof(extras) = 'object'), -- outros ajustes do app (meta, moedas, etc.)
  versao               integer not null default 1,
  atualizado_em        timestamptz not null default now()
);

-- Consentimentos do responsável (registro permanente: nunca é alterado nem apagado pelo app).
create table if not exists public.consentimentos (
  id             bigint generated always as identity primary key,
  responsavel_id uuid not null references public.responsaveis (id) on delete cascade,
  tipo           text not null default 'termos_e_privacidade' check (tipo in ('termos_e_privacidade')),
  versao_texto   text not null check (char_length(versao_texto) between 1 and 40),
  texto_hash     text check (texto_hash is null or char_length(texto_hash) <= 128),
  aceito         boolean not null default true,
  aceito_em      timestamptz not null default now()
);
create index if not exists consentimentos_resp_idx on public.consentimentos (responsavel_id, aceito_em desc);

-- Controle de tentativas erradas de login (só o servidor mexe aqui).
create table if not exists public.tentativas_login (
  chave         text primary key,          -- "c:<código>" (por criança) ou "i:<ip>" (por origem)
  falhas        integer not null default 0,
  janela_inicio timestamptz,
  bloqueado_ate timestamptz,
  atualizado_em timestamptz not null default now()
);
create index if not exists tentativas_login_atual_idx on public.tentativas_login (atualizado_em);
