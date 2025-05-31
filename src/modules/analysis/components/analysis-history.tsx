import { Card, CardContent, CardHeader, CardTitle } from '~components/ui/card'
import { Button } from '~components/ui/button'
import { Badge } from '~components/ui/badge'
import { Input } from '~components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~components/ui/table'
import { Search, Trash2, Eye, Clock } from 'lucide-react'
import { useAnalysisContext } from '../analysis-provider'
import { useState } from 'react'
import { AnalysisResult } from '../types'

export function AnalysisHistory() {
  const { history, clearHistory } = useAnalysisContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null)

  const filteredHistory = history.filter(item =>
    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(item.inputs).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'processing':
        return <Badge variant="default">Processing</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return '-'
    return `${(duration / 1000).toFixed(2)}s`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Analysis History</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirm('Clear all history?') && clearHistory()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.metadata.startedAt).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(item.metadata.duration)}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedResult(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredHistory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No analysis history found
            </div>
          )}
        </div>
      </CardContent>

      {selectedResult && (
        <AnalysisResultView result={selectedResult} />
      )}
    </Card>
  )
}