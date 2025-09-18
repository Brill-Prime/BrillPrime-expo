
# BrillPrime Backend API Endpoints

## Base URL
```
https://your-app-name.replit.app
```

## Authentication
Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication & Authorization

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `PUT /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/initiate-mfa` - Setup 2FA
- `POST /api/auth/verify-mfa` - Verify 2FA setup
- `POST /api/auth/login-mfa` - Login with 2FA

### Admin Auth Routes (`/admin/auth`)
- `POST /admin/auth/register` - Register admin user (requires admin key)
- `POST /admin/auth/login` - Admin login
- `POST /admin/auth/logout` - Admin logout
- `POST /admin/auth/reset-password` - Admin password reset

### Social Auth Routes (`/api/social-auth`)
- `GET /api/social-auth/google` - Google OAuth login
- `GET /api/social-auth/google/callback` - Google OAuth callback
- `GET /api/social-auth/facebook` - Facebook OAuth login
- `GET /api/social-auth/facebook/callback` - Facebook OAuth callback
- `POST /api/social-auth/apple` - Apple Sign-In

---

## 👤 User Management

### Users Routes (`/api/users`)
- `GET /api/users/profile` - Get user profile (authenticated)
- `PUT /api/users/profile` - Update user profile (authenticated)
- `GET /api/users/merchants` - Get all merchants (public)
- `GET /api/users/merchants/:id` - Get merchant details (public)
- `PUT /api/users/merchant-profile` - Update merchant profile (merchant only)
- `PUT /api/users/driver-profile` - Update driver profile (driver only)
- `POST /api/users/location` - Update user location (authenticated)
- `PUT /api/users/role` - Switch user role (authenticated)
- `GET /api/users/search` - Search users (query: q, type, page, limit)

---

## 🛒 E-commerce Core

### Products Routes (`/api/products`)
- `GET /api/products` - Get all products with filters (public)
- `GET /api/products/:id` - Get single product (public)
- `POST /api/products` - Create product (merchant only)
- `PUT /api/products/:id` - Update product (product owner only)
- `DELETE /api/products/:id` - Delete product (product owner only)
- `GET /api/products/categories` - Get all categories (public)
- `POST /api/products/categories` - Create category (merchant only)
- `GET /api/products/seller/:sellerId` - Get products by seller (public)

### Cart Routes (`/api/cart`)
- `GET /api/cart` - Get user cart (authenticated)
- `POST /api/cart/add` - Add item to cart (authenticated)
- `PUT /api/cart/:id` - Update cart item quantity (authenticated)
- `DELETE /api/cart/:id` - Remove item from cart (authenticated)
- `DELETE /api/cart` - Clear cart (authenticated)

### Orders Routes (`/api/orders`)
- `POST /api/orders/checkout` - Create order from cart (authenticated)
- `POST /api/orders/place` - Place order (authenticated)
- `GET /api/orders/my-orders` - Get user orders (authenticated)
- `GET /api/orders/consumer-orders` - Get consumer orders (authenticated)
- `GET /api/orders/merchant-orders` - Get merchant orders (merchant only)
- `PUT /api/orders/:id/status` - Update order status (merchant only)
- `PUT /api/orders/:id/cancel` - Cancel order (consumer only)
- `POST /api/orders/:id/refund` - Process refund (merchant/admin only)
- `POST /api/orders/:id/review` - Add order review (authenticated)
- `GET /api/orders/:id` - Get order details (authenticated)

---

## 💳 Payment System

### Payment Routes (`/api/payment`)
- `POST /api/payment/initialize` - Initialize payment transaction (authenticated)
- `POST /api/payment/verify` - Verify payment transaction (authenticated)
- `GET /api/payment/callback` - Payment callback handling
- `POST /api/payment/webhook` - Payment webhook endpoint
- `POST /api/payment/refund/:id` - Process payment refund (merchant/admin)
- `POST /api/payment/dispute/:id` - Create payment dispute (authenticated)
- `POST /api/payment/payout` - Request payout (merchant/driver)
- `GET /api/payment/payout/history` - Get payout history (merchant/driver)
- `GET /api/payment/history` - Get payment history (authenticated)

