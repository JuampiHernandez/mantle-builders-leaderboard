import { NextRequest, NextResponse } from "next/server"

// Disable static generation for this route
export const dynamic = "force-dynamic"

const TALENT_API_BASE = "https://api.talentprotocol.com"
const GITHUB_API_BASE = "https://api.github.com"

// ============================================
// SERVER-SIDE CACHE
// ============================================
interface CacheEntry {
  data: any
  timestamp: number
  totalProfiles: number
}

// In-memory cache (persists across requests in the same server instance)
let profilesCache: CacheEntry | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours cache TTL

// Check if cache is valid
function isCacheValid(): boolean {
  if (!profilesCache) return false
  const now = Date.now()
  return (now - profilesCache.timestamp) < CACHE_TTL
}

// Get cached data
function getCachedProfiles(): any[] | null {
  if (isCacheValid() && profilesCache) {
    console.log("✅ Returning cached profiles (age: " + Math.round((Date.now() - profilesCache.timestamp) / 1000) + "s)")
    return profilesCache.data
  }
  return null
}

// Set cache
function setCacheProfiles(profiles: any[]) {
  profilesCache = {
    data: profiles,
    timestamp: Date.now(),
    totalProfiles: profiles.length
  }
  console.log(`💾 Cached ${profiles.length} profiles`)
}

// All wallet addresses from the CSV
const walletAddresses = [
  "0x57F9a9C5b176196C713eBC5b314D34F2a769a54F",
  "0xb9f75cB1B7eC69529190d973eB12D796236a0E90",
  "0x53b47dce7c3e50caa47ee51031b24a85b49f1fff",
  "0xe8ce8754c42dfffeb59f8d074a0f702970a2d4af",
  "0x358e25cd4d7631eb874d25f4e1ae4a14b0abb56e",
  "0xc93943a414788c8010bcecd7650d4acf6967604e",
  "0xc095c7cA2B56b0F0DC572d5d4A9Eb1B37f4306a0",
  "0xbeef89a4aec71369e900e394ba828fba3b17f6c6",
  "0x8441021bfe1B7B06cC3cB53FA71370583CF3f523",
  "0x758bD5962a4228f79A98cFc682Dedc040c1CcDFb",
  "0x432795ea5aCbC944c3df02868e0CCDC58cA98DD5",
  "0x0fCe963885b15a12832813798980bDadc9744705",
  "0x4e92b60150ca2d39dd2ff41618dd4def1def1ed9",
  "0xBe76b786E4D9A6039B9e9F188e0ee0a955Cae5C8",
  "0xA0701444c0813AD0e52b69804EDF130937A7616F",
  "0x8513A856a88e63374286d0116C192733444894C0",
  "0xe7318D913b19396f6BDec87f664f0233414AeE7f",
  "0x8bCcD9FF941b08f3C06E255659596654b228eade",
  "0x229fDD5d360aB35231F1d113EE3bA05f6075dCe3",
  "0x9CA25259DAde7Bce58e5294A8F08CAA69fD59f6D",
  "0x3741D382D540248a1D47b8d3f524d31A7FBd5481",
  "0xbF2E37A9805bf0f33C5F82f8d3f3D3931b189bAC",
  "0xB38D87531f7D79Aad063A1b3F0A3b44ee244ce42",
  "0xB6E9874752Ad5370B42aA4be6593a1c86D15A82e",
  "0xF835C816cBd9ab18d35d01D1eEa5190ee308BB0f",
  "0x087a8382bc179f79f1c06ff91d9edd66985a9e59",
  "0x0993d39cefcd00d898ddfdf8807f832be3ae1d5a",
  "0xab53369e91dcFC275744DC0A30BD3E363B2785e0",
  "0x799C233F47B1Ffa09dF95F1e708816Bb4F16eF51",
  "0xE89fEf221bdEd027C4c9F07D256b9Dc1422A2455",
  "0xca85460d23Bfb2e0079bAb5AAC84921D9D0762a4",
  "0xbbaF587d7be29308A2340bC82418c89814D2CeE7",
  "0x8B24160a8138209128D46Cd0B019c19cB8f6e511",
  "0x55A5705453Ee82c742274154136Fce8149597058",
  "0xa235DC00B1d7501b919e27C2968999d4bCA5Bc3e",
  "0x5E2be9Eaaf551f1862585A7D1FFaE2B3D7fE212D",
  "0x09BB59c870AA5CB0e7A01b2f96d72B29f3a4BE90",
  "0xF9A56a259487c10948E3b9ddC7a9ba84C7e621aC",
  "0xDEd02370dC860c84e0D1E8b1BB8d789E9e76625F",
  "0x2189878C4963B84Fd737640db71D7650214c4A18",
  "0xe8771172D9a31C1572d7Ff85cd14422F03457198",
  "0xF507Baf56754091Fc700d3cac895F005AF446fF4",
  "0xd4C8c8778214E27065ee4ECfa9834BD533430cB3",
]

