
# 🚀 Fact-Check Companion - Implementation Guide

## 📋 Quick Start Checklist

### Week 1: Project Setup & Foundation
- [ ] Initialize project từ template
- [ ] Configure environment variables
- [ ] Set up fact-checking API accounts
- [ ] Implement basic content script
- [ ] Create claim detection prototype

### Week 2: Core Features
- [ ] Build claim highlighter component
- [ ] Integrate first fact-check API
- [ ] Implement credibility scoring
- [ ] Create popup interface
- [ ] Add basic caching

### Week 3: Enhanced UI/UX
- [ ] Design and implement tooltip system
- [ ] Build side panel interface
- [ ] Add question generation
- [ ] Implement settings page
- [ ] Create onboarding flow

### Week 4: Testing & Polish
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Bug fixes and refinements
- [ ] Prepare for release
- [ ] Documentation

---

## 🛠️ Step-by-Step Implementation

### Step 1: Initialize Project

```bash
# Clone and setup
./create-extension.sh

# Enter project details:
# Name: fact-check-companion
# Display: Fact-Check Companion
# Description: Real-time fact-checking and critical thinking assistant
# Include Supabase: Y (for caching and analytics)
# Include Stripe: N (free extension initially)
# Include Analytics: Y

cd fact-check-companion
```

### Step 2: Install Additional Dependencies

```bash
# NLP and Text Processing
pnpm add compromise natural chrono-node

# ML/AI Libraries
pnpm add @tensorflow/tfjs @tensorflow-models/universal-sentence-encoder

# Utilities
pnpm add fuse.js dompurify sanitize-html
pnpm add crypto-js axios-retry p-queue

# Development
pnpm add -D @types/natural @types/dompurify
```

### Step 3: Update Environment Variables

```bash
# .env.development
PLASMO_PUBLIC_EXTENSION_NAME="Fact-Check Companion"

# Fact-Checking APIs
PLASMO_PUBLIC_GOOGLE_FACTCHECK_API_KEY=your_google_api_key
PLASMO_PUBLIC_NEWSAPI_KEY=your_newsapi_key

# ML/AI Services (optional)
PLASMO_PUBLIC_OPENAI_API_KEY=your_openai_key # For question generation
PLASMO_PUBLIC_HUGGINGFACE_API_KEY=your_hf_key # For bias detection

# Analytics
PLASMO_PUBLIC_POSTHOG_KEY=your_posthog_key
```

### Step 4: Core Implementation Files

#### A. Claim Detector Service
```typescript
// src/core/analysis/claim-detector.ts
import nlp from 'compromise'
import * as tf from '@tensorflow/tfjs'

export class ClaimDetector {
  private model: tf.LayersModel | null = null

  async initialize() {
    // Load pre-trained model or use rule-based approach initially
    this.model = await tf.loadLayersModel('/models/claim-classifier/model.json')
  }

  detectClaims(text: string): Claim[] {
    const doc = nlp(text)
    const sentences = doc.sentences().out('array')

    return sentences
      .map(sentence => this.analyzeSentence(sentence))
      .filter(claim => claim.confidence > 0.7)
  }

  private analyzeSentence(sentence: string): Claim {
    // Rule-based detection for MVP
    const patterns = {
      statistical: /\b\d+(\.\d+)?%|\b\d+\s*(million|billion|thousand)/i,
      comparative: /\b(more|less|better|worse|higher|lower)\s+than\b/i,
      factual: /\b(is|are|was|were|has|have|had)\b.*\b(first|largest|smallest|only)\b/i,
      causal: /\b(because|due to|caused by|results in|leads to)\b/i
    }

    let claimType = null
    let confidence = 0

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(sentence)) {
        claimType = type
        confidence = 0.8
        break
      }
    }

    return {
      text: sentence,
      type: claimType,
      confidence,
      entities: this.extractEntities(sentence)
    }
  }

  private extractEntities(text: string) {
    const doc = nlp(text)
    return {
      people: doc.people().out('array'),
      places: doc.places().out('array'),
      organizations: doc.organizations().out('array'),
      dates: doc.dates().out('array'),
      numbers: doc.values().out('array')
    }
  }
}
```

