/**
 * Populate Supabase with Mantle ecosystem repos from GitHub search
 * 
 * Usage:
 *   npx tsx scripts/populate-mantle-repos.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const GITHUB_API_BASE = "https://api.github.com"

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

async function main() {
  console.log("\n🚀 MANTLE REPOS POPULATION SCRIPT")
  console.log("==================================\n")
  
  const githubToken = process.env.GITHUB_TOKEN
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials")
    process.exit(1)
  }
  
  console.log("✅ GITHUB_TOKEN:", githubToken ? githubToken.slice(0, 10) + "..." : "NOT SET (rate limits apply)")
  console.log("✅ SUPABASE_URL:", supabaseUrl)
  console.log("")
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Mantle-Leaderboard"
  }
  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`
  }
  
  // Search for Mantle repos
  console.log("📡 Searching GitHub for Mantle repos...")
  
  const searchQueries = [
    'mantle+blockchain',
    'mantle+network', 
    'mantle+web3',
    'mantlenetwork',
    'mantle+ethereum',
    'mantle+defi',
    'mantle+smart+contract'
  ]
  
  const mantleRepos: any[] = []
  const foundRepos = new Set<string>()
  
  for (const query of searchQueries) {
    console.log(`   Searching: ${query}...`)
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/search/repositories?q=${query}&sort=stars&order=desc&per_page=50`,
        { headers }
      )
      
      if (response.ok) {
        const data = await response.json()
        let added = 0
        for (const repo of data.items || []) {
          if (!foundRepos.has(repo.full_name) && isMantleRepo(repo)) {
            foundRepos.add(repo.full_name)
            mantleRepos.push({
              github_id: repo.id,
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
              owner_image_url: repo.owner?.avatar_url
            })
            added++
          }
        }
        console.log(`      Found ${added} new repos (total: ${mantleRepos.length})`)
      } else {
        console.log(`      Error: ${response.status}`)
      }
      
      await new Promise(r => setTimeout(r, 500))
    } catch (e) {
      console.error(`      Error: ${e}`)
    }
  }
  
  // Sort by stars
  mantleRepos.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
  
  console.log(`\n📊 Found ${mantleRepos.length} Mantle repos`)
  console.log("   Top 5:")
  mantleRepos.slice(0, 5).forEach((r, i) => {
    console.log(`     ${i + 1}. ${r.full_name} (⭐ ${r.stargazers_count})`)
  })
  
  // Fetch contributors for top repos
  console.log("\n📡 Fetching contributors for top repos...")
  const reposWithContributors: any[] = []
  
  for (let i = 0; i < Math.min(mantleRepos.length, 30); i++) {
    const repo = mantleRepos[i]
    try {
      const contribResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${repo.full_name}/contributors?per_page=10`,
        { headers }
      )
      
      if (contribResponse.ok) {
        const contributors = await contribResponse.json()
        repo.contributors = (contributors || []).slice(0, 10).map((c: any) => ({
          login: c.login,
          avatar_url: c.avatar_url,
          contributions: c.contributions,
          html_url: c.html_url
        }))
        console.log(`   ✅ ${repo.full_name}: ${repo.contributors.length} contributors`)
      } else {
        repo.contributors = []
      }
      
      reposWithContributors.push(repo)
      await new Promise(r => setTimeout(r, 100))
    } catch (e) {
      repo.contributors = []
      reposWithContributors.push(repo)
    }
  }
  
  // Save to Supabase
  console.log("\n💾 Saving to Supabase...")
  
  // Clear existing data
  console.log("   Clearing existing data...")
  await supabase.from('mantle_contributors').delete().neq('id', 0)
  await supabase.from('mantle_repos').delete().neq('id', 0)
  
  // Insert repos
  console.log("   Inserting repos...")
  const repoIdMap = new Map<string, number>()
  
  for (let i = 0; i < reposWithContributors.length; i++) {
    const repo = reposWithContributors[i]
    const { data, error } = await supabase
      .from('mantle_repos')
      .insert({
        github_id: repo.github_id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        pushed_at: repo.pushed_at,
        topics: repo.topics,
        owner_username: repo.owner_username,
        owner_image_url: repo.owner_image_url
      })
      .select('id')
      .single()
    
    if (error) {
      console.error(`   ❌ Error inserting ${repo.full_name}:`, error.message)
    } else if (data) {
      repoIdMap.set(repo.full_name, data.id)
    }
  }
  console.log(`   ✅ Inserted ${repoIdMap.size} repos`)
  
  // Insert contributors
  console.log("   Inserting contributors...")
  let contributorCount = 0
  
  for (const repo of reposWithContributors) {
    const repoId = repoIdMap.get(repo.full_name)
    if (!repoId || !repo.contributors?.length) continue
    
    const contributors = repo.contributors.map((c: any) => ({
      repo_id: repoId,
      login: c.login,
      avatar_url: c.avatar_url,
      contributions: c.contributions,
      html_url: c.html_url
    }))
    
    const { error } = await supabase.from('mantle_contributors').insert(contributors)
    if (error) {
      console.error(`   ❌ Error inserting contributors for ${repo.full_name}:`, error.message)
    } else {
      contributorCount += contributors.length
    }
  }
  console.log(`   ✅ Inserted ${contributorCount} contributors`)
  
  console.log("\n✅ DONE!")
  console.log(`   ${repoIdMap.size} Mantle repos saved`)
  console.log(`   ${contributorCount} contributors saved`)
}

main().catch(console.error)
