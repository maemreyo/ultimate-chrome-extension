import type { PlasmoMessaging } from "@plasmohq/messaging"
import { authManager } from "~core/auth"

export type AuthRequest = {
  action: "login" | "logout" | "check"
  credentials?: {
    email: string
    password: string
  }
}

const handler: PlasmoMessaging.MessageHandler<AuthRequest> = async (req, res) => {
  const { action, credentials } = req.body
  
  try {
    switch (action) {
      case "login":
        const user = await authManager.login(credentials!)
        res.send({ success: true, user })
        break
        
      case "logout":
        await authManager.logout()
        res.send({ success: true })
        break
        
      case "check":
        const isAuthenticated = await authManager.isAuthenticated()
        res.send({ success: true, isAuthenticated })
        break
        
      default:
        res.send({ success: false, error: "Invalid action" })
    }
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

export default handler