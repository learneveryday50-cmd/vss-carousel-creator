-- Rename "Comic Strip Storyboard" to "Cosmic Trip" to match product spec
UPDATE public.image_styles
SET name = 'Cosmic Trip'
WHERE name = 'Comic Strip Storyboard' AND user_id IS NULL;
