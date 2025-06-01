// Reddit adapter

import { Paragraph, SiteAdapter } from "../types"

export class RedditAdapter implements SiteAdapter {
  name = "reddit"
  patterns = [/reddit\.com/, /redd\.it/]
  priority = 10

  extract(doc: Document, url: string) {
    const title = this.extractTitle(doc)
    const paragraphs = this.detectParagraphs(doc)
    const metadata = this.extractMetadata(doc)

    const cleanText = paragraphs.map((p) => p.text).join("\n\n")
    const wordCount = cleanText.split(/\s+/).length

    return {
      title,
      paragraphs,
      cleanText,
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      metadata
    }
  }

  detectParagraphs(doc: Document): Paragraph[] {
    const paragraphs: Paragraph[] = []
    let index = 0

    // Main post content
    const postContent = doc.querySelector('[data-test-id="post-content"]')
    if (postContent) {
      const text = postContent.textContent?.trim() || ""
      if (text.length > 10) {
        paragraphs.push({
          id: `p-${index}`,
          text,
          html: postContent.innerHTML,
          index: index++,
          element: '[data-test-id="post-content"]',
          bounds: postContent.getBoundingClientRect(),
          isQuote: false,
          isCode: false,
          isHeading: false,
          importance: 0.9
        })
      }
    }

    // Comments
    const comments = doc.querySelectorAll('[data-testid="comment"]')
    comments.forEach((comment) => {
      const commentBody = comment.querySelector(".RichTextJSON-root")
      if (commentBody) {
        const text = commentBody.textContent?.trim() || ""
        if (text.length > 10) {
          // Get comment metadata
          const author = comment
            .querySelector('[data-testid="comment_author_link"]')
            ?.textContent?.trim()
          const score = comment.querySelector(".score")?.textContent?.trim()

          paragraphs.push({
            id: `p-${index}`,
            text: author ? `[${author}]: ${text}` : text,
            html: commentBody.innerHTML,
            index: index++,
            element: `[data-testid="comment"]:nth-of-type(${index})`,
            bounds: commentBody.getBoundingClientRect(),
            isQuote: true, // Treat comments as quotes
            isCode: false,
            isHeading: false,
            importance: score ? Math.min(0.8, 0.5 + parseInt(score) / 100) : 0.5
          })
        }
      }
    })

    return paragraphs
  }

  private extractTitle(doc: Document): string {
    return (
      doc.querySelector("h1")?.textContent?.trim() ||
      doc.querySelector('[data-test-id="post-title"]')?.textContent?.trim() ||
      doc.title.split("-")[0].trim()
    )
  }

  private extractMetadata(doc: Document) {
    const metadata: any = {
      source: "reddit.com",
      extractedAt: new Date(),
      tags: []
    }

    // Subreddit
    const subreddit = doc
      .querySelector('[data-testid="subreddit-name"]')
      ?.textContent?.trim()
    if (subreddit) {
      metadata.category = subreddit
      metadata.tags.push(subreddit)
    }

    // Author
    const author = doc
      .querySelector('[data-testid="post_author_link"]')
      ?.textContent?.trim()
    if (author) metadata.author = author

    // Flair/Tags
    doc.querySelectorAll(".flair").forEach((flair) => {
      const text = flair.textContent?.trim()
      if (text) metadata.tags.push(text)
    })

    // Score
    const score = doc
      .querySelector('[data-testid="vote-score"]')
      ?.textContent?.trim()
    if (score) metadata.score = score

    // Time
    const timeElement = doc.querySelector("time")
    if (timeElement) {
      const datetime = timeElement.getAttribute("datetime")
      if (datetime) metadata.publishDate = new Date(datetime)
    }

    return metadata
  }
}
