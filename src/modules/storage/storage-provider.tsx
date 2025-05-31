import React, { createContext, useContext, useEffect, useState } from 'react'
import { AdvancedStorage } from './advanced-storage'
import { storageManager } from './storage-manager'
import type { StorageConfig, StorageStats } from './types'

interface StorageContextValue {
  storage: AdvancedStorage
  stats: StorageStats | null
  config: StorageConfig
  updateConfig: (config: Partial<StorageConfig>) => void
}

const StorageContext = createContext<StorageContextValue | null>(null)

export interface StorageProviderProps {
  children: React.ReactNode
  config?: StorageConfig
  name?: string
}

export function StorageProvider({ children, config = {}, name }: StorageProviderProps) {
  const [storage] = useState(() => {
    return name ? storageManager.create(name, config) : storageManager.get()
  })

  const [stats, setStats] = useState<StorageStats | null>(null)
  const [currentConfig, setCurrentConfig] = useState(config)

  useEffect(() => {
    loadStats()

    // Listen for quota warnings
    const handleQuotaWarning = (event: CustomEvent) => {
      console.warn('Storage quota warning:', event.detail)
    }

    window.addEventListener('storage-quota-warning', handleQuotaWarning as EventListener)

    return () => {
      window.removeEventListener('storage-quota-warning', handleQuotaWarning as EventListener)
    }
  }, [])

  const loadStats = async () => {
    try {
      const currentStats = await storage.getStats()
      setStats(currentStats)
    } catch (error) {
      console.error('Failed to load storage stats:', error)
    }
  }

  const updateConfig = (newConfig: Partial<StorageConfig>) => {
    setCurrentConfig({ ...currentConfig, ...newConfig })
    // Note: This would require recreating the storage instance
    // In a real implementation, you might want to handle this differently
  }

  return (
    <StorageContext.Provider value={{ storage, stats, config: currentConfig, updateConfig }}>
      {children}
    </StorageContext.Provider>
  )
}

export function useStorageContext() {
  const context = useContext(StorageContext)
  if (!context) {
    throw new Error('useStorageContext must be used within StorageProvider')
  }
  return context
}
