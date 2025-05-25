import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { formatDate } from "~lib/utils"
import { Clock, Globe, BookmarkIcon } from "lucide-react"

interface ActivityItem {
  id: string
  title: string
  url: string
  favicon?: string
  timestamp: string
  type: "history" | "bookmark"
}

export function RecentActivity() {
  const [activeTab, setActiveTab] = useState("history")
  const [items, setItems] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true)
      
      // In a real extension, you would use chrome.history.search or chrome.bookmarks.getRecent
      // For demo purposes, we'll use mock data
      setTimeout(() => {
        const mockItems: ActivityItem[] = [
          {
            id: "1",
            title: "Google",
            url: "https://www.google.com",
            favicon: "https://www.google.com/favicon.ico",
            timestamp: new Date().toISOString(),
            type: activeTab === "history" ? "history" : "bookmark"
          },
          {
            id: "2",
            title: "GitHub",
            url: "https://github.com",
            favicon: "https://github.com/favicon.ico",
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            type: activeTab === "history" ? "history" : "bookmark"
          },
          {
            id: "3",
            title: "Stack Overflow",
            url: "https://stackoverflow.com",
            favicon: "https://stackoverflow.com/favicon.ico",
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            type: activeTab === "history" ? "history" : "bookmark"
          },
          {
            id: "4",
            title: "MDN Web Docs",
            url: "https://developer.mozilla.org",
            favicon: "https://developer.mozilla.org/favicon.ico",
            timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
            type: activeTab === "history" ? "history" : "bookmark"
          }
        ]
        
        setItems(mockItems)
        setIsLoading(false)
      }, 500)
    }
    
    fetchItems()
  }, [activeTab])
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <BookmarkIcon className="h-4 w-4" />
              <span>Bookmarks</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="mt-0">
            {renderActivityItems()}
          </TabsContent>
          
          <TabsContent value="bookmarks" className="mt-0">
            {renderActivityItems()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
  
  function renderActivityItems() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }
    
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No recent activity</h3>
          <p className="text-muted-foreground">
            {activeTab === "history" 
              ? "Your browsing history will appear here" 
              : "Your bookmarks will appear here"}
          </p>
        </div>
      )
    }
    
    return (
      <div className="space-y-2">
        {items.map(item => (
          <a 
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-2 rounded-md hover:bg-muted transition-colors"
          >
            <div className="h-8 w-8 mr-3 flex-shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {item.favicon ? (
                <img src={item.favicon} alt="" className="h-6 w-6" />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.url}</p>
            </div>
            <div className="text-xs text-muted-foreground ml-3">
              {formatDate(item.timestamp)}
            </div>
          </a>
        ))}
      </div>
    )
  }
}