"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ExternalLink, Search, Copy, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Star, Sparkles, DollarSign, Eye, Zap, CheckCircle2, FileCode, GitBranch, RefreshCw } from "lucide-react"
import { DistributeButton } from "@/components/DistributeButton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, Line, XAxis, YAxis, CartesianGrid, ComposedChart, Cell } from "recharts"

// No client-side cache - always fetch fresh from Supabase (which is fast)

// Types for Talent Protocol API response
interface GitHubStats {
  crypto_commits: string | null
  crypto_repos_contributed: string | null
  forks: string | null
  repositories: string | null
  stars: string | null
  total_contributions: string | null
  total_commits: string | null
  mantle_eco_commits: string | null
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

const chartConfig = {
  totalTransactions: { label: "Total Transactions", color: "#10b981" },
  weeklyTransactions: { label: "Weekly Transactions", color: "#34d399" },
  cryptoCommits: { label: "Crypto Commits", color: "#8b5cf6" },
  totalCommits: { label: "Total Commits", color: "#a78bfa" },
  mantleCommits: { label: "Mantle Eco Commits", color: "#06b6d4" },
  weeklyContracts: { label: "Weekly Active Contracts", color: "#f97316" },
  activeBuilders: { label: "Active Builders", color: "#22c55e" },
}

// Helper to parse numeric values from strings (handles "1,234", "1.2K", "1.5M", etc.)
function parseNumericValue(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === "") return 0
  if (typeof val === 'number') return val
  
  // Convert to string and clean up
  let str = String(val).trim().replace(/,/g, '')
  
  // Handle K/M/B suffixes (case insensitive)
  const multipliers: Record<string, number> = { 'k': 1000, 'm': 1000000, 'b': 1000000000 }
  const lastChar = str.slice(-1).toLowerCase()
  if (multipliers[lastChar]) {
    const numPart = parseFloat(str.slice(0, -1))
    return isNaN(numPart) ? 0 : numPart * multipliers[lastChar]
  }
  
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

// Helper to get month name
function getMonthName(monthIndex: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[monthIndex] || ''
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

// Type for Mantle repos
interface MantleRepoContributor {
  login: string
  avatar_url: string
  contributions: number
  html_url: string
}

interface MantleRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  pushed_at: string | null
  topics: string[]
  owner_username: string | null
  owner_display_name: string | null
  owner_image_url: string | null
  owner_profile_id: string | null
  owner_builder_score: number
  contributors?: MantleRepoContributor[]
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
  
  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Mantle repos state
  const [mantleRepos, setMantleRepos] = useState<MantleRepo[]>([])

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

  // Fetch profiles function - always fetch from Supabase (fast)
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🔄 Fetching profiles from Supabase...")
      
      const response = await fetch("/api/profiles")
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ API Error:", errorText)
        throw new Error(`Failed to fetch profiles: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ Received ${data.profiles?.length || 0} profiles`)
      
      if (data.profiles && Array.isArray(data.profiles)) {
        setProfiles(data.profiles)
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

  // Handle manual refresh - just refetch from Supabase
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchProfiles()
  }, [fetchProfiles])

