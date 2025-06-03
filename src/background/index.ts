// src/background/index.ts
// Updated background script with all integrated services

import "@plasmohq/messaging/background"
import { aiService, initializeAI } from "~core/ai-service"
import { setupAlarms } from "~core/alarms"
import { analysisService, initializeAnalysis } from "~core/analysis-service"
import { contentExtractionService } from "~core/content-extraction-service"
import { setupNotifications } from "~core/notifications"
import {
  getHistoryManager,
  getSessionManager,
  getSettingsStore,
  getStorage,
  initializeStorage
} from "~core/storage"
import { supabase } from "~core/supabase"
import { startHub } from "@plasmohq/messaging/pub-sub"

// Check if chrome is available
if (
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.getManifest
) {
  console.log("🚀 Ultimate AI Chrome Extension - Background service started")

  // Initialize services on startup
  initializeServices()

  // Start messaging hub
  startHub()

  // Initialize Supabase auth listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state changed:", event, session?.user?.email)

    if (chrome.action) {
      if (event === "SIGNED_IN") {
        chrome.action.setBadgeText({ text: "" })

        // Initialize AI services when user signs in
        await initializeAI()
        await initializeAnalysis()

        // Start session
        const sessionManager = getSessionManager()
        await sessionManager.startSession(session.user.id, {
          source: "auth",
          email: session.user.email
        })
      } else if (event === "SIGNED_OUT") {
        chrome.action.setBadgeText({ text: "!" })
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" })

        // End session
        const sessionManager = getSessionManager()
        await sessionManager.endSession("logout")
      }
    }
  })

  // Handle extension installation
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      // Initialize storage with default settings
      const settings = getSettingsStore()
      await settings.update({
        appearance: { theme: "system", fontSize: "medium" },
        ai: {
          provider: "openai",
          model: "gpt-3.5-turbo"
        },
        contentExtraction: {
          autoExtract: false,
          preserveFormatting: true,
          includeImages: true
        },
        analysis: {
          autoAnalyze: false,
          depth: "standard",
          includeRecommendations: true
        },
        notifications: { enabled: true },
        privacy: {
          collectAnalytics: true,
          shareData: false
        }
      })

      // Track installation
      const historyManager = getHistoryManager()
      await historyManager.addItem({
        type: "system",
        title: "Extension Installed",
        description: `Version ${chrome.runtime.getManifest().version}`,
        metadata: {
          version: chrome.runtime.getManifest().version,
          timestamp: new Date().toISOString()
        }
      })

      // Open welcome page
      chrome.tabs.create({
        url: chrome.runtime.getURL("tabs/welcome.html")
      })
    } else if (details.reason === "update") {
      // Handle updates
      const historyManager = getHistoryManager()
      await historyManager.addItem({
        type: "system",
        title: "Extension Updated",
        description: `Updated to version ${chrome.runtime.getManifest().version}`,
        metadata: {
          previousVersion: details.previousVersion,
          currentVersion: chrome.runtime.getManifest().version
        }
      })
    }
  })

  // Handle side panel
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error))
  }

  // Set up enhanced context menus
  setupEnhancedContextMenus()
}

// Initialize all services
async function initializeServices() {
  try {
    // Initialize storage first
    await initializeStorage()
    console.log("✅ Storage initialized")

    // Setup core services
    setupAlarms()
    setupNotifications()
    console.log("✅ Core services initialized")

    // Initialize AI and analysis if user is authenticated
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (session) {
      await initializeAI()
      await initializeAnalysis()
      console.log("✅ AI services initialized")
    }
  } catch (error) {
    console.error("Failed to initialize services:", error)
  }
}

