// Comprehensive test suite for Content Extractor module

import { ContentExtractorService } from '../content-extractor-service'
import { TextExtractor } from '../text-extractor'
import { ParagraphDetector } from '../paragraph-detector'
import { ContentCleaner } from '../content-cleaner'
import {
  MediumAdapter,
  GitHubAdapter,
  WikipediaAdapter,
  registerAdapter,
  getSiteAdapter
} from '../site-adapters'
import type { ExtractedContent, ExtractionOptions } from '../types'

// Mock fetch for testing
global.fetch = jest.fn()

describe('ContentExtractorService', () => {
  let extractor: ContentExtractorService

  beforeEach(() => {
    extractor = new ContentExtractorService({
      enabled: true,
      persistent: false // Don't use persistent storage in tests
    })
    jest.clearAllMocks()
  })

  describe('Core Extraction', () => {
    it('should extract content from URL successfully', async () => {
      const mockHtml = `
        <html>
          <head><title>Test Article</title></head>
          <body>
            <article>
              <h1>Test Article Title</h1>
              <p>This is a test paragraph with some content.</p>
              <p>Another paragraph with more information.</p>
            </article>
          </body>
        </html>
      `

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        text: async () => mockHtml
      })

      const result = await extractor.extract('https://example.com/article')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Article Title')
        expect(result.data.paragraphs).toHaveLength(2)
        expect(result.data.wordCount).toBeGreaterThan(0)
      }
    })

    it('should handle extraction errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await extractor.extract('https://example.com/article')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe('Network error')
      }
    })

    it('should extract from HTML string', async () => {
      const html = '<h1>Title</h1><p>Content</p>'
      const result = await extractor.extractFromHTML(
        html,
        'https://example.com'
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Title')
        expect(result.data.paragraphs).toHaveLength(1)
      }
    })

    it('should extract from Document object', async () => {
      const doc = new DOMParser().parseFromString(
        '<h1>Title</h1><p>Content</p>',
        'text/html'
      )

      const result = await extractor.extractFromDocument(
        doc,
        'https://example.com'
      )

      expect(result.success).toBe(true)
    })
  })

  describe('Cache Management', () => {
    it('should cache extraction results', async () => {
      const mockHtml = '<h1>Cached Content</h1>'
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        text: async () => mockHtml
      })

      // First extraction
      await extractor.extract('https://example.com/cached')

      // Second extraction should use cache
      const result = await extractor.extract('https://example.com/cached')

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)
    })

    it('should respect cache TTL', async () => {
      jest.useFakeTimers()

      const shortTTLExtractor = new ContentExtractorService({
        enabled: true,
        ttl: 1000, // 1 second
        persistent: false
      })

      const mockHtml = '<h1>TTL Test</h1>'
      ;(global.fetch as jest.Mock).mockResolvedValue({
        text: async () => mockHtml
      })

      // First extraction
      await shortTTLExtractor.extract('https://example.com/ttl')

      // Advance time past TTL
      jest.advanceTimersByTime(2000)

      // Should fetch again
      await shortTTLExtractor.extract('https://example.com/ttl')

      expect(global.fetch).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })

    it('should provide accurate cache statistics', async () => {
      const mockHtml = '<h1>Stats Test</h1>'
      ;(global.fetch as jest.Mock).mockResolvedValue({
        text: async () => mockHtml
      })

      // Make some requests
      await extractor.extract('https://example.com/1')
      await extractor.extract('https://example.com/1') // Cache hit
      await extractor.extract('https://example.com/2')

      const stats = extractor.getCacheStats()

      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBeCloseTo(0.333, 2)
    })
  })

  describe('Plugin System', () => {
    it('should register and execute plugins', async () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        afterExtract: jest.fn((content) => ({
          ...content,
          metadata: {
            ...content.metadata,
            pluginProcessed: true
          }
        }))
      }

      await extractor.registerPlugin(mockPlugin)

      const mockHtml = '<h1>Plugin Test</h1>'
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        text: async () => mockHtml
      })

      const result = await extractor.extract('https://example.com/plugin')

      expect(mockPlugin.afterExtract).toHaveBeenCalled()
      if (result.success) {
        expect(result.data.metadata.pluginProcessed).toBe(true)
      }
    })

    it('should unregister plugins', async () => {
      const mockPlugin = {
        name: 'removable-plugin',
        version: '1.0.0',
        afterExtract: jest.fn()
      }

      await extractor.registerPlugin(mockPlugin)
      extractor.unregisterPlugin('removable-plugin')

      const plugins = extractor.getPlugins()
      expect(plugins).not.toContainEqual(
        expect.objectContaining({ name: 'removable-plugin' })
      )
    })
  })

  describe('Batch Extraction', () => {
    it('should extract multiple URLs concurrently', async () => {
      const urls = [
        'https://example.com/1',
        'https://example.com/2',
        'https://example.com/3'
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        text: async () => '<h1>Batch Test</h1>'
      })

      const results = await extractor.extractBatch(urls, {}, 2)

      expect(results).toHaveLength(3)
      expect(results.every(r => r.success)).toBe(true)
    })

    it('should handle mixed success/failure in batch', async () => {
      const urls = ['https://example.com/1', 'https://example.com/2']

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ text: async () => '<h1>Success</h1>' })
        .mockRejectedValueOnce(new Error('Failed'))

      const results = await extractor.extractBatch(urls)

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const rateLimitedExtractor = new ContentExtractorService()

      // Make many rapid requests
      const promises = Array(15).fill(null).map((_, i) =>
        rateLimitedExtractor.extract(`https://example.com/${i}`)
      )

      const results = await Promise.all(promises)

      // Some should fail due to rate limiting
      const failures = results.filter(r => !r.success)
      expect(failures.length).toBeGreaterThan(0)
      expect(failures[0].error.message).toContain('Rate limit')
    })

    it('should provide rate limit info', () => {
      const info = extractor.getRateLimitInfo('https://example.com')

      expect(info.remaining).toBeGreaterThanOrEqual(0)
      expect(info.resetTime).toBeGreaterThan(Date.now())
    })
  })
})

