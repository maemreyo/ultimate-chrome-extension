# AI/ML Integration Module

A comprehensive AI module for Chrome extensions that supports multiple providers, custom API keys, and various AI capabilities.

## Features

- **Multiple AI Providers**: OpenAI, Anthropic, Google AI, Cohere, HuggingFace, Replicate, and more
- **Custom API Keys**: Users can easily configure their own API keys
- **Self-hosted Models**: Support for custom endpoints and local models
- **Diverse Capabilities**:
  - Text generation and completion
  - Chat conversations with context
  - Text summarization (bullet points, paragraphs, TL;DR)
  - Text classification and sentiment analysis
  - Embeddings generation
  - Image generation (DALL-E, Stable Diffusion)
  - Speech-to-text transcription
  - Text-to-speech synthesis
  - Vision/image analysis
  - Code generation and analysis
- **Advanced Features**:
  - Streaming responses
  - Response caching
  - Rate limiting and quota management
  - API key encryption
  - Multiple API keys per provider
  - Automatic failover between providers
  - Usage analytics and cost tracking

## Installation

```typescript
// src/options/index.tsx
import { AIProvider } from "~modules/ai"
import { AISettings } from "~modules/ai/components/ai-settings"

function OptionsPage() {
  return (
    <AIProvider>
      <AISettings />
    </AIProvider>
  )
}
```

## Quick Start

### Basic Text Generation

```typescript
import { useAI } from "~modules/ai/hooks/useAI"

function MyComponent() {
  const { generateText } = useAI()

  const handleGenerate = async () => {
    const result = await generateText("Write a haiku about browser extensions")
    console.log(result)
  }
}
```

### Chat Interface

```typescript
import { useAIChat } from "~modules/ai/hooks/useAIChat"

function ChatComponent() {
  const { messages, sendMessage } = useAIChat()

  const handleSend = async (message: string) => {
    await sendMessage(message)
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

### Image Generation

```typescript
import { useAI } from "~modules/ai/hooks/useAI"

function ImageGenerator() {
  const { generateImage } = useAI()

  const handleGenerate = async () => {
    const imageUrl = await generateImage("A futuristic city at sunset", {
      size: "1024x1024",
      style: "realistic"
    })
  }
}
```

### Using Custom API Keys

Users can configure their own API keys through the settings interface:

```typescript
import { AISettings } from "~modules/ai/components/ai-settings"

// In your options/settings page
<AISettings />
```

Or programmatically:

```typescript
import { aiService } from "~modules/ai"

await aiService.configure({
  provider: "openai",
  apiKey: "sk-...",
  model: "gpt-4-turbo"
})
```

### Multiple Providers with Failover

```typescript
import { useAI } from "~modules/ai/hooks/useAI"

function RobustComponent() {
  const { generateText } = useAI({
    providers: ['openai', 'anthropic', 'cohere'],
    fallbackBehavior: 'automatic'
  })

  // Will automatically try next provider if one fails
  const result = await generateText("Your prompt")
}
```

### Streaming Responses

```typescript
import { useAI } from "~modules/ai/hooks/useAI"

function StreamingComponent() {
  const { generateStream } = useAI()

  const handleStream = async () => {
    const stream = await generateStream("Tell me a story")

    for await (const chunk of stream) {
      console.log(chunk) // Partial response
    }
  }
}
```

### Custom Endpoints

```typescript
await aiService.configure({
  provider: "custom",
  baseUrl: "https://your-api.com/v1",
  apiKey: "your-key",
  headers: {
    "X-Custom-Header": "value"
  }
})
```

## API Reference

### Hooks

#### `useAI(options?)`

Main hook for AI operations.

```typescript
const {
  // Text operations
  generateText,
  generateStream,
  summarize,
  classifyText,
  analyzeSentiment,

  // Embeddings
  generateEmbedding,
  findSimilar,

  // Images
  generateImage,
  analyzeImage,

  // Audio
  transcribeAudio,
  generateSpeech,

  // Code
  generateCode,
  explainCode,

  // State
  loading,
  error,
  usage
} = useAI(options)
```

#### `useAIChat(options?)`

Hook for chat conversations.

```typescript
const {
  messages,
  sendMessage,
  streamMessage,
  editMessage,
  deleteMessage,
  clearMessages,
  loading,
  error
} = useAIChat({
  systemPrompt: "You are a helpful assistant",
  model: "gpt-4",
  temperature: 0.7
})
```

### Configuration

#### Provider Configuration

```typescript
interface AIConfig {
  provider: AIProviderType
  apiKey?: string
  apiKeys?: Record<string, string> // Multiple keys
  model?: string
  baseUrl?: string
  headers?: Record<string, string>

  // Advanced options
  maxRetries?: number
  timeout?: number
  cache?: CacheConfig
  rateLimit?: RateLimitConfig
  encryption?: EncryptionConfig
}
```

#### Supported Providers

- `openai` - OpenAI (GPT-4, GPT-3.5, DALL-E)
- `anthropic` - Anthropic (Claude)
- `google` - Google AI (Gemini, PaLM)
- `cohere` - Cohere
- `huggingface` - HuggingFace
- `replicate` - Replicate
- `stability` - Stability AI
- `elevenlabs` - ElevenLabs (TTS)
- `whisper` - OpenAI Whisper (STT)
- `custom` - Custom endpoints
- `local` - Local models

## Advanced Usage

### Rate Limiting

```typescript
await aiService.configure({
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 90000,
    strategy: "sliding-window"
  }
})
```

### Caching

```typescript
await aiService.configure({
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 100, // MB
    strategy: "lru"
  }
})
```

### Custom Provider

```typescript
import { AIProvider } from "~modules/ai/types"

class MyCustomProvider implements AIProvider {
  async generateText(prompt: string, options?: GenerateOptions) {
    // Your implementation
  }
}

aiService.registerProvider("my-provider", MyCustomProvider)
```

## Best Practices

1. **API Key Security**: Always use the encrypted storage option for API keys
2. **Rate Limiting**: Configure appropriate rate limits to avoid API quota issues
3. **Error Handling**: Always handle errors gracefully with fallback options
4. **Caching**: Enable caching for frequently used prompts
5. **Cost Management**: Monitor usage through the built-in analytics

## Examples

See the `examples` directory for complete examples:

- Text generation and chat
- Image generation gallery
- Voice assistant
- Code helper
- Document analyzer

## License

MIT
