import { NextApiRequest, NextApiResponse } from "next"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }
  
  const sig = req.headers["stripe-signature"]!
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed")
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      
      // Update user subscription status
      await supabase
        .from("users")
        .update({
          subscription_status: "pro",
          stripe_customer_id: session.customer as string
        })
        .eq("email", session.customer_email!)
      
      break
    }
    
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      
      // Update subscription status
      const status = subscription.status === "active" ? "pro" : "free"
      
      await supabase
        .from("users")
        .update({ subscription_status: status })
        .eq("stripe_customer_id", subscription.customer as string)
      
      break
    }
    
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      
      // Cancel subscription
      await supabase
        .from("users")
        .update({ subscription_status: "free" })
        .eq("stripe_customer_id", subscription.customer as string)
      
      break
    }
  }
  
  res.status(200).json({ received: true })
}