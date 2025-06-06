-- Add audio preview enhancements to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audio_preview_url TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audio_duration INTEGER;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audio_waveform_data JSONB;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audio_metadata JSONB;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_audio_preview ON tracks(audio_preview_url) WHERE audio_preview_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracks_duration ON tracks(audio_duration) WHERE audio_duration IS NOT NULL;

-- Add audio preview enhancements to releases table
ALTER TABLE releases ADD COLUMN IF NOT EXISTS preview_track_id UUID REFERENCES tracks(id);
ALTER TABLE releases ADD COLUMN IF NOT EXISTS audio_preview_enabled BOOLEAN DEFAULT true;

-- Enable realtime for enhanced audio features (conditionally)
DO $
BEGIN
    -- Add tracks table to realtime publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tracks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE tracks;
    END IF;
    
    -- Add releases table to realtime publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'releases'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE releases;
    END IF;
END $;

-- Add comments for documentation
COMMENT ON COLUMN tracks.audio_preview_url IS 'URL for 30-second audio preview';
COMMENT ON COLUMN tracks.audio_duration IS 'Track duration in seconds';
COMMENT ON COLUMN tracks.audio_waveform_data IS 'JSON data for audio waveform visualization';
COMMENT ON COLUMN tracks.audio_metadata IS 'Additional audio metadata (bitrate, format, etc.)';
COMMENT ON COLUMN releases.preview_track_id IS 'ID of the track to use as preview for this release';
COMMENT ON COLUMN releases.audio_preview_enabled IS 'Whether audio preview is enabled for this release';
