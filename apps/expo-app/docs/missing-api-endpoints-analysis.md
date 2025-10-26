# Missing Backend API Endpoints Analysis
**Analysis Date**: October 09, 2025  
**Purpose**: Identify frontend API calls that may be missing from backend

---

## Summary

| Category | Total Endpoints | Tested ✅ | Potentially Missing ⚠️ | Requires Verification 🔍 |
|----------|----------------|-----------|------------------------|-------------------------|
| Authentication | 9 | 4 | 0 | 5 |
| User Management | 4 | 1 | 0 | 3 |
| Merchants & Commodities | 8 | 1 | 1 | 6 |
| Orders | 7 | 1 | 0 | 6 |
| Payments & Transactions | 11 | 0 | 0 | 11 |
| Cart | 5 | 0 | 0 | 5 |
| Notifications | 9 | 1 | 0 | 8 |
| Location Services | 5 | 0 | 0 | 5 |
| KYC/Verification | 11 | 0 | 0 | 11 |
| Communication | 11 | 0 | 0 | 11 |
| Admin Services | 15 | 0 | 0 | 15 |
| Favorites | 3 | 0 | 0 | 3 |
| **TOTAL** | **98** | **8** | **1** | **89** |

---

## 1. Authentication Service (9 endpoints)

### ✅ Tested & Working (4)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/auth/register` | POST | ✅ Working |
| `/api/auth/login` | POST | ✅ Working |
| `/api/password-reset/request` | POST | ✅ Working |
| `/api/auth/profile` | GET | ✅ Requires auth (expected) |

### 🔍 Needs Verification (5)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/auth/social-login` | POST | Google/Apple/Facebook login | HIGH |
| `/api/auth/verify-otp` | POST | Email/phone OTP verification | HIGH |
| `/api/auth/resend-otp` | POST | Resend OTP code | MEDIUM |
| `/api/password-reset/verify-code` | POST | Verify password reset code | HIGH |
| `/api/password-reset/complete` | POST | Complete password reset | HIGH |
| `/api/jwt-tokens/logout` | POST | User logout | MEDIUM |

---

## 2. User Management (4 endpoints)

### ✅ Tested & Working (1)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/auth/profile` | GET | ✅ Working |

### 🔍 Needs Verification (3)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/auth/profile` | PUT | Update user profile | HIGH |
| `/api/user/settings` | GET/PUT | Get/Update user settings | MEDIUM |
| `/api/user/password` | PUT | Change password | HIGH |
| `/api/user/account` | DELETE | Delete user account | LOW |

---

## 3. Merchants & Commodities (8 endpoints)

### ✅ Tested & Working (1)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/merchants` | GET | ✅ Working (requires auth) |

### ⚠️ Potentially Missing (1)
| Endpoint | Method | Issue | Priority |
|----------|--------|-------|----------|
| `/api/commodities` | GET | Returned 404 during testing | HIGH |

### 🔍 Needs Verification (6)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/merchants/{id}` | GET | Get specific merchant | HIGH |
| `/api/merchants` | POST | Create merchant | MEDIUM |
| `/api/merchants/{id}` | PUT | Update merchant | MEDIUM |
| `/api/merchants/{id}` | DELETE | Delete merchant | LOW |
| `/api/merchants/{merchantId}/commodities` | GET | Get merchant's commodities | HIGH |
| `/api/merchants/{merchantId}/commodities` | POST | Add commodity to merchant | MEDIUM |
| `/api/merchants/{merchantId}/commodities/{commodityId}` | PUT | Update commodity | MEDIUM |
| `/api/merchants/{merchantId}/commodities/{commodityId}` | DELETE | Delete commodity | LOW |

---

## 4. Orders Service (7 endpoints)

### ✅ Tested & Working (1)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/orders` | GET | ✅ Working (requires auth) |

### 🔍 Needs Verification (6)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/orders` | POST | Create new order | **CRITICAL** |
| `/api/orders/{orderId}` | GET | Get order details | HIGH |
| `/api/orders/{orderId}` | PUT | Update order status | HIGH |
| `/api/orders/{orderId}/cancel` | PUT | Cancel order | HIGH |
| `/api/orders/{orderId}/tracking` | GET | Track order & driver location | HIGH |
| `/api/orders/summary` | GET | Get order statistics | MEDIUM |

---

## 5. Payments & Transactions (11 endpoints)

### 🔍 All Need Verification (11)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/payments/create-intent` | POST | Create Stripe/Paystack intent | **CRITICAL** |
| `/api/payments/process` | POST | Process payment | **CRITICAL** |
| `/api/transactions` | GET | Get transaction history | HIGH |
| `/api/transactions/{id}` | GET | Get transaction details | HIGH |
| `/api/transactions/{id}/confirm` | POST | Confirm transaction | HIGH |
| `/api/transactions/{id}/refund` | POST | Request refund | HIGH |
| `/api/payment-methods` | GET | Get user's payment methods | HIGH |
| `/api/payment-methods` | POST | Add payment method | HIGH |
| `/api/payment-methods/{id}` | DELETE | Remove payment method | MEDIUM |
| `/api/payment-methods/{id}/default` | PUT | Set default payment method | MEDIUM |
| `/api/toll-payments` | GET/POST | Toll gate payments | MEDIUM |

