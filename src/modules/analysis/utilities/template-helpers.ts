// src/modules/analysis/utilities/template-helpers.ts
// Template compilation and management utilities

import type { AnalysisOptions, PromptTemplate } from "../types"

/**
 * Compile a template with variables
 * @param template - Template string with placeholders
 * @param variables - Variables to replace
 * @param options - Analysis options for conditional logic
 * @returns Compiled template string
 */
export function compileTemplate(
  template: string,
  variables: Record<string, any>,
  options?: AnalysisOptions
): string {
  let compiled = template

  // Replace simple variables {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, "g")
    compiled = compiled.replace(placeholder, String(value))
  }

  // Handle conditional blocks {{#if condition}}...{{/if}}
  compiled = handleConditionals(compiled, { ...variables, ...options })

  // Handle loops {{#each items}}...{{/each}}
  compiled = handleLoops(compiled, variables)

  return compiled.trim()
}

/**
 * Handle conditional template blocks
 * @param template - Template with conditionals
 * @param context - Context variables
 * @returns Template with conditionals resolved
 */
function handleConditionals(
  template: string,
  context: Record<string, any>
): string {
  const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g

  return template.replace(conditionalRegex, (match, condition, content) => {
    const value = context[condition]
    return value ? content : ""
  })
}

/**
 * Handle loop template blocks
 * @param template - Template with loops
 * @param context - Context variables
 * @returns Template with loops resolved
 */
function handleLoops(template: string, context: Record<string, any>): string {
  const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g

  return template.replace(loopRegex, (match, arrayName, content) => {
    const array = context[arrayName]
    if (!Array.isArray(array)) return ""

    return array
      .map((item, index) => {
        let itemContent = content
        // Replace {{this}} with current item
        itemContent = itemContent.replace(/{{this}}/g, String(item))
        // Replace {{@index}} with current index
        itemContent = itemContent.replace(/{{@index}}/g, String(index))
        return itemContent
      })
      .join("")
  })
}

/**
 * Validate template variables
 * @param template - Template to validate
 * @param variables - Variables to check
 * @returns Validation result
 */
export function validateTemplate(
  template: PromptTemplate,
  variables: Record<string, any>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required variables
  for (const variable of template.variables) {
    if (variable.required && !(variable.name in variables)) {
      errors.push(`Required variable '${variable.name}' is missing`)
    }

    if (variable.name in variables) {
      const value = variables[variable.name]
      const expectedType = variable.type

      // Type validation
      if (expectedType === "string" && typeof value !== "string") {
        errors.push(`Variable '${variable.name}' should be a string`)
      }
      if (expectedType === "number" && typeof value !== "number") {
        errors.push(`Variable '${variable.name}' should be a number`)
      }
      if (expectedType === "boolean" && typeof value !== "boolean") {
        errors.push(`Variable '${variable.name}' should be a boolean`)
      }
    }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Get template by ID with fallback
 * @param templateId - Template ID to find
 * @param templates - Available templates
 * @param fallbackId - Fallback template ID
 * @returns Template or fallback template
 */
export function getTemplate(
  templateId: string,
  templates: Record<string, PromptTemplate>,
  fallbackId?: string
): PromptTemplate | null {
  if (templates[templateId]) {
    return templates[templateId]
  }

  if (fallbackId && templates[fallbackId]) {
    return templates[fallbackId]
  }

  return null
}

/**
 * Create a custom template
 * @param id - Template ID
 * @param name - Template name
 * @param template - Template string
 * @param variables - Template variables
 * @param category - Template category
 * @returns PromptTemplate object
 */
export function createTemplate(
  id: string,
  name: string,
  template: string,
  variables: Array<{
    name: string
    type: "string" | "number" | "boolean" | "array"
    required: boolean
    description?: string
    default?: any
  }>,
  category: string = "custom"
): PromptTemplate {
  return {
    id,
    name,
    description: `Custom template: ${name}`,
    category,
    template,
    variables
  }
}

/**
 * Merge multiple templates
 * @param templates - Templates to merge
 * @param separator - Separator between templates
 * @returns Merged template string
 */
export function mergeTemplates(
  templates: string[],
  separator: string = "\n\n---\n\n"
): string {
  return templates.filter(Boolean).join(separator)
}
