// src/modules/content-extractor/content-extractor-service.ts

import { Storage } from "@plasmohq/storage"
import { TextExtractor } from "./text-extractor"
import type {
  CacheOptions,
  ContentExtractorPlugin,
  ExtractedContent,
  ExtractionEvents,
  ExtractionOptions,
  ExtractionResult
} from "./types"

// LRU Cache implementation
class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>
  private accessOrder: K[]

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
    this.accessOrder = []
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter((k) => k !== key)
      this.accessOrder.push(key)
    }
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.set(key, value)
      this.get(key) // Update access order
    } else {
      // Add new
      if (this.accessOrder.length >= this.capacity) {
        // Remove least recently used
        const lru = this.accessOrder.shift()
        if (lru !== undefined) {
          this.cache.delete(lru)
        }
      }
      this.cache.set(key, value)
      this.accessOrder.push(key)
    }
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  size(): number {
    return this.cache.size
  }
}

export class ContentExtractorService {
  private extractor: TextExtractor
  private storage: Storage
  private cache: LRUCache<
    string,
    { content: ExtractedContent; timestamp: number }
  >
  private plugins: ContentExtractorPlugin[] = []
  private defaultCacheOptions: CacheOptions = {
    enabled: true,
    ttl: 3600000, // 1 hour
    maxSize: 50, // 50 MB
    strategy: "lru",
    persistent: true
  }
  private cacheOptions: CacheOptions
  private pendingExtractions: Map<string, Promise<ExtractedContent>> = new Map()

  constructor(cacheOptions?: Partial<CacheOptions>) {
    this.extractor = new TextExtractor()
    this.storage = new Storage({ area: "local" })
    this.cacheOptions = { ...this.defaultCacheOptions, ...cacheOptions }
    this.cache = new LRUCache(100) // 100 items max
    if (this.cacheOptions.persistent) {
      this.loadCache()
    }
  }

  // Plugin management
  async registerPlugin(plugin: ContentExtractorPlugin): Promise<void> {
    if (plugin.init) {
      await plugin.init()
    }
    this.plugins.push(plugin)
    console.log(`Registered plugin: ${plugin.name} v${plugin.version}`)
  }

  unregisterPlugin(pluginName: string): void {
    this.plugins = this.plugins.filter((p) => p.name !== pluginName)
  }

  // Enhanced extraction with error handling and events
  async extract(
    url: string,
    options?: ExtractionOptions,
    events?: ExtractionEvents
  ): Promise<ExtractionResult> {
    try {
      events?.onStart?.()

      // Check if extraction is already in progress
      const pendingKey = `${url}_${JSON.stringify(options || {})}`
      if (this.pendingExtractions.has(pendingKey)) {
        const content = await this.pendingExtractions.get(pendingKey)!
        return { success: true, data: content }
      }

      // Create pending extraction promise
      const extractionPromise = this._extract(url, options, events)
      this.pendingExtractions.set(pendingKey, extractionPromise)

      try {
        const content = await extractionPromise
        events?.onComplete?.(content)
        return { success: true, data: content }
      } finally {
        this.pendingExtractions.delete(pendingKey)
      }
    } catch (error) {
      events?.onError?.(error as Error)
      return {
        success: false,
        error: error as Error,
        partial: undefined // Could include partial extraction results
      }
    }
  }

  private async _extract(
    url: string,
    options?: ExtractionOptions,
    events?: ExtractionEvents
  ): Promise<ExtractedContent> {
    // Check cache
    if (this.cacheOptions.enabled) {
      const cached = await this.getFromCache(url, options)
      if (cached) {
        events?.onProgress?.({
          phase: "fetching",
          progress: 100,
          message: "Loaded from cache"
        })
        return cached
      }
    }

    // Fetch content
    events?.onProgress?.({ phase: "fetching", progress: 10 })
    const response = await this.fetchWithTimeout(url, options?.timeout || 30000)
    const html = await response.text()

    events?.onProgress?.({ phase: "parsing", progress: 30 })
    let doc = new DOMParser().parseFromString(html, "text/html")

    // Apply plugin pre-processors
    for (const plugin of this.plugins) {
      if (plugin.beforeExtract) {
        doc = plugin.beforeExtract(doc, options || {})
      }
    }

    events?.onProgress?.({ phase: "cleaning", progress: 50 })

    // Extract content
    events?.onProgress?.({ phase: "extracting", progress: 70 })
    let content = await this.extractor.extractEnhanced(doc, url, options)

    // Apply plugin post-processors
    for (const plugin of this.plugins) {
      if (plugin.afterExtract) {
        content = plugin.afterExtract(content)
      }
    }

    events?.onProgress?.({ phase: "analyzing", progress: 90 })

    // Generate fingerprint
    content.fingerprint = this.generateFingerprint(content)

    // Cache result
    if (this.cacheOptions.enabled) {
      await this.saveToCache(url, options, content)
    }

    events?.onProgress?.({ phase: "analyzing", progress: 100 })
    return content
  }

  async extractBatch(
    urls: string[],
    options?: ExtractionOptions,
    concurrency: number = 3
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = []
    const chunks: string[][] = []

    // Split URLs into chunks for concurrent processing
    for (let i = 0; i < urls.length; i += concurrency) {
      chunks.push(urls.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((url) => this.extract(url, options))
      )
      results.push(...chunkResults)
    }

    return results
  }

