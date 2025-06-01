// src/modules/content-extractor/utilities/performance-helpers.ts
// Performance monitoring and optimization utilities

/**
 * Performance timer for measuring extraction operations
 */
export class PerformanceTimer {
  private startTime: number = 0
  private endTime: number = 0
  private marks: Map<string, number> = new Map()

  /**
   * Start timing
   */
  start(): void {
    this.startTime = performance.now()
  }

  /**
   * End timing
   * @returns Duration in milliseconds
   */
  end(): number {
    this.endTime = performance.now()
    return this.getDuration()
  }

  /**
   * Add a performance mark
   * @param name - Mark name
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * Get duration between marks or from start
   * @param fromMark - Starting mark name
   * @param toMark - Ending mark name
   * @returns Duration in milliseconds
   */
  getDuration(fromMark?: string, toMark?: string): number {
    let start = this.startTime
    let end = this.endTime || performance.now()

    if (fromMark) {
      start = this.marks.get(fromMark) || start
    }

    if (toMark) {
      end = this.marks.get(toMark) || end
    }

    return end - start
  }

  /**
   * Get all marks with their durations from start
   * @returns Map of mark names to durations
   */
  getAllMarks(): Map<string, number> {
    const durations = new Map<string, number>()

    for (const [name, time] of this.marks) {
      durations.set(name, time - this.startTime)
    }

    return durations
  }

  /**
   * Reset timer
   */
  reset(): void {
    this.startTime = 0
    this.endTime = 0
    this.marks.clear()
  }
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private initialMemory: number = 0
  private snapshots: Array<{
    name: string
    memory: number
    timestamp: number
  }> = []

  /**
   * Start memory tracking
   */
  start(): void {
    this.initialMemory = this.getCurrentMemoryUsage()
    this.snapshots = []
  }

  /**
   * Take a memory snapshot
   * @param name - Snapshot name
   */
  snapshot(name: string): void {
    this.snapshots.push({
      name,
      memory: this.getCurrentMemoryUsage(),
      timestamp: performance.now()
    })
  }

  /**
   * Get memory usage difference from start
   * @returns Memory difference in MB
   */
  getMemoryDiff(): number {
    return this.getCurrentMemoryUsage() - this.initialMemory
  }

  /**
   * Get all snapshots with memory differences
   * @returns Array of snapshots with memory diffs
   */
  getSnapshots(): Array<{
    name: string
    memoryDiff: number
    timestamp: number
  }> {
    return this.snapshots.map((snapshot) => ({
      name: snapshot.name,
      memoryDiff: snapshot.memory - this.initialMemory,
      timestamp: snapshot.timestamp
    }))
  }

  /**
   * Get current memory usage
   * @returns Memory usage in MB
   */
  private getCurrentMemoryUsage(): number {
    if ("memory" in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024
    }
    return 0
  }
}

/**
 * Extraction performance metrics
 */
export interface ExtractionMetrics {
  totalTime: number
  domParsingTime: number
  contentExtractionTime: number
  cleaningTime: number
  analysisTime: number
  memoryUsage: number
  elementsProcessed: number
  bytesProcessed: number
  cacheHits: number
  cacheMisses: number
}

/**
 * Performance monitor for content extraction
 */
export class ExtractionPerformanceMonitor {
  private timer = new PerformanceTimer()
  private memoryTracker = new MemoryTracker()
  private metrics: Partial<ExtractionMetrics> = {}

  /**
   * Start monitoring
   */
  start(): void {
    this.timer.start()
    this.memoryTracker.start()
    this.metrics = {}
  }

  /**
   * Mark the start of DOM parsing
   */
  startDOMParsing(): void {
    this.timer.mark("dom-start")
    this.memoryTracker.snapshot("dom-start")
  }

  /**
   * Mark the end of DOM parsing
   */
  endDOMParsing(): void {
    this.timer.mark("dom-end")
    this.memoryTracker.snapshot("dom-end")
    this.metrics.domParsingTime = this.timer.getDuration("dom-start", "dom-end")
  }

  /**
   * Mark the start of content extraction
   */
  startContentExtraction(): void {
    this.timer.mark("extraction-start")
    this.memoryTracker.snapshot("extraction-start")
  }

  /**
   * Mark the end of content extraction
   */
  endContentExtraction(): void {
    this.timer.mark("extraction-end")
    this.memoryTracker.snapshot("extraction-end")
    this.metrics.contentExtractionTime = this.timer.getDuration(
      "extraction-start",
      "extraction-end"
    )
  }

  /**
   * Mark the start of content cleaning
   */
  startCleaning(): void {
    this.timer.mark("cleaning-start")
    this.memoryTracker.snapshot("cleaning-start")
  }

  /**
   * Mark the end of content cleaning
   */
  endCleaning(): void {
    this.timer.mark("cleaning-end")
    this.memoryTracker.snapshot("cleaning-end")
    this.metrics.cleaningTime = this.timer.getDuration(
      "cleaning-start",
      "cleaning-end"
    )
  }

