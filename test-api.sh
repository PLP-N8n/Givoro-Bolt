#!/bin/bash

echo "======================================================================"
echo "Testing Givoro API Endpoints"
echo "======================================================================"
echo ""

# Set colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the site URL from netlify.toml or use localhost
if command -v netlify &> /dev/null; then
    echo "Netlify CLI detected. Starting dev server..."
    netlify dev &
    DEV_PID=$!
    sleep 5
    BASE_URL="http://localhost:8888"
else
    echo "Testing against deployed site..."
    read -p "Enter your Netlify site URL (e.g., https://your-site.netlify.app): " BASE_URL
fi

echo ""
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
echo "------------------------------"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/.netlify/functions/health")
if echo "$HEALTH_RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Environment variables check
echo "Test 2: Environment Variables"
echo "------------------------------"
ENV_RESPONSE=$(curl -s "$BASE_URL/.netlify/functions/debug-env")
echo "Environment variables present:"
echo "$ENV_RESPONSE" | jq '.' 2>/dev/null || echo "$ENV_RESPONSE"

# Check if critical vars are present
GEMINI_SET=$(echo "$ENV_RESPONSE" | jq -r '.GEMINI_API_KEY' 2>/dev/null)
SUPABASE_SET=$(echo "$ENV_RESPONSE" | jq -r '.SUPABASE_URL' 2>/dev/null)

if [ "$GEMINI_SET" == "true" ]; then
    echo -e "${GREEN}✓ GEMINI_API_KEY is set${NC}"
else
    echo -e "${RED}✗ GEMINI_API_KEY is NOT set${NC}"
fi

if [ "$SUPABASE_SET" == "true" ]; then
    echo -e "${GREEN}✓ SUPABASE_URL is set${NC}"
else
    echo -e "${RED}✗ SUPABASE_URL is NOT set${NC}"
fi
echo ""

# Test 3: AI Suggest endpoint
echo "Test 3: AI Suggest Endpoint"
echo "------------------------------"
echo "Testing with query: 'gift for wife under £50'..."
AI_RESPONSE=$(curl -s -X POST "$BASE_URL/.netlify/functions/ai-suggest" \
    -H "Content-Type: application/json" \
    -d '{"query":"gift for wife under £50"}')

if echo "$AI_RESPONSE" | grep -q '"suggestions"'; then
    echo -e "${GREEN}✓ AI Suggest endpoint is working${NC}"
    echo "Number of suggestions: $(echo "$AI_RESPONSE" | jq '.suggestions | length' 2>/dev/null)"
    echo ""
    echo "First suggestion:"
    echo "$AI_RESPONSE" | jq '.suggestions[0]' 2>/dev/null || echo "$AI_RESPONSE"
else
    echo -e "${RED}✗ AI Suggest endpoint failed${NC}"
    echo "Error response:"
    echo "$AI_RESPONSE" | jq '.' 2>/dev/null || echo "$AI_RESPONSE"
fi
echo ""

# Test 4: Frontend API call (via redirect)
echo "Test 4: Frontend API Route"
echo "------------------------------"
FRONTEND_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai-suggest" \
    -H "Content-Type: application/json" \
    -d '{"query":"gift for dad who loves golf"}')

if echo "$FRONTEND_RESPONSE" | grep -q '"suggestions"'; then
    echo -e "${GREEN}✓ Frontend /api/ai-suggest route is working${NC}"
else
    echo -e "${RED}✗ Frontend /api/ai-suggest route failed${NC}"
    echo "Response: $FRONTEND_RESPONSE"
fi
echo ""

# Clean up
if [ ! -z "$DEV_PID" ]; then
    echo "Stopping Netlify dev server..."
    kill $DEV_PID 2>/dev/null
fi

echo "======================================================================"
echo "Test Summary"
echo "======================================================================"
echo ""
echo "If all tests passed, your API is fully configured and working!"
echo ""
echo "If any tests failed, check:"
echo "  1. Environment variables are set in Netlify"
echo "  2. You've deployed after setting environment variables"
echo "  3. Check Netlify function logs for detailed errors"
echo ""
