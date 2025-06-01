# Content Extractor Module - Complete Implementation Plan

## 🎯 ARCHITECTURE OVERVIEW

### Core Components

```
Content Extractor Module
├── Core Engine
│   ├── DOM Processing
│   ├── Content Extraction
│   ├── Text Analysis
│   └── Media Processing
├── Extraction Engines
│   ├── Readability Engine
│   ├── Structured Data Engine
│   ├── Media Extraction Engine
│   └── Document Processing Engine
├── Site Adapters
│   ├── Generic Adapter
│   ├── News Sites Adapter
│   ├── Blog Platforms Adapter
│   └── Social Media Adapter
├── Analysis & Enhancement
│   ├── Content Quality Assessment
│   ├── Sentiment Analysis
│   ├── Language Detection
│   └── SEO Metrics
├── Caching & Performance
│   ├── Multi-level Caching
│   ├── Performance Monitoring
│   └── Resource Optimization
└── Configuration & Utils
    ├── Adapter Management
    ├── Configuration System
    └── Utility Functions
```

## 📦 TECHNOLOGY STACK

### Dependencies

```json
{
  "dependencies": {
    "cheerio": "^1.0.0",
    "@mozilla/readability": "^0.4.4",
    "jsdom": "^22.0.0",
    "natural": "^6.0.0",
    "sentiment": "^5.0.2",
    "franc": "^6.0.0",
    "compromise": "^14.0.0",
    "lru-cache": "^10.0.0",
    "keyv": "^4.0.0",
    "image-size": "^1.0.0",
    "probe-image-size": "^7.2.3",
    "file-type": "^18.0.0",
    "sanitize-html": "^2.11.0",
    "normalize-url": "^8.0.0",
    "is-url": "^1.2.4",
    "get-urls": "^12.0.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    "jsonld": "^8.0.0",
    "microdata-node": "^2.0.0",
    "schema-dts": "^1.1.2",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "benchmark": "^2.1.4",
    "perf-hooks": "^0.0.1",
    "@types/cheerio": "^0.22.31",
    "@types/natural": "^5.1.3"
  }
}
```

## 🏗️ IMPLEMENTATION PHASES

### Phase 1: Core Infrastructure & Types (Week 1)

#### 1.1 Project Setup

```bash
# Initialize project
mkdir content-extractor && cd content-extractor
pnpm init
pnpm add cheerio @mozilla/readability jsdom natural sentiment lru-cache zod
pnpm add -D vitest @types/node typescript @types/cheerio
```

#### 1.2 Core Types & Interfaces

```typescript
// types/index.ts
export interface ExtractionConfig {
  engines: EngineConfig[]
  adapters: AdapterConfig[]
  cache?: CacheConfig
  performance?: PerformanceConfig
  content?: ContentConfig
}

export interface EngineConfig {
  name: string
  enabled: boolean
  priority: number
  options?: Record<string, any>
}

export interface AdapterConfig {
  name: string
  domains: string[]
  selectors: SelectorMap
  enabled: boolean
  priority: number
}

export interface SelectorMap {
  title?: string[]
  content?: string[]
  author?: string[]
  publishDate?: string[]
  images?: string[]
  exclude?: string[]
}

export interface ExtractionRequest {
  url: string
  html?: string
  options?: ExtractionOptions
}

export interface ExtractionOptions {
  engines?: string[]
  adapters?: string[]
  extractImages?: boolean
  extractStructuredData?: boolean
  analyzeContent?: boolean
  cleanContent?: boolean
  cacheResults?: boolean
}

export interface ExtractionResult {
  url: string
  title: string
  content: string
  cleanContent: string
  excerpt?: string
  author?: string
  publishDate?: Date
  images: ImageMetadata[]
  links: LinkMetadata[]
  structuredData?: StructuredData[]
  analysis: ContentAnalysis
  metadata: ExtractionMetadata
}

export interface ImageMetadata {
  src: string
  alt?: string
  title?: string
  width?: number
  height?: number
  type?: string
  size?: number
  isMain?: boolean
}

export interface LinkMetadata {
  href: string
  text: string
  title?: string
  rel?: string[]
  type: "internal" | "external"
}

export interface ContentAnalysis {
  wordCount: number
  readingTime: number
  readabilityScore: number
  sentiment: SentimentScore
  language: string
  quality: QualityMetrics
  topics?: string[]
  entities?: string[]
}

export interface SentimentScore {
  score: number
  comparative: number
  positive: string[]
  negative: string[]
}

export interface QualityMetrics {
  score: number
  factors: {
    contentLength: number
    headingStructure: number
    imageRatio: number
    linkDensity: number
    readability: number
  }
}

export interface ExtractionMetadata {
  extractedAt: Date
  processingTime: number
  enginesUsed: string[]
  adaptersUsed: string[]
  cached: boolean
  confidence: number
}

export interface StructuredData {
  type: string
  data: Record<string, any>
  source: "jsonld" | "microdata" | "rdfa"
}
```

