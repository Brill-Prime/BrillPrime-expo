
# Missing Backend API Endpoints Documentation

This document outlines all the API endpoints that the frontend `ApiService` expects but are **NOT documented** in the current backend API specification. These endpoints need to be implemented in the backend to ensure full frontend functionality.

## 🛒 Cart Management (Missing Endpoints)

### Cart Operations
- `POST /api/cart/add` - Add item to cart
  ```json
  {
    "productId": "string",
    "quantity": number
  }
  ```

- `PUT /api/cart/{id}` - Update cart item quantity
  ```json
  {
    "quantity": number
  }
  ```

- `DELETE /api/cart/{id}` - Remove specific cart item

- `DELETE /api/cart` - Clear entire cart

**Note:** Backend only has `GET /api/cart` documented.

---

## 📦 Order Management (Missing Endpoints)

### Order Processing
- `POST /api/orders/checkout` - Create order from cart (authenticated)
- `POST /api/orders/place` - Place new order (authenticated)
  ```json
  {
    "items": [
      {
        "productId": "string",
        "quantity": number,
        "price": number
      }
    ],
    "deliveryAddress": "string",
    "paymentMethod": "string"
  }
  ```

### Order Retrieval by Role
- `GET /api/orders/consumer-orders` - Get consumer-specific orders (authenticated)
- `GET /api/orders/merchant-orders` - Get merchant-specific orders (merchant only)

### Order Management
- `PUT /api/orders/{id}/status` - Update order status (merchant only)
  ```json
  {
    "status": "pending|confirmed|preparing|ready|delivered|cancelled"
  }
  ```

- `PUT /api/orders/{id}/cancel` - Cancel order (consumer only)
- `POST /api/orders/{id}/refund` - Process order refund (merchant/admin only)
  ```json
  {
    "amount": number,
    "reason": "string"
  }
  ```

- `POST /api/orders/{id}/review` - Add order review (authenticated)
  ```json
  {
    "rating": number,
    "comment": "string"
  }
  ```

---

## 💳 Payment System (Extensive Missing Coverage)

### Payment Management
- `POST /api/payment/refund/{id}` - Process payment refund (merchant/admin)
- `POST /api/payment/dispute/{id}` - Create payment dispute (authenticated)
  ```json
  {
    "reason": "string",
    "description": "string",
    "evidence": ["string"]
  }
  ```

- `POST /api/payment/payout` - Request payout (merchant/driver)
  ```json
  {
    "amount": number,
    "bankAccount": "string"
  }
  ```

- `GET /api/payment/payout/history` - Get payout history (merchant/driver)
- `GET /api/payment/history` - Get payment history (authenticated)

### QR Payment System
- `POST /api/qr/generate` - Generate QR payment code (authenticated)
  ```json
  {
    "amount": number,
    "description": "string",
    "expiryMinutes": number
  }
  ```

- `POST /api/qr/pay/{qrId}` - Process QR payment (authenticated)
  ```json
  {
    "amount": number,
    "paymentMethod": "string"
  }
  ```

- `GET /api/qr/{qrId}` - Get QR code details (public)
- `GET /api/qr/user/codes` - Get user's QR codes (authenticated)
- `DELETE /api/qr/{qrId}` - Cancel QR code (authenticated)

### Wallet System
- `GET /api/wallet/{userId}` - Get user wallet
- `GET /api/wallet/{userId}/transactions` - Get wallet transactions
- `POST /api/wallet/{userId}/fund` - Fund wallet
  ```json
  {
    "amount": number,
    "paymentMethod": "string"
  }
  ```

- `POST /api/wallet/create` - Create wallet
  ```json
  {
    "userId": "string",
    "currency": "string"
  }
  ```

---

## 🚚 Delivery & Logistics (Completely Missing)

### Delivery Management
- `POST /api/delivery/request` - Create delivery request (authenticated)
  ```json
  {
    "orderId": "string",
    "pickupAddress": "string",
    "deliveryAddress": "string",
    "priority": "normal|urgent"
  }
  ```

- `GET /api/delivery/available` - Get available deliveries (driver only)
- `POST /api/delivery/{id}/accept` - Accept delivery request (driver only)
- `PUT /api/delivery/{id}/status` - Update delivery status (driver only)
  ```json
  {
    "status": "accepted|picked_up|in_transit|delivered"
  }
  ```

