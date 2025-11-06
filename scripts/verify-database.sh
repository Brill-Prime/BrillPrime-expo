
#!/bin/bash

echo "🔍 Verifying Brill Prime Database..."
echo "===================================="

# Check if Supabase URL is set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: EXPO_PUBLIC_SUPABASE_URL not set!"
    exit 1
fi

echo "✅ Supabase URL configured"
echo ""
echo "📊 Database Verification Summary:"
echo "  Run the following queries in your Supabase SQL Editor:"
echo ""
echo "-- Count Users"
echo "SELECT role, COUNT(*) as count FROM users GROUP BY role;"
echo ""
echo "-- Count Merchants"
echo "SELECT COUNT(*) as total_merchants FROM merchants;"
echo ""
echo "-- Count Products/Commodities"
echo "SELECT category, COUNT(*) as count FROM products GROUP BY category;"
echo ""
echo "-- Count Orders by Status"
echo "SELECT status, COUNT(*) as count FROM orders GROUP BY status;"
echo ""
echo "-- Active Driver Locations"
echo "SELECT COUNT(*) as active_drivers FROM driver_locations WHERE is_active = true;"
echo ""
echo "✅ Verification queries generated!"
