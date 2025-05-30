import { QueuedMessage, QueueOptions } from './types'
import { Storage } from '@plasmohq/storage'

export class MessageQueue {
  private queue: QueuedMessage[] = []
  private processing = false
  private storage: Storage
  private options: QueueOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    retryBackoff: 'exponential',
    persistent: true
  }
  private processingInterval: NodeJS.Timer | null = null

  constructor(options?: Partial<QueueOptions>) {
    this.options = { ...this.options, ...options }
    this.storage = new Storage({ area: 'local' })
    this.loadQueue()
  }

  private async loadQueue() {
    if (this.options.persistent) {
      const saved = await this.storage.get('message_queue')
      if (saved) {
        this.queue = saved
      }
    }
  }

  private async saveQueue() {
    if (this.options.persistent) {
      await this.storage.set('message_queue', this.queue)
    }
  }

  async add(message: QueuedMessage): Promise<void> {
    message.attempts = message.attempts || 0
    message.nextRetry = Date.now() + this.calculateDelay(message.attempts)

    this.queue.push(message)
    await this.saveQueue()
  }

  async remove(messageId: string): Promise<boolean> {
    const index = this.queue.findIndex(msg => msg.id === messageId)
    if (index === -1) return false

    this.queue.splice(index, 1)
    await this.saveQueue()
    return true
  }

  startProcessing() {
    if (this.processingInterval) return

    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 1000) // Check every second

    // Process immediately
    this.processQueue()
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const now = Date.now()

    // Find messages ready for retry
    const readyMessages = this.queue.filter(msg =>
      !msg.nextRetry || msg.nextRetry <= now
    )

    for (const message of readyMessages) {
      try {
        // Process message (this would be implemented by the consumer)
        await this.processMessage(message)

        // Remove from queue on success
        await this.remove(message.id)
      } catch (error) {
        message.attempts++
        message.error = error as Error

        if (message.attempts >= (this.options.maxRetries || 3)) {
          // Move to dead letter queue
          if (this.options.deadLetterQueue) {
            await this.moveToDeadLetter(message)
          }
          await this.remove(message.id)
        } else {
          // Calculate next retry time
          message.nextRetry = now + this.calculateDelay(message.attempts)
          await this.saveQueue()
        }
      }
    }

    this.processing = false
  }

  private calculateDelay(attempts: number): number {
    const baseDelay = this.options.retryDelay || 1000

    if (this.options.retryBackoff === 'exponential') {
      return baseDelay * Math.pow(2, attempts)
    }

    return baseDelay * attempts
  }

  private async processMessage(message: QueuedMessage): Promise<void> {
    // This would be overridden by the actual processor
    throw new Error('Message processor not implemented')
  }

  private async moveToDeadLetter(message: QueuedMessage): Promise<void> {
    // Store in dead letter queue
    const deadLetterKey = `dead_letter_${this.options.deadLetterQueue}`
    const deadLetters = await this.storage.get(deadLetterKey) || []
    deadLetters.push({
      ...message,
      movedAt: Date.now()
    })
    await this.storage.set(deadLetterKey, deadLetters)
  }

  getQueueSize(): number {
    return this.queue.length
  }

  getQueuedMessages(): QueuedMessage[] {
    return [...this.queue]
  }

  clearQueue(): void {
    this.queue = []
    this.saveQueue()
  }
}