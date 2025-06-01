# AI Module Enhancements Documentation

## Overview

The enhanced AI module provides advanced features for production-ready AI integration in Chrome extensions.

## Key Features

### 1. Retry Mechanism

- Automatic retry with exponential backoff
- Configurable retry conditions
- Jitter to prevent thundering herd

```typescript
const result = await enhancedAIService.generateText(prompt, {
  retry: {
    maxRetries: 5,
    backoff: "exponential"
  }
})
```

### 2. Request Queue

- Priority-based queue management
- Concurrency control
- Real-time queue status

```typescript
const { generateText, queueStatus } = useEnhancedAI({
  queuePriority: RequestQueue.PRIORITY.HIGH
})
```

### 3. Token Management

- Accurate token counting per model
- Context window management
- Automatic truncation

```typescript
const tokenInfo = tokenManager.getTokenInfo(text, "gpt-4")
// { count: 1234, truncated: false }
```

### 4. Cost Optimization

- Automatic provider selection based on requirements
- Cost estimation and tracking
- Budget management

```typescript
const result = await generateWithOptimization(prompt, {
  maxCost: 0.05,
  minQuality: 0.8
})
```

### 5. Performance Monitoring

- Real-time latency tracking
- Memory usage monitoring
- Performance trend analysis

```typescript
const { metrics, measureOperation } = useAIPerformance()
const result = await measureOperation("analysis", async () => {
  return await analyzeContent(text)
})
```

### 6. Debug Mode

- Comprehensive logging
- Request/response tracking
- Export functionality

```typescript
enhancedAIService.enableDebugMode({
  filters: ["error", "performance"]
})
```

## Usage Examples

### Basic Enhanced Usage

```typescript
import { useEnhancedAI } from "~modules/ai/hooks"

function MyComponent() {
  const { generateText, performance, queueStatus } = useEnhancedAI({
    enableDebug: true,
    autoOptimize: true
  })

  const handleGenerate = async () => {
    const result = await generateText("Your prompt")
    console.log("Latency:", performance.lastOperation.duration)
  }
}
```

### Cost-Aware Generation

```typescript
import { useAICost } from "~modules/ai/hooks"

function CostAwareComponent() {
  const { estimateCost, totalSpent, setBudget } = useAICost()

  setBudget(10) // $10 budget

  const handleGenerate = async (prompt: string) => {
    const estimates = await estimateCost(prompt)
    const cheapest = estimates.sort(
      (a, b) => a.estimatedCost - b.estimatedCost
    )[0]

    // Use the cheapest provider
    await generateText(prompt, { provider: cheapest.provider })
  }
}
```

### Context Management

```typescript
import { useAIContext } from '~modules/ai/hooks'

function ChatComponent() {
  const { messages, addMessage, contextStats } = useAIContext('chat-1', {
    maxTokens: 4000,
    compressionStrategy: 'importance'
  })

  // Automatically manages context window
  await addMessage({ role: 'user', content: 'Hello!' })
}
```

## Performance Tips

1. **Enable Caching**: Reduces API calls for repeated queries
2. **Use Request Queue**: Prevents rate limiting
3. **Monitor Performance**: Track and optimize slow operations
4. **Set Budgets**: Prevent unexpected costs
5. **Use Mock Provider**: For development and testing

## Error Handling

The enhanced error handler provides:

- Categorized errors
- User-friendly messages
- Actionable recommendations
- Retry guidance

```typescript
try {
  await generateText(prompt)
} catch (error) {
  console.log(error.userMessage) // "API key is invalid..."
  console.log(error.recommendations) // ["Check your settings..."]
  console.log(error.isRetryable) // true/false
}
```