---

## 6. Cart Service (5 endpoints)

### 🔍 All Need Verification (5)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/cart` | GET | Get user's cart items | **CRITICAL** |
| `/api/cart` | POST | Add item to cart | **CRITICAL** |
| `/api/cart/{itemId}` | PUT | Update cart item quantity | **CRITICAL** |
| `/api/cart/{itemId}` | DELETE | Remove item from cart | HIGH |
| `/api/cart` | DELETE | Clear entire cart | MEDIUM |

**Note**: Cart is essential for the order flow!

---

## 7. Notifications (9 endpoints)

### ✅ Tested & Working (1)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/notifications` | GET | ✅ Working (requires auth) |

### 🔍 Needs Verification (8)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/notifications/{id}/read` | PUT | Mark notification as read | HIGH |
| `/api/notifications/read-all` | PUT | Mark all as read | MEDIUM |
| `/api/notifications/{id}` | DELETE | Delete notification | MEDIUM |
| `/api/notifications/register-device` | POST | Register for push notifications | HIGH |
| `/api/notifications/preferences` | GET/PUT | Manage notification settings | MEDIUM |
| `/api/notifications/history` | GET | Get notification history | LOW |
| `/api/notifications/unread-count` | GET | Get unread count | MEDIUM |

---

## 8. Location Services (5 endpoints)

### 🔍 All Need Verification (5)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/merchants/nearby` | GET | Find nearby merchants by location | **CRITICAL** |
| `/api/merchants/nearby/live` | GET | Nearby merchants with live tracking | HIGH |
| `/api/location/live` | PUT | Update user's live location | HIGH |
| `/api/location/live/{userId}` | GET | Get user's live location | HIGH |

**Note**: Critical for location-based merchant discovery!

---

## 9. KYC/Verification Service (11 endpoints)

### 🔍 All Need Verification (11)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/kyc/profile` | GET | Get KYC profile | HIGH |
| `/api/kyc/personal-info` | PUT | Update personal info | HIGH |
| `/api/kyc/business-info` | PUT | Update business info (Merchant) | HIGH |
| `/api/kyc/driver-info` | PUT | Update driver info (Driver) | HIGH |
| `/api/kyc/documents` | POST | Upload KYC documents | **CRITICAL** |
| `/api/kyc/requirements` | GET | Get KYC requirements by role | HIGH |
| `/api/kyc/submit` | POST | Submit KYC for verification | HIGH |
| `/api/kyc/status` | GET | Check verification status | HIGH |
| `/api/admin/kyc/approve` | POST | Approve KYC (Admin) | MEDIUM |
| `/api/admin/kyc/reject` | POST | Reject KYC (Admin) | MEDIUM |
| `/api/admin/kyc/batch-review` | POST | Batch review KYC (Admin) | LOW |

**Note**: Essential for Merchant and Driver onboarding!

---

## 10. Communication Service (11 endpoints)

### 🔍 All Need Verification (11)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/conversations` | GET | Get user conversations | HIGH |
| `/api/conversations` | POST | Create/get conversation | HIGH |
| `/api/conversations/{id}/messages` | GET | Get conversation messages | HIGH |
| `/api/conversations/{id}/messages` | POST | Send message | **CRITICAL** |
| `/api/conversations/{id}/read` | PUT | Mark messages as read | MEDIUM |
| `/api/conversations/{id}` | DELETE | Delete conversation | LOW |
| `/api/calls/initiate` | POST | Start voice/video call | HIGH |
| `/api/calls/{id}/answer` | PUT | Answer call | HIGH |
| `/api/calls/{id}/end` | PUT | End call | HIGH |
| `/api/calls/history` | GET | Get call history | MEDIUM |
| `/api/users/{userId}/block` | POST/DELETE | Block/Unblock user | MEDIUM |

**WebSocket**: `wss://api.brillprime.com/ws` - Real-time messaging

---

## 11. Admin Services (15 endpoints)

### 🔍 All Need Verification (15)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/admin/system-metrics` | GET | System performance metrics | MEDIUM |
| `/api/admin/analytics` | GET | Platform analytics | HIGH |
| `/api/admin/announcements` | POST | Send platform announcements | MEDIUM |
| `/api/admin/maintenance` | POST | Toggle maintenance mode | MEDIUM |
| `/api/admin/reports/export` | POST | Export data reports | LOW |
| `/api/admin/users/toggle-block` | POST | Block/Unblock users | HIGH |
| `/api/admin/dashboard/stats` | GET | Dashboard statistics | HIGH |
| `/api/admin/users` | GET | Get users with filters | HIGH |
| `/api/admin/kyc/pending` | GET | Pending KYC verifications | HIGH |
| `/api/admin/kyc/{id}/approve` | PUT | Approve KYC | HIGH |
| `/api/admin/kyc/{id}/reject` | PUT | Reject KYC | HIGH |
| `/api/admin/escrow` | GET | Escrow transactions | MEDIUM |
| `/api/admin/escrow/{id}/release` | POST | Release escrow funds | HIGH |
| `/api/admin/moderation/reports` | GET | Content reports | MEDIUM |
| `/api/admin/moderation/{reportId}/{action}` | POST | Moderation actions | MEDIUM |
| `/api/admin/users/suspend` | POST/DELETE | Suspend/Unsuspend user | HIGH |

