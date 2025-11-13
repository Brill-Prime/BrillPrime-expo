
-- Add attachments column to messages table for storing image/document metadata
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Create index for faster queries on messages with attachments
CREATE INDEX IF NOT EXISTS idx_messages_attachments 
ON messages USING GIN (attachments) 
WHERE attachments IS NOT NULL;

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload attachments
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Allow users to read attachments
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = owner);
