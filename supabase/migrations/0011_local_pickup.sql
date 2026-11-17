-- Free local pickup. Customers whose ZIP code is on the list can choose
-- pickup at checkout instead of shipping. Set up in Admin > Shipping.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.

alter table public.shipping_settings add column if not exists pickup_enabled boolean not null default true;
alter table public.shipping_settings add column if not exists pickup_zips text[] not null default '{77449,77406,77407}';
alter table public.shipping_settings add column if not exists pickup_note text not null default
  'Katy and Richmond area, ZIP codes 77449, 77406 and 77407, plus nearby. We''ll email you the pickup location and time once your order is processed and ready for pickup.';

-- 'ship' (the default, for every existing order) or 'pickup'.
alter table public.orders add column if not exists fulfillment text not null default 'ship';
do $f$ begin
  alter table public.orders add constraint orders_fulfillment_check check (fulfillment in ('ship', 'pickup'));
exception when duplicate_object then null;
end $f$;