### QR Payments Routes (`/api/qr`)
- `POST /api/qr/generate` - Generate QR payment code (authenticated)
- `POST /api/qr/pay/:qrId` - Process QR payment (authenticated)
- `GET /api/qr/:qrId` - Get QR code details (public)
- `GET /api/qr/user/codes` - Get user's QR codes (authenticated)
- `DELETE /api/qr/:qrId` - Cancel QR code (authenticated)

### Wallet Routes (`/api/wallet`)
- `GET /api/wallet/:userId` - Get user wallet
- `GET /api/wallet/:userId/transactions` - Get wallet transactions
- `POST /api/wallet/:userId/fund` - Fund wallet
- `POST /api/wallet/create` - Create wallet

---

## 🚚 Delivery & Logistics

### Delivery Routes (`/api/delivery`)
- `POST /api/delivery/request` - Create delivery request (authenticated)
- `GET /api/delivery/available` - Get available deliveries (driver only)
- `POST /api/delivery/:id/accept` - Accept delivery request (driver only)
- `PUT /api/delivery/:id/status` - Update delivery status (driver only)
- `GET /api/delivery/my-deliveries` - Get driver deliveries (driver only)
- `GET /api/delivery/track/:trackingNumber` - Track delivery (public)
- `GET /api/delivery/stats` - Get delivery statistics (driver only)
- `GET /api/delivery/earnings` - Get driver earnings (driver only)
- `POST /api/delivery/request-payout` - Request payout (driver only)
- `GET /api/delivery/:id/route` - Get delivery route (driver only)
- `POST /api/delivery/:id/review` - Add delivery review (authenticated)

### Driver Management Routes (`/api/drivers`)
- `GET /api/drivers/dashboard` - Get driver dashboard (driver only)
- `PUT /api/drivers/status` - Update driver status (driver only)
- `POST /api/drivers/orders/accept` - Accept order (driver only)
- `GET /api/drivers/orders/available` - Get available orders (driver only)

### Auto Assignment Routes (`/api/auto-assignment`)
- `POST /api/auto-assignment/:orderId/request-assignment` - Request driver assignment
- `GET /api/auto-assignment/:orderId/assignment-status` - Get assignment status

---

## 🌍 Location & Geography

### Geo Routes (`/api/geo`)
- `GET /api/geo/service-areas` - Check service availability by location
- `POST /api/geo/estimate-delivery` - Estimate delivery time
- `GET /api/geo/nearby-services` - Find nearby services (authenticated)
- `POST /api/geo/optimize-route` - Route optimization for deliveries (driver only)

---

## 💬 Communication

### Chat Routes (`/api/chat`)
- `POST /api/chat/conversations` - Start conversation (authenticated)
- `GET /api/chat/conversations` - Get user conversations (authenticated)
- `POST /api/chat/conversations/:id/messages` - Send message (authenticated)
- `GET /api/chat/conversations/:id/messages` - Get conversation messages (authenticated)
- `GET /api/chat/conversations/:id` - Get conversation details (authenticated)
- `PUT /api/chat/conversations/:id/close` - Close conversation (authenticated)
- `GET /api/chat/conversations/:id/online-users` - Get online users in conversation

### Live Chat Routes (`/api/live-chat`)
- `POST /api/live-chat/conversations` - Start new conversation (authenticated)
- `GET /api/live-chat/conversations` - Get user conversations (authenticated)
- `GET /api/live-chat/conversations/:id/messages` - Get conversation messages (authenticated)
- `POST /api/live-chat/conversations/:id/messages` - Send message (authenticated)
- `GET /api/live-chat/admin/conversations` - Get all conversations (admin only)
- `POST /api/live-chat/admin/conversations/:id/assign` - Assign conversation to agent (admin)
- `POST /api/live-chat/admin/conversations/:id/close` - Close conversation (admin)
- `GET /api/live-chat/admin/stats` - Get chat statistics (admin)

