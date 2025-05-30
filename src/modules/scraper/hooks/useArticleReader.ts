import { useState, useEffect } from 'react'
import { Article } from '../types'
import { ArticleReader } from '../article-reader'

export function useArticleReader(autoExtract: boolean = false) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const reader = new ArticleReader()

  useEffect(() => {
    if (autoExtract) {
      extractFromCurrentTab()
    }
  }, [autoExtract])

  const extractFromCurrentTab = async () => {
    setLoading(true)
    setError(null)

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) {
        throw new Error('No active tab')
      }

      const extracted = await reader.extractFromTab(tab.id)
      setArticle(extracted)
      return extracted
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const extractFromUrl = async (url: string) => {
    setLoading(true)
    setError(null)

    try {
      const extracted = await reader.extractFromURL(url)
      setArticle(extracted)
      return extracted
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async (maxLength?: number) => {
    if (!article) return null

    try {
      return await reader.generateSummary(article, maxLength)
    } catch (err) {
      setError(err as Error)
      return null
    }
  }

  const saveAsMarkdown = async () => {
    if (!article) return null

    try {
      const markdown = await reader.saveAsMarkdown(article)

      // Create download
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${article.title.replace(/[^a-z0-9]/gi, '-')}.md`
      a.click()
      URL.revokeObjectURL(url)

      return markdown
    } catch (err) {
      setError(err as Error)
      return null
    }
  }

  return {
    article,
    loading,
    error,
    extractFromCurrentTab,
    extractFromUrl,
    generateSummary,
    saveAsMarkdown
  }
}