
# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Save your project URL and anon key

## 2. Run Database Schema
1. Open SQL Editor in Supabase Dashboard
2. Copy contents from `apps/supabase-schema.sql`
3. Execute the SQL to create all tables, indexes, and RLS policies

## 3. Enable Realtime
1. Go to Database > Replication in Supabase Dashboard
2. Enable realtime for these tables:
   - orders
   - order_tracking
   - driver_locations
   - notifications
   - messages
   - cart_items

## 4. Set Up Storage Buckets
Create these storage buckets in Supabase Storage:
- `profiles` - For user profile images
- `kyc-documents` - For KYC verification documents
- `merchant-logos` - For merchant logos
- `product-images` - For commodity/product images

## 5. Configure RLS Policies
The schema already includes RLS policies. Verify they are enabled in:
Database > Policies

## 6. Environment Variables
Add to Replit Secrets:
- `EXPO_PUBLIC_SUPABASE_URL` - Your project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your anon/public key

## 7. Test Connection
Run the app and check console for:
✅ Supabase Realtime initialized (Firebase Auth)
