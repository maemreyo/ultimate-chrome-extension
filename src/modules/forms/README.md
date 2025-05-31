# Form & Validation System Module

A comprehensive form system built on top of react-hook-form, Zod, and Radix UI components, providing type-safe, accessible, and feature-rich forms.

## Features

- 🎯 **Type-safe forms** with react-hook-form and Zod
- 🎨 **Pre-built form components** using Radix UI
- 📝 **Auto-form generation** from Zod schemas
- 💾 **Form persistence** to storage
- 🧙 **Form wizard** support for multi-step forms
- ✅ **Built-in validators** for common use cases
- 🔄 **Auto-save** functionality
- 📱 **Responsive layouts**
- 🔍 **Field-level validation**
- 🌐 **Internationalization support**
- 🧩 **Custom field components**

## Installation

```bash
# Install dependencies
pnpm add react-hook-form zod @hookform/resolvers/zod
```

## Usage

### Basic Form

```typescript
import { FormProvider, FormBuilder } from '~modules/forms';
import { schemas } from '~modules/forms/schemas';

function ContactForm() {
  return (
    <FormProvider
      schema={schemas.contact}
      onSubmit={async (data) => {
        console.log(data);
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
  );
}
```

### Auto Form

```typescript
import { AutoForm } from '~modules/forms';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  age: z.number().min(18, "You must be at least 18 years old")
});

function SimpleForm() {
  return (
    <AutoForm
      schema={schema}
      onSubmit={(data) => console.log(data)}
      title="User Registration"
      submitLabel="Register"
      showReset={true}
    />
  );
}
```

### Form with Persistence

```typescript
import { FormProvider, FormBuilder } from '~modules/forms';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  tags: z.array(z.string())
});

function DraftEditor() {
  return (
    <FormProvider
      schema={schema}
      defaultValues={{
        title: '',
        content: '',
        tags: []
      }}
      onSubmit={handleSubmit}
      persistKey="draft-editor" // Auto-saves to storage
      mode="onChange" // Auto-validate on change
    >
      {(form) => (
        <FormBuilder
          form={form}
          layout={{
            sections: [{
              title: 'New Post',
              fields: [
                { name: 'title', label: 'Title', required: true },
                { name: 'content', label: 'Content', type: 'textarea', required: true },
                {
                  name: 'tags',
                  label: 'Tags',
                  type: 'select',
                  options: [
                    { label: 'Technology', value: 'tech' },
                    { label: 'Design', value: 'design' },
                    { label: 'Business', value: 'business' }
                  ],
                  componentProps: {
                    isMulti: true,
                    creatable: true
                  }
                }
              ]
            }]
          }}
        />
      )}
    </FormProvider>
  );
}
```

### Form Wizard

```typescript
import { FormProvider, FormBuilder, useFormWizard } from '~modules/forms';
import { z } from 'zod';

const schema = z.object({
  // Personal info
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),

  // Address
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),

  // Payment
  cardNumber: z.string(),
  expiryDate: z.string(),
  cvv: z.string().length(3)
});

function CheckoutWizard() {
  return (
    <FormProvider schema={schema} onSubmit={handleSubmit}>
      {(form) => <WizardSteps form={form} />}
    </FormProvider>
  );
}

function WizardSteps({ form }) {
  const steps = [
    {
      id: 'personal',
      title: 'Personal Info',
      fields: ['firstName', 'lastName', 'email']
    },
    {
      id: 'address',
      title: 'Shipping Address',
      fields: ['street', 'city', 'state', 'zipCode']
    },
    {
      id: 'payment',
      title: 'Payment Details',
      fields: ['cardNumber', 'expiryDate', 'cvv']
    }
  ];

  const {
    currentStep,
    currentFields,
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrevious,
    goToStep,
    progress
  } = useFormWizard(form, steps);

  return (
    <div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>

      <div className="steps-indicator">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={currentStep === index ? 'active' : ''}
          >
            {step.title}
          </button>
        ))}
      </div>

      <FormBuilder
        form={form}
        layout={{
          sections: [{
            title: steps[currentStep].title,
            fields: currentFields.map(name => ({ name }))
          }]
        }}
      />

      <div className="wizard-controls">
        {!isFirstStep && (
          <button onClick={goToPrevious}>Previous</button>
        )}

        {isLastStep ? (
          <button type="submit">Submit</button>
        ) : (
          <button onClick={goToNext}>Next</button>
        )}
      </div>
    </div>
  );
}
```

### Custom Field Components

