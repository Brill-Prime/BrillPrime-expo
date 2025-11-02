
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
