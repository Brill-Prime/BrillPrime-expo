# Live Order & Tracking System — Changes & Future Improvements

## Overview

This document covers the comprehensive review and fix of the **Live Order and Live Order Tracking** system across all three roles (Consumer, Merchant, Driver) in Brill Prime.

---

## Changes Made

### 1. `services/orderService.ts` — Complete Rewrite

**Problem:** Every method was calling a non-existent REST backend (`/api/orders`, `/api/orders/:id/status`, `/api/orders/:id/tracking`). The app has no Express/Node server — only Firebase Auth + Supabase. All calls failed silently with network errors.

**Additional problem:** Status enums were uppercase (`'IN_TRANSIT'`, `'DELIVERED'`, `'CANCELLED'`), which did not match the Supabase database schema (lowercase snake_case).

**What changed:**
- `getUserOrders(filters?)` — now queries `orders` directly from Supabase, filtered by `consumer_id` (resolved from Firebase UID → `users.firebase_uid` lookup)
- `getDriverOrders(filters?)` — **new method** — queries orders where `driver_id` = current driver's internal Supabase user ID
- `updateOrderStatus(orderId, status)` — now does `supabase.from('orders').update({ status })` with correct lowercase statuses
- `cancelOrder(orderId, reason?)` — now updates Supabase directly
- `trackOrder(orderId)` — fetches order + joins driver details + reads latest `driver_locations` row, all from Supabase
- `subscribeToOrderUpdates(orderId, callback)` — **new method** — Supabase `postgres_changes` real-time subscription for any screen that needs live status updates
- `getOrderSummary()` — computes stats from Supabase `orders` table directly
- Added private `getInternalUserId()` helper that resolves Firebase UID → Supabase UUID (same pattern as `merchantOrderService`)

---

### 2. `services/locationService.ts` — Fixed `getLiveLocation` + Added `subscribeToDriverLocation`

**Problem:** `getLiveLocation(userId)` called `/api/location/live/:userId` (non-existent REST endpoint). Consumers polling for driver position got nothing.

**What changed:**
- `getLiveLocation(driverId)` — now reads from the Supabase `driver_locations` table (keyed by `driver_id`), with a 10-second in-memory cache for deduplication
- `subscribeToDriverLocation(driverId, callback)` — **new method** — sets up a Supabase `postgres_changes` subscription on `driver_locations` filtered by `driver_id`, providing real-time push updates to consumers as the driver moves; returns an unsubscribe function for cleanup

---

### 3. `components/LiveOrderTracker.tsx` — Fixed Real-Time Tracking (All Roles)

**Problems:**
- Consumer was subscribed to `locationService.onLocationUpdate()` — this fires for the **consumer's own device GPS**, not the driver's position
- `orderService.updateOrderStatus(orderId, 'DELIVERED')` — uppercase status caused silent failure
- No "Mark Picked Up" step for drivers — they could only mark as delivered
- Stale order data after status transitions (no real-time subscription)
- Contact phone numbers were hardcoded (`"+234-801-234-5678"`)

**What changed:**
- **Consumer tracking:** replaced local GPS listener with `locationService.subscribeToDriverLocation(order.driver_id, ...)` so the map updates with the actual driver's broadcasted position
- **Driver actions:** added **"Mark Picked Up"** button (sets status → `in_transit`); "Mark Delivered" only appears after pickup, enforcing the correct workflow: `ready → in_transit → delivered`
- **Status strings:** all `'DELIVERED'` → `'delivered'`, all uppercase statuses corrected
- **Order status subscription:** added `orderService.subscribeToOrderUpdates()` so `order.status` updates in real time
- **Contact modal:** now reads real phone numbers from `order.consumer.phone_number` / `order.driver.phone_number`
- **Cleanup:** all subscriptions and intervals are pushed to a `cleanupRef` array and torn down on unmount

---

### 4. `app/orders/order-tracking.tsx` — Complete Rewrite (Consumer Screen)

**Problem:** The entire file contained **inlined mock implementations** of `orderService`, `locationService`, and `supabase` — it never connected to real data under any circumstance. The mocks returned random statuses on a 15-second timer and used San Francisco coordinates.

Additional problems in the mock-based logic:
- Status names didn't match the database: used `'confirmed'` and `'out_for_delivery'` instead of `'accepted'` and `'in_transit'`
- The inner `loadAndSubscribe` returned a cleanup function that the outer `useEffect` never used (subscription leaked)

**What changed:**
- All mocks removed; imports now use real `supabase`, `orderService`, `locationService`
- Supabase `postgres_changes` subscription for live order status
- `locationService.subscribeToDriverLocation()` for live driver GPS when order is `ready` or `in_transit`
- Status timeline now maps all 6 real database statuses: `pending`, `accepted`, `preparing`, `ready`, `in_transit`, `delivered`
- Shows driver name and real-time ETA card during active delivery
- All cleanup done via `cleanupRef` array with proper unmount teardown
- `order_number`, `delivery_address`, `total_amount` — all field names now use the actual Supabase column names (snake_case)

---

### 5. `app/orders/driver-orders.tsx` — Fixed Order Loading & Status Updates

**Problems:**
- `orderService.getUserOrders({ status: 'confirmed' })` — wrong service (consumer-scoped), wrong status, no driver filter
- `orderService.getUserOrders({ status: 'in_transit' })` — same issues; returned orders for all drivers
- `orderService.updateOrderStatus(orderId, 'IN_TRANSIT')` — uppercase, failed silently
- `orderService.updateOrderStatus(orderId, 'CANCELLED')` — uppercase, failed silently
- No real-time subscription — driver had to manually pull-to-refresh to see new assignments

