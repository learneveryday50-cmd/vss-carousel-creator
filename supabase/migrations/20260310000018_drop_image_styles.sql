-- Drop image_styles: remove FK from carousels, remove image_style_url from brands, drop table
ALTER TABLE public.carousels DROP COLUMN IF EXISTS image_style_id;
ALTER TABLE public.brands DROP COLUMN IF EXISTS image_style_url;
DROP TABLE IF EXISTS public.image_styles CASCADE;
