import { z } from 'zod'

// Custom validators
export const validators = {
  // URL with protocol
  url: z.string().url().refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    'URL must start with http:// or https://'
  ),

  // Email with additional checks
  email: z.string().email().toLowerCase().trim(),

  // Strong password
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  // Phone number (international)
  phone: z.string().regex(
    /^\+?[1-9]\d{1,14}$/,
    'Please enter a valid phone number'
  ),

  // Username
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),

  // File upload
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'File size must be less than 5MB'
  ),

  // Image file
  image: z.instanceof(File)
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be an image (JPEG, PNG, or WebP)'
    )
    .refine(
      (file) => file.size <= 2 * 1024 * 1024,
      'Image size must be less than 2MB'
    ),

  // Date in the future
  futureDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Date must be in the future'
  ),

  // Age verification
  age: z.number()
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Please enter a valid age'),

  // Credit card (basic validation)
  creditCard: z.string().regex(
    /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
    'Please enter a valid credit card number'
  ),

  // Hex color
  hexColor: z.string().regex(
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    'Please enter a valid hex color'
  )
}