---
name: Driver location tracking architecture
description: How driver GPS is broadcast and consumed by consumers in real time
---

**Driver side:** `locationService.startLiveTracking(intervalMs)` fires the device GPS on a timer and upserts rows into the Supabase `driver_locations` table (keyed on `driver_id`).

**Consumer side:** Two methods exist on `locationService`:
- `getLiveLocation(driverId)` — one-shot fetch from `driver_locations` table (with 10s cache)
- `subscribeToDriverLocation(driverId, callback)` — Supabase `postgres_changes` subscription on `driver_locations` filtered by `driver_id=eq.<id>`; returns an unsubscribe function

**Why the old code was broken:** `LiveOrderTracker` subscribed to `locationService.onLocationUpdate()` which fires for the consumer's OWN device GPS — not the driver's broadcast. Also the old polling called `/api/location/live/:id` which doesn't exist.

**How to apply:** In any consumer-side tracking UI, get `order.driver_id` then call `subscribeToDriverLocation`. Remember to return the unsubscribe from `useEffect` or push it to a cleanup ref.
