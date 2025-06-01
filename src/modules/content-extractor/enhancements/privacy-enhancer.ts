// Privacy-focused content extraction

import { ExtractedContent } from "../types"

export interface PrivacyOptions {
  removeTracking?: boolean
  anonymizeLinks?: boolean
  stripMetadata?: boolean
  proxyImages?: boolean
}

export class PrivacyEnhancer {
  async enhancePrivacy(
    content: ExtractedContent,
    options: PrivacyOptions = {}
  ): Promise<ExtractedContent> {
    if (options.removeTracking) {
      content = this.removeTrackingElements(content)
    }

    if (options.anonymizeLinks) {
      content = this.anonymizeLinks(content)
    }

    if (options.stripMetadata) {
      content = this.stripSensitiveMetadata(content)
    }

    if (options.proxyImages) {
      content = await this.proxyImages(content)
    }

    return content
  }

  private removeTrackingElements(content: ExtractedContent): ExtractedContent {
    // Remove tracking pixels, analytics scripts, etc.
    content.paragraphs = content.paragraphs.map((p) => ({
      ...p,
      html: p.html.replace(/<img[^>]*src="[^"]*pixel[^"]*"[^>]*>/gi, "")
    }))

    return content
  }

  private anonymizeLinks(content: ExtractedContent): ExtractedContent {
    // Strip tracking parameters from URLs
    const trackingParams = ["utm_", "fbclid", "gclid", "ref", "source"]

    content.paragraphs = content.paragraphs.map((p) => ({
      ...p,
      html: p.html.replace(/href="([^"]+)"/g, (match, url) => {
        try {
          const urlObj = new URL(url)
          trackingParams.forEach((param) => {
            Array.from(urlObj.searchParams.keys())
              .filter((key) => key.startsWith(param))
              .forEach((key) => urlObj.searchParams.delete(key))
          })
          return `href="${urlObj.toString()}"`
        } catch {
          return match
        }
      })
    }))

    return content
  }

  private stripSensitiveMetadata(content: ExtractedContent): ExtractedContent {
    // Remove potentially sensitive metadata
    const cleaned = { ...content }
    cleaned.metadata = {
      ...cleaned.metadata,
      extractedAt: new Date(),
      source: new URL(cleaned.metadata.source).hostname,
      tags: cleaned.metadata.tags
    }

    return cleaned
  }

  private async proxyImages(
    content: ExtractedContent
  ): Promise<ExtractedContent> {
    // Replace image URLs with proxied versions
    // This would integrate with a proxy service
    return content
  }
}
