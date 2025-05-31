// Cost estimation utilities

interface ModelPricing {
  inputTokens: number  // Cost per 1K tokens
  outputTokens: number // Cost per 1K tokens
  image?: number      // Cost per image
  audio?: number      // Cost per minute
}

const PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4-turbo-preview': { inputTokens: 0.01, outputTokens: 0.03 },
  'gpt-4': { inputTokens: 0.03, outputTokens: 0.06 },
  'gpt-3.5-turbo': { inputTokens: 0.0005, outputTokens: 0.0015 },
  'dall-e-3': { inputTokens: 0, outputTokens: 0, image: 0.04 },
  'whisper-1': { inputTokens: 0, outputTokens: 0, audio: 0.006 },

  // Anthropic
  'claude-3-opus-20240229': { inputTokens: 0.015, outputTokens: 0.075 },
  'claude-3-sonnet-20240229': { inputTokens: 0.003, outputTokens: 0.015 },
  'claude-3-haiku-20240307': { inputTokens: 0.00025, outputTokens: 0.00125 },

  // Google
  'gemini-pro': { inputTokens: 0.0005, outputTokens: 0.0015 },
  'gemini-pro-vision': { inputTokens: 0.0005, outputTokens: 0.0015 },

  // Cohere
  'command': { inputTokens: 0.0004, outputTokens: 0.0004 },
  'command-light': { inputTokens: 0.0001, outputTokens: 0.0001 },
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  additionalCosts?: {
    images?: number
    audioMinutes?: number
  }
): number {
  const pricing = PRICING[model]
  if (!pricing) {
    return 0
  }

  let cost = 0

  // Token costs
  cost += (inputTokens / 1000) * pricing.inputTokens
  cost += (outputTokens / 1000) * pricing.outputTokens

  // Additional costs
  if (additionalCosts?.images && pricing.image) {
    cost += additionalCosts.images * pricing.image
  }

  if (additionalCosts?.audioMinutes && pricing.audio) {
    cost += additionalCosts.audioMinutes * pricing.audio
  }

  return cost
}

export function getModelPricing(model: string): ModelPricing | null {
  return PRICING[model] || null
}

export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}