import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Button } from '~components/ui/button'
import { Input } from '~components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Alert, AlertDescription } from '~components/ui/alert'
import { Badge } from '~components/ui/badge'
import {
  Globe,
  FileText,
  Download,
  RefreshCw,
  Link,
  Image,
  Table,
  Code
} from 'lucide-react'
import { useScraper } from '../hooks/useScraper'

export function ScraperUI() {
  const [url, setUrl] = useState('')
  const { scrapeUrl, scrapeCurrentTab, result, loading, error } = useScraper()

  const handleScrapeUrl = async () => {
    if (!url) return
    await scrapeUrl(url, { useCache: true })
  }

  const handleExport = async (format: 'json' | 'csv' | 'markdown') => {
    if (!result) return

    const { scraperService } = await import('../scraper-service')
    const blob = await scraperService.exportResults([result], format)

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scraped-content.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Web Scraper
          </CardTitle>
          <CardDescription>
            Extract content from any webpage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter URL to scrape..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScrapeUrl()}
            />
            <Button onClick={handleScrapeUrl} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Scrape'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={scrapeCurrentTab}
              disabled={loading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Scrape Current Tab
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{result.title}</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport('json')}>
                    <Download className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('markdown')}>
                    <Download className="h-4 w-4 mr-1" />
                    MD
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="article">
                <TabsList>
                  <TabsTrigger value="article">Article</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  <TabsTrigger value="images">
                    Images {result.images?.length ? `(${result.images.length})` : ''}
                  </TabsTrigger>
                  <TabsTrigger value="links">
                    Links {result.links?.length ? `(${result.links.length})` : ''}
                  </TabsTrigger>
                  <TabsTrigger value="data">Structured Data</TabsTrigger>
                </TabsList>

                <TabsContent value="article" className="space-y-4">
                  {result.article ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Author:</span>
                          <p className="font-medium">{result.article.author || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Published:</span>
                          <p className="font-medium">
                            {result.article.publishedDate
                              ? new Date(result.article.publishedDate).toLocaleDateString()
                              : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Read Time:</span>
                          <p className="font-medium">{result.article.estimatedReadTime} min</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Word Count:</span>
                          <p className="font-medium">{result.article.wordCount}</p>
                        </div>
                      </div>

                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: result.article.content }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No article content found</p>
                  )}
                </TabsContent>

                <TabsContent value="metadata">
                  {result.metadata ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Title:</span>
                          <p className="font-medium">{result.metadata.title}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">URL:</span>
                          <p className="font-medium truncate">{result.metadata.url}</p>
                        </div>
                        {result.metadata.description && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Description:</span>
                            <p className="font-medium">{result.metadata.description}</p>
                          </div>
                        )}
                      </div>

                      {result.metadata.openGraph && (
                        <div>
                          <h4 className="font-medium mb-2">Open Graph</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(result.metadata.openGraph, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No metadata found</p>
                  )}
                </TabsContent>

                <TabsContent value="images">
                  {result.images && result.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {result.images.slice(0, 10).map((img, idx) => (
                        <div key={idx} className="space-y-2">
                          <img
                            src={img.src}
                            alt={img.alt || `Image ${idx + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <div className="text-xs text-muted-foreground">
                            {img.width && img.height && `${img.width}x${img.height}`}
                            {img.type && ` • ${img.type.toUpperCase()}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No images found</p>
                  )}
                </TabsContent>

                <TabsContent value="links">
                  {result.links && result.links.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {result.links.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Link className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate hover:underline"
                          >
                            {link.text || link.href}
                          </a>
                          <div className="flex gap-1">
                            {link.isExternal && (
                              <Badge variant="outline" className="text-xs">External</Badge>
                            )}
                            {link.isDownload && (
                              <Badge variant="outline" className="text-xs">Download</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No links found</p>
                  )}
                </TabsContent>

                <TabsContent value="data">
                  {result.structuredData && result.structuredData.length > 0 ? (
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                      {JSON.stringify(result.structuredData, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">No structured data found</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}