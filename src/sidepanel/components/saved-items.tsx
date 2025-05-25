import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Button } from "~components/ui/button"
import { Bookmark, Trash2 } from "lucide-react"
import { formatDate } from "~lib/utils"

interface SavedItem {
  id: string
  title: string
  url: string
  createdAt: string
}

interface SavedItemsProps {
  userId?: string
}

export function SavedItems({ userId }: SavedItemsProps) {
  const [items, setItems] = useState<SavedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    // In a real app, you would fetch from your database
    // For demo purposes, we'll use mock data
    const mockItems: SavedItem[] = [
      {
        id: "1",
        title: "Example Saved Page",
        url: "https://example.com",
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        title: "Documentation",
        url: "https://docs.example.com",
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ]
    
    setTimeout(() => {
      setItems(mockItems)
      setIsLoading(false)
    }, 500)
  }, [userId])

  const handleDelete = (id: string) => {
    // In a real app, you would delete from your database
    setItems(items.filter(item => item.id !== id))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="text-center py-8">
        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Sign in to view saved items</h3>
        <p className="text-muted-foreground mb-4">
          Your bookmarks will be synced across all your devices.
        </p>
        <Button>Sign In</Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No saved items yet</h3>
        <p className="text-muted-foreground">
          Bookmark pages to save them for later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved Items</h2>
        <span className="text-sm text-muted-foreground">{items.length} items</span>
      </div>
      
      {items.map(item => (
        <Card key={item.id}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-medium">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline truncate block mb-2"
            >
              {item.url}
            </a>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Saved {formatDate(item.createdAt)}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDelete(item.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}