#### B. Content Script Main
```typescript
// src/contents/detector.ts
import type { PlasmoCSConfig } from "plasmo"
import { ClaimDetector } from "~core/analysis/claim-detector"
import { Highlighter } from "./highlighter"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  exclude_matches: [
    "*://localhost/*",
    "*://*.google.com/*",
    "*://mail.google.com/*"
  ],
  run_at: "document_idle"
}

const detector = new ClaimDetector()
const highlighter = new Highlighter()

async function analyzePage() {
  // Skip if page doesn't look like an article
  if (!isArticlePage()) return

  // Get main content
  const content = extractMainContent()
  if (!content || content.length < 500) return

  // Detect claims
  await detector.initialize()
  const claims = detector.detectClaims(content)

  // Highlight claims in page
  highlighter.highlightClaims(claims)

  // Send to background for fact-checking
  chrome.runtime.sendMessage({
    type: "CLAIMS_DETECTED",
    claims: claims.map(c => ({
      text: c.text,
      type: c.type,
      entities: c.entities
    }))
  })
}

function isArticlePage(): boolean {
  // Check for article indicators
  const indicators = [
    document.querySelector('article'),
    document.querySelector('[role="article"]'),
    document.querySelector('.post-content'),
    document.querySelector('.article-body'),
    document.querySelector('main')
  ]

  return indicators.some(el => el !== null)
}

function extractMainContent(): string {
  // Try to find main content container
  const selectors = [
    'article',
    '[role="article"]',
    '.post-content',
    '.article-body',
    '.entry-content',
    'main'
  ]

  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element && element.textContent) {
      return element.textContent
    }
  }

  // Fallback to body
  return document.body.textContent || ''
}

// Run analysis when page loads
analyzePage()

// Re-run on dynamic content changes
const observer = new MutationObserver(() => {
  analyzePage()
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})
```

#### C. Highlighter Component
```typescript
// src/contents/highlighter.tsx
import { createRoot } from "react-dom/client"
import DOMPurify from "dompurify"

export class Highlighter {
  private highlights: Map<string, HTMLElement> = new Map()

  highlightClaims(claims: Claim[]) {
    claims.forEach(claim => {
      this.highlightText(claim)
    })
  }

  private highlightText(claim: Claim) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.textContent?.includes(claim.text)) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_REJECT
        }
      }
    )

    let node
    while (node = walker.nextNode()) {
      this.wrapClaimText(node as Text, claim)
    }
  }

  private wrapClaimText(textNode: Text, claim: Claim) {
    const span = document.createElement('span')
    span.className = 'fact-check-highlight'
    span.dataset.claimId = claim.id
    span.dataset.claimType = claim.type

    // Apply styling based on verification status
    span.style.cssText = `
      background-color: ${this.getHighlightColor(claim)};
      border-bottom: 2px solid ${this.getBorderColor(claim)};
      cursor: help;
      position: relative;
    `

    // Wrap the text
    const parent = textNode.parentNode
    parent?.insertBefore(span, textNode)
    span.appendChild(textNode)

    // Add hover tooltip
    span.addEventListener('mouseenter', (e) => {
      this.showTooltip(e.target as HTMLElement, claim)
    })

    span.addEventListener('mouseleave', () => {
      this.hideTooltip()
    })

    this.highlights.set(claim.id, span)
  }

  private getHighlightColor(claim: Claim): string {
    const colors = {
      verified: 'rgba(34, 197, 94, 0.2)',    // green
      disputed: 'rgba(251, 146, 60, 0.2)',   // orange
      false: 'rgba(239, 68, 68, 0.2)',       // red
      unverified: 'rgba(59, 130, 246, 0.2)', // blue
      opinion: 'rgba(147, 51, 234, 0.2)'     // purple
    }

    return colors[claim.status] || colors.unverified
  }
}
```

#### D. Fact-Check API Integration
```typescript
// src/api/fact-checkers/google.ts
export class GoogleFactCheckAPI {
  private apiKey: string
  private baseUrl = 'https://factchecktools.googleapis.com/v1alpha1/claims:search'

  constructor() {
    this.apiKey = process.env.PLASMO_PUBLIC_GOOGLE_FACTCHECK_API_KEY!
  }

  async search(query: string): Promise<FactCheckResult[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      query: query,
      languageCode: 'en'
    })

    try {
      const response = await fetch(`${this.baseUrl}?${params}`)
      const data = await response.json()

      return this.parseResults(data.claims || [])
    } catch (error) {
      console.error('Google Fact Check API error:', error)
      return []
    }
  }

  private parseResults(claims: any[]): FactCheckResult[] {
    return claims.map(claim => ({
      claim: claim.text,
      claimant: claim.claimant,
      claimDate: claim.claimDate,
      reviews: claim.claimReview?.map(review => ({
        publisher: review.publisher.name,
        url: review.url,
        rating: review.textualRating,
        title: review.title
      })) || []
    }))
  }
}
```

