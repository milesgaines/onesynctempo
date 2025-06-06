-- Update the role constraint to match Artist, Label, Contributor
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('artist', 'label', 'contributor'));

-- Update any existing roles that might not match
UPDATE user_profiles SET role = 'artist' WHERE role NOT IN ('artist', 'label', 'contributor') AND role IS NOT NULL;

-- Ensure the role column allows the correct values
COMMENT ON COLUMN user_profiles.role IS 'User role: artist, label, or contributor';
