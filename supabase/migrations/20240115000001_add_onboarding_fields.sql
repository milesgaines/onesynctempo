-- Add onboarding fields to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_type TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS artist_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS genre_preferences TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goals TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS collaboration_interests TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_platforms TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS monthly_release_goal INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS has_existing_catalog BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS marketing_budget_range TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS team_size INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS primary_market TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to have onboarding_completed = false if not set
UPDATE user_profiles SET onboarding_completed = FALSE WHERE onboarding_completed IS NULL;
UPDATE user_profiles SET onboarding_step = 0 WHERE onboarding_step IS NULL;
UPDATE user_profiles SET has_existing_catalog = FALSE WHERE has_existing_catalog IS NULL;

-- Add constraint for experience_level
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_experience_level_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_experience_level_check 
  CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional'));

-- Add constraint for company_type
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_company_type_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_company_type_check 
  CHECK (company_type IN ('independent_label', 'major_label', 'distribution_company', 'management_company', 'publishing_company'));

-- Add constraint for marketing_budget_range
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_marketing_budget_range_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_marketing_budget_range_check 
  CHECK (marketing_budget_range IN ('under_500', '500_2000', '2000_5000', '5000_10000', 'over_10000'));

-- Add constraint for primary_market
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_primary_market_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_primary_market_check 
  CHECK (primary_market IN ('north_america', 'europe', 'asia_pacific', 'latin_america', 'africa', 'middle_east', 'global'));

-- Enable realtime for user_profiles if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
  END IF;
END $$;
