// src/modules/messaging/utilities/message-validation-helpers.ts
// Message validation and sanitization utilities

import type {
  Message,
  MessageFilter,
  MessageMetadata,
  SenderInfo
} from "../types"

/**
 * Validate message structure and content
 * @param message - Message to validate
 * @returns Validation result
 */
export function validateMessage(message: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Required fields
  if (!message.id || typeof message.id !== "string") {
    errors.push("Message ID is required and must be a string")
  }

  if (!message.channel || typeof message.channel !== "string") {
    errors.push("Message channel is required and must be a string")
  }

  if (!message.type || typeof message.type !== "string") {
    errors.push("Message type is required and must be a string")
  }

  if (message.payload === undefined) {
    errors.push("Message payload is required")
  }

  if (!message.metadata || typeof message.metadata !== "object") {
    errors.push("Message metadata is required and must be an object")
  }

  if (!message.timestamp || typeof message.timestamp !== "number") {
    errors.push("Message timestamp is required and must be a number")
  }

  // Validate metadata
  if (message.metadata) {
    const metadataErrors = validateMessageMetadata(message.metadata)
    errors.push(...metadataErrors)
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validate message metadata
 * @param metadata - Metadata to validate
 * @returns Array of validation errors
 */
function validateMessageMetadata(metadata: any): string[] {
  const errors: string[] = []

  if (!metadata.sender || typeof metadata.sender !== "object") {
    errors.push("Metadata sender is required and must be an object")
  } else {
    const senderErrors = validateSenderInfo(metadata.sender)
    errors.push(...senderErrors)
  }

  if (
    metadata.priority !== undefined &&
    (typeof metadata.priority !== "number" ||
      metadata.priority < 0 ||
      metadata.priority > 3)
  ) {
    errors.push("Metadata priority must be a number between 0 and 3")
  }

  if (
    metadata.ttl !== undefined &&
    (typeof metadata.ttl !== "number" || metadata.ttl <= 0)
  ) {
    errors.push("Metadata TTL must be a positive number")
  }

  if (
    metadata.correlationId !== undefined &&
    typeof metadata.correlationId !== "string"
  ) {
    errors.push("Metadata correlationId must be a string")
  }

  if (metadata.replyTo !== undefined && typeof metadata.replyTo !== "string") {
    errors.push("Metadata replyTo must be a string")
  }

  if (metadata.headers !== undefined && typeof metadata.headers !== "object") {
    errors.push("Metadata headers must be an object")
  }

  if (
    metadata.retryCount !== undefined &&
    (typeof metadata.retryCount !== "number" || metadata.retryCount < 0)
  ) {
    errors.push("Metadata retryCount must be a non-negative number")
  }

  if (
    metadata.encrypted !== undefined &&
    typeof metadata.encrypted !== "boolean"
  ) {
    errors.push("Metadata encrypted must be a boolean")
  }

  return errors
}

/**
 * Validate sender information
 * @param sender - Sender info to validate
 * @returns Array of validation errors
 */
function validateSenderInfo(sender: any): string[] {
  const errors: string[] = []

  if (!sender.id || typeof sender.id !== "string") {
    errors.push("Sender ID is required and must be a string")
  }

  const validTypes = [
    "background",
    "content",
    "popup",
    "options",
    "devtools",
    "tab"
  ]
  if (!sender.type || !validTypes.includes(sender.type)) {
    errors.push(`Sender type must be one of: ${validTypes.join(", ")}`)
  }

  if (
    sender.tabId !== undefined &&
    (typeof sender.tabId !== "number" || sender.tabId < 0)
  ) {
    errors.push("Sender tabId must be a non-negative number")
  }

  if (
    sender.frameId !== undefined &&
    (typeof sender.frameId !== "number" || sender.frameId < 0)
  ) {
    errors.push("Sender frameId must be a non-negative number")
  }

  if (sender.url !== undefined && typeof sender.url !== "string") {
    errors.push("Sender URL must be a string")
  }

  return errors
}

/**
 * Sanitize message payload to prevent XSS and injection attacks
 * @param payload - Payload to sanitize
 * @returns Sanitized payload
 */
export function sanitizeMessagePayload(payload: any): any {
  if (typeof payload === "string") {
    return sanitizeString(payload)
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeMessagePayload(item))
  }

  if (payload && typeof payload === "object") {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(payload)) {
      sanitized[sanitizeString(key)] = sanitizeMessagePayload(value)
    }
    return sanitized
  }

  return payload
}

