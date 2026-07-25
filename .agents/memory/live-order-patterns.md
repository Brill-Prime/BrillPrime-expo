---
name: Live Order System patterns
description: How the order system is backed and what works vs what is broken
---

The project has NO backend server. All data goes directly through Supabase.

**Why:** `apiClient` calls like `/api/orders`, `/api/location/live/:id` return 404/network errors because there is no Express/Node server running — only Metro (Expo web bundler).

**How to apply:**
- Always use `supabase.from('orders')` directly in services.
- `orderService` now wraps Supabase for consumer and driver queries.
- `merchantOrderService` already used Supabase correctly — use it as the reference pattern.
- When adding new data endpoints, never reach for `apiClient.get('/api/...')`.
