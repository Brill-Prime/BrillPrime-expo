
#!/bin/bash

echo "🧪 Testing Cart & Checkout Flow..."
echo "===================================="

# Check if Supabase functions are deployed
echo ""
echo "📡 Checking deployed functions..."
supabase functions list

echo ""
echo "🛒 Testing cart operations..."

# You'll need to add your actual test user token here
TOKEN="YOUR_TEST_TOKEN"
SUPABASE_URL="YOUR_SUPABASE_URL"

# Test cart-get
echo "Testing GET cart..."
curl -X GET "${SUPABASE_URL}/functions/v1/cart-get" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo "Testing ADD to cart..."
curl -X POST "${SUPABASE_URL}/functions/v1/cart-add" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"productId":"test-product-id","quantity":2}'

echo ""
echo "Testing CREATE order..."
curl -X POST "${SUPABASE_URL}/functions/v1/create-order" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"productId":"test-product-id","quantity":2}],
    "deliveryAddressId":"1",
    "paymentMethodId":"card",
    "notes":"Test order"
  }'

echo ""
echo "✅ Tests complete!"
