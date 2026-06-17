create extension if not exists pgcrypto;

do $$ begin
  create type license_status as enum ('active', 'suspended', 'expired');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_key_hash text not null unique,
  customer_name text not null,
  customer_email text,
  plan text not null default 'standard',
  status license_status not null default 'active',
  expires_at timestamptz,
  max_activations integer not null default 1,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  email text,
  phone text,
  company text,
  city text,
  state text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.licenses
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

alter table public.licenses
  add column if not exists license_key_label text;

create table if not exists public.license_activations (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  machine_id_hash text not null,
  machine_label text,
  app_version text,
  activated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (license_id, machine_id_hash)
);

create index if not exists idx_licenses_status on public.licenses(status);
create index if not exists idx_licenses_customer on public.licenses(customer_id);
create index if not exists idx_customers_name on public.customers(name);
create index if not exists idx_activations_license on public.license_activations(license_id);
create index if not exists idx_activations_machine on public.license_activations(machine_id_hash);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_licenses_updated_at on public.licenses;
create trigger trg_licenses_updated_at
before update on public.licenses
for each row execute function public.touch_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.touch_updated_at();

alter table public.customers enable row level security;
alter table public.licenses enable row level security;
alter table public.license_activations enable row level security;

-- A API da Vercel usa SUPABASE_SERVICE_ROLE_KEY, que ignora RLS.
-- Nao exponha a service role key dentro do app desktop.
