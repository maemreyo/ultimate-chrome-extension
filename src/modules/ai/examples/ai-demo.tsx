import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { Button } from "~components/ui/button"
import { Textarea } from "~components/ui/textarea"
import { Badge } from "~components/ui/badge"
import { useAI } from "../hooks/useAI"
import { useAIChat } from "../hooks/useAIChat"

export function AIDemo() {
  const { generateText, summarize, classifyText, loading, error } = useAI()
  const { messages, sendMessage, clearMessages, loading: chatLoading } = useAIChat()

  const [input, setInput] = useState("")
  const [result, setResult] = useState("")
  const [chatInput, setChatInput] = useState("")

  const handleGenerate = async () => {
    try {
      const text = await generateText(input)
      setResult(text)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSummarize = async () => {
    try {
      const summary = await summarize(input, { style: 'bullet' })
      setResult(summary)
    } catch (err) {
      console.error(err)
    }
  }

  const handleClassify = async () => {
    try {
      const classification = await classifyText(input, [
        'technology', 'business', 'health', 'sports', 'entertainment', 'other'
      ])
      setResult(`Category: ${classification.label} (${(classification.confidence * 100).toFixed(1)}% confidence)`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return

    try {
      await sendMessage(chatInput)
      setChatInput("")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Features Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="analyze">Analyze</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <Textarea
                placeholder="Enter your prompt..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={loading}>
                  Generate Text
                </Button>
                <Button variant="outline" onClick={handleSummarize} disabled={loading}>
                  Summarize
                </Button>
              </div>
              {result && (
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap">{result}</pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analyze" className="space-y-4">
              <Textarea
                placeholder="Enter text to analyze..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
              />
              <Button onClick={handleClassify} disabled={loading}>
                Classify Text
              </Button>
              {result && (
                <div className="p-4 bg-muted rounded-lg">
                  <p>{result}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <div className="h-[300px] overflow-y-auto border rounded-lg p-4 space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-2 rounded-lg">
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleChatSend()
                    }
                  }}
                />
                <div className="flex flex-col gap-2">
                  <Button onClick={handleChatSend} disabled={chatLoading}>
                    Send
                  </Button>
                  <Button variant="outline" onClick={clearMessages}>
                    Clear
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
              <p>Error: {error.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}