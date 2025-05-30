import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Button } from '~components/ui/button'
import { Input } from '~components/ui/input'
import { Textarea } from '~components/ui/textarea'
import { Label } from '~components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~components/ui/select'
import { Badge } from '~components/ui/badge'
import { Send, Plus, X } from 'lucide-react'
import { messageBus } from '../message-bus'
import { MessagePriority } from '../types'

export function MessageSender() {
  const [channel, setChannel] = useState('')
  const [type, setType] = useState('')
  const [payload, setPayload] = useState('')
  const [priority, setPriority] = useState<MessagePriority>(MessagePriority.NORMAL)
  const [headers, setHeaders] = useState<Record<string, string>>({})
  const [newHeaderKey, setNewHeaderKey] = useState('')
  const [newHeaderValue, setNewHeaderValue] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSend = async () => {
    if (!channel || !type) {
      setResult('Channel and type are required')
      return
    }

    setSending(true)
    setResult(null)

    try {
      // Parse payload
      let parsedPayload
      try {
        parsedPayload = JSON.parse(payload || '{}')
      } catch {
        parsedPayload = payload
      }

      // Create channel if it doesn't exist
      if (!messageBus.getChannel(channel)) {
        messageBus.createChannel(channel)
      }

      // Send message
      await messageBus.publish(channel, type, parsedPayload, {
        priority,
        headers: Object.keys(headers).length > 0 ? headers : undefined
      })

      setResult('Message sent successfully!')

      // Clear form
      setType('')
      setPayload('')
      setHeaders({})
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setHeaders({ ...headers, [newHeaderKey]: newHeaderValue })
      setNewHeaderKey('')
      setNewHeaderValue('')
    }
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers }
    delete newHeaders[key]
    setHeaders(newHeaders)
  }

  const channels = Array.from(messageBus.getStats().channelStats.keys())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message</CardTitle>
        <CardDescription>
          Send a test message to any channel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Channel</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter channel name"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              list="channels"
            />
            <datalist id="channels">
              {channels.map(ch => (
                <option key={ch} value={ch} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Message Type</Label>
          <Input
            placeholder="e.g., user.created, data.sync"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Payload (JSON or text)</Label>
          <Textarea
            placeholder='{"key": "value"}'
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority.toString()}
            onValueChange={(value) => setPriority(parseInt(value) as MessagePriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MessagePriority.LOW.toString()}>Low</SelectItem>
              <SelectItem value={MessagePriority.NORMAL.toString()}>Normal</SelectItem>
              <SelectItem value={MessagePriority.HIGH.toString()}>High</SelectItem>
              <SelectItem value={MessagePriority.URGENT.toString()}>Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Headers (Optional)</Label>
          <div className="space-y-2">
            {Object.entries(headers).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Badge variant="outline">{key}: {value}</Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeHeader(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Header key"
                value={newHeaderKey}
                onChange={(e) => setNewHeaderKey(e.target.value)}
              />
              <Input
                placeholder="Header value"
                value={newHeaderValue}
                onChange={(e) => setNewHeaderValue(e.target.value)}
              />
              <Button size="icon" onClick={addHeader}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {result && (
          <div className={`p-3 rounded-lg text-sm ${
            result.startsWith('Error') ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800'
          }`}>
            {result}
          </div>
        )}

        <Button onClick={handleSend} disabled={sending} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Sending...' : 'Send Message'}
        </Button>
      </CardContent>
    </Card>
  )
}