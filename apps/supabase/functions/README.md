
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

- **process-payment**: Handle payment processing with validation
- **send-notifications**: Send Firebase push notifications on database events
- **verify-kyc**: Integrate with third-party KYC verification services
- **order-webhook**: Handle order state transitions and notifications
- **analytics-aggregation**: Generate complex analytics reports

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
