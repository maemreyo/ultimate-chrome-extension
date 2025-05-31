import {
  Archive,
  Download,
  FileDown,
  FileUp,
  HardDrive,
  Lock,
  RefreshCw,
  Trash2,
  Unlock,
  Upload
} from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertDescription } from '~components/ui/alert'
import { Button } from '~components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Label } from '~components/ui/label'
import { Progress } from '~components/ui/progress'
import { Switch } from '~components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { useStorageStats } from '../hooks/useStorageStats'
import { useStorageContext } from '../storage-provider'
import type { ImportExportOptions } from '../types'

export function StorageManagerUI() {
  const { storage, config, updateConfig } = useStorageContext()
  const { stats, loading, refresh } = useStorageStats(5000) // Refresh every 5 seconds
  const [activeTab, setActiveTab] = useState('overview')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const options: ImportExportOptions = {
        format: 'json',
        encrypted: config.encryption?.enabled,
        compressed: true
      }

      const blob = await storage.export(options)

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `storage-export-${new Date().toISOString()}.json.gz`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      await storage.import(file, {
        format: 'json',
        compressed: file.name.endsWith('.gz')
      })
      await refresh()
    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      setImporting(false)
    }
  }

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all storage? This cannot be undone.')) {
      await storage.clear()
      await refresh()
    }
  }

  const handleVacuum = async () => {
    await storage.vacuum()
    await refresh()
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const quotaPercentage = stats
    ? (stats.quotaUsed / stats.quotaAvailable) * 100
    : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Manager
          </CardTitle>
          <CardDescription>
            Manage your extension's advanced storage system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.itemCount}</div>
                        <p className="text-xs text-muted-foreground">Total Items</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
                        <p className="text-xs text-muted-foreground">Total Size</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage Usage</span>
                      <span>{formatBytes(stats.quotaUsed)} / {formatBytes(stats.quotaAvailable)}</span>
                    </div>
                    <Progress value={quotaPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {quotaPercentage.toFixed(1)}% of available storage used
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Last Sync</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.lastSync ? new Date(stats.lastSync).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <Button size="sm" onClick={refresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertDescription>Unable to load storage statistics</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt all stored data with AES-256
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.encryption?.enabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    <Switch
                      checked={config.encryption?.enabled}
                      onCheckedChange={(checked) =>
                        updateConfig({ encryption: { ...config.encryption, enabled: checked } })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Compress data to save space
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    <Switch
                      checked={config.compression?.enabled}
                      onCheckedChange={(checked) =>
                        updateConfig({ compression: { ...config.compression, enabled: checked } })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Sync data across devices automatically
                    </p>
                  </div>
                  <Switch
                    checked={config.sync?.enabled}
                    onCheckedChange={(checked) =>
                      updateConfig({ sync: { ...config.sync, enabled: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Versioning</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep history of changes (max {config.versioning?.maxVersions} versions)
                    </p>
                  </div>
                  <Switch
                    checked={config.versioning?.enabled}
                    onCheckedChange={(checked) =>
                      updateConfig({ versioning: { ...config.versioning, enabled: checked } })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import-export" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileDown className="h-4 w-4" />
                      Export Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export all your data to a file
                    </p>
                    <Button
                      className="w-full"
                      onClick={handleExport}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export All Data
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileUp className="h-4 w-4" />
                      Import Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Import data from a backup file
                    </p>
                    <div className="w-full">
                      <input
                        type="file"
                        accept=".json,.gz"
                        onChange={handleImport}
                        disabled={importing}
                        className="hidden"
                        id="import-file"
                      />
                      <Button
                        className="w-full"
                        onClick={() => document.getElementById('import-file')?.click()}
                        disabled={importing}
                      >
                        {importing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Import Data
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertDescription>
                  Exports are compressed and {config.encryption?.enabled ? 'encrypted' : 'unencrypted'}.
                  Make sure to keep your export files secure.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Maintenance Tasks</CardTitle>
                  <CardDescription>
                    Optimize and clean up your storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Vacuum Database</p>
                      <p className="text-sm text-muted-foreground">
                        Clean up old versions and optimize storage
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleVacuum}>
                      <Archive className="h-4 w-4 mr-2" />
                      Vacuum
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Clear All Data</p>
                      <p className="text-sm text-muted-foreground">
                        Remove all stored data permanently
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClear}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertDescription>
                  <strong>Warning:</strong> Maintenance operations cannot be undone.
                  Make sure to export your data before performing maintenance.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
