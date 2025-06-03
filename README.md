// README.md

# 🚀 Ultimate AI Chrome Extension

> **The most comprehensive AI-powered Chrome Extension with advanced content extraction, analysis, and storage capabilities**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🎯 Overview

This is a production-ready Chrome extension template that integrates four powerful modules:

- **[@matthew.ngo/ai-toolkit](https://github.com/matthew.ngo/ai-toolkit)** - Multi-provider AI integration
- **[@matthew.ngo/chrome-storage](https://github.com/matthew.ngo/chrome-storage)** - Advanced storage with encryption
- **[@matthew.ngo/content-extractor](https://github.com/matthew.ngo/content-extractor)** - Intelligent content extraction
- **[@matthew.ngo/analysis-toolkit](https://github.com/matthew.ngo/analysis-toolkit)** - Comprehensive content analysis

## ✨ Key Features

### 🤖 AI Integration

- **Multi-Provider Support**: OpenAI, Anthropic, Google AI
- **Smart Caching**: Reduce API costs with intelligent response caching
- **Rate Limiting**: Automatic rate limiting and retry logic
- **Usage Tracking**: Monitor tokens, requests, and costs

### 📝 Content Extraction

- **Smart Extraction**: Automatically extract main content from any webpage
- **Site Adapters**: Optimized extraction for popular sites
- **Multiple Formats**: Export as JSON, Markdown, or HTML
- **Batch Processing**: Extract from multiple URLs simultaneously

### 📊 Content Analysis

- **AI Analysis**: Sentiment, tone, themes, and key points
- **NLP Processing**: Readability scores, keyword extraction, entity recognition
- **SEO Analysis**: Content optimization suggestions
- **Writing Quality**: Grammar, style, and coherence checks

### 💾 Advanced Storage

- **Encryption**: AES-GCM encryption for sensitive data
- **Compression**: Automatic compression for large data
- **Cross-Context Sync**: Real-time synchronization
- **Advanced Querying**: SQL-like queries with full-text search

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Chrome/Edge/Brave browser
- API keys for AI providers

### Installation

```bash
# Clone the template
git clone https://github.com/yourusername/ultimate-ai-chrome-extension.git
cd ultimate-ai-chrome-extension

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.development

# Fill in your API keys
code .env.development
```

### Required Environment Variables

```env
# AI Provider Keys
PLASMO_PUBLIC_OPENAI_API_KEY=sk-...
PLASMO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
PLASMO_PUBLIC_GOOGLE_AI_API_KEY=...

# Supabase (for auth)
PLASMO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PLASMO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Stripe (optional, for payments)
PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Encryption (auto-generated if not provided)
PLASMO_PUBLIC_ENCRYPTION_KEY=your-encryption-key
```

### Development

```bash
# Start development server
pnpm dev

# Load extension in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select build/chrome-mv3-dev folder
```

## 🏗️ Architecture

```
src/
├── core/                      # Core services
│   ├── ai-service.ts         # AI integration
│   ├── analysis-service.ts   # Content analysis
│   ├── content-extraction-service.ts
│   └── storage.ts           # Advanced storage
│
├── background/              # Background scripts
│   ├── index.ts            # Service initialization
│   └── messages/           # Message handlers
│
├── contents/               # Content scripts
│   └── ai-assistant-overlay.tsx  # AI overlay
│
├── popup/                  # Extension popup
├── sidepanel/             # Side panel (Chrome 114+)
├── newtab/                # New tab dashboard
├── options/               # Settings page
│
├── hooks/                 # React hooks
│   └── useIntegratedServices.ts
│
└── components/           # Shared UI components
```

## 📱 User Interface

### 1. **Popup** (Click extension icon)

- Quick access to extract & analyze current page
- AI chat interface
- Usage statistics

### 2. **Side Panel** (Chrome 114+)

- Full-featured AI assistant
- Saved content management
- History and analytics

### 3. **Content Overlay**

- Floating AI button on all pages
- Text selection quick actions
- Real-time AI assistance

### 4. **New Tab Dashboard**

- Usage statistics
- Quick links
- Recent activity
- AI tips

### 5. **Options Page**

- AI provider configuration
- Content extraction settings
- Analysis preferences
- Storage management

## 🔧 Core Features Usage

### AI Text Generation

```typescript
import { aiService } from "~core/ai-service"

// Generate text
const response = await aiService.generateText(
  "Write a summary of quantum computing",
  { temperature: 0.7, maxTokens: 200 }
)

// Summarize content
const summary = await aiService.summarize(longText, {
  style: "bullet",
  maxLength: 200
})

// Extract key points
const keyPoints = await aiService.extractKeyPoints(text)

// Analyze sentiment
const sentiment = await aiService.analyzeSentiment(text)
```

### Content Extraction

```typescript
import { contentExtractionService } from "~core/content-extraction-service"

// Extract from current tab
const result = await contentExtractionService.extractFromCurrentTab()

// Extract from URL
const content = await contentExtractionService.extractFromURL(
  "https://example.com"
)

// Extract and save
const saved = await contentExtractionService.extractAndSave(url, [
  "tag1",
  "tag2"
])

// Batch extraction
const results = await contentExtractionService.extractBatch(urls)
```

### Content Analysis

```typescript
import { analysisService } from "~core/analysis-service"

// Analyze text
const analysis = await analysisService.analyzeText(text, {
  includeNLP: true,
  includeReadability: true,
  includeKeywords: true
})

// Analyze current tab
const pageAnalysis = await analysisService.analyzeCurrentTab()

// SEO analysis
const seoAnalysis = await analysisService.analyzeSEO(content)

// Writing quality check
const quality = await analysisService.analyzeQuality(text)
```

### Advanced Storage

```typescript
import { aiAnalysisCache, savedContent } from "~core/storage"

// Save content with analysis
const saved = await savedContent.add({
  url: "https://example.com",
  title: "Example Article",
  content: extractedContent,
  analysis: analysisResult,
  tags: ["ai", "technology"]
})

// Search saved content
const results = await savedContent.search("quantum computing")

// Query with filters
const filtered = await savedContent.query({
  tags: { $contains: "ai" },
  createdAt: { $gte: new Date("2024-01-01") }
})
```

## 🎨 Customization

### Adding New AI Providers

```typescript
// In src/core/ai-service.ts
const providers = {
  openai: { models: [...] },
  anthropic: { models: [...] },
  google: { models: [...] },
  // Add your provider here
  custom: { models: ['custom-model'] }
}
```

### Custom Content Adapters

```typescript
// Create a new adapter
const customAdapter = {
  name: "my-site",
  patterns: [/mysite\.com/],
  priority: 10,

  extract(doc: Document, url: string) {
    // Custom extraction logic
    return {
      title: doc.querySelector("h1")?.textContent || ""
      // ... other fields
    }
  }
}

// Register it
contentExtractionService.registerAdapter(customAdapter)
```

### Custom Analysis Templates

```typescript
// Add custom analysis template
await analysisService.runCustomAnalysis("competitorAnalysis", {
  content: "Your content",
  competitors: ["url1", "url2"]
})
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

## 📦 Building & Deployment

```bash
# Build for all browsers
pnpm build

# Build for specific browser
pnpm build:chrome
pnpm build:firefox
pnpm build:edge

# Package for store submission
pnpm package
```

## 🔒 Security Best Practices

1. **API Keys**: Never commit API keys. Use environment variables.
2. **Encryption**: Enable encryption for sensitive data storage.
3. **Permissions**: Request only necessary permissions.
4. **Content Security**: Sanitize all user inputs and extracted content.

## 📊 Performance Optimization

1. **Caching**: AI responses are cached to reduce API calls
2. **Compression**: Large data is automatically compressed
3. **Lazy Loading**: Features load on-demand
4. **Debouncing**: Real-time features use debouncing

## 🐛 Troubleshooting

### Common Issues

**AI not working**

- Check API key configuration in Options
- Verify you're signed in
- Check usage limits

**Content extraction fails**

- Some sites may block extraction
- Try disabling ad blockers
- Check console for errors

**Storage quota exceeded**

- Clear old data in Options > Storage
- Enable automatic cleanup

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Plasmo Framework](https://www.plasmo.com/) for the extension framework
- [Shadcn UI](https://ui.shadcn.com/) for UI components
- All the amazing open source libraries used in this project

---

<div align="center">
  <p>Built with ❤️ using the power of AI</p>
  <p>
    <a href="https://github.com/yourusername/ultimate-ai-chrome-extension">GitHub</a> •
    <a href="https://discord.gg/yourcommunity">Discord</a> •
    <a href="https://twitter.com/yourusername">Twitter</a>
  </p>
</div>
