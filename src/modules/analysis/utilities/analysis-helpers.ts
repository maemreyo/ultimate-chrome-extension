// src/modules/analysis/utilities/analysis-helpers.ts
// Analysis execution and management utilities

import type {
  AnalysisOptions,
  AnalysisRequest,
  AnalysisResult,
  AnalysisType
} from "../types"

/**
 * Estimate analysis duration based on type and input size
 * @param analysisType - Type of analysis
 * @param inputSize - Size of input data
 * @returns Estimated duration in seconds
 */
export function estimateAnalysisDuration(
  analysisType: AnalysisType,
  inputSize: number
): number {
  const baseTime = analysisType.estimatedTime || 30
  const sizeMultiplier = Math.max(1, Math.log10(inputSize / 1000))

  return Math.ceil(baseTime * sizeMultiplier)
}

/**
 * Get optimal analysis depth based on input size and requirements
 * @param inputSize - Size of input data
 * @param timeConstraint - Maximum time allowed (seconds)
 * @param qualityRequirement - Required quality level
 * @returns Recommended analysis depth
 */
export function getOptimalDepth(
  inputSize: number,
  timeConstraint?: number,
  qualityRequirement?: "low" | "medium" | "high"
): "quick" | "standard" | "detailed" {
  if (timeConstraint && timeConstraint < 30) {
    return "quick"
  }

  if (qualityRequirement === "high") {
    return "detailed"
  }

  if (inputSize > 10000) {
    return timeConstraint && timeConstraint < 120 ? "standard" : "detailed"
  }

  if (inputSize > 5000) {
    return "standard"
  }

  return "quick"
}

/**
 * Create analysis request with optimized options
 * @param type - Analysis type
 * @param inputs - Input data
 * @param preferences - User preferences
 * @returns Optimized analysis request
 */
export function createOptimizedRequest(
  type: string,
  inputs: Record<string, any>,
  preferences?: {
    maxTime?: number
    quality?: "low" | "medium" | "high"
    language?: string
    includeRecommendations?: boolean
  }
): AnalysisRequest {
  const inputSize = JSON.stringify(inputs).length
  const depth = getOptimalDepth(
    inputSize,
    preferences?.maxTime,
    preferences?.quality
  )

  const options: AnalysisOptions = {
    depth,
    language: preferences?.language || "en",
    includeRecommendations: preferences?.includeRecommendations ?? true,
    includeSources: depth !== "quick"
  }

  return { type, inputs, options }
}

/**
 * Batch multiple analysis requests
 * @param requests - Array of analysis requests
 * @param concurrency - Maximum concurrent analyses
 * @returns Promise resolving to array of results
 */
export async function batchAnalyze(
  requests: AnalysisRequest[],
  concurrency: number = 3,
  analyzer: (request: AnalysisRequest) => Promise<AnalysisResult>
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = []
  const executing: Promise<void>[] = []

  for (const request of requests) {
    const promise = analyzer(request).then((result) => {
      results.push(result)
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      )
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * Compare analysis results
 * @param result1 - First result
 * @param result2 - Second result
 * @returns Comparison metrics
 */
export function compareResults(
  result1: AnalysisResult,
  result2: AnalysisResult
): {
  similarity: number
  differences: string[]
  recommendation: "use_first" | "use_second" | "merge" | "rerun"
} {
  const differences: string[] = []
  let similarity = 0

  // Compare metadata
  if (result1.metadata.duration && result2.metadata.duration) {
    const timeDiff = Math.abs(
      result1.metadata.duration - result2.metadata.duration
    )
    if (timeDiff > 30000) {
      // 30 seconds
      differences.push("Significant time difference")
    }
  }

  // Compare output structure (basic)
  if (result1.output && result2.output) {
    const keys1 = Object.keys(result1.output)
    const keys2 = Object.keys(result2.output)

    const commonKeys = keys1.filter((key) => keys2.includes(key))
    similarity = commonKeys.length / Math.max(keys1.length, keys2.length)

    if (similarity < 0.7) {
      differences.push("Different output structure")
    }
  }

  // Determine recommendation
  let recommendation: "use_first" | "use_second" | "merge" | "rerun"

  if (similarity > 0.9) {
    recommendation =
      result1.metadata.duration! < result2.metadata.duration!
        ? "use_first"
        : "use_second"
  } else if (similarity > 0.5) {
    recommendation = "merge"
  } else {
    recommendation = "rerun"
  }

  return { similarity, differences, recommendation }
}

/**
 * Generate analysis summary
 * @param results - Array of analysis results
 * @returns Summary statistics
 */
export function generateSummary(results: AnalysisResult[]): {
  total: number
  completed: number
  failed: number
  averageDuration: number
  successRate: number
  mostCommonType: string
} {
  const total = results.length
  const completed = results.filter((r) => r.status === "completed").length
  const failed = results.filter((r) => r.status === "failed").length

  const durations = results
    .filter((r) => r.metadata.duration)
    .map((r) => r.metadata.duration!)

  const averageDuration =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0

  const successRate = total > 0 ? completed / total : 0

  // Find most common type
  const typeCounts = results.reduce(
    (acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const mostCommonType =
    Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "none"

  return {
    total,
    completed,
    failed,
    averageDuration,
    successRate,
    mostCommonType
  }
}
