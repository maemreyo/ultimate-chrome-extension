import { messageBus } from "./message-bus"
import { Message, MessagePriority } from "./types"

export interface Route {
  pattern: string | RegExp
  channel: string
  handler?: (message: Message) => void | Promise<void>
  priority?: MessagePriority
  transform?: (message: Message) => Message
}

export class MessageRouter {
  private routes: Route[] = []
  private defaultChannel = "default"

  constructor() {
    this.setupDefaultRoutes()
  }

  private setupDefaultRoutes() {
    // Background worker routes
    this.addRoute({
      pattern: /^background\./,
      channel: "background",
      priority: MessagePriority.HIGH
    })

    // Content script routes
    this.addRoute({
      pattern: /^content\./,
      channel: "content"
    })

    // UI routes
    this.addRoute({
      pattern: /^(popup|options|devtools)\./,
      channel: "ui"
    })

    // API routes
    this.addRoute({
      pattern: /^api\./,
      channel: "api",
      priority: MessagePriority.HIGH
    })

    // System routes
    this.addRoute({
      pattern: /^system\./,
      channel: "system",
      priority: MessagePriority.URGENT
    })
  }

  addRoute(route: Route) {
    this.routes.push(route)

    // Ensure channel exists
    if (!messageBus.getChannel(route.channel)) {
      messageBus.createChannel(route.channel)
    }
  }

  removeRoute(pattern: string | RegExp) {
    this.routes = this.routes.filter(
      (route) => route.pattern.toString() !== pattern.toString()
    )
  }

  async route(message: Message): Promise<void> {
    const matchingRoutes = this.routes.filter((route) => {
      if (typeof route.pattern === "string") {
        return message.type.startsWith(route.pattern)
      }
      return route.pattern.test(message.type)
    })

    if (matchingRoutes.length === 0) {
      // Route to default channel
      await messageBus.publish(
        this.defaultChannel,
        message.type,
        message.payload,
        message.metadata
      )
      return
    }

    // Route to all matching channels
    const routePromises = matchingRoutes.map(async (route) => {
      let routedMessage = message

      // Transform message if needed
      if (route.transform) {
        routedMessage = route.transform(message)
      }

      // Update priority if specified
      if (route.priority !== undefined) {
        routedMessage = {
          ...routedMessage,
          metadata: {
            ...routedMessage.metadata,
            priority: route.priority
          }
        }
      }

      // Execute handler if provided
      if (route.handler) {
        await route.handler(routedMessage)
      }

      // Publish to channel
      await messageBus.publish(
        route.channel,
        routedMessage.type,
        routedMessage.payload,
        routedMessage.metadata
      )
    })

    await Promise.all(routePromises)
  }

  // Convenience method for routing Chrome runtime messages
  routeChromeMessage(
    message: any,
    sender: chrome.runtime.MessageSender
  ): Promise<void> {
    const routedMessage: Message = {
      id: message.id || Date.now().toString(),
      channel: "chrome-runtime",
      type: message.type || "unknown",
      payload: message.payload || message,
      timestamp: Date.now(),
      metadata: {
        sender: {
          id: sender.id || "unknown",
          type: sender.tab ? "content" : "background",
          tabId: sender.tab?.id,
          frameId: sender.frameId,
          url: sender.url
        },
        priority: message.priority || MessagePriority.NORMAL
      }
    }

    return this.route(routedMessage)
  }

  getRoutes(): Route[] {
    return [...this.routes]
  }

  setDefaultChannel(channel: string) {
    this.defaultChannel = channel

    // Ensure channel exists
    if (!messageBus.getChannel(channel)) {
      messageBus.createChannel(channel)
    }
  }
}

export const messageRouter = new MessageRouter()
