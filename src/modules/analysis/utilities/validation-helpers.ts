// src/modules/analysis/utilities/validation-helpers.ts
// Input validation and sanitization utilities

import type { AnalysisInput, AnalysisRequest, AnalysisType } from "../types"

/**
 * Validate analysis inputs against type requirements
 * @param inputs - Input data to validate
 * @param analysisType - Analysis type with requirements
 * @returns Validation result
 */
export function validateInputs(
  inputs: Record<string, any>,
  analysisType: AnalysisType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const requirement of analysisType.requiredInputs) {
    const value = inputs[requirement.name]

    // Check if required input is present
    if (
      requirement.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`Required input '${requirement.name}' is missing`)
      continue
    }

    // Skip validation if input is not provided and not required
    if (!requirement.required && (value === undefined || value === null)) {
      continue
    }

    // Type validation
    const typeError = validateInputType(value, requirement)
    if (typeError) {
      errors.push(typeError)
    }

    // Length validation
    const lengthError = validateInputLength(value, requirement)
    if (lengthError) {
      errors.push(lengthError)
    }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validate input type
 * @param value - Input value
 * @param requirement - Input requirement
 * @returns Error message or null
 */
function validateInputType(
  value: any,
  requirement: AnalysisInput
): string | null {
  switch (requirement.type) {
    case "text":
      if (typeof value !== "string") {
        return `Input '${requirement.name}' must be a string`
      }
      break

    case "url":
      if (typeof value !== "string" || !isValidURL(value)) {
        return `Input '${requirement.name}' must be a valid URL`
      }
      break

    case "html":
      if (typeof value !== "string" || !isValidHTML(value)) {
        return `Input '${requirement.name}' must be valid HTML`
      }
      break

    case "image":
      if (!isValidImageInput(value)) {
        return `Input '${requirement.name}' must be a valid image (URL, base64, or File)`
      }
      break

    case "document":
      if (!isValidDocumentInput(value)) {
        return `Input '${requirement.name}' must be a valid document`
      }
      break
  }

  return null
}

/**
 * Validate input length
 * @param value - Input value
 * @param requirement - Input requirement
 * @returns Error message or null
 */
function validateInputLength(
  value: any,
  requirement: AnalysisInput
): string | null {
  if (!requirement.maxLength) return null

  let length = 0
  if (typeof value === "string") {
    length = value.length
  } else if (value instanceof File) {
    length = value.size
  } else {
    length = JSON.stringify(value).length
  }

  if (length > requirement.maxLength) {
    return `Input '${requirement.name}' exceeds maximum length of ${requirement.maxLength}`
  }

  return null
}

/**
 * Check if string is a valid URL
 * @param url - URL string to validate
 * @returns True if valid URL
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Check if string contains valid HTML
 * @param html - HTML string to validate
 * @returns True if valid HTML
 */
function isValidHTML(html: string): boolean {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    return !doc.querySelector("parsererror")
  } catch {
    return false
  }
}

/**
 * Check if value is a valid image input
 * @param value - Value to check
 * @returns True if valid image input
 */
function isValidImageInput(value: any): boolean {
  // URL
  if (typeof value === "string" && isValidURL(value)) {
    return true
  }

  // Base64 data URL
  if (typeof value === "string" && value.startsWith("data:image/")) {
    return true
  }

  // File object
  if (value instanceof File && value.type.startsWith("image/")) {
    return true
  }

  // Blob
  if (value instanceof Blob && value.type.startsWith("image/")) {
    return true
  }

  return false
}

/**
 * Check if value is a valid document input
 * @param value - Value to check
 * @returns True if valid document input
 */
function isValidDocumentInput(value: any): boolean {
  // URL
  if (typeof value === "string" && isValidURL(value)) {
    return true
  }

  // File object
  if (value instanceof File) {
    const allowedTypes = [
      "text/plain",
      "text/html",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    return allowedTypes.includes(value.type)
  }

  // Plain text
  if (typeof value === "string") {
    return true
  }

  return false
}

/**
 * Sanitize text input
 * @param text - Text to sanitize
 * @param options - Sanitization options
 * @returns Sanitized text
 */
export function sanitizeTextInput(
  text: string,
  options: {
    removeHTML?: boolean
    removeScripts?: boolean
    maxLength?: number
    allowedTags?: string[]
  } = {}
): string {
  let sanitized = text

  // Remove scripts
  if (options.removeScripts !== false) {
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    )
  }

  // Remove HTML
  if (options.removeHTML) {
    if (options.allowedTags && options.allowedTags.length > 0) {
      // Remove all HTML except allowed tags
      const allowedPattern = options.allowedTags.join("|")
      const regex = new RegExp(
        `<(?!\/?(?:${allowedPattern})(?:\s|>))[^>]+>`,
        "gi"
      )
      sanitized = sanitized.replace(regex, "")
    } else {
      // Remove all HTML
      sanitized = sanitized.replace(/<[^>]*>/g, "")
    }
  }

  // Trim whitespace
  sanitized = sanitized.trim()

  // Truncate if too long
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength) + "..."
  }

  return sanitized
}

/**
 * Validate analysis request
 * @param request - Analysis request to validate
 * @param availableTypes - Available analysis types
 * @returns Validation result
 */
export function validateAnalysisRequest(
  request: AnalysisRequest,
  availableTypes: Record<string, AnalysisType>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if analysis type exists
  if (!availableTypes[request.type]) {
    errors.push(`Unknown analysis type: ${request.type}`)
    return { isValid: false, errors }
  }

  const analysisType = availableTypes[request.type]

  // Validate inputs
  const inputValidation = validateInputs(request.inputs, analysisType)
  errors.push(...inputValidation.errors)

  // Validate options
  if (request.options) {
    const optionsValidation = validateAnalysisOptions(request.options)
    errors.push(...optionsValidation.errors)
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validate analysis options
 * @param options - Analysis options to validate
 * @returns Validation result
 */
function validateAnalysisOptions(options: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (options.language && typeof options.language !== "string") {
    errors.push("Language option must be a string")
  }

  if (
    options.depth &&
    !["quick", "standard", "detailed"].includes(options.depth)
  ) {
    errors.push("Depth option must be one of: quick, standard, detailed")
  }

  if (
    options.includeRecommendations &&
    typeof options.includeRecommendations !== "boolean"
  ) {
    errors.push("includeRecommendations option must be a boolean")
  }

  if (options.includeSources && typeof options.includeSources !== "boolean") {
    errors.push("includeSources option must be a boolean")
  }

  if (options.customPrompt && typeof options.customPrompt !== "string") {
    errors.push("customPrompt option must be a string")
  }

  return { isValid: errors.length === 0, errors }
}
