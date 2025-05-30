import { ScrapeTemplate, ScrapeResult, ExtractOptions, SelectorRule } from './types'
import { ContentExtractor } from './content-extractor'

export class WebScraper {
  private templates: Map<string, ScrapeTemplate> = new Map()

  constructor() {
    this.loadDefaultTemplates()
  }

  private loadDefaultTemplates() {
    // E-commerce product template
    this.addTemplate({
      name: 'ecommerce-product',
      description: 'Extract product information from e-commerce sites',
      rules: [
        { name: 'title', selector: 'h1, [itemprop="name"]', multiple: false },
        { name: 'price', selector: '[itemprop="price"], .price, .product-price', multiple: false },
        { name: 'description', selector: '[itemprop="description"], .product-description', multiple: false },
        { name: 'images', selector: '[itemprop="image"], .product-image img', attribute: 'src', multiple: true },
        { name: 'rating', selector: '[itemprop="ratingValue"], .rating', multiple: false },
        { name: 'availability', selector: '[itemprop="availability"], .availability', multiple: false }
      ]
    })

    // News article template
    this.addTemplate({
      name: 'news-article',
      description: 'Extract article content from news websites',
      rules: [
        { name: 'headline', selector: 'h1, [itemprop="headline"]', multiple: false },
        { name: 'author', selector: '[itemprop="author"], .author, .by-line', multiple: false },
        { name: 'publishDate', selector: 'time[datetime], [itemprop="datePublished"]', attribute: 'datetime', multiple: false },
        { name: 'content', selector: '[itemprop="articleBody"], .article-content, .post-content', multiple: false },
        { name: 'tags', selector: '.tag, .keyword, [rel="tag"]', multiple: true }
      ]
    })

    // Social media post template
    this.addTemplate({
      name: 'social-post',
      description: 'Extract social media post content',
      rules: [
        { name: 'author', selector: '.username, .author-name', multiple: false },
        { name: 'content', selector: '.post-content, .tweet-text', multiple: false },
        { name: 'timestamp', selector: 'time[datetime]', attribute: 'datetime', multiple: false },
        { name: 'likes', selector: '.like-count, .favorites', multiple: false },
        { name: 'shares', selector: '.share-count, .retweets', multiple: false }
      ]
    })
  }

  addTemplate(template: ScrapeTemplate) {
    this.templates.set(template.name, template)
  }

  async scrape(url: string, options?: {
    template?: string
    customRules?: SelectorRule[]
    extractOptions?: ExtractOptions
  }): Promise<ScrapeResult> {
    try {
      // Fetch the page
      const html = await this.fetchPage(url)

      // Extract content
      const extractor = new ContentExtractor(html, url, options?.extractOptions)
      const extracted = extractor.extract()

      // Apply template or custom rules
      let templateData = {}
      if (options?.template || options?.customRules) {
        templateData = this.applyRules(
          html,
          options.template ? this.templates.get(options.template)?.rules : options.customRules
        )
      }

      return {
        url,
        title: extracted.metadata?.title || '',
        content: extracted.article?.content || '',
        article: extracted.article || undefined,
        metadata: extracted.metadata,
        images: extracted.images,
        links: extracted.links,
        tables: extracted.tables,
        structuredData: extracted.structuredData,
        extractedAt: new Date(),
        ...templateData
      }
    } catch (error) {
      console.error('Scraping failed:', error)
      throw error
    }
  }

  async scrapeMultiple(urls: string[], options?: {
    template?: string
    parallel?: boolean
    maxConcurrency?: number
  }): Promise<ScrapeResult[]> {
    if (options?.parallel) {
      // Parallel scraping with concurrency control
      const maxConcurrency = options.maxConcurrency || 3
      const results: ScrapeResult[] = []

      for (let i = 0; i < urls.length; i += maxConcurrency) {
        const batch = urls.slice(i, i + maxConcurrency)
        const batchResults = await Promise.all(
          batch.map(url => this.scrape(url, { template: options.template }))
        )
        results.push(...batchResults)
      }

      return results
    } else {
      // Sequential scraping
      const results: ScrapeResult[] = []
      for (const url of urls) {
        const result = await this.scrape(url, { template: options?.template })
        results.push(result)
      }
      return results
    }
  }

  async scrapeDynamic(tabId: number, options?: {
    selector?: string
    waitForSelector?: string
    timeout?: number
    extractOptions?: ExtractOptions
  }): Promise<ScrapeResult> {
    // Execute content script in the tab
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (waitForSelector, timeout) => {
        return new Promise((resolve) => {
          const waitFor = async () => {
            if (waitForSelector) {
              const maxTime = Date.now() + (timeout || 5000)

              while (Date.now() < maxTime) {
                if (document.querySelector(waitForSelector)) {
                  break
                }
                await new Promise(r => setTimeout(r, 100))
              }
            }

            resolve({
              html: document.documentElement.outerHTML,
              url: window.location.href,
              title: document.title
            })
          }

          waitFor()
        })
      },
      args: [options?.waitForSelector, options?.timeout]
    })

    if (!results[0]?.result) {
      throw new Error('Failed to extract page content')
    }

    const { html, url } = results[0].result as any

    // Extract content
    const extractor = new ContentExtractor(html, url, options?.extractOptions)
    const extracted = extractor.extract()

    return {
      url,
      title: extracted.metadata?.title || '',
      content: extracted.article?.content || '',
      article: extracted.article || undefined,
      metadata: extracted.metadata,
      images: extracted.images,
      links: extracted.links,
      tables: extracted.tables,
      structuredData: extracted.structuredData,
      extractedAt: new Date()
    }
  }

  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
    }
    return response.text()
  }

  private applyRules(html: string, rules?: SelectorRule[]): Record<string, any> {
    if (!rules) return {}

    const doc = new DOMParser().parseFromString(html, 'text/html')
    const result: Record<string, any> = {}

    rules.forEach(rule => {
      const elements = doc.querySelectorAll(rule.selector)

      if (rule.multiple) {
        result[rule.name] = Array.from(elements).map(el => {
          const value = rule.attribute
            ? el.getAttribute(rule.attribute)
            : el.textContent?.trim()

          return rule.transform ? rule.transform(value || '') : value
        })
      } else {
        const element = elements[0]
        if (element) {
          const value = rule.attribute
            ? element.getAttribute(rule.attribute)
            : element.textContent?.trim()

          result[rule.name] = rule.transform ? rule.transform(value || '') : value
        }
      }
    })

    return result
  }
}