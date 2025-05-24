import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("Ping received:", req.body)
  res.send({ message: "pong", timestamp: Date.now() })
}

export default handler