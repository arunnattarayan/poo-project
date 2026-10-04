-- =============================================================================
-- Nanjai Clothing — Supabase schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / ON CONFLICT where possible.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 200),
  description text,
  price       numeric(10, 2) not null check (price >= 0),
  image_url   text,
  in_stock    boolean not null default true,   -- "Stock Status" shown on the PDP
  is_active   boolean not null default true,   -- hidden from the storefront when false
  created_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  address       text not null,
  cart_items    jsonb not null,                -- [{id, title, price, quantity}]
  subtotal      numeric(10, 2) not null default 0,
  delivery_fee  numeric(10, 2) not null default 0,
  total_amount  numeric(10, 2) not null,
  status        text not null default 'pending'
                check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at    timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists products_active_created_idx on public.products (is_active, created_at desc);

create table if not exists public.store_config (
  id    uuid primary key default gen_random_uuid(),
  key   text unique not null,
  value text not null default ''
);

-- Admin allow-list. Being "logged in" is NOT enough to be an admin —
-- the user's id must also be present in this table.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. Default configuration
-- -----------------------------------------------------------------------------

insert into public.store_config (key, value) values
  ('store_name',      'Nanjai Clothing'),
  ('store_tagline',   'Tamil & spiritual printed T-shirts'),
  ('whatsapp_number', '919876543210'),
  ('currency_symbol', '₹'),
  ('delivery_fee',    '50')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Helper: is the current user an admin?
--    SECURITY DEFINER so it can read `admins` regardless of RLS.
-- -----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.products     enable row level security;
alter table public.orders       enable row level security;
alter table public.store_config enable row level security;
alter table public.admins       enable row level security;

-- products: public can read active products; admins can do everything.
drop policy if exists "products_public_read"  on public.products;
drop policy if exists "products_admin_all"    on public.products;
create policy "products_public_read" on public.products
  for select using (is_active = true);
create policy "products_admin_all" on public.products
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- orders: admins can read / update / delete.
-- Public order creation goes through the `create_order` RPC below (which
-- recomputes prices server-side), so there is intentionally NO public INSERT
-- policy — otherwise a customer could insert an order with a forged total.
drop policy if exists "orders_admin_select" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_select" on public.orders
  for select using ((select public.is_admin()));
create policy "orders_admin_update" on public.orders
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "orders_admin_delete" on public.orders
  for delete using ((select public.is_admin()));

-- store_config: public read; admins can do everything.
drop policy if exists "config_public_read" on public.store_config;
drop policy if exists "config_admin_all"   on public.store_config;
create policy "config_public_read" on public.store_config
  for select using (true);
create policy "config_admin_all" on public.store_config
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- admins: a user can only see their own row (no writes from the client).
drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read" on public.admins
  for select using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5. Public checkout RPC
--    - Takes only product ids + quantities from the browser.
--    - Looks up live prices, stock and delivery fee from the DB.
--    - Inserts a 'pending' order and returns the priced order plus the
--      configured WhatsApp number used for the redirect.
-- -----------------------------------------------------------------------------

create or replace function public.create_order(
  p_customer_name text,
  p_address       text,
  p_items         jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item      jsonb;
  v_qty       int;
  v_product   public.products%rowtype;
  v_items     jsonb   := '[]'::jsonb;
  v_subtotal  numeric := 0;
  v_fee       numeric := 0;
  v_whatsapp  text;
  v_order_id  uuid;
begin
  if coalesce(trim(p_customer_name), '') = '' then
    raise exception 'Please enter your name';
  end if;
  if coalesce(trim(p_address), '') = '' then
    raise exception 'Please enter your delivery address';
  end if;
  if char_length(p_customer_name) > 120 or char_length(p_address) > 1000 then
    raise exception 'Name or address is too long';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many items in cart';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_qty := (v_item ->> 'quantity')::int;
    exception when others then
      raise exception 'Invalid quantity';
    end;
    if v_qty is null or v_qty < 1 or v_qty > 50 then
      raise exception 'Invalid quantity';
    end if;

    begin
      select * into v_product
      from public.products p
      where p.id = (v_item ->> 'id')::uuid and p.is_active;
    exception when invalid_text_representation then
      raise exception 'Invalid product in cart';
    end;

    if not found then
      raise exception 'A product in your cart is no longer available';
    end if;
    if not v_product.in_stock then
      raise exception '"%" is out of stock', v_product.title;
    end if;

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id',       v_product.id,
      'title',    v_product.title,
      'price',    v_product.price,
      'quantity', v_qty
    ));
  end loop;

  select coalesce(nullif(trim(value), '')::numeric, 0) into v_fee
  from public.store_config where key = 'delivery_fee';
  v_fee := coalesce(v_fee, 0);

  select value into v_whatsapp
  from public.store_config where key = 'whatsapp_number';

  insert into public.orders (customer_name, address, cart_items, subtotal, delivery_fee, total_amount, status)
  values (trim(p_customer_name), trim(p_address), v_items, v_subtotal, v_fee, v_subtotal + v_fee, 'pending')
  returning public.orders.id into v_order_id;

  return jsonb_build_object(
    'id',              v_order_id,
    'items',           v_items,
    'subtotal',        v_subtotal,
    'delivery_fee',    v_fee,
    'total_amount',    v_subtotal + v_fee,
    'whatsapp_number', coalesce(v_whatsapp, '')
  );
end;
$$;

revoke all on function public.create_order(text, text, jsonb) from public;
grant execute on function public.create_order(text, text, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. Make yourself an admin (run AFTER creating the user in
--    Authentication → Users → "Add user"). Replace the email:
-- -----------------------------------------------------------------------------
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'you@example.com'
-- on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 7. (Optional) sample products
-- -----------------------------------------------------------------------------
-- insert into public.products (title, description, price, image_url) values
--   ('Yaadhum Oore Tee', 'Premium 180 GSM cotton tee with "யாதும் ஊரே யாவரும் கேளிர்" print.', 499, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'),
--   ('Om Namah Shivaya Tee', 'Soft-washed black tee with a minimalist spiritual print.', 549, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800');

-- =============================================================================
-- Multiple images per product + Supabase Storage bucket for uploads.
-- Safe to re-run.
-- =============================================================================

-- 1. `images` holds the ordered gallery. `image_url` is kept as the cover image
--    (always images[1]) so older code / queries keep working.
alter table public.products
  add column if not exists images text[] not null default '{}';

-- Backfill existing rows that only have a single image_url.
update public.products
set images = array[image_url]
where image_url is not null and image_url <> '' and cardinality(images) = 0;

-- Keep image_url in sync with the first gallery image.
create or replace function public.products_sync_cover()
returns trigger
language plpgsql
as $$
begin
  if cardinality(new.images) > 0 then
    new.image_url := new.images[1];
  elsif new.image_url is not null and new.image_url <> '' then
    new.images := array[new.image_url];
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_cover on public.products;
create trigger products_sync_cover
  before insert or update on public.products
  for each row execute function public.products_sync_cover();

alter table public.products drop constraint if exists products_images_max;
alter table public.products add constraint products_images_max check (cardinality(images) <= 10);

-- 2. Storage bucket for admin uploads (public read, admin-only write).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read"  on storage.objects;
drop policy if exists "product_images_admin_insert" on storage.objects;
drop policy if exists "product_images_admin_update" on storage.objects;
drop policy if exists "product_images_admin_delete" on storage.objects;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and (select public.is_admin()));
