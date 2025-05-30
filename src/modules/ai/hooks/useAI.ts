import { useState, useCallback } from "react"
import { aiService } from "../ai-service"
import { GenerateOptions, Classification, SummarizeOptions } from "../types"

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generateText = useCallback(async (prompt: string, options?: GenerateOptions) => {
    setLoading(true)
    setError(null)

    try {
      const result = await aiService.generateText(prompt, options)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const summarize = useCallback(async (text: string, options?: SummarizeOptions) => {
    setLoading(true)
    setError(null)

    try {
      const result = await aiService.summarize(text, options)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const classifyText = useCallback(async (text: string, labels: string[]) => {
    setLoading(true)
    setError(null)

    try {
      const result = await aiService.classifyText(text, labels)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateEmbedding = useCallback(async (text: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await aiService.generateEmbedding(text)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    generateText,
    summarize,
    classifyText,
    generateEmbedding,
    loading,
    error
  }
}