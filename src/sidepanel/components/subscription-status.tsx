import { useQuery } from "@tanstack/react-query"
import { Badge } from "~components/ui/badge"
import { stripeService } from "~core/stripe"

export function SubscriptionStatus() {
  const { data: status } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => stripeService.getSubscriptionStatus(),
    refetchInterval: 60000 // Refresh every minute
  })
  
  const getStatusColor = () => {
    switch (status?.status) {
      case "active": return "bg-green-500"
      case "trialing": return "bg-blue-500"
      case "past_due": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }
  
  return (
    <Badge className={getStatusColor()}>
      {status?.plan || "Free"}
    </Badge>
  )
}