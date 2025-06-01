import type {
  AIProvider,
  Classification,
  GenerateOptions,
  SummarizeOptions
} from "../types"

export class MockAIProvider implements AIProvider {
  name = "mock"
  private delay = 100
  private shouldFail = false
  private responses: Map<string, string> = new Map()

  configure(options: {
    delay?: number
    shouldFail?: boolean
    responses?: Record<string, string>
  }) {
    this.delay = options.delay || 100
    this.shouldFail = options.shouldFail || false
    if (options.responses) {
      Object.entries(options.responses).forEach(([key, value]) => {
        this.responses.set(key, value)
      })
    }
  }

  async generateText(
    prompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    await this.simulateDelay()

    if (this.shouldFail) {
      throw new Error("Mock provider error")
    }

    // Check for predefined response
    const predefinedResponse = this.responses.get(prompt)
    if (predefinedResponse) {
      return predefinedResponse
    }

    // Generate mock response
    return `Mock response to: "${prompt.substring(0, 50)}..." with options: ${JSON.stringify(options)}`
  }

  async *generateStream(
    prompt: string,
    options?: GenerateOptions
  ): AsyncGenerator<string> {
    const response = await this.generateText(prompt, options)
    const words = response.split(" ")

    for (const word of words) {
      await this.simulateDelay(50)
      yield word + " "
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    await this.simulateDelay()

    // Generate deterministic mock embedding
    const hash = text
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return Array(1536)
      .fill(0)
      .map((_, i) => Math.sin(hash + i) * 0.1)
  }

  async classifyText(text: string, labels: string[]): Promise<Classification> {
    await this.simulateDelay()

    // Mock classification based on text length
    const index = text.length % labels.length
    const scores = labels.reduce(
      (acc, label, i) => {
        acc[label] = i === index ? 0.8 : 0.2 / (labels.length - 1)
        return acc
      },
      {} as Record<string, number>
    )

    return {
      label: labels[index],
      confidence: 0.8,
      scores
    }
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    await this.simulateDelay()

    const style = options?.style || "paragraph"
    const words = text.split(" ")

    switch (style) {
      case "bullet":
        return `• Point 1 about ${words[0]}\n• Point 2 about ${words[Math.floor(words.length / 2)]}\n• Point 3 about ${words[words.length - 1]}`
      case "tldr":
        return `TL;DR: ${words.slice(0, 10).join(" ")}...`
      default:
        return `Summary: ${words.slice(0, 20).join(" ")}...`
    }
  }

  private simulateDelay(customDelay?: number): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, customDelay || this.delay)
    )
  }
}
