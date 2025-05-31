export interface AnalysisType {
  id: string
  name: string
  description: string
  icon?: string
  category: 'content' | 'sentiment' | 'seo' | 'readability' | 'fact-check' | 'bias' | 'custom'
  requiredInputs: AnalysisInput[]
  outputFormat: AnalysisOutput
  estimatedTime?: number // in seconds
  aiRequired: boolean
}

export interface AnalysisInput {
  name: string
  type: 'text' | 'url' | 'html' | 'image' | 'document'
  required: boolean
  maxLength?: number
  description?: string
}

export interface AnalysisOutput {
  type: 'structured' | 'markdown' | 'html' | 'json'
  schema?: Record<string, any>
  sections?: string[]
}

export interface AnalysisRequest {
  type: string
  inputs: Record<string, any>
  options?: AnalysisOptions
}

export interface AnalysisOptions {
  language?: string
  depth?: 'quick' | 'standard' | 'detailed'
  includeRecommendations?: boolean
  includeSources?: boolean
  customPrompt?: string
}

export interface AnalysisResult {
  id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  inputs: Record<string, any>
  output?: any
  metadata: {
    startedAt: Date
    completedAt?: Date
    duration?: number
    tokensUsed?: number
    model?: string
    error?: string
  }
  sections?: AnalysisSection[]
  recommendations?: Recommendation[]
  sources?: Source[]
}

export interface AnalysisSection {
  id: string
  title: string
  content: string | any
  type: 'text' | 'chart' | 'table' | 'list' | 'metric'
  order: number
  highlight?: boolean
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: string
  actionable: boolean
  impact?: string
}

export interface Source {
  title: string
  url?: string
  author?: string
  date?: Date
  relevance: number
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  variables: PromptVariable[]
  category: string
  examples?: Example[]
}

export interface PromptVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  default?: any
  description?: string
  validation?: (value: any) => boolean
}

export interface Example {
  inputs: Record<string, any>
  output: string
}