describe('TextExtractor', () => {
  let textExtractor: TextExtractor

  beforeEach(() => {
    textExtractor = new TextExtractor()
  })

  it('should extract title correctly', async () => {
    const doc = new DOMParser().parseFromString(`
      <html>
        <head>
          <title>Page Title | Site Name</title>
          <meta property="og:title" content="OG Title">
        </head>
        <body>
          <h1>Article Title</h1>
        </body>
      </html>
    `, 'text/html')

    const content = await textExtractor.extractEnhanced(
      doc,
      'https://example.com'
    )

    expect(content.title).toBe('Article Title')
  })

  it('should calculate readability scores', async () => {
    const doc = new DOMParser().parseFromString(`
      <p>This is a simple sentence. It has short words.</p>
      <p>This paragraph contains significantly more complex vocabulary and intricate sentence structures that demonstrate advanced linguistic constructions.</p>
    `, 'text/html')

    const content = await textExtractor.extractEnhanced(
      doc,
      'https://example.com',
      { calculateReadability: true }
    )

    expect(content.paragraphs[0].readability).toBeDefined()
    expect(content.paragraphs[0].readability!.fleschKincaid).toBeLessThan(
      content.paragraphs[1].readability!.fleschKincaid
    )
  })

  it('should extract entities', async () => {
    const doc = new DOMParser().parseFromString(`
      <p>Apple Inc. announced on January 15, 2024 that they earned $100 billion.</p>
    `, 'text/html')

    const content = await textExtractor.extractEnhanced(
      doc,
      'https://example.com',
      { extractEntities: true }
    )

    const entities = content.paragraphs[0].entities!

    expect(entities).toContainEqual(
      expect.objectContaining({ type: 'date' })
    )
    expect(entities).toContainEqual(
      expect.objectContaining({ type: 'money' })
    )
    expect(entities).toContainEqual(
      expect.objectContaining({ type: 'organization' })
    )
  })

  it('should detect content sections', async () => {
    const doc = new DOMParser().parseFromString(`
      <h1>Main Title</h1>
      <p>Introduction paragraph</p>
      <h2>Section 1</h2>
      <p>Section 1 content</p>
      <h2>Section 2</h2>
      <p>Section 2 content</p>
    `, 'text/html')

    const content = await textExtractor.extractEnhanced(
      doc,
      'https://example.com',
      { detectSections: true }
    )

    expect(content.sections).toHaveLength(2)
    expect(content.sections[0].title).toBe('Section 1')
    expect(content.sections[1].title).toBe('Section 2')
  })
})

describe('Site Adapters', () => {
  it('should select correct adapter for URL', () => {
    expect(getSiteAdapter('https://medium.com/article')).toBeInstanceOf(MediumAdapter)
    expect(getSiteAdapter('https://github.com/user/repo')).toBeInstanceOf(GitHubAdapter)
    expect(getSiteAdapter('https://en.wikipedia.org/wiki/Test')).toBeInstanceOf(WikipediaAdapter)
  })

  it('should allow custom adapter registration', () => {
    const customAdapter = {
      name: 'custom',
      patterns: [/custom\.site/],
      extract: jest.fn()
    }

    registerAdapter(customAdapter)

    expect(getSiteAdapter('https://custom.site/page')).toBe(customAdapter)
  })
})

