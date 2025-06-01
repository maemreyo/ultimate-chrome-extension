// src/modules/messaging/utilities/message-routing-helpers.ts
// Advanced message routing and delivery utilities

import type { Message } from "../types"

/**
 * Route configuration for message delivery
 */
export interface RouteConfig {
  pattern: string | RegExp
  target: RouteTarget
  priority: number
  conditions?: RouteCondition[]
  transform?: MessageTransform
  middleware?: RouteMiddleware[]
}

/**
 * Route target specification
 */
export interface RouteTarget {
  type: "channel" | "tab" | "background" | "broadcast"
  destination: string | number | "all"
  options?: {
    timeout?: number
    retries?: number
    fallback?: RouteTarget
  }
}

/**
 * Route condition for conditional routing
 */
export interface RouteCondition {
  field: string
  operator: "equals" | "contains" | "matches" | "gt" | "lt" | "in"
  value: any
}

/**
 * Message transformation function
 */
export type MessageTransform = (message: Message) => Message | Promise<Message>

/**
 * Route middleware function
 */
export type RouteMiddleware = (
  message: Message,
  next: () => Promise<void>
) => Promise<void>

/**
 * Advanced message router with pattern matching and load balancing
 */
export class MessageRouter {
  private routes: RouteConfig[] = []
  private loadBalancers: Map<string, LoadBalancer> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private metrics: Map<string, RouteMetrics> = new Map()

