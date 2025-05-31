import { useState, useCallback } from 'react'
import { analysisEngine } from '../analysis-engine'
import { AnalysisRequest, AnalysisResult, AnalysisOptions } from '../types'

export function useAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const analyze = useCallback(async (
    type: string,
    inputs: Record<string, any>,
    options?: AnalysisOptions
  ) => {
    setLoading(true)
    setError(null)

    try {
      const request: AnalysisRequest = { type, inputs, options }
      const analysisResult = await analysisEngine.analyze(request)
      setResult(analysisResult)
      return analysisResult
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeMultiple = useCallback(async (requests: AnalysisRequest[]) => {
    setLoading(true)
    setError(null)

    try {
      const results = await analysisEngine.analyzeMultiple(requests)
      return results
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    analyze,
    analyzeMultiple,
    result,
    loading,
    error,
    clear
  }
}