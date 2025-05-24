import { useStorage as usePlasmoStorage } from "@plasmohq/storage/hook"
import type { StorageKeys } from "~core/storage"

export function useStorage<K extends keyof StorageKeys>(
  key: K,
  initialValue?: StorageKeys[K]
) {
  return usePlasmoStorage<StorageKeys[K]>(key, initialValue)
}