#### 1.3 Configuration System

```typescript
// config/index.ts
import { z } from "zod"

const ExtractionConfigSchema = z.object({
  engines: z.array(
    z.object({
      name: z.string(),
      enabled: z.boolean().default(true),
      priority: z.number().default(1),
      options: z.record(z.any()).optional()
    })
  ),
  adapters: z.array(
    z.object({
      name: z.string(),
      domains: z.array(z.string()),
      selectors: z.object({
        title: z.array(z.string()).optional(),
        content: z.array(z.string()).optional(),
        author: z.array(z.string()).optional(),
        publishDate: z.array(z.string()).optional(),
        images: z.array(z.string()).optional(),
        exclude: z.array(z.string()).optional()
      }),
      enabled: z.boolean().default(true),
      priority: z.number().default(1)
    })
  ),
  cache: z
    .object({
      enabled: z.boolean().default(true),
      maxSize: z.number().default(500),
      ttl: z.number().default(600000) // 10 minutes
    })
    .optional(),
  performance: z
    .object({
      timeout: z.number().default(30000),
      maxConcurrent: z.number().default(10),
      retries: z.number().default(3)
    })
    .optional(),
  content: z
    .object({
      minContentLength: z.number().default(100),
      maxContentLength: z.number().default(100000),
      cleanContent: z.boolean().default(true),
      extractImages: z.boolean().default(true),
      analyzeContent: z.boolean().default(true)
    })
    .optional()
})

export type ExtractionConfigType = z.infer<typeof ExtractionConfigSchema>

export class ConfigManager {
  private config: ExtractionConfigType

  constructor(config: ExtractionConfigType) {
    this.config = ExtractionConfigSchema.parse(config)
  }

  getEngineConfig(name: string) {
    return this.config.engines.find((e) => e.name === name)
  }

  getAdapterConfig(domain: string) {
    return this.config.adapters
      .filter((a) => a.domains.some((d) => domain.includes(d)))
      .sort((a, b) => b.priority - a.priority)
  }

  getCacheConfig() {
    return this.config.cache
  }

  getPerformanceConfig() {
    return this.config.performance
  }

  getContentConfig() {
    return this.config.content
  }
}
```

### Phase 2: Core Extraction Engines (Week 2)

#### 2.1 Base Engine Interface

```typescript
// engines/base-engine.ts
export abstract class BaseExtractionEngine {
  protected name: string
  protected config: EngineConfig
  protected priority: number

  constructor(config: EngineConfig) {
    this.name = config.name
    this.config = config
    this.priority = config.priority
  }

  abstract extract(
    request: ExtractionRequest
  ): Promise<Partial<ExtractionResult>>
  abstract canHandle(request: ExtractionRequest): boolean
  abstract getConfidence(result: Partial<ExtractionResult>): number

  getName(): string {
    return this.name
  }

  getPriority(): number {
    return this.priority
  }

  isEnabled(): boolean {
    return this.config.enabled
  }
}
```

