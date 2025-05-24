import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~components/ui/card"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"
import { sendToBackground } from "@plasmohq/messaging"
import toast from "react-hot-toast"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For personal use",
    features: [
      "Basic features",
      "Up to 100 saved items",
      "7 day history",
      "Basic support"
    ],
    limitations: [
      "No custom shortcuts",
      "No API access",
      "No priority support"
    ],
    priceId: null
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For power users",
    features: [
      "All Free features",
      "Unlimited saved items",
      "90 day history",
      "Custom shortcuts",
      "API access",
      "Priority support"
    ],
    limitations: [],
    priceId: "price_1234567890",
    popular: true
  },
  {
    name: "Premium",
    price: "$19",
    period: "/month",
    description: "For teams and businesses",
    features: [
      "All Pro features",
      "Unlimited history",
      "Team collaboration",
      "Advanced analytics",
      "Custom integrations",
      "24/7 phone support"
    ],
    limitations: [],
    priceId: "price_0987654321"
  }
]

export default function PricingPage() {
  const { user, isAuthenticated } = useSupabaseAuth()
  const [loading, setLoading] = useState<string | null>(null)
  
  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) return
    
    if (!isAuthenticated) {
      toast.error("Please sign in to subscribe")
      chrome.runtime.openOptionsPage()
      return
    }
    
    setLoading(priceId)
    try {
      await sendToBackground({
        name: "stripe",
        body: {
          action: "create-checkout",
          priceId
        }
      })
    } catch (error) {
      toast.error("Failed to start checkout")
      console.error(error)
    } finally {
      setLoading(null)
    }
  }
  
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Unlock powerful features to enhance your browsing experience
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? "border-primary shadow-lg scale-105" : ""}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <div key={limitation} className="flex items-start">
                      <X className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loading !== null || !plan.priceId}
                >
                  {loading === plan.priceId ? "Loading..." : 
                   plan.priceId ? "Subscribe" : "Current Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <Button
            variant="link"
            onClick={async () => {
              await sendToBackground({
                name: "stripe",
                body: { action: "create-portal" }
              })
            }}
          >
            Manage existing subscription
          </Button>
        </div>
      </div>
    </div>
  )
}