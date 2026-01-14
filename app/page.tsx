"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ExternalLink, Search, Copy, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Star, Sparkles, DollarSign, Eye, Zap, Clock, Trophy, Users, CheckCircle2, FileCode, GitBranch, Send, RefreshCw } from "lucide-react"
import { DistributeButton } from "@/components/DistributeButton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, Line, XAxis, YAxis, CartesianGrid, ComposedChart } from "recharts"

// ============================================
// CLIENT-SIDE CACHE UTILITIES
// ============================================
const CACHE_KEY = 'mantle_leaderboard_profiles'
const CACHE_TIMESTAMP_KEY = 'mantle_leaderboard_timestamp'
const CLIENT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CachedData {
  profiles: TalentProfile[]
  timestamp: number
}

function getClientCache(): CachedData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    
    if (cached && timestamp) {
      const cacheAge = Date.now() - parseInt(timestamp)
      if (cacheAge < CLIENT_CACHE_TTL) {
        return {
          profiles: JSON.parse(cached),
          timestamp: parseInt(timestamp)
        }
      }
    }
  } catch (e) {
    console.warn('Failed to read from localStorage:', e)
  }
  return null
}

function setClientCache(profiles: TalentProfile[]) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(profiles))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()))
  } catch (e) {
    console.warn('Failed to write to localStorage:', e)
  }
}

function clearClientCache() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
  } catch (e) {
    console.warn('Failed to clear localStorage:', e)
  }
}

// Types for Talent Protocol API response
interface GitHubStats {
  crypto_commits: string | null
  crypto_repos_contributed: string | null
  forks: string | null
  repositories: string | null
  stars: string | null
  total_contributions: string | null
  total_commits: string | null
}

interface OnchainStats {
  weekly_active_contracts: string | null
  total_transactions: string | null
  weekly_transactions: string | null
  total_fees: string | null
  weekly_fees: string | null
}

interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
}

interface RecentProject {
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stars: number
  pushed_at: string
  aiSummary: string | null
}

interface TalentProfile {
  id: string
  name?: string
  display_name?: string
  username?: string
  image_url?: string
  score?: number
  builder_score?: number
  main_wallet?: string
  ens?: string
  human_checkmark?: boolean
  _builderScore?: number
  _builderEarnings?: string | null
  _githubStats?: GitHubStats
  _onchainStats?: OnchainStats
  _githubProjects?: {
    topByStars: GitHubRepo[]
    mostRecent: GitHubRepo[]
  }
  _recentProject?: RecentProject
}

interface ProfilesResponse {
  profiles: TalentProfile[]
  total: number
}

// Chart data
const repositoryActivityData = [
  { date: "14/10/25", commits: 5000 },
  { date: "21/10/25", commits: 8000 },
  { date: "29/10/25", commits: 15000 },
  { date: "05/11/25", commits: 22000 },
  { date: "13/11/25", commits: 28000 },
  { date: "20/11/25", commits: 35000 },
  { date: "28/11/25", commits: 42000 },
  { date: "05/12/25", commits: 48000 },
  { date: "13/12/25", commits: 55000 },
  { date: "20/12/25", commits: 62000 },
  { date: "28/12/25", commits: 68000 },
  { date: "04/01/26", commits: 75000 },
]

const smartContractActivityData = [
  { date: "14/10/25", contracts: 3200 },
  { date: "21/10/25", contracts: 3400 },
  { date: "29/10/25", contracts: 3600 },
  { date: "05/11/25", contracts: 3800 },
  { date: "13/11/25", contracts: 4000 },
  { date: "20/11/25", contracts: 4200 },
  { date: "28/11/25", contracts: 4400 },
  { date: "05/12/25", contracts: 4700 },
  { date: "13/12/25", contracts: 5000 },
  { date: "20/12/25", contracts: 5300 },
  { date: "28/12/25", contracts: 5600 },
  { date: "04/01/26", contracts: 5900 },
]

