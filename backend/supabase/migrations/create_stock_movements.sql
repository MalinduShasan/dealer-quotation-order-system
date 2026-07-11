begin;

-- =========================================================
-- 1. Stock movements table
-- =========================================================

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null
    references public.products(id)
    on delete restrict,

  movement_type text not null
    check (
      movement_type in (
        'initial_stock',
        'restock',
        'adjustment_in',
        'adjustment_out',
        'sale',
        'return',
        'order_cancelled'
      )
    ),

  quantity integer not null
    check (quantity > 0),

  previous_quantity integer not null
    check (previous_quantity >= 0),

  new_quantity integer not null
    check (new_quantity >= 0),

  reference_type text
    check (
      reference_type is null
      or reference_type in (
        'product',
        'quotation',
        'order',
        'return',
        'manual_adjustment'
      )
    ),

  reference_id uuid,

  reason text not null
    check (length(trim(reason)) > 0),

  created_by uuid
    references public.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);


-- =========================================================
-- 2. Stock movement indexes
-- =========================================================

create index if not exists idx_stock_movements_product_id
  on public.stock_movements(product_id);

create index if not exists idx_stock_movements_movement_type
  on public.stock_movements(movement_type);

create index if not exists idx_stock_movements_created_at
  on public.stock_movements(created_at desc);

create index if not exists idx_stock_movements_created_by
  on public.stock_movements(created_by);

create index if not exists idx_stock_movements_product_created
  on public.stock_movements(product_id, created_at desc);


-- =========================================================
-- 3. Product SKU uniqueness for non-deleted products
-- =========================================================

alter table if exists public.products
  drop constraint if exists products_sku_key;

create unique index if not exists idx_products_sku_unique_active
  on public.products(lower(trim(sku)))
  where deleted_at is null;


-- =========================================================
-- 4. Product status constraint
-- =========================================================

alter table if exists public.products
  drop constraint if exists products_status_check;

alter table if exists public.products
  add constraint products_status_check
  check (
    status in (
      'active',
      'inactive',
      'low_stock',
      'out_of_stock'
    )
  );


-- =========================================================
-- 5. Function: derive product inventory status
-- =========================================================

create or replace function public.derive_product_status(
  p_current_status text,
  p_stock_quantity integer,
  p_minimum_stock integer
)
returns text
language plpgsql
immutable
set search_path = public, pg_temp
as $$
begin
  -- Preserve intentional manual deactivation.
  if p_current_status = 'inactive' then
    return 'inactive';
  end if;

  if coalesce(p_stock_quantity, 0) = 0 then
    return 'out_of_stock';
  end if;

  if coalesce(p_stock_quantity, 0)
     <= greatest(coalesce(p_minimum_stock, 0), 0) then
    return 'low_stock';
  end if;

  return 'active';
end;
$$;


-- =========================================================
-- 6. Function: atomically apply a stock movement
-- =========================================================

create or replace function public.apply_stock_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_reason text,
  p_created_by uuid default null,
  p_reference_type text default null,
  p_reference_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product public.products%rowtype;
  v_previous_quantity integer;
  v_new_quantity integer;
  v_quantity integer;
  v_reason text;
  v_reference_type text;
  v_delta integer;
  v_status text;
  v_movement_id uuid;
begin
  v_quantity := p_quantity;
  v_reason := trim(coalesce(p_reason, ''));
  v_reference_type :=
    nullif(trim(coalesce(p_reference_type, '')), '');

  -- Basic validation
  if p_product_id is null then
    raise exception 'Product ID is required';
  end if;

  if v_quantity is null or v_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  if v_reason = '' then
    raise exception 'Reason is required';
  end if;

  if p_movement_type is null
     or p_movement_type not in (
       'initial_stock',
       'restock',
       'adjustment_in',
       'adjustment_out',
       'sale',
       'return',
       'order_cancelled'
     ) then
    raise exception 'Invalid movement type';
  end if;

  if v_reference_type is not null
     and v_reference_type not in (
       'product',
       'quotation',
       'order',
       'return',
       'manual_adjustment'
     ) then
    raise exception 'Invalid reference type';
  end if;

  -- Lock the product row to prevent concurrent stock corruption.
  select *
  into v_product
  from public.products
  where id = p_product_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Product not found or archived';
  end if;

  if coalesce(trim(v_product.name), '') = '' then
    raise exception 'Product name cannot be empty';
  end if;

  v_previous_quantity :=
    coalesce(v_product.stock_quantity, 0);

  -- Initial stock may only be recorded once.
  if p_movement_type = 'initial_stock'
     and exists (
       select 1
       from public.stock_movements
       where product_id = p_product_id
         and movement_type = 'initial_stock'
     ) then
    raise exception 'Initial stock has already been recorded';
  end if;

  -- Determine whether stock is increasing or decreasing.
  if p_movement_type in (
    'initial_stock',
    'restock',
    'adjustment_in',
    'return',
    'order_cancelled'
  ) then
    v_delta := v_quantity;
  else
    v_delta := -v_quantity;
  end if;

  v_new_quantity :=
    v_previous_quantity + v_delta;

  if v_new_quantity < 0 then
    raise exception
      'Stock cannot become negative. Current stock: %, requested reduction: %',
      v_previous_quantity,
      v_quantity;
  end if;

  v_status := public.derive_product_status(
    v_product.status,
    v_new_quantity,
    v_product.minimum_stock
  );

  -- Update product stock.
  update public.products
  set
    stock_quantity = v_new_quantity,
    status = v_status,
    updated_at = now(),
    updated_by = coalesce(
      p_created_by,
      public.products.updated_by
    )
  where id = p_product_id;

  -- Record stock movement history.
  insert into public.stock_movements (
    product_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    reference_type,
    reference_id,
    reason,
    created_by
  )
  values (
    p_product_id,
    p_movement_type,
    v_quantity,
    v_previous_quantity,
    v_new_quantity,
    v_reference_type,
    p_reference_id,
    v_reason,
    p_created_by
  )
  returning id into v_movement_id;

  return jsonb_build_object(
    'movementId', v_movement_id,
    'productId', p_product_id,
    'movementType', p_movement_type,
    'productName', v_product.name,
    'sku', v_product.sku,
    'quantity', v_quantity,
    'reason', v_reason,
    'referenceType', v_reference_type,
    'referenceId', p_reference_id,
    'previousQuantity', v_previous_quantity,
    'newQuantity', v_new_quantity,
    'productStatus', v_status
  );
