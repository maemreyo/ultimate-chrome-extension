// Enhanced with more providers and capabilities

// Base provider types
export type AIProviderType =
  | "openai"
  | "anthropic"
  | "google"
  | "cohere"
  | "huggingface"
  | "replicate"
  | "stability"
  | "elevenlabs"
  | "whisper"
  | "custom"
  | "local"

export interface AIProvider {
  name: string

  // Text capabilities
  generateText?(prompt: string, options?: GenerateOptions): Promise<string>
  generateStream?(
    prompt: string,
    options?: GenerateOptions
  ): AsyncGenerator<string>
  generateEmbedding?(text: string): Promise<number[]>
  classifyText?(text: string, labels: string[]): Promise<Classification>
  summarize?(text: string, options?: SummarizeOptions): Promise<string>
  analyzeSentiment?(text: string): Promise<SentimentAnalysis>

  // Image capabilities
  generateImage?(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageResult>
  analyzeImage?(
    image: string | Blob,
    options?: ImageAnalysisOptions
  ): Promise<ImageAnalysis>

  // Audio capabilities
  transcribeAudio?(
    audio: Blob,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult>
  generateSpeech?(text: string, options?: SpeechOptions): Promise<Blob>

  // Code capabilities
  generateCode?(
    prompt: string,
    options?: CodeGenerationOptions
  ): Promise<CodeResult>
  explainCode?(code: string, language?: string): Promise<string>
}

// Configuration types
export interface AIConfig {
  provider: AIProviderType
  apiKey?: string
  apiKeys?: Record<string, string> // Support multiple API keys
  model?: string
  models?: Record<string, string> // Model per capability
  baseUrl?: string
  headers?: Record<string, string>

  // Advanced configuration
  maxRetries?: number
  timeout?: number
  cache?: CacheConfig
  rateLimit?: RateLimitConfig
  encryption?: EncryptionConfig
  fallbackProviders?: AIProviderType[]
}

export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in seconds
  maxSize: number // Max cache size in MB
  strategy: "lru" | "fifo" | "lfu"
}

export interface RateLimitConfig {
  requestsPerMinute?: number
  tokensPerMinute?: number
  requestsPerHour?: number
  tokensPerHour?: number
  strategy: "fixed-window" | "sliding-window" | "token-bucket"
}

export interface EncryptionConfig {
  enabled: boolean
  algorithm: "aes-256-gcm" | "aes-256-cbc"
  keyDerivation: "pbkdf2" | "argon2"
}

// Text generation options
export interface GenerateOptions {
  maxTokens?: number
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  systemPrompt?: string
  stream?: boolean
  format?: "text" | "json" | "markdown"

  // Advanced options
  seed?: number
  logitBias?: Record<string, number>
  functions?: FunctionDefinition[]
  responseFormat?: ResponseFormat
}

export interface FunctionDefinition {
  name: string
  description: string
  parameters: Record<string, any>
}

export interface ResponseFormat {
  type: "text" | "json_object"
  schema?: Record<string, any>
}

// Classification and analysis
export interface Classification {
  label: string
  confidence: number
  scores: Record<string, number>
}

export interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral" | "mixed"
  score: number
  aspects?: AspectSentiment[]
}

export interface AspectSentiment {
  aspect: string
  sentiment: string
  score: number
}

export interface SummarizeOptions {
  maxLength?: number
  minLength?: number
  style?: "bullet" | "paragraph" | "tldr" | "key-points" | "executive"
  language?: string
  extractive?: boolean
}

// Image generation
export interface ImageGenerationOptions {
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792"
  style?: "realistic" | "artistic" | "cartoon" | "photographic"
  quality?: "standard" | "hd"
  n?: number
  negativePrompt?: string
  seed?: number
  steps?: number
  guidanceScale?: number
}

export interface ImageResult {
  url?: string
  base64?: string
  revisedPrompt?: string
  metadata?: Record<string, any>
}

export interface ImageAnalysisOptions {
  features?: (
    | "objects"
    | "faces"
    | "text"
    | "colors"
    | "tags"
    | "description"
  )[]
  language?: string
}

export interface ImageAnalysis {
  description?: string
  objects?: DetectedObject[]
  faces?: DetectedFace[]
  text?: ExtractedText[]
  colors?: ColorInfo[]
  tags?: string[]
}

export interface DetectedObject {
  label: string
  confidence: number
  boundingBox?: BoundingBox
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// Audio types
export interface TranscriptionOptions {
  language?: string
  translateTo?: string
  format?: "text" | "srt" | "vtt" | "json"
  timestamps?: boolean
  speakerDiarization?: boolean
}

export interface TranscriptionResult {
  text: string
  language?: string
  duration?: number
  words?: WordTimestamp[]
  speakers?: SpeakerSegment[]
}

export interface WordTimestamp {
  word: string
  start: number
  end: number
  confidence?: number
}

export interface SpeakerSegment {
  speaker: string
  start: number
  end: number
  text: string
}

export interface SpeechOptions {
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
  format?: "mp3" | "wav" | "ogg"
  language?: string
  emotion?: string
}

// Code generation
export interface CodeGenerationOptions {
  language?: string
  framework?: string
  style?: "concise" | "verbose" | "documented"
  includeTests?: boolean
  includeComments?: boolean
}

export interface CodeResult {
  code: string
  language: string
  explanation?: string
  tests?: string
  dependencies?: string[]
}

// Usage and analytics
export interface AIUsageStats {
  tokensUsed: number
  requestsCount: number
  costEstimate: number
  lastReset: Date

  // Detailed stats
  byProvider?: Record<string, ProviderStats>
  byModel?: Record<string, ModelStats>
  byCapability?: Record<string, number>
  errors?: ErrorStats[]
}

export interface ProviderStats {
  requests: number
  tokens: number
  cost: number
  averageLatency: number
  errorRate: number
}

export interface ModelStats {
  requests: number
  tokens: number
  inputTokens: number
  outputTokens: number
  cost: number
}

export interface ErrorStats {
  timestamp: Date
  provider: string
  error: string
  count: number
}

// Hook options
export interface UseAIOptions {
  providers?: AIProviderType[]
  fallbackBehavior?: "automatic" | "manual" | "none"
  cacheEnabled?: boolean
  retryEnabled?: boolean
}

// Chat types
export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system" | "function"
  content: string
  timestamp: Date

  // Optional fields
  name?: string
  functionCall?: FunctionCall
  metadata?: Record<string, any>
}

export interface FunctionCall {
  name: string
  arguments: string
}

export interface ChatOptions {
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  memorySize?: number
  persistChat?: boolean
}
