import { AnalysisResult, AnalysisSection, Recommendation } from './types'

export class ResponseParser {
  /**
   * Parse AI response into structured analysis result
   */
  static parseAnalysisResponse(
    response: string,
    analysisType: string,
    format: 'structured' | 'markdown' | 'html' | 'json'
  ): Partial<AnalysisResult> {
    switch (format) {
      case 'structured':
        return this.parseStructuredResponse(response, analysisType)
      case 'markdown':
        return this.parseMarkdownResponse(response)
      case 'json':
        return this.parseJsonResponse(response)
      case 'html':
        return this.parseHtmlResponse(response)
      default:
        return { output: response }
    }
  }

  private static parseStructuredResponse(response: string, analysisType: string): Partial<AnalysisResult> {
    const sections: AnalysisSection[] = []
    const recommendations: Recommendation[] = []

    // Split response into sections based on headers
    const sectionRegex = /^#+\s+(.+)$/gm
    const parts = response.split(sectionRegex)

    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i].trim()
      const content = parts[i + 1]?.trim() || ''

      // Check if this is a recommendations section
      if (title.toLowerCase().includes('recommendation')) {
        recommendations.push(...this.extractRecommendations(content))
      } else {
        sections.push({
          id: `section-${i}`,
          title,
          content: this.parseContent(content, analysisType),
          type: this.detectSectionType(content),
          order: Math.floor(i / 2)
        })
      }
    }

    return { sections, recommendations }
  }

  private static parseContent(content: string, analysisType: string): any {
    // Check for specific patterns

    // Metrics pattern (e.g., "Score: 8/10")
    const metricsRegex = /^(.+?):\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+))?$/gm
    const metrics: Record<string, any> = {}
    let match

    while ((match = metricsRegex.exec(content)) !== null) {
      const [, label, value, max] = match
      metrics[label.toLowerCase().replace(/\s+/g, '_')] = {
        value: parseFloat(value),
        max: max ? parseFloat(max) : undefined
      }
    }

    if (Object.keys(metrics).length > 0) {
      return { type: 'metrics', data: metrics, text: content }
    }

    // List pattern
    const listRegex = /^[\-\*\d+\.]\s+(.+)$/gm
    const listItems: string[] = []

    while ((match = listRegex.exec(content)) !== null) {
      listItems.push(match[1])
    }

    if (listItems.length > 0) {
      return { type: 'list', items: listItems }
    }

    // Table pattern (simple markdown tables)
    if (content.includes('|') && content.includes('---')) {
      return this.parseTable(content)
    }

    // Default: return as text
    return content
  }

  private static detectSectionType(content: string): 'text' | 'chart' | 'table' | 'list' | 'metric' {
    if (typeof content === 'object') {
      if (content.type === 'metrics') return 'metric'
      if (content.type === 'list') return 'list'
      if (content.type === 'table') return 'table'
    }

    // Check content patterns
    if (content.includes('|') && content.includes('---')) return 'table'
    if (/^[\-\*\d+\.]\s+/m.test(content)) return 'list'
    if (/^\w+:\s*\d+/m.test(content)) return 'metric'

    return 'text'
  }

  private static extractRecommendations(content: string): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Split by line breaks or list items
    const lines = content.split(/\n+/)

    lines.forEach((line, index) => {
      const trimmed = line.replace(/^[\-\*\d+\.]\s+/, '').trim()
      if (!trimmed) return

      // Try to extract priority from the line
      let priority: 'low' | 'medium' | 'high' = 'medium'
      let title = trimmed
      let description = ''

      // Check for priority indicators
      if (/high\s*priority|critical|urgent/i.test(trimmed)) {
        priority = 'high'
      } else if (/low\s*priority|minor|optional/i.test(trimmed)) {
        priority = 'low'
      }

      // Split title and description if there's a colon
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex > 0) {
        title = trimmed.substring(0, colonIndex).trim()
        description = trimmed.substring(colonIndex + 1).trim()
      }

      recommendations.push({
        id: `rec-${index}`,
        title,
        description,
        priority,
        category: 'general',
        actionable: true
      })
    })

    return recommendations
  }

  private static parseTable(content: string): any {
    const lines = content.trim().split('\n')
    const headers: string[] = []
    const rows: any[] = []

    lines.forEach((line, index) => {
      if (line.includes('---')) return // Skip separator

      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)

      if (index === 0) {
        headers.push(...cells)
      } else {
        const row: Record<string, string> = {}
        cells.forEach((cell, i) => {
          row[headers[i] || `col${i}`] = cell
        })
        rows.push(row)
      }
    })

    return { type: 'table', headers, rows }
  }

  private static parseMarkdownResponse(response: string): Partial<AnalysisResult> {
    return {
      output: response,
      sections: [{
        id: 'markdown-content',
        title: 'Analysis',
        content: response,
        type: 'text',
        order: 0
      }]
    }
  }

  private static parseJsonResponse(response: string): Partial<AnalysisResult> {
    try {
      const parsed = JSON.parse(response)
      return { output: parsed }
    } catch (error) {
      console.error('Failed to parse JSON response:', error)
      return { output: response }
    }
  }

  private static parseHtmlResponse(response: string): Partial<AnalysisResult> {
    // Simple HTML parsing - in production, use a proper HTML parser
    const div = document.createElement('div')
    div.innerHTML = response

    const sections: AnalysisSection[] = []

    // Extract sections from headings
    const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6')

    headings.forEach((heading, index) => {
      const title = heading.textContent || ''
      const content = this.getContentUntilNextHeading(heading)

      sections.push({
        id: `section-${index}`,
        title,
        content,
        type: 'text',
        order: index
      })
    })

    return { output: response, sections }
  }

  private static getContentUntilNextHeading(element: Element): string {
    let content = ''
    let sibling = element.nextElementSibling

    while (sibling && !sibling.matches('h1, h2, h3, h4, h5, h6')) {
      content += sibling.textContent + '\n'
      sibling = sibling.nextElementSibling
    }

    return content.trim()
  }

  /**
   * Extract key metrics from analysis
   */
  static extractMetrics(result: AnalysisResult): Record<string, any> {
    const metrics: Record<string, any> = {}

    result.sections?.forEach(section => {
      if (section.type === 'metric' && typeof section.content === 'object') {
        Object.assign(metrics, section.content.data)
      }
    })

    return metrics
  }

  /**
   * Extract all recommendations
   */
  static extractRecommendations(result: AnalysisResult): Recommendation[] {
    return result.recommendations || []
  }
}