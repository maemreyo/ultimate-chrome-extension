// Integrated analysis service using @matthew.ngo/analysis-toolkit

import {
  createAnalysis,
  createBulkAnalysis,
  createSEOAnalyzer,
  createQualityAnalyzer,
  AnalysisPresets,
  type AnalysisEngine,
  type AnalysisResult,
  type AnalysisOptions
} from '@matthew.ngo/analysis-toolkit'
import { getAIEngine } from './ai-service'
import { aiAnalysisCache, savedContent, getHistoryManager } from './storage'
import { contentExtractionService } from './content-extraction-service'

let analysisEngine: AnalysisEngine | null = null
let seoAnalyzer: any = null
let qualityAnalyzer: any = null

// Initialize analysis engine
export const initializeAnalysis = async () => {
  const aiEngine = getAIEngine()
  if (!aiEngine) {
    console.warn('AI engine not initialized, analysis features will be limited')
    return null
  }

  // Create main analysis engine
  analysisEngine = await createAnalysis({
    ai: {
      provider: aiEngine.config.provider,
      apiKey: aiEngine.config.apiKey,
      model: aiEngine.config.model
    },
    nlp: {
      enableSentiment: true,
      enableLanguageDetection: true,
      enableEntityExtraction: true,
      enableKeywordExtraction: true
    },
    cache: {
      strategy: 'semantic',
      ttl: 3600000, // 1 hour
      maxSize: 200,
      similarityThreshold: 0.85
    },
    performance: {
      enableProfiling: false,
      enableMetrics: true,
      maxConcurrency: 5
    },
    output: {
      format: 'json',
      includeRawData: false,
      includeMetrics: true,
      sanitizeHTML: true
    }
  })

  // Create specialized analyzers
  seoAnalyzer = await createSEOAnalyzer({
    ai: aiEngine.config,
    seo: {
      enableKeywordAnalysis: true,
      enableStructureCheck: true,
      enableCompetitorComparison: false // Disabled for privacy
    }
  })

  qualityAnalyzer = await createQualityAnalyzer({
    ai: aiEngine.config,
    quality: {
      checkGrammar: true,
      checkStyle: true,
      checkCoherence: true,
      styleGuide: 'business'
    }
  })

  return analysisEngine
}

