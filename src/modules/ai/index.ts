import { enhancedAIService } from "./enhanced-service"
import { AIConfig, AIProviderType } from "./types"

// Core exports
export { AIProvider, useAIContext } from "./ai-provider"
export { AIService, aiService } from "./ai-service"

// Enhanced service export
export { EnhancedAIService, enhancedAIService } from "./enhanced-service"

// Component exports
export * from "./components"
export { AIDebugPanel } from "./components/AIDebugPanel"

// Hook exports - Standard
export * from "./hooks"

// Hook exports - Enhanced
export { useAIContext as useAIContextManager } from "./hooks/useAIContext"
export { useAICost } from "./hooks/useAICost"
export { useAIPerformance } from "./hooks/useAIPerformance"
export { useEnhancedAI } from "./hooks/useEnhancedAI"

// Provider exports
export * from "./providers"

// Type exports
export * from "./types"

// Utility exports
export * from "./utils"

// Enhancement exports
export * from "./enhancements"

// Example exports (for development/testing)
export * from "./examples"

// Advanced feature exports
export { AIAnalytics } from "./analytics"
export { AICache } from "./cache"
export { AIEncryption } from "./encryption"
export { AIRateLimiter } from "./rate-limiter"

// Testing utilities
export { AITestingUtils } from "./utils/testing"

// Helper function exports
export { estimateCost } from "./utils/cost-calculator"
export { createAIProvider } from "./utils/provider-factory"
export { validateAPIKey } from "./utils/validation"

// Configuration helper
export function configureAI(config: AIConfig) {
  return enhancedAIService.configure(config)
}

// Quick setup for common scenarios
export const AIPresets = {
  // Cost-optimized setup
  costOptimized: {
    provider: "openai" as const,
    model: "gpt-3.5-turbo",
    cache: { enabled: true, ttl: 3600, maxSize: 100, strategy: "lru" as const },
    rateLimit: { requestsPerMinute: 30, strategy: "sliding-window" as const }
  },

  // Performance-optimized setup
  performanceOptimized: {
    provider: "anthropic" as const,
    model: "claude-3-haiku-20240307",
    cache: { enabled: true, ttl: 1800, maxSize: 200, strategy: "lru" as const },
    fallbackProviders: ["openai", "google"] as AIProviderType[]
  },

  // Quality-optimized setup
  qualityOptimized: {
    provider: "anthropic" as const,
    model: "claude-3-opus-20240229",
    fallbackProviders: ["openai"] as AIProviderType[],
    rateLimit: { requestsPerMinute: 20, strategy: "token-bucket" as const }
  },

  // Development setup
  development: {
    provider: "mock" as const,
    cache: { enabled: false, ttl: 0, maxSize: 0, strategy: "fifo" as const }
  }
}
