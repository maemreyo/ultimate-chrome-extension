import { useState, useEffect } from "react"
import { Plus, X, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~components/ui/dialog"
import { useStorage } from "~hooks/useStorage"

interface QuickLink {
  id: string
  title: string
  url: string
  favicon?: string
}

export function QuickLinks() {
  const [links, setLinks] = useStorage<QuickLink[]>("quickLinks", [])
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [newLink, setNewLink] = useState({ title: "", url: "" })
  
  useEffect(() => {
    // Add default links if none exist
    if (!links || links.length === 0) {
      setLinks([
        { id: "1", title: "Gmail", url: "https://gmail.com", favicon: "https://www.google.com/s2/favicons?domain=gmail.com" },
        { id: "2", title: "GitHub", url: "https://github.com", favicon: "https://www.google.com/s2/favicons?domain=github.com" },
        { id: "3", title: "YouTube", url: "https://youtube.com", favicon: "https://www.google.com/s2/favicons?domain=youtube.com" }
      ])
    }
  }, [])
  
  const addLink = () => {
    if (!newLink.title || !newLink.url) return
    
    const url = newLink.url.startsWith("http") ? newLink.url : `https://${newLink.url}`
    const domain = new URL(url).hostname
    
    setLinks([...links, {
      id: Date.now().toString(),
      title: newLink.title,
      url: url,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}`
    }])
    
    setNewLink({ title: "", url: "" })
    setIsAddingLink(false)
  }
  
  const removeLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id))
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quick Links</CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsAddingLink(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {links?.map((link) => (
            <div
              key={link.id}
              className="group relative flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => window.open(link.url, "_blank")}
            >
              {link.favicon && (
                <img src={link.favicon} alt="" className="w-4 h-4" />
              )}
              <span className="text-sm truncate flex-1">{link.title}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  removeLink(link.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      
      <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Quick Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
            />
            <Input
              placeholder="URL"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            />
            <Button onClick={addLink} className="w-full">
              Add Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}