# AI Module - Complete Implementation Plan

## 🎯 ARCHITECTURE OVERVIEW

### Core Components

```
AI Module
├── Core Engine
│   ├── Provider Management
│   ├── Request Processing
│   └── Response Handling
├── Infrastructure
│   ├── Rate Limiting
│   ├── Caching Layer
│   ├── Retry Mechanism
│   └── Token Management
├── Monitoring & Analytics
│   ├── Performance Metrics
│   ├── Error Tracking
│   └── Usage Analytics
└── Configuration & Security
    ├── API Key Management
    ├── Environment Config
    └── Security Middleware
```

## 📦 TECHNOLOGY STACK

### Dependencies

```json
{
  "dependencies": {
    "llm-interface": "^2.0.0",
    "@ai-sdk/core": "^3.0.0",
    "tiktoken": "^1.0.0",
    "gpt-tokenizer": "^2.0.0",
    "lru-cache": "^10.0.0",
    "llm-cache": "^1.0.0",
    "p-retry": "^5.0.0",
    "exponential-backoff": "^3.0.0",
    "bottleneck": "^2.0.0",
    "verror": "^1.10.0",
    "boom": "^7.0.0",
    "prom-client": "^15.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "autocannon": "^7.0.0",
    "clinic": "^13.0.0"
  }
}
```

## 🏗️ IMPLEMENTATION PHASES

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Project Setup

```bash
# Initialize project
mkdir ai-module && cd ai-module
pnpm init
pnpm add llm-interface @ai-sdk/core tiktoken lru-cache p-retry bottleneck verror zod
pnpm add -D vitest @types/node typescript
```

#### 1.2 Core Types & Interfaces

```typescript
// types/index.ts
export interface AIProviderConfig {
  name: string
  apiKey: string
  baseUrl?: string
  model: string
  maxTokens?: number
  temperature?: number
  rateLimits?: RateLimitConfig
}

export interface RateLimitConfig {
  requestsPerMinute: number
  tokensPerMinute: number
  concurrent: number
}

export interface AIRequest {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  metadata?: Record<string, any>
}

export interface AIResponse {
  content: string
  usage: TokenUsage
  model: string
  provider: string
  cached: boolean
  latency: number
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}
```

#### 1.3 Configuration Management

```typescript
// config/index.ts
import { z } from "zod"

const AIConfigSchema = z.object({
  providers: z.array(
    z.object({
      name: z.string(),
      apiKey: z.string(),
      model: z.string(),
      rateLimits: z
        .object({
          requestsPerMinute: z.number().default(60),
          tokensPerMinute: z.number().default(100000),
          concurrent: z.number().default(5)
        })
        .optional()
    })
  ),
  cache: z
    .object({
      enabled: z.boolean().default(true),
      maxSize: z.number().default(1000),
      ttl: z.number().default(600000) // 10 minutes
    })
    .optional(),
  retry: z
    .object({
      maxAttempts: z.number().default(3),
      baseDelay: z.number().default(1000),
      maxDelay: z.number().default(30000)
    })
    .optional()
})

export type AIConfig = z.infer<typeof AIConfigSchema>

export class ConfigManager {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = AIConfigSchema.parse(config)
  }

  getProviderConfig(name: string) {
    return this.config.providers.find((p) => p.name === name)
  }

  getCacheConfig() {
    return this.config.cache
  }

  getRetryConfig() {
    return this.config.retry
  }
}
```

### Phase 2: Core Components (Week 2-3)

#### 2.1 Token Management

```typescript
// core/token-manager.ts
import { encode } from "gpt-tokenizer"
import { encoding_for_model } from "tiktoken"

export class TokenManager {
  private encoders = new Map()

  async countTokens(text: string, model: string): Promise<number> {
    try {
      // Use tiktoken for OpenAI models
      if (model.includes("gpt") || model.includes("davinci")) {
        const enc = encoding_for_model(model as any)
        return enc.encode(text).length
      }

      // Use gpt-tokenizer as fallback
      return encode(text).length
    } catch (error) {
      // Fallback to rough estimation
      return Math.ceil(text.length / 4)
    }
  }

  async validateTokenLimits(
    request: AIRequest,
    maxTokens: number
  ): Promise<boolean> {
    const promptTokens = await this.countTokens(
      request.prompt,
      request.model || "gpt-4"
    )
    const requestedTokens = request.maxTokens || 1000

    return promptTokens + requestedTokens <= maxTokens
  }
}
```

