import { z } from 'zod'

export const validationUtils = {
  // Create conditional validation
  conditionalRequired: <T extends z.ZodType>(
    schema: T,
    condition: (data: any) => boolean,
    message = 'This field is required'
  ) => {
    return z.union([
      z.literal('').refine(() => false, { message }),
      schema
    ]).refine(
      (val, ctx) => !condition(ctx) || val !== '',
      { message }
    )
  },

  // Cross-field validation
  matchField: (fieldName: string, message = 'Fields must match') => {
    return (val: string, ctx: z.RefinementCtx) => {
      const otherValue = ctx.parent[fieldName]
      return val === otherValue
    }
  },

  // Async validation
  asyncValidate: async <T>(
    value: T,
    validator: (val: T) => Promise<boolean>,
    message = 'Validation failed'
  ) => {
    const isValid = await validator(value)
    if (!isValid) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.custom,
        message,
        path: []
      }])
    }
    return value
  }
}