import { v4 as uuidv4 } from 'uuid'
import { aiService } from '../ai/ai-service'
import {
  AnalysisRequest,
  AnalysisResult,
  AnalysisType,
  PromptTemplate
} from './types'
import { promptTemplates, compileTemplate } from './prompt-templates'
import { analysisTypes } from './analysis-types'
import { ResponseParser } from './response-parser'
import { ResultFormatter } from './result-formatter'

export class AnalysisEngine {
  private activeAnalyses: Map<string, AnalysisResult> = new Map()
  private analysisHistory: AnalysisResult[] = []
  private maxHistorySize: number = 100

  /**
   * Run an analysis based on type and inputs
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const analysisId = uuidv4()
    const analysisType = analysisTypes[request.type]

    if (!analysisType) {
      throw new Error(`Unknown analysis type: ${request.type}`)
    }

    // Validate inputs
    this.validateInputs(request.inputs, analysisType)

    // Create initial result
    const result: AnalysisResult = {
      id: analysisId,
      type: request.type,
      status: 'pending',
      inputs: request.inputs,
      metadata: {
        startedAt: new Date()
      }
    }

    this.activeAnalyses.set(analysisId, result)

    try {
      // Update status
      result.status = 'processing'

      // Get appropriate prompt template
      const template = promptTemplates[request.type] || promptTemplates.customAnalysis

      // Compile prompt with inputs
      const prompt = this.compilePrompt(template, request)

      // Call AI service
      const startTime = Date.now()
      const aiResponse = await aiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: this.getSystemPrompt(analysisType)
      })
      const endTime = Date.now()

      // Parse response
      const parsedResult = ResponseParser.parseAnalysisResponse(
        aiResponse,
        request.type,
        analysisType.outputFormat.type
      )

      // Update result
      Object.assign(result, parsedResult)
      result.status = 'completed'
      result.metadata.completedAt = new Date()
      result.metadata.duration = endTime - startTime

      // Store in history
      this.addToHistory(result)

      return result

    } catch (error) {
      result.status = 'failed'
      result.metadata.error = error.message
      result.metadata.completedAt = new Date()

      this.addToHistory(result)
      throw error

    } finally {
      this.activeAnalyses.delete(analysisId)
    }
  }

  /**
   * Run multiple analyses in parallel
   */
  async analyzeMultiple(requests: AnalysisRequest[]): Promise<AnalysisResult[]> {
    const promises = requests.map(request => this.analyze(request))
    return Promise.all(promises)
  }

  /**
   * Stream analysis results (for long-running analyses)
   */
  async *analyzeStream(request: AnalysisRequest): AsyncGenerator<Partial<AnalysisResult>> {
    const analysisId = uuidv4()
    const analysisType = analysisTypes[request.type]

    if (!analysisType) {
      throw new Error(`Unknown analysis type: ${request.type}`)
    }

    // Initial result
    yield {
      id: analysisId,
      type: request.type,
      status: 'pending',
      inputs: request.inputs,
      metadata: { startedAt: new Date() }
    }

    try {
      // Update status
      yield { status: 'processing' }

      // Get template and compile prompt
      const template = promptTemplates[request.type] || promptTemplates.customAnalysis
      const prompt = this.compilePrompt(template, request)

      // Stream AI response
      const stream = await aiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
        stream: true,
        systemPrompt: this.getSystemPrompt(analysisType)
      })

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk

        // Periodically parse and yield partial results
        if (fullResponse.length % 500 === 0) {
          const partial = ResponseParser.parseAnalysisResponse(
            fullResponse,
            request.type,
            analysisType.outputFormat.type
          )
          yield partial
        }
      }

      // Final parse
      const finalResult = ResponseParser.parseAnalysisResponse(
        fullResponse,
        request.type,
        analysisType.outputFormat.type
      )

      yield {
        ...finalResult,
        status: 'completed',
        metadata: {
          completedAt: new Date()
        }
      }

    } catch (error) {
      yield {
        status: 'failed',
        metadata: {
          error: error.message,
          completedAt: new Date()
        }
      }
    }
  }

  /**
   * Get analysis by ID
   */
  getAnalysis(id: string): AnalysisResult | undefined {
    // Check active analyses
    const active = this.activeAnalyses.get(id)
    if (active) return active

    // Check history
    return this.analysisHistory.find(a => a.id === id)
  }

  /**
   * Get analysis history
   */
  getHistory(options?: {
    type?: string
    status?: string
    limit?: number
    offset?: number
  }): AnalysisResult[] {
    let results = [...this.analysisHistory]

    if (options?.type) {
      results = results.filter(r => r.type === options.type)
    }

    if (options?.status) {
      results = results.filter(r => r.status === options.status)
    }

    if (options?.offset) {
      results = results.slice(options.offset)
    }

    if (options?.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  /**
   * Clear analysis history
   */
  clearHistory() {
    this.analysisHistory = []
  }

  /**
   * Get available analysis types
   */
  getAvailableTypes(): AnalysisType[] {
    return Object.values(analysisTypes)
  }

  /**
   * Get analysis type by ID
   */
  getAnalysisType(id: string): AnalysisType | undefined {
    return analysisTypes[id]
  }

  /**
   * Register custom analysis type
   */
  registerAnalysisType(type: AnalysisType, template?: PromptTemplate) {
    analysisTypes[type.id] = type

    if (template) {
      promptTemplates[type.id] = template
    }
  }

  // Private methods

  private validateInputs(inputs: Record<string, any>, analysisType: AnalysisType) {
    for (const input of analysisType.requiredInputs) {
      if (input.required && !inputs[input.name]) {
        throw new Error(`Missing required input: ${input.name}`)
      }

      if (input.maxLength && inputs[input.name]?.length > input.maxLength) {
        throw new Error(`Input "${input.name}" exceeds maximum length of ${input.maxLength}`)
      }
    }
  }

  private compilePrompt(template: PromptTemplate, request: AnalysisRequest): string {
    const variables: Record<string, any> = {
      ...request.inputs,
      ...request.options
    }

    // Add default values
    template.variables.forEach(variable => {
      if (variable.default !== undefined && variables[variable.name] === undefined) {
        variables[variable.name] = variable.default
      }
    })

    return compileTemplate(template.template, variables)
  }

  private getSystemPrompt(analysisType: AnalysisType): string {
    return `You are an expert analyst specializing in ${analysisType.name}.
Provide detailed, actionable insights based on the input provided.
Structure your response clearly with appropriate sections and formatting.
Be objective, thorough, and highlight both strengths and areas for improvement.`
  }

  private addToHistory(result: AnalysisResult) {
    this.analysisHistory.unshift(result)

    // Trim history if needed
    if (this.analysisHistory.length > this.maxHistorySize) {
      this.analysisHistory = this.analysisHistory.slice(0, this.maxHistorySize)
    }
  }
}

// Singleton instance
export const analysisEngine = new AnalysisEngine()