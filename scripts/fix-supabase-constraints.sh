
#!/bin/bash

# Fix Supabase database constraints
# This resolves real-time broadcast errors

echo "🔧 Fixing Supabase database constraints..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Apply the constraint fixes
echo "📝 Applying constraint fixes..."
supabase db push --db-url "$SUPABASE_DB_URL" --file supabase/fix-constraints.sql

if [ $? -eq 0 ]; then
    echo "✅ Constraints fixed successfully!"
    echo ""
    echo "The following fixes were applied:"
    echo "  ✓ Added unique constraint on users.firebase_uid"
    echo "  ✓ Added unique constraint on cart_items (user_id, commodity_id)"
    echo "  ✓ Added unique constraint on driver_locations.driver_id"
    echo "  ✓ Added unique constraint on notifications"
    echo "  ✓ Added performance indexes"
    echo "  ✓ Enabled real-time on key tables"
    echo ""
    echo "🎉 Your real-time broadcasts should now work without errors!"
else
    echo "❌ Failed to apply constraints. Please check your database connection."
    echo "Make sure SUPABASE_DB_URL is set in your environment variables."
fi
