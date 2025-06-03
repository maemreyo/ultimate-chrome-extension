// Enhanced options page with AI configuration

import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "~components/ui/toaster"
import { ThemeProvider } from "~components/theme-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"
import { Label } from "~components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { Switch } from "~components/ui/switch"
import { Badge } from "~components/ui/badge"
import { Progress } from "~components/ui/progress"
import { Alert, AlertDescription } from "~components/ui/alert"
import {
  Brain,
  Key,
  Settings,
  Database,
  Shield,
  Palette,
  BellRing,
  CreditCard,
  BarChart3,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"
import { useSettings, useStorageQuery } from "@matthew.ngo/chrome-storage"
import { sendToBackground } from "@plasmohq/messaging"
import toast from "react-hot-toast"
import "~styles/globals.css"

const queryClient = new QueryClient()

const aiProviders = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'] },
  { value: 'google', label: 'Google AI', models: ['gemini-pro', 'gemini-pro-vision'] }
]

function OptionsContent() {
  const { user, isAuthenticated } = useSupabaseAuth()
  const { settings, update: updateSettings } = useSettings()
  const [activeTab, setActiveTab] = useState("ai")
  const [isTestingAI, setIsTestingAI] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load AI stats
  const { data: aiStats } = useStorageQuery({
    where: { _key: 'ai-usage-stats' }
  })

  // AI Settings State
  const [aiProvider, setAiProvider] = useState(settings?.ai?.provider || 'openai')
  const [aiModel, setAiModel] = useState(settings?.ai?.model || 'gpt-3.5-turbo')
  const [apiKey, setApiKey] = useState(settings?.ai?.apiKey || '')

  // Content Settings State
  const [contentSettings, setContentSettings] = useState({
    autoExtract: settings?.contentExtraction?.autoExtract || false,
    preserveFormatting: settings?.contentExtraction?.preserveFormatting ?? true,
    includeImages: settings?.contentExtraction?.includeImages ?? true
  })

  // Analysis Settings State
  const [analysisSettings, setAnalysisSettings] = useState({
    autoAnalyze: settings?.analysis?.autoAnalyze || false,
    depth: settings?.analysis?.depth || 'standard',
    includeRecommendations: settings?.analysis?.includeRecommendations ?? true
  })

  // Test AI Configuration
  const testAIConfig = async () => {
    setIsTestingAI(true)
    setAiTestResult(null)

    try {
      const response = await sendToBackground({
        name: "test-ai-config",
        body: { provider: aiProvider, apiKey, model: aiModel }
      })

      if (response.success) {
        setAiTestResult({ success: true, message: "AI configuration is valid!" })
      } else {
        setAiTestResult({ success: false, message: response.error || "Configuration test failed" })
      }
    } catch (error) {
      setAiTestResult({ success: false, message: "Failed to test configuration" })
    } finally {
      setIsTestingAI(false)
    }
  }

  // Save all settings
  const saveSettings = async () => {
    setIsSaving(true)

    try {
      await updateSettings({
        ai: {
          provider: aiProvider,
          model: aiModel,
          apiKey
        },
        contentExtraction: contentSettings,
        analysis: analysisSettings
      })

      // Update backend services
      await sendToBackground({
        name: "update-settings",
        body: {
          settings: {
            ai: { provider: aiProvider, model: aiModel, apiKey },
            contentExtraction: contentSettings,
            analysis: analysisSettings
          }
        }
      })

      toast.success("Settings saved successfully!")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate usage percentage
  const usagePercentage = aiStats?.tokensUsed
    ? Math.min((aiStats.tokensUsed / 1000000) * 100, 100)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Extension Settings</h1>
          <p className="text-muted-foreground">Configure your AI-powered Chrome extension</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full mb-8">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Config</span>
            </TabsTrigger>
            <TabsTrigger value="extraction" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Extraction</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Storage</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Configuration</CardTitle>
                <CardDescription>
                  Configure your AI provider and API credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiProviders.map(provider => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiProviders
                        .find(p => p.value === aiProvider)
                        ?.models.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter your ${aiProvider} API key`}
                    />
                    <Button
                      onClick={testAIConfig}
                      disabled={!apiKey || isTestingAI}
                      variant="outline"
                    >
                      {isTestingAI ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get your API key from the {aiProvider} dashboard
                  </p>
                </div>

                {/* Test Result */}
                {aiTestResult && (
                  <Alert variant={aiTestResult.success ? "default" : "destructive"}>
                    {aiTestResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{aiTestResult.message}</AlertDescription>
                  </Alert>
                )}

                {/* Save Button */}
                <Button onClick={saveSettings} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save AI Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>AI Usage Statistics</CardTitle>
                <CardDescription>
                  Monitor your AI API usage and costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tokens Used</span>
                    <span className="font-medium">
                      {aiStats?.tokensUsed?.toLocaleString() || 0} / 1M
                    </span>
                  </div>
                  <Progress value={usagePercentage} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{aiStats?.requestsCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Requests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      ${aiStats?.costEstimate?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Est. Cost</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {aiStats?.lastReset ? new Date(aiStats.lastReset).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Reset</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Reset Usage Stats
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extraction" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Extraction Settings</CardTitle>
                <CardDescription>
                  Configure how content is extracted from web pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Extract Content</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically extract content when visiting articles
                    </p>
                  </div>
                  <Switch
                    checked={contentSettings.autoExtract}
                    onCheckedChange={(checked) =>
                      setContentSettings({ ...contentSettings, autoExtract: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Preserve Formatting</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep original text formatting when extracting
                    </p>
                  </div>
                  <Switch
                    checked={contentSettings.preserveFormatting}
                    onCheckedChange={(checked) =>
                      setContentSettings({ ...contentSettings, preserveFormatting: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Images</Label>
                    <p className="text-sm text-muted-foreground">
                      Extract and save images from content
                    </p>
                  </div>
                  <Switch
                    checked={contentSettings.includeImages}
                    onCheckedChange={(checked) =>
                      setContentSettings({ ...contentSettings, includeImages: checked })
                    }
                  />
                </div>

                <Button onClick={saveSettings} disabled={isSaving} className="w-full">
                  Save Extraction Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Settings</CardTitle>
                <CardDescription>
                  Configure content analysis preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Analyze</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically analyze extracted content
                    </p>
                  </div>
                  <Switch
                    checked={analysisSettings.autoAnalyze}
                    onCheckedChange={(checked) =>
                      setAnalysisSettings({ ...analysisSettings, autoAnalyze: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Analysis Depth</Label>
                  <Select
                    value={analysisSettings.depth}
                    onValueChange={(value: any) =>
                      setAnalysisSettings({ ...analysisSettings, depth: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick (Basic insights)</SelectItem>
                      <SelectItem value="standard">Standard (Recommended)</SelectItem>
                      <SelectItem value="detailed">Detailed (Comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered improvement suggestions
                    </p>
                  </div>
                  <Switch
                    checked={analysisSettings.includeRecommendations}
                    onCheckedChange={(checked) =>
                      setAnalysisSettings({ ...analysisSettings, includeRecommendations: checked })
                    }
                  />
                </div>

                <Button onClick={saveSettings} disabled={isSaving} className="w-full">
                  Save Analysis Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Management</CardTitle>
                <CardDescription>
                  Manage your stored content and data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Storage stats would go here */}
                <p className="text-muted-foreground">Storage management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of the extension
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Appearance settings would go here */}
                <p className="text-muted-foreground">Appearance settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Billing info would go here */}
                <p className="text-muted-foreground">Billing management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function OptionsIndex() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <OptionsContent />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default OptionsIndex