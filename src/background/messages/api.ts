import type { PlasmoMessaging } from "@plasmohq/messaging"
import { apiClient } from "~core/api"

export type ApiRequest = {
  endpoint: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  data?: any
}

const handler: PlasmoMessaging.MessageHandler<ApiRequest> = async (req, res) => {
  const { endpoint, method, data } = req.body
  
  try {
    const result = await apiClient.request({
      endpoint,
      method,
      data
    })
    res.send({ success: true, data: result })
  } catch (error) {
    res.send({ success: false, error: error.message })
  }
}

export default handler