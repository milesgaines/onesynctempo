-- Fix releases table schema issues
-- This migration addresses the missing releases problem

-- First, remove the problematic artist_id reference since artists table doesn't exist
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_artist_id_fkey;
ALTER TABLE releases ALTER COLUMN artist_id DROP NOT NULL;

-- Ensure the releases table exists with correct structure
CREATE TABLE IF NOT EXISTS releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Basic Release Info
  title TEXT NOT NULL,
  release_type TEXT CHECK (release_type IN ('Single', 'EP', 'Album')) NOT NULL DEFAULT 'Single',
  primary_artist TEXT NOT NULL,
  display_artist TEXT,
  featured_artist TEXT,
  
  -- Release Details
  label TEXT,
  cat_number TEXT UNIQUE,
  main_genre TEXT NOT NULL,
  sub_genre TEXT,
  upc TEXT,
  
  -- Distribution
  release_date DATE NOT NULL,
  original_release_date DATE,
  countries TEXT[],
  is_worldwide BOOLEAN DEFAULT FALSE,
  platforms TEXT[] DEFAULT '{}',
  
  -- Metadata
  description TEXT,
  copyrights TEXT,
  release_notes TEXT,
  artwork_url TEXT,
  artwork_name TEXT,
  
  -- Business
  retailers TEXT[],
  exclusive_for TEXT,
  allow_preorder_itunes BOOLEAN DEFAULT FALSE,
  
  -- Analytics
  total_plays BIGINT DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  track_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'pending', 'processing', 'live', 'failed', 'rejected')) DEFAULT 'draft',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_releases_user_id ON releases(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_release_date ON releases(release_date);
CREATE INDEX IF NOT EXISTS idx_releases_release_type ON releases(release_type);

-- Ensure release_id column exists in tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_id UUID REFERENCES releases(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tracks_release_id ON tracks(release_id);

-- Clear any existing problematic data and recreate releases properly
DELETE FROM releases WHERE id IN (
  SELECT r.id FROM releases r 
  LEFT JOIN tracks t ON t.release_id = r.id 
  WHERE t.id IS NULL AND r.track_count = 0
);

-- Create releases from existing tracks with better logic
INSERT INTO releases (
  user_id,
  title,
  release_type,
  primary_artist,
  display_artist,
  featured_artist,
  label,
  main_genre,
  sub_genre,
  upc,
  release_date,
  original_release_date,
  countries,
  is_worldwide,
  platforms,
  description,
  copyrights,
  release_notes,
  artwork_url,
  artwork_name,
  retailers,
  exclusive_for,
  allow_preorder_itunes,
  status,
  created_at,
  updated_at
)
SELECT DISTINCT ON (user_id, COALESCE(release_title, title), COALESCE(primary_artist, artist))
  user_id,
  COALESCE(release_title, title) as title,
  CASE 
    WHEN release_type = 'single' THEN 'Single'
    WHEN release_type = 'release' THEN 'Album'
    WHEN release_type = 'Single' THEN 'Single'
    WHEN release_type = 'EP' THEN 'EP'
    WHEN release_type = 'Album' THEN 'Album'
    ELSE 'Single'
  END as release_type,
  COALESCE(primary_artist, artist) as primary_artist,
  display_artist,
  featured_artist,
  label,
  COALESCE(main_genre, genre, 'Other') as main_genre,
  sub_genre,
  upc,
  COALESCE(release_date::date, CURRENT_DATE),
  original_release_date::date,
  countries,
  COALESCE(is_worldwide, false),
  COALESCE(platforms, ARRAY[]::text[]),
  description,
  copyrights,
  release_notes,
  artwork_url,
  artwork_name,
  retailers,
  exclusive_for,
  COALESCE(allow_preorder_itunes, false),
  COALESCE(status, 'pending'),
  created_at,
  updated_at
FROM tracks
WHERE (release_title IS NOT NULL OR title IS NOT NULL)
  AND (primary_artist IS NOT NULL OR artist IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM releases r 
    WHERE r.user_id = tracks.user_id 
      AND r.title = COALESCE(tracks.release_title, tracks.title)
      AND r.primary_artist = COALESCE(tracks.primary_artist, tracks.artist)
  )
ORDER BY user_id, COALESCE(release_title, title), COALESCE(primary_artist, artist), created_at;

-- Link tracks to their releases with improved matching
UPDATE tracks SET release_id = (
  SELECT r.id 
  FROM releases r 
  WHERE r.user_id = tracks.user_id 
    AND r.title = COALESCE(tracks.release_title, tracks.title)
    AND r.primary_artist = COALESCE(tracks.primary_artist, tracks.artist)
  LIMIT 1
)
WHERE release_id IS NULL
  AND (release_title IS NOT NULL OR title IS NOT NULL)
  AND (primary_artist IS NOT NULL OR artist IS NOT NULL);

-- Update release analytics
UPDATE releases SET 
  total_plays = COALESCE((SELECT SUM(plays) FROM tracks WHERE release_id = releases.id), 0),
  total_revenue = COALESCE((SELECT SUM(revenue) FROM tracks WHERE release_id = releases.id), 0),
  track_count = COALESCE((SELECT COUNT(*) FROM tracks WHERE release_id = releases.id), 0),
  artwork_url = COALESCE(
    artwork_url,
    (SELECT artwork_url FROM tracks WHERE release_id = releases.id AND artwork_url IS NOT NULL LIMIT 1)
  )
WHERE id IN (SELECT DISTINCT release_id FROM tracks WHERE release_id IS NOT NULL);

-- Remove releases with no tracks
DELETE FROM releases WHERE track_count = 0 OR id NOT IN (SELECT DISTINCT release_id FROM tracks WHERE release_id IS NOT NULL);

-- Enable realtime for releases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'releases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE releases;
  END IF;
END $$;

-- Recreate the view with better error handling
DROP VIEW IF EXISTS release_details;
CREATE OR REPLACE VIEW release_details AS
SELECT 
  r.*,
  COALESCE(r.total_plays, 0) as plays,
  COALESCE(r.total_revenue, 0) as revenue,
  COALESCE(r.track_count, 0) as tracks,
  COALESCE(
    ARRAY_AGG(
      JSON_BUILD_OBJECT(
        'id', t.id,
        'title', t.title,
        'track_number', COALESCE(t.track_number, 1),
        'duration', COALESCE(t.duration, '3:45'),
        'plays', COALESCE(t.plays, 0),
        'revenue', COALESCE(t.revenue, 0),
        'audio_file_url', t.audio_file_url
      ) ORDER BY COALESCE(t.track_number, 1)
    ) FILTER (WHERE t.id IS NOT NULL),
    ARRAY[]::json[]
  ) as track_list
FROM releases r
LEFT JOIN tracks t ON r.id = t.release_id
GROUP BY r.id;