const builderActivityData = [
  { date: "12/01/25", smartContracts: 2800, contractsDeployed: 100, repoCommits: 500 },
  { date: "07/02/25", smartContracts: 3200, contractsDeployed: 150, repoCommits: 800 },
  { date: "05/03/25", smartContracts: 2500, contractsDeployed: 200, repoCommits: 1200 },
  { date: "31/03/25", smartContracts: 5500, contractsDeployed: 180, repoCommits: 1500 },
  { date: "26/04/25", smartContracts: 3000, contractsDeployed: 220, repoCommits: 2000 },
  { date: "22/05/25", smartContracts: 3500, contractsDeployed: 250, repoCommits: 2500 },
  { date: "17/06/25", smartContracts: 4200, contractsDeployed: 300, repoCommits: 3000 },
  { date: "13/07/25", smartContracts: 5800, contractsDeployed: 280, repoCommits: 3500 },
  { date: "08/08/25", smartContracts: 3800, contractsDeployed: 320, repoCommits: 4000 },
  { date: "03/09/25", smartContracts: 4000, contractsDeployed: 350, repoCommits: 5000 },
  { date: "29/09/25", smartContracts: 2200, contractsDeployed: 400, repoCommits: 6000 },
  { date: "25/10/25", smartContracts: 3000, contractsDeployed: 450, repoCommits: 7000 },
  { date: "20/11/25", smartContracts: 2800, contractsDeployed: 500, repoCommits: 8000 },
  { date: "16/12/25", smartContracts: 3500, contractsDeployed: 600, repoCommits: 9500 },
  { date: "12/01/26", smartContracts: 4000, contractsDeployed: 700, repoCommits: 10000 },
]

const chartConfig = {
  commits: { label: "Commits (90d)", color: "#3b82f6" },
  contracts: { label: "Active Contracts (90d)", color: "#60a5fa" },
  smartContracts: { label: "Smart Contracts", color: "#93c5fd" },
  contractsDeployed: { label: "Contracts Deployed", color: "#1d4ed8" },
  repoCommits: { label: "Repo Commits", color: "#f59e0b" },
}

// Helper to format values
function formatValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "-"
  const num = typeof val === 'string' ? parseInt(val) : val
  if (isNaN(num)) return String(val)
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(num)
}

