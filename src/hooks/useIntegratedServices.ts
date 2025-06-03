// React hooks for all integrated services

import { useCallback, useState } from "react"
import { useAI } from "@matthew.ngo/ai-toolkit/react"
import type {
  AnalysisOptions,
  AnalysisResult
} from "@matthew.ngo/analysis-toolkit"
import {
  useHistory,
  useSession,
  useSettings
} from "@matthew.ngo/chrome-storage"
import type {
  ExtractedContent,
  ExtractionOptions
} from "@matthew.ngo/content-extractor"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sendToBackground } from "@plasmohq/messaging"

// Hook for content extraction
export function useContentExtraction() {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractFromCurrentTab = useCallback(
    async (options?: ExtractionOptions) => {
      setIsExtracting(true)
      setError(null)

      try {
        const response = await sendToBackground({
          name: "extract-content",
          body: { method: "currentTab", options }
        })

        if (!response.success) {
          throw new Error(response.error?.message || "Extraction failed")
        }

        return response.data as ExtractedContent
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setIsExtracting(false)
      }
    },
    []
  )

  const extractFromURL = useCallback(
    async (url: string, options?: ExtractionOptions) => {
      setIsExtracting(true)
      setError(null)

      try {
        const response = await sendToBackground({
          name: "extract-content",
          body: { method: "url", url, options }
        })

        if (!response.success) {
          throw new Error(response.error?.message || "Extraction failed")
        }

        return response.data as ExtractedContent
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setIsExtracting(false)
      }
    },
    []
  )

  return {
    extractFromCurrentTab,
    extractFromURL,
    isExtracting,
    error
  }
}

// Hook for content analysis
export function useContentAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeText = useCallback(
    async (text: string, options?: AnalysisOptions) => {
      setIsAnalyzing(true)
      setError(null)

      try {
        const response = await sendToBackground({
          name: "analyze-content",
          body: { content: text, options }
        })

        if (response.error) {
          throw new Error(response.error)
        }

        return response as AnalysisResult
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setIsAnalyzing(false)
      }
    },
    []
  )

  const analyzeCurrentTab = useCallback(async (options?: AnalysisOptions) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await sendToBackground({
        name: "analyze-content",
        body: { url: "current", options }
      })

      if (response.error) {
        throw new Error(response.error)
      }

      return response as AnalysisResult
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return {
    analyzeText,
    analyzeCurrentTab,
    isAnalyzing,
    error
  }
}

// Hook for saved content
export function useSavedContent() {
  const queryClient = useQueryClient()

  const { data: savedItems, isLoading } = useQuery({
    queryKey: ["saved-content"],
    queryFn: async () => {
      const response = await sendToBackground({
        name: "get-saved-content"
      })
      return response.data || []
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (params: {
      url: string
      title: string
      content: any
      analysis?: any
      tags?: string[]
    }) => {
      const response = await sendToBackground({
        name: "save-content",
        body: params
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-content"] })
    }
  })

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await sendToBackground({
        name: "search-content",
        body: { query }
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      return response.data
    }
  })

  return {
    savedItems,
    isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    search: searchMutation.mutate,
    searchResults: searchMutation.data,
    isSearching: searchMutation.isPending
  }
}

// Hook for AI features
export function useAIFeatures() {
  const { settings } = useSettings()
  const aiSettings = settings?.ai

  // Use the AI toolkit hook
  const {
    generateText,
    generateStream,
    summarize,
    analyzeSentiment,
    loading,
    error
  } = useAI({
    config: {
      provider: aiSettings?.provider || "openai",
      apiKey: aiSettings?.apiKey
    }
  })

  const extractKeyPoints = useCallback(async (text: string) => {
    const response = await sendToBackground({
      name: "ai-extract-key-points",
      body: { text }
    })

    if (!response.success) {
      throw new Error(response.error)
    }

    return response.data
  }, [])

  const improveWriting = useCallback(
    async (text: string) => {
      return generateText(
        `Improve the following text for clarity and professionalism:\n\n${text}`,
        { temperature: 0.7 }
      )
    },
    [generateText]
  )

  return {
    generateText,
    generateStream,
    summarize,
    analyzeSentiment,
    extractKeyPoints,
    improveWriting,
    loading,
    error,
    isConfigured: !!aiSettings?.apiKey
  }
}

// Hook for AI usage stats
export function useAIStats() {
  const {
    data: stats,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["ai-stats"],
    queryFn: async () => {
      const response = await sendToBackground({
        name: "ai-stats"
      })
      return response
    },
    refetchInterval: 60000 // Refresh every minute
  })

  const resetStats = useCallback(async () => {
    await sendToBackground({
      name: "reset-ai-stats"
    })
    refetch()
  }, [refetch])

  return {
    stats,
    isLoading,
    resetStats,
    refetch
  }
}

// Combined hook for all features
export function useExtensionFeatures() {
  const contentExtraction = useContentExtraction()
  const contentAnalysis = useContentAnalysis()
  const savedContent = useSavedContent()
  const aiFeatures = useAIFeatures()
  const aiStats = useAIStats()
  const { session } = useSession()
  const { items: historyItems } = useHistory({ limit: 10 })
  const { settings, update: updateSettings } = useSettings()

  return {
    // Content extraction
    extraction: contentExtraction,

    // Content analysis
    analysis: contentAnalysis,

    // Saved content
    saved: savedContent,

    // AI features
    ai: aiFeatures,
    aiStats,

    // Session and settings
    session,
    history: historyItems,
    settings,
    updateSettings,

    // Combined actions
    extractAndAnalyze: useCallback(
      async (options?: ExtractionOptions & AnalysisOptions) => {
        const extracted = await contentExtraction.extractFromCurrentTab(options)
        const analyzed = await contentAnalysis.analyzeText(
          extracted.cleanText,
          options
        )

        return {
          extraction: extracted,
          analysis: analyzed
        }
      },
      [contentExtraction, contentAnalysis]
    ),

    extractAnalyzeAndSave: useCallback(
      async (tags?: string[]) => {
        const extracted = await contentExtraction.extractFromCurrentTab()
        const analyzed = await contentAnalysis.analyzeText(extracted.cleanText)

        await savedContent.save({
          url: extracted.metadata.source,
          title: extracted.title,
          content: extracted,
          analysis: analyzed,
          tags
        })

        return {
          extraction: extracted,
          analysis: analyzed
        }
      },
      [contentExtraction, contentAnalysis, savedContent]
    )
  }
}
