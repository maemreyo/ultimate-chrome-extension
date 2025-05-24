import { useState } from "react"
import { X, MessageSquare } from "lucide-react"
import { Button } from "./ui/button"
import { sendToBackground } from "@plasmohq/messaging"
import { useQuery } from "@tanstack/react-query"

interface ExtensionWidgetProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
}

export function ExtensionWidget({ isOpen, onToggle }: ExtensionWidgetProps) {
  const [message, setMessage] = useState("")
  
  const { data: status } = useQuery({
    queryKey: ["extension-status"],
    queryFn: async () => {
      const response = await sendToBackground({
        name: "ping"
      })
      return response
    },
    refetchInterval: 5000
  })
  
  if (!isOpen) {
    return (
      <Button
        size="icon"
        className="rounded-full shadow-lg"
        onClick={() => onToggle(true)}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    )
  }
  
  return (
    <div className="bg-background border rounded-lg shadow-xl w-[350px] p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Extension Assistant</h3>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onToggle(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Status: {status ? "Connected" : "Disconnected"}
        </div>
        
        <textarea
          className="w-full p-2 border rounded-md resize-none"
          rows={3}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        
        <Button
          className="w-full"
          onClick={async () => {
            // Send message to background
            const response = await sendToBackground({
              name: "api",
              body: {
                endpoint: "/chat",
                method: "POST",
                data: { message }
              }
            })
            console.log("Response:", response)
            setMessage("")
          }}
        >
          Send Message
        </Button>
      </div>
    </div>
  )
}