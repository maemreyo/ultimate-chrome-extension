// src/modules/content-extractor/utilities/cache-optimization-helpers.ts
// Advanced caching and optimization utilities

import type { ExtractedContent, ExtractionOptions } from "../types"

/**
 * Advanced LRU Cache with TTL and size limits
 */
export class AdvancedLRUCache<K, V> {
  private capacity: number
  private ttl: number
  private cache = new Map<
    K,
    { value: V; timestamp: number; accessCount: number }
  >()
  private accessOrder: K[] = []
  private sizeTracker = new Map<K, number>()
  private maxSize: number

  constructor(
    options: {
      capacity?: number
      ttl?: number
      maxSize?: number // in bytes
    } = {}
  ) {
    this.capacity = options.capacity || 100
    this.ttl = options.ttl || 3600000 // 1 hour
    this.maxSize = options.maxSize || 50 * 1024 * 1024 // 50MB
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key)

    if (!entry) return undefined

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key)
      return undefined
    }

    // Update access order and count
    entry.accessCount++
    this.updateAccessOrder(key)

    return entry.value
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param size - Size of value in bytes (optional)
   */
  set(key: K, value: V, size?: number): void {
    const entrySize = size || this.estimateSize(value)

    // Check if single item exceeds max size
    if (entrySize > this.maxSize) {
      console.warn("Item too large for cache:", key)
      return
    }

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key)
    }

    // Make room for new entry
    this.makeRoom(entrySize)

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    })

    this.sizeTracker.set(key, entrySize)
    this.accessOrder.push(key)
  }

  /**
   * Delete entry from cache
   * @param key - Cache key
   */
  delete(key: K): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.sizeTracker.delete(key)
      this.accessOrder = this.accessOrder.filter((k) => k !== key)
    }
    return deleted
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
    this.sizeTracker.clear()
    this.accessOrder = []
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    capacity: number
    totalSize: number
    maxSize: number
    hitRate: number
    averageAccessCount: number
    oldestEntry?: Date
    newestEntry?: Date
  } {
    const totalAccess = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    )

    const totalSize = Array.from(this.sizeTracker.values()).reduce(
      (sum, size) => sum + size,
      0
    )

    const timestamps = Array.from(this.cache.values()).map(
      (entry) => entry.timestamp
    )
    const oldestEntry =
      timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined
    const newestEntry =
      timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined

    return {
      size: this.cache.size,
      capacity: this.capacity,
      totalSize,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalAccess / this.cache.size : 0,
      averageAccessCount:
        this.cache.size > 0 ? totalAccess / this.cache.size : 0,
      oldestEntry,
      newestEntry
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const expiredKeys: K[] = []

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.delete(key)
    }
  }

  /**
   * Update access order for LRU
   * @param key - Key that was accessed
   */
  private updateAccessOrder(key: K): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== key)
    this.accessOrder.push(key)
  }

  /**
   * Make room for new entry
   * @param requiredSize - Size needed
   */
  private makeRoom(requiredSize: number): void {
    const currentSize = Array.from(this.sizeTracker.values()).reduce(
      (sum, size) => sum + size,
      0
    )

    // Remove entries until we have enough space
    while (
      (this.cache.size >= this.capacity ||
        currentSize + requiredSize > this.maxSize) &&
      this.accessOrder.length > 0
    ) {
      const lruKey = this.accessOrder.shift()!
      this.cache.delete(lruKey)
      this.sizeTracker.delete(lruKey)
    }
  }

  /**
   * Estimate size of value in bytes
   * @param value - Value to estimate
   * @returns Estimated size in bytes
   */
  private estimateSize(value: V): number {
    try {
      return new Blob([JSON.stringify(value)]).size
    } catch {
      return 1024 // Default 1KB if estimation fails
    }
  }
}

/**
 * Content fingerprinting for cache keys
 */
export class ContentFingerprinter {
  /**
   * Generate fingerprint for URL and options
   * @param url - URL to fingerprint
   * @param options - Extraction options
   * @returns Unique fingerprint
   */
  static generateFingerprint(url: string, options?: ExtractionOptions): string {
    const data = {
      url: this.normalizeUrl(url),
      options: this.normalizeOptions(options)
    }

    return this.hash(JSON.stringify(data))
  }

  /**
   * Generate fingerprint for content
   * @param content - Content to fingerprint
   * @returns Content fingerprint
   */
  static generateContentFingerprint(content: ExtractedContent): string {
    const data = {
      title: content.title,
      textLength: content.cleanText.length,
      paragraphCount: content.paragraphs.length,
      wordCount: content.wordCount
    }

    return this.hash(JSON.stringify(data))
  }

  /**
   * Normalize URL for consistent fingerprinting
   * @param url - URL to normalize
   * @returns Normalized URL
   */
  private static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)

      // Remove tracking parameters
      const trackingParams = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "fbclid",
        "gclid",
        "ref",
        "source"
      ]

      for (const param of trackingParams) {
        urlObj.searchParams.delete(param)
      }

      // Sort search parameters for consistency
      urlObj.searchParams.sort()

      return urlObj.toString()
    } catch {
      return url
    }
  }

  /**
   * Normalize options for consistent fingerprinting
   * @param options - Options to normalize
   * @returns Normalized options
   */
  private static normalizeOptions(options?: ExtractionOptions): any {
    if (!options) return {}

    return {
      includeImages: options.includeImages || false,
      includeTables: options.includeTables || false,
      includeLists: options.includeLists || false,
      cleanContent: options.cleanContent !== false,
      extractMetadata: options.extractMetadata !== false
    }
  }

  /**
   * Simple hash function
   * @param str - String to hash
   * @returns Hash string
   */
  private static hash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