  /**
   * Add a route configuration
   * @param config - Route configuration
   */
  addRoute(config: RouteConfig): void {
    this.routes.push(config)
    this.routes.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Remove a route by pattern
   * @param pattern - Route pattern to remove
   */
  removeRoute(pattern: string | RegExp): void {
    this.routes = this.routes.filter((route) => route.pattern !== pattern)
  }

  /**
   * Route a message to appropriate destinations
   * @param message - Message to route
   * @returns Array of routing results
   */
  async routeMessage(message: Message): Promise<RoutingResult[]> {
    const results: RoutingResult[] = []
    const matchingRoutes = this.findMatchingRoutes(message)

    for (const route of matchingRoutes) {
      try {
        const result = await this.executeRoute(message, route)
        results.push(result)
        this.updateMetrics(route, true)
      } catch (error) {
        const result: RoutingResult = {
          route: route.pattern.toString(),
          success: false,
          error: error.message,
          timestamp: Date.now()
        }
        results.push(result)
        this.updateMetrics(route, false)
      }
    }

    return results
  }

  /**
   * Find routes that match the message
   * @param message - Message to match
   * @returns Matching routes
   */
  private findMatchingRoutes(message: Message): RouteConfig[] {
    return this.routes.filter((route) => {
      // Pattern matching
      if (!this.matchesPattern(message, route.pattern)) {
        return false
      }

      // Condition checking
      if (
        route.conditions &&
        !this.checkConditions(message, route.conditions)
      ) {
        return false
      }

      return true
    })
  }

  /**
   * Check if message matches pattern
   * @param message - Message to check
   * @param pattern - Pattern to match
   * @returns True if matches
   */
  private matchesPattern(message: Message, pattern: string | RegExp): boolean {
    const target = `${message.channel}:${message.type}`

    if (typeof pattern === "string") {
      return this.matchWildcard(target, pattern)
    } else {
      return pattern.test(target)
    }
  }

  /**
   * Match wildcard pattern
   * @param text - Text to match
   * @param pattern - Wildcard pattern
   * @returns True if matches
   */
  private matchWildcard(text: string, pattern: string): boolean {
    const regex = new RegExp(
      pattern.replace(/\*/g, ".*").replace(/\?/g, "."),
      "i"
    )
    return regex.test(text)
  }

  /**
   * Check route conditions
   * @param message - Message to check
   * @param conditions - Conditions to evaluate
   * @returns True if all conditions pass
   */
  private checkConditions(
    message: Message,
    conditions: RouteCondition[]
  ): boolean {
    return conditions.every((condition) => {
      const value = this.getFieldValue(message, condition.field)
      return this.evaluateCondition(value, condition.operator, condition.value)
    })
  }

  /**
   * Get field value from message
   * @param message - Message object
   * @param field - Field path (e.g., 'metadata.sender.type')
   * @returns Field value
   */
  private getFieldValue(message: Message, field: string): any {
    const parts = field.split(".")
    let value: any = message

    for (const part of parts) {
      value = value?.[part]
    }

    return value
  }

  /**
   * Evaluate condition
   * @param value - Actual value
   * @param operator - Comparison operator
   * @param expected - Expected value
   * @returns True if condition passes
   */
  private evaluateCondition(
    value: any,
    operator: string,
    expected: any
  ): boolean {
    switch (operator) {
      case "equals":
        return value === expected
      case "contains":
        return typeof value === "string" && value.includes(expected)
      case "matches":
        return new RegExp(expected).test(String(value))
      case "gt":
        return Number(value) > Number(expected)
      case "lt":
        return Number(value) < Number(expected)
      case "in":
        return Array.isArray(expected) && expected.includes(value)
      default:
        return false
    }
  }

  /**
   * Execute a route
   * @param message - Message to route
   * @param route - Route configuration
   * @returns Routing result
   */
  private async executeRoute(
    message: Message,
    route: RouteConfig
  ): Promise<RoutingResult> {
    let processedMessage = message

    // Apply transformation
    if (route.transform) {
      processedMessage = await route.transform(message)
    }

    // Apply middleware
    if (route.middleware) {
      await this.applyMiddleware(processedMessage, route.middleware)
    }

    // Check circuit breaker
    const breakerKey = route.pattern.toString()
    const circuitBreaker = this.getCircuitBreaker(breakerKey)

    if (circuitBreaker.isOpen()) {
      throw new Error("Circuit breaker is open")
    }

    // Execute delivery
    const startTime = Date.now()
    await this.deliverMessage(processedMessage, route.target)
    const duration = Date.now() - startTime

    circuitBreaker.recordSuccess()

    return {
      route: route.pattern.toString(),
      success: true,
      duration,
      timestamp: Date.now()
    }
  }

  /**
   * Apply middleware to message
   * @param message - Message to process
   * @param middleware - Middleware functions
   */
  private async applyMiddleware(
    message: Message,
    middleware: RouteMiddleware[]
  ): Promise<void> {
    let index = 0

    const next = async (): Promise<void> => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index++]
        await currentMiddleware(message, next)
      }
    }

    await next()
  }

  /**
   * Deliver message to target
   * @param message - Message to deliver
   * @param target - Delivery target
   */
  private async deliverMessage(
    message: Message,
    target: RouteTarget
  ): Promise<void> {
    switch (target.type) {
      case "channel":
        await this.deliverToChannel(message, target.destination as string)
        break
      case "tab":
        await this.deliverToTab(message, target.destination as number)
        break
      case "background":
        await this.deliverToBackground(message)
        break
      case "broadcast":
        await this.deliverBroadcast(message)
        break
      default:
        throw new Error(`Unknown target type: ${target.type}`)
    }
  }

  /**
   * Deliver message to channel
   * @param message - Message to deliver
   * @param channel - Target channel
   */
  private async deliverToChannel(
    message: Message,
    channel: string
  ): Promise<void> {
    // Implementation would depend on the message bus
    console.log(`Delivering to channel: ${channel}`, message)
  }

  /**
   * Deliver message to specific tab
   * @param message - Message to deliver
   * @param tabId - Target tab ID
   */
  private async deliverToTab(message: Message, tabId: number): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      await chrome.tabs.sendMessage(tabId, message)
    }
  }

  /**
   * Deliver message to background script
   * @param message - Message to deliver
   */
  private async deliverToBackground(message: Message): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      await chrome.runtime.sendMessage(message)
    }
  }

  /**
   * Broadcast message to all contexts
   * @param message - Message to broadcast
   */
  private async deliverBroadcast(message: Message): Promise<void> {
    // Broadcast to all tabs and contexts
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const tabs = await chrome.tabs.query({})
      const promises = tabs.map((tab) =>
        tab.id
          ? chrome.tabs.sendMessage(tab.id, message).catch(() => {})
          : Promise.resolve()
      )
      await Promise.allSettled(promises)
    }
  }

  /**
   * Get or create circuit breaker for route
   * @param key - Circuit breaker key
   * @returns Circuit breaker instance
   */
  private getCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker())
    }
    return this.circuitBreakers.get(key)!
  }

  /**
   * Update routing metrics
   * @param route - Route configuration
   * @param success - Whether routing was successful
   */
  private updateMetrics(route: RouteConfig, success: boolean): void {
    const key = route.pattern.toString()
    const metrics = this.metrics.get(key) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      lastActivity: new Date()
    }

    metrics.totalRequests++
    if (success) {
      metrics.successfulRequests++
    } else {
      metrics.failedRequests++
    }
    metrics.lastActivity = new Date()

    this.metrics.set(key, metrics)
  }

  /**
   * Get routing metrics
   * @returns Map of route metrics
   */
  getMetrics(): Map<string, RouteMetrics> {
    return new Map(this.metrics)
  }
}

