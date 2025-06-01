import { useCallback, useState } from "react"
import { ContextWindowManager } from "../enhancements"
import type { ChatMessage } from "../types"

interface UseAIContextOptions {
  maxTokens?: number
  model?: string
  compressionStrategy?: "summarize" | "importance" | "sliding-window"
}

export function useAIContext(
  conversationId: string,
  options: UseAIContextOptions = {}
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [contextStats, setContextStats] = useState({
    messageCount: 0,
    totalTokens: 0,
    compressionApplied: false
  })

  const contextManager = new ContextWindowManager()

  const addMessage = useCallback(
    async (message: ChatMessage) => {
      const newMessages = [...messages, message]

      // Manage context window
      const maxTokens = options.maxTokens || 4096
      const model = options.model || "gpt-3.5-turbo"

      const managedMessages = await contextManager.manageContext(
        conversationId,
        newMessages,
        maxTokens,
        model
      )

      setMessages(managedMessages)

      // Update stats
      const stats = contextManager.getContextStats(conversationId)
      if (stats) {
        setContextStats({
          messageCount: stats.messageCount,
          totalTokens: stats.totalTokens,
          compressionApplied: managedMessages.length < newMessages.length
        })
      }
    },
    [messages, conversationId, options]
  )

  const clearContext = useCallback(() => {
    setMessages([])
    setContextStats({
      messageCount: 0,
      totalTokens: 0,
      compressionApplied: false
    })
  }, [])

  const getContextWindow = useCallback(() => {
    return messages
  }, [messages])

  return {
    messages,
    addMessage,
    clearContext,
    getContextWindow,
    contextStats
  }
}
