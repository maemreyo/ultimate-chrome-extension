import { WebScraper } from './scraper'
import { ArticleReader } from './article-reader'
import { ScrapeResult, ScrapeTemplate } from './types'
import { Storage } from '@plasmohq/storage'

class ScraperService {
  private scraper: WebScraper
  private reader: ArticleReader
  private storage: Storage
  private cache: Map<string, ScrapeResult> = new Map()

  constructor() {
    this.scraper = new WebScraper()
    this.reader = new ArticleReader()
    this.storage = new Storage({ area: 'local' })
    this.loadCache()
  }

  private async loadCache() {
    const cached = await this.storage.get('scraper_cache')
    if (cached) {
      this.cache = new Map(Object.entries(cached))
    }
  }

  private async saveCache() {
    await this.storage.set('scraper_cache', Object.fromEntries(this.cache))
  }

  async scrapeUrl(url: string, options?: {
    useCache?: boolean
    template?: string
  }): Promise<ScrapeResult> {
    // Check cache
    if (options?.useCache && this.cache.has(url)) {
      const cached = this.cache.get(url)!
      const age = Date.now() - new Date(cached.extractedAt).getTime()

      // Cache for 1 hour
      if (age < 3600000) {
        return cached
      }
    }

    const result = await this.scraper.scrape(url, {
      template: options?.template
    })

    // Update cache
    this.cache.set(url, result)

    // Limit cache size
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0]
      this.cache.delete(oldestKey)
    }

    await this.saveCache()

    return result
  }

  async scrapeCurrentTab(): Promise<ScrapeResult> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      throw new Error('No active tab found')
    }

    return this.scraper.scrapeDynamic(tab.id)
  }

  async extractArticle(urlOrTabId: string | number) {
    if (typeof urlOrTabId === 'string') {
      return this.reader.extractFromURL(urlOrTabId)
    } else {
      return this.reader.extractFromTab(urlOrTabId)
    }
  }

  async createTemplate(name: string, url: string): Promise<ScrapeTemplate> {
    // Analyze the page to suggest selectors
    const result = await this.scraper.scrape(url)

    // This is a simplified version
    // In production, you'd want more sophisticated selector detection
    const template: ScrapeTemplate = {
      name,
      urlPattern: new RegExp(new URL(url).hostname),
      rules: []
    }

    // Suggest rules based on found elements
    if (result.article) {
      template.rules.push({
        name: 'title',
        selector: 'h1, article h1, .article-title',
        multiple: false
      })
      template.rules.push({
        name: 'content',
        selector: 'article, .article-content, .post-content',
        multiple: false
      })
    }

    return template
  }

  async exportResults(results: ScrapeResult[], format: 'json' | 'csv' | 'markdown' = 'json'): Promise<Blob> {
    let content: string
    let mimeType: string

    switch (format) {
      case 'csv':
        content = this.resultsToCSV(results)
        mimeType = 'text/csv'
        break

      case 'markdown':
        content = this.resultsToMarkdown(results)
        mimeType = 'text/markdown'
        break

      case 'json':
      default:
        content = JSON.stringify(results, null, 2)
        mimeType = 'application/json'
        break
    }

    return new Blob([content], { type: mimeType })
  }

  private resultsToCSV(results: ScrapeResult[]): string {
    const headers = ['URL', 'Title', 'Author', 'Published Date', 'Word Count', 'Extract Time']
    const rows = results.map(r => [
      r.url,
      r.title,
      r.article?.author || '',
      r.article?.publishedDate?.toISOString() || '',
      r.article?.wordCount || '',
      r.extractedAt.toISOString()
    ])

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
  }

  private resultsToMarkdown(results: ScrapeResult[]): string {
    let markdown = '# Scraped Content\n\n'

    results.forEach(result => {
      markdown += `## ${result.title}\n\n`
      markdown += `**URL:** ${result.url}\n\n`

      if (result.article) {
        if (result.article.author) {
          markdown += `**Author:** ${result.article.author}\n\n`
        }
        if (result.article.publishedDate) {
          markdown += `**Published:** ${result.article.publishedDate.toLocaleDateString()}\n\n`
        }
        markdown += `**Read Time:** ${result.article.estimatedReadTime} minutes\n\n`
        markdown += `---\n\n`
        markdown += result.article.textContent.substring(0, 500) + '...\n\n'
      }

      markdown += `---\n\n`
    })

    return markdown
  }

  clearCache() {
    this.cache.clear()
    this.storage.remove('scraper_cache')
  }
}

export const scraperService = new ScraperService()