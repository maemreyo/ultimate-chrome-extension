// src/modules/storage/utilities/storage-validation-helpers.ts
// Storage validation and schema management utilities

import type { QueryOptions, StorageConfig, StorageItem } from "../types"

/**
 * Schema definition for storage items
 */
export interface StorageSchema {
  version: number
  tables: Record<string, TableSchema>
  migrations?: Migration[]
}

/**
 * Table schema definition
 */
export interface TableSchema {
  fields: Record<string, FieldSchema>
  indexes?: string[]
  constraints?: Constraint[]
}

/**
 * Field schema definition
 */
export interface FieldSchema {
  type: "string" | "number" | "boolean" | "object" | "array" | "date"
  required?: boolean
  default?: any
  validation?: ValidationRule[]
  encrypted?: boolean
  indexed?: boolean
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  type: "min" | "max" | "pattern" | "enum" | "custom"
  value?: any
  message?: string
  validator?: (value: any) => boolean | string
}

/**
 * Database constraint definition
 */
export interface Constraint {
  type: "unique" | "foreign_key" | "check"
  fields: string[]
  reference?: { table: string; field: string }
  condition?: string
}

/**
 * Migration definition
 */
export interface Migration {
  version: number
  up: (db: any) => Promise<void>
  down: (db: any) => Promise<void>
  description: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
  value: any
  rule: string
}

/**
 * Storage validator class
 */
export class StorageValidator {
  private schemas: Map<string, StorageSchema> = new Map()

  /**
   * Register a schema for validation
   * @param name - Schema name
   * @param schema - Schema definition
   */
  registerSchema(name: string, schema: StorageSchema): void {
    this.schemas.set(name, schema)
  }