// ENS names from the CSV (to search by identity)
const ensNames = [
  "0xoucan",
  "akhilnanavati",
  "thefullstack",
  "0xgonzalo",
  "ariiellus",
  "fabit",
  "deca12x",
  "forestkeeperio",
  "raspc",
  "juliomcruz",
  "mati-os",
  "meximalist",
  "ozkite",
  "solsiete",
  "vixtorxva",
  "xfajarr",
]

// GitHub data point slugs
const GITHUB_SLUGS = [
  "github_crypto_repositories_commits",
  "github_crypto_repositories_contributed",
  "github_forks",
  "github_repositories",
  "github_stars",
  "github_total_contributions",
  "github_total_commits",
  "github_mantle_eco_repositories_commits", // Mantle ecosystem commits
]

// Mantle-specific credential slug for advanced search
const MANTLE_CREDENTIAL_SLUG = "github_mantle_eco_repositories_commits"

// Additional data point slugs (for earnings, etc.)
const EXTRA_SLUGS = [
  "talent_builder_rewards_total_usd",
]

// Onchain data point slugs
const ONCHAIN_SLUGS = [
  "onchain_weekly_active_contracts",
  "onchain_total_contract_transactions",
  "onchain_weekly_contract_transactions",
  "onchain_total_contract_fees",
  "onchain_weekly_contract_fees",
]

// Map credential_slug to our stats keys
const SLUG_TO_KEY: Record<string, string> = {
  "github_crypto_repositories_commits": "crypto_commits",
  "github_crypto_repositories_contributed": "crypto_repos_contributed",
  "github_forks": "forks",
  "github_repositories": "repositories",
  "github_stars": "stars",
  "github_total_contributions": "total_contributions",
  "github_total_commits": "total_commits",
  "github_mantle_eco_repositories_commits": "mantle_eco_commits", // Mantle ecosystem commits
  // Onchain stats
  "onchain_weekly_active_contracts": "weekly_active_contracts",
  "onchain_total_contract_transactions": "total_transactions",
  "onchain_weekly_contract_transactions": "weekly_transactions",
  "onchain_total_contract_fees": "total_fees",
  "onchain_weekly_contract_fees": "weekly_fees",
  "talent_builder_rewards_total_usd": "builder_earnings",
}

// Types for GitHub repositories
interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  pushed_at: string
  updated_at: string
  topics: string[]
}

interface RecentProjectInfo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stars: number
  pushed_at: string
  readme: string | null
  aiSummary: string | null
}

interface GitHubProjects {
  topByStars: GitHubRepo[]
  mostRecent: GitHubRepo[]
  username: string | null
}

// Helper to extract score from profile
function getScore(profile: any): number {
  if (typeof profile.score === 'number') return profile.score
  if (profile.score?.points) return profile.score.points
  if (typeof profile.builder_score === 'number') return profile.builder_score
  if (profile.builder_score?.points) return profile.builder_score.points
  return 0
}

// Result type for data points fetch
interface DataPointsResult {
  stats: Record<string, string | null>
  onchainStats: Record<string, string | null>
  githubUserId: string | null
  builderEarnings: string | null
  mantleEcoCommits: string | null
}

