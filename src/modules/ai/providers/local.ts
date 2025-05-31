import * as tf from "@tensorflow/tfjs"
import type { AIConfig, AIProvider, Classification, GenerateOptions, SummarizeOptions } from "../types"

export class LocalProvider implements AIProvider {
  name = "local"
  private models: Map<string, tf.LayersModel> = new Map()

  constructor(config: AIConfig) {
    // Initialize local models
    this.loadModels()
  }

  private async loadModels() {
    // Load lightweight models for browser
    try {
      // Text classification model
      const classifierModel = await tf.loadLayersModel('/models/text-classifier/model.json')
      this.models.set('classifier', classifierModel)

      // Embedding model
      const embeddingModel = await tf.loadLayersModel('/models/text-embedding/model.json')
      this.models.set('embedding', embeddingModel)
    } catch (error) {
      console.error("Failed to load local models:", error)
    }
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    // Local generation is limited - use simple template-based approach
    // or integrate with smaller models like TinyLlama via ONNX

    // For now, return a placeholder
    return `[Local generation not fully implemented. Input: ${prompt.substring(0, 50)}...]`
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.models.get('embedding')
    if (!model) {
      throw new Error("Embedding model not loaded")
    }

    // Simple tokenization (in production, use proper tokenizer)
    const tokens = text.toLowerCase().split(' ').slice(0, 512)
    const input = tf.tensor2d([tokens.map(t => t.charCodeAt(0))])

    const embeddings = model.predict(input) as tf.Tensor
    const result = await embeddings.array()

    input.dispose()
    embeddings.dispose()

    return result[0] as number[]
  }

  async classifyText(text: string, labels: string[]): Promise<Classification> {
    const model = this.models.get('classifier')
    if (!model) {
      // Fallback to rule-based classification
      return this.ruleBasedClassification(text, labels)
    }

    // Use model for classification
    // ... model inference logic ...

    return this.ruleBasedClassification(text, labels)
  }

  private ruleBasedClassification(text: string, labels: string[]): Classification {
    // Simple keyword-based classification
    const scores: Record<string, number> = {}
    let topLabel = labels[0]
    let topScore = 0

    for (const label of labels) {
      const keywords = this.getKeywordsForLabel(label)
      const score = this.calculateKeywordScore(text, keywords)
      scores[label] = score

      if (score > topScore) {
        topScore = score
        topLabel = label
      }
    }

    return {
      label: topLabel,
      confidence: topScore,
      scores
    }
  }

  private getKeywordsForLabel(label: string): string[] {
    // Define keywords for common labels
    const keywordMap: Record<string, string[]> = {
      'technology': ['tech', 'software', 'hardware', 'computer', 'digital', 'ai', 'machine learning'],
      'business': ['business', 'company', 'market', 'finance', 'economy', 'startup', 'entrepreneur'],
      'health': ['health', 'medical', 'doctor', 'patient', 'treatment', 'disease', 'wellness'],
      'sports': ['sports', 'game', 'player', 'team', 'match', 'score', 'championship'],
      'entertainment': ['movie', 'music', 'actor', 'singer', 'film', 'show', 'entertainment']
    }

    return keywordMap[label.toLowerCase()] || [label.toLowerCase()]
  }

  private calculateKeywordScore(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase()
    let matches = 0

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const keywordMatches = (lowerText.match(regex) || []).length
      matches += keywordMatches
    }

    return Math.min(matches / keywords.length * 0.2, 1)
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    // Simple extractive summarization
    const sentences = text.match(/[^.!?]+[.!?]+/g) || []

    if (sentences.length <= 3) {
      return text
    }

    // Score sentences based on word frequency
    const wordFreq = this.calculateWordFrequency(text)
    const sentenceScores = sentences.map(sentence => {
      const words = sentence.toLowerCase().split(/\s+/)
      const score = words.reduce((sum, word) => sum + (wordFreq[word] || 0), 0) / words.length
      return { sentence, score }
    })

    // Sort by score and take top sentences
    sentenceScores.sort((a, b) => b.score - a.score)
    const topSentences = sentenceScores.slice(0, 3).map(s => s.sentence)

    if (options?.style === 'bullet') {
      return topSentences.map(s => `• ${s.trim()}`).join('\n')
    } else if (options?.style === 'tldr') {
      return topSentences[0].trim()
    } else {
      return topSentences.join(' ').trim()
    }
  }

  private calculateWordFrequency(text: string): Record<string, number> {
    const words = text.toLowerCase().split(/\s+/)
    const freq: Record<string, number> = {}
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])

    for (const word of words) {
      if (!stopWords.has(word) && word.length > 3) {
        freq[word] = (freq[word] || 0) + 1
      }
    }

    // Normalize frequencies
    const maxFreq = Math.max(...Object.values(freq))
    for (const word in freq) {
      freq[word] = freq[word] / maxFreq
    }

    return freq
  }
}