// Format currency
function formatCurrency(val: string | null | undefined): string {
  if (!val) return "$0"
  const num = parseFloat(val)
  if (isNaN(num)) return "$0"
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`
  return `$${num.toFixed(2)}`
}

export default function Page() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [countdown, setCountdown] = useState({ days: 3, hours: 20, minutes: 4, seconds: 0 })
  
  // Loading progress state
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState("")
  const [isFromCache, setIsFromCache] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev
        
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        } else if (days > 0) {
          days--
          hours = 23
          minutes = 59
          seconds = 59
        }
        
        return { days, hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Fetch profiles function
  const fetchProfiles = useCallback(async (forceRefresh = false) => {
    try {
      // Check client cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getClientCache()
        if (cachedData) {
          console.log("📦 Using client-side cached profiles")
          setProfiles(cachedData.profiles)
          setIsFromCache(true)
          setLoading(false)
          return
        }
      } else {
        clearClientCache()
      }
      
      setLoading(true)
      setIsFromCache(false)
      setLoadingProgress(0)
      setLoadingStage("Connecting to server...")
      
      console.log("🔄 Fetching profiles from API...")
      
      // Simulate progress stages for better UX
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 15) {
            setLoadingStage("Searching wallet addresses...")
            return prev + 3
          } else if (prev < 30) {
            setLoadingStage("Searching ENS identities...")
            return prev + 2
          } else if (prev < 45) {
            setLoadingStage("Finding Mantle ecosystem contributors...")
            return prev + 2
          } else if (prev < 60) {
            setLoadingStage("Fetching builder data points...")
            return prev + 1.5
          } else if (prev < 75) {
            setLoadingStage("Loading GitHub repositories...")
            return prev + 1
          } else if (prev < 90) {
            setLoadingStage("Generating AI summaries...")
            return prev + 0.5
          }
          return prev
        })
      }, 500)
      
      const url = forceRefresh ? "/api/profiles?refresh=true" : "/api/profiles"
      const response = await fetch(url)
      
      clearInterval(progressInterval)
      setLoadingProgress(95)
      setLoadingStage("Finalizing...")
      
      console.log("📡 Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ API Error:", errorText)
        throw new Error(`Failed to fetch profiles: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ Received ${data.profiles?.length || 0} profiles (cached: ${data.cached})`)
      
      setLoadingProgress(100)
      
      // Debug: Log first profile's data
      if (data.profiles?.[0]) {
        const p = data.profiles[0]
        console.log("📊 First profile data:", {
          name: p.display_name || p.name,
          _githubStats: p._githubStats,
          _githubProjects: p._githubProjects,
          _recentProject: p._recentProject
        })
      }
      
      if (data.profiles && Array.isArray(data.profiles)) {
        setProfiles(data.profiles)
        // Save to client cache
        setClientCache(data.profiles)
        setIsFromCache(data.cached || false)
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        setProfiles([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profiles")
      console.error("❌ Error fetching profiles:", err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchProfiles(true)
  }, [fetchProfiles])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // Filter profiles
  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      profile.name?.toLowerCase().includes(query) ||
      profile.display_name?.toLowerCase().includes(query) ||
      profile.username?.toLowerCase().includes(query) ||
      profile.main_wallet?.toLowerCase().includes(query)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedProfiles = filteredProfiles.slice(startIndex, startIndex + rowsPerPage)

  const getDisplayName = (profile: TalentProfile) => {
    return profile.display_name || profile.name || profile.username || "Anonymous"
  }

  const getHandle = (profile: TalentProfile) => {
    if (profile.username) return `@${profile.username}`
    if (profile.main_wallet) return `${profile.main_wallet.slice(0, 6)}...${profile.main_wallet.slice(-4)}`
    return null
  }

  const getScore = (profile: TalentProfile & { _builderScore?: number; builder_score?: any }) => {
    if (typeof profile._builderScore === 'number') return profile._builderScore
    if (typeof profile.score === 'number') return profile.score
    if (typeof profile.builder_score === 'number') return profile.builder_score
    if (profile.builder_score && typeof profile.builder_score === 'object') {
      if (typeof profile.builder_score.points === 'number') return profile.builder_score.points
    }
    return 0
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section - Centered */}
        <div className="mb-16 pt-12 text-center">
          {/* Powered by Mantle */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <img src="/mantle-logo.svg" alt="Mantle" className="h-6" />
        </div>

          <h1 className="mb-6 text-6xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Top Mantle Builders
          </h1>
          <p className="mb-10 text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore the Mantle ecosystem and find the most impactful builders
          </p>
          
          {/* Cards Row */}
          <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
            {/* Rewards Distribution Card */}
            <div className="flex-1 bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Prize Pool</div>
              <div className="text-5xl font-bold mb-6">10 ETH</div>
              <div className="text-sm text-muted-foreground mb-3">Next Distribution</div>
              <div className="text-3xl font-mono font-bold text-emerald-400">
                {String(countdown.days).padStart(2, '0')}:{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </div>
              <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
                <span>DAYS</span>
                <span>HRS</span>
                <span>MIN</span>
                <span>SEC</span>
              </div>
              <div className="mt-6">
                <DistributeButton />
              </div>
            </div>
            
            {/* Eligibility Roadmap Card */}
            <div className="flex-1 bg-card border border-border rounded-2xl p-8">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-4 text-center">How to be Eligible</div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FileCode className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Deploy Smart Contracts on Mantle</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Ship your contracts to Mantle mainnet</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <GitBranch className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Contribute to Mantle Open Source</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Submit PRs to Mantle ecosystem repos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <section className="mb-12">
          
          {/* Search Bar with Refresh Button */}
          <div className="mb-6 flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search builder profiles" 
                className="pl-10 bg-card border-border"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              />
            </div>
            
            {/* Cache indicator and refresh button */}
            <div className="flex items-center gap-2">
              {isFromCache && !loading && (
                <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
                  Cached
                </Badge>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className="h-10 w-10"
                title="Refresh leaderboard"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Loading State with Progress Bar */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse" />
                <Loader2 className="h-12 w-12 animate-spin text-emerald-400 relative" />
              </div>
              
              <div className="w-full max-w-md space-y-3">
                <Progress value={loadingProgress} className="h-2 bg-muted" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{loadingStage}</span>
                  <span className="text-emerald-400 font-mono">{Math.round(loadingProgress)}%</span>
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-muted-foreground">Loading builder profiles...</p>
                <p className="text-xs text-muted-foreground/70">
                  First load may take up to 30 seconds while we fetch data from multiple sources
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
              <p className="text-red-400">{error}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Make sure TALENT_API_KEY is set in your .env.local file.
              </p>
            </div>
          )}

          {/* Simplified Leaderboard Table */}
          {!loading && !error && (
            <>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-12">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground min-w-[180px]">Profile</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground w-20">Score</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground w-24">
                          <div className="flex items-center justify-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-400" />
                            <span>Earnings</span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground w-24">
                          <div className="flex items-center justify-center gap-1">
                            <Zap className="h-3 w-3 text-orange-400" />
                            <span>Txns</span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-32">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span>Top Project</span>
                          </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-400" />
                            <span>Currently Building</span>
                          </div>
                  </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground w-20"></th>
                </tr>
              </thead>
              <tbody>
                      {paginatedProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                            {searchQuery ? "No profiles match your search" : "No profiles found"}
                          </td>
                        </tr>
                      ) : (
                        paginatedProfiles.map((profile, index) => {
                          const topProject = profile._githubProjects?.topByStars?.[0]
                          const recentProject = profile._recentProject
                          const isHovered = hoveredRow === profile.id
                          
                          return (
                            <tr 
                              key={profile.id || index} 
                              className="border-b border-border transition-colors hover:bg-accent/50 relative"
                              onMouseEnter={() => setHoveredRow(profile.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                            >
                              {/* Rank */}
                              <td className="px-4 py-4 text-sm text-muted-foreground font-medium">
                                {startIndex + index + 1}
                              </td>
                              
                              {/* Profile */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                                    <AvatarImage src={profile.image_url || "/placeholder.svg"} />
                                    <AvatarFallback>{getDisplayName(profile)[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {getDisplayName(profile)}
                                      {profile.human_checkmark && (
                                        <span className="text-emerald-400" title="Human Verified">✓</span>
                                      )}
                                    </div>
                                    {getHandle(profile) && (
                                      <div className="text-xs text-muted-foreground">{getHandle(profile)}</div>
                          )}
                        </div>
                      </div>
                    </td>
                              
                              {/* Score */}
                              <td className="px-4 py-4 text-center">
                                <span className="font-mono text-lg font-bold text-emerald-400">
                                  {getScore(profile)}
                                </span>
                              </td>
                              
                              {/* Builder Earnings */}
                              <td className="px-4 py-4 text-center">
                                <span className="font-mono text-sm text-green-400 font-medium">
                                  {formatCurrency(profile._builderEarnings)}
                                </span>
                              </td>
                              
                              {/* Total Transactions */}
                              <td className="px-4 py-4 text-center">
                                <span className="font-mono text-sm text-orange-400 font-medium">
                                  {formatValue(profile._onchainStats?.total_transactions)}
                                </span>
                              </td>
                              
                              {/* Top Project */}
                              <td className="px-4 py-4">
                                {topProject ? (
                                  <a 
                                    href={topProject.html_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-2 hover:text-emerald-400 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="font-medium truncate max-w-[100px]">{topProject.name}</span>
                                    <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                                      <Star className="h-3 w-3" />
                                      {topProject.stargazers_count}
                                    </span>
                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              
                              {/* AI Summary of Recent Project */}
                    <td className="px-4 py-4">
                                {recentProject ? (
                                  <div className="max-w-sm">
                                    <a 
                                      href={recentProject.html_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
                                          {recentProject.name}
                                        </span>
                                        {recentProject.language && (
                                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                                            {recentProject.language}
                                          </Badge>
                                        )}
                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                      </div>
                                    </a>
                                    {recentProject.aiSummary ? (
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {recentProject.aiSummary}
                                      </p>
                                    ) : recentProject.description ? (
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {recentProject.description}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              
                              {/* See Profile Button */}
                              <td className="px-4 py-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`gap-1 transition-all duration-200 ${
                                    isHovered 
                                      ? 'opacity-100 translate-x-0 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                      : 'opacity-0 translate-x-2'
                                  }`}
                                  onClick={() => window.open(`/profile/${profile.id}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="text-xs">View</span>
                        </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
              </tbody>
            </table>
          </div>
        </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div>{filteredProfiles.length} Profiles</div>
          <div className="flex items-center gap-4">
                  <span>Page</span>
                  <Input 
                    type="number" 
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Math.min(Math.max(1, parseInt(e.target.value) || 1), totalPages))}
                    className="w-16 h-8 text-center bg-card border-border"
                    min={1}
                    max={totalPages}
                  />
                  <span>of {totalPages || 1}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <span>Rows</span>
                  <select 
                    className="h-8 rounded-md border border-border bg-card px-2 text-sm"
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1) }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Dashboard Charts Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Mantle Builder Activity</h2>
          
          {/* Combined Activity Chart */}
          <div className="mb-8 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-4 bg-[#93c5fd]"></div>
                  <span className="text-muted-foreground">Active Smart Contracts (365d Max)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-4 bg-[#1d4ed8]"></div>
                  <span className="text-muted-foreground">Contracts Deployed (Mainnet) (365d Max)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#f59e0b]"></div>
                  <span className="text-muted-foreground">Mantle Ecosystem Repositories Commits (365d Max)</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Copy className="h-3 w-3" />
                Copy Query
              </Button>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ComposedChart data={builderActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line yAxisId="left" type="monotone" dataKey="smartContracts" stroke="#93c5fd" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="contractsDeployed" stroke="#1d4ed8" strokeWidth={2} dot={false} />
                <Bar yAxisId="right" dataKey="repoCommits" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </ComposedChart>
            </ChartContainer>
          </div>

          {/* Two Column Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mantle Repository Activity</h3>
                <Button variant="outline" size="sm" className="gap-2"><Copy className="h-3 w-3" />Copy Query</Button>
              </div>
              <div className="mb-4 flex items-center gap-2 text-xs">
                <div className="h-3 w-3 bg-[#3b82f6]"></div>
                <span className="text-muted-foreground">Mantle Ecosystem Repositories Commits (90d Sum)</span>
              </div>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={repositoryActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="commits" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ChartContainer>
        </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mantle Smart Contract Activity</h3>
                <Button variant="outline" size="sm" className="gap-2"><Copy className="h-3 w-3" />Copy Query</Button>
              </div>
              <div className="mb-4 flex items-center gap-2 text-xs">
                <div className="h-3 w-3 bg-[#60a5fa]"></div>
                <span className="text-muted-foreground">Active Smart Contracts (90d Sum)</span>
              </div>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={smartContractActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="contracts" fill="#60a5fa" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </section>

        {/* Terms Link */}
        <div className="mt-12 text-center">
          <a href="#" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            Terms and Conditions
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </main>
    </div>
  )
}
