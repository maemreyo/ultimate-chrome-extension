import { useState, useCallback, useRef } from 'react'
import { analysisEngine } from '../analysis-engine'
import { AnalysisRequest, AnalysisResult } from '../types'

export function useAnalysisStream() {
  const [result, setResult] = useState<Partial<AnalysisResult> | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (request: AnalysisRequest) => {
    setStreaming(true)
    setError(null)
    setResult(null)

    abortControllerRef.current = new AbortController()

    try {
      const stream = analysisEngine.analyzeStream(request)

      for await (const partial of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break
        }

        setResult(current => ({ ...current, ...partial }))
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setStreaming(false)
    }
  }, [])

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort()
    setStreaming(false)
  }, [])

  return {
    result,
    streaming,
    error,
    startStream,
    stopStream
  }
}