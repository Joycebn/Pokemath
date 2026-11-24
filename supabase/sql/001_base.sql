-- =====================================================================
-- Pokemath — 001: extensões e funções de apoio
-- Execute este arquivo primeiro, no SQL Editor do Supabase.
-- =====================================================================

-- pgcrypto: usado para o hash do PIN (bcrypt) e para gerar o código da criança
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- converte um valor JSON em número inteiro com segurança (devolve 0 se não for número)
create or replace function public.pm_int(j jsonb, k text) returns integer
language sql immutable as $$
  select case when j is not null and jsonb_typeof(j -> k) = 'number'
              then least(greatest((j ->> k)::numeric, -2147483648), 2147483647)::integer
              else 0 end
$$;
