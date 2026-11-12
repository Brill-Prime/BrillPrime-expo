# Backend Implementation Guide for Brill Prime
**Generated**: October 11, 2025  
**Frontend Analysis**: Complete  
**Total Endpoints Required**: 100 (updated)

---

## 🔴 CRITICAL ENDPOINTS (Must Implement First - 9 endpoints)

These are blocking core app functionality. **Without these, users cannot use the app:**

### 1. Cart System (3 endpoints) ⛔ **BLOCKING CHECKOUT**
```
GET    /api/cart                    - Get user's cart items
POST   /api/cart                    - Add item to cart  
PUT    /api/cart/{itemId}           - Update item quantity
```

**CRITICAL: Current cart endpoints returning 401 errors. Backend must:**
1. Accept Firebase tokens in Authorization header
2. Validate token and extract user ID
3. Associate cart with authenticated user
4. Return proper error messages for auth failures
**Request/Response Examples:**
```typescript
// GET /api/cart
Response: {
  success: true,
  data: [
    {
      id: string,
      commodityId: string,
      commodityName: string,
      merchantId: string,
      merchantName: string,
      price: number,
      quantity: number,
      unit: string,
      category?: string,
      image?: string
    }
  ]
}

// POST /api/cart
Request: {
  commodityId: string,
  commodityName: string,
  merchantId: string,
  merchantName: string,
  price: number,
  quantity: number,
  unit: string
}

// PUT /api/cart/{itemId}
Request: { quantity: number }
```

### 2. Order Creation (1 endpoint) ⛔ **BLOCKING ORDERS**
```
POST   /api/orders                  - Create new order
```
**Request Example:**
```typescript
{
  merchantId: string,
  commodityId: string,
  quantity: number,
  deliveryAddress: string,
  deliveryType: 'myself' | 'someone_else',
  recipientName?: string,
  recipientPhone?: string,
  paymentMethod: string,
  totalAmount: number
}
```

### 3. Payment Processing (2 endpoints) ⛔ **BLOCKING PAYMENTS**
```
POST   /api/payments/create-intent  - Create Stripe/Paystack payment intent
POST   /api/payments/process        - Process payment
```

### 4. Location Services (1 endpoint) ⛔ **BLOCKING DISCOVERY**
```
GET    /api/merchants/nearby        - Find nearby merchants
```
**Query Params:** `latitude`, `longitude`, `radius`, `type`

### 5. Messaging (1 endpoint) ⛔ **BLOCKING COMMUNICATION**
```
POST   /api/conversations/{id}/messages  - Send message
```

### 6. KYC Documents (1 endpoint) ⛔ **BLOCKING MERCHANT/DRIVER ONBOARDING**
```
POST   /api/kyc/documents           - Upload KYC documents
```

---

## 🟠 HIGH PRIORITY (47 endpoints)

### Authentication & Security (6 endpoints)
```
POST   /api/auth/social-login              - Google/Apple/Facebook login
POST   /api/auth/verify-otp                - Email/phone OTP verification
POST   /api/auth/resend-otp                - Resend OTP code
POST   /api/password-reset/verify-code     - Verify password reset code
POST   /api/password-reset/complete        - Complete password reset
POST   /api/jwt-tokens/logout              - User logout
```

### User Profile (4 endpoints)
```
PUT    /api/auth/profile                   - Update user profile
POST   /api/user/profile-photo             - Upload profile photo (multipart/form-data)
PUT    /api/user/password                  - Change password
DELETE /api/user/account                   - Delete user account
```

**Profile Photo Upload Details:**
```typescript
// POST /api/user/profile-photo
Content-Type: multipart/form-data
Body: FormData with 'profileImage' field

Response: {
  success: true,
  data: {
    profileImageUrl: string  // URL to the uploaded image
  }
}
```

### Merchants & Commodities (7 endpoints)
```
GET    /api/commodities                                          - List all commodities
GET    /api/merchants/{id}                                       - Get specific merchant
POST   /api/merchants                                            - Create merchant
PUT    /api/merchants/{id}                                       - Update merchant
GET    /api/merchants/{merchantId}/commodities                   - Get merchant commodities
POST   /api/merchants/{merchantId}/commodities                   - Add commodity
PUT    /api/merchants/{merchantId}/commodities/{commodityId}     - Update commodity
```

