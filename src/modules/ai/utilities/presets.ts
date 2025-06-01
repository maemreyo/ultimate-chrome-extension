// src/modules/ai/utilities/presets.ts
// AI configuration presets

import type { AIProviderType } from "../types"

/**
 * Pre-configured AI setups for common scenarios
 */
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
  },

  // Production setup
  production: {
    provider: "openai" as const,
    model: "gpt-4",
    cache: { enabled: true, ttl: 7200, maxSize: 500, strategy: "lru" as const },
    rateLimit: { requestsPerMinute: 60, strategy: "token-bucket" as const },
    fallbackProviders: ["anthropic"] as AIProviderType[]
  },

  // Local development setup
  local: {
    provider: "local" as const,
    model: "llama2",
    cache: { enabled: true, ttl: 1800, maxSize: 50, strategy: "lru" as const }
  },

  // High-volume setup
  highVolume: {
    provider: "openai" as const,
    model: "gpt-3.5-turbo",
    cache: {
      enabled: true,
      ttl: 1800,
      maxSize: 1000,
      strategy: "lru" as const
    },
    rateLimit: { requestsPerMinute: 100, strategy: "sliding-window" as const },
    fallbackProviders: ["anthropic", "google"] as AIProviderType[]
  }
} as const
