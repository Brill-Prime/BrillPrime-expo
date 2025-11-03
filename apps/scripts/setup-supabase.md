
# Supabase Setup Guide

## Prerequisites
- Supabase account (https://supabase.com)
- Firebase project (already configured)

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Note down:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep secret!)
   - Project Reference ID

## Step 2: Update Environment Variables

Add to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Run Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `apps/supabase-schema.sql`
3. Run the SQL script
4. Verify all tables are created

## Step 4: Configure Row Level Security (RLS)

The schema already includes RLS policies. Verify in:
- Supabase Dashboard → Authentication → Policies

## Step 5: Install Supabase CLI

```bash
npm install -g supabase
```

## Step 6: Link Your Project

```bash
cd apps
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 7: Deploy Edge Functions

Deploy all edge functions:

```bash
# Deploy individual functions
supabase functions deploy process-payment --no-verify-jwt
supabase functions deploy send-notifications --no-verify-jwt
supabase functions deploy verify-kyc --no-verify-jwt
supabase functions deploy order-webhook --no-verify-jwt
supabase functions deploy analytics-aggregation --no-verify-jwt

# Or use the deployment script
chmod +x scripts/deploy-edge-functions.sh
./scripts/deploy-edge-functions.sh
```

## Step 8: Set Edge Function Secrets

```bash
supabase secrets set FIREBASE_SERVER_KEY=your_firebase_server_key
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
```

## Step 9: Enable Realtime

1. Go to Database → Replication
2. Enable replication for tables:
   - orders
   - notifications
   - cart_items
   - driver_locations
   - messages

## Step 10: Test Integration

```bash
# Test authentication
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY); console.log('Supabase connected!');"

# Test edge function
supabase functions invoke send-notifications --data '{"userId":"test","title":"Test","message":"Hello","type":"test"}'
```

## Edge Functions Overview

### process-payment
Handles payment processing with order validation and transaction recording.

**Endpoint**: `https://your-project.supabase.co/functions/v1/process-payment`

**Payload**:
```json
{
  "orderId": "uuid",
  "amount": 100.00,
  "paymentMethod": "card"
}
```

### send-notifications
Sends push notifications via Firebase and stores in database.

**Endpoint**: `https://your-project.supabase.co/functions/v1/send-notifications`

**Payload**:
```json
{
  "userId": "uuid",
  "title": "Order Update",
  "message": "Your order is ready",
  "type": "order",
  "data": {}
}
```

### verify-kyc
Integrates with KYC verification services.

**Endpoint**: `https://your-project.supabase.co/functions/v1/verify-kyc`

**Payload**:
```json
{
  "userId": "uuid",
  "documents": {
    "type": "passport",
    "number": "A1234567",
    "frontUrl": "https://...",
    "backUrl": "https://...",
    "selfieUrl": "https://..."
  }
}
```

### order-webhook
Handles order status transitions and notifications.

**Endpoint**: `https://your-project.supabase.co/functions/v1/order-webhook`

**Payload**:
```json
{
  "orderId": "uuid",
  "status": "confirmed",
  "metadata": {}
}
```

### analytics-aggregation
Generates complex analytics reports for users.

**Endpoint**: `https://your-project.supabase.co/functions/v1/analytics-aggregation`

**Payload**:
```json
{
  "userId": "uuid",
  "userRole": "merchant",
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```

## Monitoring

1. View logs: `supabase functions logs function-name`
2. Check metrics in Supabase Dashboard → Edge Functions
3. Monitor errors in Supabase Dashboard → Logs

## Security Best Practices

1. Never expose Service Role Key in client code
2. Use RLS policies for all tables
3. Validate all inputs in edge functions
4. Use HTTPS only
5. Rotate keys regularly
6. Enable 2FA on Supabase account

## Troubleshooting

### Function deployment fails
```bash
supabase functions deploy function-name --debug
```

### CORS issues
Check that corsHeaders are properly set in function code.

### Authentication errors
Verify Firebase token is being passed correctly:
```typescript
const { data } = await supabase.functions.invoke('function-name', {
  headers: {
    Authorization: `Bearer ${firebaseToken}`
  }
});
```

## Next Steps

1. Set up database backups
2. Configure monitoring alerts
3. Implement rate limiting
4. Set up staging environment
5. Enable database webhooks for critical events