### Orders & Tracking (6 endpoints)
```
GET    /api/orders/{orderId}               - Get order details
PUT    /api/orders/{orderId}/status        - Update order status
PUT    /api/orders/{orderId}/cancel        - Cancel order
GET    /api/orders/{orderId}/tracking      - Track order & driver location
GET    /api/orders/{orderId}/eta           - Get estimated time of arrival
GET    /api/orders/summary                 - Get order statistics
```

### Payments & Transactions (8 endpoints)
```
GET    /api/transactions                   - Get transaction history
GET    /api/transactions/{id}              - Get transaction details
POST   /api/transactions/{id}/refund       - Request refund
❌ GET    /api/payment-methods                - Get user's payment methods (404 - NOT IMPLEMENTED)
❌ POST   /api/payment-methods                - Add payment method (404 - NOT IMPLEMENTED)
❌ DELETE /api/payment-methods/{id}           - Remove payment method (404 - NOT IMPLEMENTED)
❌ PUT    /api/payment-methods/{id}/default   - Set default payment method (404 - NOT IMPLEMENTED)
GET    /api/payments/history               - Payment history
```

**URGENT: Payment Methods Implementation Required**
```typescript
// GET /api/payment-methods
Response: {
  success: true,
  data: [
    {
      id: string,
      type: 'card' | 'bank_account',
      last4: string,
      brand?: string, // For cards: 'visa', 'mastercard', etc.
      expiryMonth?: number,
      expiryYear?: number,
      bankName?: string, // For bank accounts
      accountNumber?: string, // Last 4 digits
      isDefault: boolean,
      createdAt: string
    }
  ]
}

// POST /api/payment-methods
Request: {
  type: 'card' | 'bank_account',
  // For cards:
  cardNumber?: string,
  expiryMonth?: number,
  expiryYear?: number,
  cvv?: string,
  // For bank accounts:
  accountNumber?: string,
  routingNumber?: string,
  bankName?: string,
  // Common:
  isDefault?: boolean
}

// DELETE /api/payment-methods/{id}
Response: { success: true, message: "Payment method removed" }

// PUT /api/payment-methods/{id}/default
Response: { success: true, message: "Default payment method updated" }
```

### Cart Operations (2 endpoints)
```
DELETE /api/cart/{itemId}                  - Remove item from cart
DELETE /api/cart                           - Clear entire cart
```

### Notifications (6 endpoints)
```
PUT    /api/notifications/{id}/read        - Mark notification as read
PUT    /api/notifications/read-all         - Mark all as read
DELETE /api/notifications/{id}             - Delete notification
POST   /api/notifications/register-device  - Register for push notifications
GET    /api/notifications/unread-count     - Get unread count
GET    /api/notifications/preferences      - Get notification settings
```

### Location & Tracking (4 endpoints)
```
GET    /api/merchants/nearby/live          - Nearby merchants with live tracking
PUT    /api/location/live                  - Update user's live location
GET    /api/location/live/{userId}         - Get user's live location
```

### KYC Verification (5 endpoints)
```
GET    /api/kyc/profile                    - Get KYC profile
PUT    /api/kyc/personal-info              - Update personal info
PUT    /api/kyc/business-info              - Update business info (Merchant)
PUT    /api/kyc/driver-info                - Update driver info (Driver)
GET    /api/kyc/requirements               - Get KYC requirements by role
POST   /api/kyc/submit                     - Submit KYC for verification
GET    /api/kyc/status                     - Check verification status
```

---

## 🟡 MEDIUM PRIORITY (32 endpoints)

### User Management (2 endpoints)
```
GET    /api/user/settings                  - Get user settings
PUT    /api/user/settings                  - Update user settings
```

### Communication (5 endpoints)
```
GET    /api/conversations                  - Get user conversations
POST   /api/conversations                  - Create/get conversation
GET    /api/conversations/{id}/messages    - Get messages
PUT    /api/conversations/{id}/read        - Mark messages as read
GET    /api/calls/history                  - Get call history
```

### Call Features (3 endpoints)
```
POST   /api/calls/initiate                 - Start voice/video call
PUT    /api/calls/{id}/answer              - Answer call
PUT    /api/calls/{id}/end                 - End call
```

### Merchant Management (4 endpoints)
```
DELETE /api/merchants/{id}                                       - Delete merchant
DELETE /api/merchants/{merchantId}/commodities/{commodityId}     - Delete commodity
GET    /api/merchants/{merchantId}/analytics                     - Get merchant analytics
GET    /api/merchants/{merchantId}/reviews                       - Get merchant reviews
```

