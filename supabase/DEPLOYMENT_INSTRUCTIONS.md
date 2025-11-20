# Supabase Deployment Instructions

## Prerequisites

1. Supabase account and project created
2. Supabase CLI installed: `npm install -g supabase`
3. Environment variables configured

---

## Step 1: Setup Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project (get project-ref from Supabase dashboard URL)
supabase link --project-ref your-project-ref
```

---

## Step 2: Run Database Migrations

Run these SQL files in your Supabase SQL Editor (in order):

### Core Schema
```sql
-- 1. Run schema.sql
-- Creates core tables: users, merchants, products, orders, etc.
```

### Missing Tables
```sql
-- 2. Run missing-tables.sql
-- Creates: drivers, delivery_zones, order_locations
```

### Additional Features
```sql
-- 3. Run cart-items-table.sql
-- Creates cart_items table

-- 4. Run driver-locations.sql
-- Creates driver_locations table for real-time tracking

-- 5. Run privacy-settings.sql
-- Creates user_privacy_settings table

-- 6. Run reviews-enhancements.sql
-- Creates reviews and related tables

-- 7. Run transactions.sql
-- Creates payment and transaction tables

-- 8. Run rls-policies.sql
-- Applies Row Level Security policies

-- 9. Run realtime.sql
-- Enables real-time subscriptions

-- 10. Run storage-setup.sql
-- Creates storage buckets
```

### Sample Data (Optional)
```sql
-- 11. Run seed-comprehensive-data.sql
-- Populates database with test data
```

---

## Step 3: Deploy Edge Functions

```bash
# Deploy all Edge Functions
cd supabase/functions

# Cart functions
supabase functions deploy cart-get
supabase functions deploy cart-add
supabase functions deploy cart-update
supabase functions deploy cart-delete

# Order functions
supabase functions deploy create-order

# Merchant functions
supabase functions deploy merchants-nearby

# Payment functions
supabase functions deploy payment-process
```

---

## Step 4: Configure Storage

### Create Storage Buckets

In Supabase Dashboard → Storage:

1. **product-images** (Public)
   - Max file size: 5MB
   - Allowed MIME types: image/*

2. **profile-pictures** (Public)
   - Max file size: 2MB
   - Allowed MIME types: image/*

3. **kyc-documents** (Private)
   - Max file size: 10MB
   - Allowed MIME types: image/*, application/pdf

4. **receipts** (Private)
   - Max file size: 5MB
   - Allowed MIME types: image/*, application/pdf

5. **attachments** (Public)
   - Max file size: 10MB
   - Allowed MIME types: image/*, video/*, application/pdf

---

## Step 5: Enable Real-time

In Supabase Dashboard → Database → Replication:

Enable real-time for these tables:
- ✅ messages
- ✅ notifications
- ✅ driver_locations
- ✅ order_locations
- ✅ orders

---

## Step 6: Configure Authentication

In Supabase Dashboard → Authentication → Providers:

1. **Email** - Enable
2. **Google** - Configure (optional)
3. **Facebook** - Configure (optional)

### Email Templates

Customize email templates:
- Confirmation email
- Password reset
- Magic link

---

## Step 7: API Settings

In Supabase Dashboard → Settings → API:

1. **JWT Settings**
   - JWT expiry: 3600 seconds (1 hour)
   - Enable JWT secret rotation

2. **API Keys**
   - Copy `anon` key → EXPO_PUBLIC_SUPABASE_ANON_KEY
   - Copy `service_role` key (keep secret, for server-side only)

3. **URL**
   - Copy Project URL → EXPO_PUBLIC_SUPABASE_URL

---

## Step 8: Update Environment Variables

Update your `.env` file:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Firebase (keep existing values)
EXPO_PUBLIC_FIREBASE_API_KEY="..."
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
EXPO_PUBLIC_FIREBASE_PROJECT_ID="..."
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
EXPO_PUBLIC_FIREBASE_APP_ID="..."

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="..."
```

---

## Step 9: Test the Setup

### Test Database Connection

```typescript
import { supabase } from './config/supabase';

const testConnection = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .single();
  
  console.log('Connection:', error ? 'Failed' : 'Success');
};
```

### Test Edge Function

```bash
# Test cart-get function
curl -X POST \
  'https://your-project.supabase.co/functions/v1/cart-get' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

### Test Real-time

```typescript
const subscription = supabase
  .channel('test')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'notifications' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe();
```

---

## Step 10: Verify RLS Policies

Test that Row Level Security is working:

```typescript
// Should only return current user's data
const { data } = await supabase
  .from('orders')
  .select('*');

// Should fail without proper permissions
const { error } = await supabase
  .from('users')
  .update({ role: 'admin' })
  .eq('id', 'some-other-user-id');
```

---

## Troubleshooting

### Common Issues

1. **"relation does not exist"**
   - Run migrations in correct order
   - Check table names match exactly

2. **"permission denied"**
   - Check RLS policies
   - Verify JWT token is valid
   - Ensure user has correct role

3. **"function not found"**
   - Deploy Edge Functions
   - Check function names match

4. **Real-time not working**
   - Enable replication for tables
   - Check subscription channel names
   - Verify RLS policies allow SELECT

### Logs

Check logs in Supabase Dashboard:
- **Database** → Logs
- **Edge Functions** → Logs
- **Authentication** → Logs

---

## Maintenance

### Regular Tasks

1. **Monitor Usage**
   - Check database size
   - Monitor API requests
   - Review Edge Function invocations

2. **Backup**
   - Enable automatic backups
   - Test restore procedures

3. **Security**
   - Rotate JWT secrets periodically
   - Review RLS policies
   - Update dependencies

4. **Performance**
   - Add indexes for slow queries
   - Optimize Edge Functions
   - Monitor response times

---

## Production Checklist

Before going live:

- [ ] All migrations run successfully
- [ ] All Edge Functions deployed
- [ ] Storage buckets created
- [ ] Real-time enabled
- [ ] RLS policies tested
- [ ] Environment variables set
- [ ] Authentication configured
- [ ] Email templates customized
- [ ] Backups enabled
- [ ] Monitoring set up
- [ ] Load testing completed
- [ ] Security audit done

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Discord**: https://discord.supabase.com
- **GitHub**: https://github.com/supabase/supabase

---

**Status:** Ready for deployment  
**Architecture:** Firebase Auth + Supabase Serverless Backend  
**Last Updated:** 2025-01-28