// Enhanced context menus with AI features
function setupEnhancedContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // Main menu
    chrome.contextMenus.create({
      id: "ai-assistant",
      title: "AI Assistant",
      contexts: ["all"]
    })

    // Content extraction
    chrome.contextMenus.create({
      id: "extract-content",
      parentId: "ai-assistant",
      title: "Extract & Save Content",
      contexts: ["page"]
    })

    // Text analysis
    chrome.contextMenus.create({
      id: "analyze-selection",
      parentId: "ai-assistant",
      title: "Analyze Selected Text",
      contexts: ["selection"]
    })

    // AI tools submenu
    chrome.contextMenus.create({
      id: "separator-1",
      parentId: "ai-assistant",
      type: "separator",
      contexts: ["all"]
    })

    chrome.contextMenus.create({
      id: "summarize",
      parentId: "ai-assistant",
      title: "Summarize",
      contexts: ["selection", "page"]
    })

    chrome.contextMenus.create({
      id: "extract-key-points",
      parentId: "ai-assistant",
      title: "Extract Key Points",
      contexts: ["selection", "page"]
    })

    chrome.contextMenus.create({
      id: "check-sentiment",
      parentId: "ai-assistant",
      title: "Check Sentiment",
      contexts: ["selection"]
    })

    chrome.contextMenus.create({
      id: "improve-writing",
      parentId: "ai-assistant",
      title: "Improve Writing",
      contexts: ["selection"]
    })
  })

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return

    const sessionManager = getSessionManager()
    const currentSession = sessionManager.getCurrentSession()

    if (!currentSession) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
        title: "Sign In Required",
        message: "Please sign in to use AI features"
      })
      return
    }

    try {
      switch (info.menuItemId) {
        case "extract-content":
          await handleExtractContent(tab)
          break
        case "analyze-selection":
          if (info.selectionText) {
            await handleAnalyzeText(info.selectionText, tab)
          }
          break
        case "summarize":
          await handleSummarize(info.selectionText || null, tab)
          break
        case "extract-key-points":
          await handleExtractKeyPoints(info.selectionText || null, tab)
          break
        case "check-sentiment":
          if (info.selectionText) {
            await handleCheckSentiment(info.selectionText, tab)
          }
          break
        case "improve-writing":
          if (info.selectionText) {
            await handleImproveWriting(info.selectionText, tab)
          }
          break
      }
    } catch (error) {
      console.error("Context menu action failed:", error)
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
        title: "Action Failed",
        message: error.message || "An error occurred"
      })
    }
  })
}

// Context menu handlers
async function handleExtractContent(tab: chrome.tabs.Tab) {
  const result = await contentExtractionService.extractFromCurrentTab()

  if (result.success) {
    // Save extracted content
    const saved = await savedContent.add({
      url: tab.url!,
      title: result.data.title,
      content: result.data,
      tags: ["extracted", "auto"]
    })

    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
      title: "Content Extracted",
      message: `Saved: ${result.data.title}`,
      buttons: [{ title: "View" }, { title: "Analyze" }]
    })
  }
}

async function handleAnalyzeText(text: string, tab: chrome.tabs.Tab) {
  const analysis = await analysisService.analyzeText(text, {
    depth: "quick",
    includeRecommendations: true
  })

  // Show results in side panel or new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL(`tabs/analysis.html?id=${analysis.id}`)
  })
}

async function handleSummarize(text: string | null, tab: chrome.tabs.Tab) {
  if (!text) {
    // Extract page content first
    const extraction = await contentExtractionService.extractFromCurrentTab()
    if (extraction.success) {
      text = extraction.data.cleanText
    }
  }

  if (text) {
    const summary = await aiService.summarize(text, {
      style: "paragraph",
      maxLength: 200
    })

    // Show notification with summary
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
      title: "Summary",
      message: summary
    })
  }
}

async function handleExtractKeyPoints(
  text: string | null,
  tab: chrome.tabs.Tab
) {
  if (!text) {
    const extraction = await contentExtractionService.extractFromCurrentTab()
    if (extraction.success) {
      text = extraction.data.cleanText
    }
  }

  if (text) {
    const keyPoints = await aiService.extractKeyPoints(text)

    // Create a simple HTML page to display results
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Key Points</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
    h1 { color: #333; }
    ul { line-height: 1.8; }
    li { margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>Key Points</h1>
  <ul>
    ${keyPoints.map((point) => `<li>${point}</li>`).join("")}
  </ul>
</body>
</html>
    `

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    chrome.tabs.create({ url })
  }
}

async function handleCheckSentiment(text: string, tab: chrome.tabs.Tab) {
  const sentiment = await aiService.analyzeSentiment(text)

  const emoji =
    {
      positive: "😊",
      negative: "😔",
      neutral: "😐",
      mixed: "🤔"
    }[sentiment.sentiment] || "🤔"

  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
    title: `Sentiment: ${sentiment.sentiment} ${emoji}`,
    message: `Score: ${sentiment.score.toFixed(2)}`
  })
}

async function handleImproveWriting(text: string, tab: chrome.tabs.Tab) {
  const improved = await aiService.generateText(
    `Improve the following text for clarity and professionalism while maintaining the original meaning:\n\n${text}`,
    {
      temperature: 0.7,
      maxTokens: 500
    }
  )

  // Store the improved version
  const storage = getStorage()
  await storage.set(
    "improved-writing",
    {
      original: text,
      improved,
      timestamp: Date.now()
    },
    { ttl: 3600000 }
  ) // 1 hour

  // Open comparison view
  chrome.tabs.create({
    url: chrome.runtime.getURL(`tabs/writing-improvement.html`)
  })
}
