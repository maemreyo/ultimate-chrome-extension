import React from 'react'
import {
  FormControl,
  FormDescription,
  FormField as BaseFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~components/ui/form'
import { Input } from '~components/ui/input'
import { Textarea } from '~components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~components/ui/select'
import { Checkbox } from '~components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '~components/ui/radio-group'
import { Switch } from '~components/ui/switch'
import { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FieldConfig } from '../types'

interface FormFieldProps<T extends FieldValues> extends FieldConfig {
  control: Control<T>
  name: FieldPath<T>
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = 'text',
  options = [],
  disabled,
  required,
  autoComplete,
  className,
  component: CustomComponent,
  componentProps
}: FormFieldProps<T>) {
  return (
    <BaseFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label} {required && <span className="text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>
            {CustomComponent ? (
              <CustomComponent {...field} {...componentProps} />
            ) : (
              <>
                {/* Text inputs */}
                {['text', 'email', 'password', 'number', 'tel', 'url', 'date', 'time', 'datetime-local'].includes(type) && (
                  <Input
                    {...field}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    value={field.value || ''}
                  />
                )}

                {/* Textarea */}
                {type === 'textarea' && (
                  <Textarea
                    {...field}
                    placeholder={placeholder}
                    disabled={disabled}
                    value={field.value || ''}
                  />
                )}

                {/* Select */}
                {type === 'select' && (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Checkbox */}
                {type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                    {placeholder && <label className="text-sm">{placeholder}</label>}
                  </div>
                )}

                {/* Radio Group */}
                {type === 'radio' && (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={disabled}
                  >
                    {options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={String(option.value)} />
                        <label className="text-sm">{option.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Switch */}
                {type === 'switch' && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                    {placeholder && <label className="text-sm">{placeholder}</label>}
                  </div>
                )}

                {/* File Input */}
                {type === 'file' && (
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        field.onChange(file)
                      }
                    }}
                    disabled={disabled}
                  />
                )}
              </>
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}