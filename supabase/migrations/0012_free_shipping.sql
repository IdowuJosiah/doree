-- Free shipping when the order (after any discount) reaches this amount, in
-- cents. Empty means no free shipping. Set in Admin > Shipping.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.

alter table public.shipping_settings add column if not exists free_shipping_min integer default 12500 check (free_shipping_min is null or free_shipping_min > 0);
