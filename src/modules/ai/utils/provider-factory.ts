// Factory for creating AI provider instances

import type { AIConfig, AIProvider, AIProviderType } from "../types"
import { OpenAIProvider } from "../providers/openai"
import { AnthropicProvider } from "../providers/anthropic"
import { GoogleAIProvider } from "../providers/google"
import { HuggingFaceProvider } from "../providers/huggingface"
import { LocalProvider } from "../providers/local"

export async function createAIProvider(
  type: AIProviderType,
  config: AIConfig
): Promise<AIProvider | null> {
  try {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config)
      case 'anthropic':
        return new AnthropicProvider(config)
      case 'google':
        return new GoogleAIProvider(config)
      case 'huggingface':
        return new HuggingFaceProvider(config)
      case 'local':
        return new LocalProvider(config)
      // Add more providers as needed
      default:
        console.warn(`Unknown provider type: ${type}`)
        return null
    }
  } catch (error) {
    console.error(`Failed to create ${type} provider:`, error)
    return null
  }
}