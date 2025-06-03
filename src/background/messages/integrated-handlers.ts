// Message handlers for all integrated services

import { aiService } from "~core/ai-service"
import { analysisService } from "~core/analysis-service"
import { contentExtractionService } from "~core/content-extraction-service"
import { savedContent } from "~core/storage"
import type { PlasmoMessaging } from "@plasmohq/messaging"

// AI Stats Handler
export const aiStatsHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  try {
    const stats = await aiService.getUsageStats()
    res.send(stats)
  } catch (error) {
    res.send({ error: error.message })
  }
}

// Content Extraction Handler
export const extractContentHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { method = "currentTab", url, options } = req.body || {}

  try {
    let result

    switch (method) {
      case "currentTab":
        result = await contentExtractionService.extractFromCurrentTab(options)
        break
      case "url":
        if (!url) throw new Error("URL required")
        result = await contentExtractionService.extractFromURL(url, options)
        break
      case "withAI":
        if (!url) throw new Error("URL required")
        result = await contentExtractionService.extractWithAI(url)
        break
      default:
        throw new Error(`Unknown method: ${method}`)
    }

    res.send(result)
  } catch (error) {
    res.send({ success: false, error: { message: error.message } })
  }
}

// Content Analysis Handler
export const analyzeContentHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { content, url, options } = req.body || {}

  try {
    let result

    if (url) {
      // Analyze from URL (extract first)
      result = await analysisService.analyzeCurrentTab(options)
    } else if (content) {
      // Analyze provided content
      result = await analysisService.analyzeText(content, options)
    } else {
      throw new Error("Content or URL required")
    }

    res.send(result)
  } catch (error) {
    res.send({ error: error.message })
  }
}

// Save Content Handler
export const saveContentHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { url, title, content, analysis, tags } = req.body || {}

  try {
    const saved = await savedContent.add({
      url,
      title,
      content,
      analysis,
      tags: tags || []
    })

    res.send({ success: true, data: saved })
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

// AI Generate Handler
export const aiGenerateHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { prompt, options, stream = false } = req.body || {}

  try {
    if (stream) {
      // For streaming, we'll need to use a different approach
      // This is a simplified version
      const result = await aiService.generateText(prompt, options)
      res.send({ success: true, data: result })
    } else {
      const result = await aiService.generateText(prompt, options)
      res.send({ success: true, data: result })
    }
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

// AI Summarize Handler
export const aiSummarizeHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { text, options } = req.body || {}

  try {
    const summary = await aiService.summarize(text, options)
    res.send({ success: true, data: summary })
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

// Batch Analysis Handler
export const batchAnalysisHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { contents, options } = req.body || {}

  try {
    const results = await analysisService.analyzeBulk(contents, options)
    res.send({ success: true, data: results })
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

// Search Content Handler
export const searchContentHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { query, filters } = req.body || {}

  try {
    const results = await savedContent.search(query)
    res.send({ success: true, data: results })
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

// Export Analysis Handler
export const exportAnalysisHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { analyses, format = "html" } = req.body || {}

  try {
    const report = await analysisService.exportReport(analyses, format)
    res.send({ success: true, data: report })
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

// Settings Update Handler
export const updateSettingsHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const { settings } = req.body || {}

  try {
    const settingsStore = getSettingsStore()
    await settingsStore.update(settings)

    // Re-initialize services if AI settings changed
    if (settings.ai) {
      await aiService.switchProvider(settings.ai.provider, settings.ai.apiKey)
    }

    res.send({ success: true })
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

// Register all handlers
export const handlers = {
  "ai-stats": aiStatsHandler,
  "extract-content": extractContentHandler,
  "analyze-content": analyzeContentHandler,
  "save-content": saveContentHandler,
  "ai-generate": aiGenerateHandler,
  "ai-summarize": aiSummarizeHandler,
  "batch-analysis": batchAnalysisHandler,
  "search-content": searchContentHandler,
  "export-analysis": exportAnalysisHandler,
  "update-settings": updateSettingsHandler
}

// Export individual handlers for Plasmo messaging
export default handlers