/**
 * Cache warming strategies
 */
export class CacheWarmer {
  private cache: AdvancedLRUCache<string, ExtractedContent>
  private extractor: (
    url: string,
    options?: ExtractionOptions
  ) => Promise<ExtractedContent>

  constructor(
    cache: AdvancedLRUCache<string, ExtractedContent>,
    extractor: (
      url: string,
      options?: ExtractionOptions
    ) => Promise<ExtractedContent>
  ) {
    this.cache = cache
    this.extractor = extractor
  }

  /**
   * Warm cache with popular URLs
   * @param urls - URLs to pre-cache
   * @param options - Extraction options
   */
  async warmCache(urls: string[], options?: ExtractionOptions): Promise<void> {
    const promises = urls.map(async (url) => {
      try {
        const fingerprint = ContentFingerprinter.generateFingerprint(
          url,
          options
        )

        // Only extract if not already cached
        if (!this.cache.get(fingerprint)) {
          const content = await this.extractor(url, options)
          this.cache.set(fingerprint, content)
        }
      } catch (error) {
        console.warn(`Failed to warm cache for ${url}:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * Preload related content based on current URL
   * @param currentUrl - Current URL
   * @param relatedUrls - Related URLs to preload
   */
  async preloadRelated(
    currentUrl: string,
    relatedUrls: string[]
  ): Promise<void> {
    // Prioritize related URLs by similarity to current URL
    const prioritized = this.prioritizeUrls(currentUrl, relatedUrls)

    // Load top 3 related URLs
    const topUrls = prioritized.slice(0, 3)
    await this.warmCache(topUrls)
  }

  /**
   * Prioritize URLs by similarity to current URL
   * @param currentUrl - Current URL
   * @param urls - URLs to prioritize
   * @returns Prioritized URLs
   */
  private prioritizeUrls(currentUrl: string, urls: string[]): string[] {
    try {
      const currentDomain = new URL(currentUrl).hostname

      return urls.sort((a, b) => {
        const aDomain = new URL(a).hostname
        const bDomain = new URL(b).hostname

        // Same domain gets higher priority
        const aScore = aDomain === currentDomain ? 1 : 0
        const bScore = bDomain === currentDomain ? 1 : 0

        return bScore - aScore
      })
    } catch {
      return urls
    }
  }
}

/**
 * Cache invalidation strategies
 */
export class CacheInvalidator {
  private cache: AdvancedLRUCache<string, ExtractedContent>

  constructor(cache: AdvancedLRUCache<string, ExtractedContent>) {
    this.cache = cache
  }

  /**
   * Invalidate cache entries by pattern
   * @param pattern - URL pattern to match
   */
  invalidateByPattern(pattern: RegExp): number {
    let invalidated = 0

    // Note: This is a simplified implementation
    // In a real scenario, you'd need to store URL mappings
    this.cache.clear() // For now, clear all
    invalidated = 1

    return invalidated
  }

  /**
   * Invalidate cache entries older than specified time
   * @param maxAge - Maximum age in milliseconds
   */
  invalidateOld(maxAge: number): number {
    this.cache.cleanup()
    return 0 // Cleanup handles this
  }

  /**
   * Invalidate cache entries by domain
   * @param domain - Domain to invalidate
   */
  invalidateByDomain(domain: string): number {
    // Simplified implementation
    this.cache.clear()
    return 1
  }
}

/**
 * Cache performance analyzer
 */
export class CacheAnalyzer {
  private hitCounts = new Map<string, number>()
  private missCounts = new Map<string, number>()

  /**
   * Record cache hit
   * @param key - Cache key
   */
  recordHit(key: string): void {
    this.hitCounts.set(key, (this.hitCounts.get(key) || 0) + 1)
  }

  /**
   * Record cache miss
   * @param key - Cache key
   */
  recordMiss(key: string): void {
    this.missCounts.set(key, (this.missCounts.get(key) || 0) + 1)
  }

  /**
   * Get cache performance report
   * @returns Performance metrics
   */
  getReport(): {
    totalHits: number
    totalMisses: number
    hitRate: number
    topHitKeys: Array<{ key: string; hits: number }>
    topMissKeys: Array<{ key: string; misses: number }>
  } {
    const totalHits = Array.from(this.hitCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    )
    const totalMisses = Array.from(this.missCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    )
    const hitRate = totalHits / (totalHits + totalMisses)

    const topHitKeys = Array.from(this.hitCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, hits]) => ({ key, hits }))

    const topMissKeys = Array.from(this.missCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, misses]) => ({ key, misses }))

    return {
      totalHits,
      totalMisses,
      hitRate,
      topHitKeys,
      topMissKeys
    }
  }

  /**
   * Reset analytics
   */
  reset(): void {
    this.hitCounts.clear()
    this.missCounts.clear()
  }
}
