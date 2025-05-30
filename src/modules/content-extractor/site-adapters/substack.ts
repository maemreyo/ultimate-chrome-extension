import { SiteAdapter, Paragraph } from '../types'

export class SubstackAdapter implements SiteAdapter {
  name = 'substack'
  patterns = [
    /\.substack\.com/,
    /substack\.com/
  ]

  extract(doc: Document) {
    const article = doc.querySelector('article, .post')
    if (!article) return {}

    const title = this.extractTitle(doc)
    const paragraphs = this.detectParagraphs(doc)
    const metadata = this.extractMetadata(doc)

    const cleanText = paragraphs.map(p => p.text).join('\n\n')
    const wordCount = cleanText.split(/\s+/).length

    return {
      title,
      paragraphs,
      cleanText,
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      metadata
    }
  }

  detectParagraphs(doc: Document): Paragraph[] {
    const paragraphs: Paragraph[] = []
    const content = doc.querySelector('.body, .post-content, article')
    if (!content) return paragraphs

    const elements = content.querySelectorAll('p, h1, h2, h3, h4, blockquote, pre')

    elements.forEach((element, index) => {
      const text = element.textContent?.trim() || ''
      if (text.length < 10) return

      const tagName = element.tagName.toLowerCase()
      const isHeading = /^h[1-6]$/.test(tagName)

      paragraphs.push({
        id: `p-${index}`,
        text,
        html: element.innerHTML,
        index,
        element: this.getElementPath(element),
        bounds: element.getBoundingClientRect(),
        isQuote: tagName === 'blockquote' || element.classList.contains('pullquote'),
        isCode: tagName === 'pre',
        isHeading,
        headingLevel: isHeading ? parseInt(tagName[1]) : undefined,
        importance: this.calculateImportance(element, isHeading)
      })
    })

    return paragraphs
  }

  private extractTitle(doc: Document): string {
    return doc.querySelector('h1.post-title, h1, .post-title')?.textContent?.trim() ||
           doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
           doc.title
  }

  private extractMetadata(doc: Document) {
    return {
      author: this.extractAuthor(doc),
      publishDate: this.extractPublishDate(doc),
      source: 'substack.com',
      extractedAt: new Date(),
      tags: this.extractTags(doc),
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content'),
      imageUrl: doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
    }
  }

  private extractAuthor(doc: Document): string {
    const selectors = [
      '.byline a',
      'a[rel="author"]',
      '.author-name',
      'meta[name="author"]'
    ]

    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        return element.getAttribute('content') || element.textContent?.trim() || ''
      }
    }

    return ''
  }

  private extractPublishDate(doc: Document): Date | undefined {
    const selectors = [
      'time[datetime]',
      '.post-date time',
      'meta[property="article:published_time"]'
    ]

    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        const datetime = element.getAttribute('datetime') ||
                        element.getAttribute('content') ||
                        element.textContent

        if (datetime) {
          const date = new Date(datetime)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      }
    }

    return undefined
  }

  private extractTags(doc: Document): string[] {
    const tags: string[] = []

    doc.querySelectorAll('.post-meta-item a, .tags a').forEach(link => {
      const text = link.textContent?.trim()
      if (text && !tags.includes(text)) {
        tags.push(text)
      }
    })

    return tags
  }

  private getElementPath(element: Element): string {
    const path: string[] = []
    let current: Element | null = element

    while (current && current !== document.body) {
      const selector = current.tagName.toLowerCase()
      const index = Array.from(current.parentElement?.children || []).indexOf(current)
      path.unshift(`${selector}:nth-child(${index + 1})`)
      current = current.parentElement
    }

    return path.join(' > ')
  }

  private calculateImportance(element: Element, isHeading: boolean): number {
    let score = 0.5

    if (isHeading) score = 0.9
    else if (element.tagName === 'P') score = 0.7
    else if (element.tagName === 'BLOCKQUOTE') score = 0.6

    // Boost for elements with certain classes
    if (element.classList.contains('highlight') ||
        element.classList.contains('important') ||
        element.classList.contains('key-point')) {
      score += 0.1
    }

    return Math.min(1, score)
  }
}