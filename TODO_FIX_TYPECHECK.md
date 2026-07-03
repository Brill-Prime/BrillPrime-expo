# Typecheck Fix Tracker

Goal: reduce `npm run typecheck` errors to 0.

## Current status
- Typecheck currently reports **56 errors** across **31 files**.

## Error buckets (from `npm run typecheck` output)
1. app/checkout/index.tsx: CartItem missing `commodityId`; response typing `unknown`
2. app/checkout/order-preview.tsx: setCartItems expects `any[]`
3. app/commodity/commodities.tsx: selected category type mismatch
4. app/dashboard/merchant.tsx: Ionicons name typing mismatch
5. app/driver/vehicle-management.tsx & app/kyc/documents.tsx: `showConfirmDialog` callback args mismatch
6. app/home/driver.tsx: expo-location `LocationObject` latitude/longitude properties
7. app/index.tsx: missing `expo-asset` types
8. app/kyc/personal-info.tsx: spread on non-object type
9. app/merchant/[id].tsx: `Alert.Alert.alert` vs `Alert.alert`
10. app/merchant/[id]/reviews.tsx: merchant review payload types
11. app/merchant/inventory.tsx: inventoryItem status union mismatch
12. app/merchant/order-management.tsx: private `getMerchantId`
13. app/merchant/store-settings.tsx: businessHours type mismatch
14. app/messages/new-chat.tsx: contact payload args mismatch
15. app/notifications/history.tsx: filters payload includes invalid `status`
16. app/notifications/index.tsx: Notification type mismatch (optional `type`)
17. app/notifications/preferences.tsx: multiple preference shape/type mismatches
18. app/notifications/scheduled.tsx: `scheduledFor` missing from type
19. app/orders/consumer-orders.tsx: order status casing mismatch (PENDING vs pending)
20. app/orders/order-details.tsx: OrderService missing `updateOrder`
21. app/orders/order-tracking.tsx: supabase channel builder typing (args/generics)
22. app/payment/index.tsx: method.type comparisons + id param types
23. app/profile/change-password.tsx: payload includes unsupported `email`
24. app/store-locator/index.tsx: response.data is unknown
25. components/RealtimeNotificationBanner.tsx: Notification lacks `action`
26. components/ReceiptSharingModal.tsx: missing `expo-file-system`
27. services/cartService.ts: references missing `authService`
28. services/favoritesService.ts: returns wrong default type `{}`
29. services/notificationService.ts: updateSettings return type mismatch + filters mismatch
30. services/typingIndicatorService.ts: RealtimeChannel has no `off`

## Progress log
- [ ] Step 1: Fix missing/external module deps/types (expo-asset, expo-file-system)
- [ ] Step 2: Fix all API callback overload mismatches (showConfirmDialog/ImagePicker)
- [ ] Step 3: Normalize domain model types (Order.status, Notification.type/action, InventoryItem.status)
- [ ] Step 4: Fix service typing gaps (OrderService.updateOrder, getMerchantId exposure, cartService authService reference)
- [ ] Step 5: Fix remaining component payload typings and unknown responses


