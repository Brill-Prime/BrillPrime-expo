
#!/bin/bash

# Seed Database Script
# This script populates the Supabase database with comprehensive test data

set -e

echo "🌱 Starting database seeding..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Check if SUPABASE_URL and SUPABASE_SERVICE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Missing required environment variables"
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file"
    exit 1
fi

echo "📝 Loading environment variables..."
source .env 2>/dev/null || true

echo "🔗 Connecting to Supabase..."

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).*/\1/p')

echo "📊 Executing seed script..."

# Execute the seed file using psql connection string
PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
  "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres" \
  -f supabase/seed-comprehensive-data.sql

echo "✅ Database seeding completed successfully!"
echo ""
echo "📈 Summary:"
echo "  • 3 test consumers created"
echo "  • 10 merchants with locations across Nigeria"
echo "  • 5 active drivers"
echo "  • 30+ commodities across various categories"
echo "  • 7 sample orders (pending, in-progress, delivered)"
echo "  • Reviews, transactions, and notifications"
echo ""
echo "🎯 You can now test the app with realistic data!"
