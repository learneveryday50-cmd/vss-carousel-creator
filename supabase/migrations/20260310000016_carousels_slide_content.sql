-- Add slide_content column to carousels table
-- Stores structured slide data: [{title, text}] for frontend rendering
ALTER TABLE public.carousels
  ADD COLUMN IF NOT EXISTS slide_content JSONB DEFAULT '[]';
