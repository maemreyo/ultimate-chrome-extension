// Enhanced accessibility features

import { ExtractedContent, Paragraph } from "../types"

export class AccessibilityEnhancer {
  enhanceContent(content: ExtractedContent): ExtractedContent {
    // Add ARIA labels and roles
    content.paragraphs = content.paragraphs.map((p) => ({
      ...p,
      html: this.addAriaLabels(p.html, p)
    }))

    return content
  }

  private addAriaLabels(html: string, paragraph: Paragraph): string {
    const doc = new DOMParser().parseFromString(html, "text/html")
    const element = doc.body.firstElementChild

    if (element) {
      if (paragraph.isHeading) {
        element.setAttribute("role", "heading")
        element.setAttribute("aria-level", String(paragraph.headingLevel || 2))
      } else if (paragraph.isQuote) {
        element.setAttribute("role", "blockquote")
      }
    }

    return doc.body.innerHTML
  }

  generateAudioDescription(content: ExtractedContent): string {
    // Generate text suitable for screen readers
    let description = `Article: ${content.title}. `

    if (content.metadata.author) {
      description += `By ${content.metadata.author}. `
    }

    description += `${content.wordCount} words, approximately ${content.readingTime} minutes to read. `

    return description
  }
}
