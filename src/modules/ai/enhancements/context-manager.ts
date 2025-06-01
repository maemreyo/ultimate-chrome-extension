import { ChatMessage } from "../types"
import { TokenManager } from "./token-manager"

interface ContextWindow {
  messages: ChatMessage[]
  totalTokens: number
  importance: Map<string, number>
}

interface CompressionStrategy {
  name: string
  compress: (messages: ChatMessage[]) => Promise<ChatMessage[]>
}

export class ContextWindowManager {
  private windows = new Map<string, ContextWindow>()
  private tokenManager = new TokenManager()

  private compressionStrategies: CompressionStrategy[] = [
    {
      name: "summarize-old",
      compress: async (messages) => {
        // Keep last N messages intact, summarize older ones
        const recentCount = 5
        if (messages.length <= recentCount) return messages

        const recent = messages.slice(-recentCount)
        const old = messages.slice(0, -recentCount)

        // Group old messages by conversation turns
        const summary = await this.summarizeMessages(old)

        return [summary, ...recent]
      }
    },
    {
      name: "importance-based",
      compress: async (messages) => {
        // Score messages by importance and keep high-scoring ones
        const scored = messages.map((msg) => ({
          message: msg,
          score: this.calculateImportance(msg)
        }))

        scored.sort((a, b) => b.score - a.score)

        // Keep top 70% by importance
        const keepCount = Math.ceil(messages.length * 0.7)
        return scored.slice(0, keepCount).map((s) => s.message)
      }
    }
  ]

  async manageContext(
    conversationId: string,
    messages: ChatMessage[],
    maxTokens: number,
    model: string
  ): Promise<ChatMessage[]> {
    // Calculate current token usage
    const currentTokens = this.calculateTotalTokens(messages, model)

    if (currentTokens <= maxTokens) {
      return messages
    }

    // Apply compression strategies
    let compressed = messages
    for (const strategy of this.compressionStrategies) {
      compressed = await strategy.compress(compressed)
      const newTokens = this.calculateTotalTokens(compressed, model)

      if (newTokens <= maxTokens) {
        break
      }
    }

    // If still over limit, apply sliding window
    return this.applySlidingWindow(compressed, maxTokens, model)
  }

  private calculateTotalTokens(messages: ChatMessage[], model: string): number {
    return messages.reduce((total, msg) => {
      return total + this.tokenManager.getTokenCount(msg.content, model)
    }, 0)
  }

  private calculateImportance(message: ChatMessage): number {
    let score = 0

    // Role-based scoring
    if (message.role === "system") score += 100
    if (message.role === "assistant" && message.content.includes("```"))
      score += 20 // Code blocks

    // Content-based scoring
    if (message.content.includes("important")) score += 10
    if (message.content.includes("remember")) score += 10
    if (message.content.includes("?")) score += 5 // Questions

    // Length penalty (prefer concise messages)
    score -= message.content.length / 1000

    // Recency bonus
    const age = Date.now() - message.timestamp.getTime()
    score += Math.max(0, 10 - age / (1000 * 60 * 60)) // Decay over hours

    return score
  }

  private async summarizeMessages(
    messages: ChatMessage[]
  ): Promise<ChatMessage> {
    const content = messages.map((m) => `${m.role}: ${m.content}`).join("\n")

    // In real implementation, this would call the AI service
    const summary = `Previous conversation summary (${messages.length} messages):\n${content.substring(0, 200)}...`

    return {
      id: crypto.randomUUID(),
      role: "system",
      content: summary,
      timestamp: new Date(),
      metadata: { compressed: true, originalCount: messages.length }
    }
  }

  private applySlidingWindow(
    messages: ChatMessage[],
    maxTokens: number,
    model: string
  ): ChatMessage[] {
    const result: ChatMessage[] = []
    let totalTokens = 0

    // Always keep system messages
    const systemMessages = messages.filter((m) => m.role === "system")
    for (const msg of systemMessages) {
      totalTokens += this.tokenManager.getTokenCount(msg.content, model)
      result.push(msg)
    }

    // Add recent messages until token limit
    const nonSystemMessages = messages.filter((m) => m.role !== "system")
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const msg = nonSystemMessages[i]
      const msgTokens = this.tokenManager.getTokenCount(msg.content, model)

      if (totalTokens + msgTokens > maxTokens) break

      totalTokens += msgTokens
      result.unshift(msg)
    }

    return result
  }

  getContextStats(conversationId: string) {
    const window = this.windows.get(conversationId)
    if (!window) return null

    return {
      messageCount: window.messages.length,
      totalTokens: window.totalTokens,
      avgImportance:
        Array.from(window.importance.values()).reduce((a, b) => a + b, 0) /
        window.importance.size
    }
  }
}