// Fetch data points using profile UUID (id field)
async function fetchDataPointsByProfileId(profileId: string, apiKey: string): Promise<DataPointsResult> {
  const result: DataPointsResult = {
    stats: {
      crypto_commits: null,
      crypto_repos_contributed: null,
      forks: null,
      repositories: null,
      stars: null,
      total_contributions: null,
      total_commits: null,
      mantle_eco_commits: null,
    },
    onchainStats: {
      weekly_active_contracts: null,
      total_transactions: null,
      weekly_transactions: null,
      total_fees: null,
      weekly_fees: null,
    },
    githubUserId: null,
    builderEarnings: null,
    mantleEcoCommits: null
  }

  try {
    // Combine GitHub slugs, extra slugs, and onchain slugs
    const allSlugs = [...GITHUB_SLUGS, ...EXTRA_SLUGS, ...ONCHAIN_SLUGS]
    const slugsParam = allSlugs.join(",")
    const url = `${TALENT_API_BASE}/data_points?id=${profileId}&slugs=${slugsParam}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-API-KEY": apiKey
      }
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.data_points && Array.isArray(data.data_points)) {
        for (const dp of data.data_points) {
          const credentialSlug = dp.credential_slug
          const readableValue = dp.readable_value
          
          if (credentialSlug && SLUG_TO_KEY[credentialSlug]) {
            const statKey = SLUG_TO_KEY[credentialSlug]
            if (statKey === 'builder_earnings') {
              result.builderEarnings = readableValue
            } else if (statKey === 'mantle_eco_commits') {
              result.mantleEcoCommits = readableValue
              result.stats[statKey] = readableValue
            } else if (['weekly_active_contracts', 'total_transactions', 'weekly_transactions', 'total_fees', 'weekly_fees'].includes(statKey)) {
              result.onchainStats[statKey] = readableValue
            } else {
              result.stats[statKey] = readableValue
            }
          }
          
          // Extract GitHub user ID from account_identifier (when account_source is 'github')
          if (dp.account_source === 'github' && dp.account_identifier && !result.githubUserId) {
            result.githubUserId = dp.account_identifier
          }
        }
      }
    }
  } catch (error) {
    // Silently fail for individual data point fetches
  }

  return result
}

// Get GitHub username from GitHub user ID
async function getGitHubUsernameFromId(githubId: string, githubToken: string | undefined): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Mantle-Leaderboard"
    }
    
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`
    }

    const response = await fetch(`${GITHUB_API_BASE}/user/${githubId}`, { headers })
    
    if (response.ok) {
      const user = await response.json()
      return user.login || null
    }
  } catch (error) {
    // Silently fail
  }
  return null
}

// Extract GitHub username from profile - try multiple methods
function extractGitHubUsernameFromProfile(profile: any): string | null {
  const name = profile.name
  const relativePath = profile.relative_path
  
  if (name && /^[a-zA-Z0-9_-]+$/.test(name)) {
    return name
  }
  
  if (relativePath && relativePath.startsWith('/')) {
    const username = relativePath.slice(1)
    if (/^[a-zA-Z0-9_-]+$/.test(username)) {
      return username
    }
  }
  
  return null
}

// Fetch README content from a GitHub repository
async function fetchReadme(owner: string, repo: string, githubToken: string | undefined): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3.raw",
      "User-Agent": "Mantle-Leaderboard"
    }
    
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`
    }

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
      { headers }
    )

    if (response.ok) {
      const readme = await response.text()
      // Limit to first 2000 characters for AI processing
      return readme.slice(0, 2000)
    }
  } catch (error) {
    // Silently fail
  }
  return null
}

// Generate AI summary using OpenAI API
async function generateAISummary(readme: string | null, repoName: string, openaiKey: string | undefined): Promise<string | null> {
  if (!openaiKey || !readme) {
    // Fallback: Create a simple summary from the README
    return createSimpleSummary(readme, repoName)
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes GitHub repositories. Create a concise 1-2 sentence summary of what the project does based on the README. Focus on the main purpose and technology used. Keep it under 150 characters."
          },
          {
            role: "user",
            content: `Summarize this GitHub repository "${repoName}":\n\n${readme}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.choices?.[0]?.message?.content?.trim() || null
    }
  } catch (error) {
    // Fallback to simple summary
  }
  
  return createSimpleSummary(readme, repoName)
}

// Create a simple summary from README without AI
function createSimpleSummary(readme: string | null, repoName: string): string | null {
  if (!readme) {
    return null
  }

  // Try to extract the first meaningful paragraph
  const lines = readme.split('\n').filter(line => {
    const trimmed = line.trim()
    // Skip empty lines, headers, badges, and links
    return trimmed.length > 20 && 
           !trimmed.startsWith('#') && 
           !trimmed.startsWith('![') &&
           !trimmed.startsWith('[!') &&
           !trimmed.startsWith('```') &&
           !trimmed.match(/^\[.*\]\(.*\)$/) &&
           !trimmed.match(/^[-*]/)
  })

  if (lines.length > 0) {
    // Get first meaningful line and truncate
    let summary = lines[0].trim()
    // Remove markdown formatting
    summary = summary.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '')
    // Truncate to 150 chars
    if (summary.length > 150) {
      summary = summary.slice(0, 147) + '...'
    }
    return summary
  }

  return `A project called ${repoName}`
}

