-- Phase 1 / Slice 4: public anon SELECT for Prisma-owned CMS tables.
--
-- Background: Service / ServiceTier / Testimonial / FaqItem / GalleryImage are
-- created and written by Prisma via DATABASE_URL, whose role bypasses RLS.
-- The public marketing site (src/app/(site)/...) reads them through
-- supabaseAnon() in src/lib/cms/*.ts, which uses the anon key and therefore
-- respects RLS. With no anon policy these tables returned zero rows, the
-- helpers silently fell back to the hardcoded constants in src/data/*.ts,
-- and CMS edits never appeared on the live site.
--
-- The Service.active and Testimonial/FaqItem/GalleryImage.published filters
-- live in the SELECT statements in src/lib/cms/*.ts, but RLS is the
-- authoritative gate — scope the anon policies to the same conditions so
-- unpublished rows are not readable by anon under any client.

-- 1) Service ------------------------------------------------------------------
alter table public."Service" enable row level security;

do $$ begin
  create policy service_public_read on public."Service"
    for select
    using (active = true);
exception when duplicate_object then null; end $$;

-- 2) ServiceTier --------------------------------------------------------------
-- Tiers are embedded via PostgREST: select("..., tiers:ServiceTier(size, price)")
-- PostgREST evaluates ServiceTier RLS independently of the parent select, so
-- a policy is required here even though the helper filters on Service.active.
alter table public."ServiceTier" enable row level security;

do $$ begin
  create policy service_tier_public_read on public."ServiceTier"
    for select
    using (
      exists (
        select 1 from public."Service" s
        where s.id = "ServiceTier"."serviceId" and s.active = true
      )
    );
exception when duplicate_object then null; end $$;

-- 3) Testimonial --------------------------------------------------------------
alter table public."Testimonial" enable row level security;

do $$ begin
  create policy testimonial_public_read on public."Testimonial"
    for select
    using (published = true);
exception when duplicate_object then null; end $$;

-- 4) FaqItem ------------------------------------------------------------------
alter table public."FaqItem" enable row level security;

do $$ begin
  create policy faq_item_public_read on public."FaqItem"
    for select
    using (published = true);
exception when duplicate_object then null; end $$;

-- 5) GalleryImage -------------------------------------------------------------
alter table public."GalleryImage" enable row level security;

do $$ begin
  create policy gallery_image_public_read on public."GalleryImage"
    for select
    using (published = true);
exception when duplicate_object then null; end $$;
