export interface ExtractOptions {
  includeImages?: boolean
  includeLinks?: boolean
  includeMetadata?: boolean
  includeTables?: boolean
  includeStructuredData?: boolean
  cleanHTML?: boolean
  absoluteUrls?: boolean
  selector?: string
  waitForSelector?: string
  timeout?: number
}

export interface Article {
  title: string
  content: string
  textContent: string
  excerpt: string
  author?: string
  publishedDate?: Date
  siteName?: string
  favicon?: string
  leadImage?: string
  images: string[]
  videos: string[]
  estimatedReadTime: number
  wordCount: number
  language?: string
}

export interface PageMetadata {
  title: string
  description?: string
  keywords?: string[]
  author?: string
  publishedDate?: Date
  modifiedDate?: Date
  type?: string
  url: string
  canonical?: string
  favicon?: string
  openGraph?: Record<string, string>
  twitter?: Record<string, string>
  jsonLd?: any[]
}

export interface ExtractedTable {
  headers: string[]
  rows: string[][]
  caption?: string
}

export interface ExtractedImage {
  src: string
  alt?: string
  title?: string
  width?: number
  height?: number
  naturalWidth?: number
  naturalHeight?: number
  type?: string
  size?: number
}

export interface ExtractedLink {
  href: string
  text: string
  title?: string
  rel?: string
  target?: string
  isExternal: boolean
  isDownload: boolean
}

export interface ScrapeResult {
  url: string
  title: string
  content: string
  article?: Article
  metadata?: PageMetadata
  images?: ExtractedImage[]
  links?: ExtractedLink[]
  tables?: ExtractedTable[]
  structuredData?: any[]
  screenshot?: string
  extractedAt: Date
}

export interface SelectorRule {
  name: string
  selector: string
  attribute?: string
  multiple?: boolean
  transform?: (value: string) => any
}

export interface ScrapeTemplate {
  name: string
  description?: string
  urlPattern?: RegExp
  rules: SelectorRule[]
  pagination?: {
    nextSelector: string
    maxPages?: number
  }
}