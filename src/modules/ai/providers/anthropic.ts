import type { AIConfig, AIProvider, Classification, GenerateOptions, SummarizeOptions } from "../types"

export class AnthropicProvider implements AIProvider {
  name = "anthropic"
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey || ""
    this.model = config.model || "claude-3-sonnet-20240229"
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1"
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
        system: options?.systemPrompt || "You are a helpful assistant.",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Anthropic doesn't provide embeddings directly
    // You would need to use a different service or model
    throw new Error("Embeddings not supported by Anthropic provider")
  }

  async classifyText(text: string, labels: string[]): Promise<Classification> {
    const prompt = `Classify this text into exactly one category from: ${labels.join(", ")}.

Text: "${text}"

Category:`

    const result = await this.generateText(prompt, {
      temperature: 0,
      maxTokens: 50
    })

    const label = result.trim()

    return {
      label,
      confidence: 0.9,
      scores: labels.reduce((acc, l) => ({
        ...acc,
        [l]: l === label ? 0.9 : 0.1 / (labels.length - 1)
      }), {})
    }
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    const instructions = {
      bullet: "Create a bullet-point summary with key points",
      paragraph: "Write a concise paragraph summary",
      tldr: "Write a one-sentence TL;DR"
    }

    const prompt = `${instructions[options?.style || 'paragraph']} of the following text:

${text}`

    return this.generateText(prompt, {
      maxTokens: options?.maxLength || 200,
      temperature: 0.3
    })
  }
}
