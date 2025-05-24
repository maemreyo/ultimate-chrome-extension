import { loadStripe, type Stripe } from "@stripe/stripe-js"

import { supabase } from "./supabase"

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    )
  }
  return stripePromise
}

export const stripeService = {
  async createCheckoutSession(priceId: string, userId: string) {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) throw new Error("Not authenticated")

    const response = await fetch(
      `${process.env.PLASMO_PUBLIC_API_URL}/api/stripe/create-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl: `${chrome.runtime.getURL("tabs/success.html")}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: chrome.runtime.getURL("tabs/pricing.html")
        })
      }
    )

    if (!response.ok) throw new Error("Failed to create checkout session")

    const data = await response.json()
    return data.sessionId
  },

  async redirectToCheckout(sessionId: string) {
    const stripe = await getStripe()
    if (!stripe) throw new Error("Stripe not loaded")

    const { error } = await stripe.redirectToCheckout({ sessionId })
    if (error) throw error
  },

  async createCustomerPortalSession() {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) throw new Error("Not authenticated")

    const response = await fetch(
      `${process.env.PLASMO_PUBLIC_API_URL}/api/stripe/create-portal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        }
      }
    )

    if (!response.ok) throw new Error("Failed to create portal session")

    const data = await response.json()
    return data.url
  },

  async getSubscriptionStatus() {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) throw new Error("Not authenticated")

    const response = await fetch(
      `${process.env.PLASMO_PUBLIC_API_URL}/api/stripe/subscription-status`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    )

    if (!response.ok) throw new Error("Failed to get subscription status")

    const data = await response.json()
    return data
  }
}
