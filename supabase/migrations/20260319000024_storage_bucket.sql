-- Create Supabase Storage bucket for carousel slides (STORE-01)
-- Public bucket: anyone can read, service role writes via admin client (no INSERT policy needed)

INSERT INTO storage.buckets (id, name, public)
VALUES ('carousel-slides', 'carousel-slides', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on all objects in this bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read carousel slides'
  ) THEN
    CREATE POLICY "Public read carousel slides"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'carousel-slides');
  END IF;
END $$;
