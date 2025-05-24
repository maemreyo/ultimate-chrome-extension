import { useMessage as usePlasmoMessage } from "@plasmohq/messaging/hook"
import { sendToBackground } from "@plasmohq/messaging"

export function useBackgroundMessage<TReq = any, TRes = any>(
  name: string,
  body?: TReq
) {
  return usePlasmoMessage<TReq, TRes>(async (req, res) => {
    const response = await sendToBackground({
      name,
      body: body || req.body
    })
    res.send(response)
  })
}