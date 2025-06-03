// INTEGRATION_GUIDE.md

# 🔧 Ultimate AI Chrome Extension - Integration Setup Guide

This guide walks you through integrating all the AI modules into your Chrome extension step by step.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ and pnpm installed
- ✅ The base `ultimate-chrome-extension` template
- ✅ API keys for AI providers (OpenAI, Anthropic, or Google)
- ✅ A Supabase account (for authentication)

## 🚀 Step-by-Step Integration

### Step 1: Install Dependencies

```bash
# Navigate to your project
cd ultimate-chrome-extension

# Install the AI modules
pnpm add @matthew.ngo/ai-toolkit @matthew.ngo/chrome-storage @matthew.ngo/content-extractor @matthew.ngo/analysis-toolkit

# Install additional dependencies
pnpm add compromise franc handlebars highlight.js js-yaml lru-cache marked natural sanitize-html sentiment turndown verror

# Install type definitions
pnpm add -D @types/handlebars @types/js-yaml @types/natural @types/sanitize-html @types/sentiment @types/turndown @types/verror
```

### Step 2: Update Package.json

Update your `package.json` with the integrated version from the artifacts above. Key changes:

- Added all module dependencies
- Updated scripts
- Added manifest permissions

### Step 3: Set Up Core Services

1. **Replace/Update Storage Service** (`src/core/storage.ts`):

   - Copy the integrated storage service code
   - This adds encryption, compression, and advanced features

2. **Add AI Service** (`src/core/ai-service.ts`):

   - Copy the integrated AI service code
   - Handles multi-provider AI with caching

3. **Add Content Extraction Service** (`src/core/content-extraction-service.ts`):

   - Copy the integrated content extraction code
   - Provides smart content extraction

4. **Add Analysis Service** (`src/core/analysis-service.ts`):
   - Copy the integrated analysis service code
   - Enables comprehensive content analysis

### Step 4: Update Background Script

Replace `src/background/index.ts` with the integrated version that:

- Initializes all services on startup
- Sets up enhanced context menus
- Handles authentication state changes

### Step 5: Add Message Handlers

Create `src/background/messages/integrated-handlers.ts` with all the message handlers for:

- AI operations
- Content extraction
- Analysis
- Storage operations

### Step 6: Create React Hooks

Add `src/hooks/useIntegratedServices.ts` for easy access to all features in React components.

### Step 7: Update UI Components

1. **Popup** (`src/popup/index.tsx`):

   - Replace with integrated version
   - Adds AI features and content extraction

2. **Options Page** (`src/options/index.tsx`):

   - Replace with integrated version
   - Adds AI configuration and settings

3. **Side Panel** (`src/sidepanel/index.tsx`):

   - Replace with integrated version
   - Full-featured AI assistant panel

4. **New Tab** (`src/newtab/index.tsx`):
   - Replace with integrated version
   - AI dashboard and statistics

### Step 8: Add Content Script

Create `src/contents/ai-assistant-overlay.tsx` for the floating AI assistant on web pages.

### Step 9: Environment Configuration

Create `.env.development` with your API keys:

```env
# AI Providers
PLASMO_PUBLIC_OPENAI_API_KEY=sk-...
PLASMO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
PLASMO_PUBLIC_GOOGLE_AI_API_KEY=...

# Supabase
PLASMO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PLASMO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Encryption (optional - will auto-generate)
PLASMO_PUBLIC_ENCRYPTION_KEY=your-32-char-key

# Optional
PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Step 10: Configure AI Provider

1. Start the extension: `pnpm dev`
2. Load in Chrome: `chrome://extensions/` → Load unpacked → Select `build/chrome-mv3-dev`
3. Click extension icon → Sign in
4. Go to Options page
5. Configure your AI provider and API key
6. Test the configuration

## 🧪 Testing the Integration

### 1. Test AI Features

```javascript
// In popup or content script
const response = await sendToBackground({
  name: "ai-generate",
  body: {
    prompt: "Hello, AI!",
    options: { temperature: 0.7 }
  }
})
console.log(response)
```

### 2. Test Content Extraction

```javascript
// Extract current tab
const result = await sendToBackground({
  name: "extract-content",
  body: { method: "currentTab" }
})
console.log(result.data)
```

### 3. Test Analysis

