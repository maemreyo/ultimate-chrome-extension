// src/modules/storage/utilities/storage-cache-helpers.ts
// Storage caching and performance optimization utilities

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number // Maximum number of items
  maxMemory: number // Maximum memory usage in bytes
  ttl: number // Time to live in milliseconds
  strategy: "lru" | "lfu" | "fifo" | "random"
  writeThrough: boolean // Write to storage immediately
  writeBack: boolean // Batch writes to storage
  compression: boolean // Compress cached values
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  key: string
  value: T
  size: number
  accessCount: number
  lastAccess: number
  created: number
  expires?: number
  dirty: boolean // Needs to be written to storage
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  memoryUsage: number
  evictions: number
  writes: number
  reads: number
}

/**
 * Advanced storage cache with multiple eviction strategies
 */
export class StorageCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = [] // For LRU
  private accessFreq = new Map<string, number>() // For LFU
  private config: CacheConfig
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    memoryUsage: 0,
    evictions: 0,
    writes: 0,
    reads: 0
  }
  private writeQueue = new Map<string, T>()
  private writeTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      maxMemory: 50 * 1024 * 1024, // 50MB
      ttl: 3600000, // 1 hour
      strategy: "lru",
      writeThrough: true,
      writeBack: false,
      compression: false,
      ...config
    }

    // Start write-back timer if enabled
    if (this.config.writeBack) {
      this.startWriteBackTimer()
    }
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  get(key: string): T | undefined {
    this.stats.reads++

    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return undefined
    }

    // Check expiration
    if (entry.expires && Date.now() > entry.expires) {
      this.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return undefined
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccess = Date.now()
    this.accessFreq.set(key, (this.accessFreq.get(key) || 0) + 1)

    // Update access order for LRU
    if (this.config.strategy === "lru") {
      this.updateAccessOrder(key)
    }

    this.stats.hits++
    this.updateHitRate()

    return entry.value
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Custom TTL (optional)
   */
  set(key: string, value: T, ttl?: number): void {
    this.stats.writes++

    const size = this.estimateSize(value)
    const now = Date.now()
    const expires = ttl
      ? now + ttl
      : this.config.ttl
        ? now + this.config.ttl
        : undefined

    // Check if we need to make room
    this.makeRoom(size)

    // Create cache entry
    const entry: CacheEntry<T> = {
      key,
      value: this.config.compression ? this.compress(value) : value,
      size,
      accessCount: 1,
      lastAccess: now,
      created: now,
      expires,
      dirty: !this.config.writeThrough
    }

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key, false)
    }

    // Add new entry
    this.cache.set(key, entry)
    this.accessOrder.push(key)
    this.accessFreq.set(key, 1)

    // Update statistics
    this.stats.size++
    this.stats.memoryUsage += size

    // Handle write strategies
    if (this.config.writeThrough) {
      // Write immediately (would need storage reference)
      this.writeToStorage(key, value)
    } else if (this.config.writeBack) {
      // Queue for batch write
      this.writeQueue.set(key, value)
      entry.dirty = true
    }
  }

  /**
   * Delete entry from cache
   * @param key - Cache key
   * @param updateStats - Whether to update statistics
   */
  delete(key: string, updateStats: boolean = true): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Remove from cache
    this.cache.delete(key)
    this.accessOrder = this.accessOrder.filter((k) => k !== key)
    this.accessFreq.delete(key)
    this.writeQueue.delete(key)

    // Update statistics
    if (updateStats) {
      this.stats.size--
      this.stats.memoryUsage -= entry.size
    }

    return true
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.accessFreq.clear()
    this.writeQueue.clear()

    this.stats.size = 0
    this.stats.memoryUsage = 0
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @returns True if key exists and not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check expiration
    if (entry.expires && Date.now() > entry.expires) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get cache entries (for debugging)
   * @returns Array of cache entries
   */
  getEntries(): Array<{ key: string; entry: CacheEntry<T> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry
    }))
  }

  /**
   * Flush dirty entries to storage
   * @returns Number of entries flushed
   */
  async flush(): Promise<number> {
    if (this.writeQueue.size === 0) {
      return 0
    }

    const entries = Array.from(this.writeQueue.entries())
    this.writeQueue.clear()

    // Write all queued entries
    for (const [key, value] of entries) {
      await this.writeToStorage(key, value)

      // Mark as clean
      const entry = this.cache.get(key)
      if (entry) {
        entry.dirty = false
      }
    }

    return entries.length
  }

  /**
   * Cleanup expired entries
   * @returns Number of entries cleaned
   */
  cleanup(): number {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache) {
      if (entry.expires && now > entry.expires) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.delete(key)
    }

    return expiredKeys.length
  }

  /**
   * Optimize cache by removing least valuable entries
   * @param targetReduction - Target reduction in percentage (0-1)
   */
  optimize(targetReduction: number = 0.1): void {
    const targetSize = Math.floor(this.cache.size * (1 - targetReduction))

    while (this.cache.size > targetSize) {
      const keyToEvict = this.selectEvictionCandidate()
      if (keyToEvict) {
        this.delete(keyToEvict)
        this.stats.evictions++
      } else {
        break
      }
    }
  }

  /**
   * Make room for new entry
   * @param requiredSize - Size needed
   */
  private makeRoom(requiredSize: number): void {
    // Check size limit
    while (this.cache.size >= this.config.maxSize) {
      const keyToEvict = this.selectEvictionCandidate()
      if (keyToEvict) {
        this.delete(keyToEvict)
        this.stats.evictions++
      } else {
        break
      }
    }

    // Check memory limit
    while (this.stats.memoryUsage + requiredSize > this.config.maxMemory) {
      const keyToEvict = this.selectEvictionCandidate()
      if (keyToEvict) {
        this.delete(keyToEvict)
        this.stats.evictions++
      } else {
        break
      }
    }
  }

  /**
   * Select candidate for eviction based on strategy
   * @returns Key to evict or undefined
   */
  private selectEvictionCandidate(): string | undefined {
    if (this.cache.size === 0) {
      return undefined
    }

    switch (this.config.strategy) {
      case "lru":
        return this.selectLRUCandidate()
      case "lfu":
        return this.selectLFUCandidate()
      case "fifo":
        return this.selectFIFOCandidate()
      case "random":
        return this.selectRandomCandidate()
      default:
        return this.selectLRUCandidate()
    }
  }

  /**
   * Select LRU (Least Recently Used) candidate
   * @returns Key to evict
   */
  private selectLRUCandidate(): string | undefined {
    return this.accessOrder[0]
  }

  /**
   * Select LFU (Least Frequently Used) candidate
   * @returns Key to evict
   */
  private selectLFUCandidate(): string | undefined {
    let minFreq = Infinity
    let candidate: string | undefined

    for (const [key, freq] of this.accessFreq) {
      if (freq < minFreq) {
        minFreq = freq
        candidate = key
      }
    }

    return candidate
  }

  /**
   * Select FIFO (First In, First Out) candidate
   * @returns Key to evict
   */
  private selectFIFOCandidate(): string | undefined {
    let oldestTime = Infinity
    let candidate: string | undefined

    for (const [key, entry] of this.cache) {
      if (entry.created < oldestTime) {
        oldestTime = entry.created
        candidate = key
      }
    }

    return candidate
  }

  /**
   * Select random candidate
   * @returns Key to evict
   */
  private selectRandomCandidate(): string | undefined {
    const keys = Array.from(this.cache.keys())
    const randomIndex = Math.floor(Math.random() * keys.length)
    return keys[randomIndex]
  }

  /**
   * Update access order for LRU
   * @param key - Key that was accessed
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== key)
    this.accessOrder.push(key)
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Estimate size of value
   * @param value - Value to estimate
   * @returns Estimated size in bytes
   */
  private estimateSize(value: T): number {
    try {
      return new Blob([JSON.stringify(value)]).size
    } catch {
      return JSON.stringify(value).length * 2
    }
  }

  /**
   * Compress value (placeholder implementation)
   * @param value - Value to compress
   * @returns Compressed value
   */
  private compress(value: T): T {
    // In a real implementation, you'd use actual compression
    return value
  }

  /**
   * Write to storage (placeholder - would need storage reference)
   * @param key - Storage key
   * @param value - Value to write
   */
  private async writeToStorage(key: string, value: T): Promise<void> {
    // Placeholder - in real implementation, this would write to actual storage
    console.log(`Writing to storage: ${key}`)
  }

  /**
   * Start write-back timer
   */
  private startWriteBackTimer(): void {
    this.writeTimer = setInterval(async () => {
      if (this.writeQueue.size > 0) {
        await this.flush()
      }
    }, 5000) // Flush every 5 seconds
  }

  /**
   * Stop write-back timer
   */
  private stopWriteBackTimer(): void {
    if (this.writeTimer) {
      clearInterval(this.writeTimer)
      this.writeTimer = null
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopWriteBackTimer()
    this.clear()
  }
}

