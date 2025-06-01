// src/modules/messaging/utilities/message-compression-helpers.ts
// Message compression and optimization utilities

import type { Message } from "../types"

/**
 * Compression configuration
 */
export interface CompressionConfig {
  algorithm: "gzip" | "deflate" | "lz4" | "none"
  level: number // 1-9 for compression level
  threshold: number // Minimum size in bytes to compress
  chunkSize?: number // For large message chunking
}

/**
 * Compressed message wrapper
 */
export interface CompressedMessage {
  id: string
  compressed: true
  algorithm: string
  originalSize: number
  compressedSize: number
  chunks?: number
  data: string // Base64 encoded compressed data
}

/**
 * Message chunk for large messages
 */
export interface MessageChunk {
  id: string
  messageId: string
  chunkIndex: number
  totalChunks: number
  data: string
}

/**
 * Message compression utility class
 */
export class MessageCompressor {
  private config: CompressionConfig

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      algorithm: "gzip",
      level: 6,
      threshold: 1024, // 1KB
      chunkSize: 64 * 1024, // 64KB
      ...config
    }
  }

  /**
   * Compress a message if it exceeds threshold
   * @param message - Message to compress
   * @returns Compressed message or original if below threshold
   */
  async compressMessage(
    message: Message
  ): Promise<Message | CompressedMessage> {
    const serialized = JSON.stringify(message)
    const originalSize = new Blob([serialized]).size

    // Don't compress if below threshold
    if (originalSize < this.config.threshold) {
      return message
    }

    try {
      const compressed = await this.compress(serialized)
      const compressedSize = compressed.length

      // Only use compression if it actually reduces size
      if (compressedSize < originalSize * 0.9) {
        return {
          id: message.id,
          compressed: true,
          algorithm: this.config.algorithm,
          originalSize,
          compressedSize,
          data: compressed
        }
      }
    } catch (error) {
      console.warn("Compression failed:", error)
    }

    return message
  }

  /**
   * Decompress a compressed message
   * @param compressedMessage - Compressed message to decompress
   * @returns Original message
   */
  async decompressMessage(
    compressedMessage: CompressedMessage
  ): Promise<Message> {
    try {
      const decompressed = await this.decompress(
        compressedMessage.data,
        compressedMessage.algorithm
      )
      return JSON.parse(decompressed)
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`)
    }
  }

  /**
   * Split large message into chunks
   * @param message - Message to chunk
   * @returns Array of message chunks
   */
  chunkMessage(message: Message): MessageChunk[] {
    const serialized = JSON.stringify(message)
    const chunkSize = this.config.chunkSize!
    const chunks: MessageChunk[] = []
    const totalChunks = Math.ceil(serialized.length / chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, serialized.length)
      const chunkData = serialized.slice(start, end)

      chunks.push({
        id: `${message.id}_chunk_${i}`,
        messageId: message.id,
        chunkIndex: i,
        totalChunks,
        data: btoa(chunkData) // Base64 encode
      })
    }

    return chunks
  }

  /**
   * Reassemble message from chunks
   * @param chunks - Array of message chunks
   * @returns Reassembled message
   */
  reassembleMessage(chunks: MessageChunk[]): Message {
    // Sort chunks by index
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)

    // Validate chunks
    const messageId = chunks[0]?.messageId
    if (!messageId || chunks.some((chunk) => chunk.messageId !== messageId)) {
      throw new Error("Invalid or mismatched chunks")
    }

    const totalChunks = chunks[0].totalChunks
    if (chunks.length !== totalChunks) {
      throw new Error(
        `Missing chunks: expected ${totalChunks}, got ${chunks.length}`
      )
    }

    // Reassemble data
    const reassembled = chunks
      .map((chunk) => atob(chunk.data)) // Base64 decode
      .join("")

    return JSON.parse(reassembled)
  }

  /**
   * Compress string data
   * @param data - Data to compress
   * @returns Compressed data as base64 string
   */
  private async compress(data: string): Promise<string> {
    switch (this.config.algorithm) {
      case "gzip":
        return this.compressGzip(data)
      case "deflate":
        return this.compressDeflate(data)
      case "lz4":
        return this.compressLZ4(data)
      default:
        return btoa(data) // Just base64 encode
    }
  }

  /**
   * Decompress string data
   * @param data - Compressed data as base64 string
   * @param algorithm - Compression algorithm used
   * @returns Decompressed data
   */
  private async decompress(data: string, algorithm: string): Promise<string> {
    switch (algorithm) {
      case "gzip":
        return this.decompressGzip(data)
      case "deflate":
        return this.decompressDeflate(data)
      case "lz4":
        return this.decompressLZ4(data)
      default:
        return atob(data) // Just base64 decode
    }
  }

  /**
   * Compress using gzip (browser implementation)
   * @param data - Data to compress
   * @returns Compressed data
   */
  private async compressGzip(data: string): Promise<string> {
    if (typeof CompressionStream !== "undefined") {
      const stream = new CompressionStream("gzip")
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()

      writer.write(new TextEncoder().encode(data))
      writer.close()

      const chunks: Uint8Array[] = []
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) chunks.push(value)
      }

      const compressed = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      )
      let offset = 0
      for (const chunk of chunks) {
        compressed.set(chunk, offset)
        offset += chunk.length
      }

      return btoa(String.fromCharCode(...compressed))
    } else {
      // Fallback: simple LZ-like compression
      return this.simpleLZCompress(data)
    }
  }

  /**
   * Decompress gzip data
   * @param data - Compressed data
   * @returns Decompressed data
   */
  private async decompressGzip(data: string): Promise<string> {
    if (typeof DecompressionStream !== "undefined") {
      const compressed = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
      const stream = new DecompressionStream("gzip")
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()

      writer.write(compressed)
      writer.close()

      const chunks: Uint8Array[] = []
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) chunks.push(value)
      }

      const decompressed = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      )
      let offset = 0
      for (const chunk of chunks) {
        decompressed.set(chunk, offset)
        offset += chunk.length
      }

      return new TextDecoder().decode(decompressed)
    } else {
      // Fallback: simple LZ-like decompression
      return this.simpleLZDecompress(data)
    }
  }

  /**
   * Compress using deflate
   * @param data - Data to compress
   * @returns Compressed data
   */
  private async compressDeflate(data: string): Promise<string> {
    // Similar to gzip but with deflate algorithm
    return this.compressGzip(data) // Simplified for now
  }

  /**
   * Decompress deflate data
   * @param data - Compressed data
   * @returns Decompressed data
   */
  private async decompressDeflate(data: string): Promise<string> {
    return this.decompressGzip(data) // Simplified for now
  }

  /**
   * Simple LZ-like compression (fallback)
   * @param data - Data to compress
   * @returns Compressed data
   */
  private simpleLZCompress(data: string): string {
    const dict: Record<string, number> = {}
    let dictSize = 256
    let result: number[] = []
    let w = ""

    for (let i = 0; i < 256; i++) {
      dict[String.fromCharCode(i)] = i
    }

    for (const c of data) {
      const wc = w + c
      if (dict[wc]) {
        w = wc
      } else {
        result.push(dict[w])
        dict[wc] = dictSize++
        w = c
      }
    }

    if (w) {
      result.push(dict[w])
    }

    return btoa(String.fromCharCode(...result))
  }

  /**
   * Simple LZ-like decompression (fallback)
   * @param data - Compressed data
   * @returns Decompressed data
   */
  private simpleLZDecompress(data: string): string {
    const dict: string[] = []
    let dictSize = 256
    let result = ""
    let w: string

    for (let i = 0; i < 256; i++) {
      dict[i] = String.fromCharCode(i)
    }

    const compressed = Array.from(atob(data), (c) => c.charCodeAt(0))
    w = String.fromCharCode(compressed[0])
    result = w

    for (let i = 1; i < compressed.length; i++) {
      const k = compressed[i]
      let entry: string

      if (dict[k]) {
        entry = dict[k]
      } else if (k === dictSize) {
        entry = w + w.charAt(0)
      } else {
        throw new Error("Invalid compressed data")
      }

      result += entry
      dict[dictSize++] = w + entry.charAt(0)
      w = entry
    }

    return result
  }

  /**
   * LZ4 compression (simplified implementation)
   * @param data - Data to compress
   * @returns Compressed data
   */
  private async compressLZ4(data: string): Promise<string> {
    // Simplified LZ4-like compression
    return this.simpleLZCompress(data)
  }

  /**
   * LZ4 decompression (simplified implementation)
   * @param data - Compressed data
   * @returns Decompressed data
   */
  private async decompressLZ4(data: string): Promise<string> {
    return this.simpleLZDecompress(data)
  }

  /**
   * Get compression statistics
   * @param original - Original message
   * @param compressed - Compressed message
   * @returns Compression statistics
   */
  getCompressionStats(
    original: Message,
    compressed: CompressedMessage
  ): {
    originalSize: number
    compressedSize: number
    compressionRatio: number
    spaceSaved: number
    spaceSavedPercent: number
  } {
    const originalSize = compressed.originalSize
    const compressedSize = compressed.compressedSize
    const spaceSaved = originalSize - compressedSize
    const spaceSavedPercent = (spaceSaved / originalSize) * 100
    const compressionRatio = originalSize / compressedSize

    return {
      originalSize,
      compressedSize,
      compressionRatio,
      spaceSaved,
      spaceSavedPercent
    }
  }
}

/**
 * Message optimization utilities
 */
export class MessageOptimizer {
  /**
   * Optimize message payload by removing unnecessary data
   * @param message - Message to optimize
   * @returns Optimized message
   */
  optimizeMessage(message: Message): Message {
    const optimized = { ...message }

    // Remove empty or undefined fields
    optimized.payload = this.removeEmptyFields(optimized.payload)

    // Optimize metadata
    optimized.metadata = this.optimizeMetadata(optimized.metadata)

    return optimized
  }

  /**
   * Remove empty fields from object
   * @param obj - Object to clean
   * @returns Cleaned object
   */
  private removeEmptyFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj
        .map((item) => this.removeEmptyFields(item))
        .filter((item) => item !== undefined)
    }

    if (typeof obj === "object") {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.removeEmptyFields(value)
        if (
          cleanedValue !== undefined &&
          cleanedValue !== null &&
          cleanedValue !== ""
        ) {
          cleaned[key] = cleanedValue
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : undefined
    }

    return obj
  }

  /**
   * Optimize message metadata
   * @param metadata - Metadata to optimize
   * @returns Optimized metadata
   */
  private optimizeMetadata(metadata: any): any {
    const optimized = { ...metadata }

    // Remove default values
    if (optimized.priority === 1) {
      // Normal priority is default
      delete optimized.priority
    }

    if (optimized.retryCount === 0) {
      delete optimized.retryCount
    }

    if (optimized.encrypted === false) {
      delete optimized.encrypted
    }

    // Clean headers
    if (optimized.headers && Object.keys(optimized.headers).length === 0) {
      delete optimized.headers
    }

    return optimized
  }
}
