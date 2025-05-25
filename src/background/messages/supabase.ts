import type { PlasmoMessaging } from "@plasmohq/messaging"
import { supabase, db } from "~core/supabase"

export type SupabaseRequest = {
  action: "get-data" | "save-data" | "delete-data"
  table?: string
  data?: any
  id?: string
}

const handler: PlasmoMessaging.MessageHandler<SupabaseRequest> = async (req, res) => {
  const { action, table, data, id } = req.body!
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      res.send({ success: false, error: "Not authenticated" })
      return
    }
    
    switch (action) {
      case "get-data":
        const items = await db.getUserData(session.user.id)
        res.send({ success: true, data: items })
        break
        
      case "save-data":
        const saved = await db.saveUserData({
          ...data,
          user_id: session.user.id
        })
        res.send({ success: true, data: saved })
        break
        
      case "delete-data":
        if (!id) throw new Error("ID required")
        await db.deleteUserData(id)
        res.send({ success: true })
        break
        
      default:
        res.send({ success: false, error: "Invalid action" })
    }
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

export default handler