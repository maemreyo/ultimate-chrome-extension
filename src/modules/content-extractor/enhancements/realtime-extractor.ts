// WebSocket support for real-time content updates

export interface RealtimeOptions {
  wsUrl: string
  reconnect?: boolean
  maxReconnectAttempts?: number
}

export class RealtimeContentExtractor {
  private ws?: WebSocket
  private reconnectAttempts: number = 0
  private listeners: Map<string, Set<(content: any) => void>> = new Map()

  async connect(options: RealtimeOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(options.wsUrl)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        resolve()
      }

      this.ws.onerror = (error) => {
        reject(error)
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onclose = () => {
        if (options.reconnect && this.reconnectAttempts < (options.maxReconnectAttempts || 5)) {
          this.reconnectAttempts++
          setTimeout(() => this.connect(options), 1000 * this.reconnectAttempts)
        }
      }
    })
  }

  subscribe(url: string, callback: (content: any) => void): () => void {
    if (!this.listeners.has(url)) {
      this.listeners.set(url, new Set())
    }

    this.listeners.get(url)!.add(callback)

    // Send subscription request
    this.send({
      type: 'subscribe',
      url
    })

    // Return unsubscribe function
    return () => {
      this.listeners.get(url)?.delete(callback)
      if (this.listeners.get(url)?.size === 0) {
        this.send({
          type: 'unsubscribe',
          url
        })
      }
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)
      const listeners = this.listeners.get(message.url)

      if (listeners) {
        listeners.forEach(callback => callback(message.content))
      }
    } catch (error) {
      console.error('Failed to handle message:', error)
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect(): void {
    this.ws?.close()
  }
}