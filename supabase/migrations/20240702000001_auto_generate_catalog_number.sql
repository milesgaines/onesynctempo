-- Remove NOT NULL constraint from cat_number column
ALTER TABLE tracks ALTER COLUMN cat_number DROP NOT NULL;

-- Create a function to generate a unique catalog number
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

-- Create a trigger to automatically generate catalog number if not provided
CREATE OR REPLACE FUNCTION set_catalog_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cat_number IS NULL OR NEW.cat_number = '' THEN
    NEW.cat_number := generate_catalog_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the tracks table
DROP TRIGGER IF EXISTS trigger_set_catalog_number ON tracks;
CREATE TRIGGER trigger_set_catalog_number
BEFORE INSERT ON tracks
FOR EACH ROW
EXECUTE FUNCTION set_catalog_number();

-- Note: The tracks table is already part of the supabase_realtime publication, no need to add it again