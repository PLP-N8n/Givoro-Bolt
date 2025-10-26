# Quick Test Guide

## Test Your Site in 60 Seconds

### Step 1: Check Environment (10 seconds)
Visit: `https://your-site.netlify.app/.netlify/functions/debug-env`

**Expected:**
```json
{
  "GEMINI_API_KEY": true,
  "SUPABASE_URL": true,
  "SUPABASE_SERVICE_ROLE": true
}
```

✅ **All true?** Continue to Step 2  
❌ **Any false?** Environment variables not set properly

---

### Step 2: Test Gift Search (30 seconds)

1. Visit your site homepage
2. Type: `gift for wife under £50`
3. Click **Get Ideas**

**Expected:**
- Loading animation (6 skeleton cards)
- After 3-5 seconds: Beautiful gift suggestions
- Each card shows title, reason, and keywords

✅ **Works?** Success! You're done!  
❌ **404 Error?** Redeploy with "Clear cache and deploy"  
❌ **500 Error?** Check Netlify function logs

---

### Step 3: Verify Database (20 seconds)

Check Supabase Dashboard:
1. Go to **Table Editor**
2. Select `gift_suggestions` table
3. You should see your test query saved

✅ **Row exists?** Everything is working!

---

## Quick Fixes

### If you get 404:
1. Netlify Dashboard → Deploys
2. **Trigger deploy** → **Clear cache and deploy site**
3. Wait 2-3 minutes
4. Test again

### If you get 500:
1. Netlify Dashboard → Functions → ai-suggest
2. Click on latest invocation
3. Read error message
4. Common issues:
   - Invalid Gemini API key
   - Invalid Supabase credentials
   - Table doesn't exist

### If environment check fails:
1. Netlify Dashboard → Site configuration → Environment variables
2. Add missing variables:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE`
3. Save and redeploy

---

## Command Line Tests

```bash
# Test environment
curl https://your-site.netlify.app/.netlify/functions/debug-env

# Test gift search
curl -X POST https://your-site.netlify.app/api/ai-suggest \
  -H "Content-Type: application/json" \
  -d '{"query":"gift for testing"}'
```

---

## Success Checklist

- [ ] Environment shows all `true`
- [ ] Gift search returns suggestions
- [ ] UI displays beautiful cards
- [ ] Data saved to Supabase
- [ ] No 404 or 500 errors

**All checked?** 🎉 Your site is fully working!

---

## Need Help?

See **TESTING_GUIDE.md** for detailed troubleshooting.