#### 2.2 Readability Engine

```typescript
// engines/readability-engine.ts
import { Readability } from "@mozilla/readability"
import * as cheerio from "cheerio"
import { JSDOM } from "jsdom"

export class ReadabilityEngine extends BaseExtractionEngine {
  constructor(config: EngineConfig) {
    super(config)
  }

  async extract(
    request: ExtractionRequest
  ): Promise<Partial<ExtractionResult>> {
    // Implementation details for Readability extraction
    // Using @mozilla/readability for main content extraction
    // DOM cleanup and preparation
    // Content extraction and formatting
  }

  canHandle(request: ExtractionRequest): boolean {
    // Check if engine can process this request
  }

  getConfidence(result: Partial<ExtractionResult>): number {
    // Calculate confidence based on content quality
  }
}
```

#### 2.3 Structured Data Engine

```typescript
// engines/structured-data-engine.ts
import jsonld from "jsonld"
import { extractMicrodata } from "microdata-node"

export class StructuredDataEngine extends BaseExtractionEngine {
  constructor(config: EngineConfig) {
    super(config)
  }

  async extract(
    request: ExtractionRequest
  ): Promise<Partial<ExtractionResult>> {
    // Implementation for structured data extraction
    // JSON-LD processing
    // Microdata extraction
    // RDFa support
    // Schema.org validation
  }

  canHandle(request: ExtractionRequest): boolean {
    // Check for structured data presence
  }

  getConfidence(result: Partial<ExtractionResult>): number {
    // Confidence based on structured data completeness
  }
}
```

#### 2.4 Media Extraction Engine

```typescript
// engines/media-engine.ts
import { fileTypeFromBuffer } from "file-type"
import sizeOf from "image-size"
import probe from "probe-image-size"

export class MediaExtractionEngine extends BaseExtractionEngine {
  constructor(config: EngineConfig) {
    super(config)
  }

  async extract(
    request: ExtractionRequest
  ): Promise<Partial<ExtractionResult>> {
    // Implementation for media extraction
    // Image metadata extraction
    // Video metadata
    // File type detection
    // Size and dimension analysis
  }

  canHandle(request: ExtractionRequest): boolean {
    // Check for media content
  }

  getConfidence(result: Partial<ExtractionResult>): number {
    // Confidence based on media richness
  }
}
```

### Phase 3: Site Adapters System (Week 3)

#### 3.1 Base Adapter Interface

```typescript
// adapters/base-adapter.ts
export abstract class BaseSiteAdapter {
  protected name: string
  protected config: AdapterConfig
  protected selectors: SelectorMap

  constructor(config: AdapterConfig) {
    this.name = config.name
    this.config = config
    this.selectors = config.selectors
  }

  abstract extract(
    request: ExtractionRequest
  ): Promise<Partial<ExtractionResult>>
  abstract canHandle(url: string): boolean
  abstract getSelectors(): SelectorMap

  getName(): string {
    return this.name
  }

  getPriority(): number {
    return this.config.priority
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  getDomains(): string[] {
    return this.config.domains
  }
}
```

#### 3.2 Generic Web Adapter

```typescript
// adapters/generic-adapter.ts
export class GenericWebAdapter extends BaseSiteAdapter {
  constructor(config: AdapterConfig) {
    super(config)
  }

  async extract(
    request: ExtractionRequest
  ): Promise<Partial<ExtractionResult>> {
    // Generic web page extraction logic
    // Fallback selectors for common patterns
    // Heuristic-based content detection
  }

  canHandle(url: string): boolean {
    // Generic adapter handles all URLs as fallback
  }

  getSelectors(): SelectorMap {
    // Return generic selectors
  }
}
```

#### 3.3 News Sites Adapter

