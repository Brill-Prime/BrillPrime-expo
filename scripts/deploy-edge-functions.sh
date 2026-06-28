
#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions..."
echo "========================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Deploy all edge functions
echo ""
echo "📦 Deploying cart-get function..."
supabase functions deploy cart-get

echo ""
echo "📦 Deploying cart-add function..."
supabase functions deploy cart-add

echo ""
echo "📦 Deploying cart-update function..."
supabase functions deploy cart-update

echo ""
echo "📦 Deploying payment-process function..."
supabase functions deploy payment-process

echo ""
echo "📦 Deploying merchants-nearby function..."
supabase functions deploy merchants-nearby

echo ""
echo "📦 Deploying create-order function..."
supabase functions deploy create-order

echo ""
echo "✅ All edge functions deployed successfully!"
echo ""
echo "🧪 Next steps:"
echo "  1. Test endpoints: npm run test:api"
echo "  2. Monitor logs: supabase functions logs"
