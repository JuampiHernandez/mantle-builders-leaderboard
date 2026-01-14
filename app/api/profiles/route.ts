import { NextRequest, NextResponse } from "next/server"
import { supabase, isSupabaseConfigured, dbProfileToApiFormat, DbProfile } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// This endpoint ONLY reads from Supabase (fast!)
// To populate Supabase, run: npx tsx scripts/populate-supabase.ts

export async function GET(request: NextRequest) {
  console.log("\n🚀 Fetching profiles from Supabase...")
  
  if (!isSupabaseConfigured() || !supabase) {
    console.error("❌ Supabase not configured!")
    return NextResponse.json({
      error: "Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
      profiles: [],
      total: 0
    }, { status: 500 })
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('builder_score', { ascending: false })
    
    if (error) {
      console.error("❌ Supabase fetch error:", error)
      return NextResponse.json({
        error: `Database error: ${error.message}`,
        profiles: [],
        total: 0
      }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      console.log("📭 No profiles in database.")
      return NextResponse.json({
        profiles: [],
        total: 0,
        message: "No profiles in database. Run 'npx tsx scripts/populate-supabase.ts' locally to populate."
      })
    }
    
    const profiles = data.map((profile: DbProfile) => dbProfileToApiFormat(profile))
    
    console.log(`✅ Returning ${profiles.length} profiles from Supabase`)
    
    return NextResponse.json({
      profiles,
      total: profiles.length,
      source: 'supabase'
    })
    
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      profiles: [],
      total: 0
    }, { status: 500 })
  }
}
