import { useState, useCallback } from 'react'
import { messageBus } from '../message-bus'

export function useRequest<T = any, R = any>(channel: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<R | null>(null)

  const request = useCallback(async (
    type: string,
    payload: T,
    timeout?: number
  ): Promise<R> => {
    setLoading(true)
    setError(null)

    try {
      const result = await messageBus.request<T, R>(channel, type, payload, timeout)
      setResponse(result)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [channel])

  return {
    request,
    loading,
    error,
    response
  }
}