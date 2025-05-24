import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Button } from "~components/ui/button"
import { Progress } from "~components/ui/progress"
import { stripeService } from "~core/stripe"
import { sendToBackground } from "@plasmohq/messaging"

export function BillingPanel() {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => stripeService.getSubscriptionStatus()
  })
  
  const usagePercentage = subscription?.usage 
    ? (subscription.usage.current / subscription.usage.limit) * 100
    : 0
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-lg font-medium">{subscription?.plan || "Free"}</span>
                <span className="text-muted-foreground">
                  ${subscription?.price || 0}/month
                </span>
              </div>
              {subscription?.status === "trialing" && (
                <p className="text-sm text-muted-foreground">
                  Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            
            {subscription?.usage && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Used</span>
                  <span>{subscription.usage.current} / {subscription.usage.limit}</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => chrome.tabs.create({ url: "tabs/pricing.html" })}
              >
                Change Plan
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await sendToBackground({
                    name: "stripe",
                    body: { action: "create-portal" }
                  })
                }}
              >
                Manage Billing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}