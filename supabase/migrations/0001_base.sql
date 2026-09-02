-- 0001_base.sql — tenants, profiles, helpers de RLS
-- Idempotente: pode rodar mais de uma vez sem erro.

create extension if not exists pgcrypto;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  whatsapp text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  role text not null check (role in ('admin','staff')),
  name text,
  created_at timestamptz not null default now()
);

-- Helpers usados pelas policies de RLS de todas as tabelas de staff.
create or replace function public.current_tenant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from profiles where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
$$;

alter table tenants enable row level security;
alter table profiles enable row level security;

do $$ begin
  create policy "tenants_staff_select" on tenants for select to authenticated
    using (public.is_staff() and id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_own_select" on profiles for select to authenticated
    using (id = auth.uid());
exception when duplicate_object then null; end $$;