/**
 * Sanitize string content
 * @param str - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:text\/html/gi, "")
    .trim()
}

/**
 * Validate message filter
 * @param filter - Filter to validate
 * @returns Validation result
 */
export function validateMessageFilter(filter: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (filter.type !== undefined) {
    if (typeof filter.type === "string") {
      // Single type is valid
    } else if (Array.isArray(filter.type)) {
      if (!filter.type.every((t: any) => typeof t === "string")) {
        errors.push("Filter type array must contain only strings")
      }
    } else {
      errors.push("Filter type must be a string or array of strings")
    }
  }

  if (filter.sender !== undefined && typeof filter.sender !== "object") {
    errors.push("Filter sender must be an object")
  }

  if (filter.metadata !== undefined && typeof filter.metadata !== "object") {
    errors.push("Filter metadata must be an object")
  }

  if (filter.custom !== undefined && typeof filter.custom !== "function") {
    errors.push("Filter custom must be a function")
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Check if message matches filter
 * @param message - Message to check
 * @param filter - Filter to apply
 * @returns True if message matches filter
 */
export function messageMatchesFilter(
  message: Message,
  filter: MessageFilter
): boolean {
  // Type filter
  if (filter.type) {
    if (typeof filter.type === "string") {
      if (message.type !== filter.type) return false
    } else if (Array.isArray(filter.type)) {
      if (!filter.type.includes(message.type)) return false
    }
  }

  // Sender filter
  if (filter.sender) {
    if (!senderMatches(message.metadata.sender, filter.sender)) {
      return false
    }
  }

  // Metadata filter
  if (filter.metadata) {
    if (!metadataMatches(message.metadata, filter.metadata)) {
      return false
    }
  }

  // Custom filter
  if (filter.custom) {
    if (!filter.custom(message)) return false
  }

  return true
}

/**
 * Check if sender matches filter
 * @param sender - Sender info
 * @param filter - Sender filter
 * @returns True if sender matches
 */
function senderMatches(
  sender: SenderInfo,
  filter: Partial<SenderInfo>
): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && sender[key as keyof SenderInfo] !== value) {
      return false
    }
  }
  return true
}

/**
 * Check if metadata matches filter
 * @param metadata - Message metadata
 * @param filter - Metadata filter
 * @returns True if metadata matches
 */
function metadataMatches(
  metadata: MessageMetadata,
  filter: Partial<MessageMetadata>
): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (
      value !== undefined &&
      metadata[key as keyof MessageMetadata] !== value
    ) {
      return false
    }
  }
  return true
}

/**
 * Validate channel name
 * @param name - Channel name to validate
 * @returns Validation result
 */
export function validateChannelName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Channel name must be a non-empty string" }
  }

  if (name.length > 100) {
    return {
      isValid: false,
      error: "Channel name must be 100 characters or less"
    }
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
    return {
      isValid: false,
      error:
        "Channel name can only contain letters, numbers, underscores, dots, and hyphens"
    }
  }

  if (name.startsWith(".") || name.endsWith(".")) {
    return {
      isValid: false,
      error: "Channel name cannot start or end with a dot"
    }
  }

  return { isValid: true }
}

/**
 * Estimate message size in bytes
 * @param message - Message to estimate
 * @returns Estimated size in bytes
 */
export function estimateMessageSize(message: Message): number {
  try {
    return new Blob([JSON.stringify(message)]).size
  } catch {
    return JSON.stringify(message).length * 2 // Rough estimate
  }
}

/**
 * Check if message has expired based on TTL
 * @param message - Message to check
 * @returns True if message has expired
 */
export function isMessageExpired(message: Message): boolean {
  if (!message.metadata.ttl) return false

  const now = Date.now()
  const expiryTime = message.timestamp + message.metadata.ttl

  return now > expiryTime
}

/**
 * Generate message fingerprint for deduplication
 * @param message - Message to fingerprint
 * @returns Message fingerprint
 */
export function generateMessageFingerprint(message: Message): string {
  const data = {
    channel: message.channel,
    type: message.type,
    payload: message.payload,
    sender: message.metadata.sender.id
  }

  return btoa(JSON.stringify(data)).replace(/[+/=]/g, "")
}