/**
 * Cache warming strategies
 */
export class CacheWarmer<T = any> {
  private cache: StorageCache<T>
  private loader: (key: string) => Promise<T | undefined>

  constructor(
    cache: StorageCache<T>,
    loader: (key: string) => Promise<T | undefined>
  ) {
    this.cache = cache
    this.loader = loader
  }

  /**
   * Warm cache with specific keys
   * @param keys - Keys to warm
   * @returns Number of keys warmed
   */
  async warmKeys(keys: string[]): Promise<number> {
    let warmed = 0

    for (const key of keys) {
      try {
        if (!this.cache.has(key)) {
          const value = await this.loader(key)
          if (value !== undefined) {
            this.cache.set(key, value)
            warmed++
          }
        }
      } catch (error) {
        console.warn(`Failed to warm cache for key ${key}:`, error)
      }
    }

    return warmed
  }

  /**
   * Warm cache with pattern-based loading
   * @param pattern - Key pattern to match
   * @param limit - Maximum number of keys to warm
   * @returns Number of keys warmed
   */
  async warmPattern(pattern: RegExp, limit: number = 100): Promise<number> {
    // This would need access to storage to find matching keys
    // Placeholder implementation
    return 0
  }

  /**
   * Preload frequently accessed items
   * @param accessLog - Access frequency log
   * @param topN - Number of top items to preload
   * @returns Number of keys warmed
   */
  async preloadFrequent(
    accessLog: Map<string, number>,
    topN: number = 50
  ): Promise<number> {
    const sortedKeys = Array.from(accessLog.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([key]) => key)

    return this.warmKeys(sortedKeys)
  }
}

