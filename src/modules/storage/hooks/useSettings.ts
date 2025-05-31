import { useCallback, useEffect, useState } from 'react'
import { SettingsStore, type SettingsChangeEvent } from '../settings/settings-store'

let settingsStore: SettingsStore | null = null

export function useSettings<T = any>(key?: string) {
  const [value, setValue] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!settingsStore) {
      settingsStore = new SettingsStore()
    }

    // Load initial value
    const loadSettings = async () => {
      try {
        await settingsStore!.load()
        const val = key ? settingsStore!.get(key) : settingsStore!.get('appearance')
        setValue(val)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()

    // Subscribe to changes
    if (key) {
      const unsubscribe = settingsStore.subscribe(key, (event: SettingsChangeEvent) => {
        setValue(event.newValue)
      })

      return unsubscribe
    }
  }, [key])

  const updateValue = useCallback(async (newValue: T) => {
    if (!key) throw new Error('Key is required for updates')
    await settingsStore!.set(key, newValue)
  }, [key])

  const reset = useCallback(async () => {
    await settingsStore!.reset(key)
  }, [key])

  return {
    value,
    loading,
    update: updateValue,
    reset,
    subscribe: (callback: (event: SettingsChangeEvent) => void) =>
      settingsStore!.subscribe(key || '*', callback)
  }
}
