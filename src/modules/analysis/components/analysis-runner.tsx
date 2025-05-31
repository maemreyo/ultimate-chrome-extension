import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Button } from '~components/ui/button'
import { Textarea } from '~components/ui/textarea'
import { Input } from '~components/ui/input'
import { Label } from '~components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~components/ui/select'
import { Alert, AlertDescription } from '~components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Badge } from '~components/ui/badge'
import { Loader2, Play, FileText, BarChart, AlertCircle } from 'lucide-react'
import { useAnalysis } from '../hooks/useAnalysis'
import { useAnalysisContext } from '../analysis-provider'
import { AnalysisType } from '../types'

export function AnalysisRunner() {
  const { availableTypes } = useAnalysisContext()
  const { analyze, result, loading, error } = useAnalysis()

  const [selectedType, setSelectedType] = useState<string>('')
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [options, setOptions] = useState({
    depth: 'standard' as 'quick' | 'standard' | 'detailed',
    includeRecommendations: true,
    includeSources: true
  })

  const selectedAnalysisType = availableTypes.find(t => t.id === selectedType)

  const handleInputChange = (name: string, value: any) => {
    setInputs(prev => ({ ...prev, [name]: value }))
  }

  const handleAnalyze = async () => {
    if (!selectedType) return

    try {
      await analyze(selectedType, inputs, options)
    } catch (err) {
      console.error('Analysis failed:', err)
    }
  }

  const canAnalyze = selectedType &&
    selectedAnalysisType?.requiredInputs.every(input =>
      !input.required || inputs[input.name]
    )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Run Analysis</CardTitle>
          <CardDescription>
            Select an analysis type and provide the required inputs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Analysis Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.name}</span>
                      {type.aiRequired && (
                        <Badge variant="outline" className="ml-2">AI</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAnalysisType && (
            <>
              <div className="text-sm text-muted-foreground">
                {selectedAnalysisType.description}
              </div>

              <div className="space-y-4">
                {selectedAnalysisType.requiredInputs.map(input => (
                  <div key={input.name} className="space-y-2">
                    <Label>
                      {input.name.charAt(0).toUpperCase() + input.name.slice(1)}
                      {input.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {input.description && (
                      <p className="text-xs text-muted-foreground">{input.description}</p>
                    )}
                    {input.type === 'text' && input.maxLength && input.maxLength > 500 ? (
                      <Textarea
                        value={inputs[input.name] || ''}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        placeholder={`Enter ${input.name}...`}
                        maxLength={input.maxLength}
                        rows={5}
                      />
                    ) : (
                      <Input
                        type={input.type === 'url' ? 'url' : 'text'}
                        value={inputs[input.name] || ''}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        placeholder={`Enter ${input.name}...`}
                        maxLength={input.maxLength}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label>Analysis Options</Label>
                <div className="space-y-2">
                  <Label className="text-sm">Depth</Label>
                  <Select
                    value={options.depth}
                    onValueChange={(value: any) => setOptions(prev => ({ ...prev, depth: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick (Fast overview)</SelectItem>
                      <SelectItem value="standard">Standard (Balanced)</SelectItem>
                      <SelectItem value="detailed">Detailed (Comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={handleAnalyze}
            disabled={!canAnalyze || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && <AnalysisResultView result={result} />}
    </div>
  )
}