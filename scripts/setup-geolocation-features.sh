
#!/bin/bash

echo "Setting up Geolocation Features..."

# Setup delivery zones
echo "Creating delivery zones table..."
psql $DATABASE_URL -f supabase/delivery-zones.sql

# Setup geofence promotions
echo "Creating geofence promotions table..."
psql $DATABASE_URL -f supabase/geofence-promotions.sql

# Setup heatmap tracking
echo "Creating heatmap tables..."
psql $DATABASE_URL -f supabase/heatmap-data.sql

echo "Geolocation features setup complete!"
