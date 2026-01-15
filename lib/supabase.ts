import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client (only if credentials are configured)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey
}

// Types for database
export interface DbProfile {
  id: string // Talent Protocol profile ID (UUID)
  display_name: string | null
  username: string | null
  image_url: string | null
  bio: string | null
  main_wallet: string | null
  builder_score: number
  human_checkmark: boolean
  
  // GitHub stats
  github_username: string | null
  github_user_id: string | null
  total_commits: string | null
  total_contributions: string | null
  crypto_commits: string | null
  stars: string | null
  forks: string | null
  repositories: string | null
  mantle_eco_commits: string | null
  
  // Onchain stats
  weekly_active_contracts: string | null
  total_transactions: string | null
  weekly_transactions: string | null
  total_fees: string | null
  weekly_fees: string | null
  
  // Builder earnings
  builder_earnings: string | null
  
  // Top project
  top_project_name: string | null
  top_project_url: string | null
  top_project_stars: number | null
  top_project_language: string | null
  
  // Recent project
  recent_project_name: string | null
  recent_project_url: string | null
  recent_project_description: string | null
  recent_project_language: string | null
  recent_project_ai_summary: string | null
  recent_project_pushed_at: string | null
  
  // Metadata
  created_at: string
  updated_at: string
}

// SQL to create the profiles table (run this in Supabase SQL editor)
export const CREATE_PROFILES_TABLE_SQL = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  username TEXT,
  image_url TEXT,
  bio TEXT,
  main_wallet TEXT,
  builder_score INTEGER DEFAULT 0,
  human_checkmark BOOLEAN DEFAULT FALSE,
  
  -- GitHub stats
  github_username TEXT,
  github_user_id TEXT,
  total_commits TEXT,
  total_contributions TEXT,
  crypto_commits TEXT,
  stars TEXT,
  forks TEXT,
  repositories TEXT,
  mantle_eco_commits TEXT,
  
  -- Onchain stats
  weekly_active_contracts TEXT,
  total_transactions TEXT,
  weekly_transactions TEXT,
  total_fees TEXT,
  weekly_fees TEXT,
  
  -- Builder earnings
  builder_earnings TEXT,
  
  -- Top project
  top_project_name TEXT,
  top_project_url TEXT,
  top_project_stars INTEGER,
  top_project_language TEXT,
  
  -- Recent project
  recent_project_name TEXT,
  recent_project_url TEXT,
  recent_project_description TEXT,
  recent_project_language TEXT,
  recent_project_ai_summary TEXT,
  recent_project_pushed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on builder_score for fast sorting
CREATE INDEX IF NOT EXISTS idx_profiles_builder_score ON profiles(builder_score DESC);

-- Create index on main_wallet for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_main_wallet ON profiles(main_wallet);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, for public read access)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON profiles
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update (for your API)
CREATE POLICY "Allow service role full access" ON profiles
  FOR ALL USING (true);
`

// SQL to create the mantle_repos table (run this in Supabase SQL editor)
export const CREATE_MANTLE_REPOS_TABLE_SQL = `
-- Create mantle_repos table for Mantle-related GitHub repositories
CREATE TABLE IF NOT EXISTS mantle_repos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  html_url TEXT NOT NULL,
  description TEXT,
  language TEXT,
  stargazers_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  pushed_at TIMESTAMPTZ,
  topics TEXT[] DEFAULT '{}',
  
  -- Owner info
  owner_username TEXT,
  owner_display_name TEXT,
  owner_image_url TEXT,
  owner_profile_id UUID REFERENCES profiles(id),
  owner_builder_score INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mantle_repos_stars ON mantle_repos(stargazers_count DESC);
CREATE INDEX IF NOT EXISTS idx_mantle_repos_pushed ON mantle_repos(pushed_at DESC);
CREATE INDEX IF NOT EXISTS idx_mantle_repos_owner ON mantle_repos(owner_profile_id);

-- Enable Row Level Security
ALTER TABLE mantle_repos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON mantle_repos
  FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON mantle_repos
  FOR ALL USING (true);
