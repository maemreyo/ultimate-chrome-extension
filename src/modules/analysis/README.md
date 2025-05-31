Tôi sẽ triển khai module Analysis Engine và **tích hợp với module AI đã triển khai trước đó**. Module này sẽ sử dụng AI service để thực hiện các phân tích chuyên sâu với prompt templates được thiết kế sẵn.## Analysis Engine Module

Module này cung cấp một engine phân tích mạnh mẽ, tích hợp với AI module để thực hiện các phân tích chuyên sâu về content, sentiment, SEO, readability, fact-checking, và bias detection.

### ✨ Core Features

- 📝 **Multiple Analysis Types**: Content, Sentiment, SEO, Readability, Fact-check, Bias detection
- 🎯 **Smart Prompt Templates**: Pre-built templates cho từng loại phân tích
- 🤖 **AI Integration**: Tích hợp sẵn với AI module đã triển khai
- 📊 **Structured Results**: Parse và format kết quả thành sections, metrics, recommendations
- 💾 **Export Options**: Export sang PDF, HTML, Markdown, JSON
- 🔄 **Streaming Support**: Real-time streaming cho phân tích dài
- 📈 **History Tracking**: Lưu lịch sử và kết quả phân tích
- 🎨 **UI Components**: Sẵn sàng tích hợp vào giao diện

### 📦 Installation

```bash
# Add dependencies
pnpm add uuid
```

### 🚀 Usage Examples

#### Basic Analysis

```typescript
import { analysisEngine } from '~modules/analysis'

// Run content analysis
const result = await analysisEngine.analyze({
  type: 'content',
  inputs: {
    content: 'Your article text here...'
  },
  options: {
    depth: 'detailed',
    includeRecommendations: true
  }
})

console.log(result.sections)
console.log(result.recommendations)
```

#### Using React Hooks

```typescript
import { useAnalysis } from '~modules/analysis/hooks'

function ContentAnalyzer() {
  const { analyze, result, loading, error } = useAnalysis()

  const handleAnalyze = async () => {
    await analyze('sentiment', {
      text: 'I love this product! It works perfectly.'
    })
  }

  return (
    <div>
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Sentiment'}
      </button>

      {result && (
        <div>
          <h3>Sentiment: {result.output.overall}</h3>
          <p>Score: {result.output.score}</p>
        </div>
      )}
    </div>
  )
}
```

#### Streaming Analysis

```typescript
import { useAnalysisStream } from '~modules/analysis/hooks'

function StreamingAnalyzer() {
  const { result, streaming, startStream, stopStream } = useAnalysisStream()

  const handleStream = () => {
    startStream({
      type: 'content',
      inputs: { content: longText }
    })
  }

  return (
    <div>
      {streaming && <button onClick={stopStream}>Stop</button>}
      {result?.sections?.map(section => (
        <div key={section.id}>{section.content}</div>
      ))}
    </div>
  )
}
```

### 🎯 Analysis Types

#### 1. Content Analysis
```typescript
await analysisEngine.analyze({
  type: 'content',
  inputs: {
    content: 'Article text...'
  }
})
// Returns: Overview, key points, quality metrics, recommendations
```

#### 2. Sentiment Analysis
```typescript
await analysisEngine.analyze({
  type: 'sentiment',
  inputs: {
    text: 'Customer review...',
    contextualFactors: 'Product launch context'
  }
})
// Returns: Overall sentiment, emotions, confidence scores
```

#### 3. SEO Analysis
```typescript
await analysisEngine.analyze({
  type: 'seo',
  inputs: {
    content: '<html>...</html>',
    title: 'Page Title',
    metaDescription: 'Description',
    keywords: ['keyword1', 'keyword2']
  }
})
// Returns: SEO score, issues, keyword analysis, recommendations
```

#### 4. Readability Analysis
```typescript
await analysisEngine.analyze({
  type: 'readability',
  inputs: {
    text: 'Document text...',
    targetAudience: 'general public'
  }
})
// Returns: Reading level, complexity metrics, suggestions
```

#### 5. Fact Check Analysis
```typescript
await analysisEngine.analyze({
  type: 'factCheck',
  inputs: {
    content: 'Article with claims...'
  }
})
// Returns: Identified claims, verifiability, red flags
```

#### 6. Bias Detection
```typescript
await analysisEngine.analyze({
  type: 'bias',
  inputs: {
    content: 'News article...',
    author: 'Author Name',
    source: 'Publication'
  }
})
// Returns: Bias types, examples, severity, neutral alternatives
```

### 🎨 UI Components

#### Analysis Runner
```typescript
import { AnalysisProvider } from '~modules/analysis'
import { AnalysisRunner } from '~modules/analysis/components'

function App() {
  return (
    <AnalysisProvider>
      <AnalysisRunner />
    </AnalysisProvider>
  )
}
```

#### Analysis History
```typescript
import { AnalysisHistory } from '~modules/analysis/components'

// Shows all past analyses with search, filter, and view options
<AnalysisHistory />
```

### 🛠️ Custom Analysis Types

```typescript
// Register custom analysis type
analysisEngine.registerAnalysisType({
  id: 'plagiarism',
  name: 'Plagiarism Check',
  description: 'Check for potential plagiarism',
  category: 'custom',
  requiredInputs: [{
    name: 'text',
    type: 'text',
    required: true
  }],
  outputFormat: {
    type: 'structured',
    sections: ['matches', 'score', 'sources']
  },
  aiRequired: true
}, {
  id: 'plagiarism',
  name: 'Plagiarism Check',
  template: 'Check the following text for potential plagiarism...',
  variables: [{
    name: 'text',
    type: 'string',
    required: true
  }]
})
```

### 📊 Result Structure

```typescript
interface AnalysisResult {
  id: string
  type: string
  status: 'completed' | 'failed' | 'processing'
  sections: [{
    id: string
    title: string
    content: any // Can be text, metrics, table, list
    type: 'text' | 'metric' | 'table' | 'list' | 'chart'
  }]
  recommendations: [{
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    actionable: boolean
  }]
  metadata: {
    duration: number
    tokensUsed: number
    model: string
  }
}
```

### 🔧 Advanced Configuration

```typescript
// Configure analysis engine
const request: AnalysisRequest = {
  type: 'content',
  inputs: { content: text },
  options: {
    language: 'en',
    depth: 'detailed', // 'quick' | 'standard' | 'detailed'
    includeRecommendations: true,
    includeSources: true,
    customPrompt: 'Focus on technical accuracy'
  }
}
```

### 📤 Export Formats

```typescript
// Export analysis results
const markdown = ResultFormatter.export(result, 'markdown')
const html = ResultFormatter.export(result, 'html')
const pdf = ResultFormatter.export(result, 'pdf')
const json = ResultFormatter.export(result, 'json')
```

### 🎯 Best Practices

1. **Choose Right Analysis Type**: Each type is optimized for specific use cases
2. **Provide Context**: More context = better analysis results
3. **Use Streaming**: For long content to show progress
4. **Cache Results**: Analysis results are automatically stored in history
5. **Export Important Results**: Keep records of critical analyses

### 🧪 Testing

```typescript
// Mock analysis engine for tests
jest.mock('~modules/analysis', () => ({
  analysisEngine: {
    analyze: jest.fn().mockResolvedValue({
      id: 'test-id',
      type: 'content',
      status: 'completed',
      sections: [],
      recommendations: []
    })
  }
}))
```

Module này cung cấp một platform phân tích toàn diện, có thể mở rộng và tùy chỉnh cho nhiều use cases khác nhau! 🚀
