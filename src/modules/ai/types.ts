export interface AIProvider {
  name: string
  generateText(prompt: string, options?: GenerateOptions): Promise<string>
  generateEmbedding(text: string): Promise<number[]>
  classifyText(text: string, labels: string[]): Promise<Classification>
  summarize(text: string, options?: SummarizeOptions): Promise<string>
}

export interface GenerateOptions {
  maxTokens?: number
  temperature?: number
  topP?: number
  stream?: boolean
  systemPrompt?: string
}

export interface Classification {
  label: string
  confidence: number
  scores: Record<string, number>
}

export interface SummarizeOptions {
  maxLength?: number
  style?: 'bullet' | 'paragraph' | 'tldr'
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'huggingface' | 'local'
  apiKey?: string
  model?: string
  baseUrl?: string
}

export interface AIUsageStats {
  tokensUsed: number
  requestsCount: number
  costEstimate: number
  lastReset: Date
}