`

// Type for Mantle repos
export interface DbMantleRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  pushed_at: string | null
  topics: string[]
  owner_username: string | null
  owner_display_name: string | null
  owner_image_url: string | null
  owner_profile_id: string | null
  owner_builder_score: number
  created_at: string
  updated_at: string
}

// Helper to convert API profile to DB profile
export function apiProfileToDbProfile(profile: any): Partial<DbProfile> {
  const topProject = profile._githubProjects?.topByStars?.[0]
  const recentProject = profile._recentProject
  
  return {
    id: profile.id,
    display_name: profile.display_name || profile.name || null,
    username: profile.username || null,
    image_url: profile.image_url || null,
    bio: profile.bio || null,
    main_wallet: profile.main_wallet || null,
    builder_score: profile._builderScore || 0,
    human_checkmark: profile.human_checkmark || false,
    
    // GitHub stats
    github_username: profile._githubUsername || null,
    github_user_id: profile._githubUserId || null,
    total_commits: profile._githubStats?.total_commits || null,
    total_contributions: profile._githubStats?.total_contributions || null,
    crypto_commits: profile._githubStats?.crypto_commits || null,
    stars: profile._githubStats?.stars || null,
    forks: profile._githubStats?.forks || null,
    repositories: profile._githubStats?.repositories || null,
    mantle_eco_commits: profile._githubStats?.mantle_eco_commits || null,
    
    // Onchain stats
    weekly_active_contracts: profile._onchainStats?.weekly_active_contracts || null,
    total_transactions: profile._onchainStats?.total_transactions || null,
    weekly_transactions: profile._onchainStats?.weekly_transactions || null,
    total_fees: profile._onchainStats?.total_fees || null,
    weekly_fees: profile._onchainStats?.weekly_fees || null,
    
    // Builder earnings
    builder_earnings: profile._builderEarnings || null,
    
    // Top project
    top_project_name: topProject?.name || null,
    top_project_url: topProject?.html_url || null,
    top_project_stars: topProject?.stargazers_count || null,
    top_project_language: topProject?.language || null,
    
    // Recent project
    recent_project_name: recentProject?.name || null,
    recent_project_url: recentProject?.html_url || null,
    recent_project_description: recentProject?.description || null,
    recent_project_language: recentProject?.language || null,
    recent_project_ai_summary: recentProject?.aiSummary || null,
    recent_project_pushed_at: recentProject?.pushed_at || null,
  }
}

// Helper to convert DB profile back to API format (for frontend compatibility)
export function dbProfileToApiFormat(dbProfile: DbProfile): any {
  return {
    id: dbProfile.id,
    display_name: dbProfile.display_name,
    name: dbProfile.display_name,
    username: dbProfile.username,
    image_url: dbProfile.image_url,
    bio: dbProfile.bio,
    main_wallet: dbProfile.main_wallet,
    human_checkmark: dbProfile.human_checkmark,
    _builderScore: dbProfile.builder_score,
    _builderEarnings: dbProfile.builder_earnings,
    _githubUsername: dbProfile.github_username,
    _githubStats: {
      total_commits: dbProfile.total_commits,
      total_contributions: dbProfile.total_contributions,
      crypto_commits: dbProfile.crypto_commits,
      stars: dbProfile.stars,
      forks: dbProfile.forks,
      repositories: dbProfile.repositories,
      mantle_eco_commits: dbProfile.mantle_eco_commits,
    },
    _onchainStats: {
      weekly_active_contracts: dbProfile.weekly_active_contracts,
      total_transactions: dbProfile.total_transactions,
      weekly_transactions: dbProfile.weekly_transactions,
      total_fees: dbProfile.total_fees,
      weekly_fees: dbProfile.weekly_fees,
    },
    _githubProjects: dbProfile.top_project_name ? {
      topByStars: [{
        name: dbProfile.top_project_name,
        html_url: dbProfile.top_project_url,
        stargazers_count: dbProfile.top_project_stars,
        language: dbProfile.top_project_language,
      }],
      mostRecent: [],
    } : { topByStars: [], mostRecent: [] },
    _recentProject: dbProfile.recent_project_name ? {
      name: dbProfile.recent_project_name,
      html_url: dbProfile.recent_project_url,
      description: dbProfile.recent_project_description,
      language: dbProfile.recent_project_language,
      aiSummary: dbProfile.recent_project_ai_summary,
      pushed_at: dbProfile.recent_project_pushed_at,
    } : null,
  }
}
