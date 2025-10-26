/*
  # Create gift_suggestions and affiliate_clicks tables

  1. New Tables
    - `gift_suggestions`
      - `id` (uuid, primary key)
      - `query` (text) - User's original query or structured input
      - `ai_response` (jsonb) - Full AI-generated suggestions with products
      - `created_at` (timestamptz) - When the suggestion was generated
    
    - `affiliate_clicks`
      - `id` (uuid, primary key)
      - `product_name` (text, nullable) - Optional product name
      - `product_url` (text) - Full affiliate URL that was clicked
      - `affiliate_tag` (text) - Amazon partner tag used
      - `created_at` (timestamptz) - When the click occurred

  2. Security
    - Enable RLS on both tables
    - Both tables are write-only for the application (no read policies needed for users)
    - Service role has full access for analytics
*/

CREATE TABLE IF NOT EXISTS gift_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  ai_response jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text,
  product_url text NOT NULL,
  affiliate_tag text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gift_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to gift_suggestions"
  ON gift_suggestions
  FOR ALL
  USING (true);

CREATE POLICY "Allow service role full access to affiliate_clicks"
  ON affiliate_clicks
  FOR ALL
  USING (true);