```javascript
// Analyze text
const analysis = await sendToBackground({
  name: "analyze-content",
  body: {
    content: "Your text here",
    options: { includeNLP: true }
  }
})
console.log(analysis)
```

### 4. Test Storage

```javascript
// Save content
const saved = await sendToBackground({
  name: "save-content",
  body: {
    url: "https://example.com",
    title: "Test",
    content: { text: "..." },
    tags: ["test"]
  }
})
console.log(saved)
```

## 🎨 Customization Options

### Custom AI Models

```typescript
// In src/core/ai-service.ts
const getDefaultModel = (provider: string): string => {
  switch (provider) {
    case "openai":
      return "gpt-4" // Change from gpt-3.5-turbo
    case "anthropic":
      return "claude-3-opus-20240229" // Use Opus instead
    // Add more providers
  }
}
```

### Custom Extraction Rules

```typescript
// In src/core/content-extraction-service.ts
const customRules = {
  "example.com": {
    titleSelector: ".custom-title",
    contentSelector: ".custom-content",
    removeSelectors: [".ads", ".sidebar"]
  }
}
```

### Custom Analysis Templates

```typescript
// In src/core/analysis-service.ts
const customTemplates = {
  myTemplate: `
    Analyze this for {{customField}}:
    {{content}}
  `
}
```

## 🚨 Common Issues & Solutions

### Issue: AI not responding

**Solution:**

1. Check API key in Options
2. Verify provider is supported
3. Check console for errors
4. Ensure you're authenticated

### Issue: Content extraction fails

**Solution:**

1. Check if site blocks extensions
2. Try different extraction options
3. Check permissions in manifest

### Issue: Storage quota exceeded

**Solution:**

1. Enable compression in settings
2. Clear old cached data
3. Implement auto-cleanup

### Issue: High API costs

**Solution:**

1. Enable caching (reduces duplicate calls)
2. Use cheaper models (gpt-3.5 vs gpt-4)
3. Implement rate limiting
4. Monitor usage in dashboard

## 📊 Performance Optimization

### 1. Enable Caching

```typescript
// Already enabled by default
cache: {
  enabled: true,
  ttl: 3600000, // 1 hour
  strategy: 'lru'
}
```

### 2. Optimize Extraction

```typescript
// Extract only what you need
const options = {
  includeMetadata: false, // Skip if not needed
  detectSections: false, // Skip section detection
  extractTables: false // Skip table extraction
}
```

### 3. Batch Operations

```typescript
// Process multiple items at once
const results = await analysisService.analyzeBulk(contents)
```

## 🔐 Security Best Practices

1. **Never expose API keys in content scripts**
2. **Always use message passing to background script**
3. **Enable encryption for sensitive data**
4. **Validate all inputs before processing**
5. **Sanitize extracted content before display**

## 📈 Monitoring & Analytics

### Track Usage

```typescript
// Get AI usage stats
const stats = await aiService.getUsageStats()
console.log("Tokens used:", stats.tokensUsed)
console.log("Cost estimate:", stats.costEstimate)
```

### Monitor Performance

```typescript
// Check cache hit rate
const cacheStats = extractor.getCacheStats()
console.log("Cache hit rate:", cacheStats.hitRate)
```

### Export Analytics

```typescript
// Export analysis reports
const report = await analysisService.exportReport(
  analyses,
  "html" // or 'markdown', 'json'
)
```

## 🎯 Next Steps

1. **Customize UI** - Modify components to match your brand
2. **Add Features** - Extend with your own functionality
3. **Set Up Analytics** - Track user behavior
4. **Implement Payments** - Monetize with Stripe
5. **Deploy** - Publish to Chrome Web Store

## 📚 Additional Resources

- [AI Toolkit Documentation](https://github.com/matthew.ngo/ai-toolkit)
- [Chrome Storage Documentation](https://github.com/matthew.ngo/chrome-storage)
- [Content Extractor Documentation](https://github.com/matthew.ngo/content-extractor)
- [Analysis Toolkit Documentation](https://github.com/matthew.ngo/analysis-toolkit)
- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)

## 🆘 Need Help?

- Check the [FAQ](FAQ.md)
- Join our [Discord Community](https://discord.gg/yourcommunity)
- Open an [Issue](https://github.com/yourusername/ultimate-ai-chrome-extension/issues)

---

Happy coding! 🚀
