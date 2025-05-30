import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Button } from '~components/ui/button'
import { Input } from '~components/ui/input'
import { Label } from '~components/ui/label'
import { Switch } from '~components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Alert, AlertDescription } from '~components/ui/alert'
import { Badge } from '~components/ui/badge'
import { Textarea } from '~components/ui/textarea'
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Keyboard,
  Download,
  Upload,
  RotateCcw,
  Save,
  AlertCircle
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { SettingsStore, Settings as SettingsType } from '../settings/settings-store'

export function SettingsEditor() {
  const appearanceSettings = useSettings<SettingsType['appearance']>('appearance')
  const notificationSettings = useSettings<SettingsType['notifications']>('notifications')
  const privacySettings = useSettings<SettingsType['privacy']>('privacy')
  const shortcutSettings = useSettings<SettingsType['shortcuts']>('shortcuts')

  const [importExportText, setImportExportText] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set())

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = appearanceSettings.subscribe((event) => {
      setChangedSettings(prev => new Set([...prev, event.key]))
    })
    return unsubscribe
  }, [])

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      // Settings are auto-saved with useSettings hook
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate save
      setSaveStatus('saved')
      setChangedSettings(new Set())
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
    }
  }

  const handleExportSettings = async () => {
    const store = new SettingsStore()
    const exported = await store.export()
    setImportExportText(exported)
  }

  const handleImportSettings = async () => {
    if (!importExportText) return

    try {
      const store = new SettingsStore()
      await store.import(importExportText)
      window.location.reload() // Reload to apply imported settings
    } catch (error) {
      alert('Invalid settings format')
    }
  }

  const handleResetSection = async (section: string) => {
    if (confirm(`Reset ${section} settings to defaults?`)) {
      const store = new SettingsStore()
      await store.reset(section)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </span>
            {changedSettings.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{changedSettings.size} changes</Badge>
                <Button size="sm" onClick={handleSave} disabled={saveStatus === 'saving'}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Configure your extension preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appearance">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Appearance Settings
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetSection('appearance')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {appearanceSettings.value && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={appearanceSettings.value.theme}
                      onValueChange={(value: any) =>
                        appearanceSettings.update({ ...appearanceSettings.value, theme: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="auto">Auto (Time-based)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Select
                      value={appearanceSettings.value.fontSize}
                      onValueChange={(value: any) =>
                        appearanceSettings.update({ ...appearanceSettings.value, fontSize: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Reduce spacing and padding
                        </p>
                      </div>
                      <Switch
                        checked={appearanceSettings.value.compactMode}
                        onCheckedChange={(checked) =>
                          appearanceSettings.update({ ...appearanceSettings.value, compactMode: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Animations</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable UI animations
                        </p>
                      </div>
                      <Switch
                        checked={appearanceSettings.value.animations}
                        onCheckedChange={(checked) =>
                          appearanceSettings.update({ ...appearanceSettings.value, animations: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>High Contrast</Label>
                        <p className="text-sm text-muted-foreground">
                          Increase contrast for better visibility
                        </p>
                      </div>
                      <Switch
                        checked={appearanceSettings.value.highContrast}
                        onCheckedChange={(checked) =>
                          appearanceSettings.update({ ...appearanceSettings.value, highContrast: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Settings
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetSection('notifications')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {notificationSettings.value && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications from the extension
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.value.enabled}
                      onCheckedChange={(checked) =>
                        notificationSettings.update({ ...notificationSettings.value, enabled: checked })
                      }
                    />
                  </div>

                  {notificationSettings.value.enabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Sound</Label>
                        <Switch
                          checked={notificationSettings.value.sound}
                          onCheckedChange={(checked) =>
                            notificationSettings.update({ ...notificationSettings.value, sound: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Desktop Notifications</Label>
                        <Switch
                          checked={notificationSettings.value.desktop}
                          onCheckedChange={(checked) =>
                            notificationSettings.update({ ...notificationSettings.value, desktop: checked })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notification Types</Label>
                        <div className="space-y-2 p-3 border rounded-lg">
                          {Object.entries(notificationSettings.value.types).map(([type, enabled]) => (
                            <div key={type} className="flex items-center justify-between">
                              <Label className="capitalize font-normal">{type}</Label>
                              <Switch
                                checked={enabled}
                                onCheckedChange={(checked) =>
                                  notificationSettings.update({
                                    ...notificationSettings.value,
                                    types: {
                                      ...notificationSettings.value.types,
                                      [type]: checked
                                    }
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy Settings
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetSection('privacy')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {privacySettings.value && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      These settings control how your data is collected and used.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Usage Tracking</Label>
                        <p className="text-sm text-muted-foreground">
                          Help improve the extension with anonymous usage data
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.value.trackingEnabled}
                        onCheckedChange={(checked) =>
                          privacySettings.update({ ...privacySettings.value, trackingEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Share Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Share crash reports and performance data
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.value.shareAnalytics}
                        onCheckedChange={(checked) =>
                          privacySettings.update({ ...privacySettings.value, shareAnalytics: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Storage Encryption</Label>
                        <p className="text-sm text-muted-foreground">
                          Encrypt sensitive data in storage
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.value.storageEncryption}
                        onCheckedChange={(checked) =>
                          privacySettings.update({ ...privacySettings.value, storageEncryption: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Clear Data on Uninstall</Label>
                        <p className="text-sm text-muted-foreground">
                          Remove all data when extension is uninstalled
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.value.clearDataOnUninstall}
                        onCheckedChange={(checked) =>
                          privacySettings.update({ ...privacySettings.value, clearDataOnUninstall: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetSection('shortcuts')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {shortcutSettings.value && (
                <div className="space-y-4">
                  {Object.entries(shortcutSettings.value).map(([action, shortcut]) => (
                    <div key={action} className="space-y-2">
                      <Label className="capitalize">
                        {action.replace(/-/g, ' ')}
                      </Label>
                      <Input
                        value={shortcut}
                        onChange={(e) =>
                          shortcutSettings.update({
                            ...shortcutSettings.value,
                            [action]: e.target.value
                          })
                        }
                        placeholder="e.g., Ctrl+Shift+E"
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="import-export" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Export Settings</h3>
                  <Button onClick={handleExportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Settings
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Import Settings</h3>
                  <Textarea
                    placeholder="Paste exported settings JSON here..."
                    value={importExportText}
                    onChange={(e) => setImportExportText(e.target.value)}
                    rows={10}
                  />
                  <Button
                    onClick={handleImportSettings}
                    disabled={!importExportText}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {saveStatus === 'saved' && (
            <Alert className="mt-4">
              <AlertDescription>Settings saved successfully!</AlertDescription>
            </Alert>
          )}

          {saveStatus === 'error' && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>Failed to save settings. Please try again.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Export all components
export { SessionViewer } from './session-viewer'
export { HistoryTimeline } from './history-timeline'
export { SettingsEditor } from './settings-editor'