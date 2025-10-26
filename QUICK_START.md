# Quick Start Guide

## Running the App

### You're Seeing "Error: HTTP 404"?

This happens when:
1. You're running `npm run dev` instead of `netlify dev`
2. The backend API functions aren't available
3. You're in development mode without Netlify CLI

### Solution 1: Deploy to Netlify (Recommended)

The app is designed for Netlify hosting. Deploy it once:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (first time)
netlify init

# Set environment variables in Netlify dashboard
# Then deploy
netlify deploy --prod
```

### Solution 2: Run with Netlify Dev Locally

```bash
# Install dependencies
npm install

# Install Netlify CLI globally
npm install -g netlify-cli

# Run with Netlify Dev
netlify dev
```

This will start the app on `http://localhost:8888` with working backend APIs.

### Why Not `npm run dev`?

The regular Vite dev server (`npm run dev`) only runs the frontend. It doesn't know about:
- Netlify Functions (the backend APIs)
- Environment variables for functions
- API route redirects

Use `netlify dev` instead, which:
- ✅ Runs both frontend and backend
- ✅ Proxies API calls correctly
- ✅ Loads environment variables
- ✅ Simulates production environment

## Environment Variables

### Required for Deployment

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
AMAZON_PA_ACCESS_KEY=your_pa_api_access_key
AMAZON_PA_SECRET_KEY=your_pa_api_secret_key
AMAZON_PARTNER_TAG=purelivingp08-21
AMAZON_PA_REGION=eu-west-1
AMAZON_PA_HOST=webservices.amazon.co.uk
```

### For Local Development

Create `.env` file with all the above variables.

## Testing the App

Once deployed or running with `netlify dev`:

1. Click "Start Finding Gifts"
2. Select who you're buying for
3. Select the occasion
4. Select your budget
5. Select interests
6. Click "Continue"
7. Wait for AI to generate suggestions
8. View personalized gift recommendations with Amazon products

## Troubleshooting

### "Error: HTTP 404"
- **Cause**: Running without Netlify Functions
- **Fix**: Use `netlify dev` or deploy to Netlify

### "Error: GEMINI_API_KEY not configured"
- **Cause**: Missing environment variables
- **Fix**: Set variables in Netlify dashboard or `.env` file

### "No products found"
- **Cause**: Amazon PA-API credentials invalid
- **Fix**: Verify Amazon PA-API keys in environment variables

### "Failed to get gift ideas"
- **Cause**: Gemini API error or rate limit
- **Fix**: Check Gemini API quota and key validity

## Project Structure

```
givoro/
├── src/                      # Frontend React app
│   ├── components/          # UI components
│   ├── hooks/              # React hooks
│   ├── types/              # TypeScript types
│   ├── App.tsx             # Main app component
│   └── api.ts              # API client
├── netlify/
│   └── functions/          # Backend API functions
│       ├── ai-suggest.ts   # AI gift suggestions
│       ├── amazon-search.ts # Amazon product search
│       └── aff-redirect.ts # Affiliate link tracking
├── lib/
│   ├── ai/                 # AI integration
│   ├── supabase.ts        # Database client
│   └── db-queries.ts      # Database operations
└── supabase/
    └── migrations/        # Database schema
```

## Next Steps

1. Deploy to Netlify
2. Set up environment variables
3. Test the conversational flow
4. Monitor AI suggestions quality
5. Track affiliate clicks in Supabase

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review [API_SETUP.md](./API_SETUP.md) for API configuration
- See phase completion docs for implementation details
