import {
  createHistoryManager,
  createSessionManager,
  createSettingsStore,
  createStorage,
  type AdvancedStorage,
  type HistoryManager,
  type SessionManager,
  type SettingsStore
} from "@matthew.ngo/chrome-storage"

// Storage instances
let storage: AdvancedStorage
let sessionManager: SessionManager
let historyManager: HistoryManager
let settingsStore: SettingsStore

// Initialize storage with secure configuration
export const initializeStorage = async () => {
  // Create main storage instance with encryption and compression
  storage = createStorage("secure", {
    namespace: "ultimate-ai-extension",

    encryption: {
      enabled: true,
      algorithm: "AES-GCM",
      key: process.env.PLASMO_PUBLIC_ENCRYPTION_KEY
    },

    compression: {
      enabled: true,
      algorithm: "gzip",
      threshold: 1024,
      level: 6
    },

    cache: {
      enabled: true,
      strategy: "lru",
      maxSize: 1000,
      maxMemory: 10 * 1024 * 1024, // 10MB
      ttl: 3600000 // 1 hour
    },

    sync: {
      enabled: true,
      interval: 300000, // 5 minutes
      conflictResolution: "local"
    },

    versioning: {
      enabled: true,
      maxVersions: 10
    },

    quota: {
      maxSize: 100, // 100MB
      warnAt: 80
    }
  })

  // Initialize session manager
  sessionManager = createSessionManager({
    maxDuration: 480, // 8 hours
    idleTimeout: 30, // 30 minutes
    trackActivities: true
  })

  // Initialize history manager
  historyManager = createHistoryManager({
    maxItems: 10000,
    groupByTime: true
  })

  // Initialize settings store
  settingsStore = createSettingsStore()

  // Set up quota warning handler
  storage.on("quota-warning", async (stats) => {
    console.warn(`Storage ${stats.percentage}% full`)

    // Clean up old AI analysis cache
    const oldAnalysis = await storage.query({
      where: {
        type: "ai-analysis",
        "metadata.created": {
          $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
        }
      }
    })

    for (const item of oldAnalysis) {
      await storage.delete(item.key)
    }
  })

  return { storage, sessionManager, historyManager, settingsStore }
}

// Export typed storage interface
export interface ExtensionStorageKeys {
  // User data
  user: { id: string; email: string; name: string; subscription?: any }

  // Settings with proper typing
  settings: {
    theme: "light" | "dark" | "system"
    notifications: boolean
    autoSync: boolean
    ai: {
      provider: "openai" | "anthropic" | "google"
      model: string
      apiKey?: string
    }
    contentExtraction: {
      autoExtract: boolean
      preserveFormatting: boolean
      includeImages: boolean
    }
    analysis: {
      autoAnalyze: boolean
      depth: "quick" | "standard" | "detailed"
      includeRecommendations: boolean
    }
  }

  // AI-related storage
  "ai-analysis-cache": Map<string, any>
  "ai-usage-stats": {
    tokensUsed: number
    requestsCount: number
    costEstimate: number
    lastReset: Date
  }

  // Content extraction cache
  "content-cache": Map<string, any>

  // Quick links for new tab page
  quickLinks: Array<{
    id: string
    title: string
    url: string
    favicon?: string
    category?: string
  }>

  // Saved content
  "saved-content": Array<{
    id: string
    url: string
    title: string
    content: any
    analysis?: any
    tags: string[]
    createdAt: Date
  }>

  // Other keys from original
  cache: Record<string, any>
  "saved-selections": Array<{
    text: string
    url: string
    title: string
    timestamp: number
  }>
  "open-count": number
  checked: boolean
  "serial-number": string
  installed_at: string
  auth_token: string
  lastSync: string
  "extracted-images": any
}

// Helper functions for specific data types
export const userStorage = {
  async get() {
    return storage.get<ExtensionStorageKeys["user"]>("user")
  },

  async set(user: ExtensionStorageKeys["user"]) {
    await storage.set("user", user, {
      encrypt: true,
      tags: ["user-data", "sensitive"]
    })

    // Track in history
    await historyManager.addItem({
      type: "auth",
      title: "User updated",
      data: { userId: user.id }
    })
  },

  async clear() {
    await storage.delete("user")
  }
}

export const aiAnalysisCache = {
  async get(key: string) {
    const cache =
      (await storage.get<ExtensionStorageKeys["ai-analysis-cache"]>(
        "ai-analysis-cache"
      )) || new Map()
    return cache.get(key)
  },

  async set(key: string, value: any, ttl = 3600000) {
    const cache =
      (await storage.get<ExtensionStorageKeys["ai-analysis-cache"]>(
        "ai-analysis-cache"
      )) || new Map()
    cache.set(key, value)
    await storage.set("ai-analysis-cache", cache, {
      ttl,
      compress: true,
      tags: ["ai", "cache"]
    })
  },

  async clear() {
    await storage.delete("ai-analysis-cache")
  }
}

export const contentCache = {
  async get(url: string) {
    const cache =
      (await storage.get<ExtensionStorageKeys["content-cache"]>(
        "content-cache"
      )) || new Map()
    return cache.get(url)
  },

  async set(url: string, content: any, ttl = 7200000) {
    const cache =
      (await storage.get<ExtensionStorageKeys["content-cache"]>(
        "content-cache"
      )) || new Map()
    cache.set(url, content)
    await storage.set("content-cache", cache, {
      ttl,
      compress: true,
      tags: ["content", "cache"]
    })
  },

  async has(url: string) {
    const cache =
      (await storage.get<ExtensionStorageKeys["content-cache"]>(
        "content-cache"
      )) || new Map()
    return cache.has(url)
  }
}

export const savedContent = {
  async getAll() {
    return (
      (await storage.get<ExtensionStorageKeys["saved-content"]>(
        "saved-content"
      )) || []
    )
  },

  async add(
    content: Omit<ExtensionStorageKeys["saved-content"][0], "id" | "createdAt">
  ) {
    const saved = await this.getAll()
    const newItem = {
      ...content,
      id: `content-${Date.now()}`,
      createdAt: new Date()
    }
    saved.push(newItem)
    await storage.set("saved-content", saved, {
      compress: true,
      tags: ["saved", "content"]
    })

    // Track in history
    await historyManager.addItem({
      type: "save",
      title: `Saved: ${content.title}`,
      description: `From ${content.url}`,
      data: { contentId: newItem.id },
      metadata: { tags: content.tags }
    })

    return newItem
  },

  async delete(id: string) {
    const saved = await this.getAll()
    const filtered = saved.filter((item) => item.id !== id)
    await storage.set("saved-content", filtered)
  },

  async search(query: string) {
    return storage.search(query, {
      fields: ["title", "content", "tags"],
      fuzzy: true,
      limit: 20
    })
  },

  async query(filter: any) {
    return storage.query({
      where: {
        ...filter,
        _key: { $startsWith: "saved-content" }
      }
    })
  }
}

// Export initialized instances
export const getStorage = () => storage
export const getSessionManager = () => sessionManager
export const getHistoryManager = () => historyManager
export const getSettingsStore = () => settingsStore

// Export all storage utilities
export * from "@matthew.ngo/chrome-storage"