#### 2.2 Advanced Caching System

```typescript
// core/cache-manager.ts
import crypto from "crypto"
import { LLMCache } from "llm-cache"
import LRU from "lru-cache"

export class CacheManager {
  private memoryCache: LRU<string, any>
  private semanticCache: LLMCache
  private enabled: boolean

  constructor(config: { maxSize: number; ttl: number; enabled: boolean }) {
    this.enabled = config.enabled
    this.memoryCache = new LRU({
      max: config.maxSize,
      ttl: config.ttl
    })

    if (this.enabled) {
      this.semanticCache = new LLMCache({
        similarityThreshold: 0.85
      })
    }
  }

  private generateCacheKey(request: AIRequest): string {
    const key = {
      prompt: request.prompt,
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.maxTokens
    }
    return crypto.createHash("sha256").update(JSON.stringify(key)).digest("hex")
  }

  async get(request: AIRequest): Promise<AIResponse | null> {
    if (!this.enabled) return null

    const cacheKey = this.generateCacheKey(request)

    // Try memory cache first
    const memoryCached = this.memoryCache.get(cacheKey)
    if (memoryCached) {
      return { ...memoryCached, cached: true }
    }

    // Try semantic cache
    try {
      const semanticResult = await this.semanticCache.get(request.prompt)
      if (semanticResult) {
        return { ...semanticResult, cached: true }
      }
    } catch (error) {
      console.warn("Semantic cache error:", error)
    }

    return null
  }

  async set(request: AIRequest, response: AIResponse): Promise<void> {
    if (!this.enabled) return

    const cacheKey = this.generateCacheKey(request)

    // Store in memory cache
    this.memoryCache.set(cacheKey, response)

    // Store in semantic cache
    try {
      await this.semanticCache.set(request.prompt, response)
    } catch (error) {
      console.warn("Semantic cache store error:", error)
    }
  }

  getStats() {
    return {
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.memoryCache.max
      }
    }
  }
}
```

#### 2.3 Retry Mechanism

```typescript
// core/retry-manager.ts
import pRetry from "p-retry"
import VError from "verror"

export class RetryManager {
  private config: {
    maxAttempts: number
    baseDelay: number
    maxDelay: number
  }

  constructor(config: {
    maxAttempts: number
    baseDelay: number
    maxDelay: number
  }) {
    this.config = config
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: { provider: string; model: string }
  ): Promise<T> {
    return pRetry(
      async (attemptNumber) => {
        try {
          return await operation()
        } catch (error) {
          const wrappedError = new VError(
            {
              name: "AIProviderError",
              cause: error,
              info: { ...context, attempt: attemptNumber }
            },
            `Failed to execute AI request (attempt ${attemptNumber})`
          )

          // Don't retry on certain errors
          if (this.shouldNotRetry(error)) {
            throw new pRetry.AbortError(wrappedError)
          }

          throw wrappedError
        }
      },
      {
        retries: this.config.maxAttempts - 1,
        factor: 2,
        minTimeout: this.config.baseDelay,
        maxTimeout: this.config.maxDelay,
        randomize: true
      }
    )
  }

  private shouldNotRetry(error: any): boolean {
    // Don't retry authentication errors, invalid requests, etc.
    const nonRetryableStatuses = [400, 401, 403, 404, 422]
    return nonRetryableStatuses.includes(error.status)
  }
}
```

#### 2.4 Rate Limiting