### Notifications Routes (`/api/notifications`)
- `GET /api/notifications` - Get notifications (authenticated)
- `PUT /api/notifications/:id/read` - Mark notification as read (authenticated)
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read (authenticated)
- `GET /api/notifications/unread-count` - Get unread notifications count (authenticated)
- `POST /api/notifications` - Create notification (internal/system use)
- `DELETE /api/notifications/:id` - Delete notification (authenticated)

---

## 📱 Social Features

### Social Routes (`/api/social`)
- `POST /api/social/posts` - Create vendor post (merchant only)
- `GET /api/social/posts` - Get vendor posts feed (public)
- `GET /api/social/posts/:id` - Get single post (public)
- `POST /api/social/posts/:id/like` - Like/unlike post (authenticated)
- `POST /api/social/posts/:id/comments` - Add comment to post (authenticated)
- `GET /api/social/posts/:id/comments` - Get post comments (public)
- `PUT /api/social/posts/:id` - Update post (post owner only)
- `DELETE /api/social/posts/:id` - Delete post (post owner only)

---

## ⭐ Reviews & Ratings

### Reviews Routes (`/api/reviews`)
- `POST /api/reviews` - Create review (authenticated)
- `GET /api/reviews/product/:productId` - Get product reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `PUT /api/reviews/:reviewId` - Update review (review owner)
- `DELETE /api/reviews/:reviewId` - Delete review (review owner)

---

## 🔍 Search & Discovery

### Search Routes (`/api/search`)
- `GET /api/search/products` - Advanced product search
- `GET /api/search/merchants` - Search merchants/vendors
- `GET /api/search/trending` - Get trending searches
- `POST /api/search/save` - Save search query (authenticated)
- `GET /api/search/history` - Get search history (authenticated)
- `GET /api/search/suggestions` - Get search suggestions

---

## 📊 Analytics & Reporting

### Analytics Routes (`/api/analytics`)
- `GET /api/analytics/dashboard` - Get merchant dashboard analytics (merchant only)
- `GET /api/analytics/sales` - Get sales analytics (merchant only)
- `POST /api/analytics/record-daily` - Record daily analytics (merchant only)
- `GET /api/analytics/profile` - Get merchant profile analytics (merchant only)

---

## 🏪 Business Management

### Business Categories Routes (`/api/business-categories`)
- `GET /api/business-categories` - Get all business categories
- `GET /api/business-categories/:businessCategoryId/commodities` - Get commodity categories
- `POST /api/business-categories` - Create business category (admin only)
- `POST /api/business-categories/:businessCategoryId/commodities` - Create commodity category (admin)

### Opening Hours Routes (`/api/opening-hours`)
- `GET /api/opening-hours/:vendorId` - Get vendor opening hours
- `POST /api/opening-hours` - Set vendor opening hours (merchant only)
- `PUT /api/opening-hours/:dayOfWeek` - Update specific day hours (merchant only)

### Commodities Routes (`/api/commodities`)
- `GET /api/commodities/subcategories` - Get subcategories with search
- `POST /api/commodities/add` - Add commodity (merchant only)
- `POST /api/commodities/update/:id` - Update commodity (vendor only)
- `DELETE /api/commodities/remove/:id` - Remove commodity (vendor only)
- `GET /api/commodities/all` - Get all commodities (authenticated)
- `GET /api/commodities/:id` - Get single commodity (authenticated)
- `GET /api/commodities/vendor/:id` - Get vendor commodities (authenticated)

---

## ⛽ Fuel Services

### Fuel Routes (`/api/fuel`)
- `POST /api/fuel/order` - Place fuel order (authenticated)
- `GET /api/fuel/orders` - Get user's fuel orders (authenticated)
- `GET /api/fuel/orders/:id` - Get fuel order details (authenticated)
- `PUT /api/fuel/orders/:id/cancel` - Cancel fuel order (authenticated)
- `GET /api/fuel/inventory` - Get fuel inventory (public)
- `POST /api/fuel/inventory` - Add fuel inventory (merchant only)
- `PUT /api/fuel/inventory/:id` - Update fuel inventory (merchant only)
- `GET /api/fuel/merchant/orders` - Get merchant fuel orders (merchant only)
- `PUT /api/fuel/merchant/orders/:id/status` - Update fuel order status (merchant only)

