import Dexie, { Table } from 'dexie'
import CryptoJS from 'crypto-js'
import pako from 'pako'
import { Storage } from '@plasmohq/storage'
import {
  StorageConfig,
  StorageItem,
  QueryOptions,
  BulkOperation,
  ImportExportOptions,
  StorageStats
} from './types'

export class AdvancedStorage {
  private db: Dexie
  private config: StorageConfig
  private chromeStorage: Storage
  private encryptionKey: string
  private syncInterval: NodeJS.Timer | null = null

  constructor(config: StorageConfig = {}) {
    this.config = {
      encryption: { enabled: false, algorithm: 'AES-GCM' },
      compression: { enabled: false, algorithm: 'gzip' },
      sync: { enabled: true, interval: 300000, conflictResolution: 'merge' },
      quota: { maxSize: 100, warnAt: 80 },
      versioning: { enabled: true, maxVersions: 10 },
      ...config
    }

    // Initialize Dexie database
    this.db = new Dexie('AdvancedStorage')
    this.db.version(1).stores({
      items: '++id, key, value, metadata.created, metadata.updated, metadata.tags',
      versions: '++id, itemId, version, timestamp',
      sync: '++id, operation, timestamp, synced'
    })

    // Initialize Chrome storage
    this.chromeStorage = new Storage({ area: 'local' })

    // Generate or load encryption key
    this.initializeEncryption()

    // Start sync if enabled
    if (this.config.sync?.enabled) {
      this.startSync()
    }
  }

  private async initializeEncryption() {
    if (!this.config.encryption?.enabled) return

    if (this.config.encryption.key) {
      this.encryptionKey = this.config.encryption.key
    } else {
      // Generate and store encryption key
      const storedKey = await this.chromeStorage.get('__encryption_key__')
      if (storedKey) {
        this.encryptionKey = storedKey
      } else {
        this.encryptionKey = CryptoJS.lib.WordArray.random(256/8).toString()
        await this.chromeStorage.set('__encryption_key__', this.encryptionKey)
      }
    }
  }

  // Encryption methods
  private encrypt(data: any): string {
    if (!this.config.encryption?.enabled) {
      return JSON.stringify(data)
    }

    const jsonStr = JSON.stringify(data)
    const encrypted = CryptoJS.AES.encrypt(jsonStr, this.encryptionKey, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    })