```typescript
// core/rate-limiter.ts
import Bottleneck from "bottleneck"

export class RateLimiter {
  private limiters = new Map<string, Bottleneck>()

  constructor() {}

  createLimiter(
    providerId: string,
    config: {
      requestsPerMinute: number
      tokensPerMinute: number
      concurrent: number
    }
  ) {
    const limiter = new Bottleneck({
      maxConcurrent: config.concurrent,
      minTime: Math.floor(60000 / config.requestsPerMinute), // Convert to ms per request
      reservoir: config.requestsPerMinute,
      reservoirRefreshAmount: config.requestsPerMinute,
      reservoirRefreshInterval: 60000 // 1 minute
    })

    this.limiters.set(providerId, limiter)
    return limiter
  }

  getLimiter(providerId: string): Bottleneck | null {
    return this.limiters.get(providerId) || null
  }

  async schedule<T>(
    providerId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const limiter = this.getLimiter(providerId)
    if (!limiter) {
      throw new Error(`No rate limiter found for provider: ${providerId}`)
    }

    return limiter.schedule(operation)
  }

  getStats() {
    const stats: Record<string, any> = {}

    for (const [providerId, limiter] of this.limiters) {
      stats[providerId] = {
        running: limiter.running(),
        queued: limiter.queued(),
        reservoir: limiter.reservoir()
      }
    }

    return stats
  }
}
```

### Phase 3: Provider Integration (Week 3-4)

#### 3.1 Unified Provider Interface

```typescript
// providers/base-provider.ts
import { LLMInterface } from "llm-interface"

export abstract class BaseProvider {
  protected client: LLMInterface
  protected config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
    this.client = new LLMInterface({
      provider: config.name,
      apiKey: config.apiKey,
      model: config.model
    })
  }

  abstract generateText(request: AIRequest): Promise<AIResponse>
  abstract streamText(request: AIRequest): AsyncGenerator<string>
  abstract validateRequest(request: AIRequest): Promise<boolean>
}
```

#### 3.2 Provider Manager

```typescript
// core/provider-manager.ts
import { AnthropicProvider } from "../providers/anthropic-provider"
import { BaseProvider } from "../providers/base-provider"
import { OpenAIProvider } from "../providers/openai-provider"

export class ProviderManager {
  private providers = new Map<string, BaseProvider>()
  private defaultProvider: string

  constructor(configs: AIProviderConfig[]) {
    for (const config of configs) {
      const provider = this.createProvider(config)
      this.providers.set(config.name, provider)
    }

    this.defaultProvider = configs[0]?.name
  }

  private createProvider(config: AIProviderConfig): BaseProvider {
    switch (config.name.toLowerCase()) {
      case "openai":
        return new OpenAIProvider(config)
      case "anthropic":
        return new AnthropicProvider(config)
      default:
        throw new Error(`Unsupported provider: ${config.name}`)
    }
  }

  getProvider(name?: string): BaseProvider {
    const providerName = name || this.defaultProvider
    const provider = this.providers.get(providerName)

    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`)
    }

    return provider
  }

  getAllProviders(): string[] {
    return Array.from(this.providers.keys())
  }
}
```

### Phase 4: Monitoring & Analytics (Week 4-5)

#### 4.1 Performance Metrics

```typescript
// monitoring/metrics.ts
import { Counter, Gauge, Histogram, register } from "prom-client"

export class MetricsCollector {
  private requestCounter: Counter<string>
  private responseLatency: Histogram<string>
  private tokenUsage: Counter<string>
  private activeRequests: Gauge<string>
  private cacheHitRate: Counter<string>

  constructor() {
    this.requestCounter = new Counter({
      name: "ai_requests_total",
      help: "Total number of AI requests",
      labelNames: ["provider", "model", "status"]
    })

    this.responseLatency = new Histogram({
      name: "ai_response_duration_seconds",
      help: "AI response latency in seconds",
      labelNames: ["provider", "model"],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    })

    this.tokenUsage = new Counter({
      name: "ai_tokens_used_total",
      help: "Total tokens used",
      labelNames: ["provider", "model", "type"]
    })

    this.activeRequests = new Gauge({
      name: "ai_active_requests",
      help: "Number of active AI requests",
      labelNames: ["provider"]
    })

    this.cacheHitRate = new Counter({
      name: "ai_cache_hits_total",
      help: "Cache hits and misses",
      labelNames: ["type"]
    })
  }

  recordRequest(provider: string, model: string, status: "success" | "error") {
    this.requestCounter.inc({ provider, model, status })
  }

  recordLatency(provider: string, model: string, duration: number) {
    this.responseLatency.observe({ provider, model }, duration)
  }

