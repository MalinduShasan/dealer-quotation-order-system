begin;

-- =========================================================
-- 1. Add soft-delete columns
-- =========================================================

alter table public.users
add column if not exists deleted_at timestamptz null;

alter table public.dealers
add column if not exists deleted_at timestamptz null;

alter table public.categories
add column if not exists deleted_at timestamptz null;

alter table public.brands
add column if not exists deleted_at timestamptz null;

alter table public.products
add column if not exists deleted_at timestamptz null;


-- =========================================================
-- 2. Add created_by, updated_by, deleted_by audit columns
-- =========================================================

alter table public.users
add column if not exists created_by uuid references public.users(id) on delete set null,
add column if not exists updated_by uuid references public.users(id) on delete set null,
add column if not exists deleted_by uuid references public.users(id) on delete set null;

alter table public.dealers
add column if not exists created_by uuid references public.users(id) on delete set null,
add column if not exists updated_by uuid references public.users(id) on delete set null,
add column if not exists deleted_by uuid references public.users(id) on delete set null;

alter table public.categories
add column if not exists created_by uuid references public.users(id) on delete set null,
add column if not exists updated_by uuid references public.users(id) on delete set null,
add column if not exists deleted_by uuid references public.users(id) on delete set null;

alter table public.brands
add column if not exists created_by uuid references public.users(id) on delete set null,
add column if not exists updated_by uuid references public.users(id) on delete set null,
add column if not exists deleted_by uuid references public.users(id) on delete set null;

alter table public.products
add column if not exists created_by uuid references public.users(id) on delete set null,
add column if not exists updated_by uuid references public.users(id) on delete set null,
add column if not exists deleted_by uuid references public.users(id) on delete set null;


-- =========================================================
-- 3. Ensure updated_at exists where needed
-- =========================================================

alter table public.categories
add column if not exists updated_at timestamptz not null default now();

alter table public.brands
add column if not exists updated_at timestamptz not null default now();


-- =========================================================
-- 4. Shared updated_at trigger function
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =========================================================
-- 5. Recreate updated_at triggers
-- =========================================================

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_dealers_updated_at on public.dealers;
create trigger set_dealers_updated_at
before update on public.dealers
for each row
execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_brands_updated_at on public.brands;
create trigger set_brands_updated_at
before update on public.brands
for each row
execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_quotations_updated_at on public.quotations;
create trigger set_quotations_updated_at
before update on public.quotations
for each row
execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();


-- =========================================================
-- 6. Add indexes
-- =========================================================

create index if not exists idx_users_deleted_at
on public.users(deleted_at);

create index if not exists idx_dealers_deleted_at
on public.dealers(deleted_at);

create index if not exists idx_categories_deleted_at
on public.categories(deleted_at);

create index if not exists idx_brands_deleted_at
on public.brands(deleted_at);

create index if not exists idx_products_deleted_at
on public.products(deleted_at);

create index if not exists idx_active_users
on public.users(id)
where deleted_at is null;

create index if not exists idx_active_dealers
on public.dealers(id)
where deleted_at is null;

create index if not exists idx_active_categories
on public.categories(id)
where deleted_at is null;

create index if not exists idx_active_brands
on public.brands(id)
where deleted_at is null;

create index if not exists idx_active_products
on public.products(id)
where deleted_at is null;

commit;