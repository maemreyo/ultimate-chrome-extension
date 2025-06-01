// Wikipedia adapter

import { Paragraph, SiteAdapter, Table } from "../types"

export class WikipediaAdapter implements SiteAdapter {
  name = "wikipedia"
  patterns = [/wikipedia\.org/, /wikimedia\.org/]
  priority = 10

  extract(doc: Document, url: string) {
    const content = doc.querySelector("#mw-content-text .mw-parser-output")
    if (!content) return {}

    const title = doc.querySelector("#firstHeading")?.textContent?.trim() || ""
    const paragraphs = this.detectParagraphs(doc)
    const tables = this.detectTables(doc)
    const metadata = this.extractMetadata(doc)

    const cleanText = paragraphs.map((p) => p.text).join("\n\n")
    const wordCount = cleanText.split(/\s+/).length

    return {
      title,
      paragraphs,
      tables,
      cleanText,
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      metadata
    }
  }

  detectParagraphs(doc: Document): Paragraph[] {
    const paragraphs: Paragraph[] = []
    const content = doc.querySelector("#mw-content-text .mw-parser-output")
    if (!content) return paragraphs

    const elements = content.querySelectorAll(
      "p, h2, h3, h4, blockquote, .mw-headline"
    )

    elements.forEach((element, index) => {
      // Skip empty paragraphs
      const text = element.textContent?.trim() || ""
      if (text.length < 10) return

      // Skip edit links
      if (element.querySelector(".mw-editsection")) {
        element.querySelector(".mw-editsection")?.remove()
      }

      const tagName = element.tagName.toLowerCase()
      const isHeading =
        element.classList.contains("mw-headline") || /^h[2-6]$/.test(tagName)

      paragraphs.push({
        id: `p-${index}`,
        text: element.textContent?.trim() || "",
        html: element.innerHTML,
        index,
        element: this.getSelector(element),
        bounds: element.getBoundingClientRect(),
        isQuote: tagName === "blockquote",
        isCode: false,
        isHeading,
        headingLevel: isHeading ? this.getHeadingLevel(element) : undefined,
        importance: isHeading ? 0.9 : 0.7
      })
    })

    return paragraphs
  }

  detectTables(doc: Document): Table[] {
    const tables: Table[] = []
    const tableElements = doc.querySelectorAll(".wikitable, .infobox")

    tableElements.forEach((table, index) => {
      const headers: string[] = []
      const rows: string[][] = []

      // Extract headers
      table.querySelectorAll("tr:first-child th").forEach((th) => {
        headers.push(th.textContent?.trim() || "")
      })

      // Extract rows
      table.querySelectorAll("tr").forEach((tr, rowIndex) => {
        if (rowIndex === 0 && headers.length > 0) return // Skip header row

        const row: string[] = []
        tr.querySelectorAll("td, th").forEach((cell) => {
          row.push(cell.textContent?.trim() || "")
        })

        if (row.some((cell) => cell.length > 0)) {
          rows.push(row)
        }
      })

      tables.push({
        id: `table-${index}`,
        headers,
        rows,
        element: this.getSelector(table),
        index
      })
    })

    return tables
  }

  private extractMetadata(doc: Document) {
    const metadata: any = {
      source: "wikipedia.org",
      extractedAt: new Date(),
      tags: []
    }

    // Categories
    const categories = doc.querySelectorAll("#mw-normal-catlinks li a")
    metadata.tags = Array.from(categories).map(
      (cat) => cat.textContent?.trim() || ""
    )

    // Last modified
    const lastModified = doc.querySelector("#footer-info-lastmod")?.textContent
    if (lastModified) {
      const match = lastModified.match(/(\d{1,2} \w+ \d{4})/)
      if (match) {
        metadata.updateDate = new Date(match[1])
      }
    }

    return metadata
  }

  private getHeadingLevel(element: Element): number {
    const tagName = element.tagName
    if (/^H[2-6]$/.test(tagName)) {
      return parseInt(tagName[1])
    }
    // For mw-headline, check parent
    const parent = element.parentElement
    if (parent && /^H[2-6]$/.test(parent.tagName)) {
      return parseInt(parent.tagName[1])
    }
    return 2
  }

  private getSelector(element: Element): string {
    const path: string[] = []
    let current: Element | null = element

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase()
      if (current.id) {
        selector = `#${current.id}`
        path.unshift(selector)
        break
      }
      path.unshift(selector)
      current = current.parentElement
    }

    return path.join(" > ")
  }
}
