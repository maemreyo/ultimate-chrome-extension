export interface StorageConfig {
  encryption?: {
    enabled: boolean
    key?: string
    algorithm?: 'AES-GCM' | 'AES-CBC'
  }
  compression?: {
    enabled: boolean
    algorithm?: 'gzip' | 'lz4' | 'brotli'
  }
  sync?: {
    enabled: boolean
    interval?: number
    conflictResolution?: 'local' | 'remote' | 'merge'
  }
  quota?: {
    maxSize?: number // in MB
    warnAt?: number // percentage
  }
  versioning?: {
    enabled: boolean
    maxVersions?: number
  }
}

export interface StorageItem<T = any> {
  id: string
  key: string
  value: T
  metadata: {
    created: Date
    updated: Date
    version: number
    size: number
    encrypted: boolean
    compressed: boolean
    tags?: string[]
  }
}

export interface QueryOptions {
  where?: Record<string, any>
  orderBy?: string
  limit?: number
  offset?: number
  select?: string[]
  include?: string[]
}

export interface BulkOperation {
  type: 'set' | 'update' | 'delete'
  key: string
  value?: any
  updateFn?: (current: any) => any
}

export interface ImportExportOptions {
  format: 'json' | 'csv' | 'sqlite'
  include?: string[]
  exclude?: string[]
  encrypted?: boolean
  compressed?: boolean
}

export interface StorageStats {
  totalSize: number
  itemCount: number
  quotaUsed: number
  quotaAvailable: number
  lastSync?: Date
  lastBackup?: Date
}