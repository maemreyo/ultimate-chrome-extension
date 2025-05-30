import { z } from 'zod'
import { UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form'

export interface FormConfig<T extends FieldValues = FieldValues> {
  schema: z.ZodType<T>
  defaultValues?: Partial<T>
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all'
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit'
  resetOnSubmit?: boolean
  persistKey?: string // Save to storage
  onSubmit: SubmitHandler<T>
  onError?: (errors: any) => void
}

export interface FieldConfig {
  name: string
  label?: string
  placeholder?: string
  description?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch' | 'file'
  options?: Array<{ label: string; value: string | number }>
  disabled?: boolean
  required?: boolean
  autoComplete?: string
  className?: string
  // Custom components
  component?: React.ComponentType<any>
  componentProps?: Record<string, any>
}

export interface FormSection {
  title?: string
  description?: string
  fields: FieldConfig[]
  columns?: 1 | 2 | 3 | 4
}

export interface FormLayoutConfig {
  sections: FormSection[]
  submitLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  showReset?: boolean
  layout?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md' | 'lg'
}