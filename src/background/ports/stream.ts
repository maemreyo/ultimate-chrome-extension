import type { PlasmoMessaging } from "@plasmohq/messaging"

type StreamRequest = {
  action: "subscribe" | "unsubscribe"
  channel: string
}

const handler: PlasmoMessaging.PortHandler<StreamRequest> = async (req, res) => {
  console.log("Stream port connected:", req.body)
  
  const { action, channel } = req.body!
  
  if (action === "subscribe") {
    // Start streaming data
    const interval = setInterval(() => {
      res.send({
        channel,
        data: {
          timestamp: Date.now(),
          value: Math.random()
        }
      })
    }, 1000)
    
    // Cleanup on disconnect
    req.port.onDisconnect.addListener(() => {
      clearInterval(interval)
    })
  }
}

export default handler