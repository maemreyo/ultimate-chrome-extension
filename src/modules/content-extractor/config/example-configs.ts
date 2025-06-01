// Example configurations for different use cases

import { ContentExtractorService } from '../content-extractor-service'
import {
  MediumAdapter,
  GitHubAdapter,
  WikipediaAdapter
} from '../site-adapters'

// 1. Basic Configuration - Simple content extraction
export const basicConfig = {
  cache: {
    enabled: true,
    ttl: 3600000, // 1 hour
    strategy: 'lru' as const
  },
  extraction: {
    includeMetadata: true,
    detectSections: true,
    minParagraphLength: 50
  }
}

// 2. Performance Configuration - For high-volume extraction
export const performanceConfig = {
  cache: {
    enabled: true,
    ttl: 7200000, // 2 hours
    maxSize: 100, // 100MB cache
    strategy: 'lru' as const,
    persistent: true
  },
  extraction: {
    includeMetadata: false, // Skip metadata for speed
    detectSections: false,
    extractTables: false,
    extractLists: false,
    timeout: 10000 // 10s timeout
  },
  performance: {
    concurrency: 5,
    retryAttempts: 2,
    retryDelay: 1000
  }
}

// 3. Quality Configuration - For best extraction quality
export const qualityConfig = {
  cache: {
    enabled: true,
    ttl: 1800000, // 30 minutes
    strategy: 'lru' as const
  },
  extraction: {
    includeMetadata: true,
    detectSections: true,
    extractTables: true,
    extractLists: true,
    extractEmbeds: true,
    extractStructuredData: true,
    extractEntities: true,
    calculateReadability: true,
    scoreParagraphs: true,
    minParagraphLength: 20
  },
  cleaning: {
    removeAds: true,
    removeNavigation: true,
    removeComments: true,
    removeRelated: true,
    removeFooters: true,
    removeSidebars: true,
    preserveImages: true,
    preserveVideos: true,
    preserveTables: true,
    aggressiveMode: true
  }
}

// 4. Privacy Configuration - For privacy-conscious extraction
export const privacyConfig = {
  cache: {
    enabled: false, // No caching for privacy
    persistent: false
  },
  extraction: {
    includeMetadata: false,
    stripTracking: true,
    anonymizeLinks: true
  },
  cleaning: {
    removeAds: true,
    removeSocial: true,
    removeTracking: true,
    removeAnalytics: true
  },
  privacy: {
    proxyImages: true,
    stripReferrer: true,
    removeExternalScripts: true
  }
}

// 5. Development Configuration - For debugging
export const developmentConfig = {
  cache: {
    enabled: false, // No cache in dev
    persistent: false
  },
  extraction: {
    includeMetadata: true,
    detectSections: true,
    extractTables: true,
    extractLists: true,
    extractEmbeds: true,
    extractStructuredData: true,
    extractEntities: true,
    calculateReadability: true,
    scoreParagraphs: true,
    debug: true // Enable debug logging
  },
  logging: {
    level: 'debug',
    logRequests: true,
    logCache: true,
    logPerformance: true
  }
}

// Usage Examples
export class ContentExtractorExamples {

  // Example 1: Basic usage with custom config
  static async basicExample() {
    const extractor = new ContentExtractorService(basicConfig.cache)

    const result = await extractor.extract('https://example.com/article', {
      ...basicConfig.extraction
    })

    if (result.success) {
      console.log('Title:', result.data.title)
      console.log('Word count:', result.data.wordCount)
      console.log('Reading time:', result.data.readingTime)
    }
  }

  // Example 2: Batch extraction with performance config
  static async batchExample() {
    const extractor = new ContentExtractorService(performanceConfig.cache)

    const urls = [
      'https://example.com/article1',
      'https://example.com/article2',
      'https://example.com/article3'
    ]

    const results = await extractor.extractBatch(
      urls,
      performanceConfig.extraction,
      performanceConfig.performance.concurrency
    )

    results.forEach((result, index) => {
      if (result.success) {
        console.log(`Article ${index + 1}:`, result.data.title)
      }
    })
  }

  // Example 3: Quality extraction with custom adapters
  static async qualityExample() {
    const extractor = new ContentExtractorService(qualityConfig.cache)

    // Register specialized adapters
    await extractor.registerPlugin({
      name: 'medium-enhancer',
      version: '1.0.0',
      afterExtract: (content) => {
        // Enhance Medium articles
        if (content.metadata.source?.includes('medium.com')) {
          content.metadata.platform = 'Medium'
          // Add reading time estimate specific to Medium
          content.readingTime = Math.ceil(content.wordCount / 265)
        }
        return content
      }
    })

    const result = await extractor.extract(
      'https://medium.com/@user/article',
      qualityConfig.extraction
    )

    if (result.success) {
      console.log('Quality score:', result.data.quality.score)
      console.log('Readability:', result.data.paragraphs[0]?.readability)
    }
  }

