export interface ExtractedContent {
  title: string
  paragraphs: Paragraph[]
  cleanText: string
  metadata: ContentMetadata
  sections: Section[]
  readingTime: number
  wordCount: number
  language: string
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
}

export interface Section {
  id: string
  title: string
  paragraphs: Paragraph[]
  level: number
  startIndex: number
  endIndex: number
}

export interface ContentMetadata {
  author?: string
  publishDate?: Date
  updateDate?: Date
  category?: string
  tags: string[]
  description?: string
  imageUrl?: string
  source: string
  extractedAt: Date
}

export interface SiteAdapter {
  name: string
  patterns: RegExp[]
  extract(doc: Document): Partial<ExtractedContent>
  cleanContent?(content: string): string
  detectParagraphs?(doc: Document): Paragraph[]
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
}

export interface ExtractionOptions {
  adapter?: string
  cleaningOptions?: Partial<CleaningOptions>
  minParagraphLength?: number
  includeMetadata?: boolean
  detectSections?: boolean
  scoreParagraphs?: boolean
}