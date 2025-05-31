import { AdvancedStorage } from './advanced-storage'
import type { StorageConfig } from './types'

class StorageManager {
  private instances: Map<string, AdvancedStorage> = new Map()
  private defaultInstance: AdvancedStorage | null = null

  create(name: string, config?: StorageConfig): AdvancedStorage {
    if (this.instances.has(name)) {
      throw new Error(`Storage instance "${name}" already exists`)
    }

    const instance = new AdvancedStorage(config)
    this.instances.set(name, instance)

    if (!this.defaultInstance) {
      this.defaultInstance = instance
    }

    return instance
  }

  get(name?: string): AdvancedStorage {
    if (!name) {
      if (!this.defaultInstance) {
        this.defaultInstance = new AdvancedStorage()
      }
      return this.defaultInstance
    }

    const instance = this.instances.get(name)
    if (!instance) {
      throw new Error(`Storage instance "${name}" not found`)
    }

    return instance
  }

  destroy(name?: string) {
    if (!name) {
      // Destroy all instances
      this.instances.forEach(instance => instance.destroy())
      this.instances.clear()

      if (this.defaultInstance) {
        this.defaultInstance.destroy()
        this.defaultInstance = null
      }
    } else {
      const instance = this.instances.get(name)
      if (instance) {
        instance.destroy()
        this.instances.delete(name)

        if (this.defaultInstance === instance) {
          this.defaultInstance = null
        }
      }
    }
  }
}

export const storageManager = new StorageManager()
