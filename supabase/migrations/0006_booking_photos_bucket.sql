-- Phase 1 / Vercel migration: private storage bucket for customer booking photos.
--
-- The photos that customers upload with a booking request used to live in
-- @netlify/blobs ("booking-photos" store). Moving them to Supabase Storage
-- removes a Netlify-specific dependency and consolidates blob/object storage
-- with the rest of the data model.
--
-- Access goes through the service-role server client in
-- src/lib/booking-photos.ts. Authorization is enforced at the API route, not
-- at the bucket — so this bucket has no row-level policies and is not public.
-- Idempotent via on conflict.

insert into storage.buckets (id, name, public)
values ('booking-photos', 'booking-photos', false)
on conflict (id) do nothing;
