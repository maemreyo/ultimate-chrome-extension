import {
  AIPresets,
  createAI,
  type AIEngine,
  type GenerateOptions,
  type TokenUsage
} from "@matthew.ngo/ai-toolkit"
import { aiAnalysisCache, getSettingsStore } from "./storage"

let aiEngine: AIEngine | null = null

// Initialize AI with user settings
export const initializeAI = async () => {
  const settings = getSettingsStore()
  const aiSettings = settings.get("ai")

  if (!aiSettings?.apiKey) {
    console.warn("AI API key not configured")
    return null
  }

  // Create AI instance with production preset and user settings
  aiEngine = await createAI({
    ...AIPresets.production,
    provider: aiSettings.provider || "openai",
    apiKey: aiSettings.apiKey,
    model: aiSettings.model || "gpt-3.5-turbo",

    // Enhanced caching for Chrome extension
    cache: {
      enabled: true,
      ttl: 3600000, // 1 hour
      maxSize: 500,
      strategy: "lru"
    },

    // Rate limiting to prevent API abuse
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
      concurrent: 5,
      strategy: "sliding-window"
    },

    // Retry configuration
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoff: "exponential"
    },

    // Fallback providers for reliability
    fallbackProviders: ["anthropic", "google"],
    apiKeys: {
      anthropic: process.env.PLASMO_PUBLIC_ANTHROPIC_API_KEY,
      google: process.env.PLASMO_PUBLIC_GOOGLE_AI_API_KEY
    }
  })

  // Set up error handling
  aiEngine.on("error", (error) => {
    console.error("AI Error:", error)
    // You could send this to your error tracking service
  })

  // Track usage
  aiEngine.on("usage", async (usage: TokenUsage) => {
    await updateUsageStats(usage)
  })

  return aiEngine
}

// Update usage statistics
const updateUsageStats = async (usage: TokenUsage) => {
  const currentStats = (await getStorage().get("ai-usage-stats")) || {
    tokensUsed: 0,
    requestsCount: 0,
    costEstimate: 0,
    lastReset: new Date()
  }

  currentStats.tokensUsed += usage.totalTokens
  currentStats.requestsCount += 1
  currentStats.costEstimate += calculateCost(usage)

  await getStorage().set("ai-usage-stats", currentStats)
}

// Calculate cost based on token usage
const calculateCost = (usage: TokenUsage): number => {
  // Example pricing (adjust based on actual provider pricing)
  const costPer1kPromptTokens = 0.001
  const costPer1kCompletionTokens = 0.002

  return (
    (usage.promptTokens / 1000) * costPer1kPromptTokens +
    (usage.completionTokens / 1000) * costPer1kCompletionTokens
  )
}

// AI Service API
export const aiService = {
  // Generate text with caching
  async generateText(prompt: string, options?: GenerateOptions) {
    if (!aiEngine) {
      throw new Error(
        "AI not initialized. Please configure API key in settings."
      )
    }

    // Check cache first
    const cacheKey = `text:${prompt}:${JSON.stringify(options)}`
    const cached = await aiAnalysisCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Generate new response
    const response = await aiEngine.generateText(prompt, options)

    // Cache the response
    await aiAnalysisCache.set(cacheKey, response)

    return response
  },

  // Stream text generation
  async *generateStream(prompt: string, options?: GenerateOptions) {
    if (!aiEngine) {
      throw new Error("AI not initialized")
    }

    for await (const chunk of aiEngine.generateStream(prompt, options)) {
      yield chunk
    }
  },

  // Summarize content
  async summarize(text: string, options?: any) {
    if (!aiEngine) {
      throw new Error("AI not initialized")
    }

    const cacheKey = `summary:${text.substring(0, 100)}:${JSON.stringify(options)}`
    const cached = await aiAnalysisCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const summary = await aiEngine.summarize(text, options)
    await aiAnalysisCache.set(cacheKey, summary)

    return summary
  },

  // Extract key points
  async extractKeyPoints(text: string) {
    const prompt = `Extract the key points from the following text. Return as a JSON array of strings:

${text}

Key points:`

    const response = await this.generateText(prompt, {
      format: "json",
      temperature: 0.3
    })

    try {
      return JSON.parse(response)
    } catch {
      return response.split("\n").filter((line) => line.trim())
    }
  },

  // Analyze sentiment
  async analyzeSentiment(text: string) {
    if (!aiEngine) {
      throw new Error("AI not initialized")
    }

    return aiEngine.analyzeSentiment(text)
  },

  // Generate embeddings
  async generateEmbedding(text: string) {
    if (!aiEngine) {
      throw new Error("AI not initialized")
    }

    const cacheKey = `embedding:${text}`
    const cached = await aiAnalysisCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const embedding = await aiEngine.generateEmbedding(text)
    await aiAnalysisCache.set(cacheKey, embedding, 86400000) // Cache for 24 hours

    return embedding
  },

  // Find similar content
  async findSimilar(query: string, items: any[], topK = 5) {
    if (!aiEngine) {
      throw new Error("AI not initialized")
    }

    return aiEngine.findSimilar(query, items, topK)
  },

  // Classify text
  async classifyText(text: string, labels: string[]) {
    if (!aiEngine) {
      throw new Error("AI not initialized")
    }

    return aiEngine.classifyText(text, labels)
  },

  // Generate code
  async generateCode(prompt: string, options?: any) {
    if (!aiEngine) {
      throw new Error("AI not initialized")
    }

    return aiEngine.generateCode(prompt, options)
  },

  // Custom analysis for specific extension features
  async analyzeWebPage(content: any) {
    const prompt = `Analyze the following web page content and provide insights:

Title: ${content.title}
URL: ${content.url}
Main Content: ${content.text?.substring(0, 2000)}...

Provide:
1. A brief summary (2-3 sentences)
2. Key topics covered
3. Target audience
4. Content quality assessment
5. SEO observations

Format as JSON.`

    const response = await this.generateText(prompt, {
      format: "json",
      temperature: 0.5,
      maxTokens: 500
    })

    try {
      return JSON.parse(response)
    } catch {
      return { error: "Failed to parse AI response", raw: response }
    }
  },

  // Get usage statistics
  async getUsageStats() {
    if (!aiEngine) {
      return null
    }

    const stats = await aiEngine.getStats()
    const storedStats = await getStorage().get("ai-usage-stats")

    return {
      ...stats,
      ...storedStats
    }
  },

  // Reset usage stats (monthly reset)
  async resetUsageStats() {
    await getStorage().set("ai-usage-stats", {
      tokensUsed: 0,
      requestsCount: 0,
      costEstimate: 0,
      lastReset: new Date()
    })
  },

  // Check if AI is available
  isAvailable() {
    return aiEngine !== null
  },

  // Get current provider
  getCurrentProvider() {
    return aiEngine?.config.provider
  },

  // Switch provider (requires re-initialization)
  async switchProvider(
    provider: "openai" | "anthropic" | "google",
    apiKey: string
  ) {
    const settings = getSettingsStore()
    await settings.update({
      ai: {
        provider,
        apiKey,
        model: getDefaultModel(provider)
      }
    })

    // Re-initialize with new settings
    return initializeAI()
  }
}

// Get default model for each provider
const getDefaultModel = (provider: string): string => {
  switch (provider) {
    case "openai":
      return "gpt-3.5-turbo"
    case "anthropic":
      return "claude-3-haiku-20240307"
    case "google":
      return "gemini-pro"
    default:
      return ""
  }
}

// Export AI engine getter
export const getAIEngine = () => aiEngine
