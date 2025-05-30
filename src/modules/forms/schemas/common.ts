import { z } from 'zod'
import { validators } from './validators'

// Common schemas for reuse
export const schemas = {
  // Contact form
  contact: z.object({
    name: z.string().min(2, 'Name is required'),
    email: validators.email,
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
    phone: validators.phone.optional()
  }),

  // Login form
  login: z.object({
    email: validators.email,
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().default(false)
  }),

  // Registration form
  register: z.object({
    username: validators.username,
    email: validators.email,
    password: validators.password,
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  // Address form
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    street2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    country: z.string().min(1, 'Country is required')
  }),

  // Payment form
  payment: z.object({
    cardNumber: validators.creditCard,
    cardHolder: z.string().min(1, 'Cardholder name is required'),
    expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Invalid month'),
    expiryYear: z.string().regex(/^\d{2}$/, 'Invalid year'),
    cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
    billingAddress: z.lazy(() => schemas.address)
  }),

  // Feedback form
  feedback: z.object({
    rating: z.number().min(1).max(5),
    category: z.enum(['bug', 'feature', 'improvement', 'other']),
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    email: validators.email.optional(),
    attachments: z.array(validators.file).optional()
  })
}