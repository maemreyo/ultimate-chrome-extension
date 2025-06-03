import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "~components/theme-provider"
import { Badge } from "~components/ui/badge"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Progress } from "~components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"
import {
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Settings,
  Sparkles
} from "lucide-react"
import { sendToBackground } from "@plasmohq/messaging"
import "~styles/globals.css"

const queryClient = new QueryClient()

function PopupContent() {
  const { user, isAuthenticated } = useSupabaseAuth()
  const [activeTab, setActiveTab] = useState("extract")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractionResult, setExtractionResult] = useState<any>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [aiStats, setAiStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Get AI usage stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await sendToBackground({
          name: "ai-stats"
        })
        setAiStats(response)
      } catch (err) {
        console.error("Failed to load AI stats:", err)
      }
    }
    loadStats()
  }, [])

  // Extract content from current tab
  const handleExtract = async () => {
    setIsExtracting(true)
    setError(null)

    try {
      const response = await sendToBackground({
        name: "extract-content",
        body: {
          method: "currentTab",
          options: {
            includeMetadata: true,
            detectSections: true,
            calculateReadability: true
          }
        }
      })

      if (response.success) {
        setExtractionResult(response.data)
        setActiveTab("analyze") // Switch to analyze tab
      } else {
        setError(response.error?.message || "Extraction failed")
      }
    } catch (err: any) {
      setError(err.message || "Failed to extract content")
    } finally {
      setIsExtracting(false)
    }
  }

  // Analyze extracted content
  const handleAnalyze = async () => {
    if (!extractionResult) {
      setError("No content to analyze. Please extract first.")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await sendToBackground({
        name: "analyze-content",
        body: {
          content: extractionResult.cleanText,
          options: {
            includeNLP: true,
            includeReadability: true,
            includeKeywords: true,
            includeSentiment: true,
            includeRecommendations: true
          }
        }
      })

      setAnalysisResult(response)
    } catch (err: any) {
      setError(err.message || "Failed to analyze content")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Save content and analysis
  const handleSave = async () => {
    if (!extractionResult) return

    try {
      const response = await sendToBackground({
        name: "save-content",
        body: {
          url: extractionResult.metadata.source,
          title: extractionResult.title,
          content: extractionResult,
          analysis: analysisResult,
          tags: ["saved", analysisResult?.aiAnalysis?.sentiment || "neutral"]
        }
      })

      if (response.success) {
        setError(null)
        // Show success feedback
      }
    } catch (err: any) {
      setError(err.message || "Failed to save content")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-semibold">Sign In Required</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Please sign in to use AI features
        </p>
        <Button onClick={() => chrome.runtime.openOptionsPage()}>
          Open Settings
        </Button>
      </div>
    )
  }

  return (
    <div className="h-[600px] w-[450px] bg-background">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Brain className="h-5 w-5 text-primary" />
            AI Assistant
          </h1>
          <Badge variant="outline">{user?.email}</Badge>
        </div>

        {/* AI Usage Stats */}
        {aiStats && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-sm">
                <span>AI Credits Used</span>
                <span className="font-medium">
                  {aiStats.tokensUsed?.toLocaleString() || 0} tokens
                </span>
              </div>
              <Progress
                value={(aiStats.tokensUsed / 100000) * 100}
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="extract" className="text-xs">
              <FileText className="mr-1 h-4 w-4" />
              Extract
            </TabsTrigger>
            <TabsTrigger value="analyze" className="text-xs">
              <BarChart3 className="mr-1 h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Sparkles className="mr-1 h-4 w-4" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="mt-4">
            <div className="space-y-4">
              <Button
                onClick={handleExtract}
                disabled={isExtracting}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Extract Current Page
                  </>
                )}
              </Button>

              {extractionResult && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Extraction Result</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Content extracted successfully
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Title:</strong> {extractionResult.title}
                      </p>
                      <p>
                        <strong>Words:</strong> {extractionResult.wordCount}
                      </p>
                      <p>
                        <strong>Reading Time:</strong>{" "}
                        {extractionResult.readingTime} min
                      </p>
                      <p>
                        <strong>Quality Score:</strong>{" "}
                        {(extractionResult.quality.score * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={handleSave}>
                        <Download className="mr-1 h-4 w-4" />
                        Save
                      </Button>
                      <Button size="sm" onClick={() => setActiveTab("analyze")}>
                        Analyze →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analyze" className="mt-4">
            <div className="space-y-4">
              <Button
                onClick={handleAnalyze}
                disabled={!extractionResult || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analyze Content
                  </>
                )}
              </Button>

              {analysisResult && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* AI Analysis */}
                    {analysisResult.aiAnalysis && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">AI Insights</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>Sentiment:</strong>
                            <Badge variant="outline" className="ml-2">
                              {analysisResult.aiAnalysis.sentiment}
                            </Badge>
                          </p>
                          <p>
                            <strong>Tone:</strong>{" "}
                            {analysisResult.aiAnalysis.tone}
                          </p>
                          <div>
                            <strong>Key Points:</strong>
                            <ul className="ml-4 mt-1 list-disc text-xs">
                              {analysisResult.aiAnalysis.keyPoints
                                ?.slice(0, 3)
                                .map((point: string, i: number) => (
                                  <li key={i}>{point}</li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NLP Analysis */}
                    {analysisResult.nlpAnalysis && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Language Analysis
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>Readability:</strong> Grade{" "}
                            {analysisResult.nlpAnalysis.readability.grade}
                          </p>
                          <p>
                            <strong>Language:</strong>{" "}
                            {analysisResult.nlpAnalysis.language}
                          </p>
                          <div>
                            <strong>Top Keywords:</strong>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {analysisResult.nlpAnalysis.keywords
                                ?.slice(0, 5)
                                .map((kw: any, i: number) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {kw.word}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {analysisResult.recommendations && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Recommendations</h4>
                        <ul className="space-y-1 text-xs">
                          {analysisResult.recommendations
                            .slice(0, 3)
                            .map((rec: any, i: number) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span>{rec.description}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Sparkles className="mr-2 h-4 w-4" />
                Summarize Page
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Brain className="mr-2 h-4 w-4" />
                Extract Key Points
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                SEO Analysis
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => chrome.runtime.openOptionsPage()}
              >
                <Settings className="mr-2 h-4 w-4" />
                AI Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function IndexPopup() {
  // Check if running in extension context
  if (typeof chrome === "undefined" || !chrome.runtime) {
    return <div>Error: Not running in extension context</div>
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <PopupContent />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default IndexPopup
