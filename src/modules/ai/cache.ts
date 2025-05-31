// Caching implementation for AI responses

import { Storage } from "@plasmohq/storage"
import type { CacheConfig } from "./types"

interface CacheEntry {
  key: string
  value: any
  timestamp: number
  size: number
  hits: number
}

export class AICache {
  private storage: Storage
  private memoryCache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig = {
    enabled: true,
    ttl: 3600, // 1 hour default
    maxSize: 100, // 100 MB default
    strategy: 'lru'
  }
  private currentSize: number = 0

  constructor() {
    this.storage = new Storage({ area: "local" })
    this.loadCache()
  }

  configure(config: CacheConfig) {
    this.config = config
    if (!config.enabled) {
      this.clear()
    }
  }

  async loadCache() {
    const cacheData = await this.storage.get("ai_cache_data")
    if (cacheData && Array.isArray(cacheData)) {
      for (const entry of cacheData) {
        this.memoryCache.set(entry.key, entry)
        this.currentSize += entry.size
      }
    }
  }

  async saveCache() {
    const entries = Array.from(this.memoryCache.values())
    await this.storage.set("ai_cache_data", entries)
  }

  generateKey(method: string, ...args: any[]): string {
    const serialized = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, Object.keys(arg).sort())
      }
      return String(arg)
    }).join('|')

    return `${method}:${this.hashString(serialized)}`
  }

  async get(key: string): Promise<any | null> {
    if (!this.config.enabled) return null

    const entry = this.memoryCache.get(key)
    if (!entry) return null

    // Check if expired
    const age = Date.now() - entry.timestamp
    if (age > this.config.ttl * 1000) {
      this.memoryCache.delete(key)
      this.currentSize -= entry.size
      return null
    }

    // Update hits for LFU strategy
    entry.hits++

    // Move to end for LRU strategy
    if (this.config.strategy === 'lru') {
      this.memoryCache.delete(key)
      this.memoryCache.set(key, entry)
    }

    return entry.value
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.config.enabled) return

    const size = this.estimateSize(value)

    // Check if we need to evict entries
    while (this.currentSize + size > this.config.maxSize * 1024 * 1024) {
      this.evictEntry()
    }

    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      size,
      hits: 1
    }

    this.memoryCache.set(key, entry)
    this.currentSize += size

    // Periodically save to storage
    if (this.memoryCache.size % 10 === 0) {
      this.saveCache()
    }
  }

  private evictEntry() {
    if (this.memoryCache.size === 0) return

    let keyToEvict: string | null = null

    switch (this.config.strategy) {
      case 'lru':
        // First entry is least recently used
        keyToEvict = this.memoryCache.keys().next().value
        break

      case 'lfu':
        // Find entry with least hits
        let minHits = Infinity
        for (const [key, entry] of this.memoryCache.entries()) {
          if (entry.hits < minHits) {
            minHits = entry.hits
            keyToEvict = key
          }
        }
        break

      case 'fifo':
        // Find oldest entry
        let oldestTime = Infinity
        for (const [key, entry] of this.memoryCache.entries()) {
          if (entry.timestamp < oldestTime) {
            oldestTime = entry.timestamp
            keyToEvict = key
          }
        }
        break
    }

    if (keyToEvict) {
      const entry = this.memoryCache.get(keyToEvict)
      if (entry) {
        this.currentSize -= entry.size
        this.memoryCache.delete(keyToEvict)
      }
    }
  }

  async clear() {
    this.memoryCache.clear()
    this.currentSize = 0
    await this.storage.remove("ai_cache_data")
  }

  getStats() {
    const entries = Array.from(this.memoryCache.values())
    return {
      entries: this.memoryCache.size,
      size: this.currentSize,
      sizeInMB: (this.currentSize / 1024 / 1024).toFixed(2),
      oldestEntry: entries.reduce((min, e) => e.timestamp < min ? e.timestamp : min, Infinity),
      averageHits: entries.reduce((sum, e) => sum + e.hits, 0) / entries.length || 0
    }
  }

  private estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2 // 2 bytes per character
    } else if (value instanceof Blob) {
      return value.size
    } else if (typeof value === 'object') {
      return JSON.stringify(value).length * 2
    } else {
      return 8 // Default for numbers, booleans, etc.
    }
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
}