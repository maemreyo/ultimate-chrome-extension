import { useState, useEffect } from 'react'
import { storageManager } from '../storage-manager'
import { StorageStats } from '../types'

export function useStorageStats(refreshInterval?: number) {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)

  const storage = storageManager.get()

  const loadStats = async () => {
    try {
      const currentStats = await storage.getStats()
      setStats(currentStats)
    } catch (error) {
      console.error('Failed to load storage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()

    if (refreshInterval) {
      const interval = setInterval(loadStats, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  return { stats, loading, refresh: loadStats }
}