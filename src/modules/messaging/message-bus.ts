import { v4 as uuidv4 } from "uuid"
import { Storage } from "@plasmohq/storage"
import { MessageQueue } from "./message-queue"
import {
  Channel,
  ChannelOptions,
  Message,
  MessageFilter,
  MessageMetadata,
  MessagePriority,
  MessageResponse,
  MessageStats,
  QueuedMessage,
  SenderInfo,
  Subscription,
  SubscriptionHandler
} from "./types"

export class MessageBus {
  private channels: Map<string, Channel> = new Map()
  private subscriptions: Map<string, Subscription> = new Map()
  private messageHistory: Message[] = []
  private messageQueue: MessageQueue
  private storage: Storage
  private stats: MessageStats = {
    sent: 0,
    received: 0,
    failed: 0,
    queued: 0,
    avgProcessingTime: 0,
    channelStats: new Map()
  }
  private processingTimes: number[] = []

  constructor() {
    this.messageQueue = new MessageQueue()
    this.storage = new Storage({ area: "local" })
    this.initialize()
  }

  private async initialize() {
    // Load persistent channels
    const savedChannels = await this.storage.get("message_channels")
    if (savedChannels) {
      Object.entries(savedChannels).forEach(([name, options]) => {
        this.createChannel(name, options as ChannelOptions)
      })
    }

    // Setup cross-tab messaging
    this.setupCrossTabMessaging()

    // Setup Chrome runtime messaging
    this.setupRuntimeMessaging()

    // Start message queue processor
    this.messageQueue.startProcessing()
  }

  // Channel Management
  createChannel(name: string, options: ChannelOptions = {}): Channel {
    if (this.channels.has(name)) {
      throw new Error(`Channel "${name}" already exists`)
    }

    const channel: Channel = {
      name,
      options: {
        persistent: false,
        maxMessages: 1000,
        ttl: 3600000, // 1 hour
        exclusive: false,
        encrypted: false,
        ...options
      },
      subscribers: new Set(),
      messageCount: 0,
      createdAt: new Date()
    }

    this.channels.set(name, channel)

    // Save persistent channels
    if (channel.options.persistent) {
      this.savePersistentChannels()
    }

    // Initialize channel stats
    this.stats.channelStats.set(name, {
      messageCount: 0,
      subscriberCount: 0,
      lastActivity: new Date(),
      errorRate: 0
    })

    return channel
  }

  getChannel(name: string): Channel | undefined {
    return this.channels.get(name)
  }

  deleteChannel(name: string): boolean {
    const channel = this.channels.get(name)
    if (!channel) return false

    // Unsubscribe all subscribers
    this.subscriptions.forEach((sub, id) => {
      if (sub.channel === name) {
        this.subscriptions.delete(id)
      }
    })

    this.channels.delete(name)
    this.stats.channelStats.delete(name)

    if (channel.options.persistent) {
      this.savePersistentChannels()
    }

    return true
  }

  // Subscription Management
  subscribe<T = any>(
    channel: string,
    handler: SubscriptionHandler<T>,
    filter?: MessageFilter
  ): Subscription {
    const channelObj = this.channels.get(channel)
    if (!channelObj) {
      throw new Error(`Channel "${channel}" does not exist`)
    }

    const subscription: Subscription = {
      id: uuidv4(),
      channel,
      handler,
      filter,
      unsubscribe: () => this.unsubscribe(subscription.id)
    }

    channelObj.subscribers.add(handler)
    this.subscriptions.set(subscription.id, subscription)

    // Update stats
    const stats = this.stats.channelStats.get(channel)
    if (stats) {
      stats.subscriberCount = channelObj.subscribers.size
    }

    return subscription
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return false

    const channel = this.channels.get(subscription.channel)
    if (channel) {
      channel.subscribers.delete(subscription.handler)

      // Update stats
      const stats = this.stats.channelStats.get(subscription.channel)
      if (stats) {
        stats.subscriberCount = channel.subscribers.size
      }
    }

    this.subscriptions.delete(subscriptionId)
    return true
  }

  // Message Publishing
  async publish<T = any>(
    channel: string,
    type: string,
    payload: T,
    options: Partial<MessageMetadata> = {}
  ): Promise<void> {
    const channelObj = this.channels.get(channel)
    if (!channelObj) {
      throw new Error(`Channel "${channel}" does not exist`)
    }

    const message: Message<T> = {
      id: uuidv4(),
      channel,
      type,
      payload,
      timestamp: Date.now(),
      metadata: {
        sender: this.getSenderInfo(),
        priority: MessagePriority.NORMAL,
        ...options
      }
    }

    // Check channel restrictions
    if (channelObj.options.allowedSenders) {
      if (
        !channelObj.options.allowedSenders.includes(
          message.metadata.sender.type
        )
      ) {
        throw new Error(
          `Sender type "${message.metadata.sender.type}" not allowed on channel "${channel}"`
        )
      }
    }

    // Add to history
    this.addToHistory(message)

    // Update stats
    this.stats.sent++
    const channelStats = this.stats.channelStats.get(channel)
    if (channelStats) {
      channelStats.messageCount++
      channelStats.lastActivity = new Date()
    }

    // Process message
    const startTime = Date.now()

    try {
      // Local delivery
      await this.deliverMessage(message)

      // Cross-tab delivery
      if (!channelObj.options.exclusive) {
        await this.broadcastMessage(message)
      }

      // Record processing time
      const processingTime = Date.now() - startTime
      this.recordProcessingTime(processingTime)
    } catch (error) {
      this.stats.failed++
      if (channelStats) {
        channelStats.errorRate = this.stats.failed / this.stats.sent
      }
      throw error
    }
  }

