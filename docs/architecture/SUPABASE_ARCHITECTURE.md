# Supabase + Firebase Architecture

## Overview

This application uses a hybrid authentication and backend architecture:

- **Firebase**: Authentication only (email/password, social logins)
- **Supabase**: All backend logic (database, edge functions, realtime features)
- **Data Sync**: User data is synchronized between Firebase and Supabase

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │
│  (React Native) │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│   Firebase   │  │   Supabase   │
│   (Auth)     │  │  (Backend)   │
│              │  │              │
│ • Email/Pass │  │ • Database   │
│ • Google     │  │ • Edge Funcs │
│ • Facebook   │  │ • Realtime   │
│ • Apple      │  │ • Storage    │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
         (Data Sync)
```

## How It Works

### 1. User Sign Up Flow

1. User submits signup form
2. **Firebase** creates auth account
3. Firebase returns UID and token
4. App stores auth data locally
5. **Supabase** receives user data via REST API
6. Supabase creates user record in database
7. Data is synced between both services

**Code**: See `services/authService.ts` lines 63-125

### 2. User Sign In Flow

1. User submits login credentials
2. **Firebase** validates credentials
3. Firebase returns token
4. App uses Firebase UID to fetch user data from **Supabase**
5. User profile loaded from Supabase database

**Code**: See `services/authService.ts` lines 150-200

### 3. Backend Operations

All backend operations (merchants, orders, notifications, etc.) use **Supabase**:

- REST API: `/rest/v1/...`
- Edge Functions: `/functions/v1/...`
- Realtime: Supabase client subscriptions

**Code**: See `services/api.ts` and `config/supabase.ts`

## Environment Variables

### Required

```bash
# Firebase (Authentication Only)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Supabase (Backend Operations)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

### 1. Database Schema

Create the following tables in Supabase:

```sql
-- Users table (synced from Firebase)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  phone_number TEXT,
  profile_image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchants table
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  business_name TEXT NOT NULL,
  location GEOGRAPHY(POINT),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  merchant_id UUID REFERENCES merchants(id),
  status TEXT NOT NULL,
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add more tables as needed...
```

### 2. Row Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid()::text = firebase_uid);

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid()::text = firebase_uid);
```

### 3. Edge Functions

Create edge functions for complex business logic:

```typescript
// supabase/functions/create-order/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const { order } = await req.json()
  
  // Business logic here
  const { data, error } = await supabaseClient
    .from('orders')
    .insert(order)
    .select()

  return new Response(
    JSON.stringify({ data, error }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

Deploy edge functions:
```bash
supabase functions deploy create-order
```

### 4. Realtime Subscriptions

Enable realtime for tables that need live updates:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE merchants;
```

## Client Implementation

### Using Supabase Client

```typescript
import { supabase } from '../config/supabase';

// Query data
const { data, error } = await supabase
  .from('merchants')
  .select('*')
  .eq('user_id', userId);

// Subscribe to realtime changes
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order updated:', payload);
    }
  )
  .subscribe();
```

### Using Edge Functions

```typescript
import { apiClient } from '../services/api';

// Call edge function
const response = await apiClient.post(
  '/functions/v1/create-order',
  { items, totalAmount },
  { Authorization: `Bearer ${firebaseToken}` }
);
```

## Data Synchronization

### Firebase to Supabase

When a user signs up or updates their profile in Firebase:

1. Firebase auth completes
2. Get Firebase UID and token
3. Send data to Supabase via REST API
4. Supabase stores user record with `firebase_uid` reference

**Code**: See `services/authService.ts` line 102-119

### Realtime Updates

Use Supabase realtime for live data:

- Order status changes
- Merchant updates
- Chat messages
- Notifications

## Benefits

1. **Security**: Firebase handles complex auth flows (OAuth, etc.)
2. **Scalability**: Supabase provides PostgreSQL with realtime features
3. **Cost**: Both have generous free tiers
4. **Flexibility**: Use Supabase edge functions for custom logic
5. **Real-time**: Built-in realtime subscriptions
6. **Data Sync**: Best of both platforms

## Migration Path

If you have existing backend at `api.brillprime.com`:

1. Create Supabase tables matching your data schema
2. Migrate data from old backend to Supabase
3. Replace API calls with Supabase queries
4. Deploy edge functions for complex logic
5. Test thoroughly before switching production

## Troubleshooting

### "No API key found in request"
- Check `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set
- Verify API client includes `apikey` header

### Firebase UID not matching
- Ensure `firebase_uid` field exists in Supabase users table
- Check sync logic in authService.ts

### Realtime not working
- Enable realtime on tables in Supabase dashboard
- Check subscription channel names match
- Verify RLS policies allow read access

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
