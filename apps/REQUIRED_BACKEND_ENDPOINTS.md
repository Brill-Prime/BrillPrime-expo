# Required Backend Endpoints for Feature Implementation

This document lists all backend endpoints that need to be implemented to support the front-end features.

## 1. Profile Management (Address CRUD)

### Get User Addresses
```
GET /api/profile/addresses
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "Home",
      "street": "123 Main St",
      "city": "Lagos",
      "state": "Lagos State",
      "country": "Nigeria",
      "postalCode": "100001",
      "isDefault": true,
      "latitude": 6.5244,
      "longitude": 3.3792
    }
  ]
}
```

### Create Address
```
POST /api/profile/addresses
Authorization: Bearer {token}

Request:
{
  "label": "Home",
  "street": "123 Main St",
  "city": "Lagos",
  "state": "Lagos State",
  "country": "Nigeria",
  "postalCode": "100001",
  "isDefault": false,
  "latitude": 6.5244,
  "longitude": 3.3792
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "label": "Home",
    ...
  }
}
```

### Update Address
```
PUT /api/profile/addresses/:id
Authorization: Bearer {token}

Request: Same as Create Address

Response: Same as Create Address
```

### Delete Address
```
DELETE /api/profile/addresses/:id
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Address deleted successfully"
}
```

## 3. Payment Processing

### Initialize Payment
```
POST /api/payments/initialize
Authorization: Bearer {token}

Request:
{
  "orderId": 123,
  "amount": 5000,
  "paymentMethod": "CARD" | "BANK_TRANSFER"
}

Response:
{
  "success": true,
  "data": {
    "transactionId": "TXN123456",
    "status": "pending",
    "message": "Payment initialized successfully",
    "authorizationUrl": "https://paystack.com/pay/abc123" // For card payments
  }
}
```

### Verify Payment
```
GET /api/payments/verify/:reference
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "transactionId": "TXN123456",
    "status": "success",
    "amount": 5000,
    "paidAt": "2024-01-15T10:30:00Z"
  }
}
```

## 4. Location Services

### Get Nearby Merchants
```
GET /api/merchants/nearby?lat={latitude}&lng={longitude}&radius={radius}&type={type}

Response:
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Prime Store",
      "businessName": "Prime Store Ltd",
      "type": "fuel",
      "category": "fuel_station",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "address": "123 Main St, Lagos",
      "phone": "+2348012345678",
      "rating": 4.5,
      "reviewCount": 120,
      "isOpen": true,
      "services": ["Petrol", "Diesel", "CNG"],
      "distance": 1.2 // in km
    }
  ]
}
```

## 6. KYC Documents Upload

### Upload KYC Document
```
POST /api/kyc/documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
{
  "documentType": "ID_CARD" | "DRIVERS_LICENSE" | "PASSPORT" | "UTILITY_BILL" | "BUSINESS_REGISTRATION",
  "file": File,
  "expiryDate": "2025-12-31" // Optional, for ID documents
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "documentType": "ID_CARD",
    "fileUrl": "https://storage.brillprime.com/kyc/doc123.jpg",
    "status": "pending",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get KYC Documents
```
GET /api/kyc/documents
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "documentType": "ID_CARD",
      "fileUrl": "https://storage.brillprime.com/kyc/doc123.jpg",
      "status": "approved",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "reviewedAt": "2024-01-16T09:00:00Z"
    }
  ]
}
```

## 8. Order Tracking

### Get Order Tracking Details
```
GET /api/tracking/order/:orderId
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "order": {
      "id": "ORD123",
      "status": "out_for_delivery",
      "estimatedDelivery": "2024-01-15T15:00:00Z",
      "deliveryAddress": "123 Main St, Lagos"
    },
    "tracking": {
      "status": "out_for_delivery",
      "statusHistory": [
        {
          "status": "pending",
          "timestamp": "2024-01-15T10:00:00Z",
          "description": "Order placed"
        },
        {
          "status": "confirmed",
          "timestamp": "2024-01-15T10:15:00Z",
          "description": "Order confirmed by merchant"
        }
      ],
      "estimatedDelivery": "2024-01-15T15:00:00Z",
      "driverInfo": {
        "id": "DRV123",
        "name": "John Doe",
        "phone": "+2348012345678",
        "rating": 4.8,
        "location": {
          "latitude": 6.5244,
          "longitude": 3.3792
        }
      }
    }
  }
}
```

### Update Delivery Location (Driver)
```
POST /api/tracking/:orderId/location
Authorization: Bearer {token}

Request:
{
  "latitude": 6.5244,
  "longitude": 3.3792,
  "status": "out_for_delivery"
}

