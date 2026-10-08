-- Dorée: schema, row-level security and storage.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.
-- Prices are stored in cents. Admin = a Supabase user whose app_metadata.role is 'admin'.

create or replace function public.is_admin() returns boolean
language sql stable as $is_admin$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$is_admin$;

-- Catalog ---------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price integer not null check (price >= 0),
  description text not null default '',
  materials text not null default '',
  care text not null default '',
  published boolean not null default false,
  sold_out boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  stock integer not null default 0 check (stock >= 0),
  sku text unique
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  object_position text not null default 'center',
  sort_order integer not null default 0
);
create index if not exists product_images_order_idx on public.product_images (product_id, sort_order);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  banner_url text,
  intro text not null default '',
  sort_order integer not null default 0
);

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

-- Customers ---------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  address jsonb
);

create table if not exists public.wishlist_items (
  customer_id uuid not null references public.customers (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (customer_id, product_id)
);

-- Orders ------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 1001) unique,
  customer_id uuid references public.customers (id) on delete set null,
  email text not null,
  name text not null default '',
  address jsonb not null,
  state text not null,
  subtotal integer not null check (subtotal >= 0),
  shipping_fee integer not null check (shipping_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'fulfilled', 'cancelled')),
  square_payment_id text unique,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  name text not null,
  price integer not null check (price >= 0),
  quantity integer not null check (quantity > 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- Settings and content ----------------------------------------------------

create table if not exists public.shipping_settings (
  id smallint primary key default 1 check (id = 1),
  fixed_fee_states text[] not null default '{}',
  fixed_fee integer not null default 0 check (fixed_fee >= 0),
  other_fee integer not null default 0 check (other_fee >= 0)
);

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null
);

-- Guest orders are linked to a customer once the same email is confirmed.
create or replace function public.link_customer() returns trigger
language plpgsql security definer set search_path = public as $link$
begin
  insert into public.customers (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;

  if new.email_confirmed_at is not null then
    update public.orders set customer_id = new.id
    where customer_id is null and lower(email) = lower(new.email);
  end if;
  return new;
end $link$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.link_customer();
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.link_customer();

-- Marks a pending order paid and reduces stock, once. Called only by the
-- Square webhook handler through the service role.
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

  return true;
end $paid$;

revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

-- Row-level security ------------------------------------------------------

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.customers enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.shipping_settings enable row level security;
alter table public.site_content enable row level security;

-- Admin can do everything on every table.
do $policies$
declare t text;
begin
  foreach t in array array[
    'products','product_variants','product_images','collections','collection_products',
    'customers','wishlist_items','orders','order_items','shipping_settings','site_content'
  ] loop
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format(
      'create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $policies$;

-- Public reads: published products only.
drop policy if exists "public read published" on public.products;
create policy "public read published" on public.products
  for select to anon, authenticated using (published and not archived);
drop policy if exists "public read variants" on public.product_variants;
create policy "public read variants" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.published and not p.archived));
drop policy if exists "public read images" on public.product_images;
create policy "public read images" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.published and not p.archived));
drop policy if exists "public read collections" on public.collections;
create policy "public read collections" on public.collections
  for select to anon, authenticated using (true);
drop policy if exists "public read collection products" on public.collection_products;
create policy "public read collection products" on public.collection_products
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.published and not p.archived));
drop policy if exists "public read shipping" on public.shipping_settings;
create policy "public read shipping" on public.shipping_settings
  for select to anon, authenticated using (true);
drop policy if exists "public read content" on public.site_content;
create policy "public read content" on public.site_content
  for select to anon, authenticated using (true);

-- Customers see and manage only their own rows. Orders are created and
-- updated by the server with the service role; customers may only read theirs.
drop policy if exists "own customer" on public.customers;
create policy "own customer" on public.customers
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "own wishlist" on public.wishlist_items;
create policy "own wishlist" on public.wishlist_items
  for all to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());
drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders
  for select to authenticated using (customer_id = auth.uid());
drop policy if exists "own order items" on public.order_items;
create policy "own order items" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));

-- Storage: one public bucket. Originals are kept as uploaded; the site serves
-- resized copies through next/image and the CDN.
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
