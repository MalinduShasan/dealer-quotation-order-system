alter table if exists public.quotations
  add column if not exists currency_code text not null default 'USD',
  add column if not exists tax_percentage numeric(5,2) not null default 0,
  add column if not exists discount_percentage numeric(5,2) not null default 0,
  add column if not exists sent_at timestamptz null,
  add column if not exists accepted_at timestamptz null,
  add column if not exists rejected_at timestamptz null,
  add column if not exists cancelled_at timestamptz null,
  add column if not exists converted_at timestamptz null,
  add column if not exists rejection_reason text null,
  add column if not exists cancellation_reason text null,
  add column if not exists version integer not null default 1,
  add column if not exists updated_by uuid references public.users(id) on delete set null;

alter table if exists public.quotation_items
  add column if not exists product_name_snapshot text,
  add column if not exists product_sku_snapshot text,
  add column if not exists product_description_snapshot text,
  add column if not exists brand_name_snapshot text,
  add column if not exists category_name_snapshot text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotations_discount_percentage_check'
  ) then
    alter table public.quotations
      add constraint quotations_discount_percentage_check
      check (discount_percentage >= 0 and discount_percentage <= 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotations_tax_percentage_check'
  ) then
    alter table public.quotations
      add constraint quotations_tax_percentage_check
      check (tax_percentage >= 0 and tax_percentage <= 100);
  end if;
end $$;

create index if not exists idx_quotations_quotation_number on public.quotations(quotation_number);
create index if not exists idx_quotations_created_by on public.quotations(created_by);
create index if not exists idx_quotations_created_at on public.quotations(created_at desc);
create index if not exists idx_quotations_valid_until on public.quotations(valid_until);
create index if not exists idx_quotation_items_product_id on public.quotation_items(product_id);
create index if not exists idx_quotation_status_history_quotation_id on public.quotation_status_history(quotation_id);

create sequence if not exists public.quotation_number_seq;

create or replace function public.generate_quotation_number()
returns text
language plpgsql
as $$
declare
  next_value bigint;
begin
  next_value := nextval('public.quotation_number_seq');
  return format('QT-%s-%06s', to_char(current_date, 'YYYY'), next_value);
end;
$$;

create or replace function public.create_quotation_with_items(
  p_dealer_id uuid,
  p_created_by uuid,
  p_discount_amount numeric,
  p_tax_amount numeric,
  p_shipping_amount numeric,
  p_valid_until date,
  p_terms text,
  p_internal_notes text,
  p_dealer_notes text,
  p_status text,
  p_currency_code text,
  p_tax_percentage numeric,
  p_discount_percentage numeric,
  p_items jsonb
)
returns table (
  quotation_id uuid,
  quotation_number text
)
language plpgsql
as $$
declare
  v_quotation_id uuid;
  v_quotation_number text;
  v_subtotal numeric(12,2) := 0;
  v_grand_total numeric(12,2) := 0;
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_discount numeric(12,2);
  v_tax numeric(12,2);
  v_line_total numeric(12,2);
