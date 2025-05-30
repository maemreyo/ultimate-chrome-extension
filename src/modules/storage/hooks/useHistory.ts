import { useState, useEffect, useCallback } from 'react'
import { HistoryManager, HistoryItem, HistoryFilters, HistoryGroup } from '../history/history-manager'

let historyManager: HistoryManager | null = null

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!historyManager) {
      historyManager = new HistoryManager()
    }

    // Listen for new items
    const handleNewItem = (event: CustomEvent<HistoryItem>) => {
      setItems(prev => [event.detail, ...prev])
    }

    window.addEventListener('history-item-added', handleNewItem as EventListener)

    return () => {
      window.removeEventListener('history-item-added', handleNewItem as EventListener)
    }
  }, [])

  const loadItems = useCallback(async (filters?: HistoryFilters, limit?: number) => {
    setLoading(true)
    try {
      const loaded = await historyManager!.getItems(filters, limit)
      setItems(loaded)
    } finally {
      setLoading(false)
    }
  }, [])

  const addItem = useCallback(async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    return historyManager!.addItem(item)
  }, [])

  const searchHistory = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const results = await historyManager!.searchHistory(query)
      setItems(results)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    items,
    loading,
    loadItems,
    addItem,
    searchHistory,
    getTimeline: (days?: number) => historyManager!.getTimeline(days),
    getStats: (days?: number) => historyManager!.getStats(days),
    clearHistory: (filters?: HistoryFilters) => historyManager!.clearHistory(filters),
    exportHistory: (filters?: HistoryFilters) => historyManager!.exportHistory(filters)
  }
}