```typescript
// adapters/news-adapter.ts
export class NewsSitesAdapter extends BaseSiteAdapter {
  constructor(config: AdapterConfig) {
    super(config)
  }

  async extract(
    request: ExtractionRequest
  ): Promise<Partial<ExtractionResult>> {
    // News-specific extraction logic
    // Article schema detection
    // Byline and date extraction
    // News-specific metadata
  }

  canHandle(url: string): boolean {
    // Check if URL is from known news domains
  }

  getSelectors(): SelectorMap {
    // News-specific selectors
  }
}
```

### Phase 4: Analysis & Enhancement Layer (Week 4)

#### 4.1 Content Analyzer

```typescript
// analysis/content-analyzer.ts
import nlp from "compromise"
import { franc } from "franc"
import natural from "natural"
import Sentiment from "sentiment"

export class ContentAnalyzer {
  private sentiment: Sentiment
  private tokenizer: natural.WordTokenizer

  constructor() {
    this.sentiment = new Sentiment()
    this.tokenizer = new natural.WordTokenizer()
  }

  async analyze(content: string): Promise<ContentAnalysis> {
    // Content analysis implementation
    // Word count and reading time
    // Sentiment analysis
    // Language detection
    // Readability scoring
    // Topic extraction
    // Named entity recognition
  }

  private calculateReadingTime(wordCount: number): number {
    // Reading time calculation (words per minute)
  }

  private calculateReadabilityScore(content: string): number {
    // Flesch reading ease or similar metric
  }

  private extractTopics(content: string): string[] {
    // Topic extraction using NLP
  }

  private extractEntities(content: string): string[] {
    // Named entity recognition
  }
}
```

#### 4.2 Quality Assessment

```typescript
// analysis/quality-assessor.ts
export class QualityAssessor {
  constructor() {}

  assess(result: ExtractionResult): QualityMetrics {
    // Quality assessment implementation
    // Content length evaluation
    // Heading structure analysis
    // Image-to-text ratio
    // Link density calculation
    // Overall quality scoring
  }

  private assessContentLength(content: string): number {
    // Content length quality factor
  }

  private assessHeadingStructure(content: string): number {
    // Heading hierarchy evaluation
  }

  private assessImageRatio(content: string, images: ImageMetadata[]): number {
    // Image distribution analysis
  }

  private assessLinkDensity(content: string, links: LinkMetadata[]): number {
    // Link density evaluation
  }
}
```

### Phase 5: Caching & Performance Layer (Week 5)

#### 5.1 Multi-level Cache Manager

```typescript
// cache/cache-manager.ts
import Keyv from "keyv"
import { LRUCache } from "lru-cache"

export class CacheManager {
  private memoryCache: LRUCache<string, ExtractionResult>
  private persistentCache?: Keyv
  private enabled: boolean

  constructor(config: CacheConfig) {
    this.enabled = config.enabled

    if (this.enabled) {
      this.memoryCache = new LRUCache({
        max: config.maxSize,
        ttl: config.ttl
      })

      // Optional persistent cache setup
      if (config.persistent) {
        this.persistentCache = new Keyv(config.persistentUrl)
      }
    }
  }

  async get(key: string): Promise<ExtractionResult | null> {
    // Multi-level cache retrieval
    // Memory cache first, then persistent
  }

  async set(key: string, result: ExtractionResult): Promise<void> {
    // Multi-level cache storage
  }

  generateCacheKey(request: ExtractionRequest): string {
    // Generate deterministic cache key
  }

  getStats() {
    // Cache statistics
  }

  clear(): void {
    // Clear all caches
  }
}
```

#### 5.2 Performance Monitor

