alter table if exists public.brands
add column if not exists logo_url text;

alter table if exists public.brands
add column if not exists logo_path text;

alter table if exists public.brands
add column if not exists updated_at timestamptz not null default now();
