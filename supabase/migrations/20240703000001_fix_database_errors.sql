-- Fix issues with the tracks table and ensure all fields are properly defined

-- Add missing columns that are referenced in the MusicUploader but don't exist
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS lyricist TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS composer TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS album TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audio_file_urls TEXT[];
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS artwork_name TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS countries TEXT[];
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_worldwide BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS original_release_date DATE;

-- Now that columns exist, remove any NOT NULL constraints from lyricist and composer if they exist
ALTER TABLE tracks ALTER COLUMN lyricist DROP NOT NULL;
ALTER TABLE tracks ALTER COLUMN composer DROP NOT NULL;

-- Fix the status check constraint to include all possible statuses
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_status_check;
ALTER TABLE tracks ADD CONSTRAINT tracks_status_check 
  CHECK (status IN ('draft', 'pending', 'processing', 'live', 'failed', 'rejected'));

-- Create the catalog number generation functions if they don't exist
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

-- Create a trigger function to automatically generate catalog number if not provided
CREATE OR REPLACE FUNCTION set_catalog_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cat_number IS NULL OR NEW.cat_number = '' THEN
    NEW.cat_number := generate_catalog_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the catalog number trigger is properly set up
DROP TRIGGER IF EXISTS trigger_set_catalog_number ON tracks;
CREATE TRIGGER trigger_set_catalog_number
BEFORE INSERT ON tracks
FOR EACH ROW
EXECUTE FUNCTION set_catalog_number();

-- Enable realtime for tracks table (already enabled, skipping)
-- ALTER PUBLICATION supabase_realtime ADD TABLE tracks;