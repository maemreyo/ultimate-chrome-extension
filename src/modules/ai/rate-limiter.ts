// Rate limiting implementation for AI API calls

import type { RateLimitConfig } from "./types"

interface RateLimitBucket {
  tokens: number
  lastRefill: number
}

interface RequestWindow {
  count: number
  start: number
}

export class AIRateLimiter {
  private config: RateLimitConfig | null = null
  private buckets: Map<string, RateLimitBucket> = new Map()
  private windows: Map<string, RequestWindow[]> = new Map()

  configure(config: RateLimitConfig) {
    this.config = config
    this.reset()
  }

  async checkLimit(provider?: string): Promise<void> {
    if (!this.config) return

    const key = provider || 'default'

    switch (this.config.strategy) {
      case 'token-bucket':
        await this.checkTokenBucket(key)
        break
      case 'sliding-window':
        await this.checkSlidingWindow(key)
        break
      case 'fixed-window':
        await this.checkFixedWindow(key)
        break
    }
  }

  private async checkTokenBucket(key: string) {
    if (!this.config) return

    let bucket = this.buckets.get(key)
    const now = Date.now()

    if (!bucket) {
      bucket = {
        tokens: this.config.requestsPerMinute || 60,
        lastRefill: now
      }
      this.buckets.set(key, bucket)
    }

    // Refill tokens based on time elapsed
    const timePassed = now - bucket.lastRefill
    const minutesPassed = timePassed / 60000
    const tokensToAdd = minutesPassed * (this.config.requestsPerMinute || 60)

    bucket.tokens = Math.min(
      bucket.tokens + tokensToAdd,
      this.config.requestsPerMinute || 60
    )
    bucket.lastRefill = now

    // Check if we have tokens available
    if (bucket.tokens < 1) {
      const waitTime = (1 - bucket.tokens) * 60000 / (this.config.requestsPerMinute || 60)
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    // Consume a token
    bucket.tokens -= 1
  }

  private async checkSlidingWindow(key: string) {
    if (!this.config) return

    const now = Date.now()
    const windowSize = 60000 // 1 minute in milliseconds
    const limit = this.config.requestsPerMinute || 60

    let windows = this.windows.get(key) || []

    // Remove windows outside the current time window
    windows = windows.filter(w => now - w.start < windowSize)

    // Count requests in the current window
    const requestCount = windows.reduce((sum, w) => sum + w.count, 0)

    if (requestCount >= limit) {
      const oldestWindow = windows[0]
      const waitTime = oldestWindow ? (oldestWindow.start + windowSize - now) : 1000
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    // Add current request
    const currentWindow = windows.find(w => now - w.start < 1000) // 1 second buckets
    if (currentWindow) {
      currentWindow.count++
    } else {
      windows.push({ count: 1, start: now })
    }

    this.windows.set(key, windows)
  }

  private async checkFixedWindow(key: string) {
    if (!this.config) return

    const now = Date.now()
    const windowSize = 60000 // 1 minute
    const currentWindow = Math.floor(now / windowSize)

    const windowKey = `${key}:${currentWindow}`
    let window = this.windows.get(windowKey)?.[0] || { count: 0, start: currentWindow * windowSize }

    if (window.count >= (this.config.requestsPerMinute || 60)) {
      const waitTime = (currentWindow + 1) * windowSize - now
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    window.count++
    this.windows.set(windowKey, [window])

    // Clean up old windows
    for (const [k] of this.windows.entries()) {
      if (k !== windowKey && k.startsWith(key)) {
        this.windows.delete(k)
      }
    }
  }

  async checkTokenLimit(tokens: number, provider?: string): Promise<void> {
    if (!this.config?.tokensPerMinute) return

    const key = `tokens:${provider || 'default'}`
    const now = Date.now()

    let bucket = this.buckets.get(key)
    if (!bucket) {
      bucket = {
        tokens: this.config.tokensPerMinute,
        lastRefill: now
      }
      this.buckets.set(key, bucket)
    }

    // Refill tokens
    const timePassed = now - bucket.lastRefill
    const minutesPassed = timePassed / 60000
    const tokensToAdd = minutesPassed * this.config.tokensPerMinute

    bucket.tokens = Math.min(
      bucket.tokens + tokensToAdd,
      this.config.tokensPerMinute
    )
    bucket.lastRefill = now

    if (bucket.tokens < tokens) {
      const waitTime = (tokens - bucket.tokens) * 60000 / this.config.tokensPerMinute
      throw new Error(`Token limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    bucket.tokens -= tokens
  }

  reset() {
    this.buckets.clear()
    this.windows.clear()
  }

  getStatus(provider?: string): {
    requestsRemaining: number
    tokensRemaining: number
    resetTime: number
  } {
    const key = provider || 'default'
    const now = Date.now()

    let requestsRemaining = this.config?.requestsPerMinute || 60
    let tokensRemaining = this.config?.tokensPerMinute || 90000
    let resetTime = now + 60000

    if (this.config?.strategy === 'token-bucket') {
      const bucket = this.buckets.get(key)
      if (bucket) {
        requestsRemaining = Math.floor(bucket.tokens)
      }

      const tokenBucket = this.buckets.get(`tokens:${key}`)
      if (tokenBucket) {
        tokensRemaining = Math.floor(tokenBucket.tokens)
      }
    } else if (this.config?.strategy === 'sliding-window') {
      const windows = this.windows.get(key) || []
      const requestCount = windows.reduce((sum, w) => sum + w.count, 0)
      requestsRemaining = (this.config?.requestsPerMinute || 60) - requestCount

      if (windows.length > 0) {
        resetTime = windows[0].start + 60000
      }
    }

    return {
      requestsRemaining: Math.max(0, requestsRemaining),
      tokensRemaining: Math.max(0, tokensRemaining),
      resetTime
    }
  }
}