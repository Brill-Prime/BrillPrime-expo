
#!/bin/bash

# Apply Supabase RLS Policies
# This script applies all security policies to your Supabase database

echo "🔒 Applying Supabase RLS Policies..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked to Supabase."
    echo "Please run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Apply the security policies
echo "📝 Applying security policies..."
supabase db push --file supabase-security-policies.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS policies applied successfully!"
    echo ""
    echo "🔍 Verify policies in Supabase Dashboard:"
    echo "   https://app.supabase.com/project/YOUR_PROJECT/database/policies"
else
    echo "❌ Failed to apply RLS policies"
    exit 1
fi

echo ""
echo "🎉 Security setup complete!"
echo ""
echo "Next steps:"
echo "1. Test policies with different user roles"
echo "2. Monitor unauthorized access attempts"
echo "3. Review and adjust policies as needed"
