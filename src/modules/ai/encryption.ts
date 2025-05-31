// Encryption implementation for sensitive AI data

import type { EncryptionConfig } from "./types"

export class AIEncryption {
  private config: EncryptionConfig = {
    enabled: true,
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2'
  }
  private key: CryptoKey | null = null

  async configure(config: EncryptionConfig) {
    this.config = config
    if (config.enabled) {
      await this.initializeKey()
    }
  }

  private async initializeKey() {
    // Get or generate a master key
    const masterKey = await this.getMasterKey()

    // Derive encryption key
    this.key = await this.deriveKey(masterKey)
  }

  private async getMasterKey(): Promise<CryptoKey> {
    // In a browser extension, we can use the extension's ID as part of the key
    // For additional security, you might want to combine this with user input
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('ai-module-master-key-v1'), // This should be more secure in production
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return keyMaterial
  }

  private async deriveKey(masterKey: CryptoKey): Promise<CryptoKey> {
    const salt = new TextEncoder().encode('ai-module-salt-v1')

    if (this.config.keyDerivation === 'pbkdf2') {
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        masterKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
    } else {
      // For argon2, you'd need a library as it's not in Web Crypto API
      throw new Error('Argon2 not implemented. Use PBKDF2.')
    }
  }

  async encrypt(data: any): Promise<string> {
    if (!this.config.enabled || !this.key) {
      return JSON.stringify(data)
    }

    try {
      const plaintext = JSON.stringify(data)
      const plaintextBuffer = new TextEncoder().encode(plaintext)

      // Generate a random IV for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(12))

      // Encrypt the data
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.key,
        plaintextBuffer
      )

      // Combine IV and ciphertext
      const combined = new Uint8Array(iv.length + ciphertext.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(ciphertext), iv.length)

      // Return base64 encoded
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  async decrypt(encryptedData: string): Promise<any> {
    if (!this.config.enabled || !this.key) {
      return JSON.parse(encryptedData)
    }

    try {
      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

      // Extract IV and ciphertext
      const iv = combined.slice(0, 12)
      const ciphertext = combined.slice(12)

      // Decrypt
      const plaintextBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.key,
        ciphertext
      )

      // Convert back to string and parse JSON
      const plaintext = new TextDecoder().decode(plaintextBuffer)
      return JSON.parse(plaintext)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  async encryptApiKey(apiKey: string): Promise<string> {
    if (!this.config.enabled) {
      return apiKey
    }

    // Add additional obfuscation for API keys
    const obfuscated = this.obfuscateApiKey(apiKey)
    return this.encrypt(obfuscated)
  }

  async decryptApiKey(encryptedKey: string): Promise<string> {
    if (!this.config.enabled) {
      return encryptedKey
    }

    const obfuscated = await this.decrypt(encryptedKey)
    return this.deobfuscateApiKey(obfuscated)
  }

  private obfuscateApiKey(apiKey: string): string {
    // Simple obfuscation - reverse and add noise
    const reversed = apiKey.split('').reverse().join('')
    const noise = crypto.getRandomValues(new Uint8Array(8))
    const noiseStr = Array.from(noise).map(b => b.toString(16).padStart(2, '0')).join('')
    return `${noiseStr}:${reversed}`
  }

  private deobfuscateApiKey(obfuscated: string): string {
    const [_, reversed] = obfuscated.split(':')
    return reversed.split('').reverse().join('')
  }

  async secureErase(data: any) {
    // Attempt to overwrite sensitive data in memory
    if (typeof data === 'string') {
      const buffer = new TextEncoder().encode(data)
      crypto.getRandomValues(buffer)
    } else if (data instanceof Uint8Array) {
      crypto.getRandomValues(data)
    }
  }

  // Hash function for non-reversible data
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Generate a secure random token
  generateToken(length: number = 32): string {
    const buffer = crypto.getRandomValues(new Uint8Array(length))
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}