end;
$$;


-- =========================================================
-- 7. Function: create product with initial stock
-- =========================================================

create or replace function public.create_product_with_initial_stock(
  p_sku text,
  p_name text,
  p_description text,
  p_category_id uuid,
  p_brand_id uuid,
  p_unit_price numeric,
  p_dealer_price numeric,
  p_minimum_stock integer,
  p_status text,
  p_initial_stock integer,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_id uuid;
  v_status text;
  v_sku text;
  v_name text;
  v_description text;
begin
  v_sku := trim(coalesce(p_sku, ''));
  v_name := trim(coalesce(p_name, ''));
  v_description := trim(coalesce(p_description, ''));

  if v_sku = '' then
    raise exception 'SKU is required';
  end if;

  if v_name = '' then
    raise exception 'Product name is required';
  end if;

  if length(v_sku) > 100 then
    raise exception 'SKU cannot exceed 100 characters';
  end if;

  if length(v_name) > 255 then
    raise exception 'Product name cannot exceed 255 characters';
  end if;

  if p_initial_stock is null or p_initial_stock < 0 then
    raise exception 'Initial stock must be 0 or greater';
  end if;

  if p_unit_price is null or p_unit_price < 0 then
    raise exception 'Unit price must be 0 or greater';
  end if;

  if p_dealer_price is null or p_dealer_price < 0 then
    raise exception 'Dealer price must be 0 or greater';
  end if;

  if p_minimum_stock is null or p_minimum_stock < 0 then
    raise exception 'Minimum stock must be 0 or greater';
  end if;

  if coalesce(p_status, 'active') not in (
    'active',
    'inactive',
    'low_stock',
    'out_of_stock'
  ) then
    raise exception 'Invalid product status';
  end if;

  if p_category_id is null then
    raise exception 'Category is required';
  end if;

  if p_brand_id is null then
    raise exception 'Brand is required';
  end if;

  -- Ensure selected category exists and is not archived.
  if not exists (
    select 1
    from public.categories
    where id = p_category_id
      and deleted_at is null
  ) then
    raise exception 'Category not found or archived';
  end if;

  -- Ensure selected brand exists and is not archived.
  if not exists (
    select 1
    from public.brands
    where id = p_brand_id
      and deleted_at is null
  ) then
    raise exception 'Brand not found or archived';
  end if;

  -- Case-insensitive duplicate SKU validation.
  if exists (
    select 1
    from public.products
    where lower(trim(sku)) = lower(v_sku)
      and deleted_at is null
  ) then
    raise exception 'SKU already exists';
  end if;

  v_status := public.derive_product_status(
    coalesce(p_status, 'active'),
    p_initial_stock,
    p_minimum_stock
  );

  -- Product starts at zero stock so initial stock is recorded
  -- exclusively through the stock movement function.
  insert into public.products (
    sku,
    name,
    description,
    category_id,
    brand_id,
    unit_price,
    dealer_price,
    stock_quantity,
    minimum_stock,
    status,
    created_by,
    updated_by,
    updated_at
  )
  values (
    v_sku,
    v_name,
    v_description,
    p_category_id,
    p_brand_id,
    p_unit_price,
    p_dealer_price,
    0,
    p_minimum_stock,
    v_status,
    p_created_by,
    p_created_by,
    now()
  )
  returning id into v_product_id;

  if p_initial_stock > 0 then
    perform public.apply_stock_movement(
      v_product_id,
      'initial_stock',
      p_initial_stock,
      'Initial stock recorded during product creation',
      p_created_by,
      'product',
      v_product_id
    );
  end if;

  return v_product_id;
end;
$$;


-- =========================================================
-- 8. Function execution permissions
-- =========================================================

-- The functions are intended to be called through the Express
-- backend using the Supabase service-role client.

revoke all on function public.apply_stock_movement(
  uuid,
  text,
  integer,
  text,
  uuid,
  text,
  uuid
) from public;

revoke all on function public.create_product_with_initial_stock(
  text,
  text,
  text,
  uuid,
  uuid,
  numeric,
  numeric,
  integer,
  text,
  integer,
  uuid
) from public;

revoke all on function public.derive_product_status(
  text,
  integer,
  integer
) from public;

grant execute on function public.apply_stock_movement(
  uuid,
  text,
  integer,
  text,
  uuid,
  text,
  uuid
) to service_role;

grant execute on function public.create_product_with_initial_stock(
  text,
  text,
  text,
  uuid,
  uuid,
  numeric,
  numeric,
  integer,
  text,
  integer,
  uuid
) to service_role;

grant execute on function public.derive_product_status(
  text,
  integer,
  integer
) to service_role;

commit;