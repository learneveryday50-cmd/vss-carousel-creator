-- Remove the monthly free-tier credit reset cron job.
-- Free plan credits are now lifetime (3 credits total, no monthly refresh).
-- Pro plan credits still reset via invoice.paid Stripe webhook.
SELECT cron.unschedule('reset-free-credits-monthly');
