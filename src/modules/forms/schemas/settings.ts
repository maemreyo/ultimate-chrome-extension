import { z } from 'zod'

export const settingsSchemas = {
  general: z.object({
    siteName: z.string().min(1, 'Site name is required'),
    siteDescription: z.string().optional(),
    siteUrl: z.string().url(),
    contactEmail: z.string().email(),
    timezone: z.string(),
    dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
    timeFormat: z.enum(['12h', '24h'])
  }),

  extension: z.object({
    enabled: z.boolean(),
    autoSync: z.boolean(),
    syncInterval: z.number().min(60).max(3600),
    dataRetention: z.number().min(1).max(365),
    debugMode: z.boolean(),
    telemetry: z.boolean(),
    experimental: z.object({
      newUI: z.boolean(),
      betaFeatures: z.boolean()
    })
  }),

  api: z.object({
    endpoint: z.string().url(),
    apiKey: z.string().min(1, 'API key is required'),
    timeout: z.number().min(1000).max(60000),
    retries: z.number().min(0).max(5),
    rateLimit: z.number().min(1).max(1000)
  })
}