
#!/bin/bash

SUPABASE_URL="https://lkfprjjlqmtpamukoatl.supabase.co"
SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY}"

echo "🧪 Testing Supabase Edge Functions..."
echo "======================================"

# Test cart-get
echo ""
echo "Testing cart-get..."
curl -X GET "${SUPABASE_URL}/functions/v1/cart-get" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "apikey: ${SUPABASE_ANON_KEY}"

# Test merchants-nearby
echo ""
echo "Testing merchants-nearby..."
curl -X GET "${SUPABASE_URL}/functions/v1/merchants-nearby?lat=6.5244&lng=3.3792&radius=10" \
  -H "apikey: ${SUPABASE_ANON_KEY}"

# Test create-transaction
echo ""
echo "Testing create-transaction..."
curl -X POST "${SUPABASE_URL}/functions/v1/create-transaction" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1, "amount": 5000, "paymentMethod": "CARD"}'

echo ""
echo "======================================"
echo "✅ Function tests completed!"
