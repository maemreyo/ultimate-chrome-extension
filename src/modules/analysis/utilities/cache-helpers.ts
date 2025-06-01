// src/modules/analysis/utilities/cache-helpers.ts
// Caching utilities for analysis results

import type { AnalysisRequest, AnalysisResult } from "../types"

/**
 * Generate cache key for analysis request
 * @param request - Analysis request
 * @returns Cache key string
 */
export function generateCacheKey(request: AnalysisRequest): string {
  const { type, inputs, options } = request

  // Create a deterministic key from request data
  const keyData = {
    type,
    inputs: sortObject(inputs),
    options: options ? sortObject(options) : undefined
  }

  return btoa(JSON.stringify(keyData)).replace(/[+/=]/g, "")
}

/**
 * Sort object keys recursively for consistent hashing
 * @param obj - Object to sort
 * @returns Sorted object
 */
function sortObject(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObject)
  }

  const sorted: any = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObject(obj[key])
    })

  return sorted
}

/**
 * Check if cached result is still valid
 * @param cachedResult - Cached analysis result
 * @param maxAge - Maximum age in milliseconds
 * @returns True if cache is valid
 */
export function isCacheValid(
  cachedResult: AnalysisResult,
  maxAge: number = 3600000 // 1 hour default
): boolean {
  if (!cachedResult.metadata.completedAt) {
    return false
  }

  const age = Date.now() - cachedResult.metadata.completedAt.getTime()
  return age < maxAge
}

/**
 * Create cache metadata
 * @param result - Analysis result
 * @returns Cache metadata
 */
export function createCacheMetadata(result: AnalysisResult): {
  key: string
  size: number
  createdAt: Date
  accessCount: number
  lastAccessed: Date
} {
  const serialized = JSON.stringify(result)

  return {
    key: result.id,
    size: new Blob([serialized]).size,
    createdAt: result.metadata.completedAt || new Date(),
    accessCount: 0,
    lastAccessed: new Date()
  }
}

/**
 * Simple LRU cache implementation for analysis results
 */
export class AnalysisCache {
  private cache = new Map<string, AnalysisResult>()
  private metadata = new Map<string, ReturnType<typeof createCacheMetadata>>()
  private maxSize: number
  private maxAge: number

  constructor(maxSize: number = 100, maxAge: number = 3600000) {
    this.maxSize = maxSize
    this.maxAge = maxAge
  }

  /**
   * Get cached result
   * @param key - Cache key
   * @returns Cached result or null
   */
  get(key: string): AnalysisResult | null {
    const result = this.cache.get(key)
    const meta = this.metadata.get(key)

    if (!result || !meta) {
      return null
    }

    // Check if cache is still valid
    if (!isCacheValid(result, this.maxAge)) {
      this.delete(key)
      return null
    }

    // Update access metadata
    meta.accessCount++
    meta.lastAccessed = new Date()

    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, result)

    return result
  }

  /**
   * Set cached result
   * @param key - Cache key
   * @param result - Analysis result
   */
  set(key: string, result: AnalysisResult): void {
    // Remove oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.delete(oldestKey)
    }

    this.cache.set(key, result)
    this.metadata.set(key, createCacheMetadata(result))
  }

  /**
   * Delete cached result
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key)
    this.metadata.delete(key)
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear()
    this.metadata.clear()
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalSize: number
    oldestEntry?: Date
    newestEntry?: Date
  } {
    const totalAccess = Array.from(this.metadata.values()).reduce(
      (sum, meta) => sum + meta.accessCount,
      0
    )

    const totalSize = Array.from(this.metadata.values()).reduce(
      (sum, meta) => sum + meta.size,
      0
    )

    const dates = Array.from(this.metadata.values()).map(
      (meta) => meta.createdAt
    )
    const oldestEntry =
      dates.length > 0
        ? new Date(Math.min(...dates.map((d) => d.getTime())))
        : undefined
    const newestEntry =
      dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : undefined

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? this.cache.size / totalAccess : 0,
      totalSize,
      oldestEntry,
      newestEntry
    }
  }

  /**
   * Get cache entries sorted by access frequency
   * @returns Sorted cache entries
   */
  getMostAccessed(): Array<{
    key: string
    accessCount: number
    lastAccessed: Date
  }> {
    return Array.from(this.metadata.entries())
      .map(([key, meta]) => ({
        key,
        accessCount: meta.accessCount,
        lastAccessed: meta.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now()

    for (const [key, meta] of this.metadata.entries()) {
      const age = now - meta.createdAt.getTime()
      if (age > this.maxAge) {
        this.delete(key)
      }
    }
  }
}

/**
 * Create cache key for similar analysis requests
 * @param request - Analysis request
 * @param similarity - Similarity threshold (0-1)
 * @returns Array of similar cache keys
 */
export function findSimilarCacheKeys(
  request: AnalysisRequest,
  cachedKeys: string[],
  similarity: number = 0.8
): string[] {
  const requestKey = generateCacheKey(request)
  const similar: string[] = []

  for (const key of cachedKeys) {
    const sim = calculateKeySimilarity(requestKey, key)
    if (sim >= similarity) {
      similar.push(key)
    }
  }

  return similar.sort((a, b) => {
    const simA = calculateKeySimilarity(requestKey, a)
    const simB = calculateKeySimilarity(requestKey, b)
    return simB - simA
  })
}

/**
 * Calculate similarity between two cache keys
 * @param key1 - First cache key
 * @param key2 - Second cache key
 * @returns Similarity score (0-1)
 */
function calculateKeySimilarity(key1: string, key2: string): number {
  if (key1 === key2) return 1

  const len1 = key1.length
  const len2 = key2.length
  const maxLen = Math.max(len1, len2)

  if (maxLen === 0) return 1

  let matches = 0
  const minLen = Math.min(len1, len2)

  for (let i = 0; i < minLen; i++) {
    if (key1[i] === key2[i]) {
      matches++
    }
  }

  return matches / maxLen
}
