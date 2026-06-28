# Supabase Commodity Management Setup Guide

This guide will help you set up the commodity management feature with Supabase storage and database integration.

## 📋 Prerequisites

Before you begin, make sure you have:
1. A Supabase account and project created
2. Your Supabase project URL and anon key configured in Replit Secrets
3. Firebase authentication already set up (for user auth)

## 🚀 Setup Steps

### Step 1: Create Supabase Storage Bucket

You need to create a storage bucket for product images. You have two options:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New Bucket"**
4. Configure the bucket:
   - **Name**: `product-images`
   - **Public bucket**: ✅ Enable (so product images are publicly accessible)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/jpg`, `image/webp`
5. Click **"Create bucket"**

#### Option B: Using SQL (Advanced)

Run the SQL file we created: `supabase/storage-setup.sql`

1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy the contents of `supabase/storage-setup.sql`
3. Click **"Run"**

### Step 2: Apply Database Schema

If you haven't already set up the database schema, you need to:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run the SQL files in this order:
   - `supabase/schema.sql` (creates all tables)
   - `supabase/rls-policies.sql` (sets up Row Level Security)
   - `supabase/realtime.sql` (enables real-time subscriptions)

### Step 3: Verify User and Merchant Data

The commodity system requires proper user and merchant records:

1. **Create a test merchant user**:
   - Sign up using the app with role: "merchant"
   - This creates a user record in the `users` table

2. **Create a merchant profile**:
   - After signing up, you need a merchant record in the `merchants` table
   - You can create this via the merchant onboarding flow in the app
   - Or manually insert via SQL:

```sql
-- Get your user ID first
SELECT id, firebase_uid, email FROM users WHERE role = 'merchant';

-- Create merchant record (replace USER_ID_HERE with actual user id)
INSERT INTO merchants (user_id, business_name, business_type, city, state, country, is_active)
VALUES (
  'USER_ID_HERE',
  'My Test Store',
  'retail',
  'Lagos',
  'Lagos',
  'Nigeria',
  true
);
```

### Step 4: Test the Commodity Flow

1. **Navigate to Merchant Dashboard**:
   - Sign in as a merchant user
   - Go to the merchant home screen

2. **Add a Commodity**:
   - Click "Manage Commodities" or "Add New Commodities"
   - Fill in the form:
     - Select a category
     - Add an image (tap the camera icon)
     - Enter commodity name
     - Add description
     - Select unit
     - Enter price
     - Set available quantity
   - Click "Save Commodity"

3. **Verify the Upload**:
   - Check the Supabase Storage bucket `product-images` for the uploaded image
   - Check the `products` table in Supabase for the new commodity record
   - The commodity should appear in your commodities list

## 🎯 Features Implemented

### ✅ Image Upload
- Upload product images to Supabase Storage
- Automatic image compression and format handling
- Supports web (drag & drop) and mobile (camera/gallery)
- 5MB file size limit
- **Safe image updates**: New images are uploaded first, old images deleted only after successful save (prevents data loss)

### ✅ Database Integration  
- Create new commodities linked to merchant
- Update existing commodities
- Automatic merchant ID association
- Proper error handling and validation
- **Rollback protection**: Failed database updates clean up uploaded images

### ✅ User Experience
- Beautiful, consistent UI matching app design
- Real-time validation feedback
- Loading states during upload
- Success/error notifications
- Form reset after successful save

### ⚠️ Not Yet Implemented
- **Specifications and Tags**: Currently collected in the form but not persisted to database
  - The `products` table doesn't have columns for specifications/tags yet
  - These fields are reserved for future enhancement
  - No data loss occurs—they're simply not saved

## 🔧 Troubleshooting

### Error: "Merchant profile not found"

**Solution**: Make sure you have a merchant record in the `merchants` table linked to your user account.

```sql
-- Check if merchant exists
SELECT * FROM merchants WHERE user_id IN (
  SELECT id FROM users WHERE firebase_uid = 'YOUR_FIREBASE_UID'
);
```

### Error: "User not found in database"

**Solution**: The user record doesn't exist in Supabase. This happens if:
1. You signed up before the Supabase sync was implemented
2. The Supabase sync failed during sign-up

**Fix**: Manually create the user record:

```sql
INSERT INTO users (firebase_uid, email, full_name, role, is_active)
VALUES (
  'YOUR_FIREBASE_UID',  -- Get this from Firebase Auth
  'your@email.com',
  'Your Name',
  'merchant',
  true
);
```

### Error: "Failed to upload image"

**Possible causes**:
1. Storage bucket doesn't exist → Create `product-images` bucket
2. Image too large → Max 5MB allowed
3. Wrong file format → Only JPEG, PNG, WebP allowed
4. No storage policies → Run the storage-setup.sql file

### Images not appearing

**Check**:
1. Bucket is marked as **public**
2. Storage policies allow public read access
3. Image URL is correctly saved in `products.image_url` field

## 📊 Database Schema Reference

### Products Table Structure

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Bucket Details

- **Name**: `product-images`
- **Path structure**: `commodities/{commodityId}_{timestamp}.jpg`
- **Public access**: Yes (images are publicly viewable)
- **Max file size**: 5MB
- **Allowed formats**: JPEG, PNG, WebP

## 🎨 UI Design Patterns

The Add Commodity screen follows these design patterns from your app:

- **Colors**:
  - Primary: `#0B1A51` (dark blue buttons)
  - Accent: `#4682B4` (light blue borders/icons)
  - Background: `#f8f9fa`
  
- **Typography**:
  - Font family: Montserrat
  - Header: ExtraBold, 20px
  - Body: Regular, 16px

- **Components**:
  - Rounded input fields (borderRadius: 30)
  - Category pills with horizontal scroll
  - Large image picker with dashed border
  - Character count for description
  - Error validation feedback
  - Loading spinners during save

## 🔄 Next Steps

After successfully adding commodities, you can:

1. **View your commodities** in the merchant commodities list
2. **Edit commodities** by tapping on them
3. **Toggle availability** to control what's visible to customers
4. **Delete commodities** if needed (image will be removed from storage too)

## 💡 Tips

- Always test with a merchant account
- Use descriptive commodity names and categories
- Add high-quality images for better customer engagement
- Set realistic stock quantities
- Use appropriate units for your products

---

**Need help?** Check the Supabase documentation or the app's error messages for specific guidance.
