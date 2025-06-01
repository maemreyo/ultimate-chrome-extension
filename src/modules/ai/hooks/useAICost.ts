import { useCallback, useEffect, useState } from 'react'
import { CostOptimizer, TokenManager } from '../enhancements'
import { enhancedAIService } from '../enhanced-service'

interface CostEstimate {
  provider: string
  model: string
  estimatedCost: number
  estimatedTokens: number
  recommendation: string
}

export function useAICost() {
  const [estimates, setEstimates] = useState<CostEstimate[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [budget, setBudget] = useState<number | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])

  const costOptimizer = new CostOptimizer()
  const tokenManager = new TokenManager()

  const estimateCost = useCallback(async (
    text: string,
    operation: 'text' | 'image' | 'audio' = 'text'
  ): Promise<CostEstimate[]> => {
    const estimates: CostEstimate[] = []

    // Get token count
    const tokens = tokenManager.getTokenCount(text, 'gpt-3.5-turbo')

    // Estimate for different providers
    const providers = ['openai', 'anthropic', 'google'] as const

    for (const provider of providers) {
      const models = {
        openai: ['gpt-4', 'gpt-3.5-turbo'],
        anthropic: ['claude-3-opus', 'claude-3-sonnet'],
        google: ['gemini-pro']
      }

      for (const model of models[provider] || []) {
        const cost = tokenManager.estimateCost(tokens, model, 'output')

        estimates.push({
          provider,
          model,
          estimatedCost: cost,
          estimatedTokens: tokens,
          recommendation: cost < 0.01 ? 'Cost-effective' : cost < 0.05 ? 'Moderate' : 'Expensive'
        })
      }
    }

    setEstimates(estimates)
    return estimates
  }, [])

  const trackSpending = useCallback(async () => {
    const stats = await enhancedAIService.getUsageStats()
    setTotalSpent(stats.costEstimate)

    // Generate recommendations based on spending
    const recs: string[] = []

    if (budget && stats.costEstimate > budget * 0.8) {
      recs.push('You are approaching your budget limit')
    }

    if (stats.costEstimate > 10) {
      recs.push('Consider using cheaper models for simple tasks')
    }

    // Check provider distribution
    const providerCosts = Object.entries(stats.byProvider || {})
      .sort((a, b) => b[1].cost - a[1].cost)

    if (providerCosts.length > 0) {
      const topProvider = providerCosts[0]
      if (topProvider[1].cost / stats.costEstimate > 0.8) {
        recs.push(`Consider diversifying from ${topProvider[0]} to reduce costs`)
      }
    }

    setRecommendations(recs)
  }, [budget])

  useEffect(() => {
    trackSpending()
    const interval = setInterval(trackSpending, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [trackSpending])

  return {
    estimateCost,
    estimates,
    totalSpent,
    budget,
    setBudget,
    recommendations
  }
}