    return encrypted.toString()
  }

  private decrypt(encryptedData: string): any {
    if (!this.config.encryption?.enabled) {
      return JSON.parse(encryptedData)
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    })

    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
  }

  // Compression methods
  private compress(data: string): Uint8Array {
    if (!this.config.compression?.enabled) {
      return new TextEncoder().encode(data)
    }

    const encoded = new TextEncoder().encode(data)
    return pako.gzip(encoded)
  }

  private decompress(compressed: Uint8Array): string {
    if (!this.config.compression?.enabled) {
      return new TextDecoder().decode(compressed)
    }

    const decompressed = pako.ungzip(compressed)
    return new TextDecoder().decode(decompressed)
  }

  // Core CRUD operations
  async set<T>(key: string, value: T, tags?: string[]): Promise<void> {
    await this.checkQuota()

    const now = new Date()
    let processedValue = value
    let size = JSON.stringify(value).length

    // Compression
    if (this.config.compression?.enabled) {
      const compressed = this.compress(JSON.stringify(value))
      processedValue = Array.from(compressed) as any
      size = compressed.length
    }

    // Encryption
    if (this.config.encryption?.enabled) {
      processedValue = this.encrypt(processedValue)
    }

    const item: StorageItem<T> = {
      id: `${key}_${Date.now()}`,
      key,
      value: processedValue as T,
      metadata: {
        created: now,
        updated: now,
        version: 1,
        size,
        encrypted: this.config.encryption?.enabled || false,
        compressed: this.config.compression?.enabled || false,
        tags
      }
    }

    // Check if item exists for versioning
    const existing = await this.db.table('items').where('key').equals(key).first()

    if (existing && this.config.versioning?.enabled) {
      // Save version history
      await this.saveVersion(existing)
      item.metadata.version = existing.metadata.version + 1
    }

    // Save to IndexedDB
    await this.db.table('items').put(item)

    // Sync to Chrome storage if needed
    if (this.config.sync?.enabled) {
      await this.syncItem(key, value)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const item = await this.db.table('items').where('key').equals(key).first()

    if (!item) return null

    let value = item.value

    // Decryption
    if (item.metadata.encrypted) {
      value = this.decrypt(value)
    }

    // Decompression
    if (item.metadata.compressed) {
      const uint8Array = new Uint8Array(value)
      value = JSON.parse(this.decompress(uint8Array))
    }

    return value as T
  }

  async update<T>(key: string, updateFn: (current: T) => T): Promise<void> {
    const current = await this.get<T>(key)
    if (current === null) {
      throw new Error(`Key "${key}" not found`)
    }

    const updated = updateFn(current)
    await this.set(key, updated)
  }

  async delete(key: string): Promise<void> {
    const item = await this.db.table('items').where('key').equals(key).first()

    if (item && this.config.versioning?.enabled) {
      // Save final version before deletion
      await this.saveVersion(item)
    }

    await this.db.table('items').where('key').equals(key).delete()

    if (this.config.sync?.enabled) {
      await this.chromeStorage.remove(key)
    }
  }

  async has(key: string): Promise<boolean> {
    const count = await this.db.table('items').where('key').equals(key).count()
    return count > 0
  }

  // Bulk operations
  async bulk(operations: BulkOperation[]): Promise<void> {
    const tx = this.db.transaction('rw', this.db.table('items'), async () => {
      for (const op of operations) {
        switch (op.type) {
          case 'set':
            await this.set(op.key, op.value)
            break
          case 'update':
            if (op.updateFn) {
              await this.update(op.key, op.updateFn)
            }
            break
          case 'delete':
            await this.delete(op.key)
            break
        }
      }
    })

    await tx
  }

  // Query operations
  async query<T>(options: QueryOptions = {}): Promise<T[]> {
    let collection = this.db.table('items').toCollection()

    // Apply where clause
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        collection = collection.and(item => {
          const itemValue = key.includes('.')
            ? this.getNestedValue(item, key)
            : item[key]
          return itemValue === value
        })
      })
    }

    // Apply ordering
    if (options.orderBy) {
      const [field, direction = 'asc'] = options.orderBy.split(':')
      collection = collection.sortBy(field)
      if (direction === 'desc') {
        collection = collection.reverse()
      }
    }

    // Apply limit and offset
    if (options.offset) {
      collection = collection.offset(options.offset)
    }
    if (options.limit) {
      collection = collection.limit(options.limit)
    }

    const items = await collection.toArray()

    // Process and return values
    return Promise.all(items.map(async item => {
      let value = item.value

      if (item.metadata.encrypted) {
        value = this.decrypt(value)
      }

      if (item.metadata.compressed) {
        const uint8Array = new Uint8Array(value)
        value = JSON.parse(this.decompress(uint8Array))
      }

      // Apply field selection
      if (options.select && options.select.length > 0) {
        value = this.selectFields(value, options.select)
      }

      return value
    }))
  }

  // Versioning
  private async saveVersion(item: StorageItem): Promise<void> {
    const versions = this.db.table('versions')

    await versions.add({
      itemId: item.id,
      version: item.metadata.version,
      timestamp: new Date(),
      data: item
    })

    // Clean old versions
    if (this.config.versioning?.maxVersions) {
      const oldVersions = await versions
        .where('itemId')
        .equals(item.id)
        .reverse()
        .sortBy('version')

      if (oldVersions.length > this.config.versioning.maxVersions) {
        const toDelete = oldVersions.slice(this.config.versioning.maxVersions)
        await versions.bulkDelete(toDelete.map(v => v.id))
      }
    }
  }

  async getVersions(key: string): Promise<StorageItem[]> {
    const item = await this.db.table('items').where('key').equals(key).first()
    if (!item) return []

    const versions = await this.db.table('versions')
      .where('itemId')
      .equals(item.id)
      .sortBy('version')

    return versions.map(v => v.data)
  }

  async restoreVersion(key: string, version: number): Promise<void> {
    const versions = await this.getVersions(key)
    const targetVersion = versions.find(v => v.metadata.version === version)

    if (!targetVersion) {
      throw new Error(`Version ${version} not found for key "${key}"`)
    }

    await this.set(key, targetVersion.value)
  }

  // Import/Export
  async export(options: ImportExportOptions = { format: 'json' }): Promise<Blob> {
    const items = await this.db.table('items').toArray()

    let data = items

    // Filter items
    if (options.include) {
      data = data.filter(item => options.include!.includes(item.key))
    }
    if (options.exclude) {
      data = data.filter(item => !options.exclude!.includes(item.key))
    }

    // Process items for export
    const exportData = await Promise.all(data.map(async item => {
      let value = item.value

      if (item.metadata.encrypted && !options.encrypted) {
        value = this.decrypt(value)
      }

      if (item.metadata.compressed && !options.compressed) {
        const uint8Array = new Uint8Array(value)
        value = JSON.parse(this.decompress(uint8Array))
      }

      return {
        key: item.key,
        value,
        metadata: item.metadata,
        tags: item.metadata.tags
      }
    }))

    // Format data
    let output: string
    let mimeType: string

    switch (options.format) {
      case 'csv':
        output = this.toCSV(exportData)
        mimeType = 'text/csv'
        break
      case 'json':
      default:
        output = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        break
    }

    // Apply compression if requested
    if (options.compressed) {
      const compressed = this.compress(output)
      return new Blob([compressed], { type: 'application/gzip' })
    }

    return new Blob([output], { type: mimeType })
  }

  async import(file: Blob, options: ImportExportOptions = { format: 'json' }): Promise<void> {
    let content = await file.text()

    // Decompress if needed
    if (file.type === 'application/gzip' || options.compressed) {
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)
      content = this.decompress(uint8Array)
    }

    let data: any[]

    switch (options.format) {
      case 'csv':
        data = this.fromCSV(content)
        break
      case 'json':
      default:
        data = JSON.parse(content)
        break
    }

    // Import items
    const operations: BulkOperation[] = data.map(item => ({
      type: 'set',
      key: item.key,
      value: item.value
    }))

    await this.bulk(operations)
  }

  // Sync operations
  private startSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      await this.performSync()
    }, this.config.sync?.interval || 300000) // 5 minutes default

    // Initial sync
    this.performSync()
  }

  private async performSync() {
    try {
      // Get all items that need syncing
      const localItems = await this.db.table('items').toArray()
      const remoteKeys = await this.chromeStorage.get('__sync_keys__') || []

      // Sync local to remote
      for (const item of localItems) {
        await this.chromeStorage.set(item.key, {
          value: item.value,
          metadata: item.metadata
        })
      }

      // Update sync keys
      const localKeys = localItems.map(item => item.key)
      await this.chromeStorage.set('__sync_keys__', localKeys)

      // Handle deleted items
      const deletedKeys = remoteKeys.filter((key: string) => !localKeys.includes(key))
      for (const key of deletedKeys) {
        await this.chromeStorage.remove(key)
      }

      // Record sync time
      await this.chromeStorage.set('__last_sync__', new Date().toISOString())
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  private async syncItem(key: string, value: any) {
    try {
      await this.chromeStorage.set(key, {
        value,
        syncedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to sync item:', key, error)
    }
  }

  // Storage management
  async getStats(): Promise<StorageStats> {
    const estimate = await navigator.storage.estimate()
    const items = await this.db.table('items').toArray()

    const totalSize = items.reduce((sum, item) => sum + item.metadata.size, 0)
    const lastSync = await this.chromeStorage.get('__last_sync__')

    return {
      totalSize,
      itemCount: items.length,
      quotaUsed: estimate.usage || 0,
      quotaAvailable: estimate.quota || 0,
      lastSync: lastSync ? new Date(lastSync) : undefined
    }
  }

  async clear(): Promise<void> {
    await this.db.table('items').clear()
    await this.db.table('versions').clear()
    await this.chromeStorage.clear()
  }

  async vacuum(): Promise<void> {
    // Clean up old versions
    const items = await this.db.table('items').toArray()

    for (const item of items) {
      const versions = await this.db.table('versions')
        .where('itemId')
        .equals(item.id)
        .sortBy('version')

      if (versions.length > (this.config.versioning?.maxVersions || 10)) {
        const toDelete = versions.slice(0, versions.length - (this.config.versioning?.maxVersions || 10))
        await this.db.table('versions').bulkDelete(toDelete.map(v => v.id))
      }
    }

    // Compact database
    await this.db.table('items').toCollection().modify(() => {})
  }

  // Utility methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj)
  }

  private selectFields(obj: any, fields: string[]): any {
    const result: any = {}

    fields.forEach(field => {
      if (field.includes('.')) {
        const parts = field.split('.')
        const value = this.getNestedValue(obj, field)
        this.setNestedValue(result, parts, value)
      } else {
        result[field] = obj[field]
      }
    })

    return result
  }

  private setNestedValue(obj: any, path: string[], value: any): void {
    path.reduce((curr, prop, index) => {
      if (index === path.length - 1) {
        curr[prop] = value
      } else {
        curr[prop] = curr[prop] || {}
      }
      return curr[prop]
    }, obj)
  }

  private toCSV(data: any[]): string {
    if (data.length === 0) return ''

    const headers = ['key', 'value', 'created', 'updated', 'tags']
    const rows = data.map(item => [
      item.key,
      JSON.stringify(item.value),
      item.metadata.created,
      item.metadata.updated,
      (item.metadata.tags || []).join(';')
    ])

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
  }

  private fromCSV(csv: string): any[] {
    const lines = csv.split('\n')
    const headers = lines[0].split(',')

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/^"|"$/g, ''))
      const obj: any = { metadata: {} }

      headers.forEach((header, index) => {
        const value = values[index]

        switch (header) {
          case 'key':
            obj.key = value
            break
          case 'value':
            obj.value = JSON.parse(value)
            break
          case 'tags':
            obj.metadata.tags = value ? value.split(';') : []
            break
          default:
            obj.metadata[header] = value
        }
      })

      return obj
    })
  }

  private async checkQuota() {
    if (!this.config.quota?.maxSize) return

    const stats = await this.getStats()
    const usedMB = stats.totalSize / (1024 * 1024)
    const quotaPercentage = (usedMB / this.config.quota.maxSize) * 100

    if (quotaPercentage >= (this.config.quota.warnAt || 80)) {
      console.warn(`Storage quota warning: ${quotaPercentage.toFixed(2)}% used`)

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('storage-quota-warning', {
        detail: { used: usedMB, total: this.config.quota.maxSize, percentage: quotaPercentage }
      }))
    }

    if (usedMB >= this.config.quota.maxSize) {
      throw new Error(`Storage quota exceeded: ${usedMB.toFixed(2)}MB / ${this.config.quota.maxSize}MB`)
    }
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    this.db.close()
  }
}