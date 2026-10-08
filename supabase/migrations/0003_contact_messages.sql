-- Messages sent from the contact page. Written by the server only; readable
-- only by the admin. Safe to run more than once. Paste the whole file into a
-- new SQL editor tab with nothing highlighted, then Run.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null check (char_length(message) <= 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
drop policy if exists "admin all" on public.contact_messages;
create policy "admin all" on public.contact_messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
