import { useArticleReader } from '../hooks/useArticleReader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Button } from '~components/ui/button'
import { Badge } from '~components/ui/badge'
import { Progress } from '~components/ui/progress'
import {
  FileText,
  Download,
  Clock,
  User,
  Calendar,
  RefreshCw,
  BookOpen
} from 'lucide-react'

export function ArticleReaderUI() {
  const {
    article,
    loading,
    error,
    extractFromCurrentTab,
    generateSummary,
    saveAsMarkdown
  } = useArticleReader(true) // Auto-extract on mount

  const handleSummarize = async () => {
    const summary = await generateSummary(200)
    if (summary) {
      alert(summary) // In production, show in a better UI
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">{error.message}</p>
          <Button className="mt-4" onClick={extractFromCurrentTab}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!article) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No article detected on this page</p>
          <Button className="mt-4" onClick={extractFromCurrentTab}>
            Extract Article
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{article.title}</CardTitle>
        <CardDescription className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            {article.author && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {article.author}
              </div>
            )}
            {article.publishedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(article.publishedDate).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.estimatedReadTime} min read
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {article.wordCount} words
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {article.leadImage && (
          <img
            src={article.leadImage}
            alt={article.title}
            className="w-full h-48 object-cover rounded-lg"
          />
        )}

        {article.excerpt && (
          <blockquote className="italic text-muted-foreground border-l-4 pl-4">
            {article.excerpt}
          </blockquote>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSummarize}>
            Generate Summary
          </Button>
          <Button variant="outline" size="sm" onClick={saveAsMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            Save as Markdown
          </Button>
        </div>

        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </CardContent>
    </Card>
  )
}