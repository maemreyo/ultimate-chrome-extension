import { TokenManager } from "./token-manager"

interface ProviderOption {
  provider: string
  model: string
  estimatedCost: number
  estimatedLatency: number
  qualityScore: number
  features: string[]
}

interface OptimizationRequirements {
  maxCost?: number
  minQuality?: number
  maxLatency?: number
  requiredFeatures?: string[]
  preferredProviders?: string[]
}

export class CostOptimizer {
  private providerProfiles = {
    openai: {
      models: {
        "gpt-4": {
          quality: 0.95,
          latency: 2000,
          features: ["chat", "code", "reasoning"]
        },
        "gpt-3.5-turbo": {
          quality: 0.85,
          latency: 1000,
          features: ["chat", "code"]
        }
      }
    },
    anthropic: {
      models: {
        "claude-3-opus": {
          quality: 0.96,
          latency: 2500,
          features: ["chat", "code", "reasoning", "long-context"]
        },
        "claude-3-sonnet": {
          quality: 0.9,
          latency: 1500,
          features: ["chat", "code", "long-context"]
        }
      }
    },
    google: {
      models: {
        "gemini-pro": {
          quality: 0.88,
          latency: 1200,
          features: ["chat", "code", "multimodal"]
        }
      }
    }
  }

  async selectOptimalProvider(
    task: string,
    requirements: OptimizationRequirements
  ): Promise<ProviderOption> {
    const taskComplexity = this.analyzeTaskComplexity(task)
    const options = this.getProviderOptions(taskComplexity, requirements)

    // Score each option
    const scoredOptions = options.map((option) => ({
      ...option,
      score: this.calculateScore(option, requirements, taskComplexity)
    }))

    // Sort by score and return best
    scoredOptions.sort((a, b) => b.score - a.score)
    return scoredOptions[0]
  }

  private analyzeTaskComplexity(task: string): {
    complexity: number
    estimatedTokens: number
    requiredFeatures: string[]
  } {
    const complexity = task.length > 1000 ? 0.8 : task.length > 500 ? 0.6 : 0.4
    const estimatedTokens = Math.ceil(task.length / 4) * 2 // Account for response

    const requiredFeatures: string[] = ["chat"]
    if (task.includes("code") || task.includes("function"))
      requiredFeatures.push("code")
    if (task.includes("analyze") || task.includes("reason"))
      requiredFeatures.push("reasoning")
    if (task.length > 4000) requiredFeatures.push("long-context")

    return { complexity, estimatedTokens, requiredFeatures }
  }

  private getProviderOptions(
    taskInfo: ReturnType<typeof this.analyzeTaskComplexity>,
    requirements: OptimizationRequirements
  ): ProviderOption[] {
    const options: ProviderOption[] = []

    for (const [provider, profile] of Object.entries(this.providerProfiles)) {
      for (const [model, modelInfo] of Object.entries(profile.models)) {
        // Check if model has required features
        const hasRequiredFeatures = taskInfo.requiredFeatures.every((feature) =>
          modelInfo.features.includes(feature)
        )

        if (!hasRequiredFeatures) continue

        const tokenManager = new TokenManager()
        const cost = tokenManager.estimateCost(
          taskInfo.estimatedTokens,
          model,
          "output"
        )

        options.push({
          provider,
          model,
          estimatedCost: cost,
          estimatedLatency: modelInfo.latency,
          qualityScore: modelInfo.quality,
          features: modelInfo.features
        })
      }
    }

    return options
  }

  private calculateScore(
    option: ProviderOption,
    requirements: OptimizationRequirements,
    taskInfo: ReturnType<typeof this.analyzeTaskComplexity>
  ): number {
    let score = 100

    // Cost scoring (40% weight)
    if (requirements.maxCost && option.estimatedCost > requirements.maxCost) {
      return 0 // Disqualify if over budget
    }
    const costScore = requirements.maxCost
      ? (1 - option.estimatedCost / requirements.maxCost) * 40
      : 40 - option.estimatedCost * 10

    // Quality scoring (40% weight)
    if (
      requirements.minQuality &&
      option.qualityScore < requirements.minQuality
    ) {
      return 0 // Disqualify if below quality threshold
    }
    const qualityScore = option.qualityScore * 40

    // Latency scoring (20% weight)
    if (
      requirements.maxLatency &&
      option.estimatedLatency > requirements.maxLatency
    ) {
      return 0 // Disqualify if too slow
    }
    const latencyScore = requirements.maxLatency
      ? (1 - option.estimatedLatency / requirements.maxLatency) * 20
      : 20 - option.estimatedLatency / 1000

    // Bonus for preferred providers
    const preferenceBonus = requirements.preferredProviders?.includes(
      option.provider
    )
      ? 10
      : 0

    return costScore + qualityScore + latencyScore + preferenceBonus
  }
}
