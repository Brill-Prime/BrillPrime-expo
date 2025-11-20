# Supabase Migration Guide - Serverless Architecture

## Overview

This app uses a **fully serverless architecture**:
- **Firebase**: Authentication and user management
- **Supabase**: Database, Edge Functions, Storage, Real-time subscriptions
- **No Express server** or separate backend

---

## Architecture Changes Made

### ✅ Removed
1. **server/** directory - Neon database configuration
2. **Express dependencies** - express, @types/express
3. **Drizzle ORM** - drizzle-orm, drizzle-kit, @neondatabase/serverless
4. **API_URL environment variable** - No longer needed

### ✅ Updated
1. **services/api.ts** - Now points to Supabase URL
2. **.env.example** - Removed Express references
3. **Architecture** - Fully serverless

---

## Supabase Setup Required

### 1. Database Tables

Ensure these tables exist in your Supabase database (run the SQL files in `supabase/` directory):

```sql
-- Core tables
- users
- merchants
- products (commodities)
- orders
- order_items
- cart_items
- transactions
- notifications
- messages
- conversations
- driver_locations
- reviews
- favorites
- privacy_settings
```

Run these SQL files in order:
1. `supabase/schema.sql` - Core schema
2. `supabase/rls-policies.sql` - Row Level Security
3. `supabase/storage-setup.sql` - Storage buckets
4. `supabase/realtime.sql` - Real-time subscriptions
5. `supabase/seed-comprehensive-data.sql` - Sample data (optional)

### 2. Edge Functions

Deploy these Edge Functions to your Supabase project:

```bash
# Existing functions
supabase/functions/cart-add/
supabase/functions/cart-get/
supabase/functions/cart-update/
supabase/functions/cart-delete/
supabase/functions/create-order/
supabase/functions/merchants-nearby/
supabase/functions/payment-process/
```

### 3. Additional Edge Functions Needed

Create these Edge Functions for full functionality:

#### Admin Functions
```typescript
// supabase/functions/admin-metrics/index.ts
// GET /functions/v1/admin-metrics
// Returns system metrics

// supabase/functions/admin-analytics/index.ts
// GET /functions/v1/admin-analytics?timeframe=week
// Returns admin analytics

// supabase/functions/admin-announcement/index.ts
// POST /functions/v1/admin-announcement
// Sends system announcements
```

#### Analytics Functions
```typescript
// supabase/functions/analytics-event/index.ts
// POST /functions/v1/analytics-event
// Tracks analytics events
```

#### Notification Functions
```typescript
// supabase/functions/notifications-unread/index.ts
// GET /functions/v1/notifications-unread
// Returns unread notification count

// supabase/functions/notification-send/index.ts
// POST /functions/v1/notification-send
// Sends notifications
```

---

## API Endpoint Mapping

### Current `/api/` Endpoints → Supabase Alternatives

#### Authentication (Firebase handles this)
```
/api/auth/* → Firebase Auth SDK
```

#### Users
```
GET  /api/users/:id → /rest/v1/users?id=eq.{id}
PUT  /api/users/:id → /rest/v1/users?id=eq.{id}
POST /api/users     → /rest/v1/users
```

#### Orders
```
GET  /api/orders           → /rest/v1/orders?user_id=eq.{userId}
GET  /api/orders/:id       → /rest/v1/orders?id=eq.{id}
POST /api/orders           → /functions/v1/create-order
PUT  /api/orders/:id       → /rest/v1/orders?id=eq.{id}
```

#### Cart
```
GET    /api/cart           → /functions/v1/cart-get
POST   /api/cart           → /functions/v1/cart-add
PUT    /api/cart/:id       → /functions/v1/cart-update
DELETE /api/cart/:id       → /functions/v1/cart-delete
DELETE /api/cart           → /functions/v1/cart-delete (all items)
```

#### Merchants
```
GET /api/merchants         → /rest/v1/merchants
GET /api/merchants/nearby  → /functions/v1/merchants-nearby
GET /api/merchants/:id     → /rest/v1/merchants?id=eq.{id}
```

#### Products
```
GET /api/products          → /rest/v1/products
GET /api/products/:id      → /rest/v1/products?id=eq.{id}
```

#### Notifications
```
GET  /api/notifications           → /rest/v1/notifications?user_id=eq.{userId}
GET  /api/notifications/unread    → /rest/v1/notifications?user_id=eq.{userId}&read=eq.false
POST /api/notifications/:id/read  → /rest/v1/notifications?id=eq.{id} (PATCH)
```

#### Payments
```
POST /api/payments/initialize → /functions/v1/payment-process
GET  /api/payments/history    → /rest/v1/transactions?user_id=eq.{userId}
```

---

## How to Use Supabase REST API

### Direct Table Access

```typescript
// GET request
const response = await apiClient.get(
  '/rest/v1/users?id=eq.123&select=*',
  {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_ANON_KEY
  }
);

// POST request
const response = await apiClient.post(
  '/rest/v1/users',
  { name: 'John', email: 'john@example.com' },
  {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_ANON_KEY
  }
);

// UPDATE request
const response = await apiClient.put(
  '/rest/v1/users?id=eq.123',
  { name: 'John Updated' },
  {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_ANON_KEY
  }
);

// DELETE request
const response = await apiClient.delete(
  '/rest/v1/users?id=eq.123',
  {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_ANON_KEY
  }
);
```

### Edge Functions

```typescript
// Call Edge Function
const response = await apiClient.post(
  '/functions/v1/create-order',
  { items: [...], deliveryAddress: '...' },
  {
    'Authorization': `Bearer ${token}`
  }
);
```

---

## Environment Variables

Update your `.env` file:

```bash
# Supabase (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Firebase (REQUIRED)
EXPO_PUBLIC_FIREBASE_API_KEY="your-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
EXPO_PUBLIC_FIREBASE_APP_ID="1:123:web:abc"

# Google Maps (REQUIRED for native maps)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# Optional
EXPO_PUBLIC_API_TIMEOUT="30000"
```

---

## Supabase Dashboard Setup

### 1. Enable Real-time

Go to Database → Replication → Enable real-time for these tables:
- `messages`
- `notifications`
- `driver_locations`
- `orders`

### 2. Storage Buckets

Create these storage buckets:
- `product-images` - Public
- `profile-pictures` - Public
- `kyc-documents` - Private
- `receipts` - Private

### 3. Row Level Security (RLS)

Enable RLS on all tables and apply policies from `supabase/rls-policies.sql`

### 4. API Settings

- Enable **Auto API documentation**
- Set **JWT expiry** to 3600 seconds (1 hour)
- Enable **Email confirmations** (optional)

---

## Testing the Setup

### 1. Test Supabase Connection

```typescript
import { supabase } from './config/supabase';

// Test query
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1);

console.log('Supabase connection:', error ? 'Failed' : 'Success');
```

### 2. Test Edge Function

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/cart-get' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

### 3. Test Real-time

```typescript
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'notifications' },
    (payload) => console.log('New notification:', payload)
  )
  .subscribe();
```

---

## Migration Checklist

- [x] Remove Express server code
- [x] Remove Neon/Drizzle dependencies
- [x] Update API client to use Supabase URL
- [x] Update .env.example
- [ ] Deploy all Edge Functions to Supabase
- [ ] Run SQL migration scripts
- [ ] Enable RLS policies
- [ ] Create storage buckets
- [ ] Enable real-time on required tables
- [ ] Update environment variables
- [ ] Test all API endpoints
- [ ] Verify authentication flow
- [ ] Test real-time features

---

## Deployment Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy Edge Functions
supabase functions deploy cart-add
supabase functions deploy cart-get
supabase functions deploy cart-update
supabase functions deploy cart-delete
supabase functions deploy create-order
supabase functions deploy merchants-nearby
supabase functions deploy payment-process

# Run migrations
supabase db push

# Check status
supabase status
```

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs
2. Verify RLS policies are correct
3. Ensure JWT tokens are valid
4. Check Edge Function logs
5. Verify environment variables are set

---

**Architecture:** Firebase Auth + Supabase Serverless Backend  
**Status:** ✅ Server code removed, ready for Supabase deployment
