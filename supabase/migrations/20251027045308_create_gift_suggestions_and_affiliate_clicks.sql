/*
  # Create gift_suggestions and affiliate_clicks tables

  1. New Tables
    - `gift_suggestions`
      - `id` (uuid, primary key)
      - `query` (text) - User's original query or structured input
      - `ai_response` (jsonb) - Full AI-generated suggestions with products
      - `session_id` (text) - Session tracking for user journey analysis
      - `created_at` (timestamptz) - When the suggestion was generated
    
    - `affiliate_clicks`
      - `id` (uuid, primary key)
      - `suggestion_id` (uuid, foreign key) - Links click to suggestion
      - `product_name` (text, nullable) - Optional product name
      - `product_url` (text) - Full affiliate URL that was clicked
      - `affiliate_tag` (text) - Amazon partner tag used
      - `created_at` (timestamptz) - When the click occurred

  2. Security
    - RLS disabled - these are service-role only analytics tables
    - No public access needed
    - Service role has full access for backend operations

  3. Performance
    - Indexes on created_at for time-series queries
    - Indexes on session_id and suggestion_id for analytics
*/

CREATE TABLE IF NOT EXISTS gift_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  ai_response jsonb NOT NULL,
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid REFERENCES gift_suggestions(id) ON DELETE SET NULL,
  product_name text,
  product_url text NOT NULL,
  affiliate_tag text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- No RLS needed - service role only tables
-- RLS disabled by default

-- Indexes for performance
CREATE INDEX idx_gift_suggestions_created_at ON gift_suggestions(created_at DESC);
CREATE INDEX idx_gift_suggestions_session_id ON gift_suggestions(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_affiliate_clicks_created_at ON affiliate_clicks(created_at DESC);
CREATE INDEX idx_affiliate_clicks_suggestion_id ON affiliate_clicks(suggestion_id) WHERE suggestion_id IS NOT NULL;
