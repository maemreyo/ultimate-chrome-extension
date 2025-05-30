import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~components/ui/card'
import { Button } from '~components/ui/button'
import { Input } from '~components/ui/input'
import { Badge } from '~components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~components/ui/select'
import { Calendar } from '~components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~components/ui/popover'
import {
  History,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Download,
  Trash2,
  TrendingUp,
  BarChart3,
  Clock
} from 'lucide-react'
import { useHistory } from '../hooks/useHistory'
import { HistoryItem, HistoryGroup, HistoryStats } from '../history/history-manager'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '~lib/utils'

export function HistoryTimeline() {
  const { items, loading, loadItems, searchHistory, getTimeline, getStats, clearHistory, exportHistory } = useHistory()
  const [timeline, setTimeline] = useState<HistoryGroup[]>([])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  })
  const [activeTab, setActiveTab] = useState('timeline')

  useEffect(() => {
    loadData()
  }, [selectedTypes, dateRange])

  const loadData = async () => {
    const filters = {
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      dateRange: {
        start: dateRange.from,
        end: dateRange.to
      }
    }

    await loadItems(filters, 100)
    const timelineData = await getTimeline(7, filters)
    setTimeline(timelineData)

    const statsData = await getStats(30)
    setStats(statsData)
  }

  const handleSearch = () => {
    if (searchTerm) {
      searchHistory(searchTerm)
    } else {
      loadData()
    }
  }

  const handleExport = async () => {
    const blob = await exportHistory({
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      dateRange: { start: dateRange.from, end: dateRange.to }
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `history-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear selected history? This cannot be undone.')) {
      await clearHistory({
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        dateRange: { start: dateRange.from, end: dateRange.to }
      })
      loadData()
    }
  }

  const getTypeIcon = (type: HistoryItem['type']) => {
    const icons = {
      analysis: '🔍',
      fact_check: '✓',
      search: '🔎',
      action: '⚡',
      view: '👁️',
      custom: '📌'
    }
    return icons[type] || '📄'
  }

  const getTypeColor = (type: HistoryItem['type']) => {
    const colors = {
      analysis: 'bg-blue-500',
      fact_check: 'bg-green-500',
      search: 'bg-purple-500',
      action: 'bg-orange-500',
      view: 'bg-gray-500',
      custom: 'bg-pink-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            History Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={selectedTypes.join(',')}
                onValueChange={(value) => setSelectedTypes(value ? value.split(',') : [])}
              >
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="fact_check">Fact Check</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClear}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading timeline...</p>
            </div>
          ) : (
            timeline.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="text-2xl">{getTypeIcon(item.type)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.title}</p>
                            <Badge className={cn('text-xs', getTypeColor(item.type))}>
                              {item.type}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(item.timestamp), 'HH:mm')}
                            </span>
                            {item.metadata?.duration && (
                              <span>Duration: {item.metadata.duration}ms</span>
                            )}
                            {item.metadata?.tags && (
                              <div className="flex gap-1">
                                {item.metadata.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="stats">
          {stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.totalItems}</div>
                    <p className="text-xs text-muted-foreground">Total Items</p>
                  </CardContent>
                </Card>
                {Object.entries(stats.itemsByType).map(([type, count]) => (
                  <Card key={type}>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground capitalize">{type}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Activity Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.itemsByDay.map((day) => (
                      <div key={day.date} className="flex items-center gap-2">
                        <span className="text-sm w-24">{format(new Date(day.date), 'MMM d')}</span>
                        <div className="flex-1 bg-muted rounded-full h-6 relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-primary rounded-full"
                            style={{
                              width: `${(day.count / Math.max(...stats.itemsByDay.map(d => d.count))) * 100}%`
                            }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs">
                            {day.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {stats.topTags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {stats.topTags.map(({ tag, count }) => (
                        <Badge key={tag} variant="secondary">
                          {tag} ({count})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}