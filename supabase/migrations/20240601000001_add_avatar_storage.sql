-- Create artwork bucket if it doesn't exist (this is where avatars will be stored)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artwork', 'artwork', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artwork' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow public access to view avatars
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'artwork');