/**
 * Load balancer for distributing messages across multiple targets
 */
export class LoadBalancer {
  private targets: string[] = []
  private currentIndex = 0
  private strategy: "round-robin" | "random" | "least-connections" =
    "round-robin"
  private connections: Map<string, number> = new Map()

  constructor(
    targets: string[],
    strategy: "round-robin" | "random" | "least-connections" = "round-robin"
  ) {
    this.targets = targets
    this.strategy = strategy
    targets.forEach((target) => this.connections.set(target, 0))
  }

  /**
   * Get next target based on load balancing strategy
   * @returns Next target
   */
  getNextTarget(): string {
    switch (this.strategy) {
      case "round-robin":
        return this.getRoundRobinTarget()
      case "random":
        return this.getRandomTarget()
      case "least-connections":
        return this.getLeastConnectionsTarget()
      default:
        return this.targets[0]
    }
  }

  /**
   * Get target using round-robin strategy
   * @returns Target
   */
  private getRoundRobinTarget(): string {
    const target = this.targets[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.targets.length
    return target
  }

  /**
   * Get target using random strategy
   * @returns Target
   */
  private getRandomTarget(): string {
    const index = Math.floor(Math.random() * this.targets.length)
    return this.targets[index]
  }

  /**
   * Get target using least connections strategy
   * @returns Target
   */
  private getLeastConnectionsTarget(): string {
    let minConnections = Infinity
    let target = this.targets[0]

    for (const t of this.targets) {
      const connections = this.connections.get(t) || 0
      if (connections < minConnections) {
        minConnections = connections
        target = t
      }
    }

    return target
  }

  /**
   * Increment connection count for target
   * @param target - Target to increment
   */
  incrementConnections(target: string): void {
    const current = this.connections.get(target) || 0
    this.connections.set(target, current + 1)
  }

  /**
   * Decrement connection count for target
   * @param target - Target to decrement
   */
  decrementConnections(target: string): void {
    const current = this.connections.get(target) || 0
    this.connections.set(target, Math.max(0, current - 1))
  }
}

/**
 * Circuit breaker for handling failures
 */
export class CircuitBreaker {
  private state: "closed" | "open" | "half-open" = "closed"
  private failureCount = 0
  private successCount = 0
  private lastFailureTime = 0
  private readonly failureThreshold = 5
  private readonly recoveryTimeout = 30000 // 30 seconds
  private readonly successThreshold = 3

  /**
   * Check if circuit breaker is open
   * @returns True if open
   */
  isOpen(): boolean {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = "half-open"
        this.successCount = 0
        return false
      }
      return true
    }
    return false
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.failureCount = 0

    if (this.state === "half-open") {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.state = "closed"
      }
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = "open"
    }
  }

  /**
   * Get circuit breaker state
   * @returns Current state
   */
  getState(): string {
    return this.state
  }
}

/**
 * Routing result interface
 */
export interface RoutingResult {
  route: string
  success: boolean
  duration?: number
  error?: string
  timestamp: number
}

/**
 * Route metrics interface
 */
export interface RouteMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatency: number
  lastActivity: Date
}
