-- Create releases table for proper release management
-- This allows grouping tracks into albums, EPs, and singles

CREATE TABLE IF NOT EXISTS releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Basic Release Info
  title TEXT NOT NULL,
  release_type TEXT CHECK (release_type IN ('Single', 'EP', 'Album')) NOT NULL DEFAULT 'Single',
  primary_artist TEXT NOT NULL,
  display_artist TEXT,
  featured_artist TEXT,
  artist_id UUID REFERENCES artists(id),
  
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_releases_user_id ON releases(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_release_date ON releases(release_date);
CREATE INDEX IF NOT EXISTS idx_releases_release_type ON releases(release_type);
CREATE INDEX IF NOT EXISTS idx_releases_artist_id ON releases(artist_id);

-- Add release_id to tracks table to link tracks to releases
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_id UUID REFERENCES releases(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tracks_release_id ON tracks(release_id);

-- Create catalog number generation function for releases
CREATE OR REPLACE FUNCTION generate_release_catalog_number()
RETURNS TEXT AS $$
DECLARE
  random_digits TEXT;
  catalog_number TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate 5 random digits
    random_digits := lpad(floor(random() * 100000)::text, 5, '0');
    catalog_number := 'REL' || random_digits;
    
    -- Check if this catalog number already exists
    SELECT COUNT(*) INTO exists_count FROM releases WHERE cat_number = catalog_number;
    
    -- If it doesn't exist, return it
    IF exists_count = 0 THEN
      RETURN catalog_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for release catalog number
CREATE OR REPLACE FUNCTION set_release_catalog_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cat_number IS NULL OR NEW.cat_number = '' THEN
    NEW.cat_number := generate_release_catalog_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for releases
DROP TRIGGER IF EXISTS trigger_set_release_catalog_number ON releases;
CREATE TRIGGER trigger_set_release_catalog_number
BEFORE INSERT ON releases
FOR EACH ROW
EXECUTE FUNCTION set_release_catalog_number();

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_releases_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_releases_updated_at ON releases;
CREATE TRIGGER update_releases_updated_at BEFORE UPDATE ON releases
    FOR EACH ROW EXECUTE FUNCTION update_releases_updated_at_column();

-- Function to update release analytics when tracks change
CREATE OR REPLACE FUNCTION update_release_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the release analytics when a track is updated
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    IF NEW.release_id IS NOT NULL THEN
      UPDATE releases SET 
        total_plays = COALESCE((SELECT SUM(plays) FROM tracks WHERE release_id = NEW.release_id), 0),
        total_revenue = COALESCE((SELECT SUM(revenue) FROM tracks WHERE release_id = NEW.release_id), 0),
        track_count = COALESCE((SELECT COUNT(*) FROM tracks WHERE release_id = NEW.release_id), 0),
        updated_at = NOW()
      WHERE id = NEW.release_id;
    END IF;
  END IF;
  
  -- Handle deletion
  IF TG_OP = 'DELETE' THEN
    IF OLD.release_id IS NOT NULL THEN
      UPDATE releases SET 
        total_plays = COALESCE((SELECT SUM(plays) FROM tracks WHERE release_id = OLD.release_id), 0),
        total_revenue = COALESCE((SELECT SUM(revenue) FROM tracks WHERE release_id = OLD.release_id), 0),
        track_count = COALESCE((SELECT COUNT(*) FROM tracks WHERE release_id = OLD.release_id), 0),
        updated_at = NOW()
      WHERE id = OLD.release_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update release analytics
DROP TRIGGER IF EXISTS trigger_update_release_analytics ON tracks;
CREATE TRIGGER trigger_update_release_analytics
AFTER INSERT OR UPDATE OR DELETE ON tracks
FOR EACH ROW
EXECUTE FUNCTION update_release_analytics();

-- Enable Row Level Security
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for releases
DROP POLICY IF EXISTS "Users can view their own releases" ON releases;
CREATE POLICY "Users can view their own releases" ON releases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own releases" ON releases;
CREATE POLICY "Users can insert their own releases" ON releases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own releases" ON releases;
CREATE POLICY "Users can update their own releases" ON releases
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own releases" ON releases;
CREATE POLICY "Users can delete their own releases" ON releases
  FOR DELETE USING (auth.uid() = user_id);

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

-- Create view for release with track details
CREATE OR REPLACE VIEW release_details AS
SELECT 
  r.*,
  COALESCE(r.total_plays, 0) as plays,
  COALESCE(r.total_revenue, 0) as revenue,
  COALESCE(r.track_count, 0) as tracks,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'id', t.id,
      'title', t.title,
      'track_number', t.track_number,
      'duration', t.duration,
      'plays', t.plays,
      'revenue', t.revenue,
      'audio_file_url', t.audio_file_url
    ) ORDER BY t.track_number
  ) FILTER (WHERE t.id IS NOT NULL) as track_list
FROM releases r
LEFT JOIN tracks t ON r.id = t.release_id
GROUP BY r.id;

-- Migrate existing tracks to releases
-- This creates releases from existing track data
INSERT INTO releases (
  user_id,
  title,
  release_type,
  primary_artist,
  display_artist,
  featured_artist,
  artist_id,
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
SELECT DISTINCT
  user_id,
  COALESCE(release_title, title) as title,
  CASE 
    WHEN release_type = 'single' THEN 'Single'
    WHEN release_type = 'release' THEN 'Album'
    ELSE COALESCE(release_type, 'Single')
  END as release_type,
  COALESCE(primary_artist, artist) as primary_artist,
  display_artist,
  featured_artist,
  artist_id,
  label,
  COALESCE(main_genre, genre) as main_genre,
  sub_genre,
  upc,
  release_date::date,
  original_release_date::date,
  countries,
  COALESCE(is_worldwide, false),
  platforms,
  description,
  copyrights,
  release_notes,
  artwork_url,
  artwork_name,
  retailers,
  exclusive_for,
  COALESCE(allow_preorder_itunes, false),
  status,
  created_at,
  updated_at
FROM tracks
WHERE release_title IS NOT NULL OR title IS NOT NULL
ON CONFLICT (cat_number) DO NOTHING;

-- Link existing tracks to their releases
UPDATE tracks SET release_id = (
  SELECT r.id 
  FROM releases r 
  WHERE r.user_id = tracks.user_id 
    AND r.title = COALESCE(tracks.release_title, tracks.title)
    AND r.primary_artist = COALESCE(tracks.primary_artist, tracks.artist)
    AND r.release_date = tracks.release_date::date
  LIMIT 1
)
WHERE release_id IS NULL;

-- Update release analytics for migrated data
UPDATE releases SET 
  total_plays = COALESCE((SELECT SUM(plays) FROM tracks WHERE release_id = releases.id), 0),
  total_revenue = COALESCE((SELECT SUM(revenue) FROM tracks WHERE release_id = releases.id), 0),
  track_count = COALESCE((SELECT COUNT(*) FROM tracks WHERE release_id = releases.id), 0);
