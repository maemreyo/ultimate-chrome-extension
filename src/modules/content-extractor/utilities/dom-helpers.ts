// src/modules/content-extractor/utilities/dom-helpers.ts
// Advanced DOM manipulation and content extraction utilities

/**
 * Advanced DOM element selector with scoring
 * @param document - Document to search in
 * @param selectors - Array of selectors with weights
 * @returns Best matching element
 */
export function findBestContentElement(
  document: Document,
  selectors: Array<{ selector: string; weight: number }>
): Element | null {
  let bestElement: Element | null = null
  let bestScore = 0

  for (const { selector, weight } of selectors) {
    const elements = document.querySelectorAll(selector)

    for (const element of elements) {
      const score = calculateElementScore(element) * weight
      if (score > bestScore) {
        bestScore = score
        bestElement = element
      }
    }
  }

  return bestElement
}

/**
 * Calculate content quality score for DOM element
 * @param element - Element to score
 * @returns Quality score (0-1)
 */
function calculateElementScore(element: Element): number {
  let score = 0

  // Text content length (normalized)
  const textLength = element.textContent?.length || 0
  score += Math.min(textLength / 1000, 1) * 0.3

  // Number of paragraphs
  const paragraphs = element.querySelectorAll("p").length
  score += Math.min(paragraphs / 10, 1) * 0.2

  // Presence of semantic elements
  const semanticElements = ["article", "section", "header", "main"]
  const semanticCount = semanticElements.reduce((count, tag) => {
    return count + element.querySelectorAll(tag).length
  }, 0)
  score += Math.min(semanticCount / 5, 1) * 0.2

  // Link density (lower is better for main content)
  const links = element.querySelectorAll("a").length
  const linkDensity = textLength > 0 ? links / (textLength / 100) : 0
  score += Math.max(0, 1 - linkDensity / 10) * 0.15

  // Class/ID indicators
  const classId = (element.className + " " + element.id).toLowerCase()
  const positiveIndicators = ["content", "article", "main", "post", "entry"]
  const negativeIndicators = ["sidebar", "nav", "footer", "header", "ad"]

  for (const indicator of positiveIndicators) {
    if (classId.includes(indicator)) score += 0.05
  }

  for (const indicator of negativeIndicators) {
    if (classId.includes(indicator)) score -= 0.1
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * Extract clean text from element, removing unwanted content
 * @param element - Element to extract from
 * @param options - Extraction options
 * @returns Clean text content
 */
export function extractCleanText(
  element: Element,
  options: {
    removeSelectors?: string[]
    preserveWhitespace?: boolean
    includeAltText?: boolean
  } = {}
): string {
  const clone = element.cloneNode(true) as Element

  // Remove unwanted elements
  const defaultRemoveSelectors = [
    "script",
    "style",
    "nav",
    "footer",
    "header",
    ".sidebar",
    ".advertisement",
    ".social-share",
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]'
  ]

  const removeSelectors = [
    ...defaultRemoveSelectors,
    ...(options.removeSelectors || [])
  ]

  for (const selector of removeSelectors) {
    const elements = clone.querySelectorAll(selector)
    elements.forEach((el) => el.remove())
  }

  // Include alt text from images if requested
  if (options.includeAltText) {
    const images = clone.querySelectorAll("img[alt]")
    images.forEach((img) => {
      const altText = img.getAttribute("alt")
      if (altText) {
        const textNode = document.createTextNode(` [Image: ${altText}] `)
        img.parentNode?.replaceChild(textNode, img)
      }
    })
  }

  let text = clone.textContent || ""

  // Normalize whitespace
  if (!options.preserveWhitespace) {
    text = text.replace(/\s+/g, " ").trim()
  }

  return text
}

/**
 * Extract structured data from DOM
 * @param document - Document to extract from
 * @returns Structured data objects
 */
export function extractStructuredData(document: Document): Array<{
  type: string
  data: any
}> {
  const structuredData: Array<{ type: string; data: any }> = []

  // JSON-LD
  const jsonLdScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  )
  jsonLdScripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || "")
      structuredData.push({ type: "json-ld", data })
    } catch (error) {
      console.warn("Failed to parse JSON-LD:", error)
    }
  })

  // Microdata
  const microdataElements = document.querySelectorAll("[itemscope]")
  microdataElements.forEach((element) => {
    const data = extractMicrodata(element)
    if (data) {
      structuredData.push({ type: "microdata", data })
    }
  })

  // Open Graph
  const ogData = extractOpenGraph(document)
  if (Object.keys(ogData).length > 0) {
    structuredData.push({ type: "opengraph", data: ogData })
  }

  // Twitter Cards
  const twitterData = extractTwitterCards(document)
  if (Object.keys(twitterData).length > 0) {
    structuredData.push({ type: "twitter", data: twitterData })
  }

  return structuredData
}

/**
 * Extract microdata from element
 * @param element - Element with microdata
 * @returns Microdata object
 */
