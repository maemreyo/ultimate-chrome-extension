import { useEffect, useState } from "react"
import { BarChart, LineChart, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { sendToBackground } from "@plasmohq/messaging"
import "~styles/globals.css"

function DashboardTab() {
  const [analytics, setAnalytics] = useState<any>(null)
  
  useEffect(() => {
    loadAnalytics()
  }, [])
  
  const loadAnalytics = async () => {
    const response = await sendToBackground({
      name: "api",
      body: {
        endpoint: "/analytics/overview",
        method: "GET"
      }
    })
    setAnalytics(response.data)
  }
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Extension Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalActions || 0}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                +15% from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sites Analyzed</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.sitesAnalyzed || 0}</div>
              <p className="text-xs text-muted-foreground">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Add charts and graphs here */}
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            {/* Add activity log here */}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            {/* Add dashboard settings here */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default DashboardTab