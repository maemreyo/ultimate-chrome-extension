// API key validation utilities

import { AIProviderType } from "../types"

export async function validateAPIKey(
  provider: AIProviderType,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey) {
    return { valid: false, error: "API key is required" }
  }

  try {
    switch (provider) {
      case "openai":
        return validateOpenAIKey(apiKey)
      case "anthropic":
        return validateAnthropicKey(apiKey)
      case "google":
        return validateGoogleKey(apiKey)
      case "huggingface":
        return validateHuggingFaceKey(apiKey)
      default:
        return { valid: true }
    }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

async function validateOpenAIKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey.startsWith("sk-")) {
    return { valid: false, error: "OpenAI API keys should start with 'sk-'" }
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` }
    })

    if (response.status === 401) {
      return { valid: false, error: "Invalid API key" }
    }

    return { valid: response.ok }
  } catch (error) {
    return { valid: false, error: "Failed to validate API key" }
  }
}

async function validateAnthropicKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  // Anthropic API key validation
  if (apiKey.length < 40) {
    return { valid: false, error: "Invalid Anthropic API key format" }
  }

  // Could make a test API call here
  return { valid: true }
}

async function validateGoogleKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  // Google API key validation
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )

    if (response.status === 403 || response.status === 401) {
      return { valid: false, error: "Invalid API key" }
    }

    return { valid: response.ok }
  } catch (error) {
    return { valid: false, error: "Failed to validate API key" }
  }
}

async function validateHuggingFaceKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey.startsWith("hf_")) {
    return {
      valid: false,
      error: "HuggingFace API keys should start with 'hf_'"
    }
  }

  return { valid: true }
}
