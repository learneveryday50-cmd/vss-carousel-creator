-- Refill credits for all existing users to 10
UPDATE usage_tracking
SET
  credits_remaining = 10,
  credits_limit     = 10,
  updated_at        = now()
WHERE credits_remaining < 10;

-- Also ensure any user who has no row yet gets one when they next sign in
-- (handled by the existing trigger — this just fixes current rows)
