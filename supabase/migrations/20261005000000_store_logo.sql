insert into public.store_config (key, value) values
  ('store_logo', '')
on conflict (key) do nothing;
