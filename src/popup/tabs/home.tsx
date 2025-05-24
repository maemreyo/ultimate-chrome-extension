import { useAuth } from "~hooks/useAuth"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { sendToBackground } from "@plasmohq/messaging"

export function HomeTab() {
  const { user, isAuthenticated } = useAuth()
  
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await sendToBackground({
        name: "api",
        body: {
          endpoint: "/stats",
          method: "GET"
        }
      })
      return response.data
    },
    enabled: isAuthenticated
  })
  
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please log in to access all features.
          </p>
          <Button
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hello, {user?.name}!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
              <p className="text-2xl font-bold">{stats?.totalActions || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sites Visited</p>
              <p className="text-2xl font-bold">{stats?.sitesVisited || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => {
            chrome.tabs.create({ url: chrome.runtime.getURL("tabs/dashboard.html") })
          }}
        >
          Open Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            chrome.runtime.sendMessage({ action: "sync-data" })
          }}
        >
          Sync Data
        </Button>
      </div>
    </div>
  )
}