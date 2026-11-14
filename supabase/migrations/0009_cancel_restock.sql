-- Cancelling a paid or sent order puts its stock back (and gives back the
-- discount code's use), in one step. Called from Admin > Orders.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.

create or replace function public.cancel_order(p_order_id uuid)
returns text
language plpgsql security definer set search_path = public as $cancel$
declare
  o public.orders;
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;
  if o.status = 'cancelled' then
    return 'already_cancelled';
  end if;

  update public.orders set status = 'cancelled' where id = o.id;

  -- Only paid and sent orders took stock (and counted a discount use).
  if o.status in ('paid', 'fulfilled') then
    update public.product_variants v
    set stock = v.stock + i.qty
    from (
      select variant_id, sum(quantity)::integer as qty
      from public.order_items
      where order_id = o.id and variant_id is not null
      group by variant_id
    ) i
    where v.id = i.variant_id;

    if o.discount_code is not null then
      update public.discount_codes set uses = greatest(uses - 1, 0) where code = o.discount_code;
    end if;
    return 'restocked';
  end if;

  return 'cancelled';
end $cancel$;

revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated, service_role;
