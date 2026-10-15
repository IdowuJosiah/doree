-- The home page brand statement becomes the brand tagline, "She who is golden".
-- Only replaces the original sample wording, so anything Dorée has written in
-- /admin/content is left alone. Safe to run more than once.

update public.site_content
set value = jsonb_set(value, '{text}', '"She who is golden"')
where key = 'brand_statement'
  and value ->> 'text' = 'Everyday jewelry, made slowly and worn for years. Each piece is designed to feel like yours.';

-- Point the Instagram link at Dorée's account, only if it is still the placeholder.
update public.site_content
set value = '{"handle":"@doreeofficial_","url":"https://www.instagram.com/doreeofficial_/"}'::jsonb
where key = 'instagram'
  and value ->> 'handle' = '@doree';
