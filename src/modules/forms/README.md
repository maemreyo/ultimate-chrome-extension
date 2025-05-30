# Form & Validation System Module

A comprehensive form system built on top of react-hook-form, Zod, and Radix UI components.

## Features

- 🎯 **Type-safe forms** with react-hook-form and Zod
- 🎨 **Pre-built form components** using Radix UI
- 📝 **Auto-form generation** from Zod schemas
- 💾 **Form persistence** to storage
- 🧙 **Form wizard** support
- ✅ **Built-in validators** for common use cases
- 🔄 **Auto-save** functionality
- 📱 **Responsive layouts**

## Quick Start

### Basic Form

```typescript
import { FormProvider, FormBuilder } from '~modules/forms'
import { schemas } from '~modules/forms/schemas'

function ContactForm() {
  return (
    <FormProvider
      schema={schemas.contact}
      onSubmit={async (data) => {
        console.log(data)
      }}
    >
      {(form) => (
        <FormBuilder
          form={form}
          layout={{
            sections: [{
              title: 'Contact Us',
              fields: [
                { name: 'name', label: 'Name', required: true },
                { name: 'email', label: 'Email', type: 'email', required: true },
                { name: 'message', label: 'Message', type: 'textarea', required: true }
              ]
            }]
          }}
        />
      )}
    </FormProvider>
  )
}
```

### Auto Form

```typescript
import { AutoForm } from '~modules/forms'
import { z } from 'zod'

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18)
})

function SimpleForm() {
  return (
    <AutoForm
      schema={schema}
      onSubmit={(data) => console.log(data)}
      title="User Registration"
    />
  )
}
```

### Form with Persistence

```typescript
<FormProvider
  schema={schema}
  onSubmit={handleSubmit}
  persistKey="my-form-data" // Auto-saves to storage
>
  {/* form content */}
</FormProvider>
```

### Form Wizard

```typescript
import { useFormWizard } from '~modules/forms/hooks'

function WizardForm() {
  const steps = [
    { id: 'step1', title: 'Basic Info', fields: ['name', 'email'] },
    { id: 'step2', title: 'Details', fields: ['phone', 'address'] }
  ]

  const wizard = useFormWizard(form, steps)

  return (
    <div>
      <ProgressBar value={wizard.progress} />
      {/* Render current step fields */}
      <Button onClick={wizard.goToNext}>Next</Button>
    </div>
  )
}
```

## Pre-built Schemas

- `schemas.contact` - Contact form
- `schemas.login` - Login form
- `schemas.register` - Registration with password confirmation
- `schemas.address` - Address form
- `schemas.payment` - Payment form with card validation
- `userSchemas.profile` - User profile
- `settingsSchemas.general` - App settings

## Custom Validators

```typescript
import { validators } from '~modules/forms/schemas'

const schema = z.object({
  email: validators.email,
  password: validators.password,
  phone: validators.phone,
  website: validators.url,
  age: validators.age,
  avatar: validators.image
})
```

## Best Practices

1. Always use Zod schemas for validation
2. Persist forms for better UX
3. Use AutoForm for simple forms
4. Implement proper error handling
5. Add loading states for async operations
```