#### E. Side Panel UI
```typescript
// src/sidepanel/fact-results.tsx
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Badge } from "~components/ui/badge"
import { ExternalLink, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export function FactResults() {
  const [results, setResults] = useState<FactCheckResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for fact-check results
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "FACT_CHECK_RESULTS") {
        setResults(message.results)
        setLoading(false)
      }
    })

    // Request current results
    chrome.runtime.sendMessage({ type: "GET_CURRENT_RESULTS" })
  }, [])

  const getRatingIcon = (rating: string) => {
    const normalized = rating.toLowerCase()
    if (normalized.includes('true')) return <CheckCircle className="text-green-500" />
    if (normalized.includes('false')) return <XCircle className="text-red-500" />
    return <AlertCircle className="text-orange-500" />
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Fact-Check Results</span>
            <Badge variant="outline">{results.length} claims</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    {getRatingIcon(result.reviews[0]?.rating || 'unknown')}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{result.claim}</p>
                      <div className="mt-2 space-y-1">
                        {result.reviews.map((review, ridx) => (
                          <div key={ridx} className="flex items-center gap-2 text-xs">
                            <span className="font-medium">{review.publisher}:</span>
                            <span className={`
                              ${review.rating.toLowerCase().includes('true') ? 'text-green-600' : ''}
                              ${review.rating.toLowerCase().includes('false') ? 'text-red-600' : ''}
                              ${!review.rating.toLowerCase().includes('true') &&
                                !review.rating.toLowerCase().includes('false') ? 'text-orange-600' : ''}
                            `}>
                              {review.rating}
                            </span>
                            <a href={review.url} target="_blank" className="ml-auto">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No claims detected on this page.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 5: Testing Setup

```typescript
// src/__tests__/claim-detector.test.ts
import { ClaimDetector } from '~core/analysis/claim-detector'

describe('ClaimDetector', () => {
  let detector: ClaimDetector

  beforeEach(() => {
    detector = new ClaimDetector()
  })

  test('detects statistical claims', () => {
    const text = "Unemployment fell to 3.5% last month."
    const claims = detector.detectClaims(text)

    expect(claims).toHaveLength(1)
    expect(claims[0].type).toBe('statistical')
    expect(claims[0].confidence).toBeGreaterThan(0.7)
  })

  test('detects comparative claims', () => {
    const text = "This year's growth is higher than last year."
    const claims = detector.detectClaims(text)

    expect(claims).toHaveLength(1)
    expect(claims[0].type).toBe('comparative')
  })

  test('extracts entities correctly', () => {
    const text = "President Biden announced the plan in Washington."
    const claims = detector.detectClaims(text)

    expect(claims[0].entities.people).toContain('President Biden')
    expect(claims[0].entities.places).toContain('Washington')
  })
})
```

---

## 🎯 MVP Features Priority

### Must Have (Week 1-2)
1. ✅ Basic claim detection (rule-based)
2. ✅ Visual highlighting
3. ✅ Google Fact Check API integration
4. ✅ Simple popup summary
5. ✅ Basic caching

### Should Have (Week 3)
1. ⏳ Credibility scoring
2. ⏳ Multiple fact-check sources
3. ⏳ Question generation
4. ⏳ Side panel interface
5. ⏳ Settings page

### Nice to Have (Week 4+)
1. ⏳ ML-based claim detection
2. ⏳ Bias analysis
3. ⏳ Social sharing
4. ⏳ Export reports
5. ⏳ Learning mode

---

## 🚦 Development Workflow

### Daily Tasks
```bash
# Start development
pnpm dev

# Run tests continuously
pnpm test:watch

# Check TypeScript
pnpm type-check

# Format code
pnpm format
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/claim-detection

# Commit with conventional commits
git commit -m "feat: add claim detection algorithm"
git commit -m "fix: improve entity extraction accuracy"
git commit -m "docs: update API documentation"

# Create PR
gh pr create --title "Add claim detection" --body "..."
```

---

## 📚 Resources & References

### Fact-Checking APIs
- [Google Fact Check Tools API](https://developers.google.com/fact-check/tools/api)
- [PolitiFact API](https://www.politifact.com/api/)
- [Snopes API](https://www.snopes.com/api/)
- [FactCheck.org](https://www.factcheck.org/)

### NLP Libraries
- [Compromise.js Docs](https://compromise.cool/)
- [Natural Language Toolkit](https://github.com/NaturalNode/natural)
- [spaCy.js](https://github.com/spacy-io/spacy-js)

### ML Resources
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Hugging Face Models](https://huggingface.co/models)

### UI/UX Inspiration
- [Hypothesis](https://web.hypothes.is/) - Web annotation
- [Genius](https://genius.com/) - Text annotation
- [FactStream](https://factstream.co/) - Real-time fact-checking

---

## 🆘 Common Issues & Solutions

### Issue: Content script not injecting
```javascript
// Solution: Check URL patterns and permissions
// manifest.json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "exclude_matches": ["*://*.pdf", "*://*.xml"],
    "run_at": "document_idle"
  }]
}
```

### Issue: API rate limiting
```javascript
// Solution: Implement caching and rate limiting
import pQueue from 'p-queue'

const queue = new pQueue({
  concurrency: 2,
  interval: 1000,
  intervalCap: 5
})
```

### Issue: Performance on large pages
```javascript
// Solution: Lazy loading and pagination
const BATCH_SIZE = 10
const claims = await detector.detectClaims(text)
const batches = chunk(claims, BATCH_SIZE)

for (const batch of batches) {
  await processBatch(batch)
  await delay(100) // Prevent blocking
}
```

---

Ready to build! 🚀 Bắt đầu với MVP features và iterate dựa trên user feedback.
