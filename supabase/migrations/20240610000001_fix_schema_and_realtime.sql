-- Enable realtime for tracks table to ensure updates are reflected in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;

-- Add missing draft status to tracks table status check constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_status_check;
ALTER TABLE tracks ADD CONSTRAINT tracks_status_check 
  CHECK (status IN ('draft', 'pending', 'processing', 'live', 'failed'));

-- Add missing delete policies for tracks and storage
CREATE POLICY "Users can delete own tracks" ON tracks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own track files" ON storage.objects
  FOR DELETE USING (
    (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]) OR
    (bucket_id = 'artwork' AND auth.uid()::text = (storage.foldername(name))[1])
  );

-- Ensure storage buckets exist and are properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('tracks', 'tracks', true),
  ('artwork', 'artwork', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Add duration field to tracks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tracks' AND column_name = 'duration'
  ) THEN
    ALTER TABLE tracks ADD COLUMN duration TEXT;
  END IF;
END $$;