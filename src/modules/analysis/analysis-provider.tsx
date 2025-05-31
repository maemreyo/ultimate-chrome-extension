import React, { createContext, useContext, useEffect, useState } from 'react'
import { analysisEngine } from './analysis-engine'
import type { AnalysisResult, AnalysisType } from './types'

interface AnalysisContextValue {
  availableTypes: AnalysisType[]
  history: AnalysisResult[]
  getAnalysis: (id: string) => AnalysisResult | undefined
  clearHistory: () => void
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [availableTypes, setAvailableTypes] = useState<AnalysisType[]>([])
  const [history, setHistory] = useState<AnalysisResult[]>([])

  useEffect(() => {
    // Load available analysis types
    setAvailableTypes(analysisEngine.getAvailableTypes())

    // Load history
    setHistory(analysisEngine.getHistory({ limit: 50 }))
  }, [])

  const getAnalysis = (id: string) => {
    return analysisEngine.getAnalysis(id)
  }

  const clearHistory = () => {
    analysisEngine.clearHistory()
    setHistory([])
  }

  return (
    <AnalysisContext.Provider value={{
      availableTypes,
      history,
      getAnalysis,
      clearHistory
    }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysisContext must be used within AnalysisProvider')
  }
  return context
}
