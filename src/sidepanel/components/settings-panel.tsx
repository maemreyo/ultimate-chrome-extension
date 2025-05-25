import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Label } from "~components/ui/label"
import { Switch } from "~components/ui/switch"
import { Button } from "~components/ui/button"
import { useStorage } from "~hooks/useStorage"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"

export function SettingsPanel() {
  const { user, signOut } = useSupabaseAuth()
  const [settings, setSettings] = useStorage("settings", {
    notifications: true,
    darkMode: false,
    autoSave: false,
    collectAnalytics: true
  })
  
  const [isSaving, setIsSaving] = useState(false)
  
  const handleToggle = (key: keyof typeof settings) => {
    setSettings({
      ...settings,
      [key]: !settings[key]
    })
  }
  
  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all extension data? This cannot be undone.")) {
      setIsSaving(true)
      
      // In a real app, you would clear data from storage and possibly from your database
      setTimeout(() => {
        chrome.storage.local.clear()
        setIsSaving(false)
        alert("All data has been cleared.")
      }, 1000)
    }
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the extension looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col">
              <span>Dark Mode</span>
              <span className="text-sm text-muted-foreground">
                Use dark theme for the extension
              </span>
            </Label>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={() => handleToggle("darkMode")}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="flex flex-col">
              <span>Enable Notifications</span>
              <span className="text-sm text-muted-foreground">
                Receive notifications from the extension
              </span>
            </Label>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={() => handleToggle("notifications")}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Manage your privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="analytics" className="flex flex-col">
              <span>Usage Analytics</span>
              <span className="text-sm text-muted-foreground">
                Help improve the extension by sharing usage data
              </span>
            </Label>
            <Switch
              id="analytics"
              checked={settings.collectAnalytics}
              onCheckedChange={() => handleToggle("collectAnalytics")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save" className="flex flex-col">
              <span>Auto-Save</span>
              <span className="text-sm text-muted-foreground">
                Automatically save browsing history
              </span>
            </Label>
            <Switch
              id="auto-save"
              checked={settings.autoSave}
              onCheckedChange={() => handleToggle("autoSave")}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="text-sm">
                <div className="mb-1">Signed in as:</div>
                <div className="font-medium">{user.email}</div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleClearData}
                  disabled={isSaving}
                >
                  {isSaving ? "Processing..." : "Clear Data"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-muted-foreground mb-4">
                Sign in to sync your settings across devices.
              </p>
              <Button>Sign In</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}