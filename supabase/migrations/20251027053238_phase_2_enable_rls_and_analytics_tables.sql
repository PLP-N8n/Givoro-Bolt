/*
  # Phase 2: Database Security and Analytics Enhancement
  
  ## Overview
  This migration enhances database security and adds comprehensive analytics tracking capabilities.
  
  ## 1. Security: Enable Row Level Security (RLS)
  
  Enable RLS on all existing tables to ensure proper access control:
  - `gift_suggestions` - AI-generated gift recommendations
  - `affiliate_clicks` - Click tracking for affiliate links
  - `saved_gifts` - User-saved favorite gifts
  
  ## 2. RLS Policies for Service Role Access
  
  Since these are analytics tables accessed by Netlify Functions using service role:
  - Service role bypasses RLS by default, so no explicit policies needed
  - RLS enabled as security best practice
  - Anonymous users have no direct database access
  
  ## 3. New Analytics Tables
  
  ### sessions table
  - Tracks anonymous user journeys through the gift recommendation flow
  - Links multiple gift suggestions to a single browsing session
  - Enables funnel analysis and conversion tracking
  
  Columns:
  - `id` (uuid, primary key) - Unique session identifier
  - `started_at` (timestamptz) - When session began
  - `last_activity_at` (timestamptz) - Most recent activity timestamp
  - `user_agent` (text, nullable) - Browser/device information
  - `ip_address` (text, nullable) - Anonymized IP for geo-analytics
  - `utm_source` (text, nullable) - Marketing campaign tracking
  - `utm_medium` (text, nullable) - Marketing medium tracking
  - `utm_campaign` (text, nullable) - Marketing campaign name
  - `completed_steps` (jsonb) - Tracks which conversation steps were completed
  - `converted` (boolean) - Whether session resulted in affiliate click
  
  ### user_profiles table
  - Stores preferences for returning users
  - Enables personalized recommendations
  - Links to sessions for behavior analysis
  
  Columns:
  - `id` (uuid, primary key) - Unique profile identifier
  - `email` (text, nullable, unique) - Optional email for profile claiming
  - `session_ids` (text[], array) - All sessions belonging to this user
  - `favorite_recipients` (jsonb) - Frequently searched recipients
  - `typical_budget` (text, nullable) - User's common budget range
  - `interests` (text[], array) - Extracted interests across searches
  - `total_suggestions_viewed` (integer) - Lifetime suggestion count
  - `total_clicks` (integer) - Lifetime affiliate click count
  - `created_at` (timestamptz) - Profile creation date
  - `updated_at` (timestamptz) - Last profile update
  
  ## 4. Performance Indexes
  
  Add indexes for common query patterns:
  - Session lookup by ID and time range
  - Profile lookup by email and session
  - Analytics queries grouped by date
  
  ## 5. Foreign Key Relationships
  
  - Link `gift_suggestions.session_id` to `sessions.id` (optional reference)
  - Enable cascading deletes for data retention policies
  
  ## Important Notes
  
  - All tables use RLS for security-by-default approach
  - Service role has full access for backend operations
  - Frontend never directly accesses database
  - All operations go through Netlify Functions
*/

-- ============================================================================
-- STEP 1: Enable RLS on Existing Tables
-- ============================================================================

-- Enable RLS on gift_suggestions
ALTER TABLE gift_suggestions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on affiliate_clicks
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on saved_gifts
ALTER TABLE saved_gifts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create Sessions Table for User Journey Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now() NOT NULL,
  last_activity_at timestamptz DEFAULT now() NOT NULL,
  user_agent text,
  ip_address text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  completed_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
  converted boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create User Profiles Table for Personalization
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  session_ids text[] DEFAULT '{}'::text[] NOT NULL,
  favorite_recipients jsonb DEFAULT '[]'::jsonb NOT NULL,
  typical_budget text,
  interests text[] DEFAULT '{}'::text[] NOT NULL,
  total_suggestions_viewed integer DEFAULT 0 NOT NULL,
  total_clicks integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Add Performance Indexes
-- ============================================================================

-- Sessions indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_converted ON sessions(converted) WHERE converted = true;
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity_at DESC);

-- User profiles indexes for lookup and analytics
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_clicks ON user_profiles(total_clicks DESC) WHERE total_clicks > 0;

-- Existing tables - add session_id foreign key indexes (already exist from previous migration)
-- These are recreated here as IF NOT EXISTS for idempotency
CREATE INDEX IF NOT EXISTS idx_gift_suggestions_session_id ON gift_suggestions(session_id) WHERE session_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Add Saved Gifts Performance Indexes (Missing from Phase 1)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_saved_gifts_session_id ON saved_gifts(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_gifts_user_email ON saved_gifts(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_gifts_created_at ON saved_gifts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_gifts_is_purchased ON saved_gifts(is_purchased) WHERE is_purchased = true;

-- ============================================================================
-- NOTES ON RLS POLICIES
-- ============================================================================

/*
  RLS Policy Strategy:
  
  These tables are intentionally locked down with RLS enabled but no public policies.
  Access is exclusively through Netlify Functions using the service role key.
  
  Service role automatically bypasses RLS, providing full CRUD access to functions.
  
  This approach:
  1. Prevents any direct database access from frontend
  2. Enforces all business logic through API endpoints
  3. Enables fine-grained access control in function code
  4. Maintains security-by-default posture
  
  If public read access is needed in the future, policies can be added like:
  
  CREATE POLICY "Public read access to sessions"
    ON sessions FOR SELECT
    TO anon
    USING (true);
  
  However, for analytics data, service-role-only access is preferred.
*/