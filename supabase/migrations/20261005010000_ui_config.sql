create table if not exists public.logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.logos enable row level security;
drop policy if exists "logos_public_read" on public.logos;
drop policy if exists "logos_admin_all" on public.logos;
create policy "logos_public_read" on public.logos for select using (is_active = true);
create policy "logos_admin_all" on public.logos for all using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.store_config (key, value) values
  ('header_links', '[{"label":"New Arrivals","url":"#"},{"label":"Men","url":"#"},{"label":"Women","url":"#"},{"label":"Accessories","url":"#"},{"label":"Journal","url":"#"}]'),
  ('hero_title', 'Wear Your Heritage. Express Your Soul.'),
  ('hero_subtitle', 'Bespoke premium apparel meticulously crafted from pure cotton and authentic Indian artistry. Organic, timeless, meaningful design.'),
  ('hero_features', '[{"title":"HERITAGE CRAFT","desc":"Traditional weaving met with modern cuts."},{"title":"ETHICAL & SUSTAINABLE","desc":"Organic, certified materials."},{"title":"GLOBAL COMMUNITY","desc":"Supporting artisan communities."}]'),
  ('heritage_series', '[{"title":"The culture and inspire...","desc":"...","image":"/path.jpg"}]'),
  ('footer_about', '[{"label":"Our Story","url":"#"},{"label":"Ethical Practices","url":"#"}]'),
  ('footer_connect', '[{"label":"Contact","url":"#"},{"label":"Press","url":"#"},{"label":"Wholesale","url":"#"}]'),
  ('footer_support', '[{"label":"Size Guide","url":"#"},{"label":"Shipping & Returns","url":"#"},{"label":"FAQ","url":"#"}]'),
  ('footer_copyright', '© Norrai Clothing. All rights reserved.')
on conflict (key) do nothing;
