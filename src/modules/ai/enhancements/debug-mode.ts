interface DebugEvent {
  timestamp: Date
  type: string
  data: any
  metadata?: Record<string, any>
}

export class DebugMode {
  private enabled = false
  private events: DebugEvent[] = []
  private logToConsole = true
  private saveToFile = false
  private filters: Set<string> = new Set()

  enable(options: {
    logToConsole?: boolean
    saveToFile?: boolean
    filters?: string[]
  } = {}) {
    this.enabled = true
    this.logToConsole = options.logToConsole ?? true
    this.saveToFile = options.saveToFile ?? false
    if (options.filters) {
      this.filters = new Set(options.filters)
    }

    this.log('debug', 'Debug mode enabled', options)
  }

  disable() {
    this.log('debug', 'Debug mode disabled')
    this.enabled = false
  }

  log(type: string, message: string, data?: any, metadata?: Record<string, any>) {
    if (!this.enabled) return
    if (this.filters.size > 0 && !this.filters.has(type)) return

    const event: DebugEvent = {
      timestamp: new Date(),
      type,
      data: { message, ...data },
      metadata
    }

    this.events.push(event)

    if (this.logToConsole) {
      console.log(
        `[AI Debug ${type}] ${new Date().toISOString()}:`,
        message,
        data || ''
      )
    }

    // Limit event history
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500)
    }
  }

  logRequest(provider: string, method: string, params: any) {
    this.log('request', `${provider}.${method}`, {
      provider,
      method,
      params: this.sanitizeParams(params)
    })
  }

  logResponse(provider: string, method: string, response: any, duration: number) {
    this.log('response', `${provider}.${method} completed in ${duration}ms`, {
      provider,
      method,
      duration,
      response: this.sanitizeResponse(response)
    })
  }

  logError(provider: string, method: string, error: any) {
    this.log('error', `${provider}.${method} failed`, {
      provider,
      method,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    })
  }

  private sanitizeParams(params: any): any {
    if (!params) return params

    const sanitized = { ...params }

    // Hide sensitive data
    if (sanitized.apiKey) sanitized.apiKey = '***'
    if (sanitized.messages) {
      sanitized.messages = sanitized.messages.map((msg: any) => ({
        ...msg,
        content: msg.content?.substring(0, 100) + '...'
      }))
    }

    return sanitized
  }

  private sanitizeResponse(response: any): any {
    if (typeof response === 'string' && response.length > 200) {
      return response.substring(0, 200) + '...'
    }
    return response
  }

  getEvents(filter?: { type?: string; since?: Date }): DebugEvent[] {
    let events = [...this.events]

    if (filter?.type) {
      events = events.filter(e => e.type === filter.type)
    }

    if (filter?.since) {
      events = events.filter(e => e.timestamp > filter.since)
    }

    return events
  }

  exportLogs(): string {
    const logs = this.events.map(event => ({
      timestamp: event.timestamp.toISOString(),
      type: event.type,
      data: event.data,
      metadata: event.metadata
    }))

    return JSON.stringify(logs, null, 2)
  }

  clear() {
    this.events = []
    this.log('debug', 'Debug logs cleared')
  }
}