---

## 🛣️ Toll Services

### Toll Routes (`/api/toll`)
- `POST /api/toll/pay` - Make toll payment (authenticated)
- `GET /api/toll/locations` - Get toll locations (public)
- `GET /api/toll/pricing/:locationId` - Get toll pricing (public)
- `GET /api/toll/history` - Get payment history (authenticated)
- `GET /api/toll/receipt/:receiptNumber` - Get toll receipt (public)
- `POST /api/toll/admin/locations` - Add toll location (admin only)
- `PUT /api/toll/admin/locations/:id` - Update toll location (admin only)
- `POST /api/toll/admin/pricing` - Set toll pricing (admin only)

---

## 🎫 Support & Tickets

### Support Routes (`/api/support`)
- `POST /api/support/tickets` - Create support ticket (public/authenticated)
- `GET /api/support/tickets` - Get user support tickets (authenticated)
- `GET /api/support/tickets/:id` - Get ticket details (authenticated/public with email)
- `PUT /api/support/tickets/:id` - Update ticket (admin only)
- `GET /api/support/admin/tickets` - Get all tickets (admin only)
- `GET /api/support/admin/stats` - Get support statistics (admin only)

---

## ✅ Verification Services

### Verification Routes (`/api/verification`)
- `POST /api/verification/identity` - Submit identity verification (authenticated)
- `POST /api/verification/driver` - Submit driver verification (driver only)
- `POST /api/verification/phone` - Submit phone verification (authenticated)
- `POST /api/verification/phone/verify` - Verify phone with OTP (authenticated)
- `GET /api/verification/status` - Get verification status (authenticated)
- `GET /api/verification/admin/pending` - Get pending verifications (admin only)
- `PUT /api/verification/admin/:id/approve` - Approve verification (admin only)
- `PUT /api/verification/admin/:id/reject` - Reject verification (admin only)

---

## 📄 Documents & Receipts

### Receipts Routes (`/api/receipts`)
- `POST /api/receipts/generate` - Generate receipt (authenticated)
- `GET /api/receipts/:receiptNumber` - Get receipt details
- `GET /api/receipts/user/all` - Get user's receipts (authenticated)
- `GET /api/receipts/merchant/all` - Get merchant receipts (merchant only)
- `PUT /api/receipts/:id/update` - Update receipt (authenticated)

### Upload Routes (`/api/upload`)
- `POST /api/upload/image` - Upload single image (authenticated)
- `POST /api/upload/images` - Upload multiple images (authenticated)
- `POST /api/upload/document` - Upload document (authenticated)
- `GET /api/upload/:type/:filename` - Get uploaded file

---

## 🛡️ Security & Fraud Detection

### Security Routes (`/api/security`)
- `POST /api/security/log` - Log security event
- `GET /api/security/logs/:userId` - Get security logs for user
- `POST /api/security/suspicious` - Report suspicious activity
- `POST /api/security/trusted-device` - Manage trusted devices
- `POST /api/security/enable-2fa` - Enable 2FA
- `POST /api/security/disable-2fa` - Disable 2FA
- `POST /api/security/change-password` - Change password
- `GET /api/security/login-history/:userId` - Get login history

### Fraud Detection Routes (`/api/fraud`)
- `GET /api/fraud/alerts` - Get fraud alerts (admin only)
- `GET /api/fraud/stats` - Get fraud statistics (admin only)
- `GET /api/fraud/activities` - Get suspicious activities (admin only)
- `POST /api/fraud/alerts/:alertId/investigate` - Investigate alert (admin only)
- `POST /api/fraud/alerts/:alertId/resolve` - Resolve alert (admin only)
- `POST /api/fraud/users/:userId/flag` - Flag user account (admin only)
- `POST /api/fraud/alerts/bulk-action` - Bulk actions on alerts (admin only)

