// src/modules/content-extractor/utilities/readability-helpers.ts
// Advanced readability analysis utilities

import type { ReadabilityScore } from "../types"

/**
 * Calculate comprehensive readability metrics
 * @param text - Text to analyze
 * @returns Readability scores and metrics
 */
export function calculateReadabilityMetrics(text: string): ReadabilityScore & {
  metrics: {
    fleschKincaid: number
    fleschReading: number
    gunningFog: number
    smog: number
    automatedReadability: number
    colemanLiau: number
  }
  statistics: {
    sentences: number
    words: number
    syllables: number
    characters: number
    complexWords: number
    averageWordsPerSentence: number
    averageSyllablesPerWord: number
  }
} {
  const stats = calculateTextStatistics(text)
  const metrics = {
    fleschKincaid: calculateFleschKincaid(stats),
    fleschReading: calculateFleschReading(stats),
    gunningFog: calculateGunningFog(stats),
    smog: calculateSMOG(stats),
    automatedReadability: calculateAutomatedReadability(stats),
    colemanLiau: calculateColemanLiau(stats)
  }

  // Calculate overall score (average of normalized metrics)
  const normalizedScores = [
    normalizeFleschReading(metrics.fleschReading),
    normalizeGradeLevel(metrics.fleschKincaid),
    normalizeGradeLevel(metrics.gunningFog),
    normalizeGradeLevel(metrics.smog),
    normalizeGradeLevel(metrics.automatedReadability),
    normalizeGradeLevel(metrics.colemanLiau)
  ]

  const score =
    normalizedScores.reduce((sum, score) => sum + score, 0) /
    normalizedScores.length

  return {
    score,
    level: getReadabilityLevel(score),
    gradeLevel: Math.round((metrics.fleschKincaid + metrics.gunningFog) / 2),
    metrics,
    statistics: stats
  }
}

/**
 * Calculate basic text statistics
 * @param text - Text to analyze
 * @returns Text statistics
 */
function calculateTextStatistics(text: string) {
  const cleanText = text.replace(/[^\w\s.!?]/g, " ").trim()

  // Count sentences
  const sentences = cleanText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length

  // Count words
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0)
  const wordCount = words.length

  // Count syllables
  let syllableCount = 0
  let complexWordCount = 0

  for (const word of words) {
    const syllables = countSyllables(word)
    syllableCount += syllables

    if (syllables >= 3) {
      complexWordCount++
    }
  }

  // Count characters
  const characters = cleanText.replace(/\s/g, "").length

  return {
    sentences: Math.max(1, sentences),
    words: wordCount,
    syllables: syllableCount,
    characters,
    complexWords: complexWordCount,
    averageWordsPerSentence: wordCount / Math.max(1, sentences),
    averageSyllablesPerWord: syllableCount / Math.max(1, wordCount)
  }
}

/**
 * Count syllables in a word
 * @param word - Word to count syllables for
 * @returns Number of syllables
 */
