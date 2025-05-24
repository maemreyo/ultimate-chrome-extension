import { useState } from "react"
import { cn } from "~lib/utils"
import { Button } from "~components/ui/button"
import { ScrollArea } from "~components/ui/scroll-area"
import { 
  Settings, 
  User, 
  Shield, 
  Database, 
  Bell, 
  Palette,
  Code,
  HelpCircle
} from "lucide-react"

const sidebarItems = [
  { id: "general", label: "General", icon: Settings },
  { id: "account", label: "Account", icon: User },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "data", label: "Data Management", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "advanced", label: "Advanced", icon: Code },
  { id: "about", label: "About", icon: HelpCircle }
]

export function OptionsLayout() {
  const [activeSection, setActiveSection] = useState("general")
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Extension Settings</h1>
        </div>
        <ScrollArea className="h-[calc(100vh-88px)]">
          <div className="p-4 space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeSection === item.id && "bg-secondary"
                )}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeSection === "general" && <GeneralSettings />}
          {activeSection === "account" && <AccountSettings />}
          {activeSection === "privacy" && <PrivacySettings />}
          {/* Add other sections */}
        </div>
      </div>
    </div>
  )
}