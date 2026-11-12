
# Complete API Integration Guide

## Current Supabase serverless routing status

The app's API base URL is the Supabase project URL. Calls to legacy `/api/...` paths do not resolve to application endpoints on Supabase and must not be considered integrated until routed to an Edge Function or an authenticated Supabase SDK operation.

The API client no longer sends the unsupported `x-firebase-uid` request header. Edge Functions should derive the user ID from the verified Firebase ID token instead.

The public merchant and commodity reads now use the `catalog` Edge Function:
- `GET /functions/v1/catalog/merchants`
- `GET /functions/v1/catalog/merchants/:id`
- `GET /functions/v1/catalog/commodities`
- `GET /functions/v1/catalog/merchants/:id/commodities`

Merchant management, products, store settings, merchant orders/customers/analytics, and ratings also route through `catalog`. Writes and merchant-private reads require a verified Firebase ID token and merchant ownership.

Addresses, payment methods, account settings, privacy settings, notification preferences, and account deletion requests use `account`. Transaction history and per-transaction reads use the authenticated `transactions` function. Payment execution is routed to `payment-process`, which intentionally returns HTTP 503 until a payment provider is configured; toll-payment history is not available because no toll transaction schema exists.

Notification history/read operations use authenticated `account` routes, and queued analytics events are persisted through the authenticated `analytics` function.

KYC profile/status endpoints use `kyc`; document files are stored in a private Supabase Storage bucket and accessed through short-lived signed URLs. The user submits files for review only after the required profile details and documents are present.

Admin announcements and maintenance-mode updates use Firebase-authenticated `admin` function routes with an explicit database admin-role check.

Nearby merchant reads use `merchants-nearby` and the existing PostGIS `location` column. Deploy the changed functions and apply migrations before using these routes in a hosted Supabase project. Other legacy `/api/...` service routes still need an Edge Function implementation and migration; the endpoint list below records historical integration intent, not proof that those routes currently exist.

## Current runtime investigation

- The checked-in `account` function handles `GET /notifications/unread-count`; a hosted `404 NOT_FOUND` means the target project does not currently serve that function/route. The Supabase CLI session used for this investigation does not have access to the configured app project, so hosted function deployment, migration status, and live verification could not be completed.
- The checked-in `user-sync` handler allows both GET and POST. App startup now reads an existing profile through `GET /functions/v1/profile` and uses `POST /functions/v1/user-sync` only to create/sync a missing profile, avoiding a GET against older POST-only deployments.
- Sign-out is a Firebase client operation. It no longer calls the legacy `/api/auth/logout` after clearing the Firebase token; Firebase sign-out failures are surfaced rather than reported as a successful logout.
- Active admin screens still make direct requests to legacy `/api/admin/...` paths: users, moderation, KYC verification, escrow management, analytics, and control center. The Supabase `admin` function currently covers only announcements and maintenance. These screen routes have not been verified against the separate API host or migrated to Supabase admin handlers.
- The database has no escrow or moderation-report tables in its checked-in schema/migrations. Those admin flows need explicit data-model decisions before they can be implemented safely; metrics and user/KYC routes can be assessed against existing tables.
- `productService`, `trackingService`, and `escrowService` still contain legacy `/api/...` routes. No direct screen/service call sites for those services were found in this audit; confirm before deleting or migrating them.

## Overview
This document tracks the integration status of all backend API endpoints with the frontend application.

## Integration Status

### ✅ Fully Integrated Services

#### 1. Authentication Service (`services/authService.ts`)
- [x] POST `/api/auth/register` - User registration
- [x] POST `/api/auth/login` - User login  
- [x] POST `/api/auth/social-login` - Social authentication
- [x] Firebase client sign-out - Ends the local Firebase session without requiring a backend logout route
- [x] POST `/api/auth/verify-email` - Email verification
- [x] POST `/api/auth/resend-otp` - Resend OTP
- [x] GET `/api/profile` - Get user profile

#### 2. User Service (`services/userService.ts`)
- [x] GET `/api/profile` - Get profile
- [x] PUT `/api/profile` - Update profile
- [x] POST `/api/profile/change-password` - Change password

### 🔄 Partially Integrated Services

#### 3. Cart Service (`services/cartService.ts`)
- [x] GET `/api/cart` - Get cart
- [x] POST `/api/cart` - Add to cart
- [x] PUT `/api/cart/:itemId` - Update quantity
- [x] DELETE `/api/cart/:itemId` - Remove item
- [x] DELETE `/api/cart` - Clear cart

