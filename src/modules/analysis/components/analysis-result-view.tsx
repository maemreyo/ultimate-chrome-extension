import { Card, CardContent, CardHeader, CardTitle } from '~components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Badge } from '~components/ui/badge'
import { Button } from '~components/ui/button'
import { Progress } from '~components/ui/progress'
import {
  FileDown,
  Copy,
  Share,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { AnalysisResult, AnalysisSection, Recommendation } from '../types'
import { ResultFormatter } from '../result-formatter'

interface AnalysisResultViewProps {
  result: AnalysisResult
}

export function AnalysisResultView({ result }: AnalysisResultViewProps) {
  const formatted = ResultFormatter.formatForUI(result)

  const handleExport = (format: 'pdf' | 'html' | 'markdown' | 'json') => {
    const content = ResultFormatter.export(result, format)

    // Create download
    const blob = content instanceof Blob ? content : new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/plain'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-${result.id}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    const markdown = ResultFormatter.export(result, 'markdown')
    navigator.clipboard.writeText(markdown as string)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {result.type.charAt(0).toUpperCase() + result.type.slice(1)} Analysis
              {result.status === 'completed' && (
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </CardTitle>
            {formatted.metadata && (
              <p className="text-sm text-muted-foreground mt-1">
                Completed in {formatted.metadata.duration} • {formatted.metadata.model}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExport('markdown')}>
              <FileDown className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="recommendations">
              Recommendations
              {result.recommendations && (
                <Badge variant="secondary" className="ml-2">
                  {result.recommendations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {formatted.summary && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{formatted.summary}</p>
              </div>
            )}

            {formatted.metrics.primary.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {formatted.metrics.primary.map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {metric.format === 'percentage'
                          ? `${(metric.value * 100).toFixed(1)}%`
                          : metric.value
                        }
                        {metric.max && ` / ${metric.max}`}
                      </div>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {formatted.sections.map((section) => (
              <Card key={section.id} className={section.highlight ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderSectionContent(section)}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {formatted.recommendations && formatted.recommendations.length > 0 ? (
              formatted.recommendations.map((rec) => (
                <Card key={rec.id} className={`border-l-4 ${
                  rec.priority === 'high' ? 'border-l-red-500' :
                  rec.priority === 'medium' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{rec.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.description}
                        </p>
                        {rec.impact && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Impact: {rec.impact}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        rec.priority === 'high' ? 'destructive' :
                        rec.priority === 'medium' ? 'default' :
                        'secondary'
                      }>
                        {rec.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recommendations available
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleExport('pdf')}>
                <CardContent className="pt-6 text-center">
                  <FileDown className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Export as PDF</p>
                  <p className="text-xs text-muted-foreground">Professional report format</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleExport('html')}>
                <CardContent className="pt-6 text-center">
                  <FileDown className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Export as HTML</p>
                  <p className="text-xs text-muted-foreground">Web-ready format</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleExport('markdown')}>
                <CardContent className="pt-6 text-center">
                  <FileDown className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Export as Markdown</p>
                  <p className="text-xs text-muted-foreground">Documentation format</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleExport('json')}>
                <CardContent className="pt-6 text-center">
                  <FileDown className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Export as JSON</p>
                  <p className="text-xs text-muted-foreground">Raw data format</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function renderSectionContent(section: AnalysisSection) {
  if (typeof section.content === 'string') {
    return <p className="whitespace-pre-wrap">{section.content}</p>
  }

  const formatted = section.formatted

  if (typeof formatted === 'object' && formatted.type === 'metrics') {
    return (
      <div className="grid grid-cols-2 gap-4">
        {formatted.metrics.map((metric: any, index: number) => (
          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
            <span className="text-sm font-medium">{metric.label}</span>
            <span className="text-sm">
              {metric.format === 'percentage'
                ? `${(metric.value * 100).toFixed(1)}%`
                : metric.value
              }
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (typeof formatted === 'object' && formatted.type === 'list') {
    return (
      <ul className="space-y-1">
        {formatted.items.map((item: string, index: number) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span className="text-sm">{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (typeof formatted === 'object' && formatted.type === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {formatted.headers.map((header: string, index: number) => (
                <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {formatted.rows.map((row: any, rowIndex: number) => (
              <tr key={rowIndex}>
                {Object.values(row).map((cell: any, cellIndex: number) => (
                  <td key={cellIndex} className="px-4 py-2 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return <div>{JSON.stringify(section.content)}</div>
}