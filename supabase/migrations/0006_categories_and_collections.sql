-- Splits the old "collections" into two kinds that share one table:
--   category   - a product type (Earrings, Necklaces, Bracelets, Rings),
--                shown at /shop/<slug>; a product has one.
--   collection - a named set of pieces (e.g. "Soleil") that can mix types,
--                shown at /collections/<slug>; a product can be in several.
-- Existing rows are the product types, so they become categories.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.

alter table public.collections
  add column if not exists kind text not null default 'category';

alter table public.collections drop constraint if exists collections_kind_check;
alter table public.collections
  add constraint collections_kind_check check (kind in ('category', 'collection'));

create index if not exists collections_kind_order_idx on public.collections (kind, sort_order);
