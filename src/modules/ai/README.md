# AI/ML Integration Module

This module provides AI capabilities for your Chrome extension including text generation, summarization, classification, and embeddings.

## Setup

1. Install the module in your extension:

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

2. Use AI features in your components:

import { useAI } from "~modules/ai/hooks/useAI"

function MyComponent() {
  const { generateText, summarize } = useAI()

  const handleClick = async () => {
    const result = await generateText("Write a haiku about browser extensions")
    console.log(result)
  }
}