**Analytics Response Example:**
```typescript
{
  success: true,
  data: {
    totalSales: number,
    totalOrders: number,
    averageOrderValue: number,
    monthlyGrowth: number,
    customerRetention: number,
    topSellingProducts: [{
      name: string,
      sales: number,
      revenue: number
    }],
    dailySales: [{
      date: string,
      sales: number
    }],
    categoryBreakdown: [{
      category: string,
      revenue: number,
      percentage: number
    }],
    customerMetrics: {
      newCustomers: number,
      returningCustomers: number,
      averageOrdersPerCustomer: number,
      customerSatisfaction: number
    },
    inventoryMetrics: {
      totalItems: number,
      lowStockItems: number,
      outOfStockItems: number,
      turnoverRate: number
    },
    paymentMethods: [{
      method: string,
      amount: number,
      percentage: number
    }]
  }
}
```

**Reviews Response Example:**
```typescript
// GET /api/merchants/{merchantId}/reviews
Response: {
  success: true,
  data: {
    merchantId: string,
    merchantName: string,
    averageRating: number,
    totalReviews: number,
    ratingDistribution: {
      5: number,
      4: number,
      3: number,
      2: number,
      1: number
    },
    reviews: [{
      id: string,
      userId: string,
      userName: string,
      userImage?: string,
      rating: number,
      comment: string,
      orderId?: string,
      commodityName?: string,
      helpful: number, // Number of users who found it helpful
      createdAt: string,
      updatedAt?: string
    }]
  }
}

// POST /api/merchants/{merchantId}/reviews (New endpoint needed)
Request: {
  rating: number, // 1-5
  comment: string,
  orderId?: string,
  commodityId?: string
}

Response: {
  success: true,
  message: "Review submitted successfully",
  data: {
    reviewId: string,
    merchantRating: number // Updated average rating
  }
}
```

### Notification Settings (2 endpoints)
```
PUT    /api/notifications/preferences      - Update notification settings
GET    /api/notifications/history          - Get notification history
```

### Admin - User Management (4 endpoints)
```
GET    /api/admin/dashboard/stats          - Dashboard statistics
GET    /api/admin/users                    - Get users with filters
POST   /api/admin/users/toggle-block       - Block/Unblock users
GET    /api/admin/analytics                - Platform analytics
```

### Admin - KYC (3 endpoints)
```
GET    /api/admin/kyc/pending              - Pending KYC verifications
PUT    /api/admin/kyc/{id}/approve         - Approve KYC
PUT    /api/admin/kyc/{id}/reject          - Reject KYC
POST   /api/admin/kyc/batch-review         - Batch review KYC
```

### Admin - Escrow (2 endpoints)
```
GET    /api/admin/escrow                   - Escrow transactions
POST   /api/admin/escrow/{id}/release      - Release escrow funds
```

### Admin - Moderation (2 endpoints)
```
GET    /api/admin/moderation/reports       - Content reports
POST   /api/admin/moderation/{reportId}/{action}  - Moderation actions
```

### Admin - System (4 endpoints)
```
GET    /api/admin/system-metrics           - System performance metrics
POST   /api/admin/announcements            - Send platform announcements
POST   /api/admin/maintenance              - Toggle maintenance mode
POST   /api/admin/users/suspend            - Suspend user
DELETE /api/admin/users/{userId}/suspend   - Unsuspend user
```

### Favorites (3 endpoints)
```
GET    /api/favorites                      - Get favorite merchants
POST   /api/favorites                      - Add to favorites
DELETE /api/favorites/{itemId}             - Remove from favorites
```

### Payments & Toll (4 endpoints)
```
POST   /api/payments/initialize            - Initialize Paystack payment
GET    /api/payments/verify/{reference}    - Verify payment
POST   /api/toll-payments                  - Toll gate payment
GET    /api/toll-payments                  - Get toll payments
```

### Toll Gates (1 endpoint) - NEW
```
GET    /api/toll-gates                     - Get all toll gates with pricing
```
**Response Example:**
```typescript
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      location: string,
      highway: string,
      distance: number,
      pricePerVehicle: {
        motorcycle: number,
        car: number,
        suv: number,
        truck: number
      },
      operatingHours: string,
      isOpen: boolean,
      estimatedTime: string,
      paymentMethods: string[]
    }
  ]
}
```

