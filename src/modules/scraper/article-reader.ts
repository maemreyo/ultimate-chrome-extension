import { ContentExtractor } from './content-extractor'
import { Article, ExtractOptions } from './types'

export class ArticleReader {
  async extractFromTab(tabId: number): Promise<Article | null> {
    // Get page content
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        html: document.documentElement.outerHTML,
        url: window.location.href
      })
    })

    if (!results[0]?.result) {
      throw new Error('Failed to get page content')
    }

    const { html, url } = results[0].result as any
    return this.extractFromHTML(html, url)
  }

  async extractFromURL(url: string): Promise<Article | null> {
    const response = await fetch(url)
    const html = await response.text()
    return this.extractFromHTML(html, url)
  }

  extractFromHTML(html: string, url: string, options?: ExtractOptions): Article | null {
    const extractor = new ContentExtractor(html, url, options)
    const result = extractor.extract()
    return result.article
  }

  async generateSummary(article: Article, maxLength: number = 200): Promise<string> {
    const sentences = article.textContent
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20)

    if (sentences.length === 0) {
      return article.excerpt || ''
    }

    // Simple extractive summarization
    // In production, you might want to use AI for better summaries
    const wordCounts: Map<string, number> = new Map()
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'is', 'was', 'are', 'were'])

    // Count word frequencies
    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (!stopWords.has(word) && word.length > 3) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
        }
      })
    })

    // Score sentences
    const sentenceScores = sentences.map(sentence => {
      const words = sentence.toLowerCase().split(/\s+/)
      const score = words.reduce((sum, word) => {
        return sum + (wordCounts.get(word) || 0)
      }, 0) / words.length

      return { sentence, score }
    })

    // Sort by score and take top sentences
    sentenceScores.sort((a, b) => b.score - a.score)

    let summary = ''
    let currentLength = 0

    for (const { sentence } of sentenceScores) {
      if (currentLength + sentence.length > maxLength && summary.length > 0) {
        break
      }
      summary += sentence + '. '
      currentLength += sentence.length
    }

    return summary.trim()
  }

  async saveAsMarkdown(article: Article): Promise<string> {
    let markdown = `# ${article.title}\n\n`

    if (article.author) {
      markdown += `*By ${article.author}*\n\n`
    }

    if (article.publishedDate) {
      markdown += `*Published: ${article.publishedDate.toLocaleDateString()}*\n\n`
    }

    if (article.excerpt) {
      markdown += `> ${article.excerpt}\n\n`
    }

    markdown += `---\n\n`

    // Convert HTML to Markdown (simplified)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = article.content

    const convertToMarkdown = (element: Element): string => {
      let md = ''

      element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          md += node.textContent
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element
          const tagName = el.tagName.toLowerCase()

          switch (tagName) {
            case 'p':
              md += `\n\n${convertToMarkdown(el)}\n\n`
              break
            case 'h1':
              md += `\n\n# ${el.textContent}\n\n`
              break
            case 'h2':
              md += `\n\n## ${el.textContent}\n\n`
              break
            case 'h3':
              md += `\n\n### ${el.textContent}\n\n`
              break
            case 'h4':
              md += `\n\n#### ${el.textContent}\n\n`
              break
            case 'strong':
            case 'b':
              md += `**${el.textContent}**`
              break
            case 'em':
            case 'i':
              md += `*${el.textContent}*`
              break
            case 'a':
              const href = el.getAttribute('href')
              md += `[${el.textContent}](${href})`
              break
            case 'img':
              const src = el.getAttribute('src')
              const alt = el.getAttribute('alt') || 'Image'
              md += `![${alt}](${src})`
              break
            case 'ul':
            case 'ol':
              md += '\n\n'
              el.querySelectorAll('li').forEach((li, index) => {
                const prefix = tagName === 'ol' ? `${index + 1}.` : '-'
                md += `${prefix} ${li.textContent}\n`
              })
              md += '\n'
              break
            case 'blockquote':
              md += `\n\n> ${el.textContent}\n\n`
              break
            case 'code':
              md += `\`${el.textContent}\``
              break
            case 'pre':
              md += `\n\n\`\`\`\n${el.textContent}\n\`\`\`\n\n`
              break
            default:
              md += convertToMarkdown(el)
          }
        }
      })

      return md
    }

    markdown += convertToMarkdown(tempDiv)

    // Add metadata
    markdown += `\n\n---\n\n`
    markdown += `*Read time: ${article.estimatedReadTime} minutes*\n`
    markdown += `*Word count: ${article.wordCount}*\n`

    if (article.siteName) {
      markdown += `*Source: ${article.siteName}*\n`
    }

    return markdown
  }
}
