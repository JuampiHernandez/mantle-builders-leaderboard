import { NextRequest, NextResponse } from "next/server"
import { supabase, isSupabaseConfigured, dbProfileToApiFormat, DbProfile } from "@/lib/supabase"

// Disable static generation for this route
export const dynamic = "force-dynamic"

// ============================================
// SIMPLE SUPABASE-ONLY PROFILES ENDPOINT
// ============================================

export async function GET(request: NextRequest) {
  console.log("\n🚀 Fetching profiles from Supabase...")
  
  // Check if Supabase is configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error("❌ Supabase not configured!")
    return NextResponse.json({
      error: "Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
      profiles: [],
      total: 0
    }, { status: 500 })
  }
  
  try {
    // Fetch all profiles from Supabase, sorted by builder_score
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
      console.log("📭 No profiles in database. Run /api/sync to populate.")
      return NextResponse.json({
        profiles: [],
        total: 0,
        message: "No profiles in database. Please run /api/sync?secret=YOUR_SECRET to populate the database."
      })
    }
    
    // Convert DB format to API format for frontend compatibility
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
