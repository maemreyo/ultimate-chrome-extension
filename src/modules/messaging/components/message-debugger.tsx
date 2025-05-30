import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Badge } from '~components/ui/badge'
import { Button } from '~components/ui/button'
import { Input } from '~components/ui/input'
import { ScrollArea } from '~components/ui/scroll-area'
import {
  MessageSquare,
  Send,
  Filter,
  Trash2,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react'
import { messageBus } from '../message-bus'
import { Message, MessagePriority } from '../types'

export function MessageDebugger() {
  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<string[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [stats, setStats] = useState(messageBus.getStats())
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    loadData()

    const interval = setInterval(loadData, 1000)
    return () => clearInterval(interval)
  }, [selectedChannel])

  const loadData = () => {
    const history = messageBus.getHistory(selectedChannel || undefined)
    setMessages(history)

    const allChannels = Array.from(messageBus.getStats().channelStats.keys())
    setChannels(allChannels)

    setStats(messageBus.getStats())
  }

  const clearHistory = () => {
    messageBus.clearHistory(selectedChannel || undefined)
    loadData()
  }

  const exportMessages = () => {
    const data = JSON.stringify(messages, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `messages-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case MessagePriority.LOW: return 'bg-gray-500'
      case MessagePriority.NORMAL: return 'bg-blue-500'
      case MessagePriority.HIGH: return 'bg-orange-500'
      case MessagePriority.URGENT: return 'bg-red-500'
    }
  }

  const filteredMessages = messages.filter(msg => {
    if (!filterText) return true

    const searchText = filterText.toLowerCase()
    return (
      msg.type.toLowerCase().includes(searchText) ||
      msg.channel.toLowerCase().includes(searchText) ||
      JSON.stringify(msg.payload).toLowerCase().includes(searchText)
    )
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Debugger
          </CardTitle>
          <CardDescription>
            Monitor and debug message flow in your extension
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="messages">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Filter messages..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="flex-1"
                />
                <select
                  className="px-3 py-2 border rounded-md"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                >
                  <option value="">All Channels</option>
                  {channels.map(channel => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
                <Button size="icon" variant="outline" onClick={loadData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={exportMessages}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredMessages.reverse().map(message => (
                    <div key={message.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{message.channel}</Badge>
                          <Badge>{message.type}</Badge>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(message.metadata.priority)}`} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">From: </span>
                        {message.metadata.sender.type}
                        {message.metadata.sender.tabId && ` (Tab ${message.metadata.sender.tabId})`}
                      </div>

                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(message.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="channels" className="space-y-4">
              <div className="grid gap-4">
                {channels.map(channel => {
                  const channelStats = stats.channelStats.get(channel)
                  return (
                    <Card key={channel}>
                      <CardHeader>
                        <CardTitle className="text-base">{channel}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Messages:</span>
                            <p className="font-medium">{channelStats?.messageCount || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Subscribers:</span>
                            <p className="font-medium">{channelStats?.subscriberCount || 0}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Last Activity:</span>
                            <p className="font-medium">
                              {channelStats?.lastActivity
                                ? new Date(channelStats.lastActivity).toLocaleString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.sent}</div>
                    <p className="text-xs text-muted-foreground">Messages Sent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.received}</div>
                    <p className="text-xs text-muted-foreground">Messages Received</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.failed}</div>
                    <p className="text-xs text-muted-foreground">Failed Messages</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.avgProcessingTime.toFixed(2)}ms</div>
                    <p className="text-xs text-muted-foreground">Avg Processing Time</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium">
                        {((1 - stats.failed / (stats.sent || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Channels</span>
                      <span className="font-medium">{channels.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Subscriptions</span>
                      <span className="font-medium">
                        {Array.from(stats.channelStats.values())
                          .reduce((sum, s) => sum + s.subscriberCount, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}