begin
  if p_dealer_id is null then
    raise exception 'Dealer is required';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Quotation items are required';
  end if;

  if not exists (
    select 1
    from public.dealers d
    where d.id = p_dealer_id
  ) then
    raise exception 'Dealer not found';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_quantity <= 0 then
      raise exception 'Quotation item quantity must be greater than zero';
    end if;

    select
      p.id,
      p.sku,
      p.name,
      p.description,
      p.stock_quantity,
      p.status,
      p.dealer_price,
      p.unit_price,
      b.name as brand_name,
      c.name as category_name
    into v_product
    from public.products p
    left join public.brands b on b.id = p.brand_id
    left join public.categories c on c.id = p.category_id
    where p.id = (v_item ->> 'product_id')::uuid
      and p.deleted_at is null;

    if v_product.id is null then
      raise exception 'Quotation product not found';
    end if;

    if v_product.status in ('inactive', 'out_of_stock') or v_product.stock_quantity <= 0 then
      raise exception 'Quoted product is unavailable';
    end if;

    if v_quantity > v_product.stock_quantity then
      raise exception 'Requested quantity exceeds current stock';
    end if;

    v_unit_price := round(coalesce((v_item ->> 'unit_price')::numeric, v_product.dealer_price, v_product.unit_price, 0), 2);
    v_discount := round(coalesce((v_item ->> 'discount_amount')::numeric, 0), 2);
    v_tax := round(coalesce((v_item ->> 'tax_amount')::numeric, 0), 2);
    v_line_total := round((v_quantity * v_unit_price) - v_discount + v_tax, 2);

    if v_unit_price < 0 or v_discount < 0 or v_tax < 0 or v_line_total < 0 then
      raise exception 'Invalid quotation item pricing';
    end if;

    v_subtotal := v_subtotal + round(v_quantity * v_unit_price, 2);
  end loop;

  v_subtotal := round(v_subtotal, 2);
  v_grand_total := round(v_subtotal - coalesce(p_discount_amount, 0) + coalesce(p_tax_amount, 0) + coalesce(p_shipping_amount, 0), 2);

  if v_grand_total < 0 then
    raise exception 'Grand total cannot be negative';
  end if;

  v_quotation_number := public.generate_quotation_number();

  insert into public.quotations (
    quotation_number,
    dealer_id,
    created_by,
    subtotal,
    discount_amount,
    tax_amount,
    shipping_amount,
    grand_total,
    valid_until,
    terms,
    internal_notes,
    dealer_notes,
    status,
    currency_code,
    tax_percentage,
    discount_percentage
  )
  values (
    v_quotation_number,
    p_dealer_id,
    p_created_by,
    v_subtotal,
    coalesce(p_discount_amount, 0),
    coalesce(p_tax_amount, 0),
    coalesce(p_shipping_amount, 0),
    v_grand_total,
    p_valid_until,
    coalesce(p_terms, ''),
    coalesce(p_internal_notes, ''),
    coalesce(p_dealer_notes, ''),
    p_status,
    coalesce(p_currency_code, 'USD'),
    coalesce(p_tax_percentage, 0),
    coalesce(p_discount_percentage, 0)
  )
  returning id into v_quotation_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select
      p.id,
      p.sku,
      p.name,
      p.description,
      p.dealer_price,
      p.unit_price,
      b.name as brand_name,
      c.name as category_name
    into v_product
    from public.products p
    left join public.brands b on b.id = p.brand_id
    left join public.categories c on c.id = p.category_id
    where p.id = (v_item ->> 'product_id')::uuid
      and p.deleted_at is null;

    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_price := round(coalesce((v_item ->> 'unit_price')::numeric, v_product.dealer_price, v_product.unit_price, 0), 2);
    v_discount := round(coalesce((v_item ->> 'discount_amount')::numeric, 0), 2);
    v_tax := round(coalesce((v_item ->> 'tax_amount')::numeric, 0), 2);
    v_line_total := round((v_quantity * v_unit_price) - v_discount + v_tax, 2);

    insert into public.quotation_items (
      quotation_id,
      product_id,
      quantity,
      unit_price,
      discount_amount,
      tax_amount,
      line_total,
      product_name_snapshot,
      product_sku_snapshot,
      product_description_snapshot,
      brand_name_snapshot,
      category_name_snapshot
    )
    values (
      v_quotation_id,
      v_product.id,
      v_quantity,
      v_unit_price,
      v_discount,
      v_tax,
      v_line_total,
      v_product.name,
      v_product.sku,
      v_product.description,
      v_product.brand_name,
      v_product.category_name
    );
  end loop;

  insert into public.quotation_status_history (
    quotation_id,
    old_status,
    new_status,
    changed_by,
    note
  )
  values (
    v_quotation_id,
    null,
    p_status,
    p_created_by,
    'Quotation created'
  );

  return query select v_quotation_id, v_quotation_number;
end;
$$;
