-- Phase 05-generation-dashboard / Plan 01
-- Atomic credit check + deduction for carousel generation.
-- Called from /api/generate route via admin.rpc('consume_credit', { p_user_id: user.id }).
-- SECURITY DEFINER bypasses RLS on usage_tracking (service-role-only writes, consistent
-- with reset_free_tier_credits() pattern in 20260306000008_billing_cron.sql).
--
-- v1 behavior: credit is deducted at job creation time before n8n fires.
-- If n8n subsequently fails, the credit is already spent. This is the accepted v1 design —
-- credit refund on failure is a v2 concern and is not in scope for Phase 5.

CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- FOR UPDATE locks the row to prevent concurrent double-deductions
  SELECT credits_remaining INTO v_remaining
  FROM public.usage_tracking
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- No row found or zero credits
  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    RETURN json_build_object('success', false, 'remaining', COALESCE(v_remaining, 0));
  END IF;

  UPDATE public.usage_tracking
  SET
    credits_remaining = credits_remaining - 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'remaining', v_remaining - 1);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant to authenticated so the API route can call via .rpc() with either
-- user client (createClient) or admin client (createAdminClient)
GRANT EXECUTE ON FUNCTION public.consume_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credit(UUID) TO service_role;
