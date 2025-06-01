// import { encode, decode } from '@dqbd/tiktoken'

interface TokenInfo {
  count: number
  truncated: boolean
  originalLength?: number
}

export class TokenManager {
  private encoders = new Map<string, any>()
  private tokenLimits: Record<string, number> = {
    "gpt-4": 8192,
    "gpt-4-32k": 32768,
    "gpt-4-turbo": 128000,
    "gpt-3.5-turbo": 4096,
    "gpt-3.5-turbo-16k": 16384,
    "claude-3-opus": 200000,
    "claude-3-sonnet": 200000,
    "gemini-pro": 30720
  }

  getTokenCount(text: string, model: string): number {
    try {
      const encoder = this.getEncoder(model)
      return encoder.encode(text).length
    } catch {
      // Fallback to approximate counting
      return Math.ceil(text.length / 4)
    }
  }

  getTokenInfo(text: string, model: string, maxTokens?: number): TokenInfo {
    const count = this.getTokenCount(text, model)
    const limit = maxTokens || this.tokenLimits[model] || 4096

    return {
      count,
      truncated: count > limit,
      originalLength: text.length
    }
  }

  truncateToTokenLimit(text: string, model: string, maxTokens: number): string {
    try {
      const encoder = this.getEncoder(model)
      const tokens = encoder.encode(text)

      if (tokens.length <= maxTokens) return text

      const truncated = tokens.slice(0, maxTokens)
      return encoder.decode(truncated)
    } catch {
      // Fallback to character-based truncation
      const avgCharsPerToken = 4
      const maxChars = maxTokens * avgCharsPerToken
      return text.length > maxChars ? text.substring(0, maxChars) + "..." : text
    }
  }

  splitIntoChunks(text: string, model: string, chunkSize: number): string[] {
    try {
      const encoder = this.getEncoder(model)
      const tokens = encoder.encode(text)
      const chunks: string[] = []

      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunkTokens = tokens.slice(i, i + chunkSize)
        chunks.push(encoder.decode(chunkTokens))
      }

      return chunks
    } catch {
      // Fallback implementation
      const avgCharsPerToken = 4
      const chunkChars = chunkSize * avgCharsPerToken
      const chunks: string[] = []

      for (let i = 0; i < text.length; i += chunkChars) {
        chunks.push(text.substring(i, i + chunkChars))
      }

      return chunks
    }
  }

  private getEncoder(model: string) {
    const encoderName = this.getEncoderName(model)

    if (!this.encoders.has(encoderName)) {
      // This would need actual tiktoken implementation
      // For now, using a mock
      this.encoders.set(encoderName, {
        encode: (text: string) => text.split(/\s+/),
        decode: (tokens: string[]) => tokens.join(" ")
      })
    }

    return this.encoders.get(encoderName)
  }

  private getEncoderName(model: string): string {
    if (model.includes("gpt-4") || model.includes("gpt-3.5"))
      return "cl100k_base"
    if (model.includes("claude")) return "claude"
    if (model.includes("gemini")) return "gemini"
    return "gpt2"
  }

  estimateCost(
    tokens: number,
    model: string,
    type: "input" | "output" = "input"
  ): number {
    const pricing: Record<string, { input: number; output: number }> = {
      "gpt-4": { input: 0.03, output: 0.06 },
      "gpt-4-turbo": { input: 0.01, output: 0.03 },
      "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
      "claude-3-opus": { input: 0.015, output: 0.075 },
      "claude-3-sonnet": { input: 0.003, output: 0.015 }
    }

    const modelPricing = pricing[model] || { input: 0, output: 0 }
    return (tokens / 1000) * modelPricing[type]
  }
}
