"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  GitFork, 
  GitCommit, 
  Users, 
  FolderGit2, 
  DollarSign,
  Github,
  Globe,
  Twitter,
  Loader2,
  Code,
  Calendar,
  Zap,
  FileCode,
  Coins
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, ResponsiveContainer } from "recharts"

// Types
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
  forks_count: number
  language: string | null
  pushed_at: string
  updated_at: string
  topics: string[]
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
  bio?: string
  location?: string
  tags?: string[]
  human_checkmark?: boolean
  talent_protocol_id?: string
  _builderScore?: number
  _builderEarnings?: string | null
  _githubStats?: GitHubStats
  _onchainStats?: OnchainStats
  _githubUsername?: string | null
  _githubProjects?: {
    topByStars: GitHubRepo[]
    mostRecent: GitHubRepo[]
    username: string | null
  }
  _recentProject?: RecentProject
}

// Language colors for charts
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Rust: "#dea584",
  Go: "#00add8",
  Solidity: "#363636",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#ffac45",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
  default: "#6e7681"
}

// Helper to format values
function formatValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "-"
  const num = typeof val === 'string' ? parseInt(val) : val
  if (isNaN(num)) return String(val)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(num)
}

// Format currency
function formatCurrency(val: string | null | undefined): string {
  if (!val) return "$0"
  const num = parseFloat(val)
  if (isNaN(num)) return "$0"
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Time ago
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

const chartConfig = {
  value: { label: "Value", color: "#10b981" },
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<TalentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const response = await fetch("/api/profiles")
        
        if (!response.ok) {
          throw new Error("Failed to fetch profiles")
        }
        
        const data = await response.json()
        const foundProfile = data.profiles?.find((p: TalentProfile) => p.id === params.id)
        
        if (foundProfile) {
          setProfile(foundProfile)
        } else {
          setError("Profile not found")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProfile()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Profile not found"}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const displayName = profile.display_name || profile.name || profile.username || "Anonymous"
  const stats = profile._githubStats || {} as GitHubStats
  const onchainStats = profile._onchainStats || {} as OnchainStats
  const topRepos = profile._githubProjects?.topByStars || []
  const recentRepos = profile._githubProjects?.mostRecent || []

  // Prepare chart data for GitHub stats
  const githubStatsData = [
    { name: "Commits", value: parseInt(stats.total_commits || stats.crypto_commits || "0") || 0, fill: "#10b981" },
    { name: "Contributions", value: parseInt(stats.total_contributions || "0") || 0, fill: "#3b82f6" },
    { name: "Repositories", value: parseInt(stats.repositories || "0") || 0, fill: "#8b5cf6" },
    { name: "Stars", value: parseInt(stats.stars || "0") || 0, fill: "#f59e0b" },
    { name: "Forks", value: parseInt(stats.forks || "0") || 0, fill: "#ef4444" },
  ].filter(d => d.value > 0)

  // Language distribution from repos
  const languageCounts: Record<string, number> = {}
  ;[...topRepos, ...recentRepos].forEach(repo => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
    }
  })
  const languageData = Object.entries(languageCounts)
    .map(([name, value]) => ({ name, value, fill: languageColors[name] || languageColors.default }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button onClick={() => router.back()} variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Leaderboard
          </Button>
          <div className="text-xl font-semibold text-emerald-400">talent</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="h-24 w-24 border-4 border-emerald-400/20">
            <AvatarImage src={profile.image_url || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              {profile.human_checkmark && (
                <span className="text-emerald-400 text-xl" title="Human Verified">✓</span>
              )}
            </div>
            
            {profile.bio && (
              <p className="text-muted-foreground mb-4 max-w-2xl">{profile.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.tags?.map((tag, i) => (
                <Badge key={i} variant="secondary">{tag}</Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile._githubUsername && (
                <a 
                  href={`https://github.com/${profile._githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  {profile._githubUsername}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {profile.talent_protocol_id && (
                <a 
                  href={`https://talent.app/u/${profile.talent_protocol_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  Talent Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          
          {/* Score Card */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-6 text-center min-w-[180px]">
            <div className="text-sm text-emerald-400 mb-1">Builder Score</div>
            <div className="text-5xl font-bold text-emerald-400">{profile._builderScore || 0}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              Builder Earnings
            </div>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(profile._builderEarnings)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <GitCommit className="h-4 w-4 text-emerald-400" />
              Total Commits
            </div>
            <div className="text-2xl font-bold">
              {formatValue(stats.total_commits || stats.crypto_commits)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4 text-blue-400" />
              Contributions
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {formatValue(stats.total_contributions)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FolderGit2 className="h-4 w-4 text-purple-400" />
              Repositories
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {formatValue(stats.repositories)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Star className="h-4 w-4 text-yellow-400" />
              Stars Earned
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {formatValue(stats.stars)}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <GitFork className="h-4 w-4 text-orange-400" />
              Forks
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {formatValue(stats.forks)}
            </div>
          </div>
        </div>

        {/* Crypto-specific stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Code className="h-4 w-4 text-cyan-400" />
              Crypto Repository Commits
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {formatValue(stats.crypto_commits)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Commits to crypto/web3 repositories</div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FolderGit2 className="h-4 w-4 text-pink-400" />
              Crypto Repos Contributed
            </div>
            <div className="text-2xl font-bold text-pink-400">
              {formatValue(stats.crypto_repos_contributed)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Number of crypto repositories contributed to</div>
          </div>
        </div>

        {/* Onchain Stats Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-400" />
            Onchain Activity
          </h2>
          
          {/* Active Contracts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <FileCode className="h-4 w-4 text-orange-400" />
                Weekly Active Contracts
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {formatValue(onchainStats.weekly_active_contracts)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Active in the last 7 days</div>
            </div>
            
            {/* Transactions */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="h-4 w-4 text-blue-400" />
                Total Transactions
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {formatValue(onchainStats.total_transactions)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">All-time contract transactions</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="h-4 w-4 text-blue-300" />
                Weekly Transactions
              </div>
              <div className="text-2xl font-bold text-blue-300">
                {formatValue(onchainStats.weekly_transactions)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Transactions in the last 7 days</div>
            </div>
          </div>
          
          {/* Fees Generated */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Coins className="h-4 w-4 text-green-400" />
                Total Fees Generated
              </div>
              <div className="text-2xl font-bold text-green-400">
                {onchainStats.total_fees ? formatValue(onchainStats.total_fees) : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">All-time fees from contract activity (wei)</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Coins className="h-4 w-4 text-green-300" />
                Weekly Fees Generated
              </div>
              <div className="text-2xl font-bold text-green-300">
                {onchainStats.weekly_fees ? formatValue(onchainStats.weekly_fees) : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Fees generated in the last 7 days (wei)</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* GitHub Stats Chart */}
          {githubStatsData.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">GitHub Activity Overview</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={githubStatsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {githubStatsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}

          {/* Language Distribution */}
          {languageData.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Languages Used</h3>
              <div className="flex items-center gap-8">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={languageData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {languageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2">
                  {languageData.map((lang, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.fill }} />
                      <span className="text-sm">{lang.name}</span>
                      <span className="text-xs text-muted-foreground">({lang.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Currently Building Section */}
        {profile._recentProject && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-400" />
              Currently Building
            </h2>
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <a 
                    href={profile._recentProject.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-semibold text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2"
                  >
                    {profile._recentProject.name}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {profile._recentProject.language && (
                    <Badge variant="outline" className="ml-3">{profile._recentProject.language}</Badge>
                  )}
                  {profile._recentProject.aiSummary && (
                    <p className="text-muted-foreground mt-3">{profile._recentProject.aiSummary}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      {profile._recentProject.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Last updated {timeAgo(profile._recentProject.pushed_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Repositories */}
        {topRepos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Top Repositories by Stars
            </h2>
            <div className="grid gap-4">
              {topRepos.map((repo, i) => (
                <a
                  key={i}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card border border-border rounded-lg p-4 hover:border-emerald-500/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors truncate">
                          {repo.name}
                        </span>
                        {repo.language && (
                          <Badge variant="outline" className="text-xs shrink-0">{repo.language}</Badge>
                        )}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{repo.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {repo.topics?.slice(0, 5).map((topic, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        {repo.stargazers_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        {repo.forks_count}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Recent Repositories */}
        {recentRepos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Recent Activity
            </h2>
            <div className="grid gap-4">
              {recentRepos.map((repo, i) => (
                <a
                  key={i}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card border border-border rounded-lg p-4 hover:border-blue-500/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-blue-400 group-hover:text-blue-300 transition-colors truncate">
                          {repo.name}
                        </span>
                        {repo.language && (
                          <Badge variant="outline" className="text-xs shrink-0">{repo.language}</Badge>
                        )}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{repo.description}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">
                      {timeAgo(repo.pushed_at)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
