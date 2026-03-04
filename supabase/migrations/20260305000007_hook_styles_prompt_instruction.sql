-- Add prompt instruction column for AI generator use
ALTER TABLE public.hook_styles
  ADD COLUMN IF NOT EXISTS prompt_instruction TEXT;

-- Backfill built-in hook styles
UPDATE public.hook_styles SET prompt_instruction = 'Write a contrarian hook that challenges a common belief.'
  WHERE name = 'Contrarian';

UPDATE public.hook_styles SET prompt_instruction = 'Write a hook using a surprising statistic.'
  WHERE name = 'Statistic';

UPDATE public.hook_styles SET prompt_instruction = 'Write a curiosity gap hook that makes readers want to swipe.'
  WHERE name = 'Curiosity';

UPDATE public.hook_styles SET prompt_instruction = 'Write a hook introducing common mistakes people make.'
  WHERE name = 'Mistake';

UPDATE public.hook_styles SET prompt_instruction = 'Write a bold controversial opinion that grabs attention.'
  WHERE name = 'Hot Take';
