// Monitor websites for content changes

import { ExtractedContent, Paragraph } from "../types"

export interface MonitoringOptions {
  urls: string[]
  interval: number // Check interval in ms
  onChange?: (url: string, changes: ContentChange[]) => void
}

export interface ContentChange {
  type: "added" | "removed" | "modified"
  paragraph?: Paragraph
  oldParagraph?: Paragraph
  index: number
}

export class ContentMonitor {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private contentCache: Map<string, ExtractedContent> = new Map()

  async startMonitoring(options: MonitoringOptions): Promise<void> {
    for (const url of options.urls) {
      await this.monitorUrl(url, options)
    }
  }

  private async monitorUrl(
    url: string,
    options: MonitoringOptions
  ): Promise<void> {
    // Initial extraction
    const { contentExtractor } = await import("../content-extractor-service")
    const result = await contentExtractor.extract(url)

    if (result.success) {
      this.contentCache.set(url, result.data)
    }

    // Set up periodic checking
    const interval = setInterval(async () => {
      const newResult = await contentExtractor.extract(url)

      if (newResult.success) {
        const oldContent = this.contentCache.get(url)
        if (oldContent) {
          const changes = this.detectChanges(oldContent, newResult.data)

          if (changes.length > 0 && options.onChange) {
            options.onChange(url, changes)
          }
        }

        this.contentCache.set(url, newResult.data)
      }
    }, options.interval)

    this.intervals.set(url, interval)
  }

  stopMonitoring(url?: string): void {
    if (url) {
      const interval = this.intervals.get(url)
      if (interval) {
        clearInterval(interval)
        this.intervals.delete(url)
      }
    } else {
      // Stop all monitoring
      this.intervals.forEach((interval) => clearInterval(interval))
      this.intervals.clear()
    }
  }

  private detectChanges(
    oldContent: ExtractedContent,
    newContent: ExtractedContent
  ): ContentChange[] {
    const changes: ContentChange[] = []

    // Simple change detection - could be enhanced with diff algorithms
    const oldParagraphs = new Map(oldContent.paragraphs.map((p) => [p.text, p]))
    const newParagraphs = new Map(newContent.paragraphs.map((p) => [p.text, p]))

    // Detect removed paragraphs
    oldContent.paragraphs.forEach((p, index) => {
      if (!newParagraphs.has(p.text)) {
        changes.push({
          type: "removed",
          oldParagraph: p,
          index
        })
      }
    })

    // Detect added paragraphs
    newContent.paragraphs.forEach((p, index) => {
      if (!oldParagraphs.has(p.text)) {
        changes.push({
          type: "added",
          paragraph: p,
          index
        })
      }
    })

    return changes
  }
}
