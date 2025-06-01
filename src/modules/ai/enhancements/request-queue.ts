interface QueuedRequest<T> {
  id: string
  priority: number
  timestamp: number
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
  metadata?: {
    provider?: string
    capability?: string
    estimatedTokens?: number
  }
}

export class RequestQueue {
  private queue: QueuedRequest<any>[] = []
  private processing = false
  private concurrency = 3
  private activeRequests = new Map<string, Promise<any>>()

  // Priority levels
  static readonly PRIORITY = {
    CRITICAL: 100,
    HIGH: 75,
    NORMAL: 50,
    LOW: 25,
    BACKGROUND: 0
  }

  constructor(private options: {
    concurrency?: number
    rateLimitPerMinute?: number
    onQueueChange?: (size: number) => void
  } = {}) {
    this.concurrency = options.concurrency || 3
  }

  async add<T>(
    execute: () => Promise<T>,
    priority: number = RequestQueue.PRIORITY.NORMAL,
    metadata?: any
  ): Promise<T> {
    const id = crypto.randomUUID()
    const timestamp = Date.now()

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id,
        priority,
        timestamp,
        execute,
        resolve,
        reject,
        metadata
      }

      this.queue.push(request)
      this.sortQueue()
      this.options.onQueueChange?.(this.queue.length)

      this.process()
    })
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      // First by priority, then by timestamp (FIFO for same priority)
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return a.timestamp - b.timestamp
    })
  }

  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0 && this.activeRequests.size < this.concurrency) {
      const request = this.queue.shift()!

      const promise = this.executeRequest(request)
      this.activeRequests.set(request.id, promise)

      promise.finally(() => {
        this.activeRequests.delete(request.id)
        this.options.onQueueChange?.(this.queue.length)
      })
    }

    if (this.activeRequests.size > 0) {
      await Promise.race(Array.from(this.activeRequests.values()))
      this.processing = false

      // Continue processing if queue has items
      if (this.queue.length > 0) {
        this.process()
      }
    } else {
      this.processing = false
    }
  }

  private async executeRequest<T>(request: QueuedRequest<T>) {
    try {
      const result = await request.execute()
      request.resolve(result)
    } catch (error) {
      request.reject(error)
    }
  }

  getQueueStatus() {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests.size,
      isProcessing: this.processing,
      queuedByPriority: this.queue.reduce((acc, req) => {
        const level = this.getPriorityLevel(req.priority)
        acc[level] = (acc[level] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  private getPriorityLevel(priority: number): string {
    if (priority >= RequestQueue.PRIORITY.CRITICAL) return 'critical'
    if (priority >= RequestQueue.PRIORITY.HIGH) return 'high'
    if (priority >= RequestQueue.PRIORITY.NORMAL) return 'normal'
    if (priority >= RequestQueue.PRIORITY.LOW) return 'low'
    return 'background'
  }

  clear() {
    this.queue = []
    this.options.onQueueChange?.(0)
  }
}