// Analysis service API
export const analysisService = {
  // Analyze text with caching
  async analyzeText(text: string, options?: AnalysisOptions): Promise<AnalysisResult> {
    if (!analysisEngine) {
      throw new Error('Analysis engine not initialized')
    }

    // Check cache
    const cacheKey = `analysis:${text.substring(0, 100)}:${JSON.stringify(options)}`
    const cached = await aiAnalysisCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Perform analysis
    const result = await analysisEngine.analyzeText(text, {
      ...options,
      includeNLP: true,
      includeReadability: true,
      includeKeywords: true,
      includeStructure: true
    })

    // Cache result
    await aiAnalysisCache.set(cacheKey, result)

    // Track in history
    await getHistoryManager().addItem({
      type: 'analysis',
      title: 'Text Analysis',
      description: `Analyzed ${result.structure?.wordCount || 0} words`,
      data: {
        sentiment: result.aiAnalysis?.sentiment,
        readability: result.nlpAnalysis?.readability.grade
      }
    })

    return result
  },

  // Analyze current tab content
  async analyzeCurrentTab(options?: AnalysisOptions) {
    // Extract content first
    const extraction = await contentExtractionService.extractFromCurrentTab()
    if (!extraction.success) {
      throw new Error('Failed to extract content from current tab')
    }

    // Analyze the extracted content
    const analysis = await this.analyzeText(extraction.data.cleanText, options)

    // Combine extraction and analysis results
    return {
      ...analysis,
      extraction: extraction.data,
      combined: {
        title: extraction.data.title,
        url: extraction.data.metadata.source,
        wordCount: extraction.data.wordCount,
        readingTime: extraction.data.readingTime,
        quality: extraction.data.quality,
        analysis: analysis.aiAnalysis,
        nlp: analysis.nlpAnalysis,
        structure: analysis.structure
      }
    }
  },

  // SEO analysis for web content
  async analyzeSEO(content: any) {
    if (!seoAnalyzer) {
      throw new Error('SEO analyzer not initialized')
    }

    const result = await seoAnalyzer.analyzeSEOContent(content, {
      targetKeywords: content.keywords || [],
      searchIntent: 'informational'
    })

    return result
  },

  // Writing quality analysis
  async analyzeQuality(text: string) {
    if (!qualityAnalyzer) {
      throw new Error('Quality analyzer not initialized')
    }

    const result = await qualityAnalyzer.analyzeWritingQuality(text, {
      improvementSuggestions: true,
      rewriteSuggestions: true,
      scoreBreakdown: true
    })

    return result
  },

  // Bulk analysis for multiple contents
  async analyzeBulk(contents: Array<{ id: string; text: string; metadata?: any }>) {
    const bulkAnalyzer = await createBulkAnalysis({
      ai: analysisEngine?.config.ai,
      processing: {
        batchSize: 5,
        concurrency: 3,
        retryFailed: true
      }
    })

    const results = await bulkAnalyzer.processContents(contents, {
      analysisType: 'comprehensive',
      includeComparison: true,
      generateReport: true
    })

    return results
  },

  // Custom analysis templates
  async runCustomAnalysis(templateName: string, data: any) {
    if (!analysisEngine) {
      throw new Error('Analysis engine not initialized')
    }

    const templates: Record<string, string> = {
      competitorAnalysis: `
        Compare this content with competitor standards:
        {{content}}

        Analyze:
        1. Unique value propositions
        2. Content gaps
        3. Competitive advantages
        4. Areas for improvement
      `,

      contentAudit: `
        Perform a comprehensive content audit:
        {{content}}

        Evaluate:
        1. Content quality (1-10)
        2. Target audience alignment
        3. SEO optimization
        4. Engagement potential
        5. Improvement recommendations
      `,

      toneAnalysis: `
        Analyze the tone and voice:
        {{content}}

        Identify:
        1. Primary tone (formal/informal/neutral)
        2. Emotional undertones
        3. Brand voice consistency
        4. Audience appropriateness
      `
    }

    if (!templates[templateName]) {
      throw new Error(`Unknown template: ${templateName}`)
    }

    return analysisEngine.runTemplate(templateName, data)
  },

  // Save analysis results
  async saveAnalysis(url: string, title: string, analysis: AnalysisResult) {
    const saved = await savedContent.add({
      url,
      title,
      content: { type: 'analysis', data: analysis },
      analysis,
      tags: ['analysis', analysis.aiAnalysis?.sentiment || 'neutral']
    })

    return saved
  },

  // Get analysis suggestions for current context
  async getSuggestions(context: 'writing' | 'reading' | 'research') {
    const suggestions = {
      writing: [
        { action: 'analyzeQuality', label: 'Check Writing Quality', icon: '✍️' },
        { action: 'analyzeTone', label: 'Analyze Tone', icon: '🎭' },
        { action: 'improveText', label: 'Get Improvements', icon: '📈' }
      ],
      reading: [
        { action: 'summarize', label: 'Summarize Content', icon: '📄' },
        { action: 'extractKeyPoints', label: 'Extract Key Points', icon: '🔑' },
        { action: 'analyzeSentiment', label: 'Analyze Sentiment', icon: '😊' }
      ],
      research: [
        { action: 'deepAnalysis', label: 'Deep Analysis', icon: '🔍' },
        { action: 'compareContent', label: 'Compare Sources', icon: '⚖️' },
        { action: 'factCheck', label: 'Fact Check', icon: '✓' }
      ]
    }

    return suggestions[context] || []
  },

  // Real-time analysis (for typing)
  async analyzeRealtime(text: string, callback: (result: any) => void) {
    // Debounced analysis for real-time feedback
    const quickAnalysis = {
      wordCount: text.split(/\s+/).length,
      charCount: text.length,
      sentenceCount: text.split(/[.!?]+/).filter(s => s.trim()).length,
      // Add more quick metrics
    }

    callback(quickAnalysis)

    // Full analysis after delay
    if (text.length > 100) {
      setTimeout(async () => {
        const fullAnalysis = await this.analyzeText(text, {
          depth: 'quick',
          includeRecommendations: false
        })
        callback(fullAnalysis)
      }, 1000)
    }
  },

  // Get analysis history
  async getHistory(limit = 50) {
    const history = await getHistoryManager().getItems({
      types: ['analysis']
    }, limit)

    return history
  },

  // Export analysis report
  async exportReport(analyses: AnalysisResult[], format: 'pdf' | 'html' | 'markdown') {
    // Generate comprehensive report
    const report = {
      title: 'Content Analysis Report',
      date: new Date(),
      analyses,
      summary: {
        totalAnalyzed: analyses.length,
        averageSentiment: this.calculateAverageSentiment(analyses),
        commonThemes: this.extractCommonThemes(analyses),
        recommendations: this.generateRecommendations(analyses)
      }
    }

    // Format report based on requested format
    switch (format) {
      case 'html':
        return this.formatAsHTML(report)
      case 'markdown':
        return this.formatAsMarkdown(report)
      case 'pdf':
        // Would need a PDF generation library
        throw new Error('PDF export not yet implemented')
      default:
        return JSON.stringify(report, null, 2)
    }
  },

  // Helper methods
  calculateAverageSentiment(analyses: AnalysisResult[]) {
    const sentiments = analyses
      .map(a => a.aiAnalysis?.sentiment)
      .filter(Boolean)

    const counts = sentiments.reduce((acc, sentiment) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return counts
  },

  extractCommonThemes(analyses: AnalysisResult[]) {
    const themes = analyses
      .flatMap(a => a.aiAnalysis?.themes || [])
      .reduce((acc, theme) => {
        acc[theme] = (acc[theme] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return Object.entries(themes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }))
  },

  generateRecommendations(analyses: AnalysisResult[]) {
    const recommendations = []

    // Analyze patterns and generate recommendations
    const avgReadability = analyses
      .map(a => a.nlpAnalysis?.readability.grade)
      .filter(Boolean)
      .reduce((sum, grade, _, arr) => sum + grade / arr.length, 0)

    if (avgReadability > 12) {
      recommendations.push({
        type: 'readability',
        message: 'Content is complex. Consider simplifying for broader audience.',
        priority: 'high'
      })
    }

    return recommendations
  },

  formatAsHTML(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .header { background: #f4f4f4; padding: 20px; }
    .analysis { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
    .summary { background: #e9ecef; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    <p>Generated on ${report.date.toLocaleDateString()}</p>
  </div>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Analyzed: ${report.summary.totalAnalyzed}</p>
    <!-- Add more summary content -->
  </div>
  ${report.analyses.map((a: any) => `
    <div class="analysis">
      <h3>Analysis ${a.id}</h3>
      <p>Sentiment: ${a.aiAnalysis?.sentiment}</p>
      <!-- Add more analysis details -->
    </div>
  `).join('')}
</body>
</html>
    `
  },

  formatAsMarkdown(report: any): string {
    return `# ${report.title}

Generated on ${report.date.toLocaleDateString()}

## Summary

- Total Analyzed: ${report.summary.totalAnalyzed}
- Common Themes: ${report.summary.commonThemes.map((t: any) => t.theme).join(', ')}

## Analyses

${report.analyses.map((a: any, i: number) => `
### Analysis ${i + 1}

- **Sentiment**: ${a.aiAnalysis?.sentiment || 'N/A'}
- **Readability**: ${a.nlpAnalysis?.readability.grade || 'N/A'}
- **Word Count**: ${a.structure?.wordCount || 'N/A'}

${a.aiAnalysis?.summary || 'No summary available'}
`).join('\n')}

## Recommendations

${report.summary.recommendations.map((r: any) => `- ${r.message}`).join('\n')}
`
  }
}

// Export for use in other modules
export const getAnalysisEngine = () => analysisEngine