function extractMicrodata(element: Element): any {
  const data: any = {}

  const itemType = element.getAttribute("itemtype")
  if (itemType) {
    data["@type"] = itemType
  }

  const properties = element.querySelectorAll("[itemprop]")
  properties.forEach((prop) => {
    const name = prop.getAttribute("itemprop")
    if (!name) return

    let value: any
    if (prop.hasAttribute("itemscope")) {
      value = extractMicrodata(prop)
    } else if (prop.tagName === "META") {
      value = prop.getAttribute("content")
    } else if (prop.tagName === "TIME") {
      value = prop.getAttribute("datetime") || prop.textContent
    } else {
      value = prop.textContent?.trim()
    }

    if (data[name]) {
      if (!Array.isArray(data[name])) {
        data[name] = [data[name]]
      }
      data[name].push(value)
    } else {
      data[name] = value
    }
  })

  return Object.keys(data).length > 0 ? data : null
}

/**
 * Extract Open Graph metadata
 * @param document - Document to extract from
 * @returns Open Graph data
 */
function extractOpenGraph(document: Document): Record<string, string> {
  const ogData: Record<string, string> = {}

  const ogTags = document.querySelectorAll('meta[property^="og:"]')
  ogTags.forEach((tag) => {
    const property = tag.getAttribute("property")
    const content = tag.getAttribute("content")
    if (property && content) {
      ogData[property] = content
    }
  })

  return ogData
}

/**
 * Extract Twitter Card metadata
 * @param document - Document to extract from
 * @returns Twitter Card data
 */
function extractTwitterCards(document: Document): Record<string, string> {
  const twitterData: Record<string, string> = {}

  const twitterTags = document.querySelectorAll('meta[name^="twitter:"]')
  twitterTags.forEach((tag) => {
    const name = tag.getAttribute("name")
    const content = tag.getAttribute("content")
    if (name && content) {
      twitterData[name] = content
    }
  })

  return twitterData
}

/**
 * Extract images with metadata
 * @param element - Element to extract images from
 * @returns Array of image metadata
 */
export function extractImages(element: Element): Array<{
  src: string
  alt?: string
  title?: string
  width?: number
  height?: number
  caption?: string
  isDecorative: boolean
}> {
  const images: Array<any> = []

  const imgElements = element.querySelectorAll("img")
  imgElements.forEach((img) => {
    const src = img.src || img.getAttribute("data-src")
    if (!src) return

    // Check if image is decorative
    const isDecorative =
      img.getAttribute("role") === "presentation" ||
      img.alt === "" ||
      img.hasAttribute("aria-hidden")

    // Find caption
    let caption: string | undefined
    const figure = img.closest("figure")
    if (figure) {
      const figcaption = figure.querySelector("figcaption")
      caption = figcaption?.textContent?.trim()
    }

    images.push({
      src,
      alt: img.alt || undefined,
      title: img.title || undefined,
      width: img.naturalWidth || undefined,
      height: img.naturalHeight || undefined,
      caption,
      isDecorative
    })
  })

  return images
}

/**
 * Extract tables with structure
 * @param element - Element to extract tables from
 * @returns Array of table data
 */
export function extractTables(element: Element): Array<{
  headers: string[]
  rows: string[][]
  caption?: string
  summary?: string
}> {
  const tables: Array<any> = []

  const tableElements = element.querySelectorAll("table")
  tableElements.forEach((table) => {
    const headers: string[] = []
    const rows: string[][] = []

    // Extract headers
    const headerCells = table.querySelectorAll("thead th, tr:first-child th")
    headerCells.forEach((cell) => {
      headers.push(cell.textContent?.trim() || "")
    })

    // Extract rows
    const bodyRows = table.querySelectorAll("tbody tr, tr:not(:first-child)")
    bodyRows.forEach((row) => {
      const cells: string[] = []
      const cellElements = row.querySelectorAll("td, th")
      cellElements.forEach((cell) => {
        cells.push(cell.textContent?.trim() || "")
      })
      if (cells.length > 0) {
        rows.push(cells)
      }
    })

    // Extract caption and summary
    const caption = table.querySelector("caption")?.textContent?.trim()
    const summary = table.getAttribute("summary")

    if (headers.length > 0 || rows.length > 0) {
      tables.push({
        headers,
        rows,
        caption,
        summary
      })
    }
  })

  return tables
}

/**
 * Calculate reading time estimate
 * @param text - Text content
 * @param wordsPerMinute - Reading speed (default: 200 WPM)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(
  text: string,
  wordsPerMinute: number = 200
): number {
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Detect language of text content
 * @param text - Text to analyze
 * @returns Detected language code
 */
export function detectLanguage(text: string): string {
  // Simple language detection based on common words
  // In production, use a proper language detection library

  const samples = text.toLowerCase().slice(0, 1000)

  const patterns = {
    en: /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/g,
    es: /\b(el|la|los|las|y|o|pero|en|de|con|por|para)\b/g,
    fr: /\b(le|la|les|et|ou|mais|dans|de|avec|par|pour)\b/g,
    de: /\b(der|die|das|und|oder|aber|in|von|mit|für)\b/g,
    it: /\b(il|la|i|le|e|o|ma|in|di|con|per)\b/g
  }

  let bestLang = "en"
  let bestScore = 0

  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = samples.match(pattern)
    const score = matches ? matches.length : 0

    if (score > bestScore) {
      bestScore = score
      bestLang = lang
    }
  }

  return bestLang
}