### Driver Orders (1 endpoint) - NEW
```
GET    /api/drivers/orders                 - Get driver orders by status
```
**Query Params:** `status` (available, accepted, picked_up, delivered, cancelled)
**Response Example:**
```typescript
{
  success: true,
  data: [
    {
      id: string,
      customerId: string,
      customerName: string,
      customerPhone: string,
      pickupAddress: string,
      deliveryAddress: string,
      items: string[],
      totalAmount: number,
      distance: string,
      estimatedDuration: string,
      status: string,
      timestamp: string,
      earnings: number
    }
  ]
}
```

---

## 🟢 LOW PRIORITY (10 endpoints)

### User Features (1 endpoint)
```
DELETE /api/conversations/{id}             - Delete conversation
```

### User Blocking (2 endpoints)
```
POST   /api/users/{userId}/block           - Block user
DELETE /api/users/{userId}/block           - Unblock user
```

### Admin Tools (3 endpoints)
```
POST   /api/admin/reports/export           - Export data reports
```

---

## 📊 Implementation Phases

### Phase 1: Core E-Commerce (Week 1) - 20 endpoints
**Goal**: Users can browse, cart, order, and pay
- ✅ Cart system (5 endpoints)
- ✅ Order creation & tracking (7 endpoints)
- ✅ Payment processing (4 endpoints)
- ✅ Merchant/commodity display (4 endpoints)

### Phase 2: Location & Discovery (Week 2) - 9 endpoints
**Goal**: Location-based merchant discovery & live tracking
- ✅ Location services (5 endpoints)
- ✅ Nearby merchants (2 endpoints)
- ✅ Live tracking (2 endpoints)