  recordTokenUsage(provider: string, model: string, usage: TokenUsage) {
    this.tokenUsage.inc({ provider, model, type: "prompt" }, usage.promptTokens)
    this.tokenUsage.inc(
      { provider, model, type: "completion" },
      usage.completionTokens
    )
  }

  recordActiveRequest(provider: string, delta: number) {
    this.activeRequests.inc({ provider }, delta)
  }

  recordCacheHit(hit: boolean) {
    this.cacheHitRate.inc({ type: hit ? "hit" : "miss" })
  }

  getMetrics() {
    return register.metrics()
  }
}
```

### Phase 5: Main AI Engine (Week 5-6)

#### 5.1 Core AI Engine

```typescript
// index.ts
import { ConfigManager } from './config'
import { ProviderManager } from './core/provider-manager'
import { CacheManager } from './core/cache-manager'
import { RetryManager } from './core/retry-manager'
import { RateLimiter } from './core/rate-limiter'
import { TokenManager } from './core/token-manager'
import { MetricsCollector } from './monitoring/metrics'

export class AIEngine {
  private config: ConfigManager
  private providers: ProviderManager
  private cache: CacheManager
  private retry: RetryManager
  private rateLimiter: RateLimiter
  private tokenManager: TokenManager
  private metrics: MetricsCollector

  constructor(config: AIConfig) {
    this.config = new ConfigManager(config)
    this.providers = new ProviderManager(config.providers)
    this.cache = new CacheManager(this.config.getCacheConfig())
    this.retry = new RetryManager(this.config.getRetryConfig())
    this.rateLimiter = new RateLimiter()
    this.tokenManager = new TokenManager()
    this.metrics = new MetricsCollector()

    this.initializeRateLimiters()
  }

  private initializeRateLimiters() {
    for (const provider of this.config.config.providers) {
      if (provider.rateLimits) {
        this.rateLimiter.createLimiter(provider.name, provider.rateLimits)
      }
    }
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    const provider = this.providers.getProvider(request.model)
    const providerName = provider.config.name

    try {
      // Check cache first
      const cached = await this.cache.get(request)
      if (cached) {
        this.metrics.recordCacheHit(true)
        this.metrics.recordRequest(providerName, request.model || 'default', 'success')
        return cached
      }
      this.metrics.recordCacheHit(false)

      // Validate token limits
      const maxTokens = provider.config.maxTokens || 4000
      const isValidRequest = await this.tokenManager.validateTokenLimits(request, maxTokens)
      if (!isValidRequest) {
        throw new Error('Request exceeds token limits')
      }

      // Track active request
      this.metrics.recordActiveRequest(providerName, 1)

      try {
        // Execute with rate limiting and retry
        const response = await this.rateLimiter.schedule(
          providerName,
          () => this.retry.execute(
            () => provider.generateText(request),
            { provider: providerName, model: request.model || 'default' }
          )
        )

        // Add latency info
        response.latency = Date.now() - startTime

        // Cache the response
        await this.cache.set(request, response)

        // Record metrics
        this.metrics.recordRequest(providerName, request.model || 'default', 'success')
        this.metrics.recordLatency(providerName, request.model || 'default', response.latency / 1000)
        this.metrics.recordTokenUsage(providerName, request.model || 'default', response.usage)

        return response

      } finally {
        this.metrics.recordActiveRequest(providerName, -1)
      }

    } catch (error) {
      this.metrics.recordRequest(providerName, request.model || 'default', 'error')
      throw error
    }
  }

  async streamText(request: AIRequest): AsyncGenerator<string> {
    const provider = this.providers.getProvider(request.model)
    const providerName = provider.config.name

    this.metrics.recordActiveRequest(providerName, 1)

    try {
      yield* this.rateLimiter.schedule(
        providerName,
        () => provider.streamText(request)
      )
    } finally {
      this.metrics.recordActiveRequest(providerName, -1)
    }
  }

  // Health check and status
  getStatus() {
    return {
      providers: this.providers.getAllProviders(),
      cache: this.cache.getStats(),
      rateLimiter: this.rateLimiter.getStats(),
      uptime: process.uptime()
    }
  }

  getMetrics() {
    return this.metrics.getMetrics()
  }
}

