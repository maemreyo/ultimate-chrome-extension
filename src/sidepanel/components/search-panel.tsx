import { useState } from "react"
import { Search, ExternalLink } from "lucide-react"
import { Input } from "~components/ui/input"
import { Button } from "~components/ui/button"
import { Card, CardContent } from "~components/ui/card"

interface SearchResult {
  id: string
  title: string
  url: string
  description: string
}

export function SearchPanel() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)

    // In a real app, you would search using an API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: "1",
          title: "Example Search Result 1",
          url: "https://example.com/result1",
          description: "This is an example search result that matches your query."
        },
        {
          id: "2",
          title: "Example Search Result 2",
          url: "https://example.com/result2",
          description: "Another example search result with relevant information."
        }
      ]
      
      setResults(mockResults)
      setIsSearching(false)
    }, 1000)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      {isSearching ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map(result => (
            <Card key={result.id}>
              <CardContent className="p-4">
                <h3 className="font-medium mb-1">{result.title}</h3>
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline truncate block mb-2"
                >
                  {result.url}
                </a>
                <p className="text-sm text-muted-foreground">{result.description}</p>
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.open(result.url, "_blank")}
                    className="h-8 gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query && !isSearching ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No results found for "{query}"</p>
        </div>
      ) : null}

      {!query && !isSearching && (
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Search for anything</h3>
          <p className="text-muted-foreground">
            Enter a search term to find relevant results.
          </p>
        </div>
      )}
    </div>
  )
}