describe('Content Quality', () => {
  it('should calculate quality score accurately', async () => {
    const highQualityDoc = new DOMParser().parseFromString(`
      <article>
        <h1>High Quality Article</h1>
        <p>This is a well-structured paragraph with meaningful content that provides value to readers.</p>
        <h2>Section Title</h2>
        <p>Another paragraph with substantial information and proper formatting.</p>
        <img src="image.jpg" alt="Relevant image">
      </article>
    `, 'text/html')

    const lowQualityDoc = new DOMParser().parseFromString(`
      <div>
        <a href="/link1">Link</a>
        <a href="/link2">Link</a>
        <div class="ad">Advertisement</div>
        <p>Short.</p>
      </div>
    `, 'text/html')

    const textExtractor = new TextExtractor()

    const highQuality = await textExtractor.extractEnhanced(
      highQualityDoc,
      'https://example.com'
    )
    const lowQuality = await textExtractor.extractEnhanced(
      lowQualityDoc,
      'https://example.com'
    )

    expect(highQuality.quality.score).toBeGreaterThan(0.6)
    expect(lowQuality.quality.score).toBeLessThan(0.4)
  })
})

describe('Export Functionality', () => {
  it('should export content as Markdown', async () => {
    const content: ExtractedContent = {
      title: 'Test Article',
      paragraphs: [
        {
          id: 'p1',
          text: 'First paragraph',
          html: '<p>First paragraph</p>',
          index: 0,
          element: 'p',
          bounds: new DOMRect(),
          isQuote: false,
          isCode: false,
          isHeading: false,
          importance: 0.7
        }
      ],
      cleanText: 'First paragraph',
      metadata: {
        author: 'Test Author',
        publishDate: new Date('2024-01-01'),
        source: 'example.com',
        extractedAt: new Date(),
        tags: []
      },
      sections: [],
      readingTime: 1,
      wordCount: 2,
      language: 'en',
      quality: {
        score: 0.8,
        textDensity: 0.8,
        linkDensity: 0.1,
        adDensity: 0,
        readabilityScore: 0.9,
        structureScore: 0.8,
        completeness: 0.9
      },
      fingerprint: 'abc123'
    }

    const markdown = await extractor.exportContent(content, 'markdown')

    expect(markdown).toContain('# Test Article')
    expect(markdown).toContain('**Author:** Test Author')
    expect(markdown).toContain('First paragraph')
  })

  it('should export content as HTML', async () => {
    const content: ExtractedContent = {
      title: 'Test Article',
      paragraphs: [{
        id: 'p1',
        text: 'Content',
        html: '<p>Content</p>',
        index: 0,
        element: 'p',
        bounds: new DOMRect(),
        isQuote: false,
        isCode: false,
        isHeading: false,
        importance: 0.7
      }],
      cleanText: 'Content',
      metadata: {
        source: 'example.com',
        extractedAt: new Date(),
        tags: []
      },
      sections: [],
      readingTime: 1,
      wordCount: 1,
      language: 'en',
      quality: {
        score: 0.7,
        textDensity: 0.7,
        linkDensity: 0.1,
        adDensity: 0,
        readabilityScore: 0.8,
        structureScore: 0.7,
        completeness: 0.8
      },
      fingerprint: 'xyz789'
    }

    const html = await extractor.exportContent(content, 'html')

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>Test Article</title>')
    expect(html).toContain('<h1>Test Article</h1>')
  })
})

describe('Content Validation', () => {
  it('should validate extracted content', () => {
    const validContent: ExtractedContent = {
      title: 'Valid Article',
      paragraphs: Array(5).fill({
        id: 'p1',
        text: 'This is a valid paragraph with enough content.',
        html: '<p>This is a valid paragraph with enough content.</p>',
        index: 0,
        element: 'p',
        bounds: new DOMRect(),
        isQuote: false,
        isCode: false,
        isHeading: false,
        importance: 0.7
      }),
      cleanText: 'Content '.repeat(100),
      wordCount: 100,
      quality: { score: 0.8 } as any,
      metadata: {} as any,
      sections: [],
      readingTime: 1,
      language: 'en',
      fingerprint: 'abc'
    }

    const invalidContent: ExtractedContent = {
      ...validContent,
      title: '',
      paragraphs: [],
      wordCount: 10,
      quality: { score: 0.2 } as any
    }

    const validResult = extractor.validateContent(validContent)
    const invalidResult = extractor.validateContent(invalidContent)

    expect(validResult.valid).toBe(true)
    expect(validResult.errors).toHaveLength(0)

    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.errors).toContain('Missing title')
    expect(invalidResult.errors).toContain('No paragraphs extracted')
  })
})