Response:
{
  "success": true,
  "message": "Location updated successfully"
}
```

## 9. Notifications

### Get User Notifications
```
GET /api/notifications?limit=20&offset=0
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "order_update",
      "title": "Order Confirmed",
      "message": "Your order #ORD123 has been confirmed",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "data": {
        "orderId": "ORD123",
        "action": "view_order"
      }
    }
  ]
}
```

### Mark Notification as Read
```
PUT /api/notifications/:id/read
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read
```
PUT /api/notifications/read-all
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Get Unread Count
```
GET /api/notifications/unread-count
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

## 16. Merchant Reviews

### Submit Review
```
POST /api/ratings
Authorization: Bearer {token}

Request:
{
  "merchantId": "1",
  "orderId": "ORD123", // Optional
  "rating": 5,
  "comment": "Great service!"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "merchantId": "1",
    "rating": 5,
    "comment": "Great service!",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Merchant Reviews
```
GET /api/ratings/merchant/:merchantId?page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalReviews": 120,
    "reviews": [
      {
        "id": 1,
        "userId": "USER123",
        "userName": "Jane Doe",
        "rating": 5,
        "comment": "Great service!",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 120,
      "totalPages": 12
    }
  }
}
```

## 17. Driver Orders

### Get Driver Orders by Status
```
GET /api/drivers/orders?status={status}
Authorization: Bearer {token}

Query Params:
- status: "available" | "accepted" | "picked_up" | "delivered" | "cancelled"

Response:
{
  "success": true,
  "data": [
    {
      "id": "ORD123",
      "customerId": "CUST123",
      "customerName": "John Doe",
      "customerPhone": "+2348012345678",
      "pickupAddress": "Prime Store, Lagos",
      "deliveryAddress": "123 Main St, Lagos",
      "items": ["Rice - 5kg", "Oil - 2L"],
      "totalAmount": 5000,
      "distance": "2.5 km",
      "estimatedDuration": "15 mins",
      "status": "available",
      "timestamp": "2024-01-15T10:30:00Z",
      "earnings": 500
    }
  ]
}
```

### Accept Order (Driver)
```
POST /api/drivers/orders/:orderId/accept
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "orderId": "ORD123",
    "status": "accepted",
    "pickupAddress": "Prime Store, Lagos",
    "customerPhone": "+2348012345678"
  }
}
```

## WebSocket Events

### Real-time Order Updates
```
Event: order_update
Data: {
  "orderId": "ORD123",
  "status": "out_for_delivery",
  "driverLocation": {
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "estimatedArrival": "2024-01-15T15:00:00Z"
}
```

### Real-time Driver Location
```
Event: driver_location_update
Data: {
  "driverId": "DRV123",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "heading": 180,
  "timestamp": "2024-01-15T14:30:00Z"
}
```

## 10. Authentication Endpoints

### POST /auth/send-otp
Send a 6-digit OTP code to user's email during registration.

**Request Body:**
```json
{
  "email": "string",
  "firebaseUid": "string",
  "name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully"
  }
}
```

**Implementation Notes:**
- Generate a random 6-digit code
- Store code with expiry time (5 minutes recommended)
- Send email with subject "Verify Your BrillPrime Account"
- Email should contain only the 6-digit code clearly displayed
- Rate limit: Max 3 OTP requests per email per 15 minutes

### POST /auth/verify-otp
Verify the OTP code entered by user.

**Request Body:**
```json
{
  "email": "string",
  "otp": "string",
  "firebaseUid": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "string",
      "phone": "string",
      "isVerified": true
    }
  }
}
```

**Implementation Notes:**
- Validate OTP code matches and hasn't expired
- Mark user as verified in database
- Return JWT token for authenticated session
- Clear OTP from storage after successful verification
- Max 5 attempts per OTP code

### POST /auth/register
Register a new user account (syncs Firebase user to backend).

**Request Body:**
```json
{
  "firebaseUid": "string",
  "role": "consumer" | "merchant" | "driver",
  "phoneNumber": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "string",
      "phone": "string",
      "isVerified": boolean
    }
  }
}
```

## 18. Driver Performance Analytics

### Get Driver Performance Metrics
```
GET /api/drivers/analytics?period={week|month|year}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "totalDeliveries": 156,
    "acceptanceRate": 94.5,
    "completionRate": 98.2,
    "averageRating": 4.8,
    "totalEarnings": 45600,
    "onTimeDeliveryRate": 96.3,
    "peakHours": [
      {
        "hour": "12:00 PM",
        "deliveries": 23,
        "earnings": 6900
      }
    ],
    "weeklyStats": [
      {
        "day": "Mon",
        "deliveries": 22,
        "earnings": 6600
      }
    ],
    "customerFeedback": {
      "positive": 142,
      "neutral": 10,
      "negative": 4
    },
    "routeEfficiency": 89.5,
    "responseTime": 3.2
  }
}
```

## 19. Dispute Resolution

### Submit Dispute
```
POST /api/disputes/submit
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
{
  "orderId": "ORD123",
  "reason": "wrong_item" | "damaged_item" | "missing_item" | "late_delivery" | "no_delivery" | "quality_issue" | "overcharge" | "other",
  "description": "Detailed description of the issue",
  "evidence": [File] // Array of images/documents
}