- `GET /api/delivery/my-deliveries` - Get driver deliveries (driver only)
- `GET /api/delivery/track/{trackingNumber}` - Track delivery (public)
- `GET /api/delivery/stats` - Get delivery statistics (driver only)
- `GET /api/delivery/earnings` - Get driver earnings (driver only)
- `POST /api/delivery/request-payout` - Request driver payout (driver only)
- `GET /api/delivery/{id}/route` - Get delivery route (driver only)
- `POST /api/delivery/{id}/review` - Add delivery review (authenticated)
  ```json
  {
    "rating": number,
    "comment": "string"
  }
  ```

### Driver Management
- `GET /api/drivers/dashboard` - Get driver dashboard (driver only)
- `PUT /api/drivers/status` - Update driver status (driver only)
  ```json
  {
    "status": "online|offline|busy"
  }
  ```

- `POST /api/drivers/orders/accept` - Accept order (driver only)
  ```json
  {
    "orderId": "string"
  }
  ```

- `GET /api/drivers/orders/available` - Get available orders (driver only)

### Auto Assignment
- `POST /api/auto-assignment/{orderId}/request-assignment` - Request driver assignment
- `GET /api/auto-assignment/{orderId}/assignment-status` - Get assignment status

---

## 🌍 Location & Geography

### Geographic Services
- `GET /api/geo/service-areas` - Check service availability by location
  - Query params: `lat`, `lng`
- `POST /api/geo/estimate-delivery` - Estimate delivery time
  ```json
  {
    "pickup": {"lat": number, "lng": number},
    "delivery": {"lat": number, "lng": number}
  }
  ```

- `GET /api/geo/nearby-services` - Find nearby services (authenticated)
  - Query params: `lat`, `lng`
- `POST /api/geo/optimize-route` - Route optimization for deliveries (driver only)
  ```json
  {
    "stops": [
      {"lat": number, "lng": number, "address": "string"}
    ]
  }
  ```

---

## 💬 Communication (Missing Features)

### Chat System
- `POST /api/chat/conversations` - Start conversation (authenticated)
  ```json
  {
    "participantId": "string",
    "type": "support|order|general"
  }
  ```

- `GET /api/chat/conversations` - Get user conversations (authenticated)
- `POST /api/chat/conversations/{id}/messages` - Send message (authenticated)
  ```json
  {
    "content": "string",
    "type": "text|image|file"
  }
  ```

- `GET /api/chat/conversations/{id}/messages` - Get conversation messages (authenticated)
- `GET /api/chat/conversations/{id}` - Get conversation details (authenticated)
- `PUT /api/chat/conversations/{id}/close` - Close conversation (authenticated)
- `GET /api/chat/conversations/{id}/online-users` - Get online users in conversation

### Live Chat System
- `POST /api/live-chat/conversations` - Start live chat (authenticated)
- `GET /api/live-chat/conversations` - Get live chats (authenticated)
- `GET /api/live-chat/conversations/{id}/messages` - Get live chat messages
- `POST /api/live-chat/conversations/{id}/messages` - Send live chat message

### Advanced Notifications
- `POST /api/notifications` - Create notification (authenticated)
  ```json
  {
    "title": "string",
    "message": "string",
    "type": "info|warning|success|error",
    "targetUserId": "string"
  }
  ```