  // Fetch Mantle repos
  const fetchMantleRepos = useCallback(async () => {
    try {
      const response = await fetch("/api/mantle-repos")
      if (response.ok) {
        const data = await response.json()
        if (data.repos && Array.isArray(data.repos)) {
          setMantleRepos(data.repos)
        }
      }
    } catch (err) {
      console.error("Error fetching Mantle repos:", err)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()
    fetchMantleRepos()
  }, [fetchProfiles, fetchMantleRepos])

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

  // ============================================
  // COMPUTED CHART DATA FROM REAL PROFILES
  // ============================================

  // Chart 4: Onchain Activity Breakdown (Stacked Bar) - Top 15 builders by transactions
  const onchainActivityData = profiles
    .map(profile => ({
      name: (profile.display_name || profile.username || 'Anonymous').slice(0, 12),
      totalTxns: parseNumericValue(profile._onchainStats?.total_transactions),
      weeklyTxns: parseNumericValue(profile._onchainStats?.weekly_transactions),
    }))
    .filter(d => d.totalTxns > 0 || d.weeklyTxns > 0)
    .sort((a, b) => b.totalTxns - a.totalTxns)
    .slice(0, 15)

  // Chart 6: Mantle Ecosystem Contribution Leaderboard (Horizontal Bar) - Top 15
  const mantleContributorsData = profiles
    .map(profile => ({
      name: (profile.display_name || profile.username || 'Anonymous').slice(0, 15),
      mantleCommits: parseNumericValue(profile._githubStats?.mantle_eco_commits),
      score: profile._builderScore || 0,
    }))
    .filter(d => d.mantleCommits > 0)
    .sort((a, b) => b.mantleCommits - a.mantleCommits)
    .slice(0, 15)

  // Chart 10: Weekly Active Contracts by Builder (Bar Chart showing distribution)
  const weeklyContractsData = profiles
    .map(profile => ({
      name: (profile.display_name || profile.username || 'Anonymous').slice(0, 12),
      weeklyContracts: parseNumericValue(profile._onchainStats?.weekly_active_contracts),
      totalFees: parseNumericValue(profile._onchainStats?.total_fees),
    }))
    .filter(d => d.weeklyContracts > 0)
    .sort((a, b) => b.weeklyContracts - a.weeklyContracts)
    .slice(0, 12)

  // Chart 13: Builder Activity Heatmap (by month based on recent project push dates)
  const activityHeatmapData = (() => {
    const monthCounts: Record<string, number> = {}
    const now = new Date()
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${getMonthName(date.getMonth())} ${date.getFullYear().toString().slice(-2)}`
      monthCounts[key] = 0
    }
    
    // Count activity by month from recent project push dates
    profiles.forEach(profile => {
      const pushDate = profile._recentProject?.pushed_at
      if (pushDate) {
        const date = new Date(pushDate)
        const key = `${getMonthName(date.getMonth())} ${date.getFullYear().toString().slice(-2)}`
        if (monthCounts[key] !== undefined) {
          monthCounts[key]++
        }
      }
    })
    
    return Object.entries(monthCounts).map(([month, count]) => ({
      month,
      activeBuilders: count,
    }))
  })()

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
            
            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Leaderboard
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <p className="text-muted-foreground">Loading builder profiles...</p>
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

        {/* Mantle Projects Section */}
        {mantleRepos.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Mantle Ecosystem Projects</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Open source repositories building on Mantle
                </p>
              </div>
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                {mantleRepos.length} Projects
              </Badge>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mantleRepos.slice(0, 8).map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-border bg-card p-4 hover:border-emerald-500/50 hover:bg-card/80 transition-all duration-200"
                >
                  {/* Repo Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-medium truncate group-hover:text-emerald-400 transition-colors">
                        {repo.name}
                      </span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  
                  {/* Description */}
                  {repo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {repo.description}
                    </p>
                  )}
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {repo.forks_count}
                    </span>
                    {repo.language && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Contributors */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Contributors</span>
                      {repo.contributors && repo.contributors.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{repo.contributors.length}+</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {repo.contributors && repo.contributors.length > 0 ? (
                        <>
                          <div className="flex -space-x-1.5">
                            {repo.contributors.slice(0, 5).map((contributor, idx) => (
                              <a
                                key={contributor.login}
                                href={contributor.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative hover:z-10 transition-transform hover:scale-110"
                                title={`${contributor.login} (${contributor.contributions} commits)`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Avatar className="h-6 w-6 border-2 border-card">
                                  <AvatarImage src={contributor.avatar_url} />
                                  <AvatarFallback className="text-[8px] bg-muted">
                                    {contributor.login[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </a>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-1 truncate">
                            {repo.contributors[0]?.login}
                            {repo.contributors.length > 1 && ` +${repo.contributors.length - 1}`}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={repo.owner_image_url || undefined} />
                            <AvatarFallback className="text-[8px] bg-muted">
                              {(repo.owner_username || '?')[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {repo.owner_username}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            
            {mantleRepos.length > 8 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" className="gap-2">
                  View All {mantleRepos.length} Projects
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Builder Insights Charts Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Builder Insights</h2>
          
          {/* Chart 6: Mantle Ecosystem Contribution Leaderboard */}
          {mantleContributorsData.length > 0 && (
            <div className="mb-8 rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Mantle Ecosystem Contributors</h3>
                  <p className="text-sm text-muted-foreground">Top builders by commits to Mantle ecosystem repositories</p>
                </div>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                  {mantleContributorsData.length} Contributors
                </Badge>
              </div>
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <BarChart data={mantleContributorsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={100} />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-cyan-400">{data.mantleCommits} Mantle commits</p>
                            <p className="text-xs text-muted-foreground">Builder Score: {data.score}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="mantleCommits" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          )}

          {/* Two Column Charts Row 1 */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Chart 4: Onchain Activity Breakdown */}
            {onchainActivityData.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Onchain Activity by Builder</h3>
                  <p className="text-sm text-muted-foreground">Total vs Weekly transactions</p>
                </div>
                <div className="mb-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-[#10b981]"></div>
                    <span className="text-muted-foreground">Total Transactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-[#34d399]"></div>
                    <span className="text-muted-foreground">Weekly Transactions</span>
                  </div>
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={onchainActivityData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-emerald-400">Total: {data.totalTxns.toLocaleString()}</p>
                              <p className="text-sm text-emerald-300">Weekly: {data.weeklyTxns.toLocaleString()}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="totalTxns" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="weeklyTxns" fill="#34d399" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}

            {/* Chart 10: Weekly Active Contracts */}
            {weeklyContractsData.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Weekly Active Contracts</h3>
                  <p className="text-sm text-muted-foreground">Builders with most active smart contracts this week</p>
                </div>
                <div className="mb-4 flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 bg-[#f97316]"></div>
                  <span className="text-muted-foreground">Weekly Active Contracts</span>
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={weeklyContractsData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-orange-400">{data.weeklyContracts} active contracts</p>
                              <p className="text-xs text-muted-foreground">Total fees: ${data.totalFees.toFixed(2)}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="weeklyContracts" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </div>

          {/* Builder Activity Chart */}
          <div className="grid gap-6 md:grid-cols-1">
            {/* Chart 13: Builder Activity Heatmap (Monthly) */}
            {activityHeatmapData.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Builder Activity Timeline</h3>
                  <p className="text-sm text-muted-foreground">Monthly active builders (based on recent project updates)</p>
                </div>
                <div className="mb-4 flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 bg-[#22c55e]"></div>
                  <span className="text-muted-foreground">Active Builders</span>
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ComposedChart data={activityHeatmapData} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="font-medium">{data.month}</p>
                              <p className="text-sm text-green-400">{data.activeBuilders} active builders</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="activeBuilders" fill="#22c55e" radius={[4, 4, 0, 0]}>
                      {activityHeatmapData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.activeBuilders > 5 ? '#22c55e' : entry.activeBuilders > 2 ? '#4ade80' : entry.activeBuilders > 0 ? '#86efac' : '#1f2937'} 
                        />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="activeBuilders" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                  </ComposedChart>
                </ChartContainer>
              </div>
            )}
          </div>

          {/* Empty State */}
          {profiles.length === 0 && !loading && (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No profile data available for charts.</p>
              <p className="text-sm text-muted-foreground mt-2">Charts will populate once profiles are loaded.</p>
            </div>
          )}
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
