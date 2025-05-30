import { Readability } from '@mozilla/readability'
import DOMPurify from 'dompurify'
import {
  ExtractOptions,
  PageMetadata,
  ExtractedImage,
  ExtractedLink,
  ExtractedTable,
  Article
} from './types'

export class ContentExtractor {
  private doc: Document
  private url: string
  private options: ExtractOptions

  constructor(html: string, url: string, options: ExtractOptions = {}) {
    this.doc = new DOMParser().parseFromString(html, 'text/html')
    this.url = url
    this.options = {
      includeImages: true,
      includeLinks: true,
      includeMetadata: true,
      includeTables: true,
      includeStructuredData: true,
      cleanHTML: true,
      absoluteUrls: true,
      ...options
    }
  }

  extract() {
    return {
      article: this.extractArticle(),
      metadata: this.extractMetadata(),
      images: this.options.includeImages ? this.extractImages() : [],
      links: this.options.includeLinks ? this.extractLinks() : [],
      tables: this.options.includeTables ? this.extractTables() : [],
      structuredData: this.options.includeStructuredData ? this.extractStructuredData() : []
    }
  }

  extractArticle(): Article | null {
    try {
      const documentClone = this.doc.cloneNode(true) as Document
      const reader = new Readability(documentClone, {
        charThreshold: 50,
        keepClasses: ['highlight', 'important'],
        serializer: (el) => {
          if (this.options.cleanHTML) {
            return DOMPurify.sanitize(el.innerHTML, {
              ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'i', 'b', 'u', 'a', 'img',
                            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
                            'ul', 'ol', 'li', 'pre', 'code', 'table', 'thead',
                            'tbody', 'tr', 'td', 'th'],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
            })
          }
          return el.innerHTML
        }
      })

      const article = reader.parse()
      if (!article) return null

      // Calculate read time and word count
      const wordCount = article.textContent.split(/\s+/).length
      const estimatedReadTime = Math.ceil(wordCount / 200) // 200 words per minute

      // Extract images from content
      const contentDoc = new DOMParser().parseFromString(article.content, 'text/html')
      const images = Array.from(contentDoc.querySelectorAll('img'))
        .map(img => this.resolveUrl(img.src))
        .filter(Boolean)

      // Extract videos
      const videos = this.extractVideos(contentDoc)

      return {
        title: article.title,
        content: article.content,
        textContent: article.textContent,
        excerpt: article.excerpt,
        author: article.byline,
        siteName: article.siteName,
        publishedDate: this.extractPublishedDate(),
        leadImage: article.leadImageUrl ? this.resolveUrl(article.leadImageUrl) : undefined,
        favicon: this.extractFavicon(),
        images,
        videos,
        wordCount,
        estimatedReadTime,
        language: article.lang || this.doc.documentElement.lang
      }
    } catch (error) {
      console.error('Article extraction failed:', error)
      return null
    }
  }

  extractMetadata(): PageMetadata {
    const metadata: PageMetadata = {
      title: this.doc.title,
      url: this.url
    }

    // Basic meta tags
    const metaTags = this.doc.querySelectorAll('meta')
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property')
      const content = meta.getAttribute('content')

      if (!name || !content) return

      switch (name.toLowerCase()) {
        case 'description':
          metadata.description = content
          break
        case 'keywords':
          metadata.keywords = content.split(',').map(k => k.trim())
          break
        case 'author':
          metadata.author = content
          break
        case 'published_time':
        case 'article:published_time':
          metadata.publishedDate = new Date(content)
          break
        case 'modified_time':
        case 'article:modified_time':
          metadata.modifiedDate = new Date(content)
          break
      }

      // Open Graph
      if (name.startsWith('og:')) {
        metadata.openGraph = metadata.openGraph || {}
        metadata.openGraph[name.substring(3)] = content
      }

      // Twitter Card
      if (name.startsWith('twitter:')) {
        metadata.twitter = metadata.twitter || {}
        metadata.twitter[name.substring(8)] = content
      }
    })

    // Canonical URL
    const canonical = this.doc.querySelector('link[rel="canonical"]')
    if (canonical) {
      metadata.canonical = canonical.getAttribute('href') || undefined
    }

    // Favicon
    metadata.favicon = this.extractFavicon()

    // JSON-LD
    if (this.options.includeStructuredData) {
      metadata.jsonLd = this.extractStructuredData()
    }

    return metadata
  }

  extractImages(): ExtractedImage[] {
    const images: ExtractedImage[] = []
    const imgElements = this.doc.querySelectorAll('img')

    imgElements.forEach(img => {
      const src = this.resolveUrl(img.src)
      if (!src) return

      const image: ExtractedImage = {
        src,
        alt: img.alt,
        title: img.title,
        width: img.width || undefined,
        height: img.height || undefined,
        naturalWidth: img.naturalWidth || undefined,
        naturalHeight: img.naturalHeight || undefined
      }

      // Try to determine image type from URL
      const extension = src.split('.').pop()?.toLowerCase()
      if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        image.type = extension === 'jpg' ? 'jpeg' : extension
      }

      images.push(image)
    })

    return images
  }

  extractLinks(): ExtractedLink[] {
    const links: ExtractedLink[] = []
    const linkElements = this.doc.querySelectorAll('a[href]')

    linkElements.forEach(link => {
      const href = link.getAttribute('href')
      if (!href) return

      const resolvedHref = this.resolveUrl(href)
      if (!resolvedHref) return

      const extractedLink: ExtractedLink = {
        href: resolvedHref,
        text: link.textContent?.trim() || '',
        title: link.title,
        rel: link.rel,
        target: link.target,
        isExternal: this.isExternalUrl(resolvedHref),
        isDownload: link.hasAttribute('download') || this.isDownloadLink(resolvedHref)
      }

      links.push(extractedLink)
    })

    return links
  }

  extractTables(): ExtractedTable[] {
    const tables: ExtractedTable[] = []
    const tableElements = this.doc.querySelectorAll('table')

    tableElements.forEach(table => {
      const headers: string[] = []
      const rows: string[][] = []

      // Extract headers
      const headerCells = table.querySelectorAll('thead th, thead td')
      headerCells.forEach(cell => {
        headers.push(cell.textContent?.trim() || '')
      })

      // If no thead, try first row
      if (headers.length === 0) {
        const firstRow = table.querySelector('tr')
        if (firstRow) {
          firstRow.querySelectorAll('th, td').forEach(cell => {
            headers.push(cell.textContent?.trim() || '')
          })
        }
      }

      // Extract rows
      const rowElements = table.querySelectorAll('tbody tr, tr')
      rowElements.forEach((row, index) => {
        // Skip first row if it was used for headers
        if (index === 0 && headers.length > 0 && !table.querySelector('thead')) {
          return
        }

        const cells: string[] = []
        row.querySelectorAll('td, th').forEach(cell => {
          cells.push(cell.textContent?.trim() || '')
        })

        if (cells.length > 0) {
          rows.push(cells)
        }
      })

      // Extract caption
      const caption = table.querySelector('caption')?.textContent?.trim()

      if (headers.length > 0 || rows.length > 0) {
        tables.push({ headers, rows, caption })
      }
    })

    return tables
  }

  extractStructuredData(): any[] {
    const structuredData: any[] = []

    // JSON-LD
    const jsonLdScripts = this.doc.querySelectorAll('script[type="application/ld+json"]')
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '')
        structuredData.push(data)
      } catch (error) {
        console.error('Failed to parse JSON-LD:', error)
      }
    })

    // Microdata
    const itemScopes = this.doc.querySelectorAll('[itemscope]')
    itemScopes.forEach(scope => {
      const item = this.extractMicrodata(scope)
      if (item) {
        structuredData.push(item)
      }
    })

    return structuredData
  }

  private extractMicrodata(element: Element): any {
    const item: any = {}

    const itemType = element.getAttribute('itemtype')
    if (itemType) {
      item['@type'] = itemType
    }

    const props = element.querySelectorAll('[itemprop]')
    props.forEach(prop => {
      const propName = prop.getAttribute('itemprop')
      if (!propName) return

      let value: any
      if (prop.hasAttribute('content')) {
        value = prop.getAttribute('content')
      } else if (prop.hasAttribute('href')) {
        value = this.resolveUrl(prop.getAttribute('href') || '')
      } else if (prop.hasAttribute('src')) {
        value = this.resolveUrl(prop.getAttribute('src') || '')
      } else {
        value = prop.textContent?.trim()
      }

      if (value) {
        item[propName] = value
      }
    })

    return Object.keys(item).length > 0 ? item : null
  }

  private extractVideos(doc: Document): string[] {
    const videos: string[] = []

    // Video elements
    doc.querySelectorAll('video source, video[src]').forEach(video => {
      const src = video.getAttribute('src')
      if (src) {
        const resolved = this.resolveUrl(src)
        if (resolved) videos.push(resolved)
      }
    })

    // YouTube embeds
    doc.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').forEach(iframe => {
      const src = iframe.getAttribute('src')
      if (src) videos.push(src)
    })

    // Vimeo embeds
    doc.querySelectorAll('iframe[src*="vimeo.com"]').forEach(iframe => {
      const src = iframe.getAttribute('src')
      if (src) videos.push(src)
    })

    return [...new Set(videos)]
  }

  private extractPublishedDate(): Date | undefined {
    // Try various selectors
    const selectors = [
      'meta[name="published_time"]',
      'meta[property="article:published_time"]',
      'meta[name="pubdate"]',
      'meta[name="publishdate"]',
      'time[pubdate]',
      'time[datetime]',
      '.published-date',
      '.post-date',
      '.entry-date'
    ]

    for (const selector of selectors) {
      const element = this.doc.querySelector(selector)
      if (element) {
        const dateStr = element.getAttribute('content') ||
                       element.getAttribute('datetime') ||
                       element.textContent

        if (dateStr) {
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      }
    }

    return undefined
  }

  private extractFavicon(): string | undefined {
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]'
    ]

    for (const selector of selectors) {
      const element = this.doc.querySelector(selector)
      if (element) {
        const href = element.getAttribute('href')
        if (href) {
          return this.resolveUrl(href)
        }
      }
    }

    // Default favicon path
    return this.resolveUrl('/favicon.ico')
  }

  private resolveUrl(url: string): string {
    if (!url) return ''

    try {
      if (this.options.absoluteUrls) {
        return new URL(url, this.url).href
      }
      return url
    } catch (error) {
      return url
    }
  }

  private isExternalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const baseObj = new URL(this.url)
      return urlObj.hostname !== baseObj.hostname
    } catch {
      return false
    }
  }

  private isDownloadLink(url: string): boolean {
    const downloadExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.7z', '.tar', '.gz',
      '.mp3', '.mp4', '.avi', '.mov',
      '.exe', '.dmg', '.pkg', '.deb', '.rpm'
    ]

    return downloadExtensions.some(ext => url.toLowerCase().endsWith(ext))
  }
}