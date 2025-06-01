import { MockAIProvider } from '../enhancements'
import { enhancedAIService } from '../enhanced-service'

interface TestOptions {
  mockResponses?: Record<string, string>
  delay?: number
  shouldFail?: boolean
}

export class AITestingUtils {
  private mockProvider = new MockAIProvider()

  async setupMockProvider(options: TestOptions = {}) {
    this.mockProvider.configure({
      delay: options.delay || 100,
      shouldFail: options.shouldFail || false,
      responses: options.mockResponses || {}
    })

    await enhancedAIService.registerProvider('mock', MockAIProvider)
    await enhancedAIService.configure({
      provider: 'mock' as any,
      apiKey: 'mock-key'
    })
  }

  async resetMockProvider() {
    await enhancedAIService.configure({
      provider: 'local',
      apiKey: ''
    })
  }

  generateMockResponse(prompt: string): string {
    return `Mock response for: ${prompt}`
  }

  async simulateRateLimit() {
    this.mockProvider.configure({
      shouldFail: true,
      responses: {
        'error': 'Rate limit exceeded'
      }
    })
  }

  async simulateNetworkError() {
    this.mockProvider.configure({
      shouldFail: true,
      responses: {
        'error': 'Network timeout'
      }
    })
  }

  async getTestMetrics() {
    return enhancedAIService.getPerformanceStats()
  }
}