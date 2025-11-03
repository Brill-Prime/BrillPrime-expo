
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Supabase Edge Functions${NC}\n"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Installing Supabase CLI...${NC}"
    npm install -g supabase
fi

# Check if project is linked
echo -e "${YELLOW}Checking Supabase project link...${NC}"
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${RED}Project not linked. Please run: supabase link --project-ref YOUR_PROJECT_REF${NC}"
    exit 1
fi

# Deploy all edge functions
echo -e "${GREEN}Deploying edge functions...${NC}\n"

FUNCTIONS=(
    "process-payment"
    "send-notifications"
    "verify-kyc"
    "order-webhook"
    "analytics-aggregation"
)

for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}Deploying $func...${NC}"
    supabase functions deploy "$func" --no-verify-jwt
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $func deployed successfully${NC}\n"
    else
        echo -e "${RED}✗ Failed to deploy $func${NC}\n"
    fi
done

echo -e "${GREEN}🎉 All edge functions deployed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Set environment secrets: supabase secrets set FIREBASE_SERVER_KEY=your_key"
echo -e "2. Test functions in the Supabase dashboard"
echo -e "3. Update your app configuration with function URLs"
