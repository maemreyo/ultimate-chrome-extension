// src/modules/ai/utilities/config-helpers.ts
// Configuration helper functions

import type { AIConfig } from "../types"

/**
 * Configure AI service with provided config
 * @param config - AI configuration
 * @returns Configured AI service
 */
export async function configureAI(config: AIConfig) {
  const { enhancedAIService } = await import("../enhanced-service")
  return enhancedAIService.configure(config)
}

/**
 * Validate AI configuration
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateAIConfig(config: Partial<AIConfig>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.provider) {
    errors.push("Provider is required")
  }

  if (
    !config.apiKey &&
    config.provider !== "mock" &&
    config.provider !== "local"
  ) {
    errors.push("API key is required for external providers")
  }

  if (config.model && typeof config.model !== "string") {
    errors.push("Model must be a string")
  }

  if (
    config.maxTokens &&
    (typeof config.maxTokens !== "number" || config.maxTokens <= 0)
  ) {
    errors.push("Max tokens must be a positive number")
  }

  if (
    config.temperature &&
    (typeof config.temperature !== "number" ||
      config.temperature < 0 ||
      config.temperature > 2)
  ) {
    errors.push("Temperature must be a number between 0 and 2")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Merge AI configurations with defaults
 * @param config - User configuration
 * @param defaults - Default configuration
 * @returns Merged configuration
 */
export function mergeAIConfig(
  config: Partial<AIConfig>,
  defaults: AIConfig
): AIConfig {
  return {
    ...defaults,
    ...config,
    // Deep merge for nested objects
    cache: config.cache
      ? { ...defaults.cache, ...config.cache }
      : defaults.cache,
    rateLimit: config.rateLimit
      ? { ...defaults.rateLimit, ...config.rateLimit }
      : defaults.rateLimit
  }
}
