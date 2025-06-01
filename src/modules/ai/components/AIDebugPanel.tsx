import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Badge } from '~components/ui/badge'
import { Button } from '~components/ui/button'
import { ScrollArea } from '~components/ui/scroll-area'
import { enhancedAIService } from '../enhanced-service'

export function AIDebugPanel() {
  const [debugLogs, setDebugLogs] = useState<any[]>([])
  const [performanceStats, setPerformanceStats] = useState<any>(null)
  const [errorStats, setErrorStats] = useState<any>(null)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    if (!isEnabled) return

    const interval = setInterval(() => {
      setDebugLogs(enhancedAIService.getDebugLogs())
      setPerformanceStats(enhancedAIService.getPerformanceStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [isEnabled])

  const toggleDebugMode = () => {
    if (isEnabled) {
      enhancedAIService.disableDebugMode()
    } else {
      enhancedAIService.enableDebugMode({
        logToConsole: false,
        filters: ['request', 'response', 'error', 'performance']
      })
    }
    setIsEnabled(!isEnabled)
  }

  const exportLogs = () => {
    const logs = enhancedAIService.getDebugLogs()
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-debug-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Debug Panel</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isEnabled ? "destructive" : "default"}
              onClick={toggleDebugMode}
            >
              {isEnabled ? "Disable Debug" : "Enable Debug"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportLogs}>
              Export Logs
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {debugLogs.map((log, index) => (
                <div key={index} className="mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      log.type === 'error' ? 'destructive' :
                      log.type === 'warning' ? 'default' :
                      'secondary'
                    }>
                      {log.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="mt-1 text-xs">{JSON.stringify(log.data, null, 2)}</pre>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="performance">
            {performanceStats && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {performanceStats.averageMetrics.avgDuration.toFixed(0)}ms
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Latency</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {performanceStats.averageMetrics.avgThroughput.toFixed(0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Tokens/sec</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {(performanceStats.averageMetrics.avgMemory / 1024 / 1024).toFixed(1)}MB
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Memory</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium">Performance Trend</h4>
                  <p className="text-sm">{performanceStats.trends.details}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="queue">
            {performanceStats?.queue && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {performanceStats.queue.queueSize}
                      </div>
                      <p className="text-xs text-muted-foreground">Queue Size</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {performanceStats.queue.activeRequests}
                      </div>
                      <p className="text-xs text-muted-foreground">Active Requests</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Queue by Priority</h4>
                  {Object.entries(performanceStats.queue.queuedByPriority || {}).map(
                    ([priority, count]) => (
                      <div key={priority} className="flex justify-between">
                        <span className="capitalize">{priority}</span>
                        <Badge>{count as number}</Badge>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="errors">
            {performanceStats?.errors && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {performanceStats.errors.total}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Errors</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {(performanceStats.errors.resolutionRate * 100).toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Resolution Rate</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Errors by Category</h4>
                  {Object.entries(performanceStats.errors.byCategory || {}).map(
                    ([category, count]) => (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category}</span>
                        <Badge variant="destructive">{count as number}</Badge>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}