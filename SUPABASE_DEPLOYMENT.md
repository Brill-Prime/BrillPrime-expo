
# Supabase Deployment Guide

## Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase project created at https://supabase.com

## Step 1: Initialize Supabase Project
```bash
supabase init
```

## Step 2: Link to Your Supabase Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 3: Apply Database Schema
```bash
supabase db push
```

Or manually run the SQL files in your Supabase dashboard:
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Click "Run"
4. Repeat for `supabase/rls-policies.sql`
5. Repeat for `supabase/realtime.sql`

## Step 4: Deploy Edge Functions
```bash
# Deploy create-order function
supabase functions deploy create-order

# Deploy other functions as needed
```

## Step 5: Set Environment Variables
In your Supabase dashboard, go to Settings > Edge Functions and add:
- Any third-party API keys
- Payment gateway credentials
- Email service credentials

## Step 6: Test Your Setup
1. Use the Supabase SQL Editor to verify tables exist
2. Check RLS policies are active in Table Editor
3. Test edge functions using the Functions tab
4. Verify realtime is working in the Realtime Inspector

## Step 7: Update Frontend Environment Variables
Make sure your `.env` or Replit Secrets has:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Common Issues

### Issue: RLS blocking all queries
**Solution**: Make sure you're passing the Firebase JWT token in the Authorization header

### Issue: Realtime not working
**Solution**: Verify the table is added to the realtime publication

### Issue: Edge function timeout
**Solution**: Check Supabase logs and optimize your function code

## Next Steps
1. Set up Supabase Storage for file uploads
2. Configure email templates
3. Set up database backups
4. Monitor usage in Supabase dashboard
