# TODO - Multi-sided e-commerce core backend + real-time wiring

## Step 1: Locate checkout/payment + merchant-ready entry points
- [ ] Search for payment success handlers (Paystack/Stripe/Firebase) and order status updates
- [ ] Search for merchant “mark as ready” action and its API call

## Step 2: Wire payment -> state machine transition
- [ ] Update payment confirmation handler to call `orderStateMachine.onPaymentSucceeded(orderId)`
- [ ] Ensure order coordinates (delivery_latitude/longitude) exist before driver assignment

## Step 3: Wire merchant ready -> state machine transition
- [ ] Update merchant ready handler to call `orderStateMachine.merchantMarkedReady(orderId)`
- [ ] Ensure entering `ready` triggers driver assignment automatically

## Step 4: Driver background location publishing
- [ ] Inspect `services/locationService.ts` for existing live tracking primitives
- [ ] Ensure it upserts `driver_locations` every 5-10s when job is active
- [ ] Throttle updates to reduce write load

## Step 5: Consumer realtime stream for driver coordinates
- [ ] Add realtime subscription to `driver_locations` for assigned `driver_id`
- [ ] Update `app/orders/order-tracking.tsx` to use this stream
- [ ] Keep polling fallback, but set-state only on meaningful coordinate changes

## Step 6: Map/UI performance safety
- [ ] Avoid unnecessary rerenders while tracking (state partitioning / memoization)
- [ ] Ensure marker updates are smooth

## Step 7: Verify order state machine concurrency safety
- [ ] Audit transitions for idempotency (driverAccepted, delivered, cancel)
- [ ] Add any missing guards

## Step 8: Testing
- [ ] Run unit tests (if any) and TypeScript build
- [ ] Manually test flows: consumer payment -> driver assignment -> live routing -> delivered

