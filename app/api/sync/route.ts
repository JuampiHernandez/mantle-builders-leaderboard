import { NextRequest, NextResponse } from "next/server"
import { supabase, isSupabaseConfigured, apiProfileToDbProfile } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes max for sync

// This endpoint syncs profiles to Supabase
// Call it with a cron job (e.g., Vercel Cron) once per day
// POST /api/sync?secret=YOUR_SYNC_SECRET

export async function POST(request: NextRequest) {
  // Verify secret to prevent unauthorized syncs
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.SYNC_SECRET
  
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }
  
  console.log("🔄 Starting profile sync to Supabase...")
  
  try {
    // Fetch fresh profiles from the main API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/profiles?refresh=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.status}`)
    }
    
    const data = await response.json()
    const profiles = data.profiles || []
    
    console.log(`📊 Fetched ${profiles.length} profiles, syncing to Supabase...`)
    
    // Convert and upsert profiles in batches
    const batchSize = 50
    let synced = 0
    let errors = 0
    
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize)
      const dbProfiles = batch.map(apiProfileToDbProfile)
      
      const { error } = await supabase
        .from('profiles')
        .upsert(dbProfiles, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
      
      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} error:`, error)
        errors += batch.length
      } else {
        synced += batch.length
        console.log(`✅ Synced batch ${i / batchSize + 1} (${synced}/${profiles.length})`)
      }
    }
    
    console.log(`🎉 Sync complete: ${synced} synced, ${errors} errors`)
    
    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: profiles.length,
      githubRateLimited: data.githubRateLimited || false
    })
    
  } catch (error) {
    console.error("❌ Sync error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Sync failed" 
    }, { status: 500 })
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ 
      configured: false,
      message: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment."
    })
  }
  
  try {
    // Get count and last updated
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    const { data: lastUpdated, error: lastError } = await supabase
      .from('profiles')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    return NextResponse.json({
      configured: true,
      profileCount: count || 0,
      lastUpdated: lastUpdated?.updated_at || null,
      errors: countError || lastError || null
    })
  } catch (error) {
    return NextResponse.json({ 
      configured: true,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