---

## 12. Favorites Service (3 endpoints)

### 🔍 All Need Verification (3)
| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/favorites` | GET | Get user's favorite merchants | MEDIUM |
| `/api/favorites` | POST | Add merchant to favorites | MEDIUM |
| `/api/favorites/{itemId}` | DELETE | Remove from favorites | MEDIUM |

---

## Priority Breakdown

### 🔴 CRITICAL - Must Have (9 endpoints)
**Without these, core app functionality will not work:**

1. **Order Creation**: `POST /api/orders` - Users can't place orders
2. **Payment Processing**: `POST /api/payments/process` - Can't complete transactions
3. **Payment Intent**: `POST /api/payments/create-intent` - Stripe/Paystack integration
4. **Cart Operations**: 
   - `GET /api/cart` - View cart
   - `POST /api/cart` - Add to cart
   - `PUT /api/cart/{itemId}` - Update quantities
5. **Location**: `GET /api/merchants/nearby` - Can't find nearby merchants
6. **Messaging**: `POST /api/conversations/{id}/messages` - Can't send messages
7. **KYC Documents**: `POST /api/kyc/documents` - Merchants/Drivers can't verify

### 🟠 HIGH Priority (47 endpoints)
**Important for full user experience:**
- Authentication flows (OTP, password reset, social login)
- Order tracking and management
- Transaction history
- Notification management
- KYC verification process
- Communication features
- Admin user management

### 🟡 MEDIUM Priority (32 endpoints)
**Nice to have, enhances experience:**
- User settings
- Notification preferences
- Admin analytics
- Merchant management
- Payment method management

### 🟢 LOW Priority (10 endpoints)
**Can be added later:**
- Account deletion
- Notification history
- Some admin tools

---

## Recommended Backend Implementation Order

### Phase 1: Core E-Commerce (Week 1)
```
1. Cart endpoints (5)
2. Order creation and tracking (7)
3. Payment processing (4)
4. Merchant/commodity display (4)
Total: 20 endpoints
```

### Phase 2: Location & Discovery (Week 2)
```
5. Location services (5)
6. Nearby merchants (2)
7. Live tracking (2)
Total: 9 endpoints
```

### Phase 3: Communication (Week 3)
```
8. Chat/messaging (6)
9. Voice calls (4)
10. WebSocket support (1)
Total: 11 endpoints
```

### Phase 4: User Verification (Week 4)
```
11. KYC endpoints (8)
12. Document upload (1)
13. Verification status (2)
Total: 11 endpoints
```

### Phase 5: Enhanced Features (Week 5)
```
14. Notifications (9)
15. Favorites (3)
16. User settings (4)
Total: 16 endpoints
```

### Phase 6: Admin Panel (Week 6)
```
17. Admin dashboard (15)
18. Moderation tools (4)
Total: 19 endpoints
```

---

## Testing Recommendations

### Immediate Actions:
1. **Test with authentication token** - Create a real user and test authenticated endpoints
2. **Verify commodities endpoint** - Fix or implement `/api/commodities`
3. **Test cart flow** - Critical for orders

### For Each Endpoint:
- [ ] Verify endpoint exists (returns non-404)
- [ ] Test with valid authentication
- [ ] Test request/response format
- [ ] Verify error handling
- [ ] Test role-based access (Consumer/Merchant/Driver/Admin)

---

## Quick Test Script

You can use this to quickly test all endpoints:

```bash
# Set your auth token
TOKEN="your_jwt_token_here"

# Test critical endpoints
curl -H "Authorization: Bearer $TOKEN" https://api.brillprime.com/api/cart
curl -H "Authorization: Bearer $TOKEN" https://api.brillprime.com/api/orders
curl -H "Authorization: Bearer $TOKEN" https://api.brillprime.com/api/merchants/nearby?lat=6.5244&lng=3.3792
curl -H "Authorization: Bearer $TOKEN" https://api.brillprime.com/api/commodities
```

---

## Conclusion

**Total API Endpoints Expected**: 98  
**Currently Verified**: 8 (8%)  
**Need Implementation/Verification**: 90 (92%)

**Most Critical Missing**:
1. ⚠️ `/api/commodities` - Confirmed 404
2. 🔍 Complete cart system (5 endpoints)
3. 🔍 Order creation flow (critical path)
4. 🔍 Payment processing (Stripe/Paystack)
5. 🔍 Location-based merchant discovery

**Next Steps**:
1. Implement/verify the 9 CRITICAL endpoints first
2. Test with real user authentication
3. Follow the 6-phase implementation plan
4. Build automated testing suite
