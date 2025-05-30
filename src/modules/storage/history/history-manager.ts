import { z } from 'zod'
import { storageManager } from '../storage-manager'
import { AdvancedStorage } from '../advanced-storage'

export const HistoryItemSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.enum(['analysis', 'fact_check', 'search', 'action', 'view', 'custom']),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  data: z.record(z.any()),
  metadata: z.object({
    duration: z.number().optional(),
    status: z.enum(['success', 'failure', 'pending']).optional(),
    tags: z.array(z.string()).optional(),
    source: z.string().optional()
  }).optional(),
  groupId: z.string().optional()
})

export type HistoryItem = z.infer<typeof HistoryItemSchema>

export interface HistoryGroup {
  id: string
  title: string
  date: Date
  items: HistoryItem[]
  collapsed?: boolean
}

export interface HistoryFilters {
  types?: HistoryItem['type'][]
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
  tags?: string[]
  status?: string[]
}

export interface HistoryStats {
  totalItems: number
  itemsByType: Record<string, number>
  itemsByDay: Array<{ date: string; count: number }>
  recentActivity: HistoryItem[]
  topTags: Array<{ tag: string; count: number }>
}

export class HistoryManager {
  private storage: AdvancedStorage
  private historyKey = 'history_items'
  private maxItems: number
  private groupByTime: boolean

  constructor(options: { maxItems?: number; groupByTime?: boolean } = {}) {
    this.storage = storageManager.get()
    this.maxItems = options.maxItems || 10000
    this.groupByTime = options.groupByTime !== false
  }

  async addItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem> {
    // Validate input
    const validatedItem = HistoryItemSchema.parse({
      ...item,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    })

    // Store item
    await this.storage.set(
      `${this.historyKey}_${validatedItem.id}`,
      validatedItem,
      ['history', validatedItem.type]
    )

    // Cleanup old items
    await this.cleanupOldItems()

    // Dispatch event
    window.dispatchEvent(new CustomEvent('history-item-added', {
      detail: validatedItem
    }))

    return validatedItem
  }

  async getItems(filters?: HistoryFilters, limit: number = 50): Promise<HistoryItem[]> {
    let query: any = {
      where: { 'metadata.tags': 'history' },
      orderBy: 'timestamp:desc',
      limit
    }

    // Apply filters
    if (filters?.types && filters.types.length > 0) {
      query.where.type = { $in: filters.types }
    }

    if (filters?.dateRange) {
      query.where.timestamp = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.where['metadata.tags'] = { $containsAny: filters.tags }
    }

    const items = await this.storage.query<HistoryItem>(query)

    // Apply text search if needed
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      return items.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        JSON.stringify(item.data).toLowerCase().includes(searchLower)
      )
    }

    return items
  }

  async getTimeline(
    days: number = 7,
    filters?: HistoryFilters
  ): Promise<HistoryGroup[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const items = await this.getItems({
      ...filters,
      dateRange: { start: startDate, end: endDate }
    }, 1000)

    // Group by day
    const groups = new Map<string, HistoryItem[]>()

    items.forEach(item => {
      const date = new Date(item.timestamp)
      const dateKey = date.toISOString().split('T')[0]

      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(item)
    })

    // Convert to HistoryGroup array
    return Array.from(groups.entries())
      .map(([dateStr, items]) => ({
        id: `group_${dateStr}`,
        title: this.formatGroupTitle(new Date(dateStr)),
        date: new Date(dateStr),
        items: items.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  async getStats(days: number = 30): Promise<HistoryStats> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const items = await this.getItems({
      dateRange: { start: startDate, end: endDate }
    }, 10000)

    // Calculate stats
    const itemsByType: Record<string, number> = {}
    const itemsByDay: Map<string, number> = new Map()
    const tagCounts: Map<string, number> = new Map()

    items.forEach(item => {
      // By type
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1

      // By day
      const dateKey = new Date(item.timestamp).toISOString().split('T')[0]
      itemsByDay.set(dateKey, (itemsByDay.get(dateKey) || 0) + 1)

      // Tags
      item.metadata?.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    // Fill missing days
    const dayArray: Array<{ date: string; count: number }> = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dayArray.push({
        date: dateKey,
        count: itemsByDay.get(dateKey) || 0
      })
    }

    // Top tags
    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalItems: items.length,
      itemsByType,
      itemsByDay: dayArray.reverse(),
      recentActivity: items.slice(0, 10),
      topTags
    }
  }

  async searchHistory(query: string, limit: number = 50): Promise<HistoryItem[]> {
    return this.getItems({ search: query }, limit)
  }

  async getRelatedItems(itemId: string, limit: number = 10): Promise<HistoryItem[]> {
    const item = await this.storage.get<HistoryItem>(`${this.historyKey}_${itemId}`)
    if (!item) return []

    // Find items with similar tags or from same group
    const relatedItems = await this.storage.query<HistoryItem>({
      where: {
        $or: [
          { groupId: item.groupId },
          { 'metadata.tags': { $containsAny: item.metadata?.tags || [] } }
        ]
      },
      limit: limit + 1
    })

    // Remove the original item and return
    return relatedItems.filter(i => i.id !== itemId).slice(0, limit)
  }

  async updateItem(
    itemId: string,
    updates: Partial<Omit<HistoryItem, 'id' | 'timestamp'>>
  ): Promise<void> {
    const key = `${this.historyKey}_${itemId}`
    await this.storage.update(key, (current: HistoryItem) => ({
      ...current,
      ...updates,
      metadata: {
        ...current.metadata,
        ...updates.metadata
      }
    }))
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.storage.delete(`${this.historyKey}_${itemId}`)
  }

  async clearHistory(filters?: HistoryFilters): Promise<number> {
    const items = await this.getItems(filters, 100000)

    for (const item of items) {
      await this.deleteItem(item.id)
    }

    return items.length
  }

  async exportHistory(filters?: HistoryFilters): Promise<Blob> {
    const items = await this.getItems(filters, 100000)

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      itemCount: items.length,
      items
    }

    return new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' }
    )
  }

  async importHistory(file: Blob): Promise<number> {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid history export file')
    }

    let imported = 0
    for (const item of data.items) {
      try {
        // Validate and import
        const validated = HistoryItemSchema.parse({
          ...item,
          timestamp: new Date(item.timestamp)
        })

        await this.storage.set(
          `${this.historyKey}_${validated.id}`,
          validated,
          ['history', validated.type, 'imported']
        )

        imported++
      } catch (error) {
        console.error('Failed to import history item:', error)
      }
    }

    return imported
  }

  private async cleanupOldItems() {
    const items = await this.storage.query<HistoryItem>({
      where: { 'metadata.tags': 'history' },
      orderBy: 'timestamp:desc'
    })

    if (items.length > this.maxItems) {
      const toDelete = items.slice(this.maxItems)
      for (const item of toDelete) {
        await this.deleteItem(item.id)
      }
    }
  }

  private formatGroupTitle(date: Date): string {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}