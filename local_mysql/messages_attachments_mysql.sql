-- Add attachments JSON column to messages (MySQL)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachments JSON DEFAULT (JSON_ARRAY());

-- MySQL does not support GIN indexes; for JSON searches consider generated columns
-- and appropriate indexes depending on query patterns.

-- Add a comment for clarity
ALTER TABLE messages
  MODIFY COLUMN message TEXT COMMENT 'Message text. Attachments are in JSON attachments column.';