  // Broadcast to all channels
  async broadcast<T = any>(
    type: string,
    payload: T,
    options: Partial<MessageMetadata> = {}
  ): Promise<void> {
    const promises = Array.from(this.channels.keys()).map((channel) =>
      this.publish(channel, type, payload, options).catch((err) => {
        console.error(`Failed to broadcast to channel ${channel}:`, err)
      })
    )

    await Promise.all(promises)
  }

  // Request/Response Pattern
  async request<T = any, R = any>(
    channel: string,
    type: string,
    payload: T,
    timeout: number = 5000
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const correlationId = uuidv4()
      const responseChannel = `${channel}.response.${correlationId}`

      // Create temporary response channel
      this.createChannel(responseChannel, { exclusive: true })

      // Setup timeout
      const timer = setTimeout(() => {
        this.deleteChannel(responseChannel)
        reject(new Error(`Request timeout after ${timeout}ms`))
      }, timeout)

      // Subscribe to response
      this.subscribe<MessageResponse<R>>(responseChannel, (message) => {
        clearTimeout(timer)
        this.deleteChannel(responseChannel)

        if (message.payload.success) {
          resolve(message.payload.data!)
        } else {
          reject(new Error(message.payload.error))
        }
      })

      // Send request
      this.publish(channel, type, payload, {
        correlationId,
        replyTo: responseChannel
      })
    })
  }

  // Respond to request
  async respond<T = any>(
    originalMessage: Message,
    response: MessageResponse<T>
  ): Promise<void> {
    if (!originalMessage.metadata.replyTo) {
      throw new Error("Original message has no replyTo channel")
    }

    await this.publish(originalMessage.metadata.replyTo, "response", response, {
      correlationId: originalMessage.metadata.correlationId
    })
  }

  // Message Delivery
  private async deliverMessage(message: Message): Promise<void> {
    const channel = this.channels.get(message.channel)
    if (!channel) return

    const subscribers = Array.from(channel.subscribers)
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter((sub) => sub.channel === message.channel)
      .filter((sub) => this.matchesFilter(message, sub.filter))

    const deliveryPromises = relevantSubscriptions.map(async (sub) => {
      try {
        await sub.handler(message)
        this.stats.received++
      } catch (error) {
        console.error("Message handler error:", error)
        this.stats.failed++

        // Add to retry queue if configured
        if (
          message.metadata.retryCount !== undefined &&
          message.metadata.retryCount > 0
        ) {
          await this.messageQueue.add({
            ...message,
            metadata: {
              ...message.metadata,
              retryCount: message.metadata.retryCount - 1
            }
          } as QueuedMessage)
        }
      }
    })

    await Promise.all(deliveryPromises)
  }

  private matchesFilter(message: Message, filter?: MessageFilter): boolean {
    if (!filter) return true

    // Type filter
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type]
      if (!types.includes(message.type)) return false
    }

    // Sender filter
    if (filter.sender) {
      const sender = message.metadata.sender
      if (filter.sender.type && sender.type !== filter.sender.type) return false
      if (filter.sender.tabId && sender.tabId !== filter.sender.tabId)
        return false
      if (filter.sender.frameId && sender.frameId !== filter.sender.frameId)
        return false
    }

    // Metadata filter
    if (filter.metadata) {
      const metadata = message.metadata
      if (
        filter.metadata.priority !== undefined &&
        metadata.priority !== filter.metadata.priority
      )
        return false
    }

    // Custom filter
    if (filter.custom && !filter.custom(message)) return false

    return true
  }

  // Cross-tab Messaging
  private setupCrossTabMessaging() {
    // Use BroadcastChannel API if available
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("extension-messages")

      bc.onmessage = (event) => {
        const message = event.data as Message

        // Prevent echo
        if (message.metadata.sender.id === this.getSenderInfo().id) return

        this.handleIncomingMessage(message)
      }

      // Override broadcast method
      this.broadcastMessage = async (message: Message) => {
        bc.postMessage(message)
      }
    } else {
      // Fallback to localStorage events
      window.addEventListener("storage", (event) => {
        if (event.key === "extension-message") {
          const message = JSON.parse(event.newValue || "{}") as Message
          this.handleIncomingMessage(message)
        }
      })

      // Override broadcast method
      this.broadcastMessage = async (message: Message) => {
        localStorage.setItem("extension-message", JSON.stringify(message))
        // Clean up after a short delay
        setTimeout(() => localStorage.removeItem("extension-message"), 100)
      }
    }
  }

  private async broadcastMessage(message: Message): Promise<void> {
    // This will be overridden in setupCrossTabMessaging
  }

  // Chrome Runtime Messaging
  private setupRuntimeMessaging() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Convert to internal message format
      const internalMessage: Message = {
        id: message.id || uuidv4(),
        channel: message.channel || "runtime",
        type: message.type || "unknown",
        payload: message.payload || message,
        timestamp: Date.now(),
        metadata: {
          sender: {
            id: sender.id || "unknown",
            type: this.detectSenderType(sender),
            tabId: sender.tab?.id,
            frameId: sender.frameId,
            url: sender.url
          },
          priority: message.priority || MessagePriority.NORMAL
        }
      }

      this.handleIncomingMessage(internalMessage)

      // Support async responses
      if (message.expectResponse) {
        this.handleAsyncResponse(internalMessage, sendResponse)
        return true // Keep channel open
      }
    })
  }

  private detectSenderType(
    sender: chrome.runtime.MessageSender
  ): SenderInfo["type"] {
    if (sender.id === chrome.runtime.id) {
      if (sender.tab) return "content"
      if (sender.url?.includes("popup.html")) return "popup"
      if (sender.url?.includes("options.html")) return "options"
      if (sender.url?.includes("devtools.html")) return "devtools"
      return "background"
    }
    return "tab"
  }

  private async handleAsyncResponse(
    message: Message,
    sendResponse: (response: any) => void
  ) {
    try {
      // Create response channel
      const responseChannel = `response.${message.id}`
      this.createChannel(responseChannel, { exclusive: true })

      // Wait for response
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.deleteChannel(responseChannel)
          reject(new Error("Response timeout"))
        }, 30000) // 30 second timeout

        this.subscribe(responseChannel, (msg) => {
          clearTimeout(timeout)
          this.deleteChannel(responseChannel)
          resolve(msg.payload)
        })

        // Deliver original message with response channel
        this.deliverMessage({
          ...message,
          metadata: {
            ...message.metadata,
            replyTo: responseChannel
          }
        })
      })

      sendResponse({ success: true, data: response })
    } catch (error: any) {
      sendResponse({ success: false, error: error.message })
    }
  }

  private handleIncomingMessage(message: Message) {
    this.addToHistory(message)
    this.stats.received++

    const channelStats = this.stats.channelStats.get(message.channel)
    if (channelStats) {
      channelStats.messageCount++
      channelStats.lastActivity = new Date()
    }

    this.deliverMessage(message).catch((error) => {
      console.error("Failed to deliver message:", error)
      this.stats.failed++
    })
  }

  // Helper Methods
  private getSenderInfo(): SenderInfo {
    // Detect current context
    if (typeof chrome !== "undefined" && chrome.runtime) {
      if (chrome.devtools) {
        return { id: "devtools", type: "devtools" }
      }

      const url = window.location.href
      if (url.includes("popup.html")) {
        return { id: "popup", type: "popup" }
      }
      if (url.includes("options.html")) {
        return { id: "options", type: "options" }
      }
      if (url.includes("chrome-extension://")) {
        return { id: "background", type: "background" }
      }

      return {
        id: "content",
        type: "content",
        url: window.location.href
      }
    }

    return { id: "unknown", type: "tab" }
  }

  private addToHistory(message: Message) {
    this.messageHistory.push(message)

    // Limit history size
    if (this.messageHistory.length > 1000) {
      this.messageHistory.shift()
    }

    // Clean expired messages
    const now = Date.now()
    this.messageHistory = this.messageHistory.filter((msg) => {
      if (msg.metadata.ttl) {
        return now - msg.timestamp < msg.metadata.ttl
      }
      return true
    })
  }

  private recordProcessingTime(time: number) {
    this.processingTimes.push(time)

    // Keep last 100 times
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift()
    }

    // Update average
    this.stats.avgProcessingTime =
      this.processingTimes.reduce((a, b) => a + b, 0) /
      this.processingTimes.length
  }

  private async savePersistentChannels() {
    const persistent = Array.from(this.channels.entries())
      .filter(([_, channel]) => channel.options.persistent)
      .reduce(
        (acc, [name, channel]) => {
          acc[name] = channel.options
          return acc
        },
        {} as Record<string, ChannelOptions>
      )

    await this.storage.set("message_channels", persistent)
  }

  // Public API
  getStats(): MessageStats {
    return { ...this.stats }
  }

  getHistory(channel?: string, limit: number = 100): Message[] {
    let history = this.messageHistory

    if (channel) {
      history = history.filter((msg) => msg.channel === channel)
    }

    return history.slice(-limit)
  }

  clearHistory(channel?: string) {
    if (channel) {
      this.messageHistory = this.messageHistory.filter(
        (msg) => msg.channel !== channel
      )
    } else {
      this.messageHistory = []
    }
  }

  // Cleanup
  destroy() {
    this.messageQueue.stopProcessing()
    this.channels.clear()
    this.subscriptions.clear()
    this.messageHistory = []
  }
}

// Singleton instance
export const messageBus = new MessageBus()
