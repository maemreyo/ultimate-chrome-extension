import { AnalysisResult, AnalysisSection, Recommendation } from './types'

export class ResultFormatter {
  /**
   * Format analysis result for UI display
   */
  static formatForUI(result: AnalysisResult, options: FormatterOptions = {}): FormattedResult {
    const {
      includeMetadata = true,
      includeRecommendations = true,
      includeSources = true,
      highlightSections = [],
      theme = 'light'
    } = options

    return {
      id: result.id,
      type: result.type,
      status: result.status,
      summary: this.generateSummary(result),
      sections: this.formatSections(result.sections || [], highlightSections),
      metrics: this.formatMetrics(result),
      recommendations: includeRecommendations ? this.formatRecommendations(result.recommendations || []) : undefined,
      sources: includeSources ? result.sources : undefined,
      metadata: includeMetadata ? this.formatMetadata(result.metadata) : undefined,
      theme
    }
  }

  private static generateSummary(result: AnalysisResult): string {
    // Extract key points from sections
    const keyPoints: string[] = []

    result.sections?.forEach(section => {
      if (section.title.toLowerCase().includes('overview') ||
          section.title.toLowerCase().includes('summary')) {
        if (typeof section.content === 'string') {
          keyPoints.push(section.content.substring(0, 200) + '...')
        }
      }
    })

    if (keyPoints.length === 0 && result.sections && result.sections.length > 0) {
      const firstSection = result.sections[0]
      if (typeof firstSection.content === 'string') {
        keyPoints.push(firstSection.content.substring(0, 200) + '...')
      }
    }

    return keyPoints.join(' ')
  }

  private static formatSections(sections: AnalysisSection[], highlightIds: string[]): FormattedSection[] {
    return sections.map(section => ({
      ...section,
      highlight: highlightIds.includes(section.id) || section.highlight,
      formatted: this.formatSectionContent(section)
    }))
  }

  private static formatSectionContent(section: AnalysisSection): string | React.ReactNode {
    switch (section.type) {
      case 'metric':
        return this.formatMetricContent(section.content)
      case 'list':
        return this.formatListContent(section.content)
      case 'table':
        return this.formatTableContent(section.content)
      case 'chart':
        return this.formatChartContent(section.content)
      default:
        return section.content
    }
  }

