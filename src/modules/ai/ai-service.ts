import { Storage } from "@plasmohq/storage"
import { AIProvider, AIConfig, AIUsageStats } from "./types"
import { OpenAIProvider } from "./providers/openai"
import { AnthropicProvider } from "./providers/anthropic"
import { HuggingFaceProvider } from "./providers/huggingface"
import { LocalProvider } from "./providers/local"

export class AIService {
  private provider: AIProvider | null = null
  private config: AIConfig | null = null
  private storage: Storage
  private usageStats: AIUsageStats = {
    tokensUsed: 0,
    requestsCount: 0,
    costEstimate: 0,
    lastReset: new Date()
  }

  constructor() {
    this.storage = new Storage({ area: "local" })
    this.loadConfig()
    this.loadUsageStats()
  }

  private async loadConfig() {
    this.config = await this.storage.get("ai_config")
    if (this.config) {
      this.initializeProvider(this.config)
    }
  }

  private async loadUsageStats() {
    const stats = await this.storage.get("ai_usage_stats")
    if (stats) {
      this.usageStats = stats
    }
  }

  private initializeProvider(config: AIConfig) {
    switch (config.provider) {
      case 'openai':
        this.provider = new OpenAIProvider(config)
        break
      case 'anthropic':
        this.provider = new AnthropicProvider(config)
        break
      case 'huggingface':
        this.provider = new HuggingFaceProvider(config)
        break
      case 'local':
        this.provider = new LocalProvider(config)
        break
    }
  }

  async configure(config: AIConfig) {
    this.config = config
    await this.storage.set("ai_config", config)
    this.initializeProvider(config)
  }

  async generateText(prompt: string, options?: any) {
    if (!this.provider) {
      throw new Error("AI provider not configured")
    }

    try {
      const result = await this.provider.generateText(prompt, options)
      await this.updateUsageStats(prompt.length + result.length)
      return result
    } catch (error) {
      console.error("AI generation error:", error)
      throw error
    }
  }

  async summarize(text: string, options?: any) {
    if (!this.provider) {
      throw new Error("AI provider not configured")
    }

    const result = await this.provider.summarize(text, options)
    await this.updateUsageStats(text.length + result.length)
    return result
  }

  async classifyText(text: string, labels: string[]) {
    if (!this.provider) {
      throw new Error("AI provider not configured")
    }

    const result = await this.provider.classifyText(text, labels)
    await this.updateUsageStats(text.length)
    return result
  }

  async generateEmbedding(text: string) {
    if (!this.provider) {
      throw new Error("AI provider not configured")
    }

    const result = await this.provider.generateEmbedding(text)
    await this.updateUsageStats(text.length)
    return result
  }

  private async updateUsageStats(estimatedTokens: number) {
    // Simple token estimation (actual calculation depends on model)
    const tokens = Math.ceil(estimatedTokens / 4)

    this.usageStats.tokensUsed += tokens
    this.usageStats.requestsCount += 1
    this.usageStats.costEstimate += this.calculateCost(tokens)

    await this.storage.set("ai_usage_stats", this.usageStats)
  }

  private calculateCost(tokens: number): number {
    // Cost calculation based on provider
    const costPerToken = {
      openai: 0.000002, // GPT-3.5
      anthropic: 0.000008, // Claude
      huggingface: 0,
      local: 0
    }

    return tokens * (costPerToken[this.config?.provider || 'local'] || 0)
  }

  async getUsageStats(): Promise<AIUsageStats> {
    return this.usageStats
  }

  async resetUsageStats() {
    this.usageStats = {
      tokensUsed: 0,
      requestsCount: 0,
      costEstimate: 0,
      lastReset: new Date()
    }
    await this.storage.set("ai_usage_stats", this.usageStats)
  }
}

// Singleton instance
export const aiService = new AIService()