import type { AIConfig, AIProvider, Classification, GenerateOptions, SummarizeOptions } from "../types"

export class OpenAIProvider implements AIProvider {
  name = "openai"
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey || ""
    this.model = config.model || "gpt-3.5-turbo"
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1"
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: options?.systemPrompt || "You are a helpful assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 1,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  }

  async classifyText(text: string, labels: string[]): Promise<Classification> {
    const prompt = `Classify the following text into one of these categories: ${labels.join(", ")}.

Text: "${text}"

Respond with only the category name.`

    const result = await this.generateText(prompt, {
      temperature: 0,
      maxTokens: 50
    })

    const label = result.trim()

    // For a more sophisticated approach, you'd want to get probabilities
    return {
      label,
      confidence: 0.85, // Placeholder
      scores: labels.reduce((acc, l) => ({
        ...acc,
        [l]: l === label ? 0.85 : 0.15 / (labels.length - 1)
      }), {})
    }
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    const stylePrompts = {
      bullet: "Summarize in bullet points:",
      paragraph: "Summarize in a concise paragraph:",
      tldr: "Provide a TL;DR summary in one sentence:"
    }

    const prompt = `${stylePrompts[options?.style || 'paragraph']}

${text}

Summary:`

    return this.generateText(prompt, {
      maxTokens: options?.maxLength || 200,
      temperature: 0.3
    })
  }
}
