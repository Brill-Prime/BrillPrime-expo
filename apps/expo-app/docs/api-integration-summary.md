# BrillPrime API Integration Summary

## Backend Configuration
- **Base URL**: `https://api.brillprime.com`
- **Timeout**: 30 seconds
- **Authentication**: Bearer Token (JWT)

## Services Overview

### 1. Authentication Service (`services/authService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/social-login` - Social authentication (Google, Apple, Facebook)
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/password-reset/request` - Request password reset
- `POST /api/password-reset/verify-code` - Verify reset code
- `POST /api/password-reset/complete` - Complete password reset
- `GET /api/auth/profile` - Get user profile
- `POST /api/jwt-tokens/logout` - User logout

**Integration**: Firebase Auth + Backend API

---

### 2. User Service (`services/userService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings
- `PUT /api/user/password` - Change password
- `DELETE /api/user/account` - Delete account

---

### 3. Merchant Service (`services/merchantService.ts`)
**Status**: ✅ Updated - Now using apiClient
**Endpoints**:
- `GET /merchants` - Get all merchants
- `GET /merchants/{id}` - Get merchant by ID
- `POST /merchants` - Create merchant (requires auth)
- `PUT /merchants/{id}` - Update merchant (requires auth)
- `DELETE /merchants/{id}` - Delete merchant (requires auth)
- `GET /api/commodities` - Get all commodities
- `GET /api/merchants/{merchantId}/commodities` - Get merchant commodities
- `POST /api/merchants/{merchantId}/commodities` - Add commodity (requires auth)
- `PUT /api/merchants/{merchantId}/commodities/{commodityId}` - Update commodity (requires auth)
- `DELETE /api/merchants/{merchantId}/commodities/{commodityId}` - Delete commodity (requires auth)

**Changes**: Migrated from axios to apiClient for consistency

---

### 4. Order Service (`services/orderService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders (with filters)
- `GET /api/orders/{orderId}` - Get order by ID
- `PUT /api/orders/{orderId}` - Update order status
- `PUT /api/orders/{orderId}/cancel` - Cancel order
- `GET /api/orders/{orderId}/tracking` - Track order
- `GET /api/orders/summary` - Get order summary statistics

---

### 5. Payment Service (`services/paymentService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `POST /api/payments/create-intent` - Create payment intent (Stripe)
- `POST /api/payments/process` - Process payment
- `GET /api/transactions` - Get transaction history
- `GET /api/transactions/{transactionId}` - Get transaction details
- `POST /api/transactions/{transactionId}/refund` - Request refund
- `GET /api/payment-methods` - Get payment methods
- `POST /api/payment-methods` - Add payment method
- `DELETE /api/payment-methods/{paymentMethodId}` - Remove payment method
- `PUT /api/payment-methods/{paymentMethodId}/default` - Set default payment method
- `POST /api/toll-payments` - Process toll payment
- `GET /api/toll-payments` - Get toll payment history

---

### 6. Cart Service (`services/cartService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/{itemId}` - Update cart item quantity
- `DELETE /api/cart/{itemId}` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

---

### 7. Location Service (`services/locationService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `GET /api/merchants/nearby` - Get nearby merchants
- `GET /api/merchants/nearby/live` - Get nearby merchants with live location
- `PUT /api/location/live` - Update user's live location

**Integration**: Expo Location API + Backend API

---

### 8. Notification Service (`services/notificationService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{notificationId}/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/{notificationId}` - Delete notification
- `POST /api/notifications/register-device` - Register device for push notifications
- `PUT /api/notifications/preferences` - Update notification preferences
- `GET /api/notifications/preferences` - Get notification preferences
- `GET /api/notifications/history` - Get notification history
- `GET /api/notifications/unread-count` - Get unread notification count

---

### 9. KYC Service (`services/kycService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `GET /api/kyc/profile` - Get KYC profile
- `PUT /api/kyc/personal-info` - Update personal information
- `PUT /api/kyc/business-info` - Update business information
- `PUT /api/kyc/driver-info` - Update driver information
- `POST /api/kyc/documents` - Upload KYC document
- `GET /api/kyc/requirements` - Get verification requirements
- `POST /api/kyc/submit` - Submit KYC for verification
- `GET /api/kyc/status` - Check verification status
- `POST /api/admin/kyc/approve` - Approve KYC (Admin)
- `POST /api/admin/kyc/reject` - Reject KYC (Admin)
- `POST /api/admin/kyc/batch-review` - Batch review KYC (Admin)

---

### 10. Communication Service (`services/communicationService.ts`)
**Status**: ✅ Updated - Now using production WebSocket
**WebSocket**: `wss://api.brillprime.com/ws`
**Endpoints**:
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Get or create conversation
- `GET /api/conversations/{conversationId}/messages` - Get messages
- `POST /api/conversations/{conversationId}/messages` - Send message
- `PUT /api/conversations/{conversationId}/read` - Mark messages as read
- `POST /api/calls/initiate` - Initiate call
- `PUT /api/calls/{callId}/answer` - Answer call
- `PUT /api/calls/{callId}/end` - End call
- `GET /api/calls/history` - Get call history
- `PUT /api/users/{userId}/block` - Block user
- `DELETE /api/users/{userId}/block` - Unblock user

**Changes**: Updated WebSocket URL from localhost to production

---

### 11. Admin Service (`services/adminService.ts`)
**Status**: ✅ Connected to backend
**Endpoints**:
- `GET /api/admin/system-metrics` - Get system metrics
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/announcements` - Send announcement
- `POST /api/admin/maintenance` - Toggle maintenance mode
- `POST /api/admin/reports/export` - Export reports
- `POST /api/admin/users/toggle-block` - Block/unblock user
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get users with filters
- `GET /api/admin/kyc/pending` - Get pending KYC verifications
- `PUT /api/admin/kyc/{kycId}/approve` - Approve KYC
- `PUT /api/admin/kyc/{kycId}/reject` - Reject KYC
- `GET /api/admin/escrow` - Get escrow transactions
- `POST /api/admin/escrow/release` - Release escrow funds
- `GET /api/admin/moderation/reports` - Get reported content
- `POST /api/admin/moderation/{reportId}/{action}` - Take moderation action
- `POST /api/admin/users/suspend` - Suspend user
- `DELETE /api/admin/users/{userId}/suspend` - Unsuspend user

---

## Authentication Flow

1. **User Registration/Login**: 
   - Firebase Auth creates user account
   - Backend receives Firebase UID and creates user profile
   - Backend returns JWT token

2. **API Requests**:
   - All authenticated requests include: `Authorization: Bearer {token}`
   - Token is retrieved from AsyncStorage via `authService.getToken()`

3. **Token Management**:
   - Tokens stored securely in AsyncStorage
   - Automatic token refresh on Firebase auth state changes
   - Token validation on each request

---

## Error Handling

All services implement consistent error handling:
- Network timeouts (30 seconds)
- Authentication errors (401)
- Validation errors (400)
- Server errors (500+)
- Connection failures

---

## Recent Updates (October 09, 2025)

1. **Merchant Service**:
   - Migrated from axios to apiClient
   - Added proper authentication headers
   - Consistent error handling

2. **Communication Service**:
   - Updated WebSocket URL to production endpoint
   - Changed from `ws://localhost:3000/ws` to `wss://api.brillprime.com/ws`

3. **All Services**:
   - Verified proper integration with backend
   - Confirmed authentication token flow
   - Ensured consistent API response handling