  /**
   * Validate storage item against schema
   * @param item - Item to validate
   * @param schemaName - Schema to validate against
   * @returns Validation result
   */
  validateItem(item: StorageItem, schemaName: string): ValidationResult {
    const schema = this.schemas.get(schemaName)
    if (!schema) {
      return {
        isValid: false,
        errors: [
          {
            field: "schema",
            message: `Schema '${schemaName}' not found`,
            value: schemaName,
            rule: "exists"
          }
        ],
        warnings: []
      }
    }

    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Validate item structure
    if (!item.id || typeof item.id !== "string") {
      errors.push({
        field: "id",
        message: "ID is required and must be a string",
        value: item.id,
        rule: "required"
      })
    }

    if (!item.key || typeof item.key !== "string") {
      errors.push({
        field: "key",
        message: "Key is required and must be a string",
        value: item.key,
        rule: "required"
      })
    }

    if (item.value === undefined) {
      errors.push({
        field: "value",
        message: "Value is required",
        value: item.value,
        rule: "required"
      })
    }

    // Validate metadata
    if (!item.metadata || typeof item.metadata !== "object") {
      errors.push({
        field: "metadata",
        message: "Metadata is required and must be an object",
        value: item.metadata,
        rule: "required"
      })
    } else {
      const metadataErrors = this.validateMetadata(item.metadata)
      errors.push(...metadataErrors)
    }

    // Validate value against schema if available
    const tableSchema = this.getTableSchemaForKey(schema, item.key)
    if (tableSchema && item.value) {
      const valueErrors = this.validateValue(item.value, tableSchema)
      errors.push(...valueErrors)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate storage configuration
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validateConfig(config: StorageConfig): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Validate encryption config
    if (config.encryption) {
      if (config.encryption.enabled && !config.encryption.key) {
        warnings.push(
          "Encryption is enabled but no key provided - will generate random key"
        )
      }

      if (
        config.encryption.algorithm &&
        !["AES-GCM", "AES-CBC"].includes(config.encryption.algorithm)
      ) {
        errors.push({
          field: "encryption.algorithm",
          message: "Invalid encryption algorithm",
          value: config.encryption.algorithm,
          rule: "enum"
        })
      }
    }

    // Validate compression config
    if (
      config.compression?.algorithm &&
      !["gzip", "lz4", "brotli"].includes(config.compression.algorithm)
    ) {
      errors.push({
        field: "compression.algorithm",
        message: "Invalid compression algorithm",
        value: config.compression.algorithm,
        rule: "enum"
      })
    }

    // Validate sync config
    if (config.sync) {
      if (config.sync.interval && config.sync.interval < 1000) {
        warnings.push("Sync interval is very low - may impact performance")
      }

      if (
        config.sync.conflictResolution &&
        !["local", "remote", "merge"].includes(config.sync.conflictResolution)
      ) {
        errors.push({
          field: "sync.conflictResolution",
          message: "Invalid conflict resolution strategy",
          value: config.sync.conflictResolution,
          rule: "enum"
        })
      }
    }

    // Validate quota config
    if (config.quota) {
      if (config.quota.maxSize && config.quota.maxSize <= 0) {
        errors.push({
          field: "quota.maxSize",
          message: "Max size must be positive",
          value: config.quota.maxSize,
          rule: "min"
        })
      }

      if (
        config.quota.warnAt &&
        (config.quota.warnAt <= 0 || config.quota.warnAt > 100)
      ) {
        errors.push({
          field: "quota.warnAt",
          message: "Warning threshold must be between 1 and 100",
          value: config.quota.warnAt,
          rule: "range"
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate query options
   * @param options - Query options to validate
   * @returns Validation result
   */
  validateQueryOptions(options: QueryOptions): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    if (options.limit && options.limit <= 0) {
      errors.push({
        field: "limit",
        message: "Limit must be positive",
        value: options.limit,
        rule: "min"
      })
    }

    if (options.offset && options.offset < 0) {
      errors.push({
        field: "offset",
        message: "Offset must be non-negative",
        value: options.offset,
        rule: "min"
      })
    }

    if (options.limit && options.limit > 10000) {
      warnings.push("Large limit may impact performance")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Sanitize storage key
   * @param key - Key to sanitize
   * @returns Sanitized key
   */
  sanitizeKey(key: string): string {
    return key
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase()
  }

  /**
   * Validate storage key format
   * @param key - Key to validate
   * @returns True if valid
   */
  isValidKey(key: string): boolean {
    if (!key || typeof key !== "string") return false
    if (key.length > 250) return false
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) return false
    if (key.startsWith(".") || key.endsWith(".")) return false
    return true
  }

  /**
   * Estimate storage size for item
   * @param item - Item to estimate
   * @returns Estimated size in bytes
   */
  estimateSize(item: StorageItem): number {
    try {
      return new Blob([JSON.stringify(item)]).size
    } catch {
      return JSON.stringify(item).length * 2
    }
  }

  /**
   * Check if value exceeds size limits
   * @param value - Value to check
   * @param maxSize - Maximum size in bytes
   * @returns True if within limits
   */
  checkSizeLimit(value: any, maxSize: number): boolean {
    const size = this.estimateSize({
      id: "",
      key: "",
      value,
      metadata: {} as any
    })
    return size <= maxSize
  }

  /**
   * Validate metadata structure
   * @param metadata - Metadata to validate
   * @returns Array of validation errors
   */
  private validateMetadata(metadata: any): ValidationError[] {
    const errors: ValidationError[] = []

    if (!metadata.created || !(metadata.created instanceof Date)) {
      errors.push({
        field: "metadata.created",
        message: "Created date is required and must be a Date",
        value: metadata.created,
        rule: "type"
      })
    }

    if (!metadata.updated || !(metadata.updated instanceof Date)) {
      errors.push({
        field: "metadata.updated",
        message: "Updated date is required and must be a Date",
        value: metadata.updated,
        rule: "type"
      })
    }

    if (typeof metadata.version !== "number" || metadata.version < 1) {
      errors.push({
        field: "metadata.version",
        message: "Version must be a positive number",
        value: metadata.version,
        rule: "min"
      })
    }

    if (typeof metadata.size !== "number" || metadata.size < 0) {
      errors.push({
        field: "metadata.size",
        message: "Size must be a non-negative number",
        value: metadata.size,
        rule: "min"
      })
    }

    if (typeof metadata.encrypted !== "boolean") {
      errors.push({
        field: "metadata.encrypted",
        message: "Encrypted flag must be a boolean",
        value: metadata.encrypted,
        rule: "type"
      })
    }

    if (typeof metadata.compressed !== "boolean") {
      errors.push({
        field: "metadata.compressed",
        message: "Compressed flag must be a boolean",
        value: metadata.compressed,
        rule: "type"
      })
    }

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      errors.push({
        field: "metadata.tags",
        message: "Tags must be an array",
        value: metadata.tags,
        rule: "type"
      })
    }

    return errors
  }

  /**
   * Get table schema for a given key
   * @param schema - Storage schema
   * @param key - Storage key
   * @returns Table schema or undefined
   */
  private getTableSchemaForKey(
    schema: StorageSchema,
    key: string
  ): TableSchema | undefined {
    // Simple key-to-table mapping - could be more sophisticated
    const tableName = key.split(".")[0] || "default"
    return schema.tables[tableName]
  }

  /**
   * Validate value against table schema
   * @param value - Value to validate
   * @param schema - Table schema
   * @returns Array of validation errors
   */
  private validateValue(value: any, schema: TableSchema): ValidationError[] {
    const errors: ValidationError[] = []

    if (typeof value !== "object" || value === null) {
      return errors // Skip validation for non-object values
    }

    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      const fieldValue = value[fieldName]
      const fieldErrors = this.validateField(fieldName, fieldValue, fieldSchema)
      errors.push(...fieldErrors)
    }

    return errors
  }

  /**
   * Validate individual field
   * @param fieldName - Field name
   * @param value - Field value
   * @param schema - Field schema
   * @returns Array of validation errors
   */
  private validateField(
    fieldName: string,
    value: any,
    schema: FieldSchema
  ): ValidationError[] {
    const errors: ValidationError[] = []

    // Check required
    if (schema.required && (value === undefined || value === null)) {
      errors.push({
        field: fieldName,
        message: "Field is required",
        value,
        rule: "required"
      })
      return errors
    }

    // Skip further validation if value is undefined/null and not required
    if (value === undefined || value === null) {
      return errors
    }

    // Check type
    if (!this.isValidType(value, schema.type)) {
      errors.push({
        field: fieldName,
        message: `Expected type ${schema.type}`,
        value,
        rule: "type"
      })
      return errors
    }

    // Apply validation rules
    if (schema.validation) {
      for (const rule of schema.validation) {
        const ruleError = this.validateRule(fieldName, value, rule)
        if (ruleError) {
          errors.push(ruleError)
        }
      }
    }

    return errors
  }

  /**
   * Check if value matches expected type
   * @param value - Value to check
   * @param expectedType - Expected type
   * @returns True if type matches
   */
  private isValidType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case "string":
        return typeof value === "string"
      case "number":
        return typeof value === "number" && !isNaN(value)
      case "boolean":
        return typeof value === "boolean"
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        )
      case "array":
        return Array.isArray(value)
      case "date":
        return (
          value instanceof Date ||
          (typeof value === "string" && !isNaN(Date.parse(value)))
        )
      default:
        return true
    }
  }

  /**
   * Validate value against rule
   * @param fieldName - Field name
   * @param value - Value to validate
   * @param rule - Validation rule
   * @returns Validation error or null
   */
  private validateRule(
    fieldName: string,
    value: any,
    rule: ValidationRule
  ): ValidationError | null {
    switch (rule.type) {
      case "min":
        if (
          (typeof value === "number" && value < rule.value) ||
          (typeof value === "string" && value.length < rule.value) ||
          (Array.isArray(value) && value.length < rule.value)
        ) {
          return {
            field: fieldName,
            message: rule.message || `Minimum value is ${rule.value}`,
            value,
            rule: "min"
          }
        }
        break

      case "max":
        if (
          (typeof value === "number" && value > rule.value) ||
          (typeof value === "string" && value.length > rule.value) ||
          (Array.isArray(value) && value.length > rule.value)
        ) {
          return {
            field: fieldName,
            message: rule.message || `Maximum value is ${rule.value}`,
            value,
            rule: "max"
          }
        }
        break

      case "pattern":
        if (typeof value === "string" && !new RegExp(rule.value).test(value)) {
          return {
            field: fieldName,
            message: rule.message || "Value does not match required pattern",
            value,
            rule: "pattern"
          }
        }
        break

      case "enum":
        if (!Array.isArray(rule.value) || !rule.value.includes(value)) {
          return {
            field: fieldName,
            message:
              rule.message || `Value must be one of: ${rule.value?.join(", ")}`,
            value,
            rule: "enum"
          }
        }
        break

      case "custom":
        if (rule.validator) {
          const result = rule.validator(value)
          if (result !== true) {
            return {
              field: fieldName,
              message:
                typeof result === "string"
                  ? result
                  : rule.message || "Custom validation failed",
              value,
              rule: "custom"
            }
          }
        }
        break
    }

    return null
  }
}
