# AI/ML Integration Module - Enhanced Edition

A comprehensive AI module for Chrome extensions that supports multiple providers, custom API keys, and various AI capabilities with production-ready enhancements.

## 🚀 New Enhanced Features

### 1. **Intelligent Retry Mechanism**

- Exponential backoff with jitter
- Configurable retry conditions
- Smart error categorization

### 2. **Request Queue Management**

- Priority-based processing
- Concurrency control
- Real-time queue monitoring

### 3. **Token & Cost Optimization**

- Accurate token counting per model
- Automatic provider selection based on cost/quality
- Budget tracking and alerts

### 4. **Context Window Management**

- Smart compression strategies
- Importance-based message retention
- Sliding window with token limits

### 5. **Performance Monitoring**

- Real-time latency tracking
- Memory usage analysis
- Performance trend detection

### 6. **Advanced Error Handling**

- User-friendly error messages
- Actionable recommendations
- Automatic error categorization

### 7. **Debug Mode**

- Comprehensive request/response logging
- Performance bottleneck detection
- Export functionality

## 📦 Installation

```typescript
// src/options/index.tsx
import { AIProvider } from "~modules/ai"
import { AISettings, AIDebugPanel } from "~modules/ai/components"

function OptionsPage() {
  return (
    <AIProvider>
      <AISettings />
      {process.env.NODE_ENV === 'development' && <AIDebugPanel />}
    </AIProvider>
  )
}
```

## 🎯 Quick Start with Enhanced Features

### Basic Enhanced Usage

```typescript
import { useEnhancedAI } from "~modules/ai/hooks"

function MyComponent() {
  const { generateText, generateWithOptimization, queueStatus, performance } =
    useEnhancedAI({
      enableDebug: true,
      autoOptimize: true,
      performanceTracking: true
    })

  const handleGenerate = async () => {
    // Automatic optimization based on requirements
    const result = await generateWithOptimization("Your prompt", {
      maxCost: 0.05, // Maximum $0.05 per request
      minQuality: 0.85, // Minimum quality score
      maxLatency: 3000 // Maximum 3 seconds
    })

    console.log("Result:", result)
    console.log("Queue:", queueStatus)
    console.log("Performance:", performance)
  }
}
```

### Cost-Aware Generation

```typescript
import { useAICost } from "~modules/ai/hooks"

function BudgetAwareComponent() {
  const { estimateCost, totalSpent, setBudget, recommendations } = useAICost()

  // Set monthly budget
  setBudget(50) // $50/month

  const handleGenerate = async (prompt: string) => {
    // Get cost estimates before generating
    const estimates = await estimateCost(prompt)

    // Show estimates to user
    console.log("Estimated costs:", estimates)
    console.log("Total spent this month:", totalSpent)
    console.log("Budget recommendations:", recommendations)

    // Use cheapest option that meets quality requirements
    const suitable = estimates
      .filter((e) => e.recommendation !== "Expensive")
      .sort((a, b) => a.estimatedCost - b.estimatedCost)[0]

    if (suitable) {
      await generateText(prompt, {
        provider: suitable.provider,
        model: suitable.model
      })
    }
  }
}
```

### Context Management for Long Conversations

```typescript
import { useAIContext } from "~modules/ai/hooks"

function ChatWithMemory() {
  const { messages, addMessage, contextStats } = useAIContext(
    "chat-session-1",
    {
      maxTokens: 8000,
      model: "gpt-4",
      compressionStrategy: "importance"
    }
  )

  const sendMessage = async (content: string) => {
    // Add user message
    await addMessage({
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    })

    // Context is automatically managed
    console.log("Context stats:", contextStats)
    // { messageCount: 50, totalTokens: 7800, compressionApplied: true }

    // Generate response with managed context
    const response = await generateText(content, {
      messages // Automatically compressed messages
    })
  }
}
```

### Performance Monitoring

