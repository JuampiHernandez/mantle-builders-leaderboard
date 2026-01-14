import { NextRequest, NextResponse } from "next/server"
import { supabase, isSupabaseConfigured, apiProfileToDbProfile } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes max for sync (Vercel Pro) or 60s (Hobby)

const TALENT_API_BASE = "https://api.talentprotocol.com"
const GITHUB_API_BASE = "https://api.github.com"

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

// ENS names from the CSV
const ensNames = [
  "0xoucan", "akhilnanavati", "thefullstack", "0xgonzalo", "ariiellus",
  "fabit", "deca12x", "forestkeeperio", "raspc", "juliomcruz",
  "mati-os", "meximalist", "ozkite", "solsiete", "vixtorxva", "xfajarr",
]

// GitHub and other data point slugs
const GITHUB_SLUGS = [
  "github_crypto_repositories_commits",
  "github_crypto_repositories_contributed",
  "github_forks",
  "github_repositories",
  "github_stars",
  "github_total_contributions",
  "github_total_commits",
  "github_mantle_eco_repositories_commits",
]

const EXTRA_SLUGS = ["talent_builder_rewards_total_usd"]

const ONCHAIN_SLUGS = [
  "onchain_weekly_active_contracts",
  "onchain_total_contract_transactions",
  "onchain_weekly_contract_transactions",
  "onchain_total_contract_fees",
  "onchain_weekly_contract_fees",
]

const SLUG_TO_KEY: Record<string, string> = {
  "github_crypto_repositories_commits": "crypto_commits",
  "github_crypto_repositories_contributed": "crypto_repos_contributed",
  "github_forks": "forks",
  "github_repositories": "repositories",
  "github_stars": "stars",
  "github_total_contributions": "total_contributions",
  "github_total_commits": "total_commits",
  "github_mantle_eco_repositories_commits": "mantle_eco_commits",
  "onchain_weekly_active_contracts": "weekly_active_contracts",
  "onchain_total_contract_transactions": "total_transactions",
  "onchain_weekly_contract_transactions": "weekly_transactions",
  "onchain_total_contract_fees": "total_fees",
  "onchain_weekly_contract_fees": "weekly_fees",
  "talent_builder_rewards_total_usd": "builder_earnings",
}

const MANTLE_CREDENTIAL_SLUG = "github_mantle_eco_repositories_commits"

// Track GitHub rate limit
let githubRateLimitExceeded = false

function getScore(profile: any): number {
  if (typeof profile.score === 'number') return profile.score
  if (profile.score?.points) return profile.score.points
  if (typeof profile.builder_score === 'number') return profile.builder_score
  if (profile.builder_score?.points) return profile.builder_score.points
  return 0
}

// Fetch data points for a profile
async function fetchDataPoints(profileId: string, apiKey: string) {
  const result: any = {
    stats: {}, onchainStats: {}, githubUserId: null, builderEarnings: null
  }
  
  try {
    const allSlugs = [...GITHUB_SLUGS, ...EXTRA_SLUGS, ...ONCHAIN_SLUGS]
    const url = `${TALENT_API_BASE}/data_points?id=${profileId}&slugs=${allSlugs.join(",")}`
    
    const response = await fetch(url, {
      headers: { "Accept": "application/json", "X-API-KEY": apiKey }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.data_points) {
        for (const dp of data.data_points) {
          const key = SLUG_TO_KEY[dp.credential_slug]
          if (key) {
            if (key === 'builder_earnings') result.builderEarnings = dp.readable_value
            else if (['weekly_active_contracts', 'total_transactions', 'weekly_transactions', 'total_fees', 'weekly_fees'].includes(key)) {
              result.onchainStats[key] = dp.readable_value
            } else {
              result.stats[key] = dp.readable_value
            }
          }
          if (dp.account_source === 'github' && dp.account_identifier) {
            result.githubUserId = dp.account_identifier
          }
        }
      }
    }
  } catch (e) { /* ignore */ }
  
  return result
}

