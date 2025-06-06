-- Create artists table for comprehensive artist management
CREATE TABLE IF NOT EXISTS artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  
  -- Social Media Links
  spotify_url TEXT,
  apple_music_url TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  soundcloud_url TEXT,
  bandcamp_url TEXT,
  
  -- Professional Info
  genre TEXT,
  sub_genre TEXT,
  record_label TEXT,
  management_company TEXT,
  booking_agent TEXT,
  
  -- Status and Metadata
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_artists_genre ON artists(genre);
CREATE INDEX IF NOT EXISTS idx_artists_is_active ON artists(is_active);

-- Create artist_collaborations table for managing collaborations between users and artists
CREATE TABLE IF NOT EXISTS artist_collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  artist_id UUID REFERENCES artists(id) NOT NULL,
  role TEXT NOT NULL, -- 'owner', 'collaborator', 'featured', 'producer', etc.
  permissions TEXT[] DEFAULT '{}', -- Array of permissions like 'edit', 'view', 'distribute'
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'accepted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique collaboration per user-artist pair
  UNIQUE(user_id, artist_id)
);

-- Create indexes for collaborations
CREATE INDEX IF NOT EXISTS idx_artist_collaborations_user_id ON artist_collaborations(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_collaborations_artist_id ON artist_collaborations(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_collaborations_status ON artist_collaborations(status);

-- Add artist_id reference to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES artists(id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);

-- Enable Row Level Security
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_collaborations ENABLE ROW LEVEL SECURITY;

-- Create policies for artists table
DROP POLICY IF EXISTS "Users can view artists they own or collaborate with" ON artists;
CREATE POLICY "Users can view artists they own or collaborate with" ON artists
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM artist_collaborations 
      WHERE artist_collaborations.artist_id = artists.id 
      AND artist_collaborations.user_id = auth.uid()
      AND artist_collaborations.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own artists" ON artists;
CREATE POLICY "Users can insert their own artists" ON artists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update artists they own" ON artists;
CREATE POLICY "Users can update artists they own" ON artists
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM artist_collaborations 
      WHERE artist_collaborations.artist_id = artists.id 
      AND artist_collaborations.user_id = auth.uid()
      AND artist_collaborations.status = 'accepted'
      AND 'edit' = ANY(artist_collaborations.permissions)
    )
  );

DROP POLICY IF EXISTS "Users can delete their own artists" ON artists;
CREATE POLICY "Users can delete their own artists" ON artists
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for artist_collaborations table
DROP POLICY IF EXISTS "Users can view their own collaborations" ON artist_collaborations;
CREATE POLICY "Users can view their own collaborations" ON artist_collaborations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM artists 
      WHERE artists.id = artist_collaborations.artist_id 
      AND artists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage collaborations for their artists" ON artist_collaborations;
CREATE POLICY "Users can manage collaborations for their artists" ON artist_collaborations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM artists 
      WHERE artists.id = artist_collaborations.artist_id 
      AND artists.user_id = auth.uid()
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_artists_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_artists_updated_at_column();

DROP TRIGGER IF EXISTS update_artist_collaborations_updated_at ON artist_collaborations;
CREATE TRIGGER update_artist_collaborations_updated_at BEFORE UPDATE ON artist_collaborations
    FOR EACH ROW EXECUTE FUNCTION update_artists_updated_at_column();

-- Enable realtime for artists tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'artists'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE artists;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'artist_collaborations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE artist_collaborations;
  END IF;
END $$;

-- Insert some sample artists for testing (optional)
-- These will be created for the first user that runs this migration
-- You can remove this section if you don't want sample data
/*
INSERT INTO artists (user_id, name, display_name, bio, genre, spotify_url, apple_music_url) 
SELECT 
  auth.uid(),
  'Sample Artist 1',
  'Sample Artist 1',
  'A talented musician creating amazing music',
  'pop',
  'https://open.spotify.com/artist/sample1',
  'https://music.apple.com/artist/sample1'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
*/