// Fetch GitHub repositories for a user
async function fetchGitHubRepos(username: string, githubToken: string | undefined): Promise<GitHubProjects> {
  const result: GitHubProjects = {
    topByStars: [],
    mostRecent: [],
    username: username
  }

  try {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Mantle-Leaderboard"
    }
    
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`
    }

    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=pushed&direction=desc`,
      { headers }
    )

    if (!response.ok) {
      return result
    }

    const repos: GitHubRepo[] = await response.json()
    
    if (!Array.isArray(repos) || repos.length === 0) {
      return result
    }

    // Filter out forks
    const ownedRepos = repos.filter(repo => repo.full_name.startsWith(`${username}/`))

    // Top 5 by stars (for profile detail page)
    const sortedByStars = [...ownedRepos].sort((a, b) => b.stargazers_count - a.stargazers_count)
    result.topByStars = sortedByStars.slice(0, 5).map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      language: repo.language,
      pushed_at: repo.pushed_at,
      updated_at: repo.updated_at,
      topics: repo.topics || []
    }))

    // Top 5 most recent (by pushed_at) - for profile detail page
    const sortedByRecent = [...ownedRepos].sort((a, b) => 
      new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
    )
    result.mostRecent = sortedByRecent.slice(0, 5).map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      language: repo.language,
      pushed_at: repo.pushed_at,
      updated_at: repo.updated_at,
      topics: repo.topics || []
    }))

  } catch (error) {
    // Silently fail
  }

  return result
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.TALENT_API_KEY
  const githubToken = process.env.GITHUB_TOKEN
  const openaiKey = process.env.OPENAI_API_KEY
  
  // Check for force refresh query param
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get('refresh') === 'true'
  
  console.log("\n🚀 Starting Talent Protocol API fetch...")
  console.log("📋 Environment check:")
  console.log("   - TALENT_API_KEY:", apiKey ? `✅ Set (${apiKey.slice(0, 8)}...)` : "❌ NOT SET")
  console.log("   - GITHUB_TOKEN:", githubToken ? `✅ Set (${githubToken.slice(0, 8)}...)` : "⚠️ Not set")
  console.log("   - OPENAI_API_KEY:", openaiKey ? `✅ Set (${openaiKey.slice(0, 8)}...)` : "⚠️ Not set")
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedProfiles = getCachedProfiles()
    if (cachedProfiles) {
      return NextResponse.json({
        profiles: cachedProfiles,
        total: cachedProfiles.length,
        cached: true,
        cacheAge: profilesCache ? Math.round((Date.now() - profilesCache.timestamp) / 1000) : 0
      })
    }
  } else {
    console.log("🔄 Force refresh requested - bypassing cache")
  }
  
  if (!apiKey) {
    console.error("❌ TALENT_API_KEY not configured!")
    return NextResponse.json(
      { error: "TALENT_API_KEY not configured. Please add it to your Vercel environment variables." },
      { status: 500 }
    )
  }

  if (!githubToken) {
    console.log("⚠️ GITHUB_TOKEN not configured - GitHub API will have lower rate limits")
  } else {
    console.log("✅ GITHUB_TOKEN found")
  }

  if (!openaiKey) {
    console.log("⚠️ OPENAI_API_KEY not configured - Using simple summaries instead of AI")
  } else {
    console.log("✅ OPENAI_API_KEY found")
  }

  const allProfiles: any[] = []
  const foundIds = new Set<string>()

  // STEP 1: Search profiles by wallet addresses (paginated - max 25 per page)
  console.log("📡 [1/7] Searching profiles by wallet addresses...")
  
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    try {
      const query = {
        walletAddresses: walletAddresses,
        exactMatch: true
      }
      
      const params = new URLSearchParams({
        query: JSON.stringify(query),
        sort: JSON.stringify({ score: { order: "desc" }, id: { order: "desc" } }),
        page: String(page),
        per_page: "25"
      })

      const response = await fetch(
        `${TALENT_API_BASE}/search/advanced/profiles?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "X-API-KEY": apiKey
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        if (data.profiles?.length > 0) {
          for (const profile of data.profiles) {
            profile._builderScore = getScore(profile)
            if (!foundIds.has(profile.id)) {
              foundIds.add(profile.id)
              allProfiles.push(profile)
            }
          }
          
          const pagination = data.pagination
          if (pagination && pagination.current_page < pagination.last_page) {
            page++
          } else {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      } else {
        console.error(`   ❌ Wallet search error: ${response.status}`)
        hasMore = false
      }
    } catch (error) {
      console.error("   ❌ Wallet search error:", error)
      hasMore = false
    }
  }
  console.log(`   ✅ Found ${allProfiles.length} profiles from wallet search`)

  // STEP 2: Search ENS names by identity (in parallel)
  console.log("📡 [2/7] Searching profiles by ENS identity...")
  
  const ensSearchPromises = ensNames.map(async (ens) => {
    try {
      const query = { identity: ens }
      const params = new URLSearchParams({
        query: JSON.stringify(query),
        sort: JSON.stringify({ score: { order: "desc" }, id: { order: "desc" } }),
        page: "1",
        per_page: "1"
      })

      const response = await fetch(
        `${TALENT_API_BASE}/search/advanced/profiles?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "X-API-KEY": apiKey
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.profiles?.length > 0) {
          const profile = data.profiles[0]
          profile._builderScore = getScore(profile)
          profile._searchedIdentity = ens
          return profile
        }
      }
    } catch (error) {
      // Continue
    }
    return null
  })
  
  const ensProfiles = await Promise.all(ensSearchPromises)
  
  for (const profile of ensProfiles) {
    if (profile && !foundIds.has(profile.id)) {
      foundIds.add(profile.id)
      allProfiles.push(profile)
    }
  }
  console.log(`   ✅ Total profiles after ENS search: ${allProfiles.length}`)

  // STEP 3: Search for profiles with Mantle ecosystem commits credential
  console.log("📡 [3/7] Searching profiles with Mantle ecosystem commits credential...")
  
  let mantlePage = 1
  let mantleHasMore = true
  let mantleProfilesFound = 0
  
  while (mantleHasMore) {
    try {
      // Search for profiles that have the github_mantle_eco_repositories_commits credential
      // Using valueRange with min: 1 to find profiles with at least 1 commit
      const query = {
        credentials: [
          {
            slug: MANTLE_CREDENTIAL_SLUG,
            valueRange: { min: 1 }
          }
        ]
      }
      
      const params = new URLSearchParams({
        query: JSON.stringify(query),
        sort: JSON.stringify({ score: { order: "desc" }, id: { order: "desc" } }),
        page: String(mantlePage),
        per_page: "25"
      })

      const response = await fetch(
        `${TALENT_API_BASE}/search/advanced/profiles?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "X-API-KEY": apiKey
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        if (data.profiles?.length > 0) {
          for (const profile of data.profiles) {
            profile._builderScore = getScore(profile)
            profile._hasMantleCredential = true // Mark as having Mantle credential
            if (!foundIds.has(profile.id)) {
              foundIds.add(profile.id)
              allProfiles.push(profile)
              mantleProfilesFound++
            }
          }
          
          const pagination = data.pagination
          if (pagination && pagination.current_page < pagination.last_page) {
            mantlePage++
          } else {
            mantleHasMore = false
          }
        } else {
          mantleHasMore = false
        }
      } else {
        const errorText = await response.text()
        console.error(`   ❌ Mantle credential search error: ${response.status} - ${errorText}`)
        mantleHasMore = false
      }
    } catch (error) {
      console.error("   ❌ Mantle credential search error:", error)
      mantleHasMore = false
    }
  }
  console.log(`   ✅ Found ${mantleProfilesFound} new profiles with Mantle ecosystem commits`)
  console.log(`   ✅ Total profiles: ${allProfiles.length}`)

  // STEP 4: Fetch data points for ALL profiles using their UUID
  console.log("📡 [4/7] Fetching data points for all profiles...")
  
  const dataPointPromises = allProfiles.map(async (profile) => {
    const result = await fetchDataPointsByProfileId(profile.id, apiKey)
    profile._githubStats = result.stats
    profile._onchainStats = result.onchainStats
    profile._githubUserId = result.githubUserId
    profile._builderEarnings = result.builderEarnings
    profile._mantleEcoCommits = result.mantleEcoCommits
  })
  
  await Promise.all(dataPointPromises)
  
  let profilesWithGitHub = 0
  let profilesWithGitHubId = 0
  let profilesWithOnchain = 0
  let profilesWithMantleCommits = 0
  allProfiles.forEach((profile) => {
    if (profile._githubStats && Object.values(profile._githubStats).some(v => v !== null)) {
      profilesWithGitHub++
    }
    if (profile._githubUserId) {
      profilesWithGitHubId++
    }
    if (profile._onchainStats && Object.values(profile._onchainStats).some(v => v !== null)) {
      profilesWithOnchain++
    }
    if (profile._mantleEcoCommits) {
      profilesWithMantleCommits++
    }
  })
  console.log(`   📊 ${profilesWithGitHub} profiles have GitHub data`)
  console.log(`   🔑 ${profilesWithGitHubId} profiles have GitHub user IDs`)
  console.log(`   ⛓️ ${profilesWithOnchain} profiles have onchain data`)
  console.log(`   🟢 ${profilesWithMantleCommits} profiles have Mantle ecosystem commits`)

  // STEP 5: Fetch GitHub usernames from IDs and then fetch repositories
  console.log("📡 [5/7] Fetching GitHub repositories...")
  
  // First, resolve GitHub usernames from IDs
  const usernamePromises = allProfiles.map(async (profile) => {
    if (profile._githubUserId) {
      const username = await getGitHubUsernameFromId(profile._githubUserId, githubToken)
      if (username) {
        profile._githubUsername = username
        return
      }
    }
    
    const fallbackUsername = extractGitHubUsernameFromProfile(profile)
    if (fallbackUsername) {
      profile._githubUsername = fallbackUsername
    }
  })
  
  await Promise.all(usernamePromises)
  
  // Now fetch repos for profiles with usernames
  const repoPromises = allProfiles.map(async (profile) => {
    if (profile._githubUsername) {
      profile._githubProjects = await fetchGitHubRepos(profile._githubUsername, githubToken)
    } else {
      profile._githubProjects = { topByStars: [], mostRecent: [], username: null }
    }
  })
  
  await Promise.all(repoPromises)
  
  let profilesWithRepos = 0
  allProfiles.forEach((profile) => {
    if (profile._githubProjects?.topByStars?.length > 0 || profile._githubProjects?.mostRecent?.length > 0) {
      profilesWithRepos++
    }
  })
  console.log(`   📦 ${profilesWithRepos} profiles have GitHub repositories`)

  // STEP 6: Fetch README and generate AI summaries for most recent projects
  console.log("📡 [6/7] Fetching READMEs and generating AI summaries...")
  
  const summaryPromises = allProfiles.map(async (profile) => {
    const mostRecent = profile._githubProjects?.mostRecent?.[0]
    if (mostRecent && profile._githubUsername) {
      // Fetch README
      const readme = await fetchReadme(profile._githubUsername, mostRecent.name, githubToken)
      
      // Generate AI summary
      const aiSummary = await generateAISummary(readme, mostRecent.name, openaiKey)
      
      profile._recentProject = {
        name: mostRecent.name,
        full_name: mostRecent.full_name,
        description: mostRecent.description,
        html_url: mostRecent.html_url,
        language: mostRecent.language,
        stars: mostRecent.stargazers_count,
        pushed_at: mostRecent.pushed_at,
        readme: readme ? readme.slice(0, 500) : null, // Store truncated readme
        aiSummary: aiSummary
      }
    }
  })
  
  await Promise.all(summaryPromises)
  
  let profilesWithSummaries = 0
  allProfiles.forEach((profile) => {
    if (profile._recentProject?.aiSummary) {
      profilesWithSummaries++
    }
  })
  console.log(`   🤖 ${profilesWithSummaries} profiles have AI summaries`)

  // STEP 7: Sort by score descending
  console.log("📡 [7/7] Sorting and finalizing...")
  allProfiles.sort((a, b) => (b._builderScore || 0) - (a._builderScore || 0))

  // Log top profiles with their stats
  console.log("\n🎉 Top 10 profiles:")
  allProfiles.slice(0, 10).forEach((p, i) => {
    const name = p.display_name || p.name || p.username || "Unknown"
    const stats = p._githubStats || {}
    const topProject = p._githubProjects?.topByStars?.[0]
    const recentProject = p._recentProject
    
    console.log(`   ${i + 1}. ${name} (Score: ${p._builderScore})`)
    console.log(`      📊 Commits: ${stats.total_commits ?? '-'} | Contributions: ${stats.total_contributions ?? '-'}`)
    if (topProject) {
      console.log(`      ⭐ Top: ${topProject.name} (${topProject.stargazers_count}★)`)
    }
    if (recentProject?.aiSummary) {
      console.log(`      🤖 Recent: ${recentProject.name} - ${recentProject.aiSummary.slice(0, 80)}...`)
    }
  })

  // Cache the results
  setCacheProfiles(allProfiles)

  return NextResponse.json({
    profiles: allProfiles,
    total: allProfiles.length,
    cached: false
  })
}
