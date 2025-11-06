-- Supabase Storage Setup for Product Images
-- Run this in your Supabase SQL Editor to create the storage bucket

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product images bucket

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = owner);

-- Allow authenticated users to delete their own uploads  
CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = owner);

-- Allow anyone to view product images (public read)
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Alternative: If you prefer to manually create the bucket via Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name it "product-images"
-- 4. Enable "Public bucket"
-- 5. Set file size limit to 5MB
-- 6. Set allowed MIME types to: image/jpeg, image/png, image/jpg, image/webp
-- 7. Then run only the policy creation SQL above
