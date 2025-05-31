import { useCallback, useRef, useState } from "react"
import { aiService } from "../ai-service"

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export function useAIChat(systemPrompt?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setError(null)

    try {
      // Build conversation context
      const conversationContext = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      const prompt = conversationContext + `\nuser: ${content}\nassistant:`

      const response = await aiService.generateText(prompt, {
        systemPrompt: systemPrompt || "You are a helpful assistant in a browser extension.",
        maxTokens: 500
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      return response
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [messages, systemPrompt])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    messages,
    sendMessage,
    clearMessages,
    stopGeneration,
    loading,
    error
  }
}
