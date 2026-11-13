-- Rate limits for the public checkout and forms, to slow down card testing
-- (criminals trying stolen cards one after another) and form spam.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.

create table if not exists public.rate_limits (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_limits_key_at_idx on public.rate_limits (key, at);

-- No policies: only the server (service role) reads or writes it.
alter table public.rate_limits enable row level security;

-- Records one attempt for `p_key` and says whether it is allowed: at most
-- `p_max` attempts in the last `p_window_seconds`. Refused attempts are not
-- recorded, so waiting always works.
create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql security definer set search_path = public as $limit$
declare
  n integer;
begin
  -- Keep the table small: now and then, forget attempts older than a day.
  if random() < 0.02 then
    delete from public.rate_limits where at < now() - interval '1 day';
  end if;

  select count(*) into n from public.rate_limits
  where key = p_key and at > now() - make_interval(secs => p_window_seconds);
  if n >= p_max then
    return false;
  end if;

  insert into public.rate_limits (key) values (p_key);
  return true;
end $limit$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
