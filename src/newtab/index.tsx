// Enhanced new tab page with AI features dashboard

import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "~components/theme-provider"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"
import { Badge } from "~components/ui/badge"
import { Progress } from "~components/ui/progress"
import {
  Brain,
  Search,
  Plus,
  TrendingUp,
  Clock,
  FileText,
  BarChart3,
  Sparkles,
  ExternalLink,
  Calendar,
  Target,
  Zap,
  BookOpen,
  Globe
} from "lucide-react"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"
import { useExtensionFeatures } from "~hooks/useIntegratedServices"
import { format } from "date-fns"
import "~styles/globals.css"

const queryClient = new QueryClient()

function NewTabContent() {
  const { user } = useSupabaseAuth()
  const { saved, aiStats, history } = useExtensionFeatures()

  const [greeting, setGreeting] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [searchEngine, setSearchEngine] = useState("google")

  // Update greeting and time
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting("Good morning")
      else if (hour < 18) setGreeting("Good afternoon")
      else setGreeting("Good evening")
    }

    updateGreeting()
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      updateGreeting()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const searchEngines = {
      google: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`
    }

    window.location.href = searchEngines[searchEngine as keyof typeof searchEngines]
  }

  // Calculate stats
  const totalSaved = saved.savedItems?.length || 0
  const todaysSaved = saved.savedItems?.filter(item => {
    const itemDate = new Date(item.createdAt)
    const today = new Date()
    return itemDate.toDateString() === today.toDateString()
  }).length || 0

  const aiUsagePercentage = aiStats.stats?.tokensUsed
    ? Math.min((aiStats.stats.tokensUsed / 100000) * 100, 100)
    : 0

  // Recent activity
  const recentActivity = history?.slice(0, 5) || []

  // Quick links (could be customizable)
  const quickLinks = [
    { name: "Gmail", url: "https://gmail.com", icon: "📧" },
    { name: "GitHub", url: "https://github.com", icon: "💻" },
    { name: "ChatGPT", url: "https://chat.openai.com", icon: "🤖" },
    { name: "YouTube", url: "https://youtube.com", icon: "📺" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {greeting}, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "there"}!
          </h1>
          <p className="text-2xl text-muted-foreground">
            {format(currentTime, "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-4xl font-mono mt-2">
            {format(currentTime, "HH:mm")}
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search the web..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-full shadow-lg"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              {["google", "duckduckgo", "bing"].map((engine) => (
                <Button
                  key={engine}
                  type="button"
                  size="sm"
                  variant={searchEngine === engine ? "default" : "ghost"}
                  className="rounded-full h-8 px-3"
                  onClick={() => setSearchEngine(engine)}
                >
                  {engine.charAt(0).toUpperCase()}
                </Button>
              ))}
            </div>
          </form>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Usage Today</CardTitle>
                <Brain className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aiStats.stats?.requestsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">requests</p>
                <Progress value={aiUsagePercentage} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Content</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSaved}</div>
                <p className="text-xs text-muted-foreground">
                  +{todaysSaved} today
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyses Run</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {history?.filter(h => h.type === 'analysis').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">this week</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Credits</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${aiStats.stats?.costEstimate?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">estimated cost</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Quick Links
                  <Button size="icon" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.map((link) => (
                    <Button
                      key={link.name}
                      variant="outline"
                      className="justify-start"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      <span className="mr-2">{link.icon}</span>
                      {link.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("tabs/ai-chat.html") })}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Chat Assistant
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("tabs/content-analyzer.html") })}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Content Analyzer
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("tabs/writing-assistant.html") })}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Writing Assistant
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:row-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recent activity
                    </p>
                  ) : (
                    recentActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {item.type === 'extraction' && <FileText className="h-4 w-4 text-primary" />}
                          {item.type === 'analysis' && <BarChart3 className="h-4 w-4 text-primary" />}
                          {item.type === 'ai' && <Brain className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.timestamp), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Productivity Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Today's AI Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    💡 Did you know?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can select any text on a webpage and use the AI assistant to summarize,
                    explain, or translate it instantly. Just look for the floating AI button!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function NewTab() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <NewTabContent />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default NewTab