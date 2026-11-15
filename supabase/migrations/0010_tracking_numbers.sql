-- USPS tracking number on each order, entered in Admin > Orders and shown to
-- the customer (shipped email, My orders, Track my order page).
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.
alter table public.orders add column if not exists tracking_number text;
