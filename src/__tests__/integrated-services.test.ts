// Comprehensive tests for all integrated services

import { createAI } from '@matthew.ngo/ai-toolkit'
import { createStorage } from '@matthew.ngo/chrome-storage'
import { ContentExtractorService } from '@matthew.ngo/content-extractor'
import { createAnalysis } from '@matthew.ngo/analysis-toolkit'
import { aiService, initializeAI } from '~core/ai-service'
import { contentExtractionService } from '~core/content-extraction-service'
import { analysisService, initializeAnalysis } from '~core/analysis-service'
import { initializeStorage, savedContent, aiAnalysisCache } from '~core/storage'

// Mock Chrome APIs
global.chrome = {
  runtime: {
    getManifest: () => ({ version: '1.0.0' }),
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn()
  }
} as any

describe('Integrated Services', () => {
  beforeAll(async () => {
    // Initialize all services
    await initializeStorage()
    await initializeAI()
    await initializeAnalysis()
  })

  describe('AI Service Integration', () => {
    it('should initialize AI with mock provider', async () => {
      const mockAI = await createAI({
        provider: 'mock',
        responses: new Map([
          ['test prompt', 'test response']
        ])
      })

      const response = await mockAI.generateText('test prompt')
      expect(response).toBe('test response')
    })

    it('should cache AI responses', async () => {
      const prompt = 'What is AI?'
      const cacheKey = `text:${prompt}:{}`

      // First call - should hit API
      const response1 = await aiService.generateText(prompt)

      // Check if cached
      const cached = await aiAnalysisCache.get(cacheKey)
      expect(cached).toBe(response1)

      // Second call - should hit cache
      const response2 = await aiService.generateText(prompt)
      expect(response2).toBe(response1)
    })

    it('should extract key points from text', async () => {
      const text = 'AI is transforming technology. Machine learning enables computers to learn. Deep learning mimics neural networks.'
      const keyPoints = await aiService.extractKeyPoints(text)

      expect(Array.isArray(keyPoints)).toBe(true)
      expect(keyPoints.length).toBeGreaterThan(0)
    })
  })

  describe('Content Extraction Integration', () => {
    it('should extract content from HTML', async () => {
      const html = `
        <html>
          <head><title>Test Article</title></head>
          <body>
            <h1>Test Heading</h1>
            <p>This is test content.</p>
          </body>
        </html>
      `

      const result = await contentExtractionService.extractFromHTML(
        html,
        'https://example.com'
      )

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Test Article')
      expect(result.data?.cleanText).toContain('Test Heading')
      expect(result.data?.cleanText).toContain('This is test content')
    })

    it('should cache extracted content', async () => {
      const url = 'https://example.com/test'
      const mockContent = {
        title: 'Cached Article',
        cleanText: 'Cached content',
        metadata: { source: url }
      }

      // Set cache
      await contentCache.set(url, mockContent)

      // Check if cached
      const cached = await contentCache.get(url)
      expect(cached).toEqual(mockContent)
    })
  })

  describe('Analysis Service Integration', () => {
    it('should analyze text with NLP features', async () => {
      const text = 'This is a great product! I absolutely love it.'
      const analysis = await analysisService.analyzeText(text, {
        includeNLP: true,
        includeSentiment: true
      })

      expect(analysis.aiAnalysis?.sentiment).toBeDefined()
      expect(analysis.nlpAnalysis?.sentiment.score).toBeGreaterThan(0)
    })

    it('should run custom analysis templates', async () => {
      const result = await analysisService.runCustomAnalysis('toneAnalysis', {
        content: 'We are excited to announce our new product!'
      })

      expect(result).toBeDefined()
    })
  })

  describe('Storage Integration', () => {
    it('should save and retrieve content', async () => {
      const content = {
        url: 'https://example.com/article',
        title: 'Test Article',
        content: { cleanText: 'Article content' },
        tags: ['test', 'article']
      }

      const saved = await savedContent.add(content)
      expect(saved.id).toBeDefined()

      const all = await savedContent.getAll()
      expect(all).toContainEqual(expect.objectContaining({
        title: 'Test Article'
      }))
    })

    it('should search saved content', async () => {
      // Add test content
      await savedContent.add({
        url: 'https://example.com/search-test',
        title: 'Quantum Computing Article',
        content: { cleanText: 'Quantum computing is revolutionary' },
        tags: ['quantum', 'computing']
      })

      const results = await savedContent.search('quantum')
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('End-to-End Integration', () => {
    it('should extract, analyze, and save content', async () => {
      const html = `
        <html>
          <head><title>AI Revolution</title></head>
          <body>
            <article>
              <h1>The AI Revolution</h1>
              <p>Artificial Intelligence is transforming our world in unprecedented ways.</p>
              <p>Machine learning algorithms are becoming more sophisticated every day.</p>
            </article>
          </body>
        </html>
      `

      // Extract content
      const extraction = await contentExtractionService.extractFromHTML(
        html,
        'https://example.com/ai-article'
      )
      expect(extraction.success).toBe(true)

      // Analyze content
      const analysis = await analysisService.analyzeText(
        extraction.data!.cleanText
      )
      expect(analysis.aiAnalysis).toBeDefined()

      // Save with analysis
      const saved = await savedContent.add({
        url: 'https://example.com/ai-article',
        title: extraction.data!.title,
        content: extraction.data,
        analysis: analysis,
        tags: ['ai', 'technology']
      })

      expect(saved.id).toBeDefined()
      expect(saved.analysis).toBeDefined()
    })
  })
})

// Performance tests
describe('Performance Tests', () => {
  it('should handle concurrent AI requests', async () => {
    const prompts = Array(5).fill(null).map((_, i) => `Test prompt ${i}`)

    const startTime = Date.now()
    const results = await Promise.all(
      prompts.map(prompt => aiService.generateText(prompt))
    )
    const endTime = Date.now()

    expect(results).toHaveLength(5)
    expect(endTime - startTime).toBeLessThan(5000) // Should complete in 5s
  })

  it('should efficiently batch extract content', async () => {
    const urls = [
      'https://example.com/1',
      'https://example.com/2',
      'https://example.com/3'
    ]

    const results = await contentExtractionService.extractBatch(urls)
    expect(results).toHaveLength(3)
  })
})

// Mock implementations for testing
class MockAIProvider {
  async generateText(prompt: string) {
    return `Mock response to: ${prompt}`
  }

  async generateEmbedding(text: string) {
    return Array(1536).fill(0).map(() => Math.random())
  }

  async analyzeSentiment(text: string) {
    return {
      sentiment: 'positive' as const,
      score: 0.8
    }
  }
}

// Helper functions for testing
export const testHelpers = {
  createMockContent() {
    return {
      title: 'Test Article',
      cleanText: 'This is test content for analysis.',
      metadata: {
        source: 'https://example.com/test',
        extractedAt: new Date()
      },
      wordCount: 6,
      readingTime: 1,
      language: 'en',
      quality: { score: 0.8 }
    }
  },

  createMockAnalysis() {
    return {
      id: 'analysis-123',
      type: 'content',
      status: 'completed' as const,
      aiAnalysis: {
        summary: 'Test summary',
        keyPoints: ['Point 1', 'Point 2'],
        sentiment: 'neutral' as const,
        tone: 'informative',
        themes: ['testing', 'analysis']
      },
      nlpAnalysis: {
        sentiment: { score: 0, comparative: 0 },
        language: 'en',
        readability: { grade: 8, score: 70, difficulty: 'moderate' as const },
        keywords: [{ word: 'test', count: 2, relevance: 0.9 }],
        entities: []
      }
    }
  },

  async setupTestEnvironment() {
    // Initialize with mock providers
    const mockStorage = createStorage('minimal')
    const mockAI = new MockAIProvider()
    const mockExtractor = new ContentExtractorService({ enabled: false })

    return {
      storage: mockStorage,
      ai: mockAI,
      extractor: mockExtractor
    }
  }
}