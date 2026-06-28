# TODO - Real-time Multi-sided E-commerce Backend Wiring

## Plan Steps (confirmed)
1. Add `services/orderStateMachine.ts` implementing allowed transitions + idempotent transition handlers.
2. Wire payment success handler to trigger state transition into Paid/Awaiting Pickup and initiate driver assignment.
3. Implement driver assignment + acceptance with concurrency-safe Supabase update logic.
4. Gate background driver location tracking to active jobs only; ensure updates broadcast to Supabase.
5. Improve realtime consumer/merchant live driver marker updates with throttling to avoid stutters.
6. Add robust error handling and bounded polling fallbacks.
7. Run typecheck/lint + sanity test order lifecycle transitions.

