import { AIService } from "./ai-service"
import {
  ConnectionPool,
  ContextWindowManager,
  CostOptimizer,
  DebugMode,
  EnhancedErrorHandler,
  PerformanceMonitor,
  RequestQueue,
  RetryMechanism,
  TokenManager
} from "./enhancements"
import type {
  AIConfig,
  AIProviderType,
  ChatMessage,
  GenerateOptions
} from "./types"

export class EnhancedAIService extends AIService {
  private retryMechanism = new RetryMechanism()
  private requestQueue: RequestQueue
  private tokenManager = new TokenManager()
  private costOptimizer = new CostOptimizer()
  private contextManager = new ContextWindowManager()
  private performanceMonitor = new PerformanceMonitor()
  private connectionPool = new ConnectionPool()
  private errorHandler = new EnhancedErrorHandler()
  private debugMode = new DebugMode()

  constructor() {
    super()

    this.requestQueue = new RequestQueue({
      concurrency: 3,
      onQueueChange: (size) =>
        this.debugMode.log("queue", `Queue size: ${size}`)
    })
  }

  override async generateText(
    prompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    const operationId = `generateText-${Date.now()}`

    return this.requestQueue.add(async () => {
      this.performanceMonitor.startMeasure(operationId, {
        provider: this.config?.provider,
        tokens: this.tokenManager.getTokenCount(
          prompt,
          this.config?.model || "gpt-3.5-turbo"
        )
      })

      try {
        const result = await this.retryMechanism.executeWithRetry(
          () => super.generateText(prompt, options),
          {
            onRetry: (error, attempt) => {
              this.debugMode.log(
                "retry",
                `Retrying after error: ${error.message}`,
                { attempt }
              )
            }
          }
        )

        const report = this.performanceMonitor.endMeasure(operationId)
        if (report?.bottlenecks.length > 0) {
          this.debugMode.log(
            "performance",
            "Performance issues detected",
            report
          )
        }

        return result
      } catch (error) {
        const enhancedError = this.errorHandler.handleError(error, {
          provider: this.config?.provider || "unknown",
          operation: "generateText",
          attempt: 1
        })
        throw enhancedError
      }
    }, RequestQueue.PRIORITY.NORMAL)
  }

  override async *generateStream(
    prompt: string,
    options?: GenerateOptions
  ): AsyncGenerator<string> {
    const operationId = `generateStream-${Date.now()}`

    this.performanceMonitor.startMeasure(operationId)

    try {
      const stream = super.generateStream(prompt, options)

      for await (const chunk of stream) {
        yield chunk
      }

      this.performanceMonitor.endMeasure(operationId)
    } catch (error) {
      this.performanceMonitor.endMeasure(operationId)
      throw this.errorHandler.handleError(error, {
        provider: this.config?.provider || "unknown",
        operation: "generateStream",
        attempt: 1
      })
    }
  }

  async optimizeRequest(prompt: string, requirements?: any) {
    const optimal = await this.costOptimizer.selectOptimalProvider(
      prompt,
      requirements
    )

    this.debugMode.log("optimization", "Selected optimal provider", optimal)

    const originalConfig = { ...this.config }

    // Temporarily switch to optimal provider
    if (this.config) {
      await this.configure({
        ...this.config,
        provider: optimal.provider as AIProviderType,
        model: optimal.model
      })
    }

    try {
      return await this.generateText(prompt)
    } finally {
      // Restore original configuration
      if (originalConfig.provider) {
        await this.configure(originalConfig as AIConfig)
      }
    }
  }

  async manageContext(
    conversationId: string,
    messages: ChatMessage[],
    maxTokens?: number
  ): Promise<ChatMessage[]> {
    const model = this.config?.model || "gpt-3.5-turbo"
    const limit = maxTokens || 4096

    return this.contextManager.manageContext(
      conversationId,
      messages,
      limit,
      model
    )
  }

  enableDebugMode(options?: any) {
    this.debugMode.enable(options)
  }

  disableDebugMode() {
    this.debugMode.disable()
  }

  getDebugLogs(filter?: any) {
    return this.debugMode.getEvents(filter)
  }

  getPerformanceStats() {
    return {
      averageMetrics: this.performanceMonitor.getAverageMetrics(),
      trends: this.performanceMonitor.getPerformanceTrends(),
      connectionPool: this.connectionPool.getPoolStats(),
      queue: this.requestQueue.getQueueStatus(),
      errors: this.errorHandler.getErrorStats()
    }
  }

  async clearQueue() {
    this.requestQueue.clear()
  }

  getTokenManager() {
    return this.tokenManager
  }

  getCostOptimizer() {
    return this.costOptimizer
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService()
