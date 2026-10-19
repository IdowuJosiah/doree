-- Small security tidy-ups flagged by the Supabase security advisor.
-- Safe to run more than once. Paste the whole file into a new SQL editor tab
-- with nothing highlighted, then Run.

-- is_admin() runs inside row-level security checks; pin its search path so
-- it cannot be redirected to look-alike objects.
alter function public.is_admin() set search_path = '';

-- link_customer() is only meant to run as a trigger on auth.users. Triggers
-- fire regardless of EXECUTE rights, so nobody needs to call it directly.
revoke execute on function public.link_customer() from public, anon, authenticated;
