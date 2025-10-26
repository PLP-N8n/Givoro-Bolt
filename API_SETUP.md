# API Setup Instructions

## Current Issue

The gift ideas API is returning **HTTP 404** because the Netlify Functions require environment variables to be configured.

## Required Environment Variables

### For Netlify Functions (Server-Side)

These variables are used by the serverless functions and should **NOT** be prefixed with `VITE_`:

```bash
SUPABASE_URL=https://qsjwnidqheqwtuqrprou.supabase.co
SUPABASE_SERVICE_ROLE=your_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### How to Get These Values

#### 1. SUPABASE_URL & SUPABASE_SERVICE_ROLE
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Go to **Settings > API**
- Copy:
  - `URL` → SUPABASE_URL
  - `service_role` key → SUPABASE_SERVICE_ROLE

#### 2. GEMINI_API_KEY
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Click **Get API Key**
- Create or select a project
- Copy the generated API key

### Setting Environment Variables in Netlify

1. Go to your site in [Netlify Dashboard](https://app.netlify.com)
2. Navigate to **Site configuration > Environment variables**
3. Click **Add a variable**
4. Add each variable:
   - Key: `SUPABASE_URL`
   - Value: `https://qsjwnidqheqwtuqrprou.supabase.co`
   - Click **Create variable**
5. Repeat for `SUPABASE_SERVICE_ROLE` and `GEMINI_API_KEY`
6. After adding all variables, trigger a new deploy

### For Local Development

Create a `.env` file in the project root:

```bash
# Client-side (with VITE_ prefix)
VITE_SUPABASE_URL=https://qsjwnidqheqwtuqrprou.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_NAME=Givoro

# Server-side (for Netlify Functions, no VITE_ prefix)
SUPABASE_URL=https://qsjwnidqheqwtuqrprou.supabase.co
SUPABASE_SERVICE_ROLE=your_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## Testing Locally

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Run dev server with functions:
   ```bash
   netlify dev
   ```

3. Visit: http://localhost:8888

## How the API Works

1. User enters gift search query
2. Frontend calls `/api/ai-suggest` (POST)
3. Netlify redirects to `/.netlify/functions/ai-suggest`
4. Function calls Gemini API for gift ideas
5. Function enriches results with Amazon products
6. Function saves to Supabase `gift_suggestions` table
7. Returns suggestions to frontend

## Troubleshooting

### Still getting 404?
- Verify all environment variables are set in Netlify
- Check that you've redeployed after adding variables
- Look at Netlify Function logs: Site > Functions > ai-suggest

### Getting 500 errors?
- Check Netlify Function logs for detailed error messages
- Verify API keys are correct
- Ensure Supabase tables exist (run `supabase/schema.sql`)

### Gemini API errors?
- Verify API key is valid
- Check quota at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Free tier: 60 requests per minute

### Amazon search not working?
- Amazon Product Advertising API requires approval
- Fallback: gifts will show without product links

## Need Help?

Check the Netlify Function logs for detailed error messages:
1. Go to Netlify Dashboard
2. Click on your site
3. Go to **Functions**
4. Click on **ai-suggest**
5. View recent invocations and logs