**What changed:**
- Available orders now use `orderService.getDriverOrders({ status: 'ready' })` — shows only orders where merchant assigned this specific driver and marked ready for pickup
- Active deliveries use `orderService.getDriverOrders({ status: 'in_transit' })`
- Status updates use lowercase: `'in_transit'`, `'cancelled'`
- Added Supabase `postgres_changes` subscription filtered by `driver_id` — list auto-refreshes when a merchant assigns a new order
- "Accept/Reject" flow replaced with **"Mark Picked Up"** button (driver is assigned by merchant; they confirm pickup, which transitions to `in_transit`)
- Distance calculation, customer name, item list, and earnings all populated from real order data

---

### 6. `contexts/NotificationContext.tsx` — Fixed Stale Closure on Subscription Cleanup

**Problem:** `const [subscription, setSubscription] = useState(null)`. The `useEffect` cleanup function captured `subscription` at the time the effect ran (mount time) — before the async `setSubscription(sub)` call had a chance to fire. The cleanup always saw `null`, so the Supabase realtime channel was **never unsubscribed**, leaking memory and connections on every re-render or navigation away.

**What changed:**
- `useState<subscription>` replaced with `useRef<subscription>` (`subscriptionRef`)
- Cleanup: `subscriptionRef.current?.unsubscribe()` — always reads the live value

---

## Future Improvements

### High Priority

#### Driver Assignment Notification
Currently when a merchant assigns a driver via `merchantOrderService.assignDriver()`, the driver receives a database `notifications` row but **no push alert or in-app prompt**. The driver must navigate to the Delivery Orders screen to discover the assignment.

**Recommended fix:** Add a `postgres_changes` listener in the driver home screen (or a persistent background context) that watches `orders` where `driver_id = current_driver_id` and status changes to `ready`. Show an alert/modal with order summary and a prompt to navigate to the delivery screen.

#### Real Map Navigation for Drivers
`LiveOrderTracker` renders a `MapView` but has no turn-by-turn routing. The driver sees a pin on the map but must open a separate maps app manually.

**Recommended fix:** Integrate Google Maps Directions API (or native deep-link to Google Maps / Waze) with the pickup and delivery coordinates from the order.

#### Delivery Confirmation with Photo/Signature
Drivers can mark an order `delivered` with one tap — there is no proof-of-delivery mechanism.

**Recommended fix:** Add a photo capture step (using `expo-camera`) or a PIN confirmation (provided to consumer at checkout, verified by driver) before allowing the `delivered` status update.

---

### Medium Priority

#### Consumer Real-Time Map View
`order-tracking.tsx` shows a timeline but no live map of the driver's position. The `LiveOrderTracker` component has a map, but it is only shown as a full-screen modal — not inline on the tracking screen.

**Recommended fix:** Embed a compact map card in the tracking timeline screen that shows the driver's pin updating in real time when the order is `in_transit`.

#### Driver Self-Assignment / Bidding
The current flow requires a merchant to manually assign a driver from the driver assignment screen. This doesn't scale.

**Recommended fix:** When an order reaches `ready` status and has no `driver_id`, broadcast it to all available drivers (via a Supabase channel or a `pending_deliveries` view). Drivers see it in their orders screen and can claim it first-come-first-served.

#### Merchant Order Assignment UX
`merchantOrderService.assignDriver()` sets `driver_id` but does **not** also set the status to `ready`. If the merchant hasn't already clicked "Mark as Ready", the driver sees nothing.

**Recommended fix:** Make `assignDriver()` atomically set `driver_id` AND `status = 'ready'` in the same Supabase update, or add a UI guard in the assignment modal that warns if the order isn't in `preparing` / `ready` state.

#### Order Cancellation by Consumer
`orderService.cancelOrder()` now works but the consumer-facing order list and tracking screens have no cancel button. Consumers must contact support.

**Recommended fix:** Show a "Cancel Order" button on `order-tracking.tsx` when status is `pending` or `accepted` (before preparation starts), calling `orderService.cancelOrder()`.

---

### Lower Priority

#### Offline Support
If a consumer loses connectivity mid-delivery, the order tracking screen shows nothing (no cached state). The old mock-based version at least read from `AsyncStorage`.

**Recommended fix:** After loading order details successfully, cache the result in `AsyncStorage` keyed by `orderId`. On load failure, fall back to the cache with a "last updated at" timestamp shown to the user.

#### ETA Accuracy
The current ETA calculation assumes a constant 30 km/h speed. It doesn't account for traffic, road type, or actual route distance (uses straight-line Haversine distance).

**Recommended fix:** Call the Google Maps Directions API with the driver's current location and the delivery address to get a real route duration. Cache the result for 60 seconds to avoid excessive API calls.

#### Driver Earnings Dashboard
`driver-orders.tsx` shows per-order `delivery_fee` but there is no aggregate earnings view beyond what already exists in `driver/earnings-details`.

**Recommended fix:** Confirm `driver/earnings-details` pulls from the `orders` table using `getDriverOrders({ status: 'delivered' })` and aggregates correctly — currently it may still use REST-based calls.

#### Multi-Stop Deliveries
`locationService` has an `optimizeRoute()` method (nearest-neighbor algorithm) that is never called. The system currently supports only single-destination orders.

**Recommended fix:** For orders with multiple `order_items` from different merchants (if that use case is added), wire up `optimizeRoute()` to sequence the driver's stops.

#### Push Notifications (FCM)
The `notificationService` has infrastructure for Firebase Cloud Messaging but device tokens are not collected in the current flow. In-app banners work, but the app goes dark when backgrounded.

**Recommended fix:** On driver/consumer login, request notification permission, get the FCM token via `expo-notifications`, and upsert it to a `device_tokens` table linked to the user. Use a Supabase Edge Function (or Trigger) to send FCM pushes on order status changes.