```typescript
import { useAIPerformance } from "~modules/ai/hooks"

function PerformanceAwareComponent() {
  const { metrics, measureOperation, startMonitoring } = useAIPerformance()

  // Start monitoring
  startMonitoring()

  const analyzeContent = async (content: string) => {
    // Measure specific operation
    const result = await measureOperation("content-analysis", async () => {
      return await generateText(`Analyze: ${content}`)
    })

    console.log("Performance metrics:", metrics)
    // {
    //   averageLatency: 1234,
    //   throughput: 150,
    //   memoryUsage: 45000000,
    //   trends: 'stable',
    //   recommendations: ['Consider caching frequent requests']
    // }

    return result
  }
}
```

## 🛠️ Configuration Presets

```typescript
import { AIPresets, configureAI } from "~modules/ai"

// Cost-optimized configuration
await configureAI(AIPresets.costOptimized)

// Performance-optimized configuration
await configureAI(AIPresets.performanceOptimized)

// Quality-optimized configuration
await configureAI(AIPresets.qualityOptimized)

// Development configuration with mocks
await configureAI(AIPresets.development)
```

## 🧪 Testing

```typescript
import { AITestingUtils } from "~modules/ai/utils"

describe("AI Feature", () => {
  const testUtils = new AITestingUtils()

  beforeEach(async () => {
    await testUtils.setupMockProvider({
      mockResponses: {
        "test prompt": "mock response"
      },
      delay: 100
    })
  })

  afterEach(async () => {
    await testUtils.resetMockProvider()
  })

  it("should handle rate limits", async () => {
    await testUtils.simulateRateLimit()

    // Test will automatically retry with backoff
    const result = await generateText("test")
    expect(result).toBeDefined()
  })
})
```

## 📊 Debug Panel

The AI Debug Panel provides real-time insights:

```typescript
import { AIDebugPanel } from "~modules/ai/components"

// Add to your dev tools
<AIDebugPanel />
```

Features:

- Request/response logs
- Performance metrics
- Queue visualization
- Error tracking
- Export functionality

## ⚡ Performance Best Practices

1. **Enable Intelligent Caching**

   ```typescript
   cache: { enabled: true, ttl: 3600, strategy: 'lru' }
   ```

2. **Use Request Prioritization**

   ```typescript
   const { generateText } = useEnhancedAI({
     queuePriority: RequestQueue.PRIORITY.HIGH
   })
   ```

3. **Implement Cost Budgets**

   ```typescript
   const { setBudget } = useAICost()
   setBudget(100) // $100 monthly limit
   ```

4. **Monitor Performance Trends**

   ```typescript
   const stats = enhancedAIService.getPerformanceStats()
   if (stats.trends.trend === "degrading") {
     // Take action
   }
   ```

5. **Use Context Compression**
   ```typescript
   const { messages } = useAIContext("chat", {
     compressionStrategy: "importance",
     maxTokens: 4000
   })
   ```

## 🔒 Security Features

- API key encryption with AES-256-GCM
- Secure token storage
- Request sanitization
- Debug log filtering

## 📈 Analytics & Insights

The module provides comprehensive analytics:

```typescript
const analytics = await enhancedAIService.getUsageStats()
console.log({
  totalTokens: analytics.tokensUsed,
  totalCost: analytics.costEstimate,
  byProvider: analytics.byProvider,
  errorRate: analytics.errors.length / analytics.requestsCount
})
```

## 🚀 Advanced Use Cases

### Batch Processing with Progress

```typescript
const { generateBatch } = useEnhancedAI()

const prompts = ["prompt1", "prompt2", "prompt3"]
const results = await generateBatch(prompts, {
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`)
  }
})
```

### Multi-Provider Fallback

```typescript
await configureAI({
  provider: "openai",
  fallbackProviders: ["anthropic", "google"]
  // Automatic fallback on failure
})
```

### Stream Processing with Error Recovery

```typescript
const stream = generateStream(prompt)

try {
  for await (const chunk of stream) {
    // Process chunk
  }
} catch (error) {
  if (error.isRetryable) {
    // Automatic retry with backoff
  }
}
```

## License

MIT
