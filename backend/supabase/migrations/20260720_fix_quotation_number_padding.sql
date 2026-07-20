create or replace function public.generate_quotation_number()
returns text
language plpgsql
as $$
declare
  next_value bigint;
begin
  next_value := nextval('public.quotation_number_seq');
  return 'QT-' || to_char(current_date, 'YYYY') || '-' || lpad(next_value::text, 6, '0');
end;
$$;

update public.quotations
set quotation_number =
  split_part(quotation_number, '-', 1) || '-' ||
  split_part(quotation_number, '-', 2) || '-' ||
  lpad(trim(split_part(quotation_number, '-', 3)), 6, '0')
where quotation_number ~ '^QT-[0-9]{4}-\s*[0-9]+$';
