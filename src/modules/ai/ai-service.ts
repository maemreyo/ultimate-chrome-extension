// Updated: Enhanced AI service with multi-provider support and advanced features

import { Storage } from "@plasmohq/storage"
import { AICache } from "./cache"
import { AIRateLimiter } from "./rate-limiter"
import { AIEncryption } from "./encryption"
import { AIAnalytics } from "./analytics"
import { createAIProvider } from "./utils/provider-factory"
import type {
  AIConfig,
  AIProvider,
  AIProviderType,
  AIUsageStats,
  GenerateOptions,
  ImageGenerationOptions,
  TranscriptionOptions,
  SpeechOptions,
  CodeGenerationOptions
} from "./types"

export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map()
  private config: AIConfig | null = null
  private storage: Storage
  private cache: AICache
  private rateLimiter: AIRateLimiter
  private encryption: AIEncryption
  private analytics: AIAnalytics

  private usageStats: AIUsageStats = {
    tokensUsed: 0,
    requestsCount: 0,
    costEstimate: 0,
    lastReset: new Date(),
    byProvider: {},
    byModel: {},
    byCapability: {},
    errors: []
  }

  constructor() {
    this.storage = new Storage({ area: "local" })
    this.cache = new AICache()
    this.rateLimiter = new AIRateLimiter()
    this.encryption = new AIEncryption()
    this.analytics = new AIAnalytics()

    this.loadConfig()
    this.loadUsageStats()
    this.initializeBuiltInProviders()
  }

  private async initializeBuiltInProviders() {
    // Register all built-in providers
    const providerTypes: AIProviderType[] = [
      'openai', 'anthropic', 'google', 'cohere',
      'huggingface', 'replicate', 'stability',
      'elevenlabs', 'whisper', 'local'
    ]

    for (const type of providerTypes) {
      try {
        const provider = await createAIProvider(type, this.config || {})
        if (provider) {
          this.providers.set(type, provider)
        }
      } catch (error) {
        console.warn(`Failed to initialize ${type} provider:`, error)
      }
    }
  }

  private async loadConfig() {
    const encryptedConfig = await this.storage.get("ai_config_encrypted")
    if (encryptedConfig) {
      try {
        this.config = await this.encryption.decrypt(encryptedConfig)
      } catch {
        // Fallback to unencrypted config
        this.config = await this.storage.get("ai_config")
      }
    } else {
      this.config = await this.storage.get("ai_config")
    }

    if (this.config) {
      await this.initializeProviders(this.config)
    }
  }

  private async loadUsageStats() {
    const stats = await this.storage.get("ai_usage_stats")
    if (stats) {
      this.usageStats = stats
    }
  }

  private async initializeProviders(config: AIConfig) {
    // Initialize main provider
    const mainProvider = await createAIProvider(config.provider, config)
    if (mainProvider) {
      this.providers.set(config.provider, mainProvider)
    }

    // Initialize fallback providers
    if (config.fallbackProviders) {
      for (const fallbackType of config.fallbackProviders) {
        const fallbackProvider = await createAIProvider(fallbackType, config)
        if (fallbackProvider) {
          this.providers.set(fallbackType, fallbackProvider)
        }
      }
    }

    // Configure cache
    if (config.cache) {
      this.cache.configure(config.cache)
    }

    // Configure rate limiter
    if (config.rateLimit) {
      this.rateLimiter.configure(config.rateLimit)
    }
  }

  async configure(config: AIConfig) {
    // Encrypt sensitive data if encryption is enabled
    if (config.encryption?.enabled) {
      const encryptedConfig = await this.encryption.encrypt(config)
      await this.storage.set("ai_config_encrypted", encryptedConfig)
    } else {
      await this.storage.set("ai_config", config)
    }

    this.config = config
    await this.initializeProviders(config)
  }

  async registerProvider(name: AIProviderType, providerClass: new (config: AIConfig) => AIProvider) {
    if (this.config) {
      const provider = new providerClass(this.config)
      this.providers.set(name, provider)
    }
  }

  private async getProvider(): Promise<AIProvider> {
    if (!this.config) {
      throw new Error("AI service not configured")
    }

    const provider = this.providers.get(this.config.provider)
    if (!provider) {
      throw new Error(`Provider ${this.config.provider} not found`)
    }

    return provider
  }

  private async executeWithFallback<T>(
    operation: (provider: AIProvider) => Promise<T>,
    capability: string
  ): Promise<T> {
    const errors: Error[] = []

    // Try main provider
    try {
      await this.rateLimiter.checkLimit()
      const provider = await this.getProvider()
      const result = await operation(provider)
      await this.analytics.trackSuccess(this.config!.provider, capability)
      return result
    } catch (error) {
      errors.push(error as Error)
      await this.analytics.trackError(this.config!.provider, capability, error as Error)
    }

    // Try fallback providers
    if (this.config?.fallbackProviders) {
      for (const fallbackType of this.config.fallbackProviders) {
        const fallbackProvider = this.providers.get(fallbackType)
        if (fallbackProvider) {
          try {
            const result = await operation(fallbackProvider)
            await this.analytics.trackSuccess(fallbackType, capability)
            return result
          } catch (error) {
            errors.push(error as Error)
            await this.analytics.trackError(fallbackType, capability, error as Error)
          }
        }
      }
    }

    // All providers failed
    throw new Error(`All providers failed: ${errors.map(e => e.message).join(', ')}`)
  }

  // Text generation methods
  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const cacheKey = this.cache.generateKey('generateText', prompt, options)
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached as string

    const result = await this.executeWithFallback(
      async (provider) => {
        if (!provider.generateText) {
          throw new Error("Provider does not support text generation")
        }
        return provider.generateText(prompt, options)
      },
      'generateText'
    )

    await this.cache.set(cacheKey, result)
    await this.updateUsageStats(prompt.length + result.length, 'generateText')
    return result
  }

  async generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const provider = await this.getProvider()
    if (!provider.generateStream) {
      throw new Error("Provider does not support streaming")
    }

    await this.rateLimiter.checkLimit()
    const stream = provider.generateStream(prompt, options)

    // Track usage for streaming
    let totalLength = prompt.length

    async function* trackedStream(service: AIService) {
      for await (const chunk of stream) {
        totalLength += chunk.length
        yield chunk
      }
      await service.updateUsageStats(totalLength, 'generateStream')
    }

    return trackedStream(this)
  }

  // Image generation methods
  async generateImage(prompt: string, options?: ImageGenerationOptions) {
    const cacheKey = this.cache.generateKey('generateImage', prompt, options)
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached

    const result = await this.executeWithFallback(
      async (provider) => {
        if (!provider.generateImage) {
          throw new Error("Provider does not support image generation")
        }
        return provider.generateImage(prompt, options)
      },
      'generateImage'
    )

    await this.cache.set(cacheKey, result)
    await this.updateUsageStats(prompt.length * 10, 'generateImage') // Images cost more
    return result
  }

  async analyzeImage(image: string | Blob, options?: any) {
    return this.executeWithFallback(
      async (provider) => {
        if (!provider.analyzeImage) {
          throw new Error("Provider does not support image analysis")
        }
        return provider.analyzeImage(image, options)
      },
      'analyzeImage'
    )
  }

  // Audio methods
  async transcribeAudio(audio: Blob, options?: TranscriptionOptions) {
    return this.executeWithFallback(
      async (provider) => {
        if (!provider.transcribeAudio) {
          throw new Error("Provider does not support audio transcription")
        }
        return provider.transcribeAudio(audio, options)
      },
      'transcribeAudio'
    )
  }

  async generateSpeech(text: string, options?: SpeechOptions) {
    const cacheKey = this.cache.generateKey('generateSpeech', text, options)
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached as Blob

    const result = await this.executeWithFallback(
      async (provider) => {
        if (!provider.generateSpeech) {
          throw new Error("Provider does not support speech generation")
        }
        return provider.generateSpeech(text, options)
      },
      'generateSpeech'
    )

    await this.cache.set(cacheKey, result)
    await this.updateUsageStats(text.length * 2, 'generateSpeech')
    return result
  }

  // Code generation methods
  async generateCode(prompt: string, options?: CodeGenerationOptions) {
    return this.executeWithFallback(
      async (provider) => {
        if (!provider.generateCode) {
          throw new Error("Provider does not support code generation")
        }
        return provider.generateCode(prompt, options)
      },
      'generateCode'
    )
  }

  async explainCode(code: string, language?: string) {
    return this.executeWithFallback(
      async (provider) => {
        if (!provider.explainCode) {
          throw new Error("Provider does not support code explanation")
        }
        return provider.explainCode(code, language)
      },
      'explainCode'
    )
  }

  // Original methods maintained for backward compatibility
  async summarize(text: string, options?: any) {
    const provider = await this.getProvider()
    if (!provider.summarize) {
      throw new Error("Provider does not support summarization")
    }

    const result = await provider.summarize(text, options)
    await this.updateUsageStats(text.length + result.length, 'summarize')
    return result
  }

  async classifyText(text: string, labels: string[]) {
    const provider = await this.getProvider()
    if (!provider.classifyText) {
      throw new Error("Provider does not support classification")
    }

    const result = await provider.classifyText(text, labels)
    await this.updateUsageStats(text.length, 'classifyText')
    return result
  }

  async generateEmbedding(text: string) {
    const provider = await this.getProvider()
    if (!provider.generateEmbedding) {
      throw new Error("Provider does not support embeddings")
    }

    const result = await provider.generateEmbedding(text)
    await this.updateUsageStats(text.length, 'generateEmbedding')
    return result
  }

  // Usage tracking methods
  private async updateUsageStats(estimatedTokens: number, capability: string) {
    const tokens = Math.ceil(estimatedTokens / 4)
    const provider = this.config?.provider || 'local'
    const model = this.config?.model || 'default'

    this.usageStats.tokensUsed += tokens
    this.usageStats.requestsCount += 1
    this.usageStats.costEstimate += this.calculateCost(tokens, provider)

    // Update by provider
    if (!this.usageStats.byProvider[provider]) {
      this.usageStats.byProvider[provider] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        averageLatency: 0,
        errorRate: 0
      }
    }
    this.usageStats.byProvider[provider].requests += 1
    this.usageStats.byProvider[provider].tokens += tokens
    this.usageStats.byProvider[provider].cost += this.calculateCost(tokens, provider)

    // Update by capability
    this.usageStats.byCapability[capability] = (this.usageStats.byCapability[capability] || 0) + 1

    await this.storage.set("ai_usage_stats", this.usageStats)
  }

  private calculateCost(tokens: number, provider: string): number {
    const costPerToken: Record<string, number> = {
      openai: 0.000002,
      'openai-gpt4': 0.00003,
      anthropic: 0.000008,
      google: 0.000001,
      cohere: 0.0000015,
      huggingface: 0,
      local: 0
    }

    return tokens * (costPerToken[provider] || 0)
  }

  async getUsageStats(): Promise<AIUsageStats> {
    return this.usageStats
  }

  async resetUsageStats() {
    this.usageStats = {
      tokensUsed: 0,
      requestsCount: 0,
      costEstimate: 0,
      lastReset: new Date(),
      byProvider: {},
      byModel: {},
      byCapability: {},
      errors: []
    }
    await this.storage.set("ai_usage_stats", this.usageStats)
  }

  // Utility methods
  async validateConfiguration(config: AIConfig): Promise<boolean> {
    try {
      const provider = await createAIProvider(config.provider, config)
      return provider !== null
    } catch {
      return false
    }
  }

  getAvailableProviders(): AIProviderType[] {
    return Array.from(this.providers.keys())
  }

  async clearCache() {
    await this.cache.clear()
  }
}

// Singleton instance
export const aiService = new AIService()