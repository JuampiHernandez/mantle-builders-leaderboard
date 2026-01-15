/**
 * Debug script to check JulioMCruz's data
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const TALENT_API_BASE = "https://api.talentprotocol.com"

async function main() {
  const apiKey = process.env.TALENT_API_KEY
  if (!apiKey) { console.error("Missing TALENT_API_KEY"); process.exit(1) }
  
  console.log("\n🔍 Searching for JulioMCruz...\n")
  
  // Search by identity
  const searches = ["juliomcruz", "JulioMCruz", "JulioMCruz.eth", "Julio M Cruz"]
  
  for (const query of searches) {
    console.log(`\n--- Searching: "${query}" ---`)
    try {
      const params = new URLSearchParams({ 
        query: JSON.stringify({ identity: query }), 
        page: "1", 
        per_page: "5" 
      })
      const response = await fetch(`${TALENT_API_BASE}/search/advanced/profiles?${params}`, {
        headers: { "Accept": "application/json", "X-API-KEY": apiKey }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.profiles?.length) {
          for (const p of data.profiles) {
            console.log(`\nFound: ${p.display_name || p.name}`)
            console.log(`  ID: ${p.id}`)
            console.log(`  Username: ${p.username}`)
            console.log(`  score (direct): ${p.score}`)
            console.log(`  score.points: ${p.score?.points}`)
            console.log(`  builder_score (direct): ${p.builder_score}`)
            console.log(`  builder_score.points: ${p.builder_score?.points}`)
            console.log(`  passport: ${JSON.stringify(p.passport)}`)
            
            // Also fetch their passport directly
            console.log(`\n  Fetching passport for ID ${p.id}...`)
            const passportRes = await fetch(`${TALENT_API_BASE}/passports/${p.id}`, {
              headers: { "Accept": "application/json", "X-API-KEY": apiKey }
            })
            if (passportRes.ok) {
              const passport = await passportRes.json()
              console.log(`  Passport score: ${passport.passport?.score}`)
              console.log(`  Passport builder_score: ${passport.passport?.builder_score}`)
              console.log(`  Passport activity_score: ${passport.passport?.activity_score}`)
              console.log(`  Passport identity_score: ${passport.passport?.identity_score}`)
              console.log(`  Passport skills_score: ${passport.passport?.skills_score}`)
            }
          }
        } else {
          console.log("  No results")
        }
      } else {
        console.log(`  Error: ${response.status}`)
      }
    } catch (e) {
      console.log(`  Error: ${e}`)
    }
  }
}

main().catch(console.error)
