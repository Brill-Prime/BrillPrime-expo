---
name: Supabase real-time subscription cleanup pattern
description: Use a ref not state to hold subscription handles so cleanup closures aren't stale
---

**Rule:** Store subscription / unsubscribe handles in a `useRef`, not `useState`. The `useEffect` cleanup function captures the value of state at the moment the effect ran (mount time), before any async `setState` has fired. A ref is always the live value.

**Why:** `NotificationContext` had `const [subscription, setSubscription] = useState(null)`. The cleanup `() => { if (subscription) subscription.unsubscribe(); }` always saw `null` and leaked the Supabase channel.

**How to apply:**
```ts
const subRef = useRef<{ unsubscribe: () => void } | null>(null);
// inside async setup:
subRef.current = setupResult;
// cleanup:
return () => { subRef.current?.unsubscribe(); subRef.current = null; };
```

For multiple subscriptions in a single component, use a `useRef<Array<() => void>>([])` and push each cleanup fn, then `.forEach(fn => fn())` on unmount.
