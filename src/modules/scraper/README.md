## Web Scraping & Content Extraction Module

Module này cung cấp khả năng extract và xử lý nội dung từ web pages với nhiều tính năng mạnh mẽ.

### ✨ Core Features

- 📖 **Article Extraction**: Clean article content với Readability
- 🏷️ **Metadata Extraction**: Title, description, Open Graph, Twitter Cards
- 🖼️ **Image Extraction**: Với full metadata (size, type, alt text)
- 🔗 **Link Analysis**: Phân loại internal/external, download links
- 📊 **Table Extraction**: Extract data từ HTML tables
- 🔍 **Structured Data**: JSON-LD, Microdata, RDFa
- 📸 **Screenshot Capture**: Capture visible area hoặc full page
- 🤖 **Template Scraping**: Define reusable scraping templates
- 💾 **Smart Caching**: Cache results để improve performance
- 📤 **Export Options**: JSON, CSV, Markdown formats

### 📦 Installation

Thêm dependencies vào `package.json`:

```json
{
  "dependencies": {
    "@mozilla/readability": "^0.4.4",
    "dompurify": "^3.0.6",
    "cheerio": "^1.0.0-rc.12"
  }
}
```

### 🚀 Usage Examples

#### Article Extraction

```typescript
import { useArticleReader } from '~modules/scraper/hooks'

function ReadingMode() {
  const { article, loading, extractFromCurrentTab } = useArticleReader(true)

  if (loading) return <div>Extracting article...</div>

  if (!article) return <div>No article found</div>

  return (
    <article>
      <h1>{article.title}</h1>
      <p>By {article.author} • {article.estimatedReadTime} min read</p>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  )
}
```

#### Web Scraping

```typescript
import { scraperService } from '~modules/scraper'

// Scrape with template
const result = await scraperService.scrapeUrl('https://example.com/product', {
  template: 'ecommerce-product',
  useCache: true
})

// Custom scraping
const scraper = new WebScraper()
const data = await scraper.scrape('https://example.com', {
  customRules: [
    { name: 'title', selector: 'h1', multiple: false },
    { name: 'price', selector: '.price', multiple: false },
    { name: 'images', selector: 'img', attribute: 'src', multiple: true }
  ]
})
```

#### Dynamic Content Scraping

```typescript
// Scrape current tab with wait for dynamic content
const result = await scraper.scrapeDynamic(tabId, {
  waitForSelector: '.dynamic-content',
  timeout: 5000,
  extractOptions: {
    includeImages: true,
    includeTables: true
  }
})
```

#### Batch Scraping

```typescript
// Scrape multiple URLs with concurrency control
const urls = ['url1', 'url2', 'url3', '...']
const results = await scraper.scrapeMultiple(urls, {
  template: 'news-article',
  parallel: true,
  maxConcurrency: 3
})
```

### 🎨 UI Components

#### Scraper UI

```typescript
import { ScraperUI } from '~modules/scraper/components'

// Full-featured scraper interface
<ScraperUI />
```

Features:
- URL input với instant scraping
- Current tab scraping
- Results viewer với tabs
- Export options (JSON, CSV, Markdown)
- Image gallery
- Link explorer
- Structured data viewer

#### Article Reader UI

```typescript
import { ArticleReaderUI } from '~modules/scraper/components'

// Clean reading experience
<ArticleReaderUI />
```

Features:
- Auto-extract từ current tab
- Reading statistics
- Summary generation
- Markdown export
- Clean, distraction-free reading

### 📋 Scraping Templates

Pre-built templates cho common use cases:

```typescript
// E-commerce Product
scraper.addTemplate({
  name: 'ecommerce-product',
  rules: [
    { name: 'title', selector: 'h1, [itemprop="name"]' },
    { name: 'price', selector: '[itemprop="price"], .price' },
    { name: 'images', selector: 'img', attribute: 'src', multiple: true },
    { name: 'rating', selector: '[itemprop="ratingValue"]' }
  ]
})

// News Article
scraper.addTemplate({
  name: 'news-article',
  rules: [
    { name: 'headline', selector: 'h1, [itemprop="headline"]' },
    { name: 'author', selector: '[itemprop="author"], .author' },
    { name: 'publishDate', selector: 'time[datetime]', attribute: 'datetime' },
    { name: 'content', selector: '[itemprop="articleBody"]' }
  ]
})
```

### 🔧 Advanced Features

#### Content Cleaning

```typescript
const extractor = new ContentExtractor(html, url, {
  cleanHTML: true, // Remove dangerous tags
  absoluteUrls: true, // Convert relative URLs to absolute
  includeMetadata: true
})
```

#### Metadata Extraction

```typescript
const metadata = extractor.extractMetadata()
// Returns:
{
  title: "Page Title",
  description: "Meta description",
  keywords: ["keyword1", "keyword2"],
  openGraph: {
    title: "OG Title",
    image: "https://example.com/image.jpg",
    type: "article"
  },
  twitter: {
    card: "summary_large_image",
    creator: "@username"
  },
  jsonLd: [/* structured data */]
}
```

#### Table Data Extraction

```typescript
const tables = extractor.extractTables()
// Returns:
[{
  headers: ["Name", "Price", "Stock"],
  rows: [
    ["Product 1", "$99", "In Stock"],
    ["Product 2", "$149", "Out of Stock"]
  ],
  caption: "Product Inventory"
}]
```

### 📊 Export Formats

#### JSON Export
```json
{
  "url": "https://example.com",
  "title": "Article Title",
  "article": {
    "content": "...",
    "author": "John Doe",
    "publishedDate": "2024-01-01",
    "wordCount": 1500
  },
  "metadata": {...},
  "images": [...],
  "links": [...]
}
```

#### CSV Export
```csv
URL,Title,Author,Published Date,Word Count
https://example.com,"Article Title","John Doe","2024-01-01",1500
```

#### Markdown Export
```markdown
# Article Title

*By John Doe*
*Published: January 1, 2024*

> Article excerpt here...

---

Article content here...

---

*Read time: 7 minutes*
*Word count: 1500*
```

### 🚦 Performance Optimization

1. **Smart Caching**: Results cached for 1 hour by default
2. **Parallel Processing**: Batch scraping with concurrency control
3. **Selective Extraction**: Only extract needed data
4. **Lazy Loading**: Components load on demand

### 🧪 Testing

```typescript
// Mock scraper for tests
jest.mock('~modules/scraper', () => ({
  scraperService: {
    scrapeUrl: jest.fn().mockResolvedValue({
      title: 'Test Article',
      content: 'Test content',
      article: {
        wordCount: 100,
        estimatedReadTime: 1
      }
    })
  }
}))
```

### 📝 Best Practices

1. **Respect robots.txt**: Check site policies before scraping
2. **Rate Limiting**: Don't overwhelm servers
3. **Error Handling**: Gracefully handle failed extractions
4. **User Agent**: Set appropriate user agent
5. **Caching**: Use cache to reduce server load

### 🔒 Security Considerations

1. **DOMPurify**: All extracted HTML is sanitized
2. **URL Validation**: Prevent XSS via malicious URLs
3. **Content Security**: No execution of scraped scripts
4. **CORS Handling**: Proper cross-origin handling

Tiếp theo, bạn muốn tôi triển khai module nào?
- Robust Messaging System
- Form & Validation System
- i18n Internationalization
- Performance Monitor
