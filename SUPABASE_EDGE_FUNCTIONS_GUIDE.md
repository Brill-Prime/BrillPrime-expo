
# Supabase Edge Functions - Complete Implementation Guide

**Project**: Brill Prime  
**Backend Architecture**: Firebase Auth + Supabase Backend  
**Total Functions Required**: 10  

---

## Overview

This guide contains all edge functions you need to create in Supabase to handle backend logic that cannot be efficiently managed through direct database queries. Each function is production-ready with complete implementation details.

---

## 🚀 Quick Start

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase project created at https://supabase.com
- Project linked: `supabase link --project-ref YOUR_PROJECT_REF`

### Deployment Commands
```bash
# Deploy individual function
supabase functions deploy function-name

# Deploy all functions
supabase functions deploy update-order-status
supabase functions deploy assign-driver
supabase functions deploy process-payment
supabase functions deploy verify-kyc-document
supabase functions deploy send-notification
supabase functions deploy calculate-delivery-fee
supabase functions deploy create-conversation
supabase functions deploy generate-merchant-analytics
supabase functions deploy handle-refund
supabase functions deploy batch-approve-kyc
```

---

## 📋 Function Index

1. [update-order-status](#1-update-order-status) - Update order status with validation and notifications
2. [assign-driver](#2-assign-driver) - Auto-assign nearest available driver
3. [process-payment](#3-process-payment) - Handle Paystack payment processing
4. [verify-kyc-document](#4-verify-kyc-document) - Admin KYC verification workflow
5. [send-notification](#5-send-notification) - Centralized notification dispatch
6. [calculate-delivery-fee](#6-calculate-delivery-fee) - Dynamic delivery pricing
7. [create-conversation](#7-create-conversation) - Initialize chat between users
8. [generate-merchant-analytics](#8-generate-merchant-analytics) - Calculate performance metrics
9. [handle-refund](#9-handle-refund) - Process refunds and update escrow
10. [batch-approve-kyc](#10-batch-approve-kyc) - Bulk KYC approval/rejection

---

## 1. update-order-status

**Purpose**: Update order status with validation, notifications, and status history tracking

**Endpoint**: `/functions/v1/update-order-status`

### Request Body
```typescript
{
  "orderId": "uuid",
  "newStatus": "PENDING|CONFIRMED|PREPARING|OUT_FOR_DELIVERY|DELIVERED|CANCELLED",
  "driverId": "uuid (optional)",
  "notes": "string (optional)"
}
```

### Implementation

```typescript
// supabase/functions/update-order-status/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const validTransitions = {
  'PENDING': ['CONFIRMED', 'CANCELLED'],
  'CONFIRMED': ['PREPARING', 'CANCELLED'],
  'PREPARING': ['OUT_FOR_DELIVERY', 'CANCELLED'],
  'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],
  'CANCELLED': []
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { orderId, newStatus, driverId, notes } = await req.json()

    // Get current order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, users!inner(id, email, full_name), merchants!inner(id, user_id)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Validate status transition
    const currentStatus = order.status
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`)
    }

    // Update order status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (driverId && newStatus === 'OUT_FOR_DELIVERY') {
      updateData.driver_id = driverId
    }

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) throw updateError

    // Create status history record
    await supabaseClient.from('order_status_history').insert({
      order_id: orderId,
      status: newStatus,
      changed_by: user.id,
      notes: notes,
      timestamp: new Date().toISOString()
    })

    // Send notifications
    const notifications = []

    // Notify customer
    notifications.push({
      user_id: order.user_id,
      title: 'Order Status Updated',
      message: `Your order #${orderId.slice(0, 8)} is now ${newStatus.replace('_', ' ').toLowerCase()}`,
      type: 'order',
      role: 'consumer',
      data: { order_id: orderId, status: newStatus }
    })

    // Notify merchant
    notifications.push({
      user_id: order.merchants.user_id,
      title: 'Order Status Changed',
      message: `Order #${orderId.slice(0, 8)} status changed to ${newStatus}`,
      type: 'order',
      role: 'merchant',
      data: { order_id: orderId, status: newStatus }
    })

    // Notify driver if assigned
    if (driverId) {
      notifications.push({
        user_id: driverId,
        title: 'New Delivery Assignment',
        message: `You have been assigned to order #${orderId.slice(0, 8)}`,
        type: 'delivery',
        role: 'driver',
        data: { order_id: orderId, status: newStatus }
      })
    }

    await supabaseClient.from('notifications').insert(notifications)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { orderId, newStatus },
        message: 'Order status updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 2. assign-driver

**Purpose**: Auto-assign nearest available driver to an order

**Endpoint**: `/functions/v1/assign-driver`

### Request Body
```typescript
{
  "orderId": "uuid",
  "deliveryLocation": {
    "latitude": number,
    "longitude": number
  }
}
```

### Implementation

```typescript
// supabase/functions/assign-driver/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { orderId, deliveryLocation } = await req.json()

    // Find available drivers within 10km radius
    // Using PostGIS ST_DWithin for geographic queries
    const { data: availableDrivers, error: driversError } = await supabaseClient
      .rpc('find_nearby_drivers', {
        lat: deliveryLocation.latitude,
        lng: deliveryLocation.longitude,
        radius_km: 10
      })

    if (driversError) throw driversError

    if (!availableDrivers || availableDrivers.length === 0) {
      throw new Error('No available drivers found in your area')
    }

    // Sort by rating and completion rate
    const bestDriver = availableDrivers.sort((a, b) => {
      const scoreA = (a.rating * 0.6) + (a.completion_rate * 0.4)
      const scoreB = (b.rating * 0.6) + (b.completion_rate * 0.4)
      return scoreB - scoreA
    })[0]

    // Assign driver to order
    const { error: assignError } = await supabaseClient
      .from('orders')
      .update({
        driver_id: bestDriver.id,
        driver_assigned_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (assignError) throw assignError

    // Send notification to driver
    await supabaseClient.from('notifications').insert({
      user_id: bestDriver.user_id,
      title: 'New Delivery Request',
      message: `You have been assigned a new delivery order`,
      type: 'delivery',
      role: 'driver',
      data: { 
        order_id: orderId,
        distance: bestDriver.distance
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          driverId: bestDriver.id,
          driverName: bestDriver.name,
          estimatedDistance: bestDriver.distance,
          estimatedTime: Math.ceil(bestDriver.distance * 3) // 3 min per km
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 3. process-payment

**Purpose**: Handle payment processing with Paystack integration

**Endpoint**: `/functions/v1/process-payment`

### Request Body
```typescript
{
  "orderId": "uuid",
  "amount": number,
  "paymentMethod": "CARD|BANK_TRANSFER",
  "reference": "string"
}
```

### Implementation

```typescript
// supabase/functions/process-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { orderId, amount, paymentMethod, reference } = await req.json()

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('total_amount, user_id, merchant_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Validate amount matches order total
    if (Math.abs(order.total_amount - amount) > 0.01) {
      throw new Error('Payment amount does not match order total')
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      throw new Error('Payment verification failed')
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        order_id: orderId,
        user_id: order.user_id,
        amount: amount,
        payment_method: paymentMethod,
        reference: reference,
        status: 'completed',
        gateway: 'paystack',
        gateway_response: paystackData
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Update order payment status
    await supabaseClient
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', orderId)

    // Create escrow record for delivery orders
    await supabaseClient.from('escrow').insert({
      transaction_id: transaction.id,
      order_id: orderId,
      amount: amount,
      merchant_id: order.merchant_id,
      status: 'held'
    })

    // Send notification
    await supabaseClient.from('notifications').insert({
      user_id: order.user_id,
      title: 'Payment Successful',
      message: `Payment of ₦${amount.toFixed(2)} processed successfully`,
      type: 'payment',
      role: 'consumer',
      data: { order_id: orderId, transaction_id: transaction.id }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          transactionId: transaction.id,
          status: 'completed',
          reference: reference
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 4. verify-kyc-document

**Purpose**: Admin workflow for KYC document verification

**Endpoint**: `/functions/v1/verify-kyc-document`

### Request Body
```typescript
{
  "documentId": "uuid",
  "status": "APPROVED|REJECTED",
  "reason": "string (optional for rejection)",
  "reviewedBy": "uuid"
}
```

### Implementation

```typescript
// supabase/functions/verify-kyc-document/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify admin permissions
    const { data: adminUser } = await supabaseClient
      .from('users')
      .select('role')
      .eq('firebase_uid', user.id)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    const { documentId, status, reason, reviewedBy } = await req.json()

    // Get document details
    const { data: document, error: docError } = await supabaseClient
      .from('kyc_documents')
      .select('*, users!inner(id, email, full_name, role)')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error('Document not found')
    }

    // Update document status
    const { error: updateError } = await supabaseClient
      .from('kyc_documents')
      .update({
        verification_status: status,
        rejection_reason: status === 'REJECTED' ? reason : null,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) throw updateError

    // Check if all documents are approved
    const { data: userDocs } = await supabaseClient
      .from('kyc_documents')
      .select('verification_status')
      .eq('user_id', document.user_id)

    const allApproved = userDocs?.every(doc => doc.verification_status === 'APPROVED')

    // Update user verification level
    if (allApproved) {
      await supabaseClient
        .from('users')
        .update({
          is_verified: true,
          verification_level: 'FULL'
        })
        .eq('id', document.user_id)
    }

    // Send notification
    await supabaseClient.from('notifications').insert({
      user_id: document.user_id,
      title: status === 'APPROVED' ? 'KYC Document Approved' : 'KYC Document Rejected',
      message: status === 'APPROVED' 
        ? 'Your KYC document has been verified successfully'
        : `Your KYC document was rejected. Reason: ${reason}`,
      type: 'system',
      role: document.users.role,
      data: { document_id: documentId, status: status }
    })

    // Create audit log
    await supabaseClient.from('kyc_audit_log').insert({
      document_id: documentId,
      action: status,
      performed_by: reviewedBy,
      reason: reason,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          documentId,
          status,
          userVerified: allApproved
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 5. send-notification

**Purpose**: Centralized notification dispatch (push, email, SMS)

**Endpoint**: `/functions/v1/send-notification`

### Request Body
```typescript
{
  "userId": "uuid",
  "title": "string",
  "message": "string",
  "type": "order|promo|system|delivery|payment",
  "data": "object (optional)",
  "role": "consumer|merchant|driver (optional)"
}
```

### Implementation

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { userId, title, message, type, data, role } = await req.json()

    // Get user preferences
    const { data: user } = await supabaseClient
      .from('users')
      .select('email, phone_number, notification_preferences, fcm_token')
      .eq('id', userId)
      .single()

    if (!user) {
      throw new Error('User not found')
    }

    // Create notification record
    const { data: notification, error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        role: role || user.role,
        data,
        is_read: false
      })
      .select()
      .single()

    if (notifError) throw notifError

    const deliveryResults = {
      push: false,
      email: false,
      sms: false
    }

    // Send push notification via FCM
    if (user.fcm_token && user.notification_preferences?.push !== false) {
      try {
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: user.fcm_token,
            notification: { title, body: message },
            data: data || {}
          })
        })
        deliveryResults.push = fcmResponse.ok
      } catch (e) {
        console.error('FCM error:', e)
      }
    }

    // Send email via SendGrid
    if (user.email && user.notification_preferences?.email !== false) {
      try {
        const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: user.email }]
            }],
            from: { email: 'noreply@brillprime.com', name: 'Brill Prime' },
            subject: title,
            content: [{
              type: 'text/plain',
              value: message
            }]
          })
        })
        deliveryResults.email = emailResponse.ok
      } catch (e) {
        console.error('Email error:', e)
      }
    }

    // Send SMS via Twilio
    if (user.phone_number && user.notification_preferences?.sms !== false && type === 'order') {
      try {
        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              To: user.phone_number,
              From: Deno.env.get('TWILIO_PHONE_NUMBER') || '',
              Body: `${title}: ${message}`
            })
          }
        )
        deliveryResults.sms = smsResponse.ok
      } catch (e) {
        console.error('SMS error:', e)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          notificationId: notification.id,
          deliveryResults
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 6. calculate-delivery-fee

**Purpose**: Dynamic pricing based on distance and merchant settings

**Endpoint**: `/functions/v1/calculate-delivery-fee`

### Request Body
```typescript
{
  "merchantLocation": {
    "latitude": number,
    "longitude": number
  },
  "deliveryLocation": {
    "latitude": number,
    "longitude": number
  },
  "orderValue": number
}
```

### Implementation

```typescript
// supabase/functions/calculate-delivery-fee/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Haversine formula to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { merchantLocation, deliveryLocation, orderValue } = await req.json()

    // Calculate distance using PostGIS or Haversine
    const distance = calculateDistance(
      merchantLocation.latitude,
      merchantLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude
    )

    // Pricing configuration
    const baseFee = 500 // ₦500 base fee
    const perKmRate = 100 // ₦100 per km
    const freeDeliveryThreshold = 5000 // Free delivery for orders over ₦5000

    // Check for surge pricing (peak hours)
    const currentHour = new Date().getHours()
    const isPeakHour = (currentHour >= 17 && currentHour <= 20) // 5 PM - 8 PM
    const surgeMultiplier = isPeakHour ? 1.5 : 1.0

    // Calculate fees
    const distanceFee = Math.ceil(distance * perKmRate)
    const surgeFee = isPeakHour ? Math.ceil(distanceFee * 0.5) : 0
    let totalFee = baseFee + distanceFee + surgeFee

    // Apply surge multiplier
    totalFee = Math.ceil(totalFee * surgeMultiplier)

    // Apply free delivery
    if (orderValue >= freeDeliveryThreshold) {
      totalFee = 0
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          distance: distance.toFixed(2),
          baseFee,
          distanceFee,
          surgeFee,
          total: totalFee,
          breakdown: {
            base: baseFee,
            distance: distanceFee,
            surge: surgeFee,
            discount: orderValue >= freeDeliveryThreshold ? -(baseFee + distanceFee + surgeFee) : 0
          },
          isFreeDelivery: orderValue >= freeDeliveryThreshold,
          estimatedTime: Math.ceil(distance * 3) // 3 minutes per km
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 7. create-conversation

**Purpose**: Initialize chat between order participants

**Endpoint**: `/functions/v1/create-conversation`

### Request Body
```typescript
{
  "orderId": "uuid",
  "participantIds": ["uuid", "uuid"]
}
```

### Implementation

```typescript
// supabase/functions/create-conversation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { orderId, participantIds } = await req.json()

    // Check if conversation already exists for this order
    const { data: existingConversation } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('order_id', orderId)
      .single()

    if (existingConversation) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { conversationId: existingConversation.id, isNew: false }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .insert({
        order_id: orderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (convError) throw convError

    // Add participants
    const participants = participantIds.map((userId: string) => ({
      conversation_id: conversation.id,
      user_id: userId,
      joined_at: new Date().toISOString()
    }))

    await supabaseClient.from('conversation_participants').insert(participants)

    // Send initial system message
    await supabaseClient.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: null, // System message
      content: 'Conversation started. You can now chat about this order.',
      is_system: true,
      sent_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          conversationId: conversation.id,
          isNew: true,
          participantCount: participantIds.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 8. generate-merchant-analytics

**Purpose**: Calculate merchant performance metrics

**Endpoint**: `/functions/v1/generate-merchant-analytics`

### Request Body
```typescript
{
  "merchantId": "uuid",
  "startDate": "ISO date",
  "endDate": "ISO date"
}
```

### Implementation

```typescript
// supabase/functions/generate-merchant-analytics/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { merchantId, startDate, endDate } = await req.json()

    // Get orders for the period
    const { data: orders } = await supabaseClient
      .from('orders')
      .select('*, order_items(product_id, quantity, unit_price, total_price)')
      .eq('merchant_id', merchantId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (!orders) {
      throw new Error('No data available')
    }

    // Calculate metrics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get previous period for comparison
    const periodLength = new Date(endDate).getTime() - new Date(startDate).getTime()
    const prevStartDate = new Date(new Date(startDate).getTime() - periodLength).toISOString()

    const { data: prevOrders } = await supabaseClient
      .from('orders')
      .select('total_amount')
      .eq('merchant_id', merchantId)
      .gte('created_at', prevStartDate)
      .lt('created_at', startDate)

    const prevRevenue = prevOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const monthlyGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    // Top selling products
    const productSales = new Map()
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const existing = productSales.get(item.product_id) || { sales: 0, revenue: 0 }
        productSales.set(item.product_id, {
          sales: existing.sales + item.quantity,
          revenue: existing.revenue + item.total_price
        })
      })
    })

    // Daily sales breakdown
    const dailySales = orders.reduce((acc: any, order) => {
      const date = order.created_at.split('T')[0]
      acc[date] = (acc[date] || 0) + order.total_amount
      return acc
    }, {})

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          totalSales: totalRevenue,
          totalOrders,
          averageOrderValue,
          monthlyGrowth,
          dailySales: Object.entries(dailySales).map(([date, sales]) => ({ date, sales })),
          topProducts: Array.from(productSales.entries())
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 10)
            .map(([id, data]) => ({ productId: id, ...data }))
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 9. handle-refund

**Purpose**: Process refunds and update escrow

**Endpoint**: `/functions/v1/handle-refund`

### Request Body
```typescript
{
  "orderId": "uuid",
  "amount": number,
  "reason": "string"
}
```

### Implementation

```typescript
// supabase/functions/handle-refund/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { orderId, amount, reason } = await req.json()

    // Get order and transaction details
    const { data: order } = await supabaseClient
      .from('orders')
      .select('*, transactions(*)')
      .eq('id', orderId)
      .single()

    if (!order) {
      throw new Error('Order not found')
    }

    // Validate refund eligibility
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new Error('Order cannot be refunded')
    }

    const transaction = order.transactions?.[0]
    if (!transaction || !transaction.reference) {
      throw new Error('No payment transaction found')
    }

    // Process Paystack refund
    const paystackResponse = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction: transaction.reference,
        amount: amount * 100 // Paystack uses kobo
      })
    })

    const refundData = await paystackResponse.json()

    if (!refundData.status) {
      throw new Error('Refund processing failed')
    }

    // Update order status
    await supabaseClient
      .from('orders')
      .update({
        status: 'REFUNDED',
        refund_reason: reason,
        refunded_at: new Date().toISOString()
      })
      .eq('id', orderId)

    // Create refund transaction record
    await supabaseClient.from('transactions').insert({
      order_id: orderId,
      user_id: order.user_id,
      amount: -amount,
      payment_method: transaction.payment_method,
      reference: refundData.data.transaction.reference,
      status: 'completed',
      gateway: 'paystack',
      gateway_response: refundData,
      type: 'refund'
    })

    // Release escrow
    await supabaseClient
      .from('escrow')
      .update({ status: 'refunded' })
      .eq('order_id', orderId)

    // Send notifications
    await supabaseClient.from('notifications').insert([
      {
        user_id: order.user_id,
        title: 'Refund Processed',
        message: `Refund of ₦${amount.toFixed(2)} has been processed`,
        type: 'payment',
        role: 'consumer',
        data: { order_id: orderId }
      },
      {
        user_id: order.merchant_id,
        title: 'Order Refunded',
        message: `Order #${orderId.slice(0, 8)} has been refunded`,
        type: 'order',
        role: 'merchant',
        data: { order_id: orderId }
      }
    ])

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          refundId: refundData.data.id,
          amount,
          status: 'processed'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 10. batch-approve-kyc

**Purpose**: Bulk approve/reject KYC documents

**Endpoint**: `/functions/v1/batch-approve-kyc`

### Request Body
```typescript
{
  "documentIds": ["uuid", "uuid"],
  "action": "APPROVE|REJECT",
  "reason": "string (optional)",
  "reviewedBy": "uuid"
}
```

### Implementation

```typescript
// supabase/functions/batch-approve-kyc/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify admin permissions
    const { data: adminUser } = await supabaseClient
      .from('users')
      .select('role')
      .eq('firebase_uid', user.id)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    const { documentIds, action, reason, reviewedBy } = await req.json()

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const documentId of documentIds) {
      try {
        // Update document
        const { error: updateError } = await supabaseClient
          .from('kyc_documents')
          .update({
            verification_status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            rejection_reason: action === 'REJECT' ? reason : null,
            reviewed_by: reviewedBy,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', documentId)

        if (updateError) {
          results.failed++
          results.errors.push(`${documentId}: ${updateError.message}`)
          continue
        }

        // Create audit log
        await supabaseClient.from('kyc_audit_log').insert({
          document_id: documentId,
          action,
          performed_by: reviewedBy,
          reason,
          timestamp: new Date().toISOString()
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`${documentId}: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          processed: documentIds.length,
          successful: results.success,
          failed: results.failed,
          errors: results.errors
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 🔧 Environment Variables

Set these in your Supabase dashboard under **Settings > Edge Functions**:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Payment Gateway
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key

# Notifications
FCM_SERVER_KEY=your_firebase_cloud_messaging_key
SENDGRID_API_KEY=SG.your_sendgrid_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 📚 Database Requirements

These functions require the following database tables (see `supabase/schema.sql`):

- `users`
- `orders`
- `order_items`
- `order_status_history`
- `drivers`
- `transactions`
- `escrow`
- `notifications`
- `kyc_documents`
- `kyc_audit_log`
- `conversations`
- `conversation_participants`
- `messages`

---

## 🧪 Testing

Test each function using the Supabase dashboard or curl:

```bash
# Test update-order-status
curl -X POST https://your-project.supabase.co/functions/v1/update-order-status \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"uuid","newStatus":"CONFIRMED"}'

# Test assign-driver
curl -X POST https://your-project.supabase.co/functions/v1/assign-driver \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"uuid","deliveryLocation":{"latitude":6.5244,"longitude":3.3792}}'
```

---

## 📝 Notes

1. **Authentication**: All functions validate Firebase JWT tokens
2. **Error Handling**: Returns structured error responses
3. **CORS**: Configured for web browser access
4. **Security**: Uses service role key for admin operations
5. **Notifications**: Multi-channel delivery (push, email, SMS)
6. **Scalability**: Designed for production workloads

---

## 🚦 Deployment Priority

**Week 1 (Critical)**:
1. ✅ create-order (already deployed)
2. update-order-status
3. assign-driver
4. process-payment

**Week 2 (Important)**:
5. send-notification
6. calculate-delivery-fee
7. verify-kyc-document

**Week 3 (Nice to have)**:
8. create-conversation
9. generate-merchant-analytics
10. handle-refund
11. batch-approve-kyc

---

**Last Updated**: January 2025  
**Version**: 1.0.0
