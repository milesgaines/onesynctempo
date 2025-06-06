-- Add audio preview fields to releases and tracks tables for better audio player support

-- Add audio preview fields to releases table
ALTER TABLE releases ADD COLUMN IF NOT EXISTS preview_audio_url TEXT;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS preview_duration INTEGER; -- in seconds

-- Add audio preview fields to tracks table  
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS preview_start_time INTEGER DEFAULT 0; -- in seconds
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS preview_end_time INTEGER; -- in seconds
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS waveform_data JSONB; -- for audio visualizer

-- Create index for better performance on audio queries
CREATE INDEX IF NOT EXISTS idx_releases_preview_audio ON releases(preview_audio_url) WHERE preview_audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracks_audio_file ON tracks(audio_file_url) WHERE audio_file_url IS NOT NULL;

-- Update existing releases to use first track's audio as preview
UPDATE releases 
SET preview_audio_url = (
  SELECT t.audio_file_url 
  FROM tracks t 
  WHERE t.release_id = releases.id 
    AND t.audio_file_url IS NOT NULL 
  ORDER BY t.track_number ASC, t.created_at ASC 
  LIMIT 1
)
WHERE preview_audio_url IS NULL;

-- Function to automatically update release preview when tracks change
CREATE OR REPLACE FUNCTION update_release_preview()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the release preview when a track is updated/inserted
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    IF NEW.release_id IS NOT NULL AND NEW.audio_file_url IS NOT NULL THEN
      UPDATE releases SET 
        preview_audio_url = COALESCE(
          preview_audio_url,
          NEW.audio_file_url
        ),
        updated_at = NOW()
      WHERE id = NEW.release_id;
    END IF;
  END IF;
  
  -- Handle deletion - find new preview if current one is deleted
  IF TG_OP = 'DELETE' THEN
    IF OLD.release_id IS NOT NULL THEN
      UPDATE releases SET 
        preview_audio_url = (
          SELECT t.audio_file_url 
          FROM tracks t 
          WHERE t.release_id = OLD.release_id 
            AND t.audio_file_url IS NOT NULL 
            AND t.id != OLD.id
          ORDER BY t.track_number ASC, t.created_at ASC 
          LIMIT 1
        ),
        updated_at = NOW()
      WHERE id = OLD.release_id 
        AND preview_audio_url = OLD.audio_file_url;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update release preview
DROP TRIGGER IF EXISTS trigger_update_release_preview ON tracks;
CREATE TRIGGER trigger_update_release_preview
AFTER INSERT OR UPDATE OR DELETE ON tracks
FOR EACH ROW
EXECUTE FUNCTION update_release_preview();

-- Add comment for documentation
COMMENT ON COLUMN releases.preview_audio_url IS 'URL to audio file for release preview player';
COMMENT ON COLUMN releases.preview_duration IS 'Duration of preview audio in seconds';
COMMENT ON COLUMN tracks.preview_start_time IS 'Start time for track preview in seconds';
COMMENT ON COLUMN tracks.preview_end_time IS 'End time for track preview in seconds';
COMMENT ON COLUMN tracks.waveform_data IS 'JSON data for audio visualizer waveform';