- `GET /api/notifications/unread-count` - Get unread notifications count
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/{id}` - Delete notification

---

## 👥 Social Features (Completely Missing)

### Social Posts
- `POST /api/social/posts` - Create post (authenticated)
  ```json
  {
    "content": "string",
    "images": ["string"],
    "visibility": "public|private"
  }
  ```

- `GET /api/social/posts` - Get posts feed
- `GET /api/social/posts/{id}` - Get specific post
- `POST /api/social/posts/{id}/like` - Like post (authenticated)
- `POST /api/social/posts/{id}/comments` - Add comment (authenticated)
  ```json
  {
    "content": "string"
  }
  ```

- `GET /api/social/posts/{id}/comments` - Get post comments
- `PUT /api/social/posts/{id}` - Update post (authenticated)
- `DELETE /api/social/posts/{id}` - Delete post (authenticated)

---

## ⭐ Reviews & Ratings (Completely Missing)

### Review Management
- `POST /api/reviews` - Create review (authenticated)
  ```json
  {
    "targetType": "product|merchant|driver",
    "targetId": "string",
    "rating": number,
    "comment": "string"
  }
  ```

- `GET /api/reviews/product/{productId}` - Get product reviews
- `GET /api/reviews/user/{userId}` - Get user reviews
- `PUT /api/reviews/{reviewId}` - Update review (authenticated)
- `DELETE /api/reviews/{reviewId}` - Delete review (authenticated)

---

## 🔍 Search & Discovery (Completely Missing)

### Search Operations
- `GET /api/search/products` - Search products
  - Query params: `q`, `category`, `minPrice`, `maxPrice`, `rating`
- `GET /api/search/merchants` - Search merchants
  - Query params: `q`, `location`, `category`
- `GET /api/search/trending` - Get trending searches
- `POST /api/search/save` - Save search query
  ```json
  {
    "query": "string"
  }
  ```

- `GET /api/search/history` - Get search history (authenticated)
- `GET /api/search/suggestions` - Get search suggestions
  - Query params: `q`

---

## 📊 Analytics & Reporting (Enhanced)

### Business Analytics
- `GET /api/analytics/dashboard` - Get merchant dashboard analytics (merchant only)
- `GET /api/analytics/sales` - Get sales analytics (merchant only)
- `POST /api/analytics/record-daily` - Record daily analytics (merchant only)
- `GET /api/analytics/profile` - Get merchant profile analytics (merchant only)

### Realtime Analytics
- `GET /api/realtime/dashboard/stats` - Dashboard statistics (authenticated)
- `GET /api/realtime/users/{id}` - Get user by ID (authenticated)
- `GET /api/realtime/users/role/{role}` - Get users by role (authenticated)
- `GET /api/realtime/products/active` - Get active products
- `GET /api/realtime/products/seller/{sellerId}` - Get products by seller
- `GET /api/realtime/orders/user/{userId}` - Get orders by user (authenticated)
- `GET /api/realtime/orders/status/{status}` - Get orders by status (authenticated)
- `GET /api/realtime/activity/user/{userId}` - Get user recent activity (authenticated)
- `GET /api/realtime/security/fraud-alerts` - Get active fraud alerts (authenticated)

---

## 🏪 Business Management (Enhanced)

### Business Categories
- `GET /api/business-categories` - Get all business categories
- `GET /api/business-categories/{businessCategoryId}/commodities` - Get commodity categories
- `POST /api/business-categories` - Create business category (admin only)
- `POST /api/business-categories/{businessCategoryId}/commodities` - Create commodity category (admin)

### Opening Hours
- `GET /api/opening-hours/{vendorId}` - Get vendor opening hours
- `POST /api/opening-hours` - Set vendor opening hours (merchant only)
- `PUT /api/opening-hours/{dayOfWeek}` - Update day hours (merchant only)

### Commodity Management
- `GET /api/commodities/subcategories` - Get commodity subcategories
- `POST /api/commodities/add` - Add commodity (merchant only)
- `POST /api/commodities/update/{id}` - Update commodity (merchant only)
- `DELETE /api/commodities/remove/{id}` - Remove commodity (merchant only)
- `GET /api/commodities/all` - Get all commodities
- `GET /api/commodities/{id}` - Get commodity details
- `GET /api/commodities/vendor/{vendorId}` - Get vendor commodities

---

## ⛽ Fuel Services (Completely Missing)

### Fuel Orders
- `POST /api/fuel/order` - Place fuel order (authenticated)
  ```json
  {
    "fuelType": "petrol|diesel",
    "quantity": number,
    "deliveryAddress": "string"
  }
  ```

- `GET /api/fuel/orders` - Get fuel orders (authenticated)
- `GET /api/fuel/orders/{id}` - Get fuel order details
- `PUT /api/fuel/orders/{id}/cancel` - Cancel fuel order

### Fuel Inventory
- `GET /api/fuel/inventory` - Get fuel inventory
- `POST /api/fuel/inventory` - Add fuel inventory (merchant only)
- `PUT /api/fuel/inventory/{id}` - Update fuel inventory (merchant only)

### Merchant Fuel Operations
- `GET /api/fuel/merchant/orders` - Get merchant fuel orders (merchant only)
- `PUT /api/fuel/merchant/orders/{id}/status` - Update fuel order status (merchant only)

---

## 🛣️ Toll Services (Enhanced)

### Toll Operations
- `POST /api/toll/pay` - Make toll payment (authenticated)
  ```json
  {
    "locationId": "string",
    "vehicleType": "car|truck|motorcycle",
    "amount": number
  }
  ```

- `GET /api/toll/locations` - Get toll locations (public)
- `GET /api/toll/pricing/{locationId}` - Get toll pricing (public)
- `GET /api/toll/history` - Get payment history (authenticated)
- `GET /api/toll/receipt/{receiptNumber}` - Get toll receipt (public)

---

## ✅ Verification Services (Enhanced)

### User Verification
- `POST /api/verification/identity` - Submit identity verification (authenticated)
- `POST /api/verification/driver` - Submit driver verification (driver only)
- `POST /api/verification/phone` - Submit phone verification (authenticated)
- `POST /api/verification/phone/verify` - Verify phone with OTP (authenticated)
- `GET /api/verification/status` - Get verification status (authenticated)

---

## 📄 Documents & Upload Services

### Document Management
- `POST /api/receipts/generate` - Generate receipt (authenticated)
- `GET /api/receipts/{receiptNumber}` - Get receipt details
- `GET /api/receipts/user/all` - Get user's receipts (authenticated)
- `GET /api/receipts/merchant/all` - Get merchant receipts (merchant only)
- `PUT /api/receipts/{id}/update` - Update receipt (authenticated)

### Upload Services
- `POST /api/upload/image` - Upload single image (authenticated)
- `POST /api/upload/images` - Upload multiple images (authenticated)
- `POST /api/upload/document` - Upload document (authenticated)
- `GET /api/upload/{type}/{filename}` - Get uploaded file

---

## 🔒 Security & Fraud Detection (Completely Missing)

### Security Operations
- `POST /api/security/log` - Log security event (authenticated)
- `GET /api/security/logs/{userId}` - Get security logs (authenticated/admin)
- `POST /api/security/suspicious` - Report suspicious activity (authenticated)
- `POST /api/security/trusted-device` - Manage trusted device (authenticated)
- `POST /api/security/enable-2fa` - Enable 2FA (authenticated)
- `POST /api/security/disable-2fa` - Disable 2FA (authenticated)
- `GET /api/security/login-history/{userId}` - Get login history (authenticated)

---

## 📊 Reports (Completely Missing)

### Reporting System
- `POST /api/report/user/{userId}` - Report user (authenticated)
  ```json
  {
    "reason": "spam|harassment|fraud|other",
    "description": "string"
  }
  ```

- `POST /api/report/product/{productId}` - Report product (authenticated)
- `GET /api/report/my-reports` - Get user's reports (authenticated)

---

## 🧪 Testing & Development (Enhanced)

### Testing Endpoints
- `POST /api/test-email/test-smtp` - Test email configuration
- `GET /api/test-email/smtp-config` - Check email configuration
- `POST /api/test-validation/test-validation` - Test validation functions
- `GET /api/test-validation/test-db` - Test database connection
- `POST /api/test-validation/test-fraud-detection` - Test fraud detection (authenticated)
- `GET /api/test-validation/test-rate-limit` - Test rate limiting

---

## Summary

**Total Missing Endpoints: ~150+**

### Coverage Status:
- ✅ **Authentication & Social Auth** - Fully covered
- ❌ **Cart Management** - 75% missing
- ❌ **Order Management** - 60% missing
- ❌ **Payment System** - 80% missing
- ❌ **Delivery & Logistics** - 100% missing
- ❌ **Communication** - 100% missing
- ❌ **Social Features** - 100% missing
- ❌ **Reviews & Ratings** - 100% missing
- ❌ **Search & Discovery** - 100% missing
- ❌ **Business Management** - 90% missing
- ❌ **Fuel Services** - 100% missing
- ❌ **Security & Fraud** - 100% missing
- ❌ **Reports** - 100% missing

These endpoints need to be implemented in the backend to ensure full functionality of the frontend application.
