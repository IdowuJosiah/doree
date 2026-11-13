-- Discount codes: a percentage off the order subtotal (never shipping),
-- created in Admin > Discounts and entered at checkout.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  -- Stored in capitals; checkout upper-cases what the customer types.
  code text not null unique check (code = upper(code) and char_length(code) between 2 and 40),
  percent integer not null check (percent between 1 and 100),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  -- Empty means unlimited. Counted when an order using the code is paid.
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  -- Cents; the subtotal must be at least this for the code to apply.
  min_subtotal integer not null default 0 check (min_subtotal >= 0),
  created_at timestamptz not null default now()
);

-- Only the admin can see or change codes. Checkout reads them with the
-- service role on the server, so customers cannot list them.
alter table public.discount_codes enable row level security;
drop policy if exists "admin all" on public.discount_codes;
create policy "admin all" on public.discount_codes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- What each order saved.
alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists discount_amount integer not null default 0;
alter table public.orders drop constraint if exists orders_discount_amount_check;
alter table public.orders add constraint orders_discount_amount_check check (discount_amount >= 0);

-- Marks a pending order paid, reduces stock and counts the discount code's
-- use, once. Called only by the Square webhook handler through the service role.
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_id text)
returns boolean
language plpgsql security definer set search_path = public as $paid$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found or o.status <> 'pending' then
    return false;
  end if;

  update public.orders set status = 'paid', square_payment_id = p_payment_id where id = o.id;

  update public.product_variants v
  set stock = greatest(v.stock - i.qty, 0)
  from (
    select variant_id, sum(quantity)::integer as qty
    from public.order_items
    where order_id = o.id and variant_id is not null
    group by variant_id
  ) i
  where v.id = i.variant_id;

  if o.discount_code is not null then
    update public.discount_codes set uses = uses + 1 where code = o.discount_code;
  end if;

  return true;
end $paid$;

revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;