  // Example 4: Privacy-focused extraction
  static async privacyExample() {
    const extractor = new ContentExtractorService(privacyConfig.cache)

    // Add privacy plugin
    await extractor.registerPlugin({
      name: 'privacy-guard',
      version: '1.0.0',
      beforeExtract: (doc) => {
        // Remove tracking scripts
        doc.querySelectorAll('script[src*="analytics"]').forEach(el => el.remove())
        doc.querySelectorAll('img[src*="pixel"]').forEach(el => el.remove())
        return doc
      },
      afterExtract: (content) => {
        // Strip sensitive metadata
        delete content.metadata.author
        delete content.metadata.publishDate
        return content
      }
    })

    const result = await extractor.extract(
      'https://news-site.com/article',
      privacyConfig.extraction
    )

    if (result.success) {
      console.log('Cleaned content:', result.data.cleanText)
    }
  }

  // Example 5: Streaming extraction for large documents
  static async streamingExample() {
    const extractor = new ContentExtractorService()

    // Note: This would use the StreamingExtractor from enhancements
    const events = {
      onProgress: (progress: any) => {
        console.log(`Progress: ${progress.phase} - ${progress.progress}%`)
      },
      onComplete: (content: any) => {
        console.log('Extraction complete!')
      }
    }

    const result = await extractor.extract(
      'https://example.com/large-document',
      { lazy: true },
      events
    )
  }

  // Example 6: Monitor content changes
  static async monitoringExample() {
    const extractor = new ContentExtractorService()

    // Extract initial content
    const initial = await extractor.extract('https://news-site.com')

    // Check for changes after 5 minutes
    setTimeout(async () => {
      const updated = await extractor.extract('https://news-site.com')

      if (initial.success && updated.success) {
        if (initial.data.fingerprint !== updated.data.fingerprint) {
          console.log('Content has changed!')
          // Compare paragraphs to find specific changes
        }
      }
    }, 5 * 60 * 1000)
  }

  // Example 7: Export in different formats
  static async exportExample() {
    const extractor = new ContentExtractorService()

    const result = await extractor.extract('https://example.com/article')

    if (result.success) {
      // Export as Markdown
      const markdown = await extractor.exportContent(result.data, 'markdown')
      console.log('Markdown:', markdown)

      // Export as JSON
      const json = await extractor.exportContent(result.data, 'json')
      console.log('JSON:', json)

      // Export as HTML
      const html = await extractor.exportContent(result.data, 'html')
      console.log('HTML:', html)
    }
  }

  // Example 8: Chrome Extension Integration
  static async chromeExtensionExample() {
    const extractor = new ContentExtractorService({
      persistent: true // Use persistent storage in extension
    })

    // Extract from current tab
    const result = await extractor.extractFromCurrentTab({
      cleaningOptions: {
        removeAds: true,
        preserveImages: true
      }
    })

    if (result.success) {
      // Save to bookmarks or reading list
      chrome.storage.local.set({
        [`article_${Date.now()}`]: {
          title: result.data.title,
          url: result.data.metadata.source,
          content: result.data.cleanText,
          savedAt: new Date()
        }
      })
    }
  }

  // Example 9: React Integration
  static ReactHookExample() {
    // This would be in a separate React file
    return `
import { useState, useCallback } from 'react'
import { ContentExtractorService } from '@content-extractor/core'

export function useContentExtractor(config = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [content, setContent] = useState(null)

  const extractor = useMemo(
    () => new ContentExtractorService(config),
    [config]
  )

  const extract = useCallback(async (url, options) => {
    setLoading(true)
    setError(null)

    try {
      const result = await extractor.extract(url, options)

      if (result.success) {
        setContent(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [extractor])

  return { extract, content, loading, error }
}

// Usage in component
function ArticleReader() {
  const { extract, content, loading } = useContentExtractor(qualityConfig)

  const handleExtract = () => {
    extract('https://example.com/article')
  }

  return (
    <div>
      <button onClick={handleExtract}>Extract Article</button>
      {loading && <p>Loading...</p>}
      {content && (
        <article>
          <h1>{content.title}</h1>
          <p>{content.readingTime} min read</p>
          <div>{content.cleanText}</div>
        </article>
      )}
    </div>
  )
}
    `
  }

  // Example 10: Node.js Server Integration
  static NodeServerExample() {
    return `
import express from 'express'
import { ContentExtractorService } from '@content-extractor/core'
import { performanceConfig } from './configs'

const app = express()
const extractor = new ContentExtractorService(performanceConfig.cache)

// Extraction endpoint
app.post('/api/extract', async (req, res) => {
  const { url, options } = req.body

  try {
    const result = await extractor.extract(url, {
      ...performanceConfig.extraction,
      ...options
    })

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error.message
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Batch extraction endpoint
app.post('/api/extract/batch', async (req, res) => {
  const { urls, options } = req.body

  const results = await extractor.extractBatch(
    urls,
    options,
    performanceConfig.performance.concurrency
  )

  res.json({ results })
})

// Cache stats endpoint
app.get('/api/stats', (req, res) => {
  res.json(extractor.getCacheStats())
})

app.listen(3000, () => {
  console.log('Content Extractor API running on port 3000')
})
    `
  }
}