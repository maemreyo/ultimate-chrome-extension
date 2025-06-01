interface RetryOptions {
  maxRetries?: number
  backoff?: 'exponential' | 'linear' | 'fixed'
  initialDelay?: number
  maxDelay?: number
  jitter?: boolean
  retryCondition?: (error: any, attempt: number) => boolean
  onRetry?: (error: any, attempt: number) => void
}

export class RetryMechanism {
  private defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000,
    jitter: true,
    retryCondition: (error) => {
      // Don't retry on authentication errors
      if (error.message?.includes('Invalid API key')) return false
      if (error.message?.includes('Unauthorized')) return false

      // Don't retry on bad requests
      if (error.status === 400) return false

      // Retry on network errors and rate limits
      if (error.status === 429) return true
      if (error.status >= 500) return true
      if (error.code === 'ECONNRESET') return true
      if (error.code === 'ETIMEDOUT') return true

      return true
    },
    onRetry: () => {}
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options }
    let lastError: any

    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        if (!opts.retryCondition(error, attempt) || attempt === opts.maxRetries - 1) {
          throw error
        }

        const delay = this.calculateDelay(attempt, opts)
        opts.onRetry(error, attempt)

        await this.sleep(delay)
      }
    }

    throw lastError
  }

  private calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    let delay: number

    switch (options.backoff) {
      case 'exponential':
        delay = Math.min(options.initialDelay * Math.pow(2, attempt), options.maxDelay)
        break
      case 'linear':
        delay = Math.min(options.initialDelay * (attempt + 1), options.maxDelay)
        break
      case 'fixed':
        delay = options.initialDelay
        break
    }

    // Add jitter to prevent thundering herd
    if (options.jitter) {
      delay *= 0.5 + Math.random() * 0.5
    }

    return Math.floor(delay)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}