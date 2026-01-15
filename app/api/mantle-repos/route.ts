import { NextRequest, NextResponse } from "next/server"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const GITHUB_API_BASE = "https://api.github.com"

// Mantle keywords to detect related repos
const MANTLE_KEYWORDS = [
  'mantle', 'mnt', 'mantle-network', 'mantlenetwork', 'mantle-chain',
  'mantle-testnet', 'mantle-mainnet', 'mantle-sdk', 'mantle-bridge'
]

function isMantleRepo(repo: any): boolean {
  const name = (repo.name || '').toLowerCase()
  const description = (repo.description || '').toLowerCase()
  const topics = (repo.topics || []).map((t: string) => t.toLowerCase())
  
  for (const keyword of MANTLE_KEYWORDS) {
    if (name.includes(keyword)) return true
    if (description.includes(keyword)) return true
    if (topics.includes(keyword)) return true
  }
  return false
}

export async function GET(request: NextRequest) {
  console.log("\n🚀 Fetching Mantle repos...")
  
  // Try Supabase first (if table exists)
  if (isSupabaseConfigured() && supabase) {
    try {
      // Fetch repos
      const { data: repos, error } = await supabase
        .from('mantle_repos')
        .select('*')
        .order('stargazers_count', { ascending: false })
        .limit(20)
      
      if (!error && repos && repos.length > 0) {
        // Fetch contributors for each repo
        const repoIds = repos.map(r => r.id)
        const { data: contributors } = await supabase
          .from('mantle_contributors')
          .select('*')
          .in('repo_id', repoIds)
          .order('contributions', { ascending: false })
        
        // Group contributors by repo
        const contributorsByRepo = new Map<number, any[]>()
        for (const c of contributors || []) {
          if (!contributorsByRepo.has(c.repo_id)) {
            contributorsByRepo.set(c.repo_id, [])
          }
          contributorsByRepo.get(c.repo_id)!.push(c)
        }
        
        // Attach contributors to repos
        const reposWithContributors = repos.map(repo => ({
          ...repo,
          contributors: (contributorsByRepo.get(repo.id) || []).slice(0, 5)
        }))
        
        console.log(`✅ Returning ${repos.length} Mantle repos from Supabase`)
        return NextResponse.json({
          repos: reposWithContributors,
          total: repos.length,
          source: 'supabase'
        })
      }
    } catch (e) {
      // Table doesn't exist, fall through to GitHub search
      console.log("Supabase error, falling back to GitHub:", e)
    }
  }
  
  // Fallback: Search GitHub directly for Mantle repos
  console.log("📡 Searching GitHub for Mantle repos...")
  
  const githubToken = process.env.GITHUB_TOKEN
  const mantleRepos: any[] = []
  
  try {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Mantle-Leaderboard"
    }
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`
    }
    
    // Search for repos with "mantle" in name or description
    const searchQueries = [
      'mantle+blockchain',
      'mantle+network',
      'mantle+web3',
      'mantlenetwork'
    ]
    
    const foundRepos = new Set<string>()
    
    for (const query of searchQueries) {
      try {
        const response = await fetch(
          `${GITHUB_API_BASE}/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`,
          { headers }
        )
        
        if (response.ok) {
          const data = await response.json()
          for (const repo of data.items || []) {
            if (!foundRepos.has(repo.full_name) && isMantleRepo(repo)) {
              foundRepos.add(repo.full_name)
              mantleRepos.push({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                html_url: repo.html_url,
                description: repo.description,
                language: repo.language,
                stargazers_count: repo.stargazers_count || 0,
                forks_count: repo.forks_count || 0,
                pushed_at: repo.pushed_at,
                topics: repo.topics || [],
                owner_username: repo.owner?.login,
                owner_display_name: repo.owner?.login,
                owner_image_url: repo.owner?.avatar_url,
                owner_profile_id: null,
                owner_builder_score: 0
              })
            }
          }
        }
        
        // Small delay between requests
        await new Promise(r => setTimeout(r, 100))
      } catch (e) {
        console.error(`Error searching for ${query}:`, e)
      }
    }
    
    // Sort by stars
    mantleRepos.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    
    // Fetch contributors for top repos
    console.log("📡 Fetching contributors for top repos...")
    const topRepos = mantleRepos.slice(0, 12)
    
    for (const repo of topRepos) {
      try {
        const contribResponse = await fetch(
          `${GITHUB_API_BASE}/repos/${repo.full_name}/contributors?per_page=5`,
          { headers }
        )
        
        if (contribResponse.ok) {
          const contributors = await contribResponse.json()
          repo.contributors = (contributors || []).slice(0, 5).map((c: any) => ({
            login: c.login,
            avatar_url: c.avatar_url,
            contributions: c.contributions,
            html_url: c.html_url
          }))
        }
        
        // Small delay
        await new Promise(r => setTimeout(r, 50))
      } catch (e) {
        repo.contributors = []
      }
    }
    
    console.log(`✅ Found ${mantleRepos.length} Mantle repos from GitHub`)
    
    return NextResponse.json({
      repos: topRepos,
      total: mantleRepos.length,
      source: 'github'
    })
    
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json({
      repos: [],
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
