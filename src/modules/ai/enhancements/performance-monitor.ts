interface PerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
  memoryStart: number
  memoryEnd?: number
  memoryUsed?: number
  throughput?: number
  metadata?: Record<string, any>
}

interface PerformanceReport {
  operationId: string
  duration: number
  memoryUsed: number
  throughput: number
  bottlenecks: string[]
  recommendations: string[]
}

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>()
  private history: PerformanceReport[] = []
  private thresholds = {
    slowOperation: 5000, // 5 seconds
    highMemory: 50 * 1024 * 1024, // 50MB
    lowThroughput: 100 // tokens per second
  }

  startMeasure(operationId: string, metadata?: Record<string, any>) {
    this.metrics.set(operationId, {
      startTime: performance.now(),
      memoryStart: this.getCurrentMemoryUsage(),
      metadata
    })
  }

  endMeasure(operationId: string): PerformanceReport | null {
    const metrics = this.metrics.get(operationId)
    if (!metrics) return null

    metrics.endTime = performance.now()
    metrics.duration = metrics.endTime - metrics.startTime
    metrics.memoryEnd = this.getCurrentMemoryUsage()
    metrics.memoryUsed = metrics.memoryEnd - metrics.memoryStart
    metrics.throughput = this.calculateThroughput(metrics)

    const report = this.generateReport(operationId, metrics)
    this.history.push(report)
    this.metrics.delete(operationId)

    // Auto cleanup old history
    if (this.history.length > 1000) {
      this.history = this.history.slice(-500)
    }

    return report
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private calculateThroughput(metrics: PerformanceMetrics): number {
    if (!metrics.metadata?.tokens || !metrics.duration) return 0
    return (metrics.metadata.tokens / metrics.duration) * 1000 // tokens per second
  }

  private generateReport(operationId: string, metrics: PerformanceMetrics): PerformanceReport {
    const bottlenecks: string[] = []
    const recommendations: string[] = []

    // Check for performance issues
    if (metrics.duration! > this.thresholds.slowOperation) {
      bottlenecks.push('Slow operation detected')
      recommendations.push('Consider using streaming or breaking into smaller operations')
    }

    if (metrics.memoryUsed! > this.thresholds.highMemory) {
      bottlenecks.push('High memory usage')
      recommendations.push('Optimize data structures or process in chunks')
    }

    if (metrics.throughput! < this.thresholds.lowThroughput && metrics.metadata?.tokens) {
      bottlenecks.push('Low throughput')
      recommendations.push('Check network latency or consider using a faster model')
    }

    return {
      operationId,
      duration: metrics.duration!,
      memoryUsed: metrics.memoryUsed!,
      throughput: metrics.throughput!,
      bottlenecks,
      recommendations
    }
  }

  getAverageMetrics(operationType?: string): {
    avgDuration: number
    avgMemory: number
    avgThroughput: number
  } {
    const relevantReports = operationType
      ? this.history.filter(r => r.operationId.includes(operationType))
      : this.history

    if (relevantReports.length === 0) {
      return { avgDuration: 0, avgMemory: 0, avgThroughput: 0 }
    }

    const sum = relevantReports.reduce(
      (acc, report) => ({
        duration: acc.duration + report.duration,
        memory: acc.memory + report.memoryUsed,
        throughput: acc.throughput + report.throughput
      }),
      { duration: 0, memory: 0, throughput: 0 }
    )

    return {
      avgDuration: sum.duration / relevantReports.length,
      avgMemory: sum.memory / relevantReports.length,
      avgThroughput: sum.throughput / relevantReports.length
    }
  }

  getPerformanceTrends(windowSize: number = 50): {
    trend: 'improving' | 'degrading' | 'stable'
    details: string
  } {
    if (this.history.length < windowSize * 2) {
      return { trend: 'stable', details: 'Insufficient data for trend analysis' }
    }

    const recent = this.history.slice(-windowSize)
    const previous = this.history.slice(-windowSize * 2, -windowSize)

    const recentAvg = this.calculateAverage(recent, 'duration')
    const previousAvg = this.calculateAverage(previous, 'duration')

    const change = ((recentAvg - previousAvg) / previousAvg) * 100

    if (change < -10) {
      return { trend: 'improving', details: `Performance improved by ${Math.abs(change).toFixed(1)}%` }
    } else if (change > 10) {
      return { trend: 'degrading', details: `Performance degraded by ${change.toFixed(1)}%` }
    } else {
      return { trend: 'stable', details: 'Performance is stable' }
    }
  }

  private calculateAverage(reports: PerformanceReport[], metric: keyof PerformanceReport): number {
    const values = reports.map(r => r[metric]).filter(v => typeof v === 'number') as number[]
    return values.reduce((a, b) => a + b, 0) / values.length
  }
}