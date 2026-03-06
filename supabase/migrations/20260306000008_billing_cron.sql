-- Enable pg_cron extension (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: reset free-tier credits on the 1st of each month
-- SECURITY DEFINER runs with table owner privileges, bypassing RLS
-- Idempotency guard: only resets if last_reset_at is NOT in the current calendar month
CREATE OR REPLACE FUNCTION public.reset_free_tier_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.usage_tracking
  SET
    credits_remaining = credits_limit,
    last_reset_at = NOW(),
    updated_at = NOW()
  WHERE
    plan = 'free'
    AND date_trunc('month', last_reset_at) < date_trunc('month', NOW());
END;
$$;

-- Schedule: 00:00 UTC on the 1st of every month
-- cron.schedule is idempotent on the job name — safe to run multiple times
SELECT cron.schedule(
  'reset-free-credits-monthly',
  '0 0 1 * *',
  'SELECT public.reset_free_tier_credits()'
);
