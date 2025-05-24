import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Bookmark, Copy, Share2, ExternalLink, Download } from "lucide-react"
import { sendToBackground } from "@plasmohq/messaging"
import toast from "react-hot-toast"

interface QuickActionsProps {
  currentTab: chrome.tabs.Tab | null
}

export function QuickActions({ currentTab }: QuickActionsProps) {
  const actions = [
    {
      icon: Bookmark,
      label: "Save Page",
      action: async () => {
        if (!currentTab) return
        
        const response = await sendToBackground({
          name: "supabase",
          body: {
            action: "save-data",
            data: {
              title: currentTab.title,
              url: currentTab.url,
              content: { favicon: currentTab.favIconUrl },
              tags: ["bookmark"]
            }
          }
        })
        
        if (response.success) {
          toast.success("Page saved!")
        }
      }
    },
    {
      icon: Copy,
      label: "Copy URL",
      action: () => {
        if (currentTab?.url) {
          navigator.clipboard.writeText(currentTab.url)
          toast.success("URL copied!")
        }
      }
    },
    {
      icon: Share2,
      label: "Share",
      action: async () => {
        if (navigator.share && currentTab) {
          try {
            await navigator.share({
              title: currentTab.title,
              url: currentTab.url
            })
          } catch (err) {
            console.log("Share cancelled")
          }
        }
      }
    }
  ]
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="flex flex-col h-auto py-3"
              onClick={action.action}
            >
              <action.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}