  async extractFromTab(
    tabId: number,
    options?: ExtractionOptions,
    events?: ExtractionEvents
  ): Promise<ExtractionResult> {
    try {
      events?.onStart?.()

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => ({
          html: document.documentElement.outerHTML,
          url: window.location.href,
          // Check for lazy-loaded content
          hasLazyContent:
            document.querySelectorAll('[data-src], [loading="lazy"]').length > 0
        })
      })

      if (!results[0]?.result) {
        throw new Error("Failed to get page content")
      }

      const { html, url, hasLazyContent } = results[0].result as any

      // If lazy content detected and option enabled, wait for it
      if (hasLazyContent && options?.lazy) {
        await this.waitForLazyContent(tabId, options.waitForSelectors)
      }

      const doc = new DOMParser().parseFromString(html, "text/html")
      const content = await this.extractor.extractEnhanced(doc, url, options)

      events?.onComplete?.(content)
      return { success: true, data: content }
    } catch (error) {
      events?.onError?.(error as Error)
      return { success: false, error: error as Error }
    }
  }

  // Cache management
  private async getFromCache(
    url: string,
    options?: ExtractionOptions
  ): Promise<ExtractedContent | null> {
    const cacheKey = this.getCacheKey(url, options)
    const cached = this.cache.get(cacheKey)

    if (cached) {
      const age = Date.now() - cached.timestamp
      if (age < this.cacheOptions.ttl) {
        return cached.content
      }
    }

    // Try persistent cache
    if (this.cacheOptions.persistent) {
      const persistentCache = await this.storage.get(`cache_${cacheKey}`)
      if (persistentCache) {
        const age = Date.now() - persistentCache.timestamp
        if (age < this.cacheOptions.ttl) {
          // Restore to memory cache
          this.cache.set(cacheKey, persistentCache)
          return persistentCache.content
        }
      }
    }

    return null
  }

  private async saveToCache(
    url: string,
    options: ExtractionOptions | undefined,
    content: ExtractedContent
  ): Promise<void> {
    const cacheKey = this.getCacheKey(url, options)
    const cacheEntry = { content, timestamp: Date.now() }

    this.cache.set(cacheKey, cacheEntry)

    if (this.cacheOptions.persistent) {
      await this.storage.set(`cache_${cacheKey}`, cacheEntry)
    }
  }

  private getCacheKey(url: string, options?: ExtractionOptions): string {
    const optionsHash = options ? JSON.stringify(options) : "default"
    return `${url}_${this.hashString(optionsHash)}`
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private generateFingerprint(content: ExtractedContent): string {
    const text = content.cleanText.slice(0, 1000) // First 1000 chars
    return this.hashString(text + content.title)
  }

  private async fetchWithTimeout(
    url: string,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeout}ms`)
      }
      throw error
    }
  }

  private async waitForLazyContent(
    tabId: number,
    selectors?: string[]
  ): Promise<void> {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (waitSelectors) => {
        return new Promise<void>((resolve) => {
          // Scroll to trigger lazy loading
          window.scrollTo(0, document.body.scrollHeight)

          if (waitSelectors && waitSelectors.length > 0) {
            // Wait for specific selectors
            const checkSelectors = () => {
              const found = waitSelectors.every(
                (selector) => document.querySelector(selector) !== null
              )
              if (found) {
                resolve()
              } else {
                setTimeout(checkSelectors, 100)
              }
            }
            checkSelectors()
          } else {
            // Generic wait
            setTimeout(resolve, 2000)
          }
        })
      },
      args: [selectors || []]
    })
  }

  // Cache management methods
  async clearCache(): Promise<void> {
    this.cache.clear()
    if (this.cacheOptions.persistent) {
      const keys = await this.storage.getAll()
      const cacheKeys = Object.keys(keys).filter((k) => k.startsWith("cache_"))
      await Promise.all(cacheKeys.map((k) => this.storage.remove(k)))
    }
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size(),
      hitRate: 0 // Would need to track hits/misses for this
    }
  }

  // Duplicate detection
  async findDuplicates(urls: string[]): Promise<Map<string, string[]>> {
    const fingerprints = new Map<string, string[]>()

    for (const url of urls) {
      const result = await this.extract(url)
      if (result.success) {
        const fp = result.data.fingerprint
        if (!fingerprints.has(fp)) {
          fingerprints.set(fp, [])
        }
        fingerprints.get(fp)!.push(url)
      }
    }

    // Return only duplicates
    const duplicates = new Map<string, string[]>()
    for (const [fp, urls] of fingerprints) {
      if (urls.length > 1) {
        duplicates.set(fp, urls)
      }
    }

    return duplicates
  }

  private async loadCache(): Promise<void> {
    const keys = await this.storage.getAll()
    const cacheKeys = Object.keys(keys).filter((k) => k.startsWith("cache_"))

    for (const key of cacheKeys) {
      const cacheKey = key.replace("cache_", "")
      const value = keys[key]
      if (
        value &&
        typeof value === "object" &&
        "content" in value &&
        "timestamp" in value
      ) {
        this.cache.set(cacheKey, value as any)
      }
    }
  }
}

export const contentExtractor = new ContentExtractorService()
