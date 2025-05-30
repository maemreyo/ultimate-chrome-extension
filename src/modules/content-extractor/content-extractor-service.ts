import { TextExtractor } from './text-extractor'
import { ExtractedContent, ExtractionOptions } from './types'
import { Storage } from '@plasmohq/storage'

class ContentExtractorService {
  private extractor: TextExtractor
  private storage: Storage
  private cache: Map<string, ExtractedContent> = new Map()

  constructor() {
    this.extractor = new TextExtractor()
    this.storage = new Storage({ area: 'local' })
    this.loadCache()
  }

  private async loadCache() {
    const cached = await this.storage.get('content_cache')
    if (cached) {
      this.cache = new Map(Object.entries(cached))
    }
  }

  private async saveCache() {
    // Limit cache size
    if (this.cache.size > 50) {
      const entries = Array.from(this.cache.entries())
      this.cache = new Map(entries.slice(-50))
    }

    await this.storage.set('content_cache', Object.fromEntries(this.cache))
  }

  async extract(url: string, options?: ExtractionOptions): Promise<ExtractedContent> {
    // Check cache
    const cacheKey = `${url}_${JSON.stringify(options || {})}`
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      const age = Date.now() - new Date(cached.metadata.extractedAt).getTime()

      // Cache for 1 hour
      if (age < 3600000) {
        return cached
      }
    }

    // Fetch and extract
    const response = await fetch(url)
    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const content = this.extractor.extract(doc, url, options)

    // Update cache
    this.cache.set(cacheKey, content)
    await this.saveCache()

    return content
  }

  async extractFromTab(tabId: number, options?: ExtractionOptions): Promise<ExtractedContent> {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        html: document.documentElement.outerHTML,
        url: window.location.href
      })
    })

    if (!results[0]?.result) {
      throw new Error('Failed to get page content')
    }

    const { html, url } = results[0].result as any
    const doc = new DOMParser().parseFromString(html, 'text/html')

    return this.extractor.extract(doc, url, options)
  }

  async extractFromCurrentTab(options?: ExtractionOptions): Promise<ExtractedContent> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      throw new Error('No active tab found')
    }

    return this.extractFromTab(tab.id, options)
  }

  clearCache() {
    this.cache.clear()
    this.storage.remove('content_cache')
  }
}

export const contentExtractor = new ContentExtractorService()