# Testing Guide

## Quick Environment Check

### 1. Verify Database Tables Exist

The following tables should exist in your Supabase database:
- ✅ `gift_suggestions` - Stores AI-generated gift ideas
- ✅ `affiliate_clicks` - Tracks affiliate link clicks
- ✅ `users`, `profiles`, `sessions`, `suggestions`, `clicks`, `affiliate_products`

### 2. Required Environment Variables

Check that these are set in **Netlify Dashboard > Site configuration > Environment variables**:

```
GEMINI_API_KEY=your_key_here
SUPABASE_URL=https://qsjwnidqheqwtuqrprou.supabase.co
SUPABASE_SERVICE_ROLE=your_service_role_key
```

Also needed (client-side):
```
VITE_SUPABASE_URL=https://qsjwnidqheqwtuqrprou.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_NAME=Givoro
```

## Manual Testing Steps

### Test 1: Check Netlify Function Deployment

Visit your Netlify dashboard:
1. Go to **Functions** tab
2. Verify these functions are deployed:
   - `ai-suggest`
   - `health`
   - `debug-env`
   - `amazon-search`
   - `aff-redirect`

### Test 2: Check Environment Variables

Visit: `https://your-site.netlify.app/.netlify/functions/debug-env`

Expected response:
```json
{
  "GEMINI_API_KEY": true,
  "SUPABASE_URL": true,
  "SUPABASE_SERVICE_ROLE": true,
  "AMAZON_PA_ACCESS_KEY": false,  // Optional
  "AMAZON_PA_SECRET_KEY": false,  // Optional
  "AMAZON_PARTNER_TAG": false,     // Optional
  "AMAZON_PA_REGION": false,       // Optional
  "AMAZON_PA_HOST": false          // Optional
}
```

**✅ Success**: `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE` should all be `true`
**❌ Failure**: If any are `false`, add them in Netlify and redeploy

### Test 3: Test Gift Search (Manual)

1. Open your deployed site: `https://your-site.netlify.app`
2. Enter a gift search query, e.g., "gift for wife under £50"
3. Click "Get Ideas"

**Expected behavior:**
- Loading skeleton cards appear (6 animated placeholders)
- After 3-5 seconds, gift suggestions appear
- Each card shows:
  - Gift title
  - Reason for the suggestion
  - Keywords in blue chips
  - Product images (if Amazon API configured)

**If you get HTTP 404:**
- Check environment variables are set
- Verify you redeployed after setting variables
- Check Netlify function logs

**If you get HTTP 500:**
- Check Netlify function logs for details
- Verify Gemini API key is valid
- Verify Supabase credentials are correct

### Test 4: Check Function Logs

1. Go to Netlify Dashboard
2. Click on your site
3. Go to **Functions**
4. Click on **ai-suggest**
5. View recent invocations

Look for:
- Successful 200 responses
- Any error messages
- Execution time (should be 3-10 seconds)

## Testing with cURL

### Test Health Endpoint
```bash
curl https://your-site.netlify.app/.netlify/functions/health
# Expected: {"ok":true}
```

### Test Environment Check
```bash
curl https://your-site.netlify.app/.netlify/functions/debug-env
# Expected: JSON with true/false for each env var
```

### Test Gift Suggestions
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-suggest \
  -H "Content-Type: application/json" \
  -d '{"query":"gift for dad who loves golf"}'
```

Expected response:
```json
{
  "query": "gift for dad who loves golf",
  "suggestions": [
    {
      "title": "Golf Club Set",
      "reason": "Perfect for practicing...",
      "keywords": ["golf", "sports", "clubs"],
      "products": [...]
    },
    ...
  ],
  "saved": true
}
```

## Common Issues & Solutions

### Issue: HTTP 404 Error

**Cause**: Netlify functions not deployed or environment variables missing

**Solution**:
1. Check functions are deployed in Netlify dashboard
2. Verify environment variables are set
3. Trigger a new deployment
4. Clear browser cache

### Issue: HTTP 500 Error

**Cause**: Function execution error (bad API key, database error, etc.)

**Solution**:
1. Check Netlify function logs for exact error
2. Verify Gemini API key at https://makersuite.google.com/app/apikey
3. Verify Supabase credentials
4. Check Supabase `gift_suggestions` table exists

### Issue: Empty Suggestions Array

**Cause**: Gemini API returned no results or JSON parsing failed

**Solution**:
1. Check Netlify function logs
2. Verify query is not empty
3. Try different search query
4. Check Gemini API quota (free tier: 60 req/min)

### Issue: No Product Images

**Cause**: Amazon Product Advertising API not configured (optional)

**Solution**:
- This is expected if Amazon PA API is not set up
- Suggestions will still work, just without product images
- To add: Configure Amazon PA API keys in Netlify

## Verification Checklist

Before going live, verify:

- [ ] All environment variables set in Netlify
- [ ] Functions deployed successfully
- [ ] Health endpoint returns `{"ok":true}`
- [ ] Debug-env shows all required vars as `true`
- [ ] Gift search returns suggestions
- [ ] Suggestions are saved to Supabase `gift_suggestions` table
- [ ] UI displays gift cards correctly
- [ ] Loading states work
- [ ] Error messages display properly
- [ ] Mobile responsive design works

## Local Development Testing

### Using Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Create local `.env` file with all variables

3. Run dev server:
   ```bash
   netlify dev
   ```

4. Visit: http://localhost:8888

5. Test gift search locally

## Success Indicators

When everything is working correctly:

1. **Frontend**: Beautiful gift cards appear after searching
2. **Database**: New rows appear in `gift_suggestions` table
3. **Logs**: 200 status codes in Netlify function logs
4. **Performance**: Response time 3-10 seconds
5. **UX**: Smooth loading states and transitions

## Need Help?

Check Netlify function logs first - they contain the most detailed error information.

**Common log locations:**
- Netlify Dashboard > Functions > ai-suggest > Logs
- Real-time logs: `netlify logs -f` (using CLI)

**Support resources:**
- Gemini API: https://ai.google.dev/docs
- Supabase: https://supabase.com/docs
- Netlify Functions: https://docs.netlify.com/functions/overview/
