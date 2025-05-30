import { HfInference } from "@huggingface/inference"
import { AIProvider, GenerateOptions, Classification, SummarizeOptions, AIConfig } from "../types"

export class HuggingFaceProvider implements AIProvider {
  name = "huggingface"
  private hf: HfInference
  private model: string

  constructor(config: AIConfig) {
    this.hf = new HfInference(config.apiKey)
    this.model = config.model || "microsoft/phi-2"
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: options?.maxTokens || 200,
          temperature: options?.temperature || 0.7,
          top_p: options?.topP || 0.95,
          return_full_text: false
        }
      })

      return response.generated_text
    } catch (error) {
      console.error("HuggingFace error:", error)
      throw error
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text
    })

    return Array.from(response)
  }

  async classifyText(text: string, labels: string[]): Promise<Classification> {
    const response = await this.hf.zeroShotClassification({
      model: "facebook/bart-large-mnli",
      inputs: text,
      parameters: {
        candidate_labels: labels
      }
    })

    const topLabel = response.labels[0]
    const topScore = response.scores[0]

    return {
      label: topLabel,
      confidence: topScore,
      scores: response.labels.reduce((acc, label, idx) => ({
        ...acc,
        [label]: response.scores[idx]
      }), {})
    }
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    const response = await this.hf.summarization({
      model: "facebook/bart-large-cnn",
      inputs: text,
      parameters: {
        max_length: options?.maxLength || 150,
        min_length: 30
      }
    })

    return response.summary_text
  }
}