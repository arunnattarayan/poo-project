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
