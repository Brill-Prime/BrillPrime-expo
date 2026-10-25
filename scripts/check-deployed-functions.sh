
#!/bin/bash

echo "📊 Checking Deployed Supabase Edge Functions..."
echo "================================================"

SUPABASE_URL="https://lkfprjjlqmtpamukoatl.supabase.co"

functions=(
  "cart-get"
  "cart-add"
  "cart-update"
  "create-order"
  "payment-process"
  "merchants-nearby"
  "create-transaction"
  "verify-transaction"
  "mark-paid"
  "refund-payment"
  "update-escrow"
  "notify-user"
  "reconcile-transactions"
  "list-transactions"
  "update-order-status"
  "cancel-order"
  "update-delivery-address"
  "report-order-issue"
  "create-conversation"
  "send-message"
  "update-driver-location"
  "accept-delivery"
  "complete-delivery"
  "update-inventory"
  "manage-store-hours"
  "generate-merchant-analytics"
  "generate-driver-analytics"
  "generate-platform-analytics"
  "batch-approve-kyc"
  "manage-user-status"
  "review-flagged-content"
  "process-withdrawal"
  "calculate-earnings"
  "paystack-webhook"
  "paystack-utils"
)

echo ""
echo "Testing function availability..."
echo ""

for func in "${functions[@]}"
do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SUPABASE_URL}/functions/v1/${func}")
  
  if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "400" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ ${func} - DEPLOYED (HTTP ${HTTP_STATUS})"
  else
    echo "❌ ${func} - NOT FOUND (HTTP ${HTTP_STATUS})"
  fi
done

echo ""
echo "================================================"
echo "Check complete!"
