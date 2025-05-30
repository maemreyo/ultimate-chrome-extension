import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Button } from '~components/ui/button'
import { Badge } from '~components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Progress } from '~components/ui/progress'
import {
  Activity,
  Clock,
  User,
  Monitor,
  LogOut,
  RefreshCw,
  Archive
} from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { SessionManager, Session, SessionActivity } from '../session/session-manager'
import { formatDistanceToNow } from 'date-fns'

export function SessionViewer() {
  const { session, isActive, startSession, endSession, trackActivity } = useSession()
  const [sessionHistory, setSessionHistory] = useState<Session[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  useEffect(() => {
    loadSessionHistory()
    loadStats()
  }, [])

  const loadSessionHistory = async () => {
    const manager = new SessionManager()
    const history = await manager.getSessionHistory(undefined, 10)
    setSessionHistory(history)
  }

  const loadStats = async () => {
    // Calculate session stats
    const manager = new SessionManager()
    const history = await manager.getSessionHistory(undefined, 100)

    const totalDuration = history.reduce((sum, s) => {
      const duration = new Date(s.lastActiveAt).getTime() - new Date(s.startedAt).getTime()
      return sum + duration
    }, 0)

    const avgDuration = history.length > 0 ? totalDuration / history.length : 0

    setStats({
      totalSessions: history.length,
      avgDuration: Math.round(avgDuration / 1000 / 60), // minutes
      totalActivities: history.reduce((sum, s) => sum + s.activities.length, 0)
    })
  }

  const handleStartSession = async () => {
    await startSession(undefined, { source: 'manual' })
    loadSessionHistory()
  }

  const handleEndSession = async () => {
    await endSession('manual')
    loadSessionHistory()
  }

  const formatDuration = (start: Date, end: Date) => {
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(duration / 1000 / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const getActivityIcon = (type: SessionActivity['type']) => {
    const icons = {
      page_view: '👁️',
      action: '🎯',
      api_call: '🔌',
      error: '⚠️'
    }
    return icons[type] || '📌'
  }

  return (
    <div className="space-y-6">
      {/* Current Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Session
            </span>
            {isActive ? (
              <Badge variant="default" className="bg-green-500">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {formatDuration(session.startedAt, session.lastActiveAt)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Session Progress</p>
                {session.expiresAt && (
                  <Progress
                    value={
                      ((new Date().getTime() - new Date(session.startedAt).getTime()) /
                      (new Date(session.expiresAt).getTime() - new Date(session.startedAt).getTime())) * 100
                    }
                    className="h-2"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => trackActivity('action', { type: 'manual_track' })}
                >
                  Track Activity
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndSession}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active session</p>
              <Button onClick={handleStartSession}>
                Start New Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.avgDuration}m</div>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalActivities}</div>
              <p className="text-xs text-muted-foreground">Total Activities</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Session History</span>
            <Button size="sm" variant="ghost" onClick={loadSessionHistory}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-2">
              {sessionHistory.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => setSelectedSession(s)}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(s.startedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {formatDuration(s.startedAt, s.lastActiveAt)} •
                        {s.activities.length} activities
                      </p>
                    </div>
                  </div>
                  {s.device && (
                    <Badge variant="outline">
                      <Monitor className="h-3 w-3 mr-1" />
                      {s.device.screen}
                    </Badge>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="details">
              {selectedSession ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Session Info</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">ID:</span> {selectedSession.id}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>{' '}
                        {formatDuration(selectedSession.startedAt, selectedSession.lastActiveAt)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Device:</span>{' '}
                        {selectedSession.device?.screen}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Activities:</span>{' '}
                        {selectedSession.activities.length}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Activity Timeline</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedSession.activities.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-lg">{getActivityIcon(activity.type)}</span>
                          <div className="flex-1">
                            <p className="font-medium">{activity.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                            {activity.details && (
                              <pre className="text-xs mt-1 p-2 bg-muted rounded">
                                {JSON.stringify(activity.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Select a session to view details
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}