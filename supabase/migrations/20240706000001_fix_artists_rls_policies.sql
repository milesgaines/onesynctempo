-- Fix infinite recursion in artists RLS policies
-- This migration simplifies the RLS policies to prevent circular references

-- First, disable RLS temporarily to avoid issues during policy updates
ALTER TABLE artists DISABLE ROW LEVEL SECURITY;
ALTER TABLE artist_collaborations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view artists they own or collaborate with" ON artists;
DROP POLICY IF EXISTS "Users can insert their own artists" ON artists;
DROP POLICY IF EXISTS "Users can update artists they own" ON artists;
DROP POLICY IF EXISTS "Users can delete their own artists" ON artists;
DROP POLICY IF EXISTS "Users can view their own collaborations" ON artist_collaborations;
DROP POLICY IF EXISTS "Users can manage collaborations for their artists" ON artist_collaborations;

-- Create simplified policies for artists table (no circular references)
CREATE POLICY "Users can view their own artists" ON artists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artists" ON artists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artists" ON artists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artists" ON artists
  FOR DELETE USING (auth.uid() = user_id);

-- Create simplified policies for artist_collaborations table
CREATE POLICY "Users can view collaborations they are part of" ON artist_collaborations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert collaborations for their artists" ON artist_collaborations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collaborations" ON artist_collaborations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collaborations" ON artist_collaborations
  FOR DELETE USING (auth.uid() = user_id);

-- Re-enable RLS with the new simplified policies
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_collaborations ENABLE ROW LEVEL SECURITY;

-- Add a comment explaining the change
COMMENT ON TABLE artists IS 'Artists table with simplified RLS policies to prevent infinite recursion';
COMMENT ON TABLE artist_collaborations IS 'Artist collaborations table with simplified RLS policies';
