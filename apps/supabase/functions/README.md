
# Supabase Edge Functions

This directory contains Supabase Edge Functions for custom backend logic.

## Setup

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

## Creating a New Function

```bash
supabase functions new function-name
```

## Deploying Functions

```bash
supabase functions deploy function-name
```

## Environment Variables

Set secrets for your functions:
```bash
supabase secrets set SECRET_NAME=value
```

## Available Functions

### 1. process-payment
Handles payment processing with order validation and transaction recording.
- Validates payment details
- Updates order status
- Creates transaction records
- Integrates with payment gateways (Stripe, Paystack, Flutterwave)

### 2. send-notifications
Sends push notifications via Firebase Cloud Messaging and stores in database.
- Stores notification in database
- Retrieves user's FCM token
- Sends push notification to user's device
- Handles notification delivery errors

### 3. verify-kyc
Integrates with third-party KYC verification services.
- Validates document uploads
- Updates KYC verification status
- Stores verification results
- Can integrate with ID verification APIs

### 4. order-webhook
Handles order state transitions and automatic notifications.
- Updates order status
- Sends notifications to user, merchant, and driver
- Triggers workflow automation
- Handles order lifecycle events

### 5. analytics-aggregation
Generates complex analytics reports for different user roles.
- Merchant analytics (revenue, orders, completion rate)
- Driver analytics (deliveries, earnings, performance)
- Consumer analytics (spending, order history)
- Customizable date ranges

## Testing Locally

```bash
supabase functions serve function-name
```

## Invoke from Client

```typescript
import { supabase } from '../config/supabase';

const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* your data */ }
});
```