```typescript
import { FormProvider, FormBuilder } from '~modules/forms';
import { z } from 'zod';

// Custom color picker component
function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
      />
      <span>{value}</span>
    </div>
  );
}

function ThemeEditor() {
  const schema = z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    textColor: z.string()
  });

  return (
    <FormProvider schema={schema} onSubmit={handleSave}>
      {(form) => (
        <FormBuilder
          form={form}
          layout={{
            sections: [{
              title: 'Theme Colors',
              fields: [
                {
                  name: 'primaryColor',
                  label: 'Primary Color',
                  component: ColorPicker
                },
                {
                  name: 'secondaryColor',
                  label: 'Secondary Color',
                  component: ColorPicker
                },
                {
                  name: 'textColor',
                  label: 'Text Color',
                  component: ColorPicker
                }
              ]
            }]
          }}
        />
      )}
    </FormProvider>
  );
}
```

### Form Hooks

```typescript
import { useForm } from '~modules/forms/hooks';
import { z } from 'zod';

function CustomForm() {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email()
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue
  } = useForm({
    schema,
    defaultValues: {
      name: '',
      email: ''
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    await saveData(data);
    reset();
  });

  // Watch a specific field
  const name = watch('name');

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>Name</label>
        <input {...register('name')} />
        {errors.name && <p>{errors.name.message}</p>}
      </div>

      <div>
        <label>Email</label>
        <input {...register('email')} />
        {errors.email && <p>{errors.email.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>

      <button type="button" onClick={() => reset()} disabled={!isDirty}>
        Reset
      </button>
    </form>
  );
}
```

### Form Persistence

```typescript
import { useFormPersist } from '~modules/forms/hooks';
import { useForm } from 'react-hook-form';

function PersistentForm() {
  const { register, handleSubmit, formState, reset, control } = useForm({
    defaultValues: {
      title: '',
      content: ''
    }
  });

  // Automatically persists form values to storage
  useFormPersist('blog-post-draft', {
    control,
    exclude: ['sensitiveField'], // Fields to exclude from persistence
    storage: 'localStorage', // or 'sessionStorage', 'indexedDB'
    debounce: 500 // ms
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Pre-built Schemas

The module includes several pre-built schemas for common form types:

### Basic Forms

- `schemas.contact` - Contact form
- `schemas.login` - Login form
- `schemas.register` - Registration with password confirmation
- `schemas.feedback` - User feedback form

### User Data

- `schemas.user.profile` - User profile
- `schemas.user.preferences` - User preferences
- `schemas.user.account` - Account settings

### E-commerce

- `schemas.address` - Shipping/billing address
- `schemas.payment` - Payment form with card validation
- `schemas.order` - Order details

### Settings

- `schemas.settings.general` - General app settings
- `schemas.settings.notifications` - Notification preferences
- `schemas.settings.privacy` - Privacy settings

## Custom Validators

```typescript
import { validators } from '~modules/forms/schemas';
import { z } from 'zod';

const schema = z.object({
  email: validators.email, // Email validation
  password: validators.password, // Strong password rules
  phone: validators.phone, // Phone number with formatting
  website: validators.url, // URL validation
  age: validators.age, // Age with min/max
  avatar: validators.image, // Image file validation
  username: validators.username, // Alphanumeric with underscores
  creditCard: validators.creditCard, // Credit card validation
  postalCode: validators.postalCode, // Postal/ZIP code
  color: validators.hexColor // Hex color code
});
```

## Form Utilities

```typescript
import { transformers } from '~modules/forms/utils';

// Transform form data before submission
const transformedData = transformers.trimStrings(formData);
const normalizedData = transformers.normalizeEmails(formData);
const sanitizedData = transformers.sanitizeHtml(formData);

// Format values
const formattedPhone = transformers.formatPhone(phoneNumber);
const formattedCurrency = transformers.formatCurrency(amount);
const formattedDate = transformers.formatDate(dateString);
```

## API Reference

### Components

- `FormProvider`: Context provider for form state and validation
- `FormBuilder`: Builds form UI from configuration
- `AutoForm`: Automatically generates form from Zod schema
- `FormField`: Individual form field with validation

### Hooks

- `useForm`: Enhanced version of react-hook-form's useForm
- `useFormPersist`: Persists form values to storage
- `useFormWizard`: Multi-step form wizard functionality
- `useFieldArray`: Manage arrays of fields (dynamic fields)

### Types

```typescript
interface FormConfig<T extends FieldValues = FieldValues> {
  schema: z.ZodType<T>;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  resetOnSubmit?: boolean;
  persistKey?: string; // Save to storage
  onSubmit: SubmitHandler<T>;
  onError?: (errors: any) => void;
}

