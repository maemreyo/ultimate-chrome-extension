// src/modules/messaging/utilities/message-security-helpers.ts
// Message security, encryption, and authentication utilities

import type { Message, SenderInfo } from "../types"

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  algorithm: "AES-GCM" | "AES-CBC" | "RSA-OAEP"
  keyLength: 128 | 192 | 256
  ivLength?: number
  tagLength?: number
}

/**
 * Encrypted message wrapper
 */
export interface EncryptedMessage {
  id: string
  encrypted: true
  algorithm: string
  iv: string // Base64 encoded initialization vector
  tag?: string // Base64 encoded authentication tag (for GCM)
  data: string // Base64 encoded encrypted data
  signature?: string // Message signature for integrity
}

/**
 * Message signature for integrity verification
 */
export interface MessageSignature {
  algorithm: "HMAC-SHA256" | "RSA-PSS" | "ECDSA"
  signature: string // Base64 encoded signature
  timestamp: number
  nonce: string
}

/**
 * Security context for message processing
 */
export interface SecurityContext {
  senderId: string
  permissions: string[]
  trustedDomains: string[]
  encryptionKey?: CryptoKey
  signingKey?: CryptoKey
}

/**
 * Message encryption and security utility class
 */
export class MessageSecurity {
  private encryptionKeys: Map<string, CryptoKey> = new Map()
  private signingKeys: Map<string, CryptoKey> = new Map()
  private trustedSenders: Set<string> = new Set()
  private config: EncryptionConfig

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = {
      algorithm: "AES-GCM",
      keyLength: 256,
      ivLength: 12,
      tagLength: 16,
      ...config
    }
  }

  /**
   * Encrypt a message
   * @param message - Message to encrypt
   * @param recipientId - Recipient identifier
   * @returns Encrypted message
   */
  async encryptMessage(
    message: Message,
    recipientId: string
  ): Promise<EncryptedMessage> {
    const key = await this.getOrCreateEncryptionKey(recipientId)
    const serialized = JSON.stringify(message)
    const data = new TextEncoder().encode(serialized)

    try {
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength!))

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv: iv,
          ...(this.config.algorithm === "AES-GCM" && {
            tagLength: this.config.tagLength! * 8
          })
        },
        key,
        data
      )

      const encryptedArray = new Uint8Array(encrypted)
      let encryptedData: Uint8Array
      let tag: Uint8Array | undefined

      if (this.config.algorithm === "AES-GCM") {
        // For GCM, the tag is appended to the encrypted data
        const tagLength = this.config.tagLength!
        encryptedData = encryptedArray.slice(0, -tagLength)
        tag = encryptedArray.slice(-tagLength)
      } else {
        encryptedData = encryptedArray
      }

      const result: EncryptedMessage = {
        id: message.id,
        encrypted: true,
        algorithm: this.config.algorithm,
        iv: this.arrayBufferToBase64(iv),
        data: this.arrayBufferToBase64(encryptedData)
      }

      if (tag) {
        result.tag = this.arrayBufferToBase64(tag)
      }

      // Add signature for integrity
      result.signature = await this.signMessage(
        result,
        message.metadata.sender.id
      )

      return result
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`)
    }
  }

  /**
   * Decrypt an encrypted message
   * @param encryptedMessage - Encrypted message to decrypt
   * @param senderId - Sender identifier
   * @returns Decrypted message
   */
  async decryptMessage(
    encryptedMessage: EncryptedMessage,
    senderId: string
  ): Promise<Message> {
    // Verify signature first
    if (encryptedMessage.signature) {
      const isValid = await this.verifyMessageSignature(
        encryptedMessage,
        senderId
      )
      if (!isValid) {
        throw new Error("Message signature verification failed")
      }
    }

    const key = await this.getEncryptionKey(senderId)
    if (!key) {
      throw new Error("Encryption key not found for sender")
    }

    try {
      const iv = this.base64ToArrayBuffer(encryptedMessage.iv)
      const encryptedData = this.base64ToArrayBuffer(encryptedMessage.data)

      let dataToDecrypt: ArrayBuffer

      if (encryptedMessage.algorithm === "AES-GCM" && encryptedMessage.tag) {
        // For GCM, append the tag to the encrypted data
        const tag = this.base64ToArrayBuffer(encryptedMessage.tag)
        const combined = new Uint8Array(
          encryptedData.byteLength + tag.byteLength
        )
        combined.set(new Uint8Array(encryptedData))
        combined.set(new Uint8Array(tag), encryptedData.byteLength)
        dataToDecrypt = combined.buffer
      } else {
        dataToDecrypt = encryptedData
      }

      const decrypted = await crypto.subtle.decrypt(
        {
          name: encryptedMessage.algorithm,
          iv: iv,
          ...(encryptedMessage.algorithm === "AES-GCM" && {
            tagLength: this.config.tagLength! * 8
          })
        },
        key,
        dataToDecrypt
      )

      const decryptedText = new TextDecoder().decode(decrypted)
      return JSON.parse(decryptedText)
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`)
    }
  }

  /**
   * Sign a message for integrity verification
   * @param message - Message to sign
   * @param senderId - Sender identifier
   * @returns Message signature
   */
  async signMessage(message: any, senderId: string): Promise<string> {
    const key = await this.getOrCreateSigningKey(senderId)
    const data = new TextEncoder().encode(JSON.stringify(message))

    try {
      const signature = await crypto.subtle.sign(
        {
          name: "HMAC",
          hash: "SHA-256"
        },
        key,
        data
      )

      return this.arrayBufferToBase64(signature)
    } catch (error) {
      throw new Error(`Signing failed: ${error.message}`)
    }
  }

  /**
   * Verify message signature
   * @param message - Message with signature
   * @param senderId - Sender identifier
   * @returns True if signature is valid
   */
  async verifyMessageSignature(
    message: any,
    senderId: string
  ): Promise<boolean> {
    const key = await this.getSigningKey(senderId)
    if (!key || !message.signature) {
      return false
    }

    try {
      const messageWithoutSignature = { ...message }
      delete messageWithoutSignature.signature

      const data = new TextEncoder().encode(
        JSON.stringify(messageWithoutSignature)
      )
      const signature = this.base64ToArrayBuffer(message.signature)

      return await crypto.subtle.verify(
        {
          name: "HMAC",
          hash: "SHA-256"
        },
        key,
        signature,
        data
      )
    } catch (error) {
      console.warn("Signature verification failed:", error)
      return false
    }
  }

  /**
   * Validate sender permissions
   * @param sender - Sender information
   * @param requiredPermissions - Required permissions
   * @returns True if sender has required permissions
   */
  validateSenderPermissions(
    sender: SenderInfo,
    requiredPermissions: string[]
  ): boolean {
    // Check if sender is trusted
    if (!this.trustedSenders.has(sender.id)) {
      return false
    }

    // For now, simplified permission check
    // In a real implementation, you'd check against stored permissions
    return true
  }

  /**
   * Sanitize message content to prevent XSS and injection attacks
   * @param message - Message to sanitize
   * @returns Sanitized message
   */
  sanitizeMessage(message: Message): Message {
    const sanitized = { ...message }
    sanitized.payload = this.sanitizePayload(sanitized.payload)
    return sanitized
  }

  /**
   * Generate secure random nonce
   * @param length - Nonce length in bytes
   * @returns Base64 encoded nonce
   */
  generateNonce(length: number = 16): string {
    const nonce = crypto.getRandomValues(new Uint8Array(length))
    return this.arrayBufferToBase64(nonce)
  }

  /**
   * Validate message timestamp to prevent replay attacks
   * @param timestamp - Message timestamp
   * @param maxAge - Maximum age in milliseconds
   * @returns True if timestamp is valid
   */
  validateTimestamp(timestamp: number, maxAge: number = 300000): boolean {
    const now = Date.now()
    const age = now - timestamp
    return age >= 0 && age <= maxAge
  }

  /**
   * Add trusted sender
   * @param senderId - Sender identifier
   */
  addTrustedSender(senderId: string): void {
    this.trustedSenders.add(senderId)
  }

  /**
   * Remove trusted sender
   * @param senderId - Sender identifier
   */
  removeTrustedSender(senderId: string): void {
    this.trustedSenders.delete(senderId)
  }

  /**
   * Get or create encryption key for sender/recipient
   * @param id - Sender/recipient identifier
   * @returns Encryption key
   */
  private async getOrCreateEncryptionKey(id: string): Promise<CryptoKey> {
    let key = this.encryptionKeys.get(id)

    if (!key) {
      key = (await crypto.subtle.generateKey(
        {
          name: this.config.algorithm,
          length: this.config.keyLength
        },
        false, // Not extractable
        ["encrypt", "decrypt"]
      )) as CryptoKey

      this.encryptionKeys.set(id, key)
    }

    return key
  }

  /**
   * Get encryption key for sender/recipient
   * @param id - Sender/recipient identifier
   * @returns Encryption key or undefined
   */
  private async getEncryptionKey(id: string): Promise<CryptoKey | undefined> {
    return this.encryptionKeys.get(id)
  }

  /**
   * Get or create signing key for sender
   * @param senderId - Sender identifier
   * @returns Signing key
   */
  private async getOrCreateSigningKey(senderId: string): Promise<CryptoKey> {
    let key = this.signingKeys.get(senderId)

    if (!key) {
      key = (await crypto.subtle.generateKey(
        {
          name: "HMAC",
          hash: "SHA-256"
        },
        false, // Not extractable
        ["sign", "verify"]
      )) as CryptoKey

      this.signingKeys.set(senderId, key)
    }

    return key
  }

  /**
   * Get signing key for sender
   * @param senderId - Sender identifier
   * @returns Signing key or undefined
   */
  private async getSigningKey(
    senderId: string
  ): Promise<CryptoKey | undefined> {
    return this.signingKeys.get(senderId)
  }

  /**
   * Sanitize payload recursively
   * @param payload - Payload to sanitize
   * @returns Sanitized payload
   */
  private sanitizePayload(payload: any): any {
    if (typeof payload === "string") {
      return this.sanitizeString(payload)
    }

    if (Array.isArray(payload)) {
      return payload.map((item) => this.sanitizePayload(item))
    }

    if (payload && typeof payload === "object") {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(payload)) {
        sanitized[this.sanitizeString(key)] = this.sanitizePayload(value)
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
  private sanitizeString(str: string): string {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .replace(/data:text\/html/gi, "")
      .replace(/vbscript:/gi, "")
      .trim()
  }

  /**
   * Convert ArrayBuffer to Base64
   * @param buffer - ArrayBuffer to convert
   * @returns Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes =
      buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert Base64 to ArrayBuffer
   * @param base64 - Base64 string to convert
   * @returns ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

/**
 * Rate limiting for message security
 */
export class MessageRateLimiter {
  private limits: Map<string, { count: number; resetTime: number }> = new Map()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /**
   * Check if sender is within rate limits
   * @param senderId - Sender identifier
   * @returns True if within limits
   */
  checkRateLimit(senderId: string): boolean {
    const now = Date.now()
    const limit = this.limits.get(senderId)

    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      this.limits.set(senderId, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (limit.count >= this.maxRequests) {
      return false
    }

    limit.count++
    return true
  }

  /**
   * Get remaining requests for sender
   * @param senderId - Sender identifier
   * @returns Remaining requests
   */
  getRemainingRequests(senderId: string): number {
    const limit = this.limits.get(senderId)
    if (!limit || Date.now() > limit.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - limit.count)
  }

  /**
   * Reset rate limit for sender
   * @param senderId - Sender identifier
   */
  resetRateLimit(senderId: string): void {
    this.limits.delete(senderId)
  }
}
