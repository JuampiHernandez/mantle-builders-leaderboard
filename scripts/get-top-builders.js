/**
 * Script to fetch the top 10 builder wallet addresses from your leaderboard
 * 
 * This script:
 * 1. Gets top 10 profiles from Supabase (ordered by builder_score)
 * 2. For any profiles missing wallet addresses, fetches from Talent Protocol API
 * 
 * Run: node scripts/get-top-builders.js
 */

const fs = require('fs');
const path = require('path');

// Manually load .env.local since dotenv might not work correctly
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          const value = trimmed.substring(eqIndex + 1);
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TALENT_API_KEY = process.env.TALENT_API_KEY;
const TALENT_API_BASE = "https://api.talentprotocol.com";

async function fetchWalletFromTalent(profileId) {
  if (!TALENT_API_KEY) {
    console.log("   ⚠️  No TALENT_API_KEY - cannot fetch wallet from API");
    return null;
  }
  
  try {
    // Try the accounts endpoint to get wallet addresses for this profile
    const response = await fetch(`${TALENT_API_BASE}/accounts?id=${profileId}`, {
      headers: {
        "Accept": "application/json",
        "X-API-KEY": TALENT_API_KEY
      }
    });
    
    if (!response.ok) {
      console.log(`   ⚠️  Talent API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Look for wallet accounts
    if (data.accounts && Array.isArray(data.accounts)) {
      for (const account of data.accounts) {
        // Look for wallet/ethereum accounts
        if (account.source === 'wallet' || account.source === 'ethereum' || account.source === 'evm') {
          if (account.address && account.address.startsWith('0x')) {
            return account.address;
          }
          if (account.identifier && account.identifier.startsWith('0x')) {
            return account.identifier;
          }
        }
      }
    }
    
    // Also try fetching the profile directly
    const profileResponse = await fetch(`${TALENT_API_BASE}/profiles/${profileId}`, {
      headers: {
        "Accept": "application/json",
        "X-API-KEY": TALENT_API_KEY
      }
    });
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      if (profileData.profile?.main_wallet) {
        return profileData.profile.main_wallet;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`   ⚠️  Error fetching from Talent API: ${error.message}`);
    return null;
  }
}

async function getTopBuilders() {
  console.log("\n🏆 TOP 10 BUILDER WALLET ADDRESSES");
  console.log("=".repeat(60) + "\n");
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Supabase not configured!");
    console.error("   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in .env.local");
    process.exit(1);
  }

  console.log("📡 Fetching top 10 builders from Supabase...\n");

  try {
    // Fetch top 10 profiles ordered by builder_score
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,display_name,username,main_wallet,builder_score&order=builder_score.desc&limit=10`, 
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} - ${errorText}`);
    }

    const profiles = await response.json();

    if (!profiles || profiles.length === 0) {
      console.error("❌ No profiles found in database!");
      console.error("   Run 'npx tsx scripts/populate-supabase.ts' to populate the database first.");
      process.exit(1);
    }

    console.log(`Found ${profiles.length} profiles\n`);
    console.log("=".repeat(60));
    
    const addresses = [];
    
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      const name = profile.display_name || profile.username || "Unknown";
      const score = profile.builder_score || 0;
      let wallet = profile.main_wallet;
      
      console.log(`\nRank ${i + 1}: ${name}`);
      console.log(`   Score: ${score}`);
      console.log(`   UUID: ${profile.id}`);
      
      // If no wallet in Supabase, try to fetch from Talent API
      if (!wallet || !wallet.startsWith('0x')) {
        console.log(`   Wallet: NOT IN DATABASE - fetching from Talent API...`);
        wallet = await fetchWalletFromTalent(profile.id);
      }
      
      if (wallet && wallet.startsWith('0x') && wallet.length === 42) {
        console.log(`   Wallet: ${wallet} ✅`);
        addresses.push({ wallet, name, score });
      } else {
        console.log(`   Wallet: ❌ NOT FOUND`);
        addresses.push({ wallet: null, name, score });
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n📝 COPY THIS INTO scripts/deploy.js:\n");
    console.log("const initialBuilders = [");
    
    addresses.forEach((item, i) => {
      if (item.wallet) {
        console.log(`  "${item.wallet}", // Rank ${i + 1}: ${item.name} (score: ${item.score})`);
      } else {
        console.log(`  "0x0000000000000000000000000000000000000000", // Rank ${i + 1}: ${item.name} - ⚠️ NEEDS WALLET ADDRESS!`);
      }
    });
    
    console.log("];");
    console.log("");

    // Summary
    const validCount = addresses.filter(a => a.wallet).length;
    const missingCount = addresses.filter(a => !a.wallet).length;
    
    if (missingCount > 0) {
      console.log(`⚠️  WARNING: ${missingCount} builder(s) don't have valid wallet addresses!`);
      console.log("   You'll need to get their addresses manually or they won't receive rewards.");
    } else {
      console.log(`✅ All ${validCount} builders have valid wallet addresses!`);
    }
    
    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

getTopBuilders();