  /**
   * Mark the start of content analysis
   */
  startAnalysis(): void {
    this.timer.mark("analysis-start")
    this.memoryTracker.snapshot("analysis-start")
  }

  /**
   * Mark the end of content analysis
   */
  endAnalysis(): void {
    this.timer.mark("analysis-end")
    this.memoryTracker.snapshot("analysis-end")
    this.metrics.analysisTime = this.timer.getDuration(
      "analysis-start",
      "analysis-end"
    )
  }

  /**
   * Record cache statistics
   * @param hits - Number of cache hits
   * @param misses - Number of cache misses
   */
  recordCacheStats(hits: number, misses: number): void {
    this.metrics.cacheHits = hits
    this.metrics.cacheMisses = misses
  }

  /**
   * Record processing statistics
   * @param elements - Number of elements processed
   * @param bytes - Number of bytes processed
   */
  recordProcessingStats(elements: number, bytes: number): void {
    this.metrics.elementsProcessed = elements
    this.metrics.bytesProcessed = bytes
  }

  /**
   * Get final metrics
   * @returns Complete extraction metrics
   */
  getMetrics(): ExtractionMetrics {
    this.metrics.totalTime = this.timer.end()
    this.metrics.memoryUsage = this.memoryTracker.getMemoryDiff()

    return {
      totalTime: this.metrics.totalTime || 0,
      domParsingTime: this.metrics.domParsingTime || 0,
      contentExtractionTime: this.metrics.contentExtractionTime || 0,
      cleaningTime: this.metrics.cleaningTime || 0,
      analysisTime: this.metrics.analysisTime || 0,
      memoryUsage: this.metrics.memoryUsage || 0,
      elementsProcessed: this.metrics.elementsProcessed || 0,
      bytesProcessed: this.metrics.bytesProcessed || 0,
      cacheHits: this.metrics.cacheHits || 0,
      cacheMisses: this.metrics.cacheMisses || 0
    }
  }

  /**
   * Get performance summary
   * @returns Human-readable performance summary
   */
  getSummary(): string {
    const metrics = this.getMetrics()

    return `
Extraction Performance Summary:
- Total Time: ${metrics.totalTime.toFixed(2)}ms
- DOM Parsing: ${metrics.domParsingTime.toFixed(2)}ms
- Content Extraction: ${metrics.contentExtractionTime.toFixed(2)}ms
- Content Cleaning: ${metrics.cleaningTime.toFixed(2)}ms
- Content Analysis: ${metrics.analysisTime.toFixed(2)}ms
- Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB
- Elements Processed: ${metrics.elementsProcessed}
- Bytes Processed: ${(metrics.bytesProcessed / 1024).toFixed(2)}KB
- Cache Hit Rate: ${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)}%
    `.trim()
  }
}

/**
 * Batch processing optimizer
 */
export class BatchProcessor<T, R> {
  private batchSize: number
  private concurrency: number
  private processor: (items: T[]) => Promise<R[]>

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    options: {
      batchSize?: number
      concurrency?: number
    } = {}
  ) {
    this.processor = processor
    this.batchSize = options.batchSize || 10
    this.concurrency = options.concurrency || 3
  }

  /**
   * Process items in optimized batches
   * @param items - Items to process
   * @returns Processed results
   */
  async process(items: T[]): Promise<R[]> {
    const batches: T[][] = []

    // Split into batches
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize))
    }

    const results: R[] = []
    const executing: Promise<void>[] = []

    for (const batch of batches) {
      const promise = this.processor(batch).then((batchResults) => {
        results.push(...batchResults)
      })

      executing.push(promise)

      if (executing.length >= this.concurrency) {
        await Promise.race(executing)
        executing.splice(
          executing.findIndex((p) => p === promise),
          1
        )
      }
    }

    await Promise.all(executing)
    return results
  }
}

/**
 * Performance optimization recommendations
 */
export function getPerformanceRecommendations(
  metrics: ExtractionMetrics
): string[] {
  const recommendations: string[] = []

  if (metrics.totalTime > 5000) {
    recommendations.push(
      "Total extraction time is high - consider optimizing selectors or reducing content scope"
    )
  }

  if (metrics.domParsingTime > 1000) {
    recommendations.push(
      "DOM parsing is slow - consider using more specific selectors"
    )
  }

  if (metrics.memoryUsage > 50) {
    recommendations.push(
      "High memory usage detected - consider processing content in smaller chunks"
    )
  }

  if (metrics.elementsProcessed > 10000) {
    recommendations.push(
      "Processing many elements - consider filtering irrelevant elements earlier"
    )
  }

  const cacheHitRate =
    metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)
  if (cacheHitRate < 0.5) {
    recommendations.push(
      "Low cache hit rate - consider adjusting cache strategy or size"
    )
  }

  if (metrics.cleaningTime > metrics.contentExtractionTime) {
    recommendations.push(
      "Content cleaning takes longer than extraction - optimize cleaning rules"
    )
  }

  return recommendations
}

/**
 * Debounced function executor for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttled function executor for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
