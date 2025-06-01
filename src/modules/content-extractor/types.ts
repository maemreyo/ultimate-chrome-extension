export interface ExtractedContent {
  title: string
  paragraphs: Paragraph[]
  cleanText: string
  metadata: ContentMetadata
  sections: Section[]
  readingTime: number
  wordCount: number
  language: string
  // Additional content types
  tables?: Table[]
  lists?: List[]
  embeds?: Embed[]
  structuredData?: StructuredData[]
  quality: ContentQuality
  fingerprint: string
}

export interface Paragraph {
  id: string
  text: string
  html: string
  index: number
  element: string // CSS selector
  bounds: DOMRect
  section?: string
  isQuote: boolean
  isCode: boolean
  isHeading: boolean
  headingLevel?: number
  importance: number // 0-1 score
  // Enhanced paragraph metadata
  sentiment?: number // -1 to 1
  keywords?: string[]
  entities?: Entity[]
  language?: string
  readability?: ReadabilityScore
}

// Table extraction support
export interface Table {
  id: string
  headers: string[]
  rows: string[][]
  caption?: string
  element: string
  index: number
}

// List extraction support
export interface List {
  id: string
  type: "ordered" | "unordered" | "definition"
  items: ListItem[]
  element: string
  index: number
}

export interface ListItem {
  text: string
  html: string
  subItems?: ListItem[]
  depth: number
}

// Embedded content support
export interface Embed {
  id: string
  type:
    | "video"
    | "audio"
    | "iframe"
    | "tweet"
    | "instagram"
    | "codepen"
    | "other"
  url: string
  title?: string
  provider?: string
  thumbnailUrl?: string
  element: string
  index: number
}

// Structured data support
export interface StructuredData {
  type: "json-ld" | "microdata" | "rdfa" | "opengraph"
  data: any
  context?: string
}

// Content quality metrics
export interface ContentQuality {
  score: number // 0-1
  textDensity: number
  linkDensity: number
  adDensity: number
  readabilityScore: number
  structureScore: number
  completeness: number
}

// Readability metrics
export interface ReadabilityScore {
  fleschKincaid: number
  gunningFog: number
  avgSentenceLength: number
  avgWordLength: number
  complexWords: number
}

// Entity extraction
export interface Entity {
  text: string
  type: "person" | "organization" | "location" | "date" | "money" | "other"
  confidence: number
  metadata?: Record<string, any>
}

export interface Section {
  id: string
  title: string
  paragraphs: Paragraph[]
  level: number
  startIndex: number
  endIndex: number
  // Section metadata
  summary?: string
  keywords?: string[]
  subSections?: Section[]
}

export interface ContentMetadata {
  author?: string
  authors?: string[] // Multiple authors support
  publishDate?: Date
  updateDate?: Date
  category?: string
  categories?: string[] // Multiple categories
  tags: string[]
  description?: string
  imageUrl?: string
  images?: ImageMetadata[] // Multiple images
  source: string
  extractedAt: Date
  // Enhanced metadata
  publisher?: string
  copyright?: string
  license?: string
  wordCount?: number
  estimatedReadTime?: number
  socialMetadata?: SocialMetadata
}

// Image metadata
export interface ImageMetadata {
  url: string
  alt?: string
  caption?: string
  width?: number
  height?: number
  type?: string
}

// Social media metadata
export interface SocialMetadata {
  twitter?: {
    card?: string
    site?: string
    creator?: string
  }
  openGraph?: {
    type?: string
    locale?: string
    siteName?: string
  }
}

export interface SiteAdapter {
  name: string
  patterns: RegExp[]
  priority?: number // Adapter priority
  extract(doc: Document, url: string): Partial<ExtractedContent>
  cleanContent?(content: string): string
  detectParagraphs?(doc: Document): Paragraph[]
  // Additional adapter methods
  detectTables?(doc: Document): Table[]
  detectLists?(doc: Document): List[]
  detectEmbeds?(doc: Document): Embed[]
  extractStructuredData?(doc: Document): StructuredData[]
  validateContent?(content: ExtractedContent): boolean
}

export interface CleaningOptions {
  removeAds: boolean
  removeNavigation: boolean
  removeComments: boolean
  removeRelated: boolean
  removeFooters: boolean
  removeSidebars: boolean
  preserveImages: boolean
  preserveVideos: boolean
  preserveIframes: boolean
  // Enhanced cleaning options
  removePopups: boolean
  removeCookieBanners: boolean
  removeNewsletterSignups: boolean
  preserveTables: boolean
  preserveLists: boolean
  preserveEmbeds: boolean
  aggressiveMode: boolean
  customSelectors?: {
    remove?: string[]
    preserve?: string[]
  }
}

export interface ExtractionOptions {
  adapter?: string
  cleaningOptions?: Partial<CleaningOptions>
  minParagraphLength?: number
  includeMetadata?: boolean
  detectSections?: boolean
  scoreParagraphs?: boolean
  // Enhanced extraction options
  extractTables?: boolean
  extractLists?: boolean
  extractEmbeds?: boolean
  extractStructuredData?: boolean
  extractEntities?: boolean
  calculateReadability?: boolean
  generateSummary?: boolean
  maxDepth?: number
  timeout?: number
  lazy?: boolean // For lazy-loaded content
  waitForSelectors?: string[]
  customExtractors?: CustomExtractor[]
}

// Custom extractor interface
export interface CustomExtractor {
  name: string
  selector: string
  extract: (element: Element) => any
  transform?: (data: any) => any
}

// Extraction events
export interface ExtractionEvents {
  onStart?: () => void
  onProgress?: (progress: ExtractionProgress) => void
  onComplete?: (content: ExtractedContent) => void
  onError?: (error: Error) => void
}

export interface ExtractionProgress {
  phase: "fetching" | "parsing" | "cleaning" | "extracting" | "analyzing"
  progress: number // 0-100
  message?: string
}

// Cache options
export interface CacheOptions {
  enabled: boolean
  ttl: number // Time to live in ms
  maxSize: number // Max cache size in MB
  strategy: "lru" | "lfu" | "fifo"
  persistent: boolean
}

// Plugin interface
export interface ContentExtractorPlugin {
  name: string
  version: string
  init?: () => Promise<void>
  beforeExtract?: (doc: Document, options: ExtractionOptions) => Document
  afterExtract?: (content: ExtractedContent) => ExtractedContent
  extractors?: Record<string, (doc: Document) => any>
}

// Result type for better error handling
export type ExtractionResult<T = ExtractedContent> =
  | { success: true; data: T }
  | { success: false; error: Error; partial?: Partial<T> }
