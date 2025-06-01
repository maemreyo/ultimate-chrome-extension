import { useCallback, useRef, useState } from 'react'
import { enhancedAIService } from '../enhanced-service'
import { RequestQueue } from '../enhancements'
import type { GenerateOptions, UseAIOptions } from '../types'

interface UseEnhancedAIOptions extends UseAIOptions {
  enableDebug?: boolean
  queuePriority?: number
  autoOptimize?: boolean
  performanceTracking?: boolean
}

interface UseEnhancedAIReturn {
  // Standard operations
  generateText: (prompt: string, options?: GenerateOptions) => Promise<string>
  generateStream: (prompt: string, options?: GenerateOptions) => AsyncGenerator<string>

  // Enhanced operations
  generateWithOptimization: (prompt: string, requirements?: any) => Promise<string>
  generateBatch: (prompts: string[], options?: GenerateOptions) => Promise<string[]>

  // Queue management
  queueStatus: {
    size: number
    processing: boolean
    priority: Record<string, number>
  }
  clearQueue: () => void

  // Performance & debugging
  performance: {
    lastOperation: any
    averageLatency: number
    trends: any
  }
  debugLogs: any[]

  // State
  loading: boolean
  error: Error | null
  usage: {
    tokens: number
    cost: number
    operations: number
  }
}

export function useEnhancedAI(options: UseEnhancedAIOptions = {}): UseEnhancedAIReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [usage, setUsage] = useState({ tokens: 0, cost: 0, operations: 0 })
  const [queueStatus, setQueueStatus] = useState({
    size: 0,
    processing: false,
    priority: {} as Record<string, number>
  })
  const [performance, setPerformance] = useState({
    lastOperation: null,
    averageLatency: 0,
    trends: null
  })
  const [debugLogs, setDebugLogs] = useState<any[]>([])

  // Initialize debug mode if requested
  useRef(() => {
    if (options.enableDebug) {
      enhancedAIService.enableDebugMode({
        logToConsole: true,
        filters: ['error', 'performance', 'optimization']
      })
    }
  })

  // Standard text generation with enhancements
  const generateText = useCallback(async (
    prompt: string,
    genOptions?: GenerateOptions
  ): Promise<string> => {
    setLoading(true)
    setError(null)

    try {
      const priority = options.queuePriority || RequestQueue.PRIORITY.NORMAL
      const result = await enhancedAIService.generateText(prompt, genOptions)

      // Update usage stats
      const stats = await enhancedAIService.getUsageStats()
      setUsage({
        tokens: stats.tokensUsed,
        cost: stats.costEstimate,
        operations: stats.requestsCount
      })

      // Update performance stats if tracking enabled
      if (options.performanceTracking) {
        const perfStats = enhancedAIService.getPerformanceStats()
        setPerformance({
          lastOperation: perfStats.averageMetrics,
          averageLatency: perfStats.averageMetrics.avgDuration,
          trends: perfStats.trends
        })
      }

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)

      // Update debug logs
      if (options.enableDebug) {
        setDebugLogs(enhancedAIService.getDebugLogs({ since: new Date(Date.now() - 300000) }))
      }
    }
  }, [options])

  // Generate with automatic optimization
  const generateWithOptimization = useCallback(async (
    prompt: string,
    requirements?: {
      maxCost?: number
      minQuality?: number
      maxLatency?: number
    }
  ): Promise<string> => {
    setLoading(true)
    setError(null)

    try {
      const result = await enhancedAIService.optimizeRequest(prompt, requirements)

      // Update stats
      const stats = await enhancedAIService.getUsageStats()
      setUsage({
        tokens: stats.tokensUsed,
        cost: stats.costEstimate,
        operations: stats.requestsCount
      })

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Batch processing
  const generateBatch = useCallback(async (
    prompts: string[],
    genOptions?: GenerateOptions
  ): Promise<string[]> => {
    setLoading(true)
    setError(null)

    try {
      const promises = prompts.map(prompt =>
        enhancedAIService.generateText(prompt, genOptions)
      )

      const results = await Promise.all(promises)

      // Update stats
      const stats = await enhancedAIService.getUsageStats()
      setUsage({
        tokens: stats.tokensUsed,
        cost: stats.costEstimate,
        operations: stats.requestsCount
      })

      return results
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Streaming generation
  const generateStream = useCallback(async function* (
    prompt: string,
    genOptions?: GenerateOptions
  ): AsyncGenerator<string> {
    setLoading(true)
    setError(null)

    try {
      const stream = enhancedAIService.generateStream(prompt, genOptions)

      for await (const chunk of stream) {
        yield chunk
      }

      // Update stats after completion
      const stats = await enhancedAIService.getUsageStats()
      setUsage({
        tokens: stats.tokensUsed,
        cost: stats.costEstimate,
        operations: stats.requestsCount
      })
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Queue management
  const clearQueue = useCallback(() => {
    // Implementation would be in enhanced service
    setQueueStatus({
      size: 0,
      processing: false,
      priority: {}
    })
  }, [])

  // Update queue status periodically
  useRef(() => {
    const interval = setInterval(() => {
      const status = enhancedAIService.getPerformanceStats().queue
      setQueueStatus({
        size: status.queueSize,
        processing: status.isProcessing,
        priority: status.queuedByPriority
      })
    }, 1000)

    return () => clearInterval(interval)
  })

  return {
    generateText,
    generateStream,
    generateWithOptimization,
    generateBatch,
    queueStatus,
    clearQueue,
    performance,
    debugLogs,
    loading,
    error,
    usage
  }
}