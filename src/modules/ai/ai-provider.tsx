import React, { createContext, useContext, useEffect, useState } from "react"
import { aiService } from "./ai-service"
import type { AIConfig, AIUsageStats } from "./types"

interface AIContextValue {
  config: AIConfig | null
  stats: AIUsageStats | null
  configure: (config: AIConfig) => Promise<void>
  resetStats: () => Promise<void>
}

const AIContext = createContext<AIContextValue | null>(null)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [stats, setStats] = useState<AIUsageStats | null>(null)

  useEffect(() => {
    loadConfig()
    loadStats()
  }, [])

  const loadConfig = async () => {
    const storage = new Storage({ area: "local" })
    const savedConfig = await storage.get("ai_config")
    if (savedConfig) {
      setConfig(savedConfig)
    }
  }

  const loadStats = async () => {
    const currentStats = await aiService.getUsageStats()
    setStats(currentStats)
  }

  const configure = async (newConfig: AIConfig) => {
    await aiService.configure(newConfig)
    setConfig(newConfig)
  }

  const resetStats = async () => {
    await aiService.resetUsageStats()
    await loadStats()
  }

  return (
    <AIContext.Provider value={{ config, stats, configure, resetStats }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAIContext() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error("useAIContext must be used within AIProvider")
  }
  return context
}
