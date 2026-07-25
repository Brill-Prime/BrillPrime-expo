---
name: Order status enum casing
description: DB order statuses must be lowercase snake_case — never uppercase
---

The `orders` table uses lowercase statuses: `pending`, `accepted`, `preparing`, `ready`, `in_transit`, `delivered`, `cancelled`, `rejected`.

**Why:** The old `orderService` had an uppercase enum (`'IN_TRANSIT'`, `'DELIVERED'`, `'CANCELLED'`) that was passed directly to Supabase, causing silent no-op updates (Supabase rejects enum mismatches without error in some RLS configs, or simply doesn't match any row).

**How to apply:** Always use the lowercase snake_case values when calling `supabase.from('orders').update({ status: ... })`. The `merchantOrderService.Order['status']` type union is the canonical reference.

**Screen-to-DB status mapping (consumer tracking timeline):**
- `pending` → Order Placed
- `accepted` → Order Confirmed  
- `preparing` → Preparing Order
- `ready` → Ready for Pickup
- `in_transit` → Out for Delivery
- `delivered` → Delivered
