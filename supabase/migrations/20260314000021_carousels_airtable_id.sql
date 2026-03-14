-- Link carousels rows to Airtable record IDs so the webhook callback
-- can update status instantly instead of waiting for polling.

ALTER TABLE public.carousels
  ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE;

-- Index for fast lookup in the status/webhook routes
CREATE INDEX IF NOT EXISTS idx_carousels_airtable_record_id
  ON public.carousels (airtable_record_id);
