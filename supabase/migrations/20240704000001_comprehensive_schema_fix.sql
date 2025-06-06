-- Comprehensive schema fix for all Supabase issues
-- This migration consolidates and fixes all previous schema issues

-- First, ensure user_profiles table has all required fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_links JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS spotify_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS spotify_connected_at TIMESTAMP WITH TIME ZONE;

-- Add all missing columns to tracks table that are referenced in the code
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_title TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS primary_artist TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS display_artist TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS featured_artist TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS cat_number TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS main_genre TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS sub_genre TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_type TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS upc TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS countries TEXT[];
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_worldwide BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS copyrights TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_notes TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS original_release_date DATE;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS retailers TEXT[];
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS exclusive_for TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS allow_preorder_itunes BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS track_number INTEGER DEFAULT 1;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS track_display_artist TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS track_featured_artist TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS mix_version TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS remixer TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS track_main_genre TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS track_sub_genre TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS publisher TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS contributors TEXT[];
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS lyricist TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS composer TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS album_only BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audio_file_urls TEXT[];
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS artwork_name TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS country TEXT;

-- Fix status constraint to include all possible values
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_status_check;
ALTER TABLE tracks ADD CONSTRAINT tracks_status_check 
  CHECK (status IN ('draft', 'pending', 'processing', 'live', 'failed', 'rejected'));

-- Fix release_type constraint to include all possible values
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_release_type_check;
ALTER TABLE tracks ADD CONSTRAINT tracks_release_type_check 
  CHECK (release_type IN ('Single', 'EP', 'Album', 'single', 'release'));

-- Create catalog number generation function
CREATE OR REPLACE FUNCTION generate_catalog_number()
RETURNS TEXT AS $$
DECLARE
  random_digits TEXT;
  catalog_number TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate 5 random digits
    random_digits := lpad(floor(random() * 100000)::text, 5, '0');
    catalog_number := 'CAT' || random_digits;
    
    -- Check if this catalog number already exists
    SELECT COUNT(*) INTO exists_count FROM tracks WHERE cat_number = catalog_number;
    
    -- If it doesn't exist, return it
    IF exists_count = 0 THEN
      RETURN catalog_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for catalog number
CREATE OR REPLACE FUNCTION set_catalog_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cat_number IS NULL OR NEW.cat_number = '' THEN
    NEW.cat_number := generate_catalog_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_catalog_number ON tracks;
CREATE TRIGGER trigger_set_catalog_number
BEFORE INSERT ON tracks
FOR EACH ROW
EXECUTE FUNCTION set_catalog_number();

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('tracks', 'tracks', true),
  ('artwork', 'artwork', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Add missing storage policies
DROP POLICY IF EXISTS "Users can delete own track files" ON storage.objects;
CREATE POLICY "Users can delete own track files" ON storage.objects
  FOR DELETE USING (
    (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]) OR
    (bucket_id = 'artwork' AND auth.uid()::text = (storage.foldername(name))[1]) OR
    (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  );

-- Add missing track policies
DROP POLICY IF EXISTS "Users can delete own tracks" ON tracks;
CREATE POLICY "Users can delete own tracks" ON tracks
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for tracks table (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tracks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tracks;
  END IF;
END $$;

-- Update types to ensure compatibility
UPDATE tracks SET status = 'pending' WHERE status IS NULL;
UPDATE tracks SET track_number = 1 WHERE track_number IS NULL;
UPDATE tracks SET is_explicit = FALSE WHERE is_explicit IS NULL;
UPDATE tracks SET plays = 0 WHERE plays IS NULL;
UPDATE tracks SET revenue = 0 WHERE revenue IS NULL;
UPDATE tracks SET is_worldwide = FALSE WHERE is_worldwide IS NULL;
UPDATE tracks SET album_only = FALSE WHERE album_only IS NULL;
UPDATE tracks SET allow_preorder_itunes = FALSE WHERE allow_preorder_itunes IS NULL;

-- Ensure user_profiles has proper defaults
UPDATE user_profiles SET total_earnings = 0 WHERE total_earnings IS NULL;
UPDATE user_profiles SET available_balance = 0 WHERE available_balance IS NULL;
UPDATE user_profiles SET pending_payments = 0 WHERE pending_payments IS NULL;
UPDATE user_profiles SET spotify_connected = FALSE WHERE spotify_connected IS NULL;
