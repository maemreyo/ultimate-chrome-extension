import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Progress } from "~components/ui/progress"
import { TrendingUp, Clock, Target, Zap } from "lucide-react"
import { sendToBackground } from "@plasmohq/messaging"

export function ProductivityStats() {
  const { data: stats } = useQuery({
    queryKey: ["productivity-stats"],
    queryFn: async () => {
      const response = await sendToBackground({
        name: "api",
        body: {
          endpoint: "/stats/productivity",
          method: "GET"
        }
      })
      return response.data || {
        tasksCompleted: 12,
        tasksTotal: 20,
        focusTime: 145, // minutes
        streak: 5
      }
    }
  })
  
  const completionRate = stats ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Tasks
            </span>
            <span>{stats?.tasksCompleted || 0} / {stats?.tasksTotal || 0}</span>
          </div>
          <Progress value={completionRate} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Focus Time
            </p>
            <p className="text-2xl font-bold">
              {Math.floor((stats?.focusTime || 0) / 60)}h {(stats?.focusTime || 0) % 60}m
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Streak
            </p>
            <p className="text-2xl font-bold">{stats?.streak || 0} days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}