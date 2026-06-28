
-- Add attachments support to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON messages USING gin(attachments);

-- Update RLS policies to allow attachment access
DROP POLICY IF EXISTS "Users can view message attachments" ON messages;
CREATE POLICY "Users can view message attachments" ON messages
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants 
      WHERE conversation_id = messages.conversation_id
    )
  );

COMMENT ON COLUMN messages.attachments IS 'JSON array of attachment objects with id, uri, name, type, size, mimeType';
