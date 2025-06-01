// src/modules/analysis/utilities/parsing-helpers.ts
// Response parsing and data extraction utilities

/**
 * Parse structured response from AI
 * @param response - Raw AI response
 * @param expectedFormat - Expected format
 * @returns Parsed data
 */
export function parseStructuredResponse(
  response: string,
  expectedFormat: "json" | "markdown" | "yaml" | "xml"
): any {
  try {
    switch (expectedFormat) {
      case "json":
        return parseJSON(response)
      case "markdown":
        return parseMarkdown(response)
      case "yaml":
        return parseYAML(response)
      case "xml":
        return parseXML(response)
      default:
        return response
    }
  } catch (error) {
    throw new Error(`Failed to parse ${expectedFormat}: ${error.message}`)
  }
}

/**
 * Parse JSON from response, handling common AI formatting issues
 * @param response - Response containing JSON
 * @returns Parsed JSON object
 */
function parseJSON(response: string): any {
  // Remove markdown code blocks
  let cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "")

  // Remove common prefixes
  cleaned = cleaned.replace(/^(Here's the|The result is|JSON:)\s*/i, "")

  // Find JSON-like content
  const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  return JSON.parse(cleaned)
}

/**
 * Parse markdown response into structured data
 * @param response - Markdown response
 * @returns Structured data
 */
function parseMarkdown(response: string): {
  title?: string
  sections: Array<{
    heading: string
    level: number
    content: string
    subsections?: any[]
  }>
  metadata?: Record<string, any>
} {
  const lines = response.split("\n")
  const sections: any[] = []
  let currentSection: any = null
  let title: string | undefined

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)

    if (headingMatch) {
      const level = headingMatch[1].length
      const heading = headingMatch[2].trim()

      if (level === 1 && !title) {
        title = heading
        continue
      }

      if (currentSection) {
        sections.push(currentSection)
      }

      currentSection = {
        heading,
        level,
        content: "",
        subsections: []
      }
    } else if (currentSection) {
      currentSection.content += line + "\n"
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return { title, sections }
}

/**
 * Parse YAML from response
 * @param response - Response containing YAML
 * @returns Parsed YAML object
 */
function parseYAML(response: string): any {
  // Basic YAML parsing (for simple cases)
  // In production, use a proper YAML library like 'js-yaml'
  let cleaned = response.replace(/```yaml\n?/g, "").replace(/```\n?/g, "")

  const lines = cleaned.split("\n")
  const result: any = {}
  let currentKey = ""

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const colonIndex = trimmed.indexOf(":")
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim()
      const value = trimmed.substring(colonIndex + 1).trim()

      if (value) {
        result[key] = parseYAMLValue(value)
      } else {
        currentKey = key
        result[key] = {}
      }
    } else if (currentKey && trimmed.startsWith("-")) {
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = []
      }
      result[currentKey].push(trimmed.substring(1).trim())
    }
  }

  return result
}

/**
 * Parse XML from response
 * @param response - Response containing XML
 * @returns Parsed XML object
 */
function parseXML(response: string): any {
  // Basic XML parsing (for simple cases)
  // In production, use DOMParser or xml2js
  const cleaned = response.replace(/```xml\n?/g, "").replace(/```\n?/g, "")

  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser()
    const doc = parser.parseFromString(cleaned, "text/xml")
    return xmlToObject(doc.documentElement)
  }

  throw new Error("XML parsing not supported in this environment")
}

/**
 * Convert XML element to object
 * @param element - XML element
 * @returns Object representation
 */
function xmlToObject(element: Element): any {
  const result: any = {}

  // Add attributes
  for (const attr of Array.from(element.attributes)) {
    result[`@${attr.name}`] = attr.value
  }

  // Add child elements
  const children = Array.from(element.children)
  if (children.length === 0) {
    return element.textContent || ""
  }

  for (const child of children) {
    const childName = child.tagName
    const childValue = xmlToObject(child)

    if (result[childName]) {
      if (!Array.isArray(result[childName])) {
        result[childName] = [result[childName]]
      }
      result[childName].push(childValue)
    } else {
      result[childName] = childValue
    }
  }

  return result
}

/**
 * Parse YAML value with type inference
 * @param value - String value to parse
 * @returns Parsed value with correct type
 */
function parseYAMLValue(value: string): any {
  const trimmed = value.trim()

  // Boolean
  if (trimmed === "true") return true
  if (trimmed === "false") return false

  // Null
  if (trimmed === "null" || trimmed === "~") return null

  // Number
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed)

  // String (remove quotes if present)
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

/**
 * Extract key-value pairs from text
 * @param text - Text to extract from
 * @param patterns - Extraction patterns
 * @returns Extracted key-value pairs
 */
export function extractKeyValuePairs(
  text: string,
  patterns: Array<{
    key: string
    pattern: RegExp
    transform?: (value: string) => any
  }>
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const { key, pattern, transform } of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = match[1] || match[0]
      result[key] = transform ? transform(value) : value
    }
  }

  return result
}

/**
 * Extract scores and ratings from text
 * @param text - Text containing scores
 * @returns Extracted scores
 */
export function extractScores(text: string): Record<string, number> {
  const scorePatterns = [
    /(\w+):\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/g, // "Quality: 8/10"
    /(\w+)\s*score:\s*(\d+(?:\.\d+)?)/gi, // "Quality score: 8.5"
    /(\w+):\s*(\d+(?:\.\d+)?)%/g, // "Accuracy: 85%"
    /(\w+):\s*(\d+(?:\.\d+)?)/g // "Rating: 4.5"
  ]

  const scores: Record<string, number> = {}

  for (const pattern of scorePatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const key = match[1].toLowerCase()
      const value = parseFloat(match[2])
      const max = match[3] ? parseFloat(match[3]) : undefined

      // Normalize to 0-1 scale if max is provided
      scores[key] = max ? value / max : value
    }
  }

  return scores
}
