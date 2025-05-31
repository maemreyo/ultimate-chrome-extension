// Updated: Enhanced hook with multi-provider support and new capabilities

import { useCallback, useState, useRef } from "react"
import { aiService } from "../ai-service"
import type {
  GenerateOptions,
  SummarizeOptions,
  ImageGenerationOptions,
  TranscriptionOptions,
  SpeechOptions,
  CodeGenerationOptions,
  UseAIOptions
} from "../types"

export function useAI(options?: UseAIOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [usage, setUsage] = useState({ tokens: 0, cost: 0 })
  const abortController = useRef<AbortController | null>(null)

  // Configure AI service with options if provided
  const configureIfNeeded = useCallback(async () => {
    if (options?.providers && options.providers.length > 0) {
      const config = await aiService.getConfig()
      if (config && options.providers[0] !== config.provider) {
        await aiService.configure({
          ...config,
          provider: options.providers[0],
          fallbackProviders: options.providers.slice(1)
        })
      }
    }
  }, [options])

  // Text generation
  const generateText = useCallback(async (prompt: string, genOptions?: GenerateOptions) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.generateText(prompt, genOptions)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Streaming text generation
  const generateStream = useCallback(async function* (prompt: string, genOptions?: GenerateOptions) {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const stream = aiService.generateStream(prompt, genOptions)

      for await (const chunk of stream) {
        yield chunk
      }

      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Text summarization
  const summarize = useCallback(async (text: string, sumOptions?: SummarizeOptions) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.summarize(text, sumOptions)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Text classification
  const classifyText = useCallback(async (text: string, labels: string[]) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.classifyText(text, labels)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Sentiment analysis
  const analyzeSentiment = useCallback(async (text: string) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.analyzeSentiment(text)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Embeddings
  const generateEmbedding = useCallback(async (text: string) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.generateEmbedding(text)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Find similar items using embeddings
  const findSimilar = useCallback(async (
    query: string,
    items: { id: string; text: string }[],
    topK: number = 5
  ) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()

      // Generate embeddings for query and items
      const queryEmbedding = await aiService.generateEmbedding(query)
      const itemEmbeddings = await Promise.all(
        items.map(item => aiService.generateEmbedding(item.text))
      )

      // Calculate cosine similarity
      const similarities = itemEmbeddings.map((embedding, i) => ({
        ...items[i],
        similarity: cosineSimilarity(queryEmbedding, embedding)
      }))

      // Sort by similarity and return top K
      similarities.sort((a, b) => b.similarity - a.similarity)

      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })

      return similarities.slice(0, topK)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Image generation
  const generateImage = useCallback(async (prompt: string, imgOptions?: ImageGenerationOptions) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.generateImage(prompt, imgOptions)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Image analysis
  const analyzeImage = useCallback(async (image: string | Blob, analysisOptions?: any) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.analyzeImage(image, analysisOptions)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Audio transcription
  const transcribeAudio = useCallback(async (audio: Blob, transcriptionOptions?: TranscriptionOptions) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.transcribeAudio(audio, transcriptionOptions)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Text-to-speech
  const generateSpeech = useCallback(async (text: string, speechOptions?: SpeechOptions) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.generateSpeech(text, speechOptions)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Code generation
  const generateCode = useCallback(async (prompt: string, codeOptions?: CodeGenerationOptions) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.generateCode(prompt, codeOptions)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Code explanation
  const explainCode = useCallback(async (code: string, language?: string) => {
    setLoading(true)
    setError(null)

    try {
      await configureIfNeeded()
      const result = await aiService.explainCode(code, language)
      const stats = await aiService.getUsageStats()
      setUsage({ tokens: stats.tokensUsed, cost: stats.costEstimate })
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [configureIfNeeded])

  // Cancel ongoing operation
  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
      setLoading(false)
    }
  }, [])

  return {
    // Text operations
    generateText,
    generateStream,
    summarize,
    classifyText,
    analyzeSentiment,

    // Embeddings
    generateEmbedding,
    findSimilar,

    // Images
    generateImage,
    analyzeImage,

    // Audio
    transcribeAudio,
    generateSpeech,

    // Code
    generateCode,
    explainCode,

    // State
    loading,
    error,
    usage,

    // Control
    cancel
  }
}

// Utility function for cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}