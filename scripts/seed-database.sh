
#!/bin/bash

# Seed Database Script for Brill Prime
# This script populates the Supabase database with comprehensive test data

set -e  # Exit on error

echo "🌱 Starting database seeding..."

# Check if SUPABASE_URL and SUPABASE_ANON_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set"
    echo "Please add them to your Replit Secrets"
    exit 1
fi

echo "✅ Environment variables found"

# Run the seed SQL file
echo "📊 Seeding database with comprehensive test data..."

psql "$SUPABASE_URL" <<EOF
$(cat supabase/seed-comprehensive-data.sql)
EOF

echo "✅ Database seeded successfully!"
echo ""
echo "📋 Test Data Summary:"
echo "  - 10 Consumers"
echo "  - 5 Merchants (with real Abuja locations)"
echo "  - 5 Drivers"
echo "  - 50+ Commodities (fuel, groceries, food)"
echo "  - 5 Sample Orders (various statuses)"
echo "  - 5 Driver Locations (for real-time tracking)"
echo "  - 4 Cart Items"
echo ""
echo "🎉 You can now test the app with real data!"
