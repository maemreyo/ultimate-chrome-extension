import { useStorage } from "~hooks/useStorage"
import { useAuth } from "~hooks/useAuth"
import { Button } from "~components/ui/button"
import { Switch } from "~components/ui/switch"
import { Label } from "~components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"

export function SettingsTab() {
  const [settings, setSettings] = useStorage("settings")
  const { user, logout, isAuthenticated } = useAuth()
  
  const updateSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: value
    })
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Appearance</h3>
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select
            value={settings?.theme || "light"}
            onValueChange={(value) => updateSetting("theme", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Preferences</h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications">Enable Notifications</Label>
          <Switch
            id="notifications"
            checked={settings?.notifications ?? true}
            onCheckedChange={(checked) => updateSetting("notifications", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-sync">Auto Sync</Label>
          <Switch
            id="auto-sync"
            checked={settings?.autoSync ?? true}
            onCheckedChange={(checked) => updateSetting("autoSync", checked)}
          />
        </div>
      </div>
      
      {isAuthenticated && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
            >
              Logout
            </Button>
          </div>
        </div>
      )}
      
      <div className="pt-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Advanced Settings
        </Button>
      </div>
    </div>
  )
}