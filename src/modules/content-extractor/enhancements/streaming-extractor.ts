// Progressive content extraction for large documents

import { ExtractedContent, ExtractionOptions, Paragraph } from "../types"

export interface StreamingOptions extends ExtractionOptions {
  chunkSize?: number // Number of paragraphs per chunk
  onChunk?: (chunk: Partial<ExtractedContent>) => void
  maxMemory?: number // Max memory usage in MB
}

export class StreamingExtractor {
  private abortController?: AbortController

  async *extractStream(
    url: string,
    options: StreamingOptions = {}
  ): AsyncGenerator<Partial<ExtractedContent>, ExtractedContent> {
    this.abortController = new AbortController()
    const chunkSize = options.chunkSize || 10

    try {
      const response = await fetch(url, {
        signal: this.abortController.signal
      })

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let paragraphs: Paragraph[] = []
      let index = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process buffer when it gets large enough
        if (buffer.length > 50000) {
          // ~50KB chunks
          const { extracted, remaining } = this.processBuffer(buffer, index)
          buffer = remaining

          paragraphs.push(...extracted)
          index += extracted.length

          if (paragraphs.length >= chunkSize) {
            const chunk = {
              paragraphs: paragraphs.slice(0, chunkSize),
              wordCount: this.countWords(paragraphs.slice(0, chunkSize))
            }

            if (options.onChunk) {
              options.onChunk(chunk)
            }

            yield chunk
            paragraphs = paragraphs.slice(chunkSize)
          }
        }
      }

      // Process remaining buffer
      const { extracted } = this.processBuffer(buffer, index)
      paragraphs.push(...extracted)

      // Yield remaining paragraphs
      if (paragraphs.length > 0) {
        yield {
          paragraphs,
          wordCount: this.countWords(paragraphs)
        }
      }

      // Return complete content
      return this.finalizeContent(url)
    } finally {
      this.abortController = undefined
    }
  }

  abort(): void {
    this.abortController?.abort()
  }

  private processBuffer(
    buffer: string,
    startIndex: number
  ): { extracted: Paragraph[]; remaining: string } {
    // Simple paragraph detection for streaming
    const paragraphs: Paragraph[] = []
    const lines = buffer.split("\n")
    const remaining = lines.pop() || "" // Keep incomplete line

    lines.forEach((line, i) => {
      const text = line.trim()
      if (text.length > 20) {
        paragraphs.push({
          id: `p-${startIndex + i}`,
          text,
          html: `<p>${text}</p>`,
          index: startIndex + i,
          element: "p",
          bounds: new DOMRect(),
          isQuote: false,
          isCode: false,
          isHeading: false,
          importance: 0.7
        })
      }
    })

    return { extracted: paragraphs, remaining }
  }

  private countWords(paragraphs: Paragraph[]): number {
    return paragraphs.reduce((sum, p) => {
      return sum + p.text.split(/\s+/).length
    }, 0)
  }

  private async finalizeContent(url: string): Promise<ExtractedContent> {
    // This would integrate with the main extractor for final processing
    throw new Error("Not implemented - integrate with main extractor")
  }
}
