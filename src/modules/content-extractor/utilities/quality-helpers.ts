// src/modules/content-extractor/utilities/quality-helpers.ts
// Utility functions for content quality assessment

import type { ExtractedContent, ReadabilityScore } from "../types"

/**
 * Check if content meets high quality standards
 * @param content - Extracted content to assess
 * @param threshold - Quality threshold (default: 0.7)
 * @returns True if content is high quality
 */
export const isHighQualityContent = (
  content: ExtractedContent,
  threshold: number = 0.7
): boolean => {
  return content.quality.score >= threshold
}

/**
 * Get human-readable readability level
 * @param score - Readability score
 * @returns Readability level description
 */
export const getReadabilityLevel = (score: ReadabilityScore): string => {
  if (score.fleschKincaid < 6) return "elementary"
  if (score.fleschKincaid < 9) return "middle-school"
  if (score.fleschKincaid < 13) return "high-school"
  if (score.fleschKincaid < 16) return "college"
  return "graduate"
}

/**
 * Get detailed readability assessment
 * @param score - Readability score
 * @returns Detailed readability information
 */
export const getReadabilityAssessment = (score: ReadabilityScore) => {
  const level = getReadabilityLevel(score)
  const gradeLevel = Math.round(score.fleschKincaid)

  return {
    level,
    gradeLevel,
    description: getReadabilityDescription(level),
    metrics: {
      fleschKincaid: score.fleschKincaid,
      gunningFog: score.gunningFog,
      avgSentenceLength: score.avgSentenceLength,
      avgWordLength: score.avgWordLength,
      complexWords: score.complexWords
    }
  }
}

/**
 * Get readability level description
 * @param level - Readability level
 * @returns Description of the readability level
 */
export const getReadabilityDescription = (level: string): string => {
  const descriptions = {
    elementary:
      "Very easy to read. Easily understood by an average 11-year-old student.",
    "middle-school": "Easy to read. Conversational English for consumers.",
    "high-school":
      "Fairly easy to read. Plain English. Easily understood by 13- to 15-year-old students.",
    college: "Fairly difficult to read. Academic level.",
    graduate: "Difficult to read. Best understood by university graduates."
  }

  return (
    descriptions[level as keyof typeof descriptions] ||
    "Unknown readability level"
  )
}

/**
 * Calculate content quality score
 * @param content - Extracted content
 * @returns Quality score (0-1)
 */
export const calculateQualityScore = (content: ExtractedContent): number => {
  const quality = content.quality

  // Weighted average of quality metrics
  const weights = {
    textDensity: 0.25,
    linkDensity: 0.15,
    adDensity: 0.15,
    readabilityScore: 0.2,
    structureScore: 0.15,
    completeness: 0.1
  }

  return (
    quality.textDensity * weights.textDensity +
    (1 - quality.linkDensity) * weights.linkDensity + // Lower link density is better
    (1 - quality.adDensity) * weights.adDensity + // Lower ad density is better
    quality.readabilityScore * weights.readabilityScore +
    quality.structureScore * weights.structureScore +
    quality.completeness * weights.completeness
  )
}

/**
 * Get quality assessment with recommendations
 * @param content - Extracted content
 * @returns Quality assessment with recommendations
 */
export const getQualityAssessment = (content: ExtractedContent) => {
  const quality = content.quality
  const score = calculateQualityScore(content)
  const recommendations: string[] = []

  // Generate recommendations based on quality metrics
  if (quality.textDensity < 0.5) {
    recommendations.push(
      "Content has low text density. Consider removing non-essential elements."
    )
  }

  if (quality.linkDensity > 0.3) {
    recommendations.push(
      "High link density detected. This might be a navigation page or spam."
    )
  }

  if (quality.adDensity > 0.2) {
    recommendations.push(
      "High advertisement density. Content quality may be affected."
    )
  }

  if (quality.readabilityScore < 0.5) {
    recommendations.push(
      "Content may be difficult to read. Consider simplifying language."
    )
  }

  if (quality.structureScore < 0.6) {
    recommendations.push(
      "Poor content structure. Consider improving headings and organization."
    )
  }

  if (quality.completeness < 0.7) {
    recommendations.push(
      "Content appears incomplete. Some sections may be missing."
    )
  }

  return {
    score,
    level:
      score >= 0.8
        ? "excellent"
        : score >= 0.6
          ? "good"
          : score >= 0.4
            ? "fair"
            : "poor",
    metrics: quality,
    recommendations,
    isHighQuality: isHighQualityContent(content, 0.7)
  }
}

/**
 * Compare quality between two pieces of content
 * @param content1 - First content to compare
 * @param content2 - Second content to compare
 * @returns Comparison result
 */
export const compareQuality = (
  content1: ExtractedContent,
  content2: ExtractedContent
) => {
  const score1 = calculateQualityScore(content1)
  const score2 = calculateQualityScore(content2)

  return {
    winner: score1 > score2 ? "first" : score2 > score1 ? "second" : "tie",
    scoreDifference: Math.abs(score1 - score2),
    scores: { first: score1, second: score2 },
    betterContent: score1 > score2 ? content1 : content2
  }
}