### Phase 3: Communication (Week 3) - 11 endpoints
**Goal**: In-app chat and calls
- ✅ Chat/messaging (6 endpoints)
- ✅ Voice calls (4 endpoints)
- ✅ WebSocket support (wss://api.brillprime.com/ws)

### Phase 4: User Verification (Week 4) - 11 endpoints
**Goal**: Merchant & Driver KYC verification
- ✅ KYC documents & profiles (7 endpoints)
- ✅ Admin KYC review (4 endpoints)

### Phase 5: Enhanced Features (Week 5) - 20 endpoints
**Goal**: Notifications, favorites, settings
- ✅ Notification system (9 endpoints)
- ✅ User settings & preferences (4 endpoints)
- ✅ Favorites (3 endpoints)
- ✅ User blocking (2 endpoints)
- ✅ Conversation management (2 endpoints)

### Phase 6: Admin Panel (Week 6) - 15 endpoints
**Goal**: Full admin control panel
- ✅ User management (4 endpoints)
- ✅ Escrow management (2 endpoints)
- ✅ Moderation tools (2 endpoints)
- ✅ System tools (4 endpoints)
- ✅ Analytics & reports (3 endpoints)

---

## 🔒 Authentication Requirements

**All endpoints require JWT authentication except:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/social-login`
- `POST /api/password-reset/request`
- `GET /health` endpoints

**Header Format:**
```
Authorization: Bearer <firebase-jwt-token>
```

**CRITICAL: Token Validation Issues**

Currently experiencing 401 errors with message: `{"success":false,"message":"Invalid or expired token","code":"INVALID_TOKEN"}`

**Backend must handle:**
1. **Firebase Token Verification**: Verify Firebase ID tokens as primary authentication
2. **Token Refresh**: Implement automatic token refresh when tokens expire
3. **Graceful Degradation**: Return specific error codes for different auth failures:
   - `TOKEN_EXPIRED` - Token is expired (trigger refresh)
   - `TOKEN_INVALID` - Token is malformed or invalid
   - `TOKEN_MISSING` - No token provided
   - `INSUFFICIENT_PERMISSIONS` - Valid token but insufficient role permissions

**Token Refresh Endpoint Required:**
```typescript
POST /api/auth/refresh
Request: {
  refreshToken?: string, // Optional, can use existing token
  firebaseUid: string
}

Response: {
  success: true,
  data: {
    token: string, // New Firebase token
    expiresIn: number // Seconds until expiration
  }
}
```

---

## 🌐 WebSocket Implementation

**URL**: `wss://api.brillprime.com/ws`

**Events to Support:**
- `message.new` - New chat message
- `message.read` - Message read receipt
- `order.status_update` - Order status changed
- `driver.location_update` - Driver location update
- `notification.new` - New notification
- `call.incoming` - Incoming call
- `call.ended` - Call ended

---

## 📝 Data Models

### User Model
```typescript
{
  id: string,
  email: string,
  name: string,
  role: 'consumer' | 'merchant' | 'driver',
  phone: string,
  isVerified: boolean,
  profileImageUrl?: string,
  createdAt: string,
  updatedAt: string
}
```

### Order Model
```typescript
{
  id: string,
  userId: string,
  merchantId: string,
  commodityId: string,
  quantity: number,
  totalAmount: number,
  deliveryAddress: string,
  deliveryType: 'myself' | 'someone_else',
  recipientName?: string,
  recipientPhone?: string,
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled',
  paymentStatus: 'pending' | 'paid' | 'refunded',
  driverId?: string,
  createdAt: string,
  updatedAt: string
}
```

### Merchant Model
```typescript
{
  id: string,
  name: string,
  description?: string,
  logoUrl?: string,
  address: string,
  location: { latitude: number, longitude: number },
  rating: number,
  isActive: boolean,
  createdAt: string
}
```

---

## 🚀 Quick Start Checklist

### Immediate (Today):
- [ ] Set up cart endpoints (GET, POST, PUT)
- [ ] Implement order creation (POST /api/orders)
- [ ] Set up payment intent creation

### This Week:
- [ ] Complete cart & order flow
- [ ] Implement payment processing
- [ ] Add nearby merchants endpoint
- [ ] Set up basic messaging

### Next Steps:
- [ ] KYC document upload
- [ ] Live location tracking
- [ ] WebSocket for real-time updates
- [ ] Admin dashboard APIs

---

## 📚 Additional Resources

**Frontend Service Files:**
- `services/cartService.ts` - Cart implementation
- `services/orderService.ts` - Order creation logic
- `services/paymentService.ts` - Payment processing
- `services/merchantService.ts` - Merchant CRUD
- `services/kycService.ts` - KYC verification
- `services/communicationService.ts` - Chat & calls
- `services/adminService.ts` - Admin features

**API Endpoint Definitions:**
- `services/apiEndpoints.ts` - All endpoint paths
- `services/api.ts` - API client configuration

**Documentation:**
- `docs/missing-api-endpoints-analysis.md` - Full endpoint analysis
- `docs/frontend-missing-implementations-report.md` - Frontend issues

---

## ⚠️ Current Status

**Backend Base URL**: `https://api.brillprime.com`

**Working Endpoints (Based on API Documentation - 60+/100):**

**Authentication & Users (13 endpoints):**
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ POST /api/auth/social-login
- ✅ Firebase client sign-out (no backend logout endpoint required)
- ✅ POST /api/auth/refresh
- ✅ POST /api/auth/verify-email
- ✅ POST /api/auth/resend-otp
- ✅ GET /api/users (Admin)
- ✅ GET /api/users/:id
- ✅ PUT /api/users/:id
- ✅ DELETE /api/users/:id
- ✅ GET /api/profile
- ✅ PUT /api/profile

**Profile Management (10 endpoints):**
- ✅ GET /api/profile/addresses
- ✅ POST /api/profile/addresses
- ✅ PUT /api/profile/addresses/:id
- ✅ DELETE /api/profile/addresses/:id
- ✅ GET /api/profile/payment-methods
- ✅ POST /api/profile/payment-methods
- ✅ PUT /api/profile/payment-methods/:id
- ✅ DELETE /api/profile/payment-methods/:id
- ✅ GET /api/profile/privacy-settings
- ✅ PUT /api/profile/privacy-settings

**Products & Categories (7 endpoints):**
- ✅ GET /api/products
- ✅ POST /api/products
- ✅ GET /api/products/:id
- ✅ PUT /api/products/:id
- ✅ DELETE /api/products/:id
- ✅ GET /api/categories
- ✅ POST /api/categories

**Cart (5 endpoints):**
- ✅ GET /api/cart
- ✅ POST /api/cart
- ✅ PUT /api/cart/:itemId
- ✅ DELETE /api/cart/:itemId
- ✅ DELETE /api/cart

**Orders (6 endpoints):**
- ✅ GET /api/orders
- ✅ POST /api/orders
- ✅ GET /api/orders/:id
- ✅ PUT /api/orders/:id/status
- ✅ POST /api/orders/:id/cancel
- ✅ GET /api/orders/:id/eta

**Payments (4 endpoints):**
- ✅ POST /api/payments/initialize
- ✅ GET /api/payments/verify/:reference
- ✅ GET /api/payments/history
- ✅ POST /api/payments/refund

**Escrow (4 endpoints):**
- ✅ GET /api/escrows
- ✅ GET /api/escrows/:id
- ✅ POST /api/escrows/:id/release
- ✅ POST /api/escrows/:id/dispute

**Drivers & Tracking (7 endpoints):**
- ✅ GET /api/drivers
- ✅ GET /api/drivers/:id
- ✅ POST /api/drivers/register
- ✅ PUT /api/drivers/:id/status
- ✅ POST /api/drivers/location
- ✅ GET /api/tracking/order/:orderId
- ✅ POST /api/tracking/:orderId/location

**Notifications (3 endpoints):**
- ✅ GET /api/notifications
- ✅ PUT /api/notifications/:id/read
- ✅ PUT /api/notifications/read-all

**Messages (3 endpoints):**
- ✅ GET /api/conversations
- ✅ GET /api/conversations/:conversationId/messages
- ✅ POST /api/messages

**Ratings (2 endpoints):**
- ✅ POST /api/ratings
- ✅ GET /api/ratings/user/:userId

**Admin Endpoints (15+ endpoints):**
- ✅ GET /api/admin-users
- ✅ POST /api/admin-users
- ✅ GET /api/admin-dashboard/overview
- ✅ GET /api/admin-dashboard/alerts
- ✅ GET /api/admin/moderation
- ✅ POST /api/admin/moderation/:reportId/action
- ✅ GET /api/admin/control-center
- ✅ POST /api/admin/control-center/action
- ✅ GET /api/admin/escrow-management
- ✅ POST /api/admin/escrow-management/:escrowId/action
- ✅ GET /api/admin/kyc-verification
- ✅ GET /api/admin/reports/financial
- ✅ GET /api/admin/reports/user-growth
- ✅ GET /api/admin/reports/performance
- ✅ GET /api/admin/reports/export/:reportType
- ✅ GET /api/admin/system-metrics
- ✅ GET /api/admin/system-metrics/health

**Health Checks (4 endpoints):**
- ✅ GET /
- ✅ GET /health
- ✅ GET /api/health
- ✅ GET /api/health/detailed

**Still Needs Implementation (Key Missing Endpoints ~40):**
- ❌ GET /api/merchants/nearby (Location-based search)
- ❌ GET /api/merchants/nearby/live (Live tracking)
- ❌ GET /api/merchants/:id
- ❌ POST /api/merchants
- ❌ PUT /api/merchants/:id
- ❌ DELETE /api/merchants/:id
- ❌ GET /api/merchants/:id/analytics (Important for merchant dashboard)
- ❌ GET /api/commodities
- ❌ GET /api/merchants/:merchantId/commodities
- ❌ POST /api/merchants/:merchantId/commodities
- ❌ PUT /api/merchants/:merchantId/commodities/:commodityId
- ❌ DELETE /api/merchants/:merchantId/commodities/:commodityId
- ❌ POST /api/profile/change-password
- ❌ POST /api/payments/create-intent (Stripe/Paystack)
- ❌ POST /api/payments/process
- ❌ POST /api/toll-payments
- ❌ GET /api/toll-payments
- ❌ GET /api/toll-gates
- ❌ GET /api/drivers/orders
- ❌ PUT /api/location/live
- ❌ GET /api/location/live/:userId
- ❌ POST /api/notifications/register-device
- ❌ GET /api/notifications/unread-count
- ❌ GET /api/notifications/preferences
- ❌ PUT /api/notifications/preferences
- ❌ GET /api/notifications/history
- ❌ POST /api/calls/initiate
- ❌ PUT /api/calls/:id/answer
- ❌ PUT /api/calls/:id/end
- ❌ GET /api/calls/history
- ❌ POST /api/conversations
- ❌ PUT /api/conversations/:id/read
- ❌ DELETE /api/conversations/:id
- ❌ POST /api/users/:userId/block
- ❌ DELETE /api/users/:userId/block
- ❌ GET /api/favorites
- ❌ POST /api/favorites
- ❌ DELETE /api/favorites/:itemId
- ❌ POST /api/kyc/documents
- ❌ GET /api/kyc/profile
- ❌ PUT /api/kyc/personal-info
- ❌ PUT /api/kyc/business-info
- ❌ PUT /api/kyc/driver-info
- ❌ GET /api/kyc/requirements
- ❌ POST /api/kyc/submit
- ❌ GET /api/kyc/status
