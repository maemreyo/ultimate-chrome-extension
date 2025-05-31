// Analytics implementation for AI usage tracking

import { Storage } from "@plasmohq/storage"
import type { AIProviderType } from "./types"

interface AnalyticsEvent {
  timestamp: Date
  provider: string
  capability: string
  success: boolean
  latency?: number
  tokens?: number
  error?: string
}

interface ProviderMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalLatency: number
  averageLatency: number
  errorRate: number
  lastError?: string
  lastErrorTime?: Date
}

interface CapabilityMetrics {
  usage: number
  successRate: number
  averageLatency: number
  providers: Record<string, number>
}

export class AIAnalytics {
  private storage: Storage
  private events: AnalyticsEvent[] = []
  private sessionStart: Date = new Date()
  private metrics: {
    providers: Record<string, ProviderMetrics>
    capabilities: Record<string, CapabilityMetrics>
    hourly: Record<string, number>
    daily: Record<string, number>
  } = {
    providers: {},
    capabilities: {},
    hourly: {},
    daily: {}
  }

  constructor() {
    this.storage = new Storage({ area: "local" })
    this.loadAnalytics()
  }

  async loadAnalytics() {
    const savedMetrics = await this.storage.get("ai_analytics_metrics")
    if (savedMetrics) {
      this.metrics = savedMetrics
    }

    const savedEvents = await this.storage.get("ai_analytics_events")
    if (savedEvents && Array.isArray(savedEvents)) {
      this.events = savedEvents.map(e => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }))
    }
  }

  async trackSuccess(
    provider: string,
    capability: string,
    latency?: number,
    tokens?: number
  ) {
    const event: AnalyticsEvent = {
      timestamp: new Date(),
      provider,
      capability,
      success: true,
      latency,
      tokens
    }

    this.addEvent(event)
    this.updateMetrics(event)
    await this.save()
  }

  async trackError(
    provider: string,
    capability: string,
    error: Error
  ) {
    const event: AnalyticsEvent = {
      timestamp: new Date(),
      provider,
      capability,
      success: false,
      error: error.message
    }

    this.addEvent(event)
    this.updateMetrics(event)
    await this.save()
  }

  private addEvent(event: AnalyticsEvent) {
    this.events.push(event)

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  private updateMetrics(event: AnalyticsEvent) {
    // Update provider metrics
    if (!this.metrics.providers[event.provider]) {
      this.metrics.providers[event.provider] = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalLatency: 0,
        averageLatency: 0,
        errorRate: 0
      }
    }

    const providerMetrics = this.metrics.providers[event.provider]
    providerMetrics.totalRequests++

    if (event.success) {
      providerMetrics.successfulRequests++
      if (event.latency) {
        providerMetrics.totalLatency += event.latency
        providerMetrics.averageLatency =
          providerMetrics.totalLatency / providerMetrics.successfulRequests
      }
    } else {
      providerMetrics.failedRequests++
      providerMetrics.lastError = event.error
      providerMetrics.lastErrorTime = event.timestamp
    }

    providerMetrics.errorRate =
      providerMetrics.failedRequests / providerMetrics.totalRequests

    // Update capability metrics
    if (!this.metrics.capabilities[event.capability]) {
      this.metrics.capabilities[event.capability] = {
        usage: 0,
        successRate: 0,
        averageLatency: 0,
        providers: {}
      }
    }

    const capabilityMetrics = this.metrics.capabilities[event.capability]
    capabilityMetrics.usage++

    if (!capabilityMetrics.providers[event.provider]) {
      capabilityMetrics.providers[event.provider] = 0
    }
    capabilityMetrics.providers[event.provider]++

    // Update time-based metrics
    const hourKey = this.getHourKey(event.timestamp)
    const dayKey = this.getDayKey(event.timestamp)

    this.metrics.hourly[hourKey] = (this.metrics.hourly[hourKey] || 0) + 1
    this.metrics.daily[dayKey] = (this.metrics.daily[dayKey] || 0) + 1

    // Clean up old time-based data
    this.cleanupOldData()
  }

  private cleanupOldData() {
    const now = new Date()

    // Keep only last 24 hours of hourly data
    for (const key in this.metrics.hourly) {
      const keyDate = new Date(key)
      if (now.getTime() - keyDate.getTime() > 24 * 60 * 60 * 1000) {
        delete this.metrics.hourly[key]
      }
    }

    // Keep only last 30 days of daily data
    for (const key in this.metrics.daily) {
      const keyDate = new Date(key)
      if (now.getTime() - keyDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
        delete this.metrics.daily[key]
      }
    }
  }

  private getHourKey(date: Date): string {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours()
    ).toISOString()
  }

  private getDayKey(date: Date): string {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).toISOString()
  }

  async save() {
    await this.storage.set("ai_analytics_metrics", this.metrics)
    await this.storage.set("ai_analytics_events", this.events)
  }

  getProviderMetrics(provider?: string): ProviderMetrics | Record<string, ProviderMetrics> {
    if (provider) {
      return this.metrics.providers[provider] || {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalLatency: 0,
        averageLatency: 0,
        errorRate: 0
      }
    }
    return this.metrics.providers
  }

  getCapabilityMetrics(capability?: string): CapabilityMetrics | Record<string, CapabilityMetrics> {
    if (capability) {
      return this.metrics.capabilities[capability] || {
        usage: 0,
        successRate: 0,
        averageLatency: 0,
        providers: {}
      }
    }
    return this.metrics.capabilities
  }

  getTimeSeriesData(
    granularity: 'hourly' | 'daily',
    limit?: number
  ): Array<{ time: string; count: number }> {
    const data = granularity === 'hourly' ? this.metrics.hourly : this.metrics.daily
    const entries = Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(limit ? -limit : 0)
      .map(([time, count]) => ({ time, count }))

    return entries
  }

  getRecentEvents(limit: number = 100): AnalyticsEvent[] {
    return this.events.slice(-limit)
  }

  getSessionStats() {
    const sessionEvents = this.events.filter(
      e => e.timestamp >= this.sessionStart
    )

    const providers = new Set(sessionEvents.map(e => e.provider))
    const capabilities = new Set(sessionEvents.map(e => e.capability))
    const successful = sessionEvents.filter(e => e.success).length
    const failed = sessionEvents.filter(e => !e.success).length

    return {
      duration: Date.now() - this.sessionStart.getTime(),
      totalRequests: sessionEvents.length,
      successfulRequests: successful,
      failedRequests: failed,
      successRate: successful / sessionEvents.length || 0,
      uniqueProviders: providers.size,
      uniqueCapabilities: capabilities.size,
      providers: Array.from(providers),
      capabilities: Array.from(capabilities)
    }
  }

  getRecommendations(): string[] {
    const recommendations: string[] = []

    // Check for high error rates
    for (const [provider, metrics] of Object.entries(this.metrics.providers)) {
      if (metrics.errorRate > 0.1 && metrics.totalRequests > 10) {
        recommendations.push(
          `${provider} has a high error rate (${(metrics.errorRate * 100).toFixed(1)}%). Consider checking your API key or switching providers.`
        )
      }

      if (metrics.averageLatency > 5000) {
        recommendations.push(
          `${provider} has high latency (${(metrics.averageLatency / 1000).toFixed(1)}s average). Consider enabling caching or using a faster provider.`
        )
      }
    }

    // Check for underutilized capabilities
    const totalUsage = Object.values(this.metrics.capabilities)
      .reduce((sum, m) => sum + m.usage, 0)

    if (totalUsage > 100) {
      for (const [capability, metrics] of Object.entries(this.metrics.capabilities)) {
        const usagePercent = (metrics.usage / totalUsage) * 100
        if (usagePercent < 1) {
          recommendations.push(
            `${capability} is rarely used (${usagePercent.toFixed(1)}%). Consider if this feature is needed.`
          )
        }
      }
    }

    // Check for time-based patterns
    const hourlyData = this.getTimeSeriesData('hourly', 24)
    const peakHour = hourlyData.reduce((max, curr) =>
      curr.count > max.count ? curr : max, hourlyData[0]
    )

    if (peakHour && peakHour.count > 50) {
      const hour = new Date(peakHour.time).getHours()
      recommendations.push(
        `Peak usage occurs at ${hour}:00. Consider scheduling heavy tasks outside this time.`
      )
    }

    return recommendations
  }

  async reset() {
    this.events = []
    this.metrics = {
      providers: {},
      capabilities: {},
      hourly: {},
      daily: {}
    }
    this.sessionStart = new Date()
    await this.save()
  }
}