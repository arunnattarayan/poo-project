-- =============================================================================
-- Migration: Homepage Hero Slideshow Management
-- Safe to re-run.
-- =============================================================================

create table if not exists public.homepage_hero_slides (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(title) between 1 and 120),
  subtitle           text check (char_length(subtitle) <= 300),
  image_url          text,                       -- public URL (desktop)
  image_path         text,                       -- storage object path (desktop)
  mobile_image_url   text,
  mobile_image_path  text,
  image_alt          text check (char_length(image_alt) <= 200),
  offer_badge        text check (char_length(offer_badge) <= 30),
  button_text        text check (char_length(button_text) <= 40),
  button_url         text,
  text_alignment     text not null default 'center'
                     check (text_alignment in ('left','center','right')),
  text_position      text not null default 'middle'
                     check (text_position in ('top','middle','bottom')),
  overlay_opacity    smallint not null default 40 check (overlay_opacity between 0 and 90),
  display_order      int not null default 0,
  status             text not null default 'draft'
                     check (status in ('draft','published','inactive')),
  starts_at          timestamptz,
  ends_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint hero_schedule_valid
    check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint hero_cta_pair
    check ((button_text is null) = (button_url is null)),
  constraint hero_cta_safe_url
    check (button_url is null or button_url ~ '^(/[^/]|/$|https://)'),
  constraint hero_url_path_pair
    check ((image_url is null) = (image_path is null)
       and (mobile_image_url is null) = (mobile_image_path is null)),
  constraint hero_paths_in_bucket
    check ((image_path is null or image_path like 'slides/%')
       and (mobile_image_path is null or mobile_image_path like 'slides/%')),
  constraint hero_published_complete
    check (status <> 'published' or (image_url is not null and image_alt is not null))
);

create index if not exists hero_slides_eligible_idx
  on public.homepage_hero_slides (status, display_order);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;

drop trigger if exists hero_slides_touch on public.homepage_hero_slides;
create trigger hero_slides_touch before update on public.homepage_hero_slides
  for each row execute function public.touch_updated_at();

-- Cleanup queue for storage objects whose deletion failed / is pending
create table if not exists public.storage_cleanup_queue (
  id          bigint generated always as identity primary key,
  bucket_id   text not null,
  object_path text not null,
  attempts    int  not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  unique (bucket_id, object_path)
);

-- ---------------------------------------------------------------------------
-- RLS: tables
-- ---------------------------------------------------------------------------
alter table public.homepage_hero_slides enable row level security;
alter table public.storage_cleanup_queue enable row level security;

drop policy if exists hero_public_read on public.homepage_hero_slides;
create policy hero_public_read on public.homepage_hero_slides
  for select using (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >  now())
  );

drop policy if exists hero_admin_all on public.homepage_hero_slides;
create policy hero_admin_all on public.homepage_hero_slides
  for all using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists cleanup_admin_all on public.storage_cleanup_queue;
create policy cleanup_admin_all on public.storage_cleanup_queue
  for all using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.homepage_hero_slides from anon;
grant select on public.homepage_hero_slides to anon, authenticated;
grant insert, update, delete on public.homepage_hero_slides to authenticated;
grant select, insert, update, delete on public.storage_cleanup_queue to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic Reorder RPC
-- ---------------------------------------------------------------------------
create or replace function public.reorder_hero_slides(p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_total int;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_ids is null or cardinality(p_ids) = 0 then
    raise exception 'empty id list';
  end if;

  if cardinality(p_ids) <> (select count(distinct x) from unnest(p_ids) x) then
    raise exception 'duplicate ids';
  end if;

  lock table public.homepage_hero_slides in share row exclusive mode;

  select count(*) into v_total from public.homepage_hero_slides;
  if v_total <> cardinality(p_ids)
     or exists (select 1 from unnest(p_ids) x
                where not exists (select 1 from public.homepage_hero_slides s where s.id = x)) then
    raise exception 'id list must contain every slide exactly once';
  end if;

  update public.homepage_hero_slides s
     set display_order = o.ord - 1
    from unnest(p_ids) with ordinality as o(id, ord)
   where s.id = o.id;
end;
$$;

revoke all on function public.reorder_hero_slides(uuid[]) from public, anon;
grant execute on function public.reorder_hero_slides(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket: public read, admin-only write, 5 MB, jpeg/png/webp
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hero-images', 'hero-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "hero_images_public_read"  on storage.objects;
drop policy if exists "hero_images_admin_insert" on storage.objects;
drop policy if exists "hero_images_admin_update" on storage.objects;
drop policy if exists "hero_images_admin_delete" on storage.objects;

create policy "hero_images_public_read" on storage.objects
  for select using (bucket_id = 'hero-images');

create policy "hero_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'hero-images'
    and (storage.foldername(name))[1] = 'slides'
    and (select public.is_admin())
  );

create policy "hero_images_admin_update" on storage.objects
  for update to authenticated
  using      (bucket_id = 'hero-images' and (select public.is_admin()))
  with check (bucket_id = 'hero-images' and (storage.foldername(name))[1] = 'slides'
              and (select public.is_admin()));

create policy "hero_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'hero-images' and (select public.is_admin()));
