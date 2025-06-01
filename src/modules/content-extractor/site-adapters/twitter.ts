// Twitter/X adapter

import { Paragraph, SiteAdapter } from "../types"

export class TwitterAdapter implements SiteAdapter {
  name = "twitter"
  patterns = [/twitter\.com/, /x\.com/]
  priority = 10

  extract(doc: Document, url: string) {
    const tweets = this.extractTweets(doc)
    const title = this.extractTitle(doc, tweets)
    const paragraphs = this.tweetsToParagraphs(tweets)
    const metadata = this.extractMetadata(doc, tweets)

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

  private extractTweets(doc: Document): any[] {
    const tweets: any[] = []

    // Twitter's DOM structure changes frequently, try multiple selectors
    const tweetSelectors = [
      'article[data-testid="tweet"]',
      '[data-testid="tweetText"]',
      ".tweet",
      '[role="article"]'
    ]

    for (const selector of tweetSelectors) {
      const elements = doc.querySelectorAll(selector)
      if (elements.length > 0) {
        elements.forEach((element) => {
          const text = this.extractTweetText(element)
          const author = this.extractTweetAuthor(element)
          const time = this.extractTweetTime(element)

          if (text) {
            tweets.push({ text, author, time, element })
          }
        })
        break
      }
    }

    return tweets
  }

  private extractTweetText(element: Element): string {
    // Try different selectors for tweet text
    const textElement =
      element.querySelector('[data-testid="tweetText"]') ||
      element.querySelector(".tweet-text") ||
      element.querySelector("[lang]")

    return textElement?.textContent?.trim() || ""
  }

  private extractTweetAuthor(element: Element): string {
    const authorElement =
      element.querySelector('[data-testid="User-Names"]') ||
      element.querySelector(".username") ||
      element.querySelector('[href^="/"]')

    return authorElement?.textContent?.trim() || ""
  }

  private extractTweetTime(element: Element): string {
    const timeElement = element.querySelector("time")
    return timeElement?.getAttribute("datetime") || ""
  }

  private tweetsToParagraphs(tweets: any[]): Paragraph[] {
    return tweets.map((tweet, index) => ({
      id: `tweet-${index}`,
      text: tweet.text,
      html: `<p>${tweet.text}</p>`,
      index,
      element: "article",
      bounds: tweet.element?.getBoundingClientRect() || new DOMRect(),
      isQuote: index > 0, // First tweet is main, others are replies
      isCode: false,
      isHeading: false,
      importance: index === 0 ? 0.9 : 0.7,
      metadata: {
        author: tweet.author,
        time: tweet.time
      }
    }))
  }

  private extractTitle(doc: Document, tweets: any[]): string {
    // Use first tweet as title (truncated)
    if (tweets.length > 0) {
      const firstTweet = tweets[0].text
      return firstTweet.length > 100
        ? firstTweet.substring(0, 97) + "..."
        : firstTweet
    }

    return doc.title.split("/")[0].trim()
  }

  private extractMetadata(doc: Document, tweets: any[]) {
    const metadata: any = {
      source: "twitter.com",
      extractedAt: new Date(),
      tags: []
    }

    if (tweets.length > 0) {
      metadata.author = tweets[0].author
      if (tweets[0].time) {
        metadata.publishDate = new Date(tweets[0].time)
      }
    }

    // Extract hashtags
    const hashtags = doc.querySelectorAll('a[href*="/hashtag/"]')
    hashtags.forEach((tag) => {
      const text = tag.textContent?.trim()
      if (text && text.startsWith("#")) {
        metadata.tags.push(text)
      }
    })

    return metadata
  }
}
