import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"
import { Card } from "~components/ui/card"
import { sendToBackground } from "@plasmohq/messaging"

export function DataTab() {
  const [searchTerm, setSearchTerm] = useState("")
  
  const { data: items, refetch } = useQuery({
    queryKey: ["data", searchTerm],
    queryFn: async () => {
      const response = await sendToBackground({
        name: "api",
        body: {
          endpoint: `/data?search=${searchTerm}`,
          method: "GET"
        }
      })
      return response.data
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await sendToBackground({
        name: "api",
        body: {
          endpoint: `/data/${id}`,
          method: "DELETE"
        }
      })
    },
    onSuccess: () => refetch()
  })
  
  return (
    <div className="space-y-4">
      <Input
        placeholder="Search data..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {items?.map((item: any) => (
          <Card key={item.id} className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.url}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}