---

## 📊 Admin & Management

### Admin Routes (`/api/admin`)
- `GET /api/admin/dashboard` - Admin dashboard (admin only)
- `GET /api/admin/users` - Get all users with filters (admin only)
- `PUT /api/admin/users/:id/verify` - Verify user identity (admin only)
- `GET /api/admin/analytics/platform` - Platform-wide analytics (admin only)
- `GET /api/admin/drivers/verification-requests` - Driver verification requests (admin only)
- `PUT /api/admin/users/:id/status` - Suspend/activate user (admin only)
- `GET /api/admin/system/health` - System health metrics (admin only)

### Admin User Management Routes (`/api/admin/users`)
- `GET /api/admin/users` - Get users with filtering and pagination (admin only)
- `GET /api/admin/users/:userId` - Get user details (admin only)
- `PUT /api/admin/users/:userId` - Update user (admin only)
- `POST /api/admin/users/bulk-action` - Bulk actions on users (admin only)
- `POST /api/admin/users/:userId/reset-password` - Reset user password (admin only)
- `GET /api/admin/users/:userId/analytics` - Get user analytics (admin only)

### Content Moderation Routes (`/api/moderation`)
- `GET /api/moderation/reports` - Get moderation reports (admin only)
- `POST /api/moderation/reports/:id/action` - Take action on report (admin only)
- `POST /api/moderation/reports/bulk-action` - Bulk action on reports (admin only)
- `GET /api/moderation/stats` - Get moderation statistics (admin only)

### System Monitoring Routes (`/api/system`)
- `GET /api/system/health` - System health check (admin only)
- `GET /api/system/metrics/realtime` - Real-time metrics (admin only)
- `GET /api/system/performance` - Performance metrics (admin only)
- `GET /api/system/errors` - Error logs (admin only)

---

## 📊 Reports & Analytics

### Reports Routes (`/api/report`)
- `POST /api/report/user/:id` - Report a user (authenticated)
- `POST /api/report/product/:id` - Report a product (authenticated)
- `GET /api/report/my-reports` - Get user's reports (authenticated)
- `GET /api/report/admin/all` - Get all reports (admin only)
- `PUT /api/report/admin/:id/status` - Update report status (admin only)
- `POST /api/report/admin/bulk-action` - Bulk action on reports (admin only)

### Realtime API Routes (`/api/realtime`)
- `GET /api/realtime/health` - Health check
- `GET /api/realtime/dashboard/stats` - Dashboard statistics (authenticated)
- `GET /api/realtime/users/:id` - Get user by ID (authenticated)
- `GET /api/realtime/users/role/:role` - Get users by role (authenticated)
- `GET /api/realtime/products/active` - Get active products
- `GET /api/realtime/products/seller/:sellerId` - Get products by seller
- `GET /api/realtime/orders/user/:userId` - Get orders by user (authenticated)
- `GET /api/realtime/orders/status/:status` - Get orders by status (authenticated)
- `GET /api/realtime/activity/user/:userId` - Get user recent activity (authenticated)
- `GET /api/realtime/security/fraud-alerts` - Get active fraud alerts (authenticated)

---

## 🧪 Testing & Development

### Test Routes (`/api/test-email`)
- `POST /api/test-email/test-smtp` - Test email configuration
- `GET /api/test-email/smtp-config` - Check email configuration

### Test Validation Routes (`/api/test-validation`)
- `POST /api/test-validation/test-validation` - Test validation functions
- `GET /api/test-validation/test-db` - Test database connection
- `POST /api/test-validation/test-fraud-detection` - Test fraud detection (authenticated)
- `GET /api/test-validation/test-rate-limit` - Test rate limiting

---

## 🌐 Health & Status

### Health Endpoints
- `GET /` - Root endpoint with API info
- `GET /health` - Health check endpoint
- `GET /api` - API documentation endpoint

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Success Responses

Most endpoints return responses in this format:

```json
{
  "status": "Success",
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Upload endpoints: 10 requests per 5 minutes

## Pagination

List endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination info:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
