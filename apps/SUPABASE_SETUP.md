
# Supabase Setup Guide

## Prerequisites
- A Supabase account (https://supabase.com)
- Firebase project already configured

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - Project name: `brillprime` (or your choice)
   - Database password: (save this securely)
   - Region: Choose closest to your users

## Step 2: Get Supabase Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbG...`

## Step 3: Configure Environment Variables

Create a `.env` file in the `apps/` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Run Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Copy contents from `apps/supabase-schema.sql`
3. Run the SQL script
4. Copy contents from `apps/supabase-security-policies.sql`
5. Run the RLS policies script

## Step 5: Configure Firebase-Supabase Integration

The app automatically syncs Firebase authentication with Supabase:

1. Firebase handles all authentication
2. Firebase tokens are synced to Supabase for RLS policies
3. User data is synchronized between both systems

## Step 6: Test the Integration

Run the test script:
```bash
cd apps
npx ts-node scripts/test-supabase-connection.ts
```

## Verification

After setup, you should see in the console:
```
✅ Supabase Realtime initialized (Firebase Auth)
✅ Firebase token synced with Supabase for RLS
```

## Troubleshooting

### "Missing required Supabase configuration"
- Ensure `.env` file exists in `apps/` directory
- Verify environment variables are set correctly
- Restart the dev server after adding environment variables

### "Supabase client not initialized"
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Verify the Supabase project is active

## Security Notes

- Never commit `.env` file to git
- Use Replit Secrets for production deployment
- Anon key is safe to expose (RLS policies protect data)
- All sensitive operations require Firebase authentication