function countSyllables(word: string): number {
  word = word.toLowerCase()

  // Remove non-alphabetic characters
  word = word.replace(/[^a-z]/g, "")

  if (word.length === 0) return 0
  if (word.length <= 3) return 1

  // Count vowel groups
  let syllables = 0
  let previousWasVowel = false

  for (let i = 0; i < word.length; i++) {
    const isVowel = "aeiouy".includes(word[i])

    if (isVowel && !previousWasVowel) {
      syllables++
    }

    previousWasVowel = isVowel
  }

  // Handle silent 'e'
  if (word.endsWith("e")) {
    syllables--
  }

  // Handle 'le' ending
  if (
    word.endsWith("le") &&
    word.length > 2 &&
    !"aeiouy".includes(word[word.length - 3])
  ) {
    syllables++
  }

  return Math.max(1, syllables)
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * @param stats - Text statistics
 * @returns Grade level
 */
function calculateFleschKincaid(stats: any): number {
  return (
    0.39 * stats.averageWordsPerSentence +
    11.8 * stats.averageSyllablesPerWord -
    15.59
  )
}

/**
 * Calculate Flesch Reading Ease
 * @param stats - Text statistics
 * @returns Reading ease score (0-100)
 */
function calculateFleschReading(stats: any): number {
  return (
    206.835 -
    1.015 * stats.averageWordsPerSentence -
    84.6 * stats.averageSyllablesPerWord
  )
}

/**
 * Calculate Gunning Fog Index
 * @param stats - Text statistics
 * @returns Grade level
 */
function calculateGunningFog(stats: any): number {
  const complexWordPercentage = (stats.complexWords / stats.words) * 100
  return 0.4 * (stats.averageWordsPerSentence + complexWordPercentage)
}

/**
 * Calculate SMOG Index
 * @param stats - Text statistics
 * @returns Grade level
 */
function calculateSMOG(stats: any): number {
  const complexWordsPerSentence = stats.complexWords / stats.sentences
  return 1.043 * Math.sqrt(complexWordsPerSentence * 30) + 3.1291
}

/**
 * Calculate Automated Readability Index
 * @param stats - Text statistics
 * @returns Grade level
 */
function calculateAutomatedReadability(stats: any): number {
  const charactersPerWord = stats.characters / stats.words
  return 4.71 * charactersPerWord + 0.5 * stats.averageWordsPerSentence - 21.43
}

/**
 * Calculate Coleman-Liau Index
 * @param stats - Text statistics
 * @returns Grade level
 */
function calculateColemanLiau(stats: any): number {
  const L = (stats.characters / stats.words) * 100
  const S = (stats.sentences / stats.words) * 100
  return 0.0588 * L - 0.296 * S - 15.8
}

/**
 * Normalize Flesch Reading Ease to 0-1 scale
 * @param score - Flesch Reading Ease score
 * @returns Normalized score
 */
function normalizeFleschReading(score: number): number {
  // Flesch Reading Ease: 0-100 (higher is easier)
  return Math.max(0, Math.min(1, score / 100))
}

/**
 * Normalize grade level to 0-1 scale
 * @param gradeLevel - Grade level
 * @returns Normalized score
 */
function normalizeGradeLevel(gradeLevel: number): number {
  // Grade levels: 1-20+ (lower is easier)
  // Invert and normalize to 0-1 scale
  return Math.max(0, Math.min(1, (20 - gradeLevel) / 19))
}

/**
 * Get readability level description
 * @param score - Normalized readability score (0-1)
 * @returns Readability level
 */
function getReadabilityLevel(
  score: number
): "very-easy" | "easy" | "medium" | "hard" | "very-hard" {
  if (score >= 0.8) return "very-easy"
  if (score >= 0.6) return "easy"
  if (score >= 0.4) return "medium"
  if (score >= 0.2) return "hard"
  return "very-hard"
}

/**
 * Analyze sentence complexity
 * @param text - Text to analyze
 * @returns Sentence complexity metrics
 */
export function analyzeSentenceComplexity(text: string): {
  averageLength: number
  complexSentences: number
  simpleSentences: number
  compoundSentences: number
  complexityDistribution: Record<string, number>
} {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  let complexSentences = 0
  let simpleSentences = 0
  let compoundSentences = 0
  const lengths: number[] = []

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).length
    lengths.push(words)

    // Simple heuristics for sentence types
    const hasConjunctions =
      /\b(and|but|or|because|although|since|while|if|when)\b/i.test(sentence)
    const hasCommas = sentence.includes(",")

    if (words > 20 || (hasConjunctions && hasCommas)) {
      complexSentences++
    } else if (hasConjunctions || hasCommas) {
      compoundSentences++
    } else {
      simpleSentences++
    }
  }

  const averageLength =
    lengths.reduce((sum, len) => sum + len, 0) / lengths.length

  // Distribution by length
  const distribution = {
    short: lengths.filter((len) => len <= 10).length,
    medium: lengths.filter((len) => len > 10 && len <= 20).length,
    long: lengths.filter((len) => len > 20).length
  }

  return {
    averageLength,
    complexSentences,
    simpleSentences,
    compoundSentences,
    complexityDistribution: distribution
  }
}

/**
 * Analyze vocabulary complexity
 * @param text - Text to analyze
 * @returns Vocabulary metrics
 */
export function analyzeVocabulary(text: string): {
  uniqueWords: number
  vocabularyDiversity: number
  averageWordLength: number
  commonWords: number
  rareWords: number
  wordFrequency: Record<string, number>
} {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0)

  const uniqueWords = new Set(words)
  const wordFreq: Record<string, number> = {}

  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  }

  // Common English words (simplified list)
  const commonWords = new Set([
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "can",
    "may",
    "might",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they"
  ])

  const commonWordCount = words.filter((word) => commonWords.has(word)).length
  const rareWordCount = words.filter(
    (word) => !commonWords.has(word) && word.length > 6
  ).length

  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0)
  const averageWordLength = totalWordLength / words.length

  // Vocabulary diversity (Type-Token Ratio)
  const vocabularyDiversity = uniqueWords.size / words.length

  return {
    uniqueWords: uniqueWords.size,
    vocabularyDiversity,
    averageWordLength,
    commonWords: commonWordCount,
    rareWords: rareWordCount,
    wordFrequency: wordFreq
  }
}

/**
 * Get readability recommendations
 * @param metrics - Readability metrics
 * @returns Array of improvement suggestions
 */
export function getReadabilityRecommendations(
  metrics: ReturnType<typeof calculateReadabilityMetrics>
): string[] {
  const recommendations: string[] = []

  if (metrics.statistics.averageWordsPerSentence > 20) {
    recommendations.push("Consider breaking long sentences into shorter ones")
  }

  if (metrics.statistics.averageSyllablesPerWord > 1.7) {
    recommendations.push("Try using simpler words with fewer syllables")
  }

  if (metrics.statistics.complexWords / metrics.statistics.words > 0.15) {
    recommendations.push("Reduce the number of complex words (3+ syllables)")
  }

  if (metrics.metrics.fleschReading < 30) {
    recommendations.push(
      "Text is very difficult to read - consider simplifying"
    )
  }

  if (metrics.gradeLevel > 12) {
    recommendations.push(
      "Text requires college-level reading - consider lowering complexity"
    )
  }

  return recommendations
}