// Export for easy usage
export { AIConfig, AIRequest, AIResponse, TokenUsage }
export default AIEngine
```

### Phase 6: Testing & Deployment (Week 6)

#### 6.1 Test Suite

```typescript
// tests/ai-engine.test.ts
import { beforeEach, describe, expect, it } from "vitest"
import AIEngine from "../src/index"

describe("AIEngine", () => {
  let engine: AIEngine

  beforeEach(() => {
    engine = new AIEngine({
      providers: [
        {
          name: "openai",
          apiKey: "test-key",
          model: "gpt-4",
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 100000,
            concurrent: 5
          }
        }
      ],
      cache: { enabled: true, maxSize: 100, ttl: 60000 },
      retry: { maxAttempts: 3, baseDelay: 1000, maxDelay: 10000 }
    })
  })

  it("should generate text successfully", async () => {
    const response = await engine.generateText({
      prompt: "Hello, world!",
      model: "gpt-4"
    })

    expect(response).toHaveProperty("content")
    expect(response).toHaveProperty("usage")
    expect(response.provider).toBe("openai")
  })

  it("should cache responses", async () => {
    const request = { prompt: "Test prompt", model: "gpt-4" }

    const first = await engine.generateText(request)
    const second = await engine.generateText(request)

    expect(second.cached).toBe(true)
  })

  it("should handle rate limiting", async () => {
    const promises = Array(10)
      .fill(null)
      .map(() => engine.generateText({ prompt: "Test", model: "gpt-4" }))

    const results = await Promise.all(promises)
    expect(results).toHaveLength(10)
  })
})
```

#### 6.2 Example Usage

```typescript
// example/usage.ts
import AIEngine from "../src/index"

async function main() {
  const engine = new AIEngine({
    providers: [
      {
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY!,
        model: "gpt-4",
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerMinute: 100000,
          concurrent: 5
        }
      },
      {
        name: "anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY!,
        model: "claude-3-sonnet",
        rateLimits: {
          requestsPerMinute: 50,
          tokensPerMinute: 80000,
          concurrent: 3
        }
      }
    ],
    cache: {
      enabled: true,
      maxSize: 1000,
      ttl: 600000 // 10 minutes
    },
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000
    }
  })

  // Generate text
  const response = await engine.generateText({
    prompt: "Write a haiku about programming",
    temperature: 0.7,
    maxTokens: 100
  })

  console.log("Response:", response.content)
  console.log("Tokens used:", response.usage.totalTokens)
  console.log("Cached:", response.cached)
  console.log("Latency:", response.latency, "ms")

  // Stream text
  for await (const chunk of engine.streamText({
    prompt: "Tell me a story",
    temperature: 0.8
  })) {
    process.stdout.write(chunk)
  }

  // Get status
  console.log("\nEngine Status:", engine.getStatus())

  // Get metrics (Prometheus format)
  console.log("\nMetrics:", engine.getMetrics())
}

main().catch(console.error)
```

## 🚀 DEPLOYMENT CHECKLIST

### Pre-deployment

- [ ] All tests passing
- [ ] Performance benchmarks completed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Environment variables configured

### Monitoring Setup

- [ ] Prometheus metrics endpoint configured
- [ ] Grafana dashboards created
- [ ] Alerting rules configured
- [ ] Log aggregation setup

### Production Configuration

```typescript
// config/production.ts
export const productionConfig = {
  providers: [
    {
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4",
      rateLimits: {
        requestsPerMinute: 3000,
        tokensPerMinute: 1000000,
        concurrent: 50
      }
    }
  ],
  cache: {
    enabled: true,
    maxSize: 10000,
    ttl: 3600000 // 1 hour
  },
  retry: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000
  }
}
```

## 📊 SUCCESS METRICS

### Performance KPIs

- Response latency < 2 seconds (95th percentile)
- Cache hit rate > 40%
- Error rate < 1%
- Throughput > 1000 requests/minute

### Business KPIs

- Token cost reduction > 30% (through caching)
- Developer productivity improvement
- Reduced maintenance overhead
- Improved reliability (99.9% uptime)

---

_This implementation plan provides a complete, production-ready AI module built with industry best practices and battle-tested libraries._
