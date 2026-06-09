-- Phase 1 / Slice 2: media library + site settings.
--
-- Three things land here:
--   1. media_asset — uploaded image metadata, queried by /admin/media and
--      referenced (loosely) by GalleryImage.media_asset_id.
--   2. site_setting — key/value JSON config edited from /admin/settings and
--      read by public pages.
--   3. GalleryImage.media_asset_id — Prisma-owned column the recent media
--      management commit added to the model but never pushed to the DB.

-- 1) media_asset --------------------------------------------------------------
create table if not exists public.media_asset (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  alt text not null default '',
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.media_asset enable row level security;

do $$ begin
  create policy media_asset_staff_read on public.media_asset
    for select
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy media_asset_staff_insert on public.media_asset
    for insert
    with check (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy media_asset_staff_update on public.media_asset
    for update
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    )
    with check (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy media_asset_staff_delete on public.media_asset
    for delete
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

-- 2) site_setting -------------------------------------------------------------
create table if not exists public.site_setting (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_setting enable row level security;

-- Site settings are read by the public site (home page hero, contact info,
-- etc.), so anon read is allowed. Writes are staff-only.
do $$ begin
  create policy site_setting_public_read on public.site_setting
    for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy site_setting_staff_insert on public.site_setting
    for insert
    with check (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy site_setting_staff_update on public.site_setting
    for update
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    )
    with check (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy site_setting_staff_delete on public.site_setting
    for delete
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

-- 3) GalleryImage.media_asset_id (Prisma-owned table, snake_case via @map) ----
alter table public."GalleryImage" add column if not exists media_asset_id text;