Response:
{
  "success": true,
  "data": {
    "disputeId": "DSP123",
    "orderId": "ORD123",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z",
    "estimatedResolutionTime": "2024-01-17T10:30:00Z"
  }
}
```

### Get Dispute Details
```
GET /api/disputes/:disputeId
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "DSP123",
    "orderId": "ORD123",
    "reason": "wrong_item",
    "description": "Received different product than ordered",
    "status": "under_review",
    "evidence": [
      {
        "url": "https://storage.brillprime.com/disputes/img1.jpg",
        "type": "image"
      }
    ],
    "timeline": [
      {
        "status": "submitted",
        "timestamp": "2024-01-15T10:30:00Z",
        "note": "Dispute submitted"
      },
      {
        "status": "under_review",
        "timestamp": "2024-01-15T12:00:00Z",
        "note": "Under review by support team"
      }
    ],
    "resolution": null,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get User Disputes
```
GET /api/disputes?status={status}&page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "disputes": [
      {
        "id": "DSP123",
        "orderId": "ORD123",
        "reason": "wrong_item",
        "status": "resolved",
        "createdAt": "2024-01-15T10:30:00Z",
        "resolvedAt": "2024-01-16T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Update Dispute (Admin)
```
PUT /api/admin/disputes/:disputeId
Authorization: Bearer {token}

Request:
{
  "status": "resolved" | "rejected" | "escalated",
  "resolution": "Refund issued",
  "adminNotes": "Customer verified. Refund processed."
}

Response:
{
  "success": true,
  "data": {
    "id": "DSP123",
    "status": "resolved",
    "resolution": "Refund issued",
    "resolvedAt": "2024-01-16T14:00:00Z"
  }
}
```

## Referral System Endpoints

### Get Referral Stats
**GET** `/api/referrals/stats`

**Headers:**
- Authorization: Bearer {token}

**Response:**
```json
{
  "referralCode": "BRILLABC123",
  "totalReferrals": 12,
  "successfulReferrals": 8,
  "pendingReferrals": 4,
  "totalEarnings": 8000,
  "rewardPerReferral": 1000,
  "referralHistory": [
    {
      "id": "ref_123",
      "name": "John Doe",
      "status": "completed",
      "reward": 1000,
      "date": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Apply Referral Code
**POST** `/api/referrals/apply`

**Body:**
```json
{
  "referralCode": "BRILLABC123"
}
```

## Scheduled Delivery Endpoints

### Get Available Time Slots
**GET** `/api/delivery/available-slots?date=2024-01-20`

**Response:**
```json
{
  "date": "2024-01-20",
  "slots": [
    {
      "id": "8-10",
      "label": "8:00 AM - 10:00 AM",
      "available": true
    }
  ]
}
```

### Schedule Delivery
**POST** `/api/delivery/schedule`

**Body:**
```json
{
  "orderId": "order_123",
  "scheduledDate": "2024-01-20",
  "timeSlot": "8-10",
  "instructions": "Leave at front door"
}
```

## Loyalty Program Endpoints

### Get Loyalty Data
**GET** `/api/loyalty/profile`

**Response:**
```json
{
  "currentPoints": 2450,
  "tier": "silver",
  "nextTier": "gold",
  "pointsToNextTier": 550,
  "lifetimePoints": 8920,
  "tierBenefits": []
}
```

### Get Available Rewards
**GET** `/api/loyalty/rewards`

**Response:**
```json
{
  "rewards": [
    {
      "id": "reward_123",
      "title": "₦500 Discount",
      "description": "Get ₦500 off your next order",
      "pointsCost": 500,
      "icon": "pricetag",
      "category": "discount"
    }
  ]
}
```

### Redeem Reward
**POST** `/api/loyalty/redeem`

**Body:**
```json
{
  "rewardId": "reward_123"
}
```

### Get Points History
**GET** `/api/loyalty/history?page=1&limit=20`

## Notes

1. All endpoints require authentication via Bearer token except public endpoints
2. Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```
3. All timestamps are in ISO 8601 format
4. Pagination uses offset/limit pattern where applicable
5. File uploads use multipart/form-data
6. WebSocket connection URL: ws://api.brillprime.com/ws?token={jwt_token}