  private static formatMetricContent(content: any): React.ReactNode {
    if (typeof content !== 'object' || !content.data) return content

    // Return a format that can be rendered as metric cards
    return {
      type: 'metrics',
      metrics: Object.entries(content.data).map(([key, value]: [string, any]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: value.value,
        max: value.max,
        unit: value.unit,
        format: value.value < 1 ? 'percentage' : 'number'
      }))
    }
  }

  private static formatListContent(content: any): React.ReactNode {
    if (typeof content !== 'object' || !content.items) return content

    return {
      type: 'list',
      items: content.items
    }
  }

  private static formatTableContent(content: any): React.ReactNode {
    if (typeof content !== 'object' || !content.headers) return content

    return {
      type: 'table',
      headers: content.headers,
      rows: content.rows
    }
  }

  private static formatChartContent(content: any): React.ReactNode {
    // Format for chart rendering
    return {
      type: 'chart',
      data: content
    }
  }

  private static formatMetrics(result: AnalysisResult): FormattedMetrics {
    const metrics: FormattedMetrics = {
      primary: [],
      secondary: []
    }

    result.sections?.forEach(section => {
      if (section.type === 'metric') {
        const formatted = this.formatMetricContent(section.content)
        if (typeof formatted === 'object' && formatted.type === 'metrics') {
          metrics.primary.push(...formatted.metrics.slice(0, 3))
          metrics.secondary.push(...formatted.metrics.slice(3))
        }
      }
    })

    return metrics
  }

  private static formatRecommendations(recommendations: Recommendation[]): FormattedRecommendation[] {
    // Group by priority
    const grouped = {
      high: recommendations.filter(r => r.priority === 'high'),
      medium: recommendations.filter(r => r.priority === 'medium'),
      low: recommendations.filter(r => r.priority === 'low')
    }

    // Sort and format
    return [
      ...grouped.high,
      ...grouped.medium,
      ...grouped.low
    ].map(rec => ({
      ...rec,
      icon: this.getRecommendationIcon(rec),
      color: this.getRecommendationColor(rec.priority)
    }))
  }

  private static getRecommendationIcon(rec: Recommendation): string {
    if (rec.priority === 'high') return '🔴'
    if (rec.priority === 'medium') return '🟡'
    return '🟢'
  }

  private static getRecommendationColor(priority: string): string {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  private static formatMetadata(metadata: AnalysisResult['metadata']): FormattedMetadata {
    return {
      duration: metadata.duration ? `${(metadata.duration / 1000).toFixed(2)}s` : undefined,
      tokensUsed: metadata.tokensUsed?.toLocaleString(),
      model: metadata.model,
      completedAt: metadata.completedAt ? new Date(metadata.completedAt).toLocaleString() : undefined
    }
  }

  /**
   * Export analysis result in various formats
   */
  static export(result: AnalysisResult, format: 'pdf' | 'html' | 'markdown' | 'json'): string | Blob {
    switch (format) {
      case 'markdown':
        return this.exportAsMarkdown(result)
      case 'html':
        return this.exportAsHtml(result)
      case 'json':
        return JSON.stringify(result, null, 2)
      case 'pdf':
        // Would require additional library like jsPDF
        return new Blob([this.exportAsHtml(result)], { type: 'application/pdf' })
      default:
        return JSON.stringify(result)
    }
  }

  private static exportAsMarkdown(result: AnalysisResult): string {
    let markdown = `# ${result.type} Analysis\n\n`

    markdown += `**Status:** ${result.status}\n`
    markdown += `**Date:** ${new Date(result.metadata.startedAt).toLocaleString()}\n\n`

    result.sections?.forEach(section => {
      markdown += `## ${section.title}\n\n`

      if (typeof section.content === 'string') {
        markdown += `${section.content}\n\n`
      } else if (section.content.type === 'list') {
        section.content.items.forEach((item: string) => {
          markdown += `- ${item}\n`
        })
        markdown += '\n'
      } else if (section.content.type === 'table') {
        // Format as markdown table
        markdown += '| ' + section.content.headers.join(' | ') + ' |\n'
        markdown += '| ' + section.content.headers.map(() => '---').join(' | ') + ' |\n'
        section.content.rows.forEach((row: any) => {
          markdown += '| ' + Object.values(row).join(' | ') + ' |\n'
        })
        markdown += '\n'
      }
    })

    if (result.recommendations && result.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`
      result.recommendations.forEach(rec => {
        markdown += `### ${rec.title} (${rec.priority} priority)\n`
        markdown += `${rec.description}\n\n`
      })
    }

    return markdown
  }

  private static exportAsHtml(result: AnalysisResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${result.type} Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .metadata { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    .recommendation { margin: 10px 0; padding: 10px; border-left: 3px solid #007bff; background: #f0f8ff; }
    .high-priority { border-color: #dc3545; background: #fff5f5; }
    .medium-priority { border-color: #ffc107; background: #fffef5; }
    .low-priority { border-color: #28a745; background: #f5fff5; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>${result.type} Analysis</h1>

  <div class="metadata">
    <p><strong>Status:</strong> ${result.status}</p>
    <p><strong>Date:</strong> ${new Date(result.metadata.startedAt).toLocaleString()}</p>
    ${result.metadata.duration ? `<p><strong>Duration:</strong> ${(result.metadata.duration / 1000).toFixed(2)}s</p>` : ''}
  </div>

  ${result.sections?.map(section => `
    <h2>${section.title}</h2>
    ${this.formatSectionAsHtml(section)}
  `).join('')}

  ${result.recommendations && result.recommendations.length > 0 ? `
    <h2>Recommendations</h2>
    ${result.recommendations.map(rec => `
      <div class="recommendation ${rec.priority}-priority">
        <strong>${rec.title}</strong>
        <p>${rec.description}</p>
      </div>
    `).join('')}
  ` : ''}
</body>
</html>
    `
  }

  private static formatSectionAsHtml(section: AnalysisSection): string {
    if (typeof section.content === 'string') {
      return `<p>${section.content.replace(/\n/g, '<br>')}</p>`
    }

    if (section.content.type === 'list') {
      return `<ul>${section.content.items.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
    }

    if (section.content.type === 'table') {
      return `
        <table>
          <thead>
            <tr>${section.content.headers.map((h: string) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${section.content.rows.map((row: any) => `
              <tr>${Object.values(row).map(cell => `<td>${cell}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      `
    }

    return ''
  }
}

// Types for formatter
export interface FormatterOptions {
  includeMetadata?: boolean
  includeRecommendations?: boolean
  includeSources?: boolean
  highlightSections?: string[]
  theme?: 'light' | 'dark'
}

export interface FormattedResult {
  id: string
  type: string
  status: string
  summary: string
  sections: FormattedSection[]
  metrics: FormattedMetrics
  recommendations?: FormattedRecommendation[]
  sources?: any[]
  metadata?: FormattedMetadata
  theme: string
}

export interface FormattedSection extends AnalysisSection {
  formatted: string | React.ReactNode
}

export interface FormattedMetrics {
  primary: any[]
  secondary: any[]
}

export interface FormattedRecommendation extends Recommendation {
  icon: string
  color: string
}

export interface FormattedMetadata {
  duration?: string
  tokensUsed?: string
  model?: string
  completedAt?: string
}
