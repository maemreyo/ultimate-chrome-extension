import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form'
import { Form } from '~components/ui/form'
import { FormConfig } from '../types'
import { useAdvancedStorage } from '~modules/storage/hooks'

interface FormProviderProps<T extends FieldValues> extends FormConfig<T> {
  children: React.ReactNode | ((form: UseFormReturn<T>) => React.ReactNode)
}

export function FormProvider<T extends FieldValues>({
  schema,
  defaultValues,
  mode = 'onSubmit',
  reValidateMode = 'onChange',
  resetOnSubmit = false,
  persistKey,
  onSubmit,
  onError,
  children
}: FormProviderProps<T>) {
  // Load persisted values if persistKey is provided
  const { value: persistedValues } = useAdvancedStorage<T>(persistKey)

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: persistedValues || defaultValues,
    mode,
    reValidateMode
  })

  // Auto-save to storage
  React.useEffect(() => {
    if (persistKey) {
      const subscription = form.watch(async (values) => {
        const storage = (await import('~modules/storage')).storageManager.get()
        await storage.set(persistKey, values)
      })
      return () => subscription.unsubscribe()
    }
  }, [persistKey, form])

  const handleSubmit: SubmitHandler<T> = async (data) => {
    try {
      await onSubmit(data)
      if (resetOnSubmit) {
        form.reset()
      }
    } catch (error) {
      if (onError) {
        onError(error)
      }
      console.error('Form submission error:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {typeof children === 'function' ? children(form) : children}
      </form>
    </Form>
  )
}