#### 4. Order Service (`services/orderService.ts`)
- [x] GET `/api/orders` - List orders
- [x] POST `/api/orders` - Create order
- [x] GET `/api/orders/:id` - Get order details
- [x] PUT `/api/orders/:id/status` - Update status
- [x] POST `/api/orders/:id/cancel` - Cancel order
- [ ] GET `/api/orders/:id/eta` - Get ETA (needs implementation)

#### 5. Payment Service (`services/paymentService.ts`)
- [x] GET `/functions/v1/transactions` - Authenticated transaction history
- [x] GET `/functions/v1/transactions/:id` - Authenticated transaction detail
- [ ] POST `/functions/v1/payment-process` - Payment execution (provider not configured; returns 503)
- [ ] Toll payment history (no backing schema)

### ⚠️ Needs Implementation

#### 6. Profile Extensions
- [x] Address CRUD via `/functions/v1/account/addresses`
- [x] Payment method CRUD via `/functions/v1/account/payment-methods` (card creation requires a configured tokenization provider)
- [x] Privacy and account settings via `/functions/v1/account`

#### 7. Products & Categories (New Service Needed)
- [ ] GET `/api/products` - List products
- [ ] POST `/api/products` - Create product
- [ ] GET `/api/products/:id` - Get product
- [ ] PUT `/api/products/:id` - Update product
- [ ] DELETE `/api/products/:id` - Delete product
- [ ] GET `/api/categories` - List categories
- [ ] POST `/api/categories` - Create category

#### 8. Escrow Service (New Service Needed)
- [ ] GET `/api/escrows` - List escrows
- [ ] GET `/api/escrows/:id` - Get escrow details
- [ ] POST `/api/escrows/:id/release` - Release escrow
- [ ] POST `/api/escrows/:id/dispute` - Dispute escrow

#### 9. Driver Service (Extend Existing)
- [ ] GET `/api/drivers` - List drivers
- [ ] GET `/api/drivers/:id` - Get driver details
- [ ] POST `/api/drivers/register` - Register driver
- [ ] PUT `/api/drivers/:id/status` - Update status
- [ ] POST `/api/drivers/location` - Update location

#### 10. Tracking Service (New Service Needed)
- [ ] GET `/api/tracking/order/:orderId` - Track order
- [ ] POST `/api/tracking/:orderId/location` - Update location

#### 11. Ratings Service (New Service Needed)
- [ ] POST `/api/ratings` - Create rating
- [ ] GET `/api/ratings/user/:userId` - Get user ratings

#### 12. Admin Services (Extend Existing)
- [ ] GET `/api/admin-users` - List admin users
- [ ] POST `/api/admin-users` - Create admin user
- [ ] GET `/api/admin-dashboard/overview` - Dashboard overview
- [ ] GET `/api/admin-dashboard/alerts` - System alerts
- [ ] GET `/api/admin/moderation` - Moderation queue
- [ ] POST `/api/admin/moderation/:reportId/action` - Take action
- [ ] GET `/api/admin/control-center` - Control center
- [ ] POST `/api/admin/control-center/action` - System action
- [ ] GET `/api/admin/escrow-management` - Escrow list
- [ ] POST `/api/admin/escrow-management/:escrowId/action` - Escrow action
- [ ] GET `/api/admin/kyc-verification` - KYC list
- [ ] GET `/api/admin/reports/financial` - Financial reports
- [ ] GET `/api/admin/reports/user-growth` - User growth
- [ ] GET `/api/admin/reports/performance` - Performance
- [ ] GET `/api/admin/reports/export/:reportType` - Export report
- [ ] GET `/api/admin/system-metrics` - System metrics
- [ ] GET `/api/admin/system-metrics/health` - System health

## Next Steps

1. Migrate or explicitly retain the active direct `/api/admin/...` screen calls after confirming their intended backend and route contracts.
2. Resolve remaining legacy service routes after confirming whether those exported services are used at runtime.
3. Configure a supported payment provider before enabling electronic payments, card tokenization, refunds, or toll payment processing.
4. Link to the correct Supabase project, apply migrations, deploy Edge Functions, and verify hosted behavior with Firebase ID tokens and production-like data.

## Testing Checklist

- [ ] Test Firebase authentication flow
- [ ] Test all cart operations
- [ ] Test order creation and tracking
- [ ] Test payment initialization and verification
- [ ] Test profile updates
- [ ] Test address management
- [ ] Test payment method management
- [ ] Test admin dashboard access
- [ ] Test driver registration and tracking
- [ ] Test escrow flow
- [ ] Test rating system

## API Response Handling

All services follow this pattern:
```typescript
const response = await apiClient.post(endpoint, data, headers);
if (!response.success) {
  throw new Error(response.error || 'Operation failed');
}
return response.data;
```
