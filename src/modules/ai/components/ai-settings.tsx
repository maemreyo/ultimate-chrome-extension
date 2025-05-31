// Updated: Enhanced settings with multi-provider support and advanced options

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "~components/ui/alert"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Input } from "~components/ui/input"
import { Label } from "~components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { Switch } from "~components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { Badge } from "~components/ui/badge"
import { Progress } from "~components/ui/progress"
import { useAIContext } from "../ai-provider"
import type { AIConfig, AIProviderType } from "../types"

interface ProviderInfo {
  name: string
  description: string
  capabilities: string[]
  requiresApiKey: boolean
  models: { value: string; label: string }[]
  pricing?: string
}

const PROVIDER_INFO: Record<AIProviderType, ProviderInfo> = {
  openai: {
    name: "OpenAI",
    description: "GPT-4, GPT-3.5, DALL-E, and Whisper",
    capabilities: ["text", "image", "audio", "embeddings"],
    requiresApiKey: true,
    models: [
      { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
      { value: "dall-e-3", label: "DALL-E 3" },
      { value: "whisper-1", label: "Whisper" }
    ],
    pricing: "$0.01/1K tokens (GPT-3.5)"
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude 3 family of models",
    capabilities: ["text"],
    requiresApiKey: true,
    models: [
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
      { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
      { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" }
    ],
    pricing: "$0.015/1K tokens (Claude 3 Opus)"
  },
  google: {
    name: "Google AI",
    description: "Gemini and PaLM models",
    capabilities: ["text", "image", "embeddings"],
    requiresApiKey: true,
    models: [
      { value: "gemini-pro", label: "Gemini Pro" },
      { value: "gemini-pro-vision", label: "Gemini Pro Vision" },
      { value: "palm-2", label: "PaLM 2" }
    ],
    pricing: "Free tier available"
  },
  cohere: {
    name: "Cohere",
    description: "Command, Generate, and Embed models",
    capabilities: ["text", "embeddings", "classification"],
    requiresApiKey: true,
    models: [
      { value: "command", label: "Command" },
      { value: "command-light", label: "Command Light" },
      { value: "embed-english-v3.0", label: "Embed v3" }
    ],
    pricing: "$0.0004/1K tokens"
  },
  huggingface: {
    name: "HuggingFace",
    description: "Open-source models via Inference API",
    capabilities: ["text", "embeddings", "classification"],
    requiresApiKey: true,
    models: [
      { value: "meta-llama/Llama-2-70b-chat-hf", label: "Llama 2 70B" },
      { value: "mistralai/Mixtral-8x7B-Instruct-v0.1", label: "Mixtral 8x7B" },
      { value: "microsoft/phi-2", label: "Phi-2" },
      { value: "google/flan-t5-xxl", label: "Flan-T5 XXL" }
    ],
    pricing: "Free tier available"
  },
  replicate: {
    name: "Replicate",
    description: "Run open-source models in the cloud",
    capabilities: ["text", "image", "audio"],
    requiresApiKey: true,
    models: [
      { value: "meta/llama-2-70b-chat", label: "Llama 2 70B" },
      { value: "stability-ai/sdxl", label: "Stable Diffusion XL" }
    ],
    pricing: "Pay per second"
  },
  stability: {
    name: "Stability AI",
    description: "Stable Diffusion image generation",
    capabilities: ["image"],
    requiresApiKey: true,
    models: [
      { value: "stable-diffusion-xl-1024-v1-0", label: "SDXL 1.0" },
      { value: "stable-diffusion-v1-6", label: "SD 1.6" }
    ],
    pricing: "$0.002/image"
  },
  elevenlabs: {
    name: "ElevenLabs",
    description: "High-quality text-to-speech",
    capabilities: ["speech"],
    requiresApiKey: true,
    models: [
      { value: "eleven_monolingual_v1", label: "Monolingual v1" },
      { value: "eleven_multilingual_v2", label: "Multilingual v2" }
    ],
    pricing: "$0.30/1K characters"
  },
  whisper: {
    name: "OpenAI Whisper",
    description: "Speech-to-text transcription",
    capabilities: ["transcription"],
    requiresApiKey: true,
    models: [
      { value: "whisper-1", label: "Whisper Large" }
    ],
    pricing: "$0.006/minute"
  },
  custom: {
    name: "Custom Provider",
    description: "Connect to your own API endpoint",
    capabilities: ["text"],
    requiresApiKey: false,
    models: [{ value: "custom", label: "Custom Model" }]
  },
  local: {
    name: "Local Models",
    description: "Built-in lightweight models (no API key needed)",
    capabilities: ["text", "embeddings", "classification"],
    requiresApiKey: false,
    models: [{ value: "built-in", label: "Built-in Models" }]
  }
}

export function AISettings() {
  const { config, stats, configure, resetStats } = useAIContext()
  const [formData, setFormData] = useState<AIConfig>(config || {
    provider: 'local',
    apiKey: '',
    model: ''
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})

  useEffect(() => {
    if (config?.apiKeys) {
      setApiKeys(config.apiKeys)
    }
  }, [config])

  const handleProviderChange = (provider: AIProviderType) => {
    const info = PROVIDER_INFO[provider]
    setFormData({
      ...formData,
      provider,
      model: info.models[0]?.value || '',
      apiKey: apiKeys[provider] || ''
    })
  }

  const handleApiKeyChange = (provider: string, key: string) => {
    setApiKeys({ ...apiKeys, [provider]: key })
    if (provider === formData.provider) {
      setFormData({ ...formData, apiKey: key })
    }
  }

  const handleSave = async () => {
    try {
      const configToSave: AIConfig = {
        ...formData,
        apiKeys: apiKeys
      }

      await configure(configToSave)
      setTestResult({ success: true, message: "Configuration saved successfully!" })
    } catch (error) {
      setTestResult({ success: false, message: `Error: ${error.message}` })
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const { aiService } = await import("../ai-service")
      const testConfig = { ...formData, apiKeys }
      await configure(testConfig)

      const result = await aiService.generateText("Hello, this is a test. Respond with 'Test successful!'")
      setTestResult({ success: true, message: `Test successful! Response: ${result}` })
    } catch (error) {
      setTestResult({ success: false, message: `Test failed: ${error.message}` })
    } finally {
      setTesting(false)
    }
  }

  const currentProvider = PROVIDER_INFO[formData.provider]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="providers">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Selection</CardTitle>
              <CardDescription>Choose your preferred AI provider and model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-colors ${
                      formData.provider === key ? 'border-primary' : ''
                    }`}
                    onClick={() => handleProviderChange(key as AIProviderType)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{info.name}</h4>
                        {formData.provider === key && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{info.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {info.capabilities.map(cap => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                      {info.pricing && (
                        <p className="text-xs text-muted-foreground">{info.pricing}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={formData.model || ''}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProvider.models.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentProvider.requiresApiKey && (
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder={`Enter your ${currentProvider.name} API key`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored locally
                  </p>
                </div>
              )}

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave}>Save Configuration</Button>
                <Button variant="outline" onClick={handleTest} disabled={testing}>
                  {testing ? "Testing..." : "Test Connection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Manage API keys for multiple providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(PROVIDER_INFO)
                .filter(([_, info]) => info.requiresApiKey)
                .map(([key, info]) => (
                  <div key={key} className="space-y-2">
                    <Label>{info.name}</Label>
                    <Input
                      type="password"
                      value={apiKeys[key] || ''}
                      onChange={(e) => handleApiKeyChange(key, e.target.value)}
                      placeholder={`Enter ${info.name} API key`}
                    />
                  </div>
                ))}

              <Alert>
                <AlertDescription>
                  You can configure multiple API keys to enable automatic failover between providers
                </AlertDescription>
              </Alert>

              <Button onClick={handleSave}>Save All Keys</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure caching, rate limiting, and more</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Caching</Label>
                    <p className="text-sm text-muted-foreground">Cache responses to reduce API calls</p>
                  </div>
                  <Switch
                    checked={formData.cache?.enabled || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        cache: { ...formData.cache, enabled: checked, ttl: 3600, maxSize: 100, strategy: 'lru' }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">Prevent hitting API rate limits</p>
                  </div>
                  <Switch
                    checked={!!formData.rateLimit}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        rateLimit: checked ? {
                          requestsPerMinute: 60,
                          strategy: 'sliding-window'
                        } : undefined
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Encryption</Label>
                    <p className="text-sm text-muted-foreground">Encrypt API keys and sensitive data</p>
                  </div>
                  <Switch
                    checked={formData.encryption?.enabled || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        encryption: {
                          enabled: checked,
                          algorithm: 'aes-256-gcm',
                          keyDerivation: 'pbkdf2'
                        }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fallback Providers</Label>
                  <p className="text-sm text-muted-foreground">
                    Select backup providers for automatic failover
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(PROVIDER_INFO)
                      .filter(p => p !== formData.provider)
                      .map(provider => (
                        <Badge
                          key={provider}
                          variant={formData.fallbackProviders?.includes(provider as AIProviderType) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const current = formData.fallbackProviders || []
                            const updated = current.includes(provider as AIProviderType)
                              ? current.filter(p => p !== provider)
                              : [...current, provider as AIProviderType]
                            setFormData({ ...formData, fallbackProviders: updated })
                          }}
                        >
                          {PROVIDER_INFO[provider as AIProviderType].name}
                        </Badge>
                      ))}
                  </div>
                </div>

                {formData.provider === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom Endpoint URL</Label>
                    <Input
                      value={formData.baseUrl || ''}
                      onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                      placeholder="https://your-api.com/v1"
                    />
                  </div>
                )}
              </div>

              <Button onClick={handleSave}>Save Advanced Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>Track your AI usage and costs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tokens</p>
                      <p className="text-2xl font-bold">{stats.tokensUsed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requests</p>
                      <p className="text-2xl font-bold">{stats.requestsCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Cost</p>
                      <p className="text-2xl font-bold">${stats.costEstimate.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Reset</p>
                      <p className="text-sm">{new Date(stats.lastReset).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {stats.byProvider && Object.keys(stats.byProvider).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Usage by Provider</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(stats.byProvider).map(([provider, providerStats]) => (
                      <div key={provider} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{PROVIDER_INFO[provider as AIProviderType]?.name || provider}</span>
                          <span className="text-sm text-muted-foreground">
                            {providerStats.requests} requests • ${providerStats.cost.toFixed(4)}
                          </span>
                        </div>
                        <Progress
                          value={(providerStats.tokens / stats.tokensUsed) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {stats.byCapability && Object.keys(stats.byCapability).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Usage by Feature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(stats.byCapability).map(([capability, count]) => (
                        <div key={capability} className="flex justify-between">
                          <span className="text-sm">{capability}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={resetStats}
              >
                Reset Statistics
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}