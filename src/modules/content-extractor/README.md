# Content Extractor Module

This module provides powerful content extraction capabilities for web pages, allowing you to extract clean, structured content from HTML.

## Features

- 📝 **Text Extraction**: Extract clean text content from web pages
- 🔍 **Paragraph Detection**: Identify and extract paragraphs with metadata
- 🧹 **Content Cleaning**: Remove ads, navigation, and other clutter
- 📊 **Section Detection**: Automatically detect content sections
- 🌐 **Site Adapters**: Specialized extractors for common sites (Medium, Substack, etc.)
- 🔄 **URL Handling**: Convert relative URLs to absolute

## Installation

```bash
# Install dependencies
pnpm add @mozilla/readability dompurify
```

## Usage

### Basic Content Extraction

```typescript
import { contentExtractor } from '~modules/content-extractor';

// Extract content from HTML
const result = await contentExtractor.extract(html, url, {
  cleaningOptions: {
    removeAds: true,
    removeNavigation: true,
    preserveImages: true
  },
  detectSections: true
});

console.log(result.title);
console.log(result.cleanText);
console.log(result.sections);
```

### Using Site Adapters

```typescript
import { contentExtractor } from '~modules/content-extractor';
import { mediumAdapter } from '~modules/content-extractor/site-adapters';

// Register custom adapter
contentExtractor.registerAdapter(mediumAdapter);

// Extract from Medium article
const result = await contentExtractor.extract(html, 'https://medium.com/article-url');
```

### Paragraph Detection

```typescript
import { paragraphDetector } from '~modules/content-extractor';

// Detect paragraphs in HTML
const paragraphs = paragraphDetector.detect(document, {
  minLength: 50,
  scoreImportance: true
});

// Get most important paragraphs
const important = paragraphs.filter(p => p.importance > 0.7);
```

### Content Cleaning

```typescript
import { contentCleaner } from '~modules/content-extractor';

// Clean HTML content
const cleanHtml = contentCleaner.clean(html, {
  removeAds: true,
  removeNavigation: true,
  removeComments: true,
  preserveImages: true
});
```

## API Reference

### Main Exports

- `contentExtractor`: Main service for extracting content
- `textExtractor`: Extracts text from HTML
- `paragraphDetector`: Detects paragraphs in HTML
- `contentCleaner`: Cleans HTML content

### Types

```typescript
interface ExtractedContent {
  title: string;
  paragraphs: Paragraph[];
  cleanText: string;
  metadata: ContentMetadata;
  sections: Section[];
  readingTime: number;
  wordCount: number;
  language: string;
}

interface Paragraph {
  id: string;
  text: string;
  html: string;
  index: number;
  element: string; // CSS selector
  bounds: DOMRect;
  section?: string;
  isQuote: boolean;
  isCode: boolean;
  isHeading: boolean;
  headingLevel?: number;
  importance: number; // 0-1 score
}

interface ExtractionOptions {
  adapter?: string;
  cleaningOptions?: Partial<CleaningOptions>;
  minParagraphLength?: number;
  includeMetadata?: boolean;
  detectSections?: boolean;
  scoreParagraphs?: boolean;
}
```

## Site Adapters

The module includes specialized adapters for common sites:

- Medium
- Substack
- News sites

You can create custom adapters:

```typescript
import { SiteAdapter } from '~modules/content-extractor/types';

const customAdapter: SiteAdapter = {
  name: 'custom-site',
  patterns: [/example\.com/],
  extract(doc: Document) {
    return {
      title: doc.querySelector('h1')?.textContent || '',
      // Extract other content
    };
  },
  cleanContent(content: string) {
    // Custom cleaning logic
    return cleanedContent;
  }
};

contentExtractor.registerAdapter(customAdapter);
```

## Best Practices

1. **Use Site Adapters** for popular sites for best results
2. **Clean Content** to remove ads and clutter
3. **Detect Sections** for better content structure
4. **Score Paragraphs** to identify important content
