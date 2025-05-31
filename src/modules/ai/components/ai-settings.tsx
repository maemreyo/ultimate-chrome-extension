import { useState } from "react"
import { Alert, AlertDescription } from "~components/ui/alert"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Input } from "~components/ui/input"
import { Label } from "~components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { useAIContext } from "../ai-provider"
import type { AIConfig } from "../types"

export function AISettings() {
  const { config, stats, configure, resetStats } = useAIContext()
  const [formData, setFormData] = useState<AIConfig>(config || {
    provider: 'local',
    apiKey: '',
    model: ''
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleSave = async () => {
    try {
      await configure(formData)
      setTestResult("Configuration saved successfully!")
    } catch (error) {
      setTestResult(`Error: ${error.message}`)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      await configure(formData)
      const { aiService } = await import("../ai-service")
      const result = await aiService.generateText("Hello, this is a test. Respond with 'Test successful!'")
      setTestResult(`Test successful! Response: ${result}`)
    } catch (error) {
      setTestResult(`Test failed: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const providerModels = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    huggingface: ['microsoft/phi-2', 'google/flan-t5-base', 'facebook/bart-large'],
    local: ['built-in']
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Configuration</CardTitle>
          <CardDescription>Configure your AI provider and model settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={(value: any) => setFormData({ ...formData, provider: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local (Built-in)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="huggingface">HuggingFace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.provider !== 'local' && (
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Enter your API key"
              />
            </div>
          )}

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
                {providerModels[formData.provider]?.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {testResult && (
            <Alert>
              <AlertDescription>{testResult}</AlertDescription>
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

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Track your AI usage and costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-2xl font-bold">{stats.tokensUsed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requests</p>
                <p className="text-2xl font-bold">{stats.requestsCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="text-2xl font-bold">${stats.costEstimate.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Reset</p>
                <p className="text-sm">{new Date(stats.lastReset).toLocaleDateString()}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={resetStats}
            >
              Reset Statistics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
