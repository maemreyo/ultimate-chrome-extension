import { useState, useCallback, useEffect } from 'react'
import { storageManager } from '../storage-manager'
import { QueryOptions } from '../types'

export function useAdvancedStorage<T = any>(key?: string, initialValue?: T) {
  const [value, setValue] = useState<T | null>(initialValue || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const storage = storageManager.get()

  useEffect(() => {
    if (key) {
      loadValue()
    }
  }, [key])

  const loadValue = async () => {
    if (!key) return

    setLoading(true)
    try {
      const stored = await storage.get<T>(key)
      setValue(stored || initialValue || null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const set = useCallback(async (newValue: T) => {
    if (!key) throw new Error('Key is required')

    setLoading(true)
    setError(null)

    try {
      await storage.set(key, newValue)
      setValue(newValue)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [key])

  const update = useCallback(async (updateFn: (current: T) => T) => {
    if (!key) throw new Error('Key is required')

    setLoading(true)
    setError(null)

    try {
      await storage.update(key, updateFn)
      await loadValue()
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [key])

  const remove = useCallback(async () => {
    if (!key) throw new Error('Key is required')

    setLoading(true)
    setError(null)

    try {
      await storage.delete(key)
      setValue(null)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [key])

  return {
    value,
    set,
    update,
    remove,
    loading,
    error,
    reload: loadValue
  }
}

export function useStorageQuery<T = any>(options: QueryOptions) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const storage = storageManager.get()

  const query = useCallback(async (queryOptions?: QueryOptions) => {
    setLoading(true)
    setError(null)

    try {
      const results = await storage.query<T>(queryOptions || options)
      setData(results)
      return results
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [options])

  useEffect(() => {
    query()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: query
  }
}