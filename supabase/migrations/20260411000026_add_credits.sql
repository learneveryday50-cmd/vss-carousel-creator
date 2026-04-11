-- Gumroad license key redemption: atomically add purchased credits to a user's balance.
-- SECURITY DEFINER SET search_path = '' follows the same pattern as consume_credit() —
-- this ensures RLS is bypassed and the schema is unambiguous.
--
-- Returns JSON: { success: boolean, credits_remaining: number }

CREATE OR REPLACE FUNCTION public.add_credits(p_user_id UUID, p_credits INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_new_credits INTEGER;
BEGIN
  UPDATE public.usage_tracking
  SET
    credits_remaining = credits_remaining + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits_remaining INTO v_new_credits;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'no_row');
  END IF;

  RETURN json_build_object('success', true, 'credits_remaining', v_new_credits);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_credits(UUID, INTEGER) TO service_role;
