import { useState, useCallback } from 'react'
import { scraperService } from '../scraper-service'
import { ScrapeResult, ExtractOptions } from '../types'

export function useScraper() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<ScrapeResult | null>(null)

  const scrapeUrl = useCallback(async (url: string, options?: {
    useCache?: boolean
    template?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const data = await scraperService.scrapeUrl(url, options)
      setResult(data)
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const scrapeCurrentTab = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await scraperService.scrapeCurrentTab()
      setResult(data)
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const extractArticle = useCallback(async (urlOrTabId: string | number) => {
    setLoading(true)
    setError(null)

    try {
      const article = await scraperService.extractArticle(urlOrTabId)
      if (article) {
        setResult({
          url: typeof urlOrTabId === 'string' ? urlOrTabId : '',
          title: article.title,
          content: article.content,
          article,
          extractedAt: new Date()
        })
      }
      return article
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    scrapeUrl,
    scrapeCurrentTab,
    extractArticle,
    result,
    loading,
    error
  }
}