// Get GitHub username from ID
async function getGitHubUsername(githubId: string, token?: string) {
  if (githubRateLimitExceeded) return null
  
  try {
    const headers: any = { "Accept": "application/vnd.github.v3+json", "User-Agent": "Mantle-Leaderboard" }
    if (token) headers["Authorization"] = `Bearer ${token}`
    
    const response = await fetch(`${GITHUB_API_BASE}/user/${githubId}`, { headers })
    
    if (response.status === 403) {
      githubRateLimitExceeded = true
      return null
    }
    if (response.ok) {
      const user = await response.json()
      return user.login
    }
  } catch (e) { /* ignore */ }
  return null
}

// Fetch GitHub repos for a user
async function fetchGitHubRepos(username: string, token?: string) {
  if (githubRateLimitExceeded) return { topByStars: [], mostRecent: [] }
  
  try {
    const headers: any = { "Accept": "application/vnd.github.v3+json", "User-Agent": "Mantle-Leaderboard" }
    if (token) headers["Authorization"] = `Bearer ${token}`
    
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=pushed`,
      { headers }
    )
    
    if (response.status === 403) {
      githubRateLimitExceeded = true
      return { topByStars: [], mostRecent: [] }
    }
    
    if (!response.ok) return { topByStars: [], mostRecent: [] }
    
    const repos = await response.json()
    if (!Array.isArray(repos)) return { topByStars: [], mostRecent: [] }
    
    const owned = repos.filter((r: any) => r.full_name?.startsWith(`${username}/`))
    const byStars = [...owned].sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    const byRecent = [...owned].sort((a: any, b: any) => 
      new Date(b.pushed_at || 0).getTime() - new Date(a.pushed_at || 0).getTime()
    )
    
    return {
      topByStars: byStars.slice(0, 3).map((r: any) => ({
        name: r.name, html_url: r.html_url, stargazers_count: r.stargazers_count, language: r.language
      })),
      mostRecent: byRecent.slice(0, 3).map((r: any) => ({
        name: r.name, html_url: r.html_url, description: r.description, language: r.language,
        stargazers_count: r.stargazers_count, pushed_at: r.pushed_at
      }))
    }
  } catch (e) { /* ignore */ }
  
  return { topByStars: [], mostRecent: [] }
}

// Main sync endpoint
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.SYNC_SECRET
  
  // Allow sync without secret for initial setup, but warn
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized. Add ?secret=YOUR_SYNC_SECRET" }, { status: 401 })
  }
  
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }
  
  const apiKey = process.env.TALENT_API_KEY
  const githubToken = process.env.GITHUB_TOKEN
  
  if (!apiKey) {
    return NextResponse.json({ error: "TALENT_API_KEY not configured" }, { status: 500 })
  }
  
  console.log("\n🔄 Starting profile sync...")
  githubRateLimitExceeded = false
  
  const allProfiles: any[] = []
  const foundIds = new Set<string>()
  
  // Step 1: Search by wallet addresses
  console.log("📡 [1/5] Searching by wallet addresses...")
  let page = 1
  while (true) {
    try {
      const params = new URLSearchParams({
        query: JSON.stringify({ walletAddresses, exactMatch: true }),
        sort: JSON.stringify({ score: { order: "desc" } }),
        page: String(page), per_page: "25"
      })
      
      const response = await fetch(`${TALENT_API_BASE}/search/advanced/profiles?${params}`, {
        headers: { "Accept": "application/json", "X-API-KEY": apiKey }
      })
      
      if (!response.ok) break
      const data = await response.json()
      if (!data.profiles?.length) break
      
      for (const p of data.profiles) {
        if (!foundIds.has(p.id)) {
          foundIds.add(p.id)
          p._builderScore = getScore(p)
          allProfiles.push(p)
        }
      }
      
      if (!data.pagination || data.pagination.current_page >= data.pagination.last_page) break
      page++
    } catch (e) { break }
  }
  console.log(`   Found ${allProfiles.length} profiles`)
  
  // Step 2: Search by ENS names
  console.log("📡 [2/5] Searching by ENS names...")
  for (const ens of ensNames) {
    try {
      const params = new URLSearchParams({
        query: JSON.stringify({ identity: ens }),
        page: "1", per_page: "1"
      })
      
      const response = await fetch(`${TALENT_API_BASE}/search/advanced/profiles?${params}`, {
        headers: { "Accept": "application/json", "X-API-KEY": apiKey }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.profiles?.[0] && !foundIds.has(data.profiles[0].id)) {
          foundIds.add(data.profiles[0].id)
          data.profiles[0]._builderScore = getScore(data.profiles[0])
          allProfiles.push(data.profiles[0])
        }
      }
    } catch (e) { /* ignore */ }
  }
  console.log(`   Total: ${allProfiles.length} profiles`)
  
  // Step 3: Search by Mantle credential
  console.log("📡 [3/5] Searching Mantle ecosystem contributors...")
  page = 1
  while (true) {
    try {
      const params = new URLSearchParams({
        query: JSON.stringify({ credentials: [{ slug: MANTLE_CREDENTIAL_SLUG, valueRange: { min: 1 } }] }),
        sort: JSON.stringify({ score: { order: "desc" } }),
        page: String(page), per_page: "25"
      })
      
      const response = await fetch(`${TALENT_API_BASE}/search/advanced/profiles?${params}`, {
        headers: { "Accept": "application/json", "X-API-KEY": apiKey }
      })
      
      if (!response.ok) break
      const data = await response.json()
      if (!data.profiles?.length) break
      
      for (const p of data.profiles) {
        if (!foundIds.has(p.id)) {
          foundIds.add(p.id)
          p._builderScore = getScore(p)
          allProfiles.push(p)
        }
      }
      
      if (!data.pagination || data.pagination.current_page >= data.pagination.last_page) break
      page++
    } catch (e) { break }
  }
  console.log(`   Total: ${allProfiles.length} profiles`)
  
  // Step 4: Fetch data points (in batches)
  console.log("📡 [4/5] Fetching data points...")
  for (let i = 0; i < allProfiles.length; i += 10) {
    const batch = allProfiles.slice(i, i + 10)
    await Promise.all(batch.map(async (profile) => {
      const data = await fetchDataPoints(profile.id, apiKey)
      profile._githubStats = data.stats
      profile._onchainStats = data.onchainStats
      profile._githubUserId = data.githubUserId
      profile._builderEarnings = data.builderEarnings
    }))
  }
  
  // Step 5: Fetch GitHub repos (limited to avoid rate limits)
  console.log("📡 [5/5] Fetching GitHub repos...")
  let reposFetched = 0
  for (const profile of allProfiles) {
    if (githubRateLimitExceeded) break
    if (reposFetched >= 100) break // Limit to first 100 to avoid timeout
    
    if (profile._githubUserId) {
      const username = await getGitHubUsername(profile._githubUserId, githubToken)
      if (username) {
        profile._githubUsername = username
        const repos = await fetchGitHubRepos(username, githubToken)
        profile._githubProjects = repos
        
        if (repos.mostRecent?.[0]) {
          profile._recentProject = {
            name: repos.mostRecent[0].name,
            html_url: repos.mostRecent[0].html_url,
            description: repos.mostRecent[0].description,
            language: repos.mostRecent[0].language,
            stars: repos.mostRecent[0].stargazers_count,
            pushed_at: repos.mostRecent[0].pushed_at
          }
        }
        reposFetched++
      }
    }
  }
  console.log(`   Fetched repos for ${reposFetched} profiles`)
  
  // Sort by score
  allProfiles.sort((a, b) => (b._builderScore || 0) - (a._builderScore || 0))
  
  // Save to Supabase
  console.log("💾 Saving to Supabase...")
  const dbProfiles = allProfiles.map(apiProfileToDbProfile)
  
  let synced = 0
  for (let i = 0; i < dbProfiles.length; i += 50) {
    const batch = dbProfiles.slice(i, i + 50)
    const { error } = await supabase.from('profiles').upsert(batch, { onConflict: 'id' })
    if (!error) synced += batch.length
    else console.error(`   Batch error:`, error.message)
  }
  
  console.log(`✅ Synced ${synced}/${allProfiles.length} profiles to Supabase`)
  
  return NextResponse.json({
    success: true,
    synced,
    total: allProfiles.length,
    githubRateLimited: githubRateLimitExceeded
  })
}

// GET endpoint to check status
export async function GET() {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ configured: false, message: "Supabase not configured" })
  }
  
  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { data: last } = await supabase.from('profiles').select('updated_at').order('updated_at', { ascending: false }).limit(1).single()
  
  return NextResponse.json({
    configured: true,
    profileCount: count || 0,
    lastUpdated: last?.updated_at || null
  })
}
