# Givoro

Intelligent gift recommendation system powered by AI and Amazon Product Advertising API.

> **⚠️ IMPORTANT**: This app uses Netlify Functions for backend APIs. Run `netlify dev` (not `npm run dev`) for local development, or deploy to Netlify for production. See [Local Development](#local-development) below.

## Features

- AI-powered gift suggestions using Google Gemini
- Real-time Amazon product search integration
- Affiliate link tracking and analytics
- Supabase backend for data persistence
- Clean, responsive UI built with React + Tailwind

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Netlify Functions (serverless)
- **AI**: Google Gemini 1.5 Pro
- **Database**: Supabase (PostgreSQL)
- **Affiliate**: Amazon Product Advertising API v5

## Local Development

### Prerequisites

```bash
npm install -g netlify-cli
```

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory with:

```env
# Supabase (frontend)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Amazon Affiliate
VITE_AFFILIATE_AMAZON_TAG=purelivingp08-21
```

Netlify Functions environment variables (set in Netlify dashboard or `.env` for local):

```env
# AI
GEMINI_API_KEY=your_gemini_api_key

# Supabase (backend)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key

# Amazon Product Advertising API
AMAZON_PA_ACCESS_KEY=your_pa_api_access_key
AMAZON_PA_SECRET_KEY=your_pa_api_secret_key
AMAZON_PARTNER_TAG=purelivingp08-21
AMAZON_PA_REGION=eu-west-1
AMAZON_PA_HOST=webservices.amazon.co.uk
```

### Run Locally

**Option 1: With Netlify CLI (Recommended)**

```bash
netlify dev
```

This starts:
- Frontend dev server on `http://localhost:8888`
- Netlify Functions on `http://localhost:8888/.netlify/functions/`
- API routes work correctly at `/api/*`

**Option 2: Frontend Only (No Backend)**

```bash
npm run dev
```

This starts:
- Frontend dev server on `http://localhost:5173`
- ⚠️ API calls will fail with 404 errors (backend functions not available)
- Use this only for UI development without backend testing

## API Endpoints

### Health Check

```bash
GET /.netlify/functions/health
```

Response:
```json
{ "ok": true }
```

### Amazon Product Search

```bash
GET /api/amazon-search?q=wireless+earbuds
```

Response:
```json
{
  "query": "wireless earbuds",
  "count": 6,
  "items": [
    {
      "asin": "B0XXXXXX",
      "title": "Product Title",
      "image": "https://...",
      "price": "£29.99",
      "url": "https://amazon.co.uk/..."
    }
  ]
}
```

### AI Gift Suggestions

```bash
POST /api/ai/suggest
Content-Type: application/json

{
  "query": "gift for sister who loves yoga under £50"
}
```

Or structured format:
```json
{
  "occasion": "birthday",
  "recipient": "sister",
  "budget": "£30-50",
  "interests": ["yoga", "wellness", "meditation"]
}
```

Response:
```json
{
  "suggestions": [
    {
      "title": "Premium Yoga Mat",
      "reason": "Perfect for daily practice with eco-friendly materials",
      "keywords": ["yoga mat", "eco friendly", "non slip"],
      "products": [
        {
          "asin": "B0XXXXXX",
          "title": "Eco Yoga Mat...",
          "image": "https://...",
          "price": "£34.99",
          "url": "https://..."
        }
      ]
    }
  ],
  "saved": true
}
```

### Affiliate Redirect

```bash
GET /api/aff/redirect?url=https://amazon.co.uk/dp/B0XXX&name=Product%20Name
```

This endpoint:
1. Appends the affiliate tag to the URL
2. Records the click in `affiliate_clicks` table
3. Redirects (302) to the final Amazon URL

### Debug Environment (Dev Only)

```bash
GET /.netlify/functions/debug-env
```

Returns which environment variables are configured (true/false only, never actual values).

## Database Schema

### gift_suggestions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| query | text | User's search query |
| ai_response | jsonb | Full AI response with suggestions |
| created_at | timestamptz | Timestamp |

### affiliate_clicks

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| product_name | text | Product name (optional) |
| product_url | text | Full affiliate URL |
| affiliate_tag | text | Amazon partner tag |
| created_at | timestamptz | Timestamp |

## Production Deployment

### Netlify Configuration

The `netlify.toml` configures:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- API routing: `/api/*` → `/.netlify/functions/:splat`

### Deploy

```bash
# Connect to Netlify
netlify init

# Deploy
netlify deploy --prod
```

Set all environment variables in the Netlify dashboard under Site settings → Environment variables.

## Testing

### Function Tests

```bash
# Health check
curl http://localhost:8888/.netlify/functions/health

# Amazon search
curl "http://localhost:8888/api/amazon-search?q=wireless+mouse"

# AI suggestions
curl -X POST http://localhost:8888/api/ai/suggest \
  -H "Content-Type: application/json" \
  -d '{"query": "gift for dad who loves golf under £100"}'

# Debug environment
curl http://localhost:8888/.netlify/functions/debug-env
```

## Security

- All API keys are server-side only (in Netlify Functions)
- Frontend only has read-only Supabase anon key
- RLS policies restrict database access
- CORS enabled for all endpoints
- No secrets exposed in client code

## License

Proprietary
