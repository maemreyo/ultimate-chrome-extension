import { z } from 'zod'
import { validators } from './validators'

export const userSchemas = {
  profile: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: validators.email,
    phone: validators.phone.optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    avatar: validators.image.optional(),
    dateOfBirth: z.string().optional(),
    website: validators.url.optional(),
    social: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional()
    }).optional()
  }),

  preferences: z.object({
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean()
    }),
    privacy: z.object({
      profileVisible: z.boolean(),
      showEmail: z.boolean(),
      allowMessages: z.boolean()
    }),
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string(),
    timezone: z.string()
  })
}