interface FieldConfig {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch' | 'file';
  options?: Array<{ label: string; value: string | number }>;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  // Custom components
  component?: React.ComponentType<any>;
  componentProps?: Record<string, any>;
}

interface FormSection {
  title?: string;
  description?: string;
  fields: FieldConfig[];
  columns?: 1 | 2 | 3 | 4;
}

interface FormLayoutConfig {
  sections: FormSection[];
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  showReset?: boolean;
  layout?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
}
```

## Best Practices

1. **Use Zod Schemas**: Always define validation with Zod schemas
2. **Form Persistence**: Use persistence for forms that take time to complete
3. **Field Grouping**: Group related fields in sections
4. **Validation Timing**: Choose appropriate validation timing (onChange, onBlur, onSubmit)
5. **Error Handling**: Implement proper error handling and display
6. **Loading States**: Add loading states for async operations
7. **Accessibility**: Ensure forms are accessible with proper labels and ARIA attributes
8. **Responsive Design**: Test forms on different screen sizes
9. **Form Reset**: Provide reset functionality for complex forms
10. **Conditional Fields**: Show/hide fields based on other field values

## Advanced Usage

### Conditional Fields

```typescript
import { FormProvider, FormBuilder } from '~modules/forms';
import { z } from 'zod';

const schema = z.object({
  deliveryType: z.enum(['pickup', 'delivery']),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional()
}).refine(data => {
  // If delivery is selected, address is required
  if (data.deliveryType === 'delivery') {
    return !!data.address && !!data.city && !!data.zipCode;
  }
  return true;
}, {
  message: "Address information is required for delivery",
  path: ["address"]
});

function DeliveryForm() {
  return (
    <FormProvider schema={schema} onSubmit={handleSubmit}>
      {(form) => {
        const deliveryType = form.watch('deliveryType');

        return (
          <FormBuilder
            form={form}
            layout={{
              sections: [{
                title: 'Delivery Options',
                fields: [
                  {
                    name: 'deliveryType',
                    label: 'Delivery Type',
                    type: 'radio',
                    options: [
                      { label: 'Pickup', value: 'pickup' },
                      { label: 'Delivery', value: 'delivery' }
                    ]
                  },
                  ...(deliveryType === 'delivery' ? [
                    { name: 'address', label: 'Address', required: true },
                    { name: 'city', label: 'City', required: true },
                    { name: 'zipCode', label: 'ZIP Code', required: true }
                  ] : [])
                ]
              }]
            }}
          />
        );
      }}
    </FormProvider>
  );
}
```

### Dynamic Field Arrays

```typescript
import { FormProvider, FormBuilder } from '~modules/forms';
import { z } from 'zod';

const schema = z.object({
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    price: z.number().min(0, "Price cannot be negative")
  })).min(1, "At least one item is required")
});

function OrderForm() {
  return (
    <FormProvider schema={schema} onSubmit={handleSubmit}>
      {(form) => {
        const { fields, append, remove } = form.useFieldArray({
          name: 'items'
        });

        return (
          <div>
            <h2>Order Items</h2>

            {fields.map((field, index) => (
              <div key={field.id} className="item-row">
                <FormBuilder
                  form={form}
                  layout={{
                    sections: [{
                      fields: [
                        { name: `items.${index}.name`, label: 'Item Name' },
                        { name: `items.${index}.quantity`, label: 'Quantity', type: 'number' },
                        { name: `items.${index}.price`, label: 'Price', type: 'number' }
                      ]
                    }]
                  }}
                />
                <button type="button" onClick={() => remove(index)}>
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ name: '', quantity: 1, price: 0 })}
            >
              Add Item
            </button>

            <button type="submit">Submit Order</button>
          </div>
        );
      }}
    </FormProvider>
  );
}
```

### Form with File Uploads

```typescript
import { FormProvider, FormBuilder } from '~modules/forms';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  image: z
    .instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      file => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    )
    .optional()
});

function UploadForm() {
  return (
    <FormProvider schema={schema} onSubmit={handleSubmit}>
      {(form) => (
        <FormBuilder
          form={form}
          layout={{
            sections: [{
              title: 'Upload Image',
              fields: [
                { name: 'title', label: 'Title', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                {
                  name: 'image',
                  label: 'Image',
                  type: 'file',
                  componentProps: {
                    accept: ACCEPTED_IMAGE_TYPES.join(','),
                    preview: true
                  }
                }
              ]
            }]
          }}
        />
      )}
    </FormProvider>
  );
}
```
