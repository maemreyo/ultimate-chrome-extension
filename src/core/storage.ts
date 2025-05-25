import { Storage } from "@plasmohq/storage"
import { SecureStorage } from "@plasmohq/storage/secure"

export const storage = new Storage({
  area: "local"
})

export const syncStorage = new Storage({
  area: "sync"
})

export const secureStorage = new SecureStorage({
  area: "local"
})

export type StorageKeys = {
  user: { id: string; email: string; name: string }
  settings: {
    theme: "light" | "dark" | "system"
    notifications: boolean
    autoSync: boolean
  }
  cache: Record<string, any>
  quickLinks: Array<{
    id: string
    title: string
    url: string
    favicon?: string
  }>
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
}

// Storage helper with types
export class TypedStorage {
  private storage: Storage
  
  constructor(area: "local" | "sync" = "local") {
    this.storage = new Storage({ area })
  }
  
  async get<K extends keyof StorageKeys>(key: K): Promise<StorageKeys[K] | undefined> {
    return this.storage.get(key)
  }
  
  async set<K extends keyof StorageKeys>(key: K, value: StorageKeys[K]): Promise<void> {
    await this.storage.set(key, value)
  }
  
  async remove<K extends keyof StorageKeys>(key: K): Promise<void> {
    await this.storage.remove(key)
  }
}

export const typedStorage = new TypedStorage()