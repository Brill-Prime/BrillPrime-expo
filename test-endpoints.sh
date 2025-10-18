#!/bin/bash
echo "Testing Production-Ready Endpoints..."
echo "===================================="

# Test health check
echo -e "\n1. Health Check:"
curl -s https://api.brillprime.com/health

# Test public merchants endpoint
echo -e "\n\n2. Merchants (requires auth):"
curl -s https://api.brillprime.com/api/merchants | head -c 200

# Test commodities (known 404)
echo -e "\n\n3. Commodities (known issue):"
curl -s https://api.brillprime.com/api/commodities | head -c 200

echo -e "\n\n===================================="
echo "To test authenticated endpoints, you need a valid JWT token."
echo "Register/login through the app first, then use:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' https://api.brillprime.com/api/orders"
