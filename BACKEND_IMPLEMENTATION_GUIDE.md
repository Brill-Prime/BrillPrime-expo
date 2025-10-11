# Backend Implementation Guide for Brill Prime
**Generated**: October 11, 2025  
**Frontend Analysis**: Complete  
**Total Endpoints Required**: 98

---

## 🔴 CRITICAL ENDPOINTS (Must Implement First - 9 endpoints)

These are blocking core app functionality. **Without these, users cannot use the app:**

### 1. Cart System (3 endpoints) ⛔ **BLOCKING CHECKOUT**
```
GET    /api/cart                    - Get user's cart items
POST   /api/cart                    - Add item to cart  
PUT    /api/cart/{itemId}           - Update item quantity
```
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

### User Profile (3 endpoints)
```
PUT    /api/auth/profile                   - Update user profile
PUT    /api/user/password                  - Change password
DELETE /api/user/account                   - Delete user account
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
GET    /api/payment-methods                - Get user's payment methods
POST   /api/payment-methods                - Add payment method
DELETE /api/payment-methods/{id}           - Remove payment method
PUT    /api/payment-methods/{id}/default   - Set default payment method
GET    /api/payments/history               - Payment history
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

### Merchant Management (2 endpoints)
```
DELETE /api/merchants/{id}                                       - Delete merchant
DELETE /api/merchants/{merchantId}/commodities/{commodityId}     - Delete commodity
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

### Payments (2 endpoints)
```
POST   /api/payments/initialize            - Initialize Paystack payment
GET    /api/payments/verify/{reference}    - Verify payment
POST   /api/toll-payments                  - Toll gate payment
GET    /api/toll-payments                  - Get toll payments
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

**Working Endpoints (8/98):**
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login  
- ✅ POST /api/password-reset/request
- ✅ GET /api/auth/profile
- ✅ GET /api/merchants
- ✅ GET /api/orders
- ✅ GET /api/notifications
- ✅ GET /health

**Needs Implementation**: 90 endpoints
