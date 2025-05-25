import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Trash2 } from "lucide-react"

import { sendToBackground } from "@plasmohq/messaging"

import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { ScrollArea } from "~components/ui/scroll-area"
import { db } from "~core/supabase"

interface SavedItemsProps {
  userId?: string
}

export function SavedItems({ userId }: SavedItemsProps) {
  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["saved-items", userId],
    queryFn: async () => {
      if (!userId) return []

      const response = await sendToBackground({
        name: "supabase",
        body: {
          action: "get-data"
        }
      })

      return response.success ? response.data : []
    },
    enabled: !!userId
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await sendToBackground({
        name: "supabase",
        body: {
          action: "delete-data",
          id
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-items"] })
    }
  })

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Sign in to view saved items</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Items</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {items?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No saved items yet
              </p>
            ) : (
              items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.url}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => window.open(item.url, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
