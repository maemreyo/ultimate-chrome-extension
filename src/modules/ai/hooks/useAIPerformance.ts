import { useCallback, useEffect, useState } from 'react'
import { PerformanceMonitor } from '../enhancements'
import { enhancedAIService } from '../enhanced-service'

interface PerformanceMetrics {
  averageLatency: number
  throughput: number
  memoryUsage: number
  trends: 'improving' | 'degrading' | 'stable'
  recommendations: string[]
}

export function useAIPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageLatency: 0,
    throughput: 0,
    memoryUsage: 0,
    trends: 'stable',
    recommendations: []
  })
  const [monitoring, setMonitoring] = useState(false)

  const performanceMonitor = new PerformanceMonitor()

  const startMonitoring = useCallback(() => {
    setMonitoring(true)
  }, [])

  const stopMonitoring = useCallback(() => {
    setMonitoring(false)
  }, [])

  const measureOperation = useCallback(async <T,>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    performanceMonitor.startMeasure(operationName)

    try {
      const result = await operation()
      const report = performanceMonitor.endMeasure(operationName)

      if (report) {
        setMetrics(prev => ({
          ...prev,
          averageLatency: report.duration,
          throughput: report.throughput,
          recommendations: report.recommendations
        }))
      }

      return result
    } catch (error) {
      performanceMonitor.endMeasure(operationName)
      throw error
    }
  }, [])

  useEffect(() => {
    if (!monitoring) return

    const interval = setInterval(() => {
      const stats = enhancedAIService.getPerformanceStats()
      const trends = stats.trends

      setMetrics({
        averageLatency: stats.averageMetrics.avgDuration,
        throughput: stats.averageMetrics.avgThroughput,
        memoryUsage: stats.averageMetrics.avgMemory,
        trends: trends.trend,
        recommendations: [trends.details]
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [monitoring])

  return {
    metrics,
    monitoring,
    startMonitoring,
    stopMonitoring,
    measureOperation
  }
}