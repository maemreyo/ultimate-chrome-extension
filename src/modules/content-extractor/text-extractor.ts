import { ExtractedContent, ExtractionOptions, Paragraph } from './types'
import { ParagraphDetector } from './paragraph-detector'
import { ContentCleaner } from './content-cleaner'
import { getSiteAdapter } from './site-adapters'

export class TextExtractor {
  private paragraphDetector: ParagraphDetector
  private contentCleaner: ContentCleaner

  constructor() {
    this.paragraphDetector = new ParagraphDetector()
    this.contentCleaner = new ContentCleaner()
  }

  extract(doc: Document, url: string, options: ExtractionOptions = {}): ExtractedContent {
    // Try site-specific adapter first
    const adapter = getSiteAdapter(url)
    if (adapter && (!options.adapter || options.adapter === adapter.name)) {
      const adapterResult = adapter.extract(doc)
      if (adapterResult.paragraphs && adapterResult.paragraphs.length > 0) {
        return this.enhanceExtractedContent(adapterResult, doc, url, options)
      }
    }

    // Fallback to generic extraction
    const cleanedDoc = this.contentCleaner.clean(doc.cloneNode(true) as Document, options.cleaningOptions)
    const paragraphs = this.paragraphDetector.detect(cleanedDoc, options)
    const sections = options.detectSections ? this.detectSections(paragraphs) : []

    const cleanText = paragraphs.map(p => p.text).join('\n\n')
    const wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length
    const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

    return {
      title: this.extractTitle(doc),
      paragraphs,
      cleanText,
      sections,
      readingTime,
      wordCount,
      language: doc.documentElement.lang || 'en',
      metadata: options.includeMetadata ? this.extractMetadata(doc, url) : this.getBasicMetadata(url)
    }
  }

  private extractTitle(doc: Document): string {
    // Try multiple strategies
    const strategies = [
      () => doc.querySelector('h1')?.textContent,
      () => doc.querySelector('[class*="title"]')?.textContent,
      () => doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      () => doc.title.split(/[|\-–]/)[0],
      () => doc.title
    ]

    for (const strategy of strategies) {
      const title = strategy()?.trim()
      if (title && title.length > 10 && title.length < 200) {
        return title
      }
    }

    return doc.title
  }

  private extractMetadata(doc: Document, url: string): ContentMetadata {
    const metadata: ContentMetadata = {
      source: new URL(url).hostname,
      extractedAt: new Date(),
      tags: []
    }

    // Author
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '[rel="author"]',
      '.author-name',
      '.by-line',
      '.byline',
      '[itemprop="author"]'
    ]

    for (const selector of authorSelectors) {
      const element = doc.querySelector(selector)
      if (element) {
        metadata.author = element.getAttribute('content') || element.textContent?.trim()
        if (metadata.author) break
      }
    }

    // Dates
    const dateSelectors = [
      { selector: 'meta[property="article:published_time"]', attr: 'content' },
      { selector: 'time[datetime]', attr: 'datetime' },
      { selector: '.publish-date', attr: 'textContent' },
      { selector: '[itemprop="datePublished"]', attr: 'content' }
    ]

    for (const { selector, attr } of dateSelectors) {
      const element = doc.querySelector(selector)
      if (element) {
        const dateStr = attr === 'textContent'
          ? element.textContent
          : element.getAttribute(attr)

        if (dateStr) {
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            metadata.publishDate = date
            break
          }
        }
      }
    }

    // Tags/Keywords
    const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')
    if (keywords) {
      metadata.tags = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
    }

    // Category
    const category = doc.querySelector('meta[property="article:section"]')?.getAttribute('content')
    if (category) {
      metadata.category = category
    }

    // Description
    metadata.description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content')

    // Image
    metadata.imageUrl =
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content')

    return metadata
  }

  private getBasicMetadata(url: string): ContentMetadata {
    return {
      source: new URL(url).hostname,
      extractedAt: new Date(),
      tags: []
    }
  }

  private detectSections(paragraphs: Paragraph[]): Section[] {
    const sections: Section[] = []
    let currentSection: Section | null = null
    let sectionIndex = 0

    paragraphs.forEach((p, index) => {
      if (p.isHeading && p.headingLevel) {
        // Start new section
        if (currentSection) {
          currentSection.endIndex = index - 1
          sections.push(currentSection)
        }

        currentSection = {
          id: `section-${sectionIndex++}`,
          title: p.text,
          level: p.headingLevel,
          paragraphs: [],
          startIndex: index,
          endIndex: index
        }
      } else if (currentSection) {
        currentSection.paragraphs.push(p)
        currentSection.endIndex = index
      }
    })

    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }

  private enhanceExtractedContent(
    partial: Partial<ExtractedContent>,
    doc: Document,
    url: string,
    options: ExtractionOptions
  ): ExtractedContent {
    const wordCount = partial.cleanText?.split(/\s+/).filter(w => w.length > 0).length || 0

    return {
      title: partial.title || this.extractTitle(doc),
      paragraphs: partial.paragraphs || [],
      cleanText: partial.cleanText || '',
      sections: partial.sections || [],
      readingTime: partial.readingTime || Math.ceil(wordCount / 200),
      wordCount: partial.wordCount || wordCount,
      language: partial.language || doc.documentElement.lang || 'en',
      metadata: partial.metadata || this.extractMetadata(doc, url)
    }
  }
}