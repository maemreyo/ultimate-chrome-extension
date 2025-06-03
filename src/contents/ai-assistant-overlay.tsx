// AI Assistant overlay for web pages

import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "~components/theme-provider"
import { Badge } from "~components/ui/badge"
import { Button } from "~components/ui/button"
import { Card, CardContent } from "~components/ui/card"
import { Textarea } from "~components/ui/textarea"
import cssText from "data-text:~styles/content.css"
import { AnimatePresence, motion } from "framer-motion"
import {
  Brain,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  X
} from "lucide-react"
import type { PlasmoCSConfig } from "plasmo"
import { sendToBackground } from "@plasmohq/messaging"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  exclude_matches: ["*://localhost/*"],
  css: ["font.css"]
}

const queryClient = new QueryClient()

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent =
    cssText +
    `
    .ai-assistant-overlay {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: "Inter", sans-serif !important;
    }

    .ai-floating-button {
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .ai-floating-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
    }

    .ai-assistant-panel {
      width: 380px;
      max-height: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .dark .ai-assistant-panel {
      background: #1a1a1a;
    }
  `
  return style
}

export const getShadowHostId = () => "ai-assistant-overlay-root"

const AIAssistantOverlay = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [quickAction, setQuickAction] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")

  // Listen for text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      if (text && text.length > 10) {
        setSelectedText(text)
        // Show quick actions if text is selected
        if (!isOpen) {
          setQuickAction("selection")
        }
      }
    }

    document.addEventListener("selectionchange", handleSelection)
    return () =>
      document.removeEventListener("selectionchange", handleSelection)
  }, [isOpen])

  // Quick actions for selected text
  const quickActions = [
    { id: "summarize", label: "Summarize", icon: "📝" },
    { id: "explain", label: "Explain", icon: "💡" },
    { id: "translate", label: "Translate", icon: "🌐" },
    { id: "improve", label: "Improve", icon: "✨" }
  ]

  const handleQuickAction = async (action: string) => {
    if (!selectedText) return

    setIsLoading(true)
    setAiResponse("")
    setIsOpen(true)
    setQuickAction(null)

    try {
      let prompt = ""
      switch (action) {
        case "summarize":
          prompt = `Summarize this text concisely:\n\n${selectedText}`
          break
        case "explain":
          prompt = `Explain this in simple terms:\n\n${selectedText}`
          break
        case "translate":
          prompt = `Translate this to English (or to Spanish if already in English):\n\n${selectedText}`
          break
        case "improve":
          prompt = `Improve this text for clarity and professionalism:\n\n${selectedText}`
          break
      }

      const response = await sendToBackground({
        name: "ai-generate",
        body: { prompt, options: { temperature: 0.7, maxTokens: 300 } }
      })

      if (response.success) {
        setAiResponse(response.data)
      } else {
        setAiResponse("Error: " + response.error)
      }
    } catch (error) {
      setAiResponse("Failed to get AI response")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return

    setIsLoading(true)
    setAiResponse("")

    try {
      const context = selectedText
        ? `Context from page:\n${selectedText}\n\nRequest: ${customPrompt}`
        : customPrompt

      const response = await sendToBackground({
        name: "ai-generate",
        body: {
          prompt: context,
          options: { temperature: 0.7, maxTokens: 500 }
        }
      })

      if (response.success) {
        setAiResponse(response.data)
        setCustomPrompt("")
      } else {
        setAiResponse("Error: " + response.error)
      }
    } catch (error) {
      setAiResponse("Failed to get AI response")
    } finally {
      setIsLoading(false)
    }
  }

  const extractPageContent = async () => {
    setIsLoading(true)
    try {
      const response = await sendToBackground({
        name: "extract-content",
        body: { method: "currentTab" }
      })

      if (response.success) {
        setAiResponse(
          `Page extracted successfully!\n\nTitle: ${response.data.title}\nWord Count: ${response.data.wordCount}\nReading Time: ${response.data.readingTime} min\n\nContent has been saved for analysis.`
        )
      }
    } catch (error) {
      setAiResponse("Failed to extract page content")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="ai-assistant-overlay">
          <AnimatePresence>
            {/* Quick Actions Popup */}
            {quickAction === "selection" && selectedText && !isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-20 right-0 flex gap-1 rounded-lg bg-white p-2 shadow-xl dark:bg-gray-800"
              >
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickAction(action.id)}
                    className="flex items-center gap-1"
                  >
                    <span>{action.icon}</span>
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuickAction(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Main Panel */}
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="ai-assistant-panel mb-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b p-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="font-semibold">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {!isMinimized && (
                  <div className="space-y-4 p-4">
                    {/* Page Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={extractPageContent}
                        disabled={isLoading}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Extract Page
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction("summarize")}
                        disabled={isLoading || !selectedText}
                      >
                        <Sparkles className="mr-1 h-4 w-4" />
                        Summarize
                      </Button>
                    </div>

                    {/* Selected Text Display */}
                    {selectedText && (
                      <Card className="bg-muted">
                        <CardContent className="p-3">
                          <div className="mb-2 flex items-start justify-between">
                            <Badge variant="secondary" className="text-xs">
                              Selected Text
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => setSelectedText("")}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="line-clamp-3 text-sm">{selectedText}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* AI Response */}
                    {aiResponse && (
                      <Card>
                        <CardContent className="p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              AI Response
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm">
                            {aiResponse}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}

                    {/* Custom Prompt Input */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Ask AI anything about this page..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="min-h-[80px] text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleCustomPrompt()
                          }
                        }}
                      />
                      <Button
                        onClick={handleCustomPrompt}
                        disabled={isLoading || !customPrompt.trim()}
                        className="w-full"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Button */}
          <motion.button
            className="ai-floating-button"
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Brain className="h-6 w-6 text-white" />
            )}
          </motion.button>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default AIAssistantOverlay
