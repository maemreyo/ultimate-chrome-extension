import type { PlasmoMessaging } from "@plasmohq/messaging"
import { stripeService } from "~core/stripe"

export type StripeRequest = {
  action: "create-checkout" | "create-portal" | "get-status"
  priceId?: string
}

const handler: PlasmoMessaging.MessageHandler<StripeRequest> = async (req, res) => {
  const { action, priceId } = req.body
  
  try {
    switch (action) {
      case "create-checkout":
        if (!priceId) throw new Error("Price ID required")
        const sessionId = await stripeService.createCheckoutSession(priceId, req.sender.id)
        // Open checkout in new tab
        chrome.tabs.create({
          url: `https://checkout.stripe.com/pay/${sessionId}`
        })
        res.send({ success: true, sessionId })
        break
        
      case "create-portal":
        const portalUrl = await stripeService.createCustomerPortalSession()
        chrome.tabs.create({ url: portalUrl })
        res.send({ success: true, url: portalUrl })
        break
        
      case "get-status":
        const status = await stripeService.getSubscriptionStatus()
        res.send({ success: true, status })
        break
        
      default:
        res.send({ success: false, error: "Invalid action" })
    }
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

export default handler