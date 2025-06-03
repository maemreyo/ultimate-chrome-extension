import {
  ContentExtractorService,
  type ExtractedContent,
  type ExtractionOptions,
  type ExtractionResult
} from "@matthew.ngo/content-extractor"
import { sendToBackground } from "@plasmohq/messaging"
import { contentCache, getHistoryManager, savedContent } from "./storage"

// Initialize content extractor with caching
const extractor = new ContentExtractorService({
  enabled: true,
  ttl: 7200000, // 2 hours
  maxSize: 100, // 100MB
  strategy: "lru",
  persistent: false // Use our own storage instead
})

// Custom adapter for Chrome extension context
const chromeExtensionAdapter = {
  name: "chrome-extension",
  patterns: [/.*/], // Matches all URLs
  priority: 5, // Lower priority, used as fallback

  extract(doc: Document, url: string) {
    // Enhanced extraction for Chrome extension context
    const metaTags = Array.from(doc.querySelectorAll("meta")).reduce(
      (acc, meta) => {
        const name = meta.getAttribute("name") || meta.getAttribute("property")
        const content = meta.getAttribute("content")
        if (name && content) {
          acc[name] = content
        }
        return acc
      },
      {} as Record<string, string>
    )

    return {
      metadata: {
        ...metaTags,
        extractedVia: "chrome-extension"
      }
    }
  }
}

// Register custom adapter
extractor.registerAdapter(chromeExtensionAdapter)

// Content extraction service API
export const contentExtractionService = {
  // Extract from current tab
  async extractFromCurrentTab(
    options?: ExtractionOptions
  ): Promise<ExtractionResult> {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      if (!tab || !tab.id || !tab.url) {
        return {
          success: false,
          error: new Error("No active tab found")
        }
      }

      // Check cache first
      const cached = await contentCache.get(tab.url)
      if (cached) {
        await this.trackExtraction(tab.url, tab.title || "Unknown", true)
        return {
          success: true,
          data: cached
        }
      }

      // Inject content script to extract
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageContent,
        args: [options || {}]
      })

      if (result.result) {
        // Process with content extractor
        const extraction = await extractor.extractFromHTML(
          result.result.html,
          tab.url,
          {
            ...options,
            includeMetadata: true,
            detectSections: true,
            calculateReadability: true,
            extractEntities: true
          }
        )

        if (extraction.success) {
          // Cache the result
          await contentCache.set(tab.url, extraction.data)

          // Track extraction
          await this.trackExtraction(tab.url, extraction.data.title, false)

          return extraction
        }
      }

      return {
        success: false,
        error: new Error("Failed to extract content")
      }
    } catch (error) {
      console.error("Content extraction error:", error)
      return {
        success: false,
        error: error as Error
      }
    }
  },

  // Extract from URL
  async extractFromURL(
    url: string,
    options?: ExtractionOptions
  ): Promise<ExtractionResult> {
    // Check cache
    const cached = await contentCache.get(url)
    if (cached) {
      return {
        success: true,
        data: cached
      }
    }

    // Extract using the service
    const result = await extractor.extract(url, options)

    if (result.success) {
      // Cache the result
      await contentCache.set(url, result.data)

      // Track extraction
      await this.trackExtraction(url, result.data.title, false)
    }

    return result
  },

  // Extract and save
  async extractAndSave(
    url: string,
    tags: string[] = []
  ): Promise<ExtractedContent | null> {
    const result = await this.extractFromURL(url)

    if (result.success) {
      const saved = await savedContent.add({
        url,
        title: result.data.title,
        content: result.data,
        tags
      })

      return result.data
    }

    return null
  },

  // Batch extraction
  async extractBatch(urls: string[], options?: ExtractionOptions) {
    const results = await extractor.extractBatch(urls, {
      ...options,
      parallel: 3,
      retryFailed: true,
      continueOnError: true
    })

    // Cache successful extractions
    for (let i = 0; i < results.length; i++) {
      if (results[i].success) {
        await contentCache.set(urls[i], results[i].data)
      }
    }

    return results
  },

  // Stream extraction for large documents
  async *extractStream(url: string, options?: any) {
    const stream = extractor.extractStream(url, {
      ...options,
      chunkSize: 10,
      onProgress: (chunk) => {
        console.log("Extraction progress:", chunk)
      }
    })

    for await (const chunk of stream) {
      yield chunk
    }
  },

  // Export content in different formats
  async exportContent(
    content: ExtractedContent,
    format: "json" | "markdown" | "html"
  ) {
    return extractor.exportContent(content, format)
  },

  // Get extraction statistics
  async getStats() {
    const cacheStats = extractor.getCacheStats()
    const history = await getHistoryManager().getItems(
      {
        types: ["content-extraction"]
      },
      100
    )

    return {
      cache: cacheStats,
      recentExtractions: history.items.length,
      totalExtractions: history.total
    }
  },

  // Clear extraction cache
  async clearCache() {
    await extractor.clearCache()
    await contentCache.clear()
  },

  // Track extraction in history
  async trackExtraction(url: string, title: string, fromCache: boolean) {
    const historyManager = getHistoryManager()
    await historyManager.addItem({
      type: "content-extraction",
      title: `Extracted: ${title}`,
      description: `From ${new URL(url).hostname}`,
      data: { url, fromCache },
      metadata: {
        duration: fromCache ? 0 : 1000, // Estimate
        status: "success"
      }
    })
  },

  // Advanced extraction with AI enhancement
  async extractWithAI(url: string) {
    // First, extract content
    const extraction = await this.extractFromURL(url)
    if (!extraction.success) {
      return extraction
    }

    // Then enhance with AI analysis
    try {
      const aiAnalysis = await sendToBackground({
        name: "ai-analyze",
        body: {
          content: extraction.data,
          type: "webpage"
        }
      })

      return {
        success: true,
        data: {
          ...extraction.data,
          aiAnalysis
        }
      }
    } catch (error) {
      // Return extraction without AI if AI fails
      return extraction
    }
  }
}

// Function to inject into page for content extraction
function extractPageContent(options: any) {
  // Get page HTML
  const html = document.documentElement.outerHTML

  // Get additional metadata
  const metadata: any = {
    title: document.title,
    url: window.location.href,
    description: document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content"),
    author: document
      .querySelector('meta[name="author"]')
      ?.getAttribute("content"),
    publishDate: document
      .querySelector('meta[property="article:published_time"]')
      ?.getAttribute("content"),
    modifiedDate: document
      .querySelector('meta[property="article:modified_time"]')
      ?.getAttribute("content"),

    // OpenGraph data
    ogTitle: document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content"),
    ogDescription: document
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content"),
    ogImage: document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content"),
    ogType: document
      .querySelector('meta[property="og:type"]')
      ?.getAttribute("content"),

    // Twitter Card data
    twitterCard: document
      .querySelector('meta[name="twitter:card"]')
      ?.getAttribute("content"),
    twitterSite: document
      .querySelector('meta[name="twitter:site"]')
      ?.getAttribute("content"),

    // Schema.org data
    jsonLd: Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    )
      .map((script) => {
        try {
          return JSON.parse(script.textContent || "{}")
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }

  // Get main content area (heuristic)
  const contentSelectors = [
    "main",
    "article",
    '[role="main"]',
    "#content",
    ".content",
    "#main",
    ".main"
  ]

  let mainContent = null
  for (const selector of contentSelectors) {
    mainContent = document.querySelector(selector)
    if (mainContent) break
  }

  return {
    html,
    metadata,
    mainContentHTML: mainContent?.innerHTML || null
  }
}
