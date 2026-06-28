
#!/bin/bash

echo "Setting up chat attachments support..."

# Apply the SQL changes
npx supabase db execute --file supabase/messages-attachments.sql

echo "Chat attachments support configured successfully!"
echo "Run this script to enable image sharing in conversations."
