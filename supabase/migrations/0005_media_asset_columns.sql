-- Phase 1 / Slice 5: media_asset columns to match what /api/media/finalize writes.
--
-- The finalize route at src/app/api/media/finalize/route.ts already inserts
-- `mime` and `blur_data_url` alongside path/width/height, but the original
-- table from 0002_media_settings.sql only declared path/alt/width/height/
-- created_at/deleted_at. Without these columns the insert fails and every
-- upload is rejected at the finalize step.
--
-- Both columns are nullable so existing rows are unaffected. Idempotent via
-- `if not exists` so the migration can be re-run safely.

alter table public.media_asset
  add column if not exists mime text,
  add column if not exists blur_data_url text;
