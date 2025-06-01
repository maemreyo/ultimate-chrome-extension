// src/modules/ai/utilities/ai-helpers.ts
// Advanced AI utility functions

import type { AIProviderType, GenerateOptions } from "../types"

/**
 * Get optimal AI provider for a given task
 * @param task - Type of task (text, image, audio, code)
 * @param requirements - Task requirements
 * @returns Recommended provider
 */
export function getOptimalProvider(
  task: "text" | "image" | "audio" | "code" | "embedding",
  requirements?: {
    speed?: "fast" | "medium" | "slow"
    quality?: "low" | "medium" | "high"
    cost?: "low" | "medium" | "high"
  }
): AIProviderType {
  const {
    speed = "medium",
    quality = "medium",
    cost = "medium"
  } = requirements || {}

  // Provider recommendations based on task and requirements
  const recommendations = {
    text: {
      fast: { low: "openai", medium: "openai", high: "anthropic" },
      medium: { low: "openai", medium: "anthropic", high: "anthropic" },
      slow: { low: "openai", medium: "anthropic", high: "anthropic" }
    },
    image: {
      fast: { low: "stability", medium: "stability", high: "openai" },
      medium: { low: "stability", medium: "openai", high: "openai" },
      slow: { low: "stability", medium: "openai", high: "openai" }
    },
    audio: {
      fast: { low: "openai", medium: "openai", high: "elevenlabs" },
      medium: { low: "openai", medium: "elevenlabs", high: "elevenlabs" },
      slow: { low: "openai", medium: "elevenlabs", high: "elevenlabs" }
    },
    code: {
      fast: { low: "openai", medium: "openai", high: "anthropic" },
      medium: { low: "openai", medium: "anthropic", high: "anthropic" },
      slow: { low: "openai", medium: "anthropic", high: "anthropic" }
    },
    embedding: {
      fast: { low: "openai", medium: "openai", high: "openai" },
      medium: { low: "openai", medium: "openai", high: "openai" },
      slow: { low: "openai", medium: "openai", high: "openai" }
    }
  }

  return recommendations[task][speed][cost] as AIProviderType
}

/**
 * Estimate token count for text
 * @param text - Text to estimate
 * @param model - Model to estimate for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string, model?: string): number {
  // Rough estimation: 1 token ≈ 4 characters for most models
  const baseEstimate = Math.ceil(text.length / 4)

  // Adjust based on model
  const modelMultipliers: Record<string, number> = {
    "gpt-4": 1.0,
    "gpt-3.5-turbo": 1.0,
    "claude-3": 0.9,
    "claude-2": 0.9
  }

  const multiplier = model ? modelMultipliers[model] || 1.0 : 1.0
  return Math.ceil(baseEstimate * multiplier)
}

/**
 * Optimize generation options for better performance
 * @param options - Original options
 * @param task - Type of task
 * @returns Optimized options
 */
export function optimizeGenerateOptions(
  options: GenerateOptions,
  task: "chat" | "completion" | "creative" | "analytical"
): GenerateOptions {
  const optimized = { ...options }

  switch (task) {
    case "chat":
      optimized.temperature = optimized.temperature ?? 0.7
      optimized.maxTokens = optimized.maxTokens ?? 1000
      optimized.topP = optimized.topP ?? 0.9
      break

    case "completion":
      optimized.temperature = optimized.temperature ?? 0.3
      optimized.maxTokens = optimized.maxTokens ?? 500
      optimized.topP = optimized.topP ?? 0.8
      break

    case "creative":
      optimized.temperature = optimized.temperature ?? 0.9
      optimized.maxTokens = optimized.maxTokens ?? 2000
      optimized.topP = optimized.topP ?? 0.95
      break

    case "analytical":
      optimized.temperature = optimized.temperature ?? 0.1
      optimized.maxTokens = optimized.maxTokens ?? 1500
      optimized.topP = optimized.topP ?? 0.7
      break
  }

  return optimized
}

/**
 * Create a prompt template
 * @param template - Template string with placeholders
 * @param variables - Variables to replace in template
 * @returns Formatted prompt
 */
export function createPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let prompt = template

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    prompt = prompt.replace(new RegExp(placeholder, "g"), value)
  }

  return prompt
}

/**
 * Validate AI response
 * @param response - AI response to validate
 * @param expectedFormat - Expected format
 * @returns Validation result
 */
export function validateAIResponse(
  response: string,
  expectedFormat?: "json" | "markdown" | "html" | "plain"
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!response || response.trim().length === 0) {
    errors.push("Response is empty")
    return { isValid: false, errors }
  }

  if (expectedFormat) {
    switch (expectedFormat) {
      case "json":
        try {
          JSON.parse(response)
        } catch {
          errors.push("Response is not valid JSON")
        }
        break

      case "markdown":
        // Basic markdown validation
        if (
          !response.includes("#") &&
          !response.includes("*") &&
          !response.includes("-")
        ) {
          errors.push("Response doesn't appear to be markdown")
        }
        break

      case "html":
        // Basic HTML validation
        if (!response.includes("<") || !response.includes(">")) {
          errors.push("Response doesn't appear to be HTML")
        }
        break
    }
  }

  return { isValid: errors.length === 0, errors }
}
