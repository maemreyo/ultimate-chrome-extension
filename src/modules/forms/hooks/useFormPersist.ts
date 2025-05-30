import { useEffect } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'
import { useAdvancedStorage } from '~modules/storage/hooks'

export function useFormPersist<T extends FieldValues>(
  form: UseFormReturn<T>,
  key: string,
  options?: {
    debounce?: number
    exclude?: string[]
  }
) {
  const { set, value } = useAdvancedStorage<T>(key)

  // Load persisted values
  useEffect(() => {
    if (value) {
      form.reset(value)
    }
  }, [])

  // Save on change
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const subscription = form.watch((values) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (options?.exclude) {
          const filtered = { ...values }
          options.exclude.forEach(field => delete filtered[field])
          set(filtered as T)
        } else {
          set(values as T)
        }
      }, options?.debounce || 1000)
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [form, key, options])
}