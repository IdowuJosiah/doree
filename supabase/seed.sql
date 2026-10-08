-- Sample data so every page can be built and reviewed. Safe to re-run.
-- Shipping values are placeholders: Dorée sets the real ones in /admin/shipping.

insert into public.shipping_settings (id, fixed_fee_states, fixed_fee, other_fee)
values (1, '{NY,NJ,CT}', 800, 1500)
on conflict (id) do nothing;

insert into public.site_content (key, value) values
  ('home_hero', '{"script":"Jewelry created with love","title":"The Soleil Collection","buttonLabel":"Shop now","buttonHref":"/shop","leftImage":"","rightImage":""}'),
  ('brand_statement', '{"text":"Everyday jewelry, made slowly and worn for years. Each piece is designed to feel like yours."}'),
  ('feature_panel', '{"script":"Jewelry created with love","title":"Soleil","text":"Warm gold, soft curves and pieces light enough to forget you are wearing them.","buttonLabel":"Explore","buttonHref":"/shop","image":""}'),
  ('instagram', '{"handle":"@doree","url":"https://www.instagram.com/"}'),
  ('announcement', '{"text":""}'),
  ('lookbook', '{"photos":[]}')
on conflict (key) do nothing;

insert into public.collections (name, slug, intro, sort_order) values
  ('Earrings', 'earrings', 'Hoops, studs and drops for every day.', 1),
  ('Necklaces', 'necklaces', 'Fine chains and pendants to layer or wear alone.', 2),
  ('Bracelets', 'bracelets', 'Bangles, cuffs and chains.', 3),
  ('Rings', 'rings', 'Bands and signets made to stack.', 4)
on conflict (slug) do nothing;

with seed(collection, name, price, variants) as (values
  ('earrings',  'Sol Hoops',     6800, array['One size']),
  ('earrings',  'Luna Studs',    4200, array['One size']),
  ('earrings',  'Aura Drops',    7400, array['One size']),
  ('necklaces', 'Odette Chain',  9600, array['16"','18"','20"']),
  ('necklaces', 'Mira Pendant',  8800, array['16"','18"']),
  ('necklaces', 'Celeste Layer', 12000, array['One size']),
  ('bracelets', 'Fleur Bangle',  8200, array['One size']),
  ('bracelets', 'Ines Chain',    6400, array['6.5"','7"']),
  ('bracelets', 'Vesper Cuff',   9000, array['One size']),
  ('rings',     'Ayla Band',     5800, array['5','6','7','8']),
  ('rings',     'Noor Signet',   7200, array['5','6','7','8']),
  ('rings',     'Elise Stack',   6600, array['5','6','7','8'])
),
ins_products as (
  insert into public.products (name, slug, price, description, materials, care, published)
  select name,
         regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
         price,
         name || ', made to be worn every day.',
         '18k gold plated sterling silver.',
         'Keep dry, store in the pouch provided and wipe gently with a soft cloth.',
         true
  from seed
  on conflict (slug) do nothing
  returning id, slug
),
ins_variants as (
  insert into public.product_variants (product_id, label, stock)
  select p.id, v.label, 10
  from ins_products p
  join seed s on regexp_replace(lower(s.name), '[^a-z0-9]+', '-', 'g') = p.slug
  cross join lateral unnest(s.variants) as v(label)
  returning 1
)
insert into public.collection_products (collection_id, product_id, sort_order)
select c.id, p.id, row_number() over (partition by s.collection order by s.name)
from ins_products p
join seed s on regexp_replace(lower(s.name), '[^a-z0-9]+', '-', 'g') = p.slug
join public.collections c on c.slug = s.collection;