/**
 * Cache performance analyzer
 */
export class CacheAnalyzer {
  private cache: StorageCache
  private accessLog: Array<{ key: string; timestamp: number; hit: boolean }> =
    []
  private maxLogSize: number = 10000

  constructor(cache: StorageCache, maxLogSize: number = 10000) {
    this.cache = cache
    this.maxLogSize = maxLogSize
  }

  /**
   * Log cache access
   * @param key - Accessed key
   * @param hit - Whether it was a hit
   */
  logAccess(key: string, hit: boolean): void {
    this.accessLog.push({
      key,
      timestamp: Date.now(),
      hit
    })

    // Trim log if too large
    if (this.accessLog.length > this.maxLogSize) {
      this.accessLog = this.accessLog.slice(-this.maxLogSize)
    }
  }

  /**
   * Analyze cache performance
   * @param timeWindow - Time window in milliseconds
   * @returns Performance analysis
   */
  analyzePerformance(timeWindow: number = 3600000): {
    hitRate: number
    missRate: number
    hotKeys: Array<{ key: string; accessCount: number }>
    coldKeys: Array<{ key: string; lastAccess: number }>
    recommendations: string[]
  } {
    const now = Date.now()
    const windowStart = now - timeWindow

    // Filter recent accesses
    const recentAccesses = this.accessLog.filter(
      (log) => log.timestamp >= windowStart
    )

    // Calculate hit/miss rates
    const hits = recentAccesses.filter((log) => log.hit).length
    const total = recentAccesses.length
    const hitRate = total > 0 ? hits / total : 0
    const missRate = 1 - hitRate

    // Find hot keys
    const keyAccess = new Map<string, number>()
    for (const log of recentAccesses) {
      keyAccess.set(log.key, (keyAccess.get(log.key) || 0) + 1)
    }

    const hotKeys = Array.from(keyAccess.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, accessCount]) => ({ key, accessCount }))

    // Find cold keys (in cache but not accessed recently)
    const coldKeys: Array<{ key: string; lastAccess: number }> = []
    for (const { key, entry } of this.cache.getEntries()) {
      if (entry.lastAccess < windowStart) {
        coldKeys.push({ key, lastAccess: entry.lastAccess })
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      hitRate,
      hotKeys.length,
      coldKeys.length
    )

    return {
      hitRate,
      missRate,
      hotKeys,
      coldKeys,
      recommendations
    }
  }

  /**
   * Generate performance recommendations
   * @param hitRate - Current hit rate
   * @param hotKeyCount - Number of hot keys
   * @param coldKeyCount - Number of cold keys
   * @returns Array of recommendations
   */
  private generateRecommendations(
    hitRate: number,
    hotKeyCount: number,
    coldKeyCount: number
  ): string[] {
    const recommendations: string[] = []

    if (hitRate < 0.5) {
      recommendations.push(
        "Low hit rate - consider increasing cache size or adjusting TTL"
      )
    }

    if (hotKeyCount < 5) {
      recommendations.push(
        "Few hot keys detected - cache warming might be beneficial"
      )
    }

    if (coldKeyCount > 100) {
      recommendations.push(
        "Many cold keys in cache - consider more aggressive eviction"
      )
    }

    if (hitRate > 0.9) {
      recommendations.push("Excellent hit rate - cache is well-tuned")
    }

    return recommendations
  }
}
