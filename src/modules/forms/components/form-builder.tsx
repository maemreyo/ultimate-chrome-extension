import React from 'react'
import { Button } from '~components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { UseFormReturn, FieldValues } from 'react-hook-form'
import { FormField } from './form-field'
import { FormLayoutConfig } from '../types'
import { cn } from '~lib/utils'

interface FormBuilderProps<T extends FieldValues> {
  form: UseFormReturn<T>
  layout: FormLayoutConfig
  onCancel?: () => void
  isSubmitting?: boolean
}

export function FormBuilder<T extends FieldValues>({
  form,
  layout,
  onCancel,
  isSubmitting = false
}: FormBuilderProps<T>) {
  const {
    sections,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    showCancel = true,
    showReset = false,
    layout: formLayout = 'vertical',
    size = 'md'
  } = layout

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  }

  return (
    <div className={cn('space-y-6', sizeClasses[size])}>
      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          {(section.title || section.description) && (
            <CardHeader>
              {section.title && <CardTitle>{section.title}</CardTitle>}
              {section.description && <CardDescription>{section.description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>
            <div className={cn(
              'grid gap-4',
              section.columns === 2 && 'md:grid-cols-2',
              section.columns === 3 && 'md:grid-cols-3',
              section.columns === 4 && 'md:grid-cols-4'
            )}>
              {section.fields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name as any}
                  {...field}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : submitLabel}
        </Button>

        {showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}

        {showReset && (
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}