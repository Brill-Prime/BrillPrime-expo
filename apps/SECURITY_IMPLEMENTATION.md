
# Supabase Security Implementation

## Row Level Security (RLS) Policies

This document describes the comprehensive security implementation for BrillPrime using Supabase RLS.

## Overview

All tables in the database have Row Level Security enabled with granular access control based on user roles and relationships.

## Security Principles

1. **Least Privilege**: Users can only access data they own or are authorized to see
2. **Role-Based Access**: Different permissions for consumers, merchants, drivers, and admins
3. **Data Isolation**: Users cannot access other users' private data
4. **Audit Trail**: All changes are tracked with timestamps

## Policy Categories

### 1. User Management
- **Users Table**: Users can only view/update their own profile
- **Role Status**: Users manage their own role registrations
- **Addresses**: Users can only access their own addresses

### 2. Merchant Operations
- **Merchants**: Public viewing for active stores, owner-only updates
- **Commodities**: Public catalog, admin-managed
- **Merchant Commodities**: Merchants manage their own inventory

### 3. Shopping & Orders
- **Cart**: Users can only access their own cart
- **Orders**: Multi-party access (customer, merchant, driver)
- **Order Tracking**: Visible to all parties involved in order

### 4. Payments & Transactions
- **Payments**: Users see their own payments, merchants see their sales
- **Escrow**: Visible to buyer and seller only
- **Toll Payments**: User-specific payment history

### 5. Communication
- **Conversations**: Only participants can access
- **Messages**: Send/receive within conversations you're part of
- **Notifications**: User-specific inbox

### 6. Driver Features
- **Driver Locations**: Visible to customers with active deliveries
- **Location Updates**: Drivers update their own location only

### 7. Reviews & Favorites
- **Reviews**: Public reading, customers write after delivery
- **Favorites**: User-specific favorites list

### 8. KYC & Compliance
- **KYC Documents**: User uploads, admin reviews
- **Admin Settings**: Admin-only access

## Helper Functions

### `get_current_user_id()`
Returns the UUID of the currently authenticated user based on Firebase UID.

### `is_admin()`
Checks if the current user has admin role.

### `has_role(role_name)`
Checks if the current user has a specific role (consumer, merchant, driver).

## Implementation

### Apply Policies

```bash
# Apply all security policies
./scripts/apply-rls-policies.sh
```

### Test Policies

```bash
# Run security tests
npm run test:security
```

## Policy Examples

### Customer Viewing Their Orders
```sql
-- Policy: orders_select_involved
-- Allows: user_id matches current user
SELECT * FROM orders WHERE user_id = get_current_user_id();
```

### Merchant Managing Inventory
```sql
-- Policy: merchant_commodities_update_own
-- Allows: merchant_id matches current user's merchant
UPDATE merchant_commodities 
SET price = 1500 
WHERE merchant_id IN (
  SELECT id FROM merchants WHERE user_id = get_current_user_id()
);
```

### Driver Updating Location
```sql
-- Policy: driver_locations_insert_own
-- Allows: driver_id matches current user and has driver role
INSERT INTO driver_locations (driver_id, latitude, longitude)
VALUES (get_current_user_id(), 6.5244, 3.3792);
```

## Security Best Practices

### 1. Always Use Authenticated Requests
```typescript
// Set Firebase token before any Supabase operation
await setSupabaseAuthToken(firebaseToken);
```

### 2. Handle Unauthorized Access Gracefully
```typescript
const { data, error } = await supabase
  .from('orders')
  .select('*');

if (error?.code === 'PGRST301') {
  // Handle permission denied
  console.error('Unauthorized access attempt');
}
```

### 3. Test with Different Roles
```typescript
// Test as consumer
await signIn('consumer@example.com');
await supabase.from('merchants').select('*'); // ✅ Can view

// Test as merchant
await signIn('merchant@example.com');
await supabase.from('orders').select('*'); // ✅ Can view own orders only
```

## Monitoring & Auditing

### Check Policy Violations
Query Supabase logs for failed RLS checks:
```sql
SELECT * FROM auth.audit_log_entries 
WHERE error_message LIKE '%policy%'
ORDER BY created_at DESC;
```

### Monitor Unauthorized Access
Set up alerts for repeated policy violations in Supabase Dashboard.

## Emergency Procedures

### Disable RLS (Emergency Only)
```sql
-- ⚠️ DANGER: Only for debugging
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Re-enable RLS
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

## Updates & Maintenance

### Adding New Tables
1. Create table with RLS enabled
2. Define appropriate policies
3. Test with all user roles
4. Deploy via migration

### Modifying Policies
1. Update policy in `supabase-security-policies.sql`
2. Test in development environment
3. Apply to production
4. Monitor for issues

## Support

For security issues or questions:
- Review this documentation
- Check Supabase Dashboard policy logs
- Test with `npm run test:security`
- Contact: security@brillprime.com
