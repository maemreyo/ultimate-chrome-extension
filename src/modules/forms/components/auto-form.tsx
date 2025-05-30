import React from 'react'
import { z } from 'zod'
import { FormProvider } from './form-provider'
import { FormBuilder } from './form-builder'
import { FieldConfig, FormLayoutConfig, FormSection } from '../types'

interface AutoFormProps<T extends z.ZodType> {
  schema: T
  onSubmit: (data: z.infer<T>) => void | Promise<void>
  defaultValues?: Partial<z.infer<T>>
  persistKey?: string
  title?: string
  description?: string
  submitLabel?: string
  layout?: 'vertical' | 'horizontal'
  columns?: 1 | 2 | 3 | 4
}

export function AutoForm<T extends z.ZodType>({
  schema,
  onSubmit,
  defaultValues,
  persistKey,
  title,
  description,
  submitLabel = 'Submit',
  layout = 'vertical',
  columns = 1
}: AutoFormProps<T>) {
  // Generate form fields from Zod schema
  const fields = generateFieldsFromSchema(schema)

  const formLayout: FormLayoutConfig = {
    sections: [{
      title,
      description,
      fields,
      columns
    }],
    submitLabel,
    layout
  }

  return (
    <FormProvider
      schema={schema}
      defaultValues={defaultValues}
      persistKey={persistKey}
      onSubmit={onSubmit}
    >
      {(form) => <FormBuilder form={form} layout={formLayout} />}
    </FormProvider>
  )
}

// Helper function to generate fields from Zod schema
function generateFieldsFromSchema(schema: z.ZodType): FieldConfig[] {
  const fields: FieldConfig[] = []

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape

    Object.entries(shape).forEach(([key, value]) => {
      const field: FieldConfig = {
        name: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        required: !value.isOptional()
      }

      // Infer field type from Zod schema
      if (value instanceof z.ZodString) {
        const checks = (value as any)._def.checks || []

        if (checks.some((c: any) => c.kind === 'email')) {
          field.type = 'email'
        } else if (checks.some((c: any) => c.kind === 'url')) {
          field.type = 'url'
        } else if (key.toLowerCase().includes('password')) {
          field.type = 'password'
        } else if (key.toLowerCase().includes('phone')) {
          field.type = 'tel'
        } else if (checks.some((c: any) => c.kind === 'max' && c.value > 100)) {
          field.type = 'textarea'
        } else {
          field.type = 'text'
        }
      } else if (value instanceof z.ZodNumber) {
        field.type = 'number'
      } else if (value instanceof z.ZodBoolean) {
        field.type = 'checkbox'
      } else if (value instanceof z.ZodEnum) {
        field.type = 'select'
        field.options = value.options.map((opt: string) => ({
          label: opt.charAt(0).toUpperCase() + opt.slice(1),
          value: opt
        }))
      } else if (value instanceof z.ZodDate) {
        field.type = 'date'
      }

      fields.push(field)
    })
  }

  return fields
}