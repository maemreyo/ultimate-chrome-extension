import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { Button } from "~components/ui/button"
import { ScrollArea } from "~components/ui/scroll-area"
import { Home, Search, BookmarkIcon, Settings, CreditCard } from "lucide-react"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"
import { QuickActions } from "./components/quick-actions"
import { SavedItems } from "./components/saved-items"
import { SearchPanel } from "./components/search-panel"
import { SubscriptionStatus } from "./components/subscription-status"

export function SidePanelApp() {
  const { user, isLoading } = useSupabaseAuth()
  const [activeTab, setActiveTab] = useState("home")
  
  // Get current tab info
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)
  
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) setCurrentTab(tabs[0])
    })
    
    // Listen for tab changes
    const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.status === "complete") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) setCurrentTab(tabs[0])
        })
      }
    }
    
    chrome.tabs.onUpdated.addListener(listener)
    return () => chrome.tabs.onUpdated.removeListener(listener)
  }, [])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold">Extension Panel</h1>
          <SubscriptionStatus />
        </div>
        {currentTab && (
          <p className="text-sm text-muted-foreground truncate">
            {currentTab.title}
          </p>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5 px-4">
            <TabsTrigger value="home" className="px-2">
              <Home className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="search" className="px-2">
              <Search className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="saved" className="px-2">
              <BookmarkIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="billing" className="px-2">
              <CreditCard className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-2">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[calc(100vh-140px)]">
            <TabsContent value="home" className="p-4">
              <QuickActions currentTab={currentTab} />
            </TabsContent>
            
            <TabsContent value="search" className="p-4">
              <SearchPanel />
            </TabsContent>
            
            <TabsContent value="saved" className="p-4">
              <SavedItems userId={user?.id} />
            </TabsContent>
            
            <TabsContent value="billing" className="p-4">
              <BillingPanel />
            </TabsContent>
            
            <TabsContent value="settings" className="p-4">
              <SettingsPanel />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}