```typescript
// performance/monitor.ts
import { performance } from "perf_hooks"

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]>

  constructor() {
    this.metrics = new Map()
  }

  startTimer(operation: string): PerformanceTimer {
    // Start performance timing
  }

  recordMetric(operation: string, duration: number, metadata?: any): void {
    // Record performance metric
  }

  getMetrics(operation?: string): PerformanceMetric[] {
    // Get performance metrics
  }

  getAverageTime(operation: string): number {
    // Calculate average execution time
  }

  getStats() {
    // Overall performance statistics
  }
}

interface PerformanceTimer {
  stop(): number
}

interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: Date
  metadata?: any
}
```

### Phase 6: Main Content Extractor Engine (Week 6)

#### 6.1 Core Content Extractor

```typescript
// index.ts
import { ContentAnalyzer } from "./analysis/content-analyzer"
import { QualityAssessor } from "./analysis/quality-assessor"
import { CacheManager } from "./cache/cache-manager"
import { ConfigManager } from "./config"
import { PerformanceMonitor } from "./performance/monitor"

export class ContentExtractor {
  private config: ConfigManager
  private cache: CacheManager
  private performance: PerformanceMonitor
  private analyzer: ContentAnalyzer
  private qualityAssessor: QualityAssessor
  private engines: Map<string, BaseExtractionEngine>
  private adapters: Map<string, BaseSiteAdapter>

  constructor(config: ExtractionConfigType) {
    this.config = new ConfigManager(config)
    this.cache = new CacheManager(this.config.getCacheConfig())
    this.performance = new PerformanceMonitor()
    this.analyzer = new ContentAnalyzer()
    this.qualityAssessor = new QualityAssessor()

    this.initializeEngines()
    this.initializeAdapters()
  }

  async extract(request: ExtractionRequest): Promise<ExtractionResult> {
    const timer = this.performance.startTimer("extraction")

    try {
      // Check cache first
      const cacheKey = this.cache.generateCacheKey(request)
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        return { ...cached, metadata: { ...cached.metadata, cached: true } }
      }

      // Determine best adapters and engines
      const adapters = this.selectAdapters(request.url)
      const engines = this.selectEngines(request)

      // Extract content using multiple strategies
      const results = await this.extractWithMultipleStrategies(
        request,
        adapters,
        engines
      )

      // Merge and enhance results
      const mergedResult = await this.mergeResults(results, request)

      // Analyze content
      if (this.config.getContentConfig()?.analyzeContent) {
        mergedResult.analysis = await this.analyzer.analyze(
          mergedResult.content
        )
        mergedResult.analysis.quality =
          this.qualityAssessor.assess(mergedResult)
      }

      // Clean and sanitize content
      if (this.config.getContentConfig()?.cleanContent) {
        mergedResult.cleanContent = await this.cleanContent(
          mergedResult.content
        )
      }

      // Add metadata
      mergedResult.metadata = {
        extractedAt: new Date(),
        processingTime: timer.stop(),
        enginesUsed: engines.map((e) => e.getName()),
        adaptersUsed: adapters.map((a) => a.getName()),
        cached: false,
        confidence: this.calculateOverallConfidence(results)
      }

      // Cache result
      await this.cache.set(cacheKey, mergedResult)

      return mergedResult
    } catch (error) {
      timer.stop()
      throw error
    }
  }

  private initializeEngines(): void {
    // Initialize all extraction engines
    // ReadabilityEngine, StructuredDataEngine, MediaExtractionEngine, etc.
  }

  private initializeAdapters(): void {
    // Initialize all site adapters
    // GenericWebAdapter, NewsSitesAdapter, BlogPlatformsAdapter, etc.
  }

  private selectAdapters(url: string): BaseSiteAdapter[] {
    // Select best adapters for the given URL
  }

  private selectEngines(request: ExtractionRequest): BaseExtractionEngine[] {
    // Select engines based on request options and configuration
  }

  private async extractWithMultipleStrategies(
    request: ExtractionRequest,
    adapters: BaseSiteAdapter[],
    engines: BaseExtractionEngine[]
  ): Promise<
    Array<{
      result: Partial<ExtractionResult>
      confidence: number
      source: string
    }>
  > {
    // Execute multiple extraction strategies
    // Combine adapter-specific and engine-based extraction
  }

  private async mergeResults(
    results: Array<{
      result: Partial<ExtractionResult>
      confidence: number
      source: string
    }>,
    request: ExtractionRequest
  ): Promise<ExtractionResult> {
    // Intelligent result merging based on confidence scores
    // Conflict resolution
    // Data validation and cleaning
  }

  private async cleanContent(content: string): Promise<string> {
    // Content cleaning and sanitization
  }

  private calculateOverallConfidence(
    results: Array<{
      result: Partial<ExtractionResult>
      confidence: number
      source: string
    }>
  ): number {
    // Calculate overall extraction confidence
  }

  // Public API methods
  async extractFromUrl(
    url: string,
    options?: ExtractionOptions
  ): Promise<ExtractionResult> {
    // Extract content from URL (with HTML fetching)
  }

  async extractFromHtml(
    html: string,
    url: string,
    options?: ExtractionOptions
  ): Promise<ExtractionResult> {
    // Extract content from provided HTML
  }

  addAdapter(adapter: BaseSiteAdapter): void {
    // Add custom site adapter
  }

  addEngine(engine: BaseExtractionEngine): void {
    // Add custom extraction engine
  }

  getStats() {
    // Get extraction statistics
  }

  clearCache(): void {
    // Clear extraction cache
  }
}

// Export for easy usage
export * from "./types"
export { ConfigManager } from "./config"
export { BaseExtractionEngine } from "./engines/base-engine"
export { BaseSiteAdapter } from "./adapters/base-adapter"
export default ContentExtractor
```

### Phase 7: Pre-built Adapters Collection (Week 7)

#### 7.1 Popular Sites Adapters

```typescript
// adapters/collections/popular-sites.ts
export const PopularSitesAdapters = {
  "medium.com": new MediumAdapter({
    name: "medium",
    domains: ["medium.com"],
    selectors: {
      title: ['h1[data-testid="storyTitle"]', ".graf--title"],
      content: ["article section", ".postArticle-content"],
      author: ['[data-testid="authorName"]', ".ds-link"],
      publishDate: ['[data-testid="storyPublishDate"]']
    },
    enabled: true,
    priority: 10
  }),

  "dev.to": new DevToAdapter({
    name: "devto",
    domains: ["dev.to"],
    selectors: {
      title: ["h1.crayons-title"],
      content: [".crayons-article__main"],
      author: [".crayons-story__secondary .crayons-link"],
      publishDate: ["time[datetime]"]
    },
    enabled: true,
    priority: 10
  }),

  "stackoverflow.com": new StackOverflowAdapter({
    name: "stackoverflow",
    domains: ["stackoverflow.com"],
    selectors: {
      title: [".question-hyperlink", 'h1[itemprop="name"]'],
      content: [".s-prose.js-post-body", ".post-text"],
      author: [".user-details a"],
      publishDate: [".relativetime"]
    },
    enabled: true,
    priority: 10
  })
}
```

#### 7.2 News Sites Adapters

```typescript
// adapters/collections/news-sites.ts
export const NewsSitesAdapters = {
  "cnn.com": new CNNAdapter({
    name: "cnn",
    domains: ["cnn.com"],
    selectors: {
      title: ["h1.headline__text"],
      content: [".article__content", ".zn-body__paragraph"],
      author: [".byline__name"],
      publishDate: [".timestamp"]
    },
    enabled: true,
    priority: 10
  }),

  "bbc.com": new BBCAdapter({
    name: "bbc",
    domains: ["bbc.com", "bbc.co.uk"],
    selectors: {
      title: ['h1[data-testid="headline"]'],
      content: ['[data-component="text-block"]'],
      author: [".byline__name"],
      publishDate: ["time[datetime]"]
    },
    enabled: true,
    priority: 10
  })
}
```

### Phase 8: Testing & Documentation (Week 8)

#### 8.1 Comprehensive Test Suite

```typescript
// tests/content-extractor.test.ts
import { beforeEach, describe, expect, it } from "vitest"
import ContentExtractor from "../src/index"

describe("ContentExtractor", () => {
  let extractor: ContentExtractor

  beforeEach(() => {
    extractor = new ContentExtractor({
      engines: [
        { name: "readability", enabled: true, priority: 1 },
        { name: "structured-data", enabled: true, priority: 2 }
      ],
      adapters: [
        {
          name: "generic",
          domains: ["*"],
          selectors: {
            title: ["h1", ".title"],
            content: ["article", ".content"]
          },
          enabled: true,
          priority: 1
        }
      ],
      cache: { enabled: true, maxSize: 100, ttl: 60000 }
    })
  })

  describe("Content Extraction", () => {
    it("should extract basic content from HTML", async () => {
      const html = `
        <html>
          <head><title>Test Article</title></head>
          <body>
            <h1>Test Article Title</h1>
            <article>
              <p>This is the main content of the article.</p>
              <p>It contains multiple paragraphs.</p>
            </article>
          </body>
        </html>
      `

      const result = await extractor.extractFromHtml(
        html,
        "https://example.com/test"
      )

      expect(result.title).toBe("Test Article Title")
      expect(result.content).toContain("main content")
      expect(result.analysis.wordCount).toBeGreaterThan(0)
    })

    it("should handle multiple adapters with priority", async () => {
      // Test adapter priority system
    })

    it("should cache extraction results", async () => {
      // Test caching functionality
    })

    it("should analyze content quality", async () => {
      // Test content analysis features
    })
  })

  describe("Site Adapters", () => {
    it("should use site-specific adapters", async () => {
      // Test adapter selection and usage
    })

    it("should fallback to generic adapter", async () => {
      // Test fallback mechanism
    })
  })

  describe("Performance", () => {
    it("should complete extraction within time limits", async () => {
      // Performance benchmarks
    })

    it("should handle concurrent extractions", async () => {
      // Concurrency testing
    })
  })
})
```

#### 8.2 Usage Examples

```typescript
// examples/basic-usage.ts
import ContentExtractor from "../src/index"

// Basic setup
const extractor = new ContentExtractor({
  engines: [
    { name: "readability", enabled: true, priority: 1 },
    { name: "structured-data", enabled: true, priority: 2 },
    { name: "media", enabled: true, priority: 1 }
  ],
  adapters: [
    {
      name: "news",
      domains: ["cnn.com", "bbc.com"],
      selectors: {
        title: ["h1.headline", ".story-title"],
        content: [".story-body", "article"],
        author: [".byline", ".author"],
        publishDate: [".timestamp", "time[datetime]"]
      },
      enabled: true,
      priority: 10
    }
  ],
  cache: { enabled: true, maxSize: 500, ttl: 600000 },
  content: {
    minContentLength: 100,
    cleanContent: true,
    extractImages: true,
    analyzeContent: true
  }
})

async function extractArticle() {
  try {
    // Extract from URL
    const result = await extractor.extractFromUrl("https://example.com/article")

    console.log("Title:", result.title)
    console.log("Author:", result.author)
    console.log("Content length:", result.content.length)
    console.log("Reading time:", result.analysis.readingTime, "minutes")
    console.log("Sentiment:", result.analysis.sentiment.score)
    console.log("Quality score:", result.analysis.quality.score)
    console.log("Images found:", result.images.length)

    // Extract from HTML
    const htmlResult = await extractor.extractFromHtml(
      "<html>...</html>",
      "https://example.com/page"
    )

    console.log("Extraction metadata:", htmlResult.metadata)
  } catch (error) {
    console.error("Extraction failed:", error)
  }
}
```
