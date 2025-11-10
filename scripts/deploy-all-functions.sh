
#!/bin/bash

echo "🚀 Deploying All Supabase Edge Functions..."
echo "============================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Array of all functions to deploy
functions=(
  "cart-get"
  "cart-add"
  "cart-update"
  "cart-delete"
  "create-order"
  "update-order-status"
  "cancel-order"
  "update-delivery-address"
  "report-order-issue"
  "payment-process"
  "create-transaction"
  "verify-transaction"
  "mark-paid"
  "refund-payment"
  "list-transactions"
  "reconcile-transactions"
  "merchants-nearby"
  "update-inventory"
  "manage-store-hours"
  "generate-merchant-analytics"
  "update-driver-location"
  "accept-delivery"
  "complete-delivery"
  "calculate-earnings"
  "generate-driver-analytics"
  "create-conversation"
  "send-message"
  "notify-user"
  "update-escrow"
  "batch-approve-kyc"
  "manage-user-status"
  "review-flagged-content"
  "process-withdrawal"
  "generate-platform-analytics"
  "paystack-webhook"
  "paystack-utils"
)

# Deploy each function
for func in "${functions[@]}"
do
  echo ""
  echo "📦 Deploying $func function..."
  
  # Check if function directory exists
  if [ -d "supabase/functions/$func" ]; then
    supabase functions deploy $func
    
    if [ $? -eq 0 ]; then
      echo "✅ $func deployed successfully"
    else
      echo "⚠️  Warning: $func deployment had issues"
    fi
  else
    echo "⚠️  Skipping $func - directory not found"
  fi
done

echo ""
echo "============================================="
echo "✅ Deployment process completed!"
echo ""
echo "🧪 Next steps:"
echo "  1. Test endpoints using the test script"
echo "  2. Monitor logs: supabase functions logs"
echo "  3. Check function status in Supabase dashboard"
