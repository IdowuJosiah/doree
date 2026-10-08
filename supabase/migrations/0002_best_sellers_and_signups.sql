-- Best sellers on the home page, and sign-ups for the upcoming collection.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.

-- Dorée ticks "Best seller" on a product in /admin.
alter table public.products add column if not exists best_seller boolean not null default false;

-- When nothing is ticked, the home page falls back to the products that have
-- sold the most. Order data stays private: only published product ids leave
-- this function.
create or replace function public.best_selling_product_ids(max_count integer default 4)
returns setof uuid
language sql stable security definer set search_path = public as $best$
  select i.product_id
  from public.order_items i
  join public.orders o on o.id = i.order_id
  join public.products p on p.id = i.product_id
  where o.status in ('paid', 'fulfilled') and p.published and not p.archived
  group by i.product_id
  order by sum(i.quantity) desc, i.product_id
  limit least(greatest(max_count, 1), 12)
$best$;

revoke all on function public.best_selling_product_ids(integer) from public;
grant execute on function public.best_selling_product_ids(integer) to anon, authenticated, service_role;

-- Email sign-ups ("tell me when the new collection launches"). Written by the
-- server only; readable only by the admin.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  source text not null default 'home',
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;
drop policy if exists "admin all" on public.subscribers;
create policy "admin all" on public.subscribers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Sample: mark four seeded products as best sellers, only if none are marked yet.
update public.products set best_seller = true
where slug in ('sol-hoops', 'odette-chain', 'fleur-bangle', 'noor-signet')
  and not exists (select 1 from public.products where best_seller);
