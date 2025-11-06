
#!/bin/bash

echo "🚀 Setting up Brill Prime Database..."
echo "======================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check environment variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Supabase environment variables not set!"
    echo "Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Secrets"
    exit 1
fi

echo "✅ Environment variables configured"

# Run migrations
echo ""
echo "📦 Running database migrations..."
supabase db push

# Run seed data
echo ""
echo "🌱 Seeding database with sample data..."
psql $EXPO_PUBLIC_SUPABASE_URL -f supabase/seed-data.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 Database Summary:"
echo "  - 8 Users (3 consumers, 3 merchants, 3 drivers)"
echo "  - 5 Merchants with locations"
echo "  - 15 Products across categories"
echo "  - 4 Sample orders"
echo "  - 3 Active driver locations"
echo ""
echo "🧪 Next steps:"
echo "  1. Test API endpoints: npm run test:api"
echo "  2. Start the app: npm run web"
echo ""
