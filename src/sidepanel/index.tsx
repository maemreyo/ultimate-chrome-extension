// Enhanced side panel with all integrated features

import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "~components/theme-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"
import { ScrollArea } from "~components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Badge } from "~components/ui/badge"
import { Textarea } from "~components/ui/textarea"
import {
  Brain,
  FileText,
  Save,
  Search,
  Settings,
  Sparkles,
  BarChart3,
  History,
  Loader2,
  Plus,
  ExternalLink,
  Trash2,
  Download,
  Filter,
  Clock,
  Tag
} from "lucide-react"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"
import { useExtensionFeatures } from "~hooks/useIntegratedServices"
import { formatDistanceToNow } from "date-fns"
import "~styles/globals.css"

const queryClient = new QueryClient()

function SidePanelContent() {
  const { user } = useSupabaseAuth()
  const {
    extraction,
    analysis,
    saved,
    ai,
    aiStats,
    history,
    extractAndAnalyze,
    extractAnalyzeAndSave
  } = useExtensionFeatures()

  const [activeTab, setActiveTab] = useState("assistant")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Get current tab info
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) setCurrentTab(tabs[0])
    })

    const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.status === "complete") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) setCurrentTab(tabs[0])
        })
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
    return () => chrome.tabs.onUpdated.removeListener(listener)
  }, [])

  // Extract and analyze current page
  const handleExtractAndAnalyze = async () => {
    setIsProcessing(true)
    try {
      const result = await extractAndAnalyze()
      setActiveTab("saved")
      toast.success("Content extracted and analyzed!")
    } catch (error) {
      toast.error("Failed to process page")
    } finally {
      setIsProcessing(false)
    }
  }

  // Extract, analyze and save
  const handleExtractAnalyzeSave = async () => {
    setIsProcessing(true)
    try {
      await extractAnalyzeAndSave(['auto-saved'])
      setActiveTab("saved")
      toast.success("Content saved successfully!")
    } catch (error) {
      toast.error("Failed to save content")
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle AI prompt
  const handleAIPrompt = async () => {
    if (!aiPrompt.trim()) return

    setAiResponse("")
    try {
      const response = await ai.generateText(aiPrompt)
      setAiResponse(response)
      setAiPrompt("")
    } catch (error) {
      toast.error("AI request failed")
    }
  }

  // Filter saved content
  const filteredContent = saved.savedItems?.filter(item => {
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.cleanText?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => item.tags?.includes(tag))

    return matchesSearch && matchesTags
  })

  // Get all unique tags
  const allTags = [...new Set(saved.savedItems?.flatMap(item => item.tags || []) || [])]

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Assistant Panel
          </h1>
          <Badge variant="outline">{user?.email}</Badge>
        </div>
        {currentTab && (
          <p className="text-sm text-muted-foreground truncate">
            {currentTab.title}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b space-y-2">
        <div className="flex gap-2">
          <Button
            onClick={handleExtractAndAnalyze}
            disabled={isProcessing || !currentTab}
            size="sm"
            className="flex-1"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Extract & Analyze
          </Button>
          <Button
            onClick={handleExtractAnalyzeSave}
            disabled={isProcessing || !currentTab}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Quick Save
          </Button>
        </div>

        {/* AI Usage Stats */}
        {aiStats.stats && (
          <div className="flex items-center justify-between text-xs bg-muted p-2 rounded">
            <span>AI Usage:</span>
            <span className="font-medium">
              {aiStats.stats.tokensUsed?.toLocaleString() || 0} tokens
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4 px-4">
            <TabsTrigger value="assistant" className="text-xs">
              <Brain className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-xs">
              <Save className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <History className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">
              <BarChart3 className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-220px)]">
            {/* AI Assistant Tab */}
            <TabsContent value="assistant" className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">AI Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={async () => {
                      const summary = await ai.summarize(currentTab?.title || "")
                      setAiResponse(summary)
                    }}
                    disabled={!ai.isConfigured}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Summarize Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={async () => {
                      const points = await ai.extractKeyPoints(currentTab?.title || "")
                      setAiResponse(points.join("\n• "))
                    }}
                    disabled={!ai.isConfigured}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Extract Key Points
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={async () => {
                      const sentiment = await ai.analyzeSentiment(currentTab?.title || "")
                      setAiResponse(`Sentiment: ${sentiment.sentiment}\nScore: ${sentiment.score}`)
                    }}
                    disabled={!ai.isConfigured}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Check Sentiment
                  </Button>
                </CardContent>
              </Card>

              {/* AI Chat */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Ask AI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Ask anything about the current page..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAIPrompt()
                      }
                    }}
                  />
                  <Button
                    onClick={handleAIPrompt}
                    disabled={!aiPrompt.trim() || ai.loading || !ai.isConfigured}
                    size="sm"
                    className="w-full"
                  >
                    {ai.loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Ask AI
                  </Button>

                  {aiResponse && (
                    <Card className="bg-muted">
                      <CardContent className="p-3">
                        <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Saved Content Tab */}
            <TabsContent value="saved" className="p-4 space-y-4">
              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search saved content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setSelectedTags(
                            selectedTags.includes(tag)
                              ? selectedTags.filter(t => t !== tag)
                              : [...selectedTags, tag]
                          )
                        }}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Items */}
              <div className="space-y-2">
                {saved.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredContent?.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No saved content found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredContent?.map((item) => (
                    <Card key={item.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                              </span>
                              {item.tags?.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => window.open(item.url, "_blank")}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                // Delete functionality
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="p-4">
              <div className="space-y-2">
                {history?.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No history yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  history?.map((item) => (
                    <Card key={item.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Content Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Select content from the Saved tab to view detailed analysis
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  )
}

function SidePanel() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <SidePanelContent />
